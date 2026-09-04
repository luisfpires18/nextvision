/**
 * Analytics — one declaration, read by the shell and by the validator.
 *
 * **Cloudflare Web Analytics, and nothing else.** Cookieless, no client-side identifier,
 * no cross-site profile, one external script. GA4 (`GT-NF7D37J8`) and Google Ads
 * (`AW-17960555673`) — which the live WordPress site loads before any consent — are NOT
 * carried over, and `npm run validate:analytics` fails the build if either reappears.
 * Decision **D19/D8** is recorded as the owners' to reverse (docs/BLOCKED_TODOS.md); if
 * they keep the Ads tag, a consent banner becomes mandatory and this file is not the
 * change that implements it.
 *
 * ── The gate ─────────────────────────────────────────────────────────────────
 * Nothing is emitted unless a token is CONFIGURED, and configuration alone is not
 * enough: `astro dev` and `npm run test:forms` never load a beacon, because a developer's
 * page views are not data and a test run that reports itself is a test run that lies.
 * `PUBLIC_ANALYTICS_IN_DEV=true` is the deliberate escape hatch for verifying the
 * integration locally.
 *
 * ── Why the token is public ──────────────────────────────────────────────────
 * It is printed in the HTML of every page by definition — it identifies the SITE, not an
 * account, and it authorises nothing. It is read at BUILD time, so it is a build variable
 * rather than a Worker secret, exactly like `PUBLIC_TURNSTILE_SITE_KEY`.
 *
 * Authority: docs/ARCHITECTURE.md §8.
 */

/* ═══════════════════════════════════════════════════════════════ the origins ══ */

/**
 * The two external origins analytics introduces, named once.
 *
 * They are here rather than inline in the component because §9's future CSP needs the
 * exact strings, and a CSP written from memory is a CSP that blocks the thing it was
 * written for. Nothing sets a header today.
 *
 *   script-src   https://static.cloudflareinsights.com
 *   connect-src  https://cloudflareinsights.com   (manual embed posts to /cdn-cgi/rum
 *                there; a site proxied by Cloudflare reports to 'self' instead)
 */
export const ANALYTICS_SCRIPT_ORIGIN = 'https://static.cloudflareinsights.com';
export const ANALYTICS_CONNECT_ORIGIN = 'https://cloudflareinsights.com';
export const ANALYTICS_SCRIPT_URL = `${ANALYTICS_SCRIPT_ORIGIN}/beacon.min.js`;

/* ═════════════════════════════════════════════════════════════════ the token ══ */

const RAW_TOKEN = (import.meta.env['PUBLIC_ANALYTICS_TOKEN'] ?? '').trim();

/**
 * The token is interpolated into a single-quoted HTML attribute holding JSON, so a value
 * carrying a quote, a backslash or an angle bracket would not be a broken beacon — it
 * would be markup injection from a build variable. Cloudflare issues an alphanumeric
 * identifier; anything else is a mistake, and a loud build failure is the cheapest place
 * to find it.
 */
if (RAW_TOKEN && !/^[A-Za-z0-9]{8,64}$/.test(RAW_TOKEN)) {
  throw new Error(
    'PUBLIC_ANALYTICS_TOKEN is not a Cloudflare Web Analytics site token '
    + '(expected 8-64 alphanumeric characters). Copy the `token` value out of the JS '
    + 'snippet under Web Analytics -> Manage site, not the whole snippet.',
  );
}

export const ANALYTICS_TOKEN = RAW_TOKEN;

/* ══════════════════════════════════════════════════════════════════ the gate ══ */

/** Opt-in for local verification. Never true in a production build's environment. */
const IN_DEV_OVERRIDE = import.meta.env['PUBLIC_ANALYTICS_IN_DEV'] === 'true';

/**
 * `import.meta.env.PROD` is true for `astro build` and false for `astro dev`, which is
 * exactly the line we want: the beacon ships with the artefact and never with the
 * development server the test runner drives.
 */
export const ANALYTICS_ENABLED: boolean =
  ANALYTICS_TOKEN !== '' && (import.meta.env.PROD || IN_DEV_OVERRIDE);

/* ═══════════════════════════════════════════════════════════ the beacon config ══ */

/**
 * Whether Cloudflare's beacon reports client-side route changes. **MEASURED, not assumed.**
 *
 * This site navigates with Astro's ClientRouter, so after the first document every page
 * view is a `history` call and a DOM swap. Cloudflare's beacon watches for exactly that —
 * via the Soft Navigations API, the Navigation API, or by patching `pushState` — so on
 * paper `spa: true` is the setting this site wants.
 *
 * It is not, and the reason was found by counting the beacon's own reports in a browser
 * (docs/ARCHITECTURE.md §8.2). ONE ClientRouter navigation makes THREE `history` calls:
 *
 *     replaceState(state, '', undefined)   Astro saving the scroll position
 *     replaceState(state, '', undefined)   Astro saving it again, after the swap
 *     pushState(state, '', '/portfolio/')  the navigation itself
 *
 * The first two do not change the URL — they only stash scroll offsets in `history.state`
 * — but the Navigation API announces them anyway, and beacon.min.js 2026.9.1 reports each
 * one as a fresh page load, with its own `pageloadId`, for the URL being LEFT. Measured on
 * the built site: `/` -> `/portfolio/` produced three reports, two of them for `/`.
 *
 * So the two available settings are a choice between two different wrong numbers:
 *
 *     spa: true    every page is counted about three times
 *     spa: false   only real document loads are counted; client-side navigations are
 *                  invisible, so a visit reads as one page view
 *
 * We ship `false`. Under-counting is a limitation that can be stated; over-counting is a
 * number that looks like data and is not, and this project does not publish results it
 * cannot stand behind. There is no third option: the beacon exposes no "report a page
 * view" API, and re-inserting its script does nothing at all — it sees `window.__cfBeacon`
 * already set and returns. The only remaining trick would be for our own code to wrap
 * `sendBeacon` and `XMLHttpRequest` and drop the duplicates, which would put a
 * first-party interceptor in front of every request the site makes, including the contact
 * form's. That is a worse thing to own than a smaller dataset.
 *
 * FLIPPING THIS IS ONE LINE, and it is the owners' call to make if coverage matters more
 * than accuracy, or Cloudflare's beacon stops counting a same-URL `replace` as a page
 * load. `npm run validate:analytics` asserts the built tag agrees with whatever is
 * declared here, so the two can never drift.
 */
export const ANALYTICS_SPA = false;

export const ANALYTICS_BEACON_CONFIG = JSON.stringify({ token: ANALYTICS_TOKEN, spa: ANALYTICS_SPA });

/**
 * The `transition:persist` key for the beacon's script element.
 *
 * Astro's head swap removes every current head element the incoming document does not
 * persist and appends the incoming one, and `runScripts()` then re-executes it — so
 * without this key the beacon's `<script>` is torn down and rebuilt on every client-side
 * navigation. That is not a double count (a re-executed beacon finds `window.__cfBeacon`
 * already set and returns immediately — measured, not assumed), but it is a script
 * element, a cache hit and a parse of thirty kilobytes per navigation, bought for
 * nothing. With this key, `persistedHeadElement()` matches the two, drops the incoming
 * tag and leaves the live one alone: one element, one execution, for the whole visit.
 */
export const ANALYTICS_PERSIST_KEY = 'cf-beacon';
