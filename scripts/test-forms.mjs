#!/usr/bin/env node
/**
 * test-forms.mjs — the contact endpoint, exercised for real.
 *
 * PHASE 13. `npm run verify` proves the FORM is on the page and points at the endpoint. It
 * cannot prove the endpoint refuses what it says it refuses, because the endpoint is the
 * one route on this site that is not a file. This drives it over HTTP, the way a browser
 * does, and asserts the outcome code and the status of every case.
 *
 * ── Run it ───────────────────────────────────────────────────────────────────
 *     npm run dev            (terminal 1)
 *     npm run test:forms     (terminal 2)
 *
 * NO PRODUCTION SECRET IS EVER NEEDED. With nothing configured, `astro dev` verifies
 * against Cloudflare's OFFICIAL always-passes Turnstile test secret and delivers to the
 * development sink, so the whole happy path runs on a fresh checkout.
 *
 * ── Three server modes, because three branches cannot coexist ────────────────
 * A server whose captcha always passes cannot demonstrate a refused captcha, and a server
 * that delivers cannot demonstrate an unconfigured provider. So the runner PROBES the
 * server, discovers which branch it is able to exercise, asserts that branch fully, and
 * prints the exact one-line change that reaches the other two. Nothing is silently
 * skipped, and nothing is asserted against a server that cannot produce it.
 *
 *   MODE            .dev.vars (project root, gitignored)      proves
 *   delivering      (absent — the default)                    accepted, both locales,
 *                                                             the 303, the dev sink
 *   captcha-fails   TURNSTILE_SECRET_KEY="2x00…0AA"           403 captcha-failed
 *   unconfigured    CONTACT_PROVIDER="nonesuch"               503 not-configured
 *
 * Restart the dev server after editing `.dev.vars`. The validation, honeypot, size,
 * method and CSRF cases run in EVERY mode, because all of them are decided before the
 * captcha and the provider are ever consulted.
 *
 * Point at another host with `--base https://host`.
 *
 * Exit code 1 on any failed assertion. Nothing here warns.
 */

import process from 'node:process';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at === -1 ? fallback : args[at + 1];
};

const BASE = (flag('base', 'http://localhost:4321')).replace(/\/+$/, '');
const ENDPOINT = `${BASE}/api/contact/`;

/* A well-formed token that the always-passes test secret accepts, and one that any secret
   able to refuse will refuse. Neither is a credential.
   https://developers.cloudflare.com/turnstile/troubleshooting/testing/ */
const GOOD_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';
const BAD_TOKEN = 'this-token-will-not-verify';
const FAIL_SECRET = '2x0000000000000000000000000000000AA';

const results = [];
let failures = 0;

function check(label, condition, detail) {
  results.push({ label, ok: Boolean(condition), detail });
  if (!condition) failures += 1;
}

function note(label, detail) {
  results.push({ label, ok: null, detail });
}

/** One HTTP call, with the headers a same-site browser submission actually sends. */
async function post(fields, options = {}) {
  const body = new URLSearchParams(fields).toString();
  const headers = {
    'content-type': 'application/x-www-form-urlencoded',
    'x-nvf-form': 'fetch',
    ...(options.origin === null ? {} : { origin: options.origin ?? BASE }),
    ...(options.headers ?? {}),
  };
  const response = await fetch(ENDPOINT, {
    method: options.method ?? 'POST',
    headers,
    body: options.method === 'GET' ? undefined : body,
    redirect: 'manual',
  });
  const text = await response.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* a 303 carries no body */ }
  return { status: response.status, json, location: response.headers.get('location'), headers: response.headers };
}

/** A submission that should pass everything. No real personal data anywhere in it. */
const valid = () => ({
  nome: 'Teste Local',
  email: 'teste@example.com',
  telefone: '+351 000 000 000',
  mensagem: 'Mensagem de teste automatizada.',
  consentimento: '1',
  empresa: '',
  locale: 'pt',
  'cf-turnstile-response': GOOD_TOKEN,
});

