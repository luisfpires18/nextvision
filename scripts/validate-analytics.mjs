#!/usr/bin/env node
/**
 * validate-analytics.mjs — what the built site measures, and what it must never measure.
 *
 * PHASE 14. Analytics is the one feature whose failure mode is invisible: a page that
 * quietly loads a tracker, or counts every visit twice, looks exactly like a page that
 * does neither. So the guarantees are checked against dist/ rather than trusted.
 *
 *   abandoned      no GA4, Google Ads, gtag, reCAPTCHA, or any other tracker origin, in
 *                  any executable position on any page
 *   configuration  a beacon appears if and only if a token is configured — derived with
 *                  Vite's own env loader, so it is the answer the BUILD had
 *   single         at most ONE beacon per page, identical on every page, in <head>
 *   persistence    it carries the ClientRouter persist key, without which it is loaded a
 *                  second time on the first client-side navigation of every visit
 *   spa            the built tag agrees with the measured decision in config/analytics.ts
 *   internal       the concept prototypes are never measured
 *   forms          the contact form is method="post", so no field value has ever been in
 *                  a URL the beacon can read
 *   isolation      our own JavaScript never references the beacon, and never writes a
 *                  cookie
 *
 * The tracker scan deliberately reads SCRIPTS and resource references, not prose: the
 * preserved privacy policy names Google Analytics and links to Google's own cookie
 * documentation, and that is legal text this project may not touch (CLAUDE.md §2).
 *
 * Exit code 1 on any failure. Nothing here warns: each of these is a defect.
 */

import fs from 'node:fs';
import path from 'node:path';
import { loadEnv } from 'vite';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist', 'client');

const errors = [];
const ok = [];

if (!fs.existsSync(DIST)) {
  console.error('  FAIL  dist/client is missing — run `npm run build` first');
  process.exit(1);
}

/* ------------------------------------------------------- collect the build */

const documents = new Map();
const bundles = new Map();

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    const rel = path.relative(DIST, full).replace(/\\/g, '/');
    if (entry.name.endsWith('.html')) documents.set(`/${rel}`, fs.readFileSync(full, 'utf8'));
    else if (entry.name.endsWith('.js')) bundles.set(`/${rel}`, fs.readFileSync(full, 'utf8'));
  }
};
walk(DIST);

