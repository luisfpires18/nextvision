/**
 * The contact form's contract — one declaration, read by both sides.
 *
 * The component renders from this, the endpoint validates against it, and the local test
 * runner drives it. A limit that existed in only one of those three places would be a
 * limit the other two disagree with, which is how a form starts accepting what it says it
 * rejects.
 *
 * Nothing here is a secret and nothing here is copy. Field LABELS are preserved live copy
 * and live in src/lib/static-pages.ts; field NAMES are the wire format and live here.
 *
 * Authority: docs/ARCHITECTURE.md §7, docs/STATIC_PAGES_ROLLOUT.md §5.
 */

import { LOCALES, type Locale } from './i18n.ts';
import { pagePath } from '../i18n/routes.ts';

/* ═══════════════════════════════════════════════════════════════ the route ══ */

/**
 * `trailingSlash: 'always'` applies to endpoints whose route carries no file extension
 * (astro/dist/core/routing/create-manifest.js `trailingSlashForPath`), so the route that
 * src/pages/api/contact.ts actually answers on is the slashed one. Posting to the
 * unslashed form works — it 308s, which preserves the method and the body — but it costs
 * a round trip for nothing, so the form is pointed at the real URL.
 */
export const CONTACT_ENDPOINT = '/api/contact/';

/** Where a genuinely accepted submission lands, per locale. Never a frontend guess. */
export const successPath = (locale: Locale): string => pagePath('thank-you', locale);

/**
 * The header our own JavaScript sets on its `fetch`.
 *
 * It is not authentication and is not treated as any — CSRF protection is the Origin
 * check plus Turnstile (src/pages/api/contact.ts). This only tells the endpoint which
 * shape of answer the caller can use: JSON for the enhanced path, a 303 for a browser
 * that navigated.
 */
export const FETCH_HEADER = 'x-nvf-form';
export const FETCH_HEADER_VALUE = 'fetch';

/**
 * The query parameter a refused NON-script submission comes back on.
 *
 * It lives here rather than in the endpoint because the component reads it too, and a
 * component that imported the endpoint to learn one string would drag the delivery
 * adapters and the environment reader into the page bundle.
 */
export const ERROR_PARAM = 'erro';

/* ═════════════════════════════════════════════════════════════════ the wire ══ */

/**
 * Field names, exactly as the live Elementor form published them, and exactly as the
 * markup has carried them since Phase 10. Renaming one is a migration, not a tidy-up.
 */
export const FIELD = {
  name: 'nome',
  email: 'email',
  phone: 'telefone',
  message: 'mensagem',
  consent: 'consentimento',
  /** The live form's hidden text input. A honeypot only works if it looks like a field. */
  honeypot: 'empresa',
  /** Which language the reader was reading. Decides the success destination only. */
  locale: 'locale',
} as const;

/** Cloudflare Turnstile's own field name. Fixed by the widget, not chosen by us. */
export const TURNSTILE_FIELD = 'cf-turnstile-response';

/**
 * Whether the GDPR consent checkbox must be ticked.
 *
 * **DECISION D9 IS STILL OPEN.** The live form does not require it, the architecture
 * recommends requiring it, and making a legal obligation stricter than the one the owners
 * published is the owners' call rather than ours (CLAUDE.md §8). So the answer is
 * preserved, in one place, and turning it on is this boolean plus nothing else — the
 * schema, the markup's `required` attribute and the error message all read it.
 */
export const CONSENT_REQUIRED: boolean = false;

/* ══════════════════════════════════════════════════════════════════ limits ══ */

/**
 * Per-field caps, applied AFTER trimming.
 *
 * These are refusal thresholds, not guidance: nothing in the UI counts characters, and a
 * human writing a real enquiry cannot reach any of them. They exist so that a body which
 * passed the size check cannot still carry four kilobytes in the `nome` field.
 */
export const LIMITS = {
  name: 200,
  email: 254, // RFC 5321 §4.5.3.1 — the longest address a mail server must accept.
  phone: 40,
  message: 5_000,
  /** A Turnstile token is ~600–2000 bytes today; this is headroom, not a spec. */
  token: 4_096,
} as const;

