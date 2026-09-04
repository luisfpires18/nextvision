/**
 * POST /api/contact/ — the contact form's endpoint.
 *
 * The ONLY route on this site that is not prerendered. `output: 'static'` plus
 * `prerender = false` is how Astro 7 replaces the removed `hybrid` mode: every other page
 * is a file, and this one is a Worker (CLAUDE.md §10.1).
 *
 * ── The order of the checks is the design ────────────────────────────────────
 * Each one is cheaper than the one after it, and each one refuses before the next has to
 * allocate anything:
 *
 *   1. method        anything but POST is 405, with Allow.
 *   2. origin        a same-site form always sends Origin; a cross-site forgery does too,
 *                    and it does not match. This is the CSRF control.
 *   3. size          Content-Length first (a claim), then the body's real byte length.
 *   4. shape         parse and normalise. No network has happened yet.
 *   5. honeypot      refused without ever reaching validation, so a bot cannot map the
 *                    field rules by filling the trap.
 *   6. Turnstile     verified with Cloudflare, server-side, every time, failing closed.
 *   7. delivery      the provider seam. Unconfigured is 503, not success.
 *
 * ── What this endpoint never does ────────────────────────────────────────────
 * It does not log what anyone typed. It does not store a submission. It does not have a
 * default recipient (decisions D2 and D17 are open). It does not report success unless a
 * provider said the message went, and a provider that is not configured says so rather
 * than agreeing.
 *
 * ── Two answer shapes, one code path ─────────────────────────────────────────
 * Our own JavaScript sets `x-nvf-form: fetch` and gets JSON with an outcome code, which it
 * renders in the reader's own language. A browser that simply submitted the form gets a
 * 303 — to /obrigado/ when accepted, back to the form with `?erro=<code>` when not. The
 * outcome is computed once either way, so the two can never disagree.
 *
 * Authority: docs/ARCHITECTURE.md §7, docs/STATIC_PAGES_ROLLOUT.md §5.
 */

import type { APIRoute } from 'astro';
import {
  CONTACT_ENDPOINT, ERROR_PARAM, FETCH_HEADER, FETCH_HEADER_VALUE, MAX_BODY_BYTES,
  OUTCOME_STATUS, successPath, type Outcome,
} from '../../config/forms.ts';
import { SITE_URL } from '../../config/site.ts';
import { DEFAULT_LOCALE, type Locale } from '../../config/i18n.ts';
import { pagePath } from '../../i18n/routes.ts';
import { parseContact, readBody } from '../../lib/forms/contact.ts';
import { resolveProvider, toMessage } from '../../lib/forms/delivery.ts';
import { turnstileSecret, verifyTurnstile } from '../../lib/forms/turnstile.ts';
import { IS_DEV } from '../../lib/forms/env.ts';

export const prerender = false;

/* ═══════════════════════════════════════════════════════════════ answering ══ */

interface Answer {
  outcome: Outcome;
  /** Which field a reader should be sent back to, when one is at fault. */
  field?: string;
  /** Which adapter answered. Never a credential; safe to return. */
  provider?: string;
}

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  // An endpoint is not a page: never cached, never indexed, never in a sitemap.
  'cache-control': 'no-store',
  'x-robots-tag': 'noindex',
};

/**
 * One answer, rendered for whichever caller asked.
 *
 * The 303 matters: it turns the POST into a GET, so the browser's back button and a
 * reload do not re-submit the form. That is the whole reason the live site's success
 * behaviour was a redirect and not a rendered page, and it is preserved.
 */