/** Every script element on a page, opening tag and body together. */
const scriptsOf = (html) => [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map((m) => m[0]);

/**
 * Resource references only — `src` on script/iframe/img, `href` on link.
 * `<a href>` is excluded on purpose: the privacy policy links to Google's documentation
 * and that link is preserved copy, not a tracker.
 */
const resourceUrlsOf = (html) => [
  ...[...html.matchAll(/<(?:script|iframe|img)\b[^>]*?\ssrc="([^"]*)"/gi)].map((m) => m[1]),
  ...[...html.matchAll(/<link\b[^>]*?\shref="([^"]*)"/gi)].map((m) => m[1]),
];

/* ══════════════════════════════════════════ 1 · the trackers that were dropped ══ */

/**
 * The live WordPress site loads all of these before any consent. None may survive the
 * rebuild. The two identifiers are the company's own, so they are matched literally.
 */
const FORBIDDEN = [
  ['googletagmanager.com', 'Google Tag Manager / GA4'],
  ['google-analytics.com', 'Google Analytics'],
  ['googleadservices.com', 'Google Ads'],
  ['doubleclick.net', 'DoubleClick'],
  ['googlesyndication.com', 'Google Ads'],
  ['connect.facebook.net', 'Meta Pixel'],
  ['static.hotjar.com', 'Hotjar'],
  ['clarity.ms', 'Microsoft Clarity'],
  ['google.com/recaptcha', 'reCAPTCHA (replaced by Turnstile)'],
  ['GT-NF7D37J8', "the live site's GA4 measurement id"],
  ['AW-17960555673', "the live site's Google Ads conversion id"],
];

/** The call, not the word — so prose that merely names a tool never fails a build. */
const FORBIDDEN_CALLS = /\b(?:gtag|fbq|_gaq|dataLayer\.push)\s*[(.]/;

let tracked = 0;
for (const [route, html] of documents) {
  const scripts = scriptsOf(html);
  const surfaces = [...scripts, ...resourceUrlsOf(html)].join('\n');
  for (const [needle, what] of FORBIDDEN) {
    if (surfaces.includes(needle)) {
      errors.push(`trackers: ${route} loads ${what} (${needle})`);
      tracked += 1;
    }
  }
  if (FORBIDDEN_CALLS.test(scripts.join('\n'))) {
    errors.push(`trackers: ${route} calls a Google/Meta tag function`);
    tracked += 1;
  }
}
for (const [file, js] of bundles) {
  for (const [needle, what] of FORBIDDEN) {
    if (js.includes(needle)) {
      errors.push(`trackers: ${file} references ${what} (${needle})`);
      tracked += 1;
    }
  }
}
if (!tracked) {
  ok.push(
    `trackers: none of ${FORBIDDEN.length} abandoned trackers appears in `
    + `${documents.size} pages or ${bundles.size} bundles`,
  );
}

/* ══════════════════════════════════════════════════ 2 · configured, or absent ══ */

/**
 * The same loader astro.config.mjs uses, for the same reason: reading `process.env` alone
 * would miss a token set in `.env` and declare a correctly-configured build broken.
 */
const env = loadEnv('production', ROOT, 'PUBLIC_');
const token = (env['PUBLIC_ANALYTICS_TOKEN'] ?? '').trim();
const configured = token !== '';

const isConcept = (route) => route.startsWith('/__concepts');

const withBeacon = [];
const beaconTags = new Set();
for (const [route, html] of documents) {
  const found = [...html.matchAll(/<script\b[^>]*\bdata-cf-beacon=[^>]*>/gi)].map((m) => m[0]);
  if (found.length > 1) {
    errors.push(`beacon: ${route} carries ${found.length} beacons — one page view counted ${found.length} times`);
  }
  if (found.length) {
    withBeacon.push(route);
    beaconTags.add(found[0]);
    const headEnd = html.search(/<\/head>/i);
    if (headEnd === -1 || !html.slice(0, headEnd).includes(found[0])) {
      errors.push(`beacon: ${route} places the beacon outside <head>`);
    }
  }
}

const measurable = [...documents.keys()].filter((r) => !isConcept(r));
const conceptsMeasured = withBeacon.filter(isConcept);
/* So the summary line below can only be printed when NOTHING about the beacon failed —
   an `ok` that says "persisted" beside a FAIL that says it is not is worse than silence. */
const errorsBeforeBeacon = errors.length;

if (!configured) {
  if (withBeacon.length) {
    errors.push(`beacon: no PUBLIC_ANALYTICS_TOKEN is configured, but ${withBeacon.length} page(s) load a beacon`);
  } else {
    ok.push(`beacon: no token configured, and none of ${documents.size} pages loads one`);
  }
} else {
  const missing = measurable.filter((r) => !withBeacon.includes(r));
  if (missing.length) {
    errors.push(`beacon: a token is configured but ${missing.length} page(s) carry none, e.g. ${missing[0]}`);
  }
  if (conceptsMeasured.length) {
    errors.push(`beacon: ${conceptsMeasured.length} internal concept page(s) are measured, e.g. ${conceptsMeasured[0]}`);
  }
  if (beaconTags.size > 1) {
    errors.push(
      `beacon: ${beaconTags.size} different beacon tags across the site — it must be `
      + 'byte-identical, or ClientRouter re-executes it on navigation',
    );
  }

  const [rawTag = ''] = beaconTags;
  /* The config rides in an HTML attribute, so its quotes are entity-escaped in the file
     and un-escaped again by the browser. Decode once and assert against what the beacon
     will actually read, rather than against the file's spelling of it. */
  const tag = rawTag.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  if (!tag) {
    errors.push('beacon: a token is configured and no page carries a beacon at all');
  } else {
    if (!tag.includes('data-astro-transition-persist=')) {
      errors.push(
        'beacon: no data-astro-transition-persist — ClientRouter tears the beacon down and '
        + 're-executes it on the first client-side navigation, double-counting that page view',
      );
    }
    /* The SPA setting is a DECISION with a measurement behind it (src/config/analytics.ts),
       not a constant this script gets to prefer. What is checked is that the built tag
       says what the config declares — the two drifting apart is how a site quietly starts
       counting every page three times, or stops counting navigation at all. */
    const declaredSpa = /export const ANALYTICS_SPA = (true|false);/
      .exec(fs.readFileSync(path.join(ROOT, 'src', 'config', 'analytics.ts'), 'utf8'))?.[1];
    if (!declaredSpa) {
      errors.push('beacon: src/config/analytics.ts no longer declares ANALYTICS_SPA');
    } else if (!new RegExp(`"spa"\\s*:\\s*${declaredSpa}`).test(tag)) {
      errors.push(`beacon: the built tag disagrees with ANALYTICS_SPA = ${declaredSpa} in src/config/analytics.ts`);
    }
    if (!/"token"\s*:\s*"[A-Za-z0-9]{8,64}"/.test(tag)) {
      errors.push('beacon: the beacon carries no usable token');
    }
    if (!/\sdefer[\s>]/.test(tag)) {
      errors.push('beacon: not deferred — analytics must never be on the critical path');
    }
    if (errors.length === errorsBeforeBeacon) {
      ok.push(
        `beacon: one identical, deferred, persisted beacon on ${withBeacon.length} pages, `
        + `spa=${declaredSpa} as declared; 0 of ${documents.size - measurable.length} `
        + 'concept pages measured',
      );
    }
  }
}

/* ═══════════════════════════════════════════════════════ 3 · form privacy ══ */

/**
 * The beacon reads the URL. It can therefore never see a form value, PROVIDED no form
 * value ever reaches a URL — which is what `method="post"` guarantees. A form that
 * regressed to GET would put a visitor's name, email, phone and message into the address
 * bar, the referrer and every analytics record at once.
 */
const contactPages = [...documents].filter(([r]) => /^\/(?:contactos|en\/contact)\/index\.html$/.test(r));
if (contactPages.length !== 2) {
  errors.push(`forms: expected 2 contact pages, found ${contactPages.length}`);
} else {
  let posts = 0;
  for (const [route, html] of contactPages) {
    const form = html.match(/<form\b[^>]*>/i)?.[0] ?? '';
    if (/method="post"/i.test(form)) posts += 1;
    else errors.push(`forms: ${route} does not post — field values would travel in the URL`);
    if (/\?[^"'\s]*(?:nome|mensagem|telefone|cf-turnstile-response)=/.test(html)) {
      errors.push(`forms: ${route} emits a URL carrying a form field name as a query parameter`);
    }
  }
  if (posts === 2) ok.push('forms: both contact forms post; no field value can reach a URL, a referrer or a beacon');
}

/* ══════════════════════════════════════════════════════════ 4 · isolation ══ */

/**
 * Our JavaScript and the beacon must not know about each other. If our code ever named
 * the beacon it could feed it something; if it wrote a cookie the cookieless claim would
 * stop being true regardless of what Cloudflare does.
 */
let touching = 0;
for (const [file, js] of bundles) {
  if (/cloudflareinsights|cf-beacon/i.test(js)) {
    errors.push(`isolation: ${file} references the analytics beacon`);
    touching += 1;
  }
  if (/document\s*\.\s*cookie/.test(js)) {
    errors.push(`isolation: ${file} reads or writes document.cookie — this site sets no cookies`);
    touching += 1;
  }
}
if (!touching) {
  ok.push(`isolation: ${bundles.size} bundles, none referencing the beacon, none touching document.cookie`);
}

/* ---------------------------------------------------------------- report */

for (const o of ok) console.log(`  ok    ${o}`);
for (const e of errors) console.error(`  FAIL  ${e}`);
console.log(`\n${ok.length} ok, ${errors.length} errors`);
process.exit(errors.length ? 1 : 0);