/**
 * The largest request body the endpoint will read, before parsing.
 *
 * Sized from the fields above plus the token plus urlencoding overhead, then rounded up
 * once. Anything larger is refused with 413 without being read into memory, because the
 * alternative — parsing first and validating after — is a way to be made to allocate.
 */
export const MAX_BODY_BYTES = 16 * 1024;

/* ══════════════════════════════════════════════════════════════ Turnstile ══ */

/**
 * Cloudflare's OFFICIAL, PUBLIC test credentials.
 *
 * These are documented by Cloudflare for exactly this purpose and are not secrets: the
 * site key always issues a token and the secret key always accepts one. They are the
 * default so that a fresh checkout has a working, verifying form with no account, and so
 * that a developer never needs a production secret on their machine.
 *
 * The FAILING pair is what `npm run test:forms` uses to prove that a rejected challenge is
 * actually rejected — a captcha nobody has watched fail is a captcha nobody has tested.
 *
 * https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
export const TURNSTILE_TEST = {
  sitePass: '1x00000000000000000000AA',
  siteFail: '2x00000000000000000000AB',
  secretPass: '1x0000000000000000000000000000000AA',
  secretFail: '2x0000000000000000000000000000000AA',
  /** Cloudflare's own always-fails secret answers with this code. */
  failCode: 'invalid-input-response',
} as const;

export const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
export const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

/**
 * The site key the widget renders with.
 *
 * PUBLIC by definition — it is in the HTML of every contact page, and Turnstile's model
 * is that it is worthless without the secret and without the hostname it was issued for.
 * Unset means the test key, which means a checkout with no configuration still renders a
 * widget that produces a token the local endpoint accepts.
 *
 * Production sets `PUBLIC_TURNSTILE_SITE_KEY` at build time. The SECRET is never here and
 * never reaches the browser: it is read at request time from the Worker's environment
 * (src/lib/forms/env.ts).
 */
export const TURNSTILE_SITE_KEY =
  import.meta.env['PUBLIC_TURNSTILE_SITE_KEY'] || TURNSTILE_TEST.sitePass;

/** True when the page is rendering Cloudflare's test widget rather than a real one. */
export const TURNSTILE_IS_TEST_KEY =
  TURNSTILE_SITE_KEY === TURNSTILE_TEST.sitePass || TURNSTILE_SITE_KEY === TURNSTILE_TEST.siteFail;

/** Turnstile's own language codes for the two locales this site publishes. */
export const TURNSTILE_LANG: Record<Locale, string> = { pt: 'pt-br', en: 'en' };

/* ══════════════════════════════════════════════════════ the answer shape ══ */

/**
 * Every outcome the endpoint can report, as a closed set.
 *
 * The wire carries the CODE, never a message: the browser looks the code up in its own
 * locale (src/i18n/*.ts), so an English reader gets an English failure without the server
 * knowing anything about language. Codes are also what `npm run test:forms` asserts on,
 * which is why they are stable identifiers rather than prose.
 */
export const OUTCOME = [
  'accepted',
  'invalid-email',
  'missing-email',
  'consent-required',
  'too-long',
  'malformed',
  'captcha-missing',
  'captcha-failed',
  'rejected',
  'not-configured',
  'delivery-failed',
] as const;

export type Outcome = (typeof OUTCOME)[number];

/** The HTTP status each outcome answers with. */
export const OUTCOME_STATUS: Record<Outcome, number> = {
  accepted: 200,
  'invalid-email': 422,
  'missing-email': 422,
  'consent-required': 422,
  'too-long': 413,
  malformed: 400,
  'captcha-missing': 400,
  'captcha-failed': 403,
  /* The honeypot and a failed origin check answer 202 and go nowhere: a bot that is told
     it was refused learns what to change, and a bot that is told it succeeded stops. No
     human can reach this state — the field is off-screen and hidden from assistive
     technology, and a same-site form always sends its Origin. */
  rejected: 202,
  'not-configured': 503,
  'delivery-failed': 502,
};

/** Whether an outcome means the message is genuinely on its way. */
export const isAccepted = (outcome: Outcome): boolean => outcome === 'accepted';

/** Guard for reading a locale back off the wire. */
export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