function respond(request: Request, answer: Answer, locale: Locale): Response {
  const status = OUTCOME_STATUS[answer.outcome];
  const wantsJson = request.headers.get(FETCH_HEADER) === FETCH_HEADER_VALUE;
  const accepted = answer.outcome === 'accepted';

  if (wantsJson) {
    return new Response(JSON.stringify({
      ok: accepted,
      outcome: answer.outcome,
      ...(answer.field ? { field: answer.field } : {}),
      ...(answer.provider ? { provider: answer.provider } : {}),
      ...(accepted ? { redirect: successPath(locale) } : {}),
    }), { status, headers: jsonHeaders });
  }

  const location = accepted
    ? successPath(locale)
    : `${pagePath('contact', locale)}?${ERROR_PARAM}=${encodeURIComponent(answer.outcome)}#contactar`;

  return new Response(null, {
    status: 303,
    headers: { location, 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  });
}

/* ═══════════════════════════════════════════════════════════════════ CSRF ══ */

/**
 * Origin protection for a same-site form.
 *
 * Every browser sends `Origin` on a cross-origin POST, and every current browser sends it
 * on a same-origin POST too, so a missing Origin is not a browser that forgot — it is not
 * a browser. `Sec-Fetch-Site: same-origin` is accepted as the equivalent statement for the
 * clients that send that instead.
 *
 * The request's OWN origin is the reference, not a hardcoded hostname, so a preview
 * deployment and localhost are both correct without a list to maintain. The canonical site
 * is allowed as well, for the day the Worker sits behind it.
 *
 * Turnstile is the second lock on this door: a token is issued for one site key on one
 * hostname, so a forged post from elsewhere fails verification even if this check somehow
 * passed.
 */
function sameSite(request: Request): boolean {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'same-origin' || fetchSite === 'same-site') return true;

  const origin = request.headers.get('origin');
  if (!origin) return false;

  const allowed = new Set([new URL(request.url).origin, new URL(SITE_URL).origin]);
  try {
    return allowed.has(new URL(origin).origin);
  } catch {
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════════════ POST ══ */

/**
 * The connecting IP, for Turnstile's scoring only.
 *
 * NOT `Astro.clientAddress`: the Cloudflare adapter does not implement it and THROWS when
 * it is read, which is a 500 on every submission — found by running the endpoint rather
 * than by reading about it. Cloudflare puts the address on `CF-Connecting-IP` instead, and
 * on a dev server there is no address at all, which is a fine answer because the parameter
 * is optional.
 *
 * It is passed to Cloudflare and to nobody else. It is never logged, never delivered and
 * never stored.
 */
const connectingIp = (request: Request): string | null =>
  request.headers.get('cf-connecting-ip');

export const POST: APIRoute = async ({ request }) => {
  // 2 · CSRF. Answered as `rejected` — 202, no detail — because an attacker learns
  // nothing from it and a real reader can never reach it.
  if (!sameSite(request)) {
    return respond(request, { outcome: 'rejected' }, DEFAULT_LOCALE);
  }

  // 3 · Size. The header is a claim and is checked first so an oversized body is refused
  // before it is read; the body's real length is checked inside readBody().
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return respond(request, { outcome: 'too-long' }, DEFAULT_LOCALE);
  }

  const body = await readBody(request, MAX_BODY_BYTES);
  if (!body.ok) return respond(request, { outcome: body.outcome }, DEFAULT_LOCALE);

  // 4 · Shape.
  const parsed = parseContact(body.data);
  if (!parsed.ok) {
    // The locale is read from the raw body here, because there is no submission to read it
    // from — a reader who mistyped their address must still land back on their own page.
    const raw = body.data['locale'];
    const locale: Locale = raw === 'en' ? 'en' : DEFAULT_LOCALE;
    return respond(request, { outcome: parsed.outcome, ...(parsed.field ? { field: parsed.field } : {}) }, locale);
  }

  const submission = parsed.submission;
  const { locale } = submission;

  // 5 · The honeypot. Refused, and NOT reported as sent: the field is off-screen, hidden
  // from assistive technology and untabbable, so no reader reaches it deliberately — but
  // an over-eager password manager can, and telling that person their message was
  // delivered when it was not is the one outcome worse than refusing them.
  if (submission.trapped) {
    return respond(request, { outcome: 'rejected' }, locale);
  }

  // 6 · Turnstile, server-side, every time.
  const secret = turnstileSecret();
  if (!secret) {
    // A deployed form that cannot verify must not accept. This is configuration missing,
    // not a reader's mistake, so it is a 503 and it is the operator's problem.
    return respond(request, { outcome: 'not-configured' }, locale);
  }
  if (!submission.token) {
    return respond(request, { outcome: 'captcha-missing' }, locale);
  }
  const challenge = await verifyTurnstile(submission.token, secret, connectingIp(request));
  if (!challenge.ok) {
    // Codes only — they are Cloudflare's, they name the failure and not the reader.
    if (IS_DEV) console.warn('[contact] turnstile refused:', challenge.codes.join(', ') || 'no code');
    return respond(request, { outcome: 'captcha-failed' }, locale);
  }

  // 7 · Delivery. The seam, and the only place a message leaves this Worker.
  const provider = resolveProvider();
  const result = await provider.deliver(toMessage(submission));

  if (!result.ok) {
    const outcome: Outcome = result.reason === 'not-configured' ? 'not-configured' : 'delivery-failed';
    // The provider and the reason, never the message. A 5xx that says nothing is a 5xx
    // nobody can fix.
    console.error(`[contact] delivery failed via ${result.provider}: ${result.detail ?? outcome}`);
    return respond(request, { outcome, provider: result.provider }, locale);
  }

  return respond(request, { outcome: 'accepted', provider: result.provider }, locale);
};

/* ══════════════════════════════════════════════════════════════ everything ══
   else. A form endpoint answers one verb. GET is the one someone will actually try, so it
   gets a real Allow header rather than a 404 that reads like a routing mistake. */

export const ALL: APIRoute = ({ request }) => new Response(
  JSON.stringify({ ok: false, outcome: 'malformed', allow: 'POST', endpoint: CONTACT_ENDPOINT }),
  {
    status: request.method === 'OPTIONS' ? 204 : 405,
    headers: { ...jsonHeaders, allow: 'POST, OPTIONS' },
  },
);