async function run() {
  /* Reachability first, so a dead dev server reads as a dead dev server rather than as
     twenty mysterious assertion failures. */
  try {
    await fetch(BASE, { method: 'GET' });
  } catch {
    console.error(`  FAIL  nothing is answering at ${BASE} — start it with \`npm run dev\``);
    process.exit(1);
  }

  /* ───────────────────────────────────────────── what can THIS server prove? */

  const probe = await post(valid());
  const outcome = probe.json?.outcome;
  const mode = outcome === 'accepted' ? 'delivering'
    : outcome === 'captcha-failed' ? 'captcha-fails'
      : outcome === 'not-configured' ? 'unconfigured'
        : 'unknown';

  if (mode === 'unknown') {
    console.error(`  FAIL  a valid submission answered ${probe.status} / ${outcome} — not a mode this runner recognises`);
    console.error(`        ${JSON.stringify(probe.json)}`);
    process.exit(1);
  }

  /* ══════════════════════════════════════════════ always, in every mode ══
     Everything decided BEFORE the captcha and the provider are consulted. */

  /* validation — an invalid address */
  {
    const r = await post({ ...valid(), email: 'not-an-address' });
    check('an invalid email is 422 invalid-email', r.status === 422 && r.json?.outcome === 'invalid-email', `status ${r.status}, outcome ${r.json?.outcome}`);
    check('the failing field is named back', r.json?.field === 'email', String(r.json?.field));
  }

  /* validation — the one required field, missing */
  {
    const fields = valid();
    fields.email = '';
    const r = await post(fields);
    check('a missing email is 422 missing-email', r.status === 422 && r.json?.outcome === 'missing-email', `status ${r.status}, outcome ${r.json?.outcome}`);
  }

  /* validation — and NOTHING else is required. Decision D9, audit §3.6. */
  {
    const r = await post({ email: 'teste@example.com', locale: 'pt', 'cf-turnstile-response': GOOD_TOKEN });
    const rejected = r.json?.outcome === 'missing-email' || r.json?.outcome === 'consent-required';
    check('email alone passes validation, exactly as the live form published it', !rejected, `outcome ${r.json?.outcome}`);
  }

  /* the honeypot — refused, and never reported as delivered */
  {
    const r = await post({ ...valid(), empresa: 'ACME Lda' });
    check('a filled honeypot is refused', r.json?.outcome === 'rejected', `status ${r.status}, outcome ${r.json?.outcome}`);
    check('a filled honeypot is never reported as delivered', r.json?.ok !== true, JSON.stringify(r.json));
    check('a filled honeypot is not handed the success path', r.json?.redirect === undefined, String(r.json?.redirect));
  }

  /* a missing captcha token — refused before Cloudflare is even asked */
  {
    const fields = valid();
    delete fields['cf-turnstile-response'];
    const r = await post(fields);
    check('a missing captcha token is 400 captcha-missing', r.status === 400 && r.json?.outcome === 'captcha-missing', `status ${r.status}, outcome ${r.json?.outcome}`);
  }

  /* size */
  {
    const r = await post({ ...valid(), mensagem: 'x'.repeat(32_000) });
    check('an oversized body is 413 too-long', r.status === 413 && r.json?.outcome === 'too-long', `status ${r.status}, outcome ${r.json?.outcome}`);
  }

  /* method */
  {
    const r = await post({}, { method: 'GET' });
    check('GET is 405', r.status === 405, `status ${r.status}`);
    check('405 says what is allowed', (r.headers.get('allow') ?? '').includes('POST'), r.headers.get('allow'));
  }

  /* CSRF.
     Asserted as "not accepted" rather than as one exact code: in `astro dev` the dev
     server's own cross-origin guard answers 403 BEFORE the endpoint is reached, while in
     production the endpoint answers 202 `rejected`. Both are refusals, and pinning the
     test to one of them would make it pass in only one of the two places it must hold. */
  const refused = (r) => r.status !== 200 && r.json?.outcome !== 'accepted' && r.json?.ok !== true;
  {
    const r = await post(valid(), { origin: 'https://evil.example', headers: { 'sec-fetch-site': 'cross-site' } });
    check('a cross-origin POST is refused', refused(r), `status ${r.status}, outcome ${r.json?.outcome}`);
  }
  {
    const r = await post(valid(), { origin: null, headers: { 'sec-fetch-site': 'none' } });
    check('a POST with no Origin is refused', refused(r), `status ${r.status}, outcome ${r.json?.outcome}`);
  }

  /* the non-script path — no `x-nvf-form`, so a 303 rather than JSON */
  {
    const r = await post({ ...valid(), email: 'nope' }, { headers: { 'x-nvf-form': '' } });
    check('a native submission gets a 303', r.status === 303, `status ${r.status}`);
    check('a native failure returns to the form with a code', (r.location ?? '').startsWith('/contactos/?erro=invalid-email'), String(r.location));
  }

  /* an endpoint is not a page */
  check('the endpoint is never cached', /no-store/.test(probe.headers.get('cache-control') ?? ''), probe.headers.get('cache-control'));
  check('the endpoint is never indexed', probe.headers.get('x-robots-tag') === 'noindex', probe.headers.get('x-robots-tag'));

  /* ═════════════════════════════════════════════ the mode-specific branch ══ */

  if (mode === 'delivering') {
    check('a valid submission is accepted', probe.status === 200 && probe.json?.ok === true, `status ${probe.status}`);
    check('an accepted submission is told where to go', probe.json?.redirect === '/obrigado/', String(probe.json?.redirect));
    check('the endpoint names which provider answered', typeof probe.json?.provider === 'string', String(probe.json?.provider));
    {
      const r = await post({ ...valid(), locale: 'en' });
      check('an English submission lands on /en/thank-you/', r.json?.redirect === '/en/thank-you/', String(r.json?.redirect));
    }
    {
      const r = await post(valid(), { headers: { 'x-nvf-form': '' } });
      check('a native success 303s to /obrigado/', r.status === 303 && r.location === '/obrigado/', `status ${r.status}, ${r.location}`);
    }
    {
      const r = await post({ ...valid(), 'cf-turnstile-response': BAD_TOKEN });
      check('this mode cannot refuse a captcha, and does not pretend to', r.json?.outcome === 'accepted', `outcome ${r.json?.outcome}`);
    }
    note('failed Turnstile', `not exercised in this mode — put TURNSTILE_SECRET_KEY="${FAIL_SECRET}" in .dev.vars and restart the dev server`);
    note('provider unavailable', 'not exercised in this mode — put CONTACT_PROVIDER="nonesuch" in .dev.vars and restart the dev server');
  }

  if (mode === 'captcha-fails') {
    check('a refused challenge is 403 captcha-failed', probe.status === 403 && probe.json?.outcome === 'captcha-failed', `status ${probe.status}, outcome ${probe.json?.outcome}`);
    check('a refused challenge is never delivered', probe.json?.ok !== true, JSON.stringify(probe.json));
    check('a refused challenge is not handed the success path', probe.json?.redirect === undefined, String(probe.json?.redirect));
    {
      const r = await post(valid(), { headers: { 'x-nvf-form': '' } });
      check('a refused challenge never 303s to /obrigado/', r.location !== '/obrigado/', String(r.location));
    }
    note('accepted submission', 'not exercised in this mode — remove .dev.vars and restart the dev server');
    note('provider unavailable', 'not exercised in this mode — CONTACT_PROVIDER="nonesuch" alone in .dev.vars, and restart');
  }

  if (mode === 'unconfigured') {
    check('an unconfigured provider is 503 not-configured', probe.status === 503 && probe.json?.outcome === 'not-configured', `status ${probe.status}, outcome ${probe.json?.outcome}`);
    check('an unconfigured provider never reports success', probe.json?.ok !== true, JSON.stringify(probe.json));
    check('an unconfigured provider is not handed the success path', probe.json?.redirect === undefined, String(probe.json?.redirect));
    {
      const r = await post(valid(), { headers: { 'x-nvf-form': '' } });
      check('an unconfigured provider never 303s to /obrigado/', r.location !== '/obrigado/', String(r.location));
      check('an unconfigured provider sends the reader back to the form', (r.location ?? '').startsWith('/contactos/?erro=not-configured'), String(r.location));
    }
    note('accepted submission', 'not exercised in this mode — remove .dev.vars and restart the dev server');
    note('failed Turnstile', `not exercised in this mode — TURNSTILE_SECRET_KEY="${FAIL_SECRET}" alone in .dev.vars, and restart`);
  }

  /* ───────────────────────────────────────────────────────────────── report */

  console.log(`\n  ${ENDPOINT}   mode: ${mode}\n`);
  for (const r of results) {
    const mark = r.ok === null ? '  SKIP' : r.ok ? '    ok' : '  FAIL';
    console.log(`${mark}  ${r.label}${r.detail && r.ok !== true ? `  — ${r.detail}` : ''}`);
  }

  const passed = results.filter((r) => r.ok === true).length;
  const skipped = results.filter((r) => r.ok === null).length;
  console.log(`\n  ${passed} passed, ${failures} failed, ${skipped} not exercised in this mode`);
  process.exit(failures ? 1 : 0);
}

run().catch((error) => {
  console.error(`  FAIL  ${error.message}`);
  process.exit(1);
});
