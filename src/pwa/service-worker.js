/* eslint-disable no-restricted-globals */
/**
 * The service worker — PHASE 11.
 *
 * ── Why this is hand-written, and not `@vite-pwa/astro` ──────────────────────
 * ARCHITECTURE §17.3 specified Workbox's `generateSW`. That is an amendment, made here
 * with its reason attached rather than quietly:
 *
 * `generateSW` builds a PRECACHE MANIFEST from glob patterns over the build output. This
 * build output contains `public/__generated/`, which is roughly a hundred megabytes of
 * mp4 renditions and webp derivatives — and the storage budget for this whole site is
 * TWENTY. Getting Workbox to the right answer means maintaining a denylist that has to
 * stay correct as media is added, and a denylist that silently stops matching is how a
 * phone ends up holding the portfolio. A runtime-only worker with an explicit, generated
 * precache list cannot make that mistake: nothing is precached unless the build put it in
 * the list, and video is refused by rule below on top of that.
 *
 * It also removes a build dependency and a generated bundle from a site whose blocking JS
 * budget has been measured and defended since Review E.
 *
 * The CACHE POLICY is unchanged from §17.3. That was the part worth specifying.
 *
 * ── The policy ───────────────────────────────────────────────────────────────
 *   hashed assets, fonts   CacheFirst          immutable, so revalidation buys nothing
 *   documents              NetworkFirst, 3 s   then cache, then the offline shell
 *   images                 StaleWhileRevalidate  60 entries, 30 days
 *   video                  NetworkOnly         NEVER cached, by extension AND by path
 *   /api/*, cross-origin   NetworkOnly         not ours to cache
 *   /admin*                NetworkOnly         signed-in and always current; never on a device
 *
 * ── What it will not do ──────────────────────────────────────────────────────
 * It never calls `skipWaiting()` on its own. A new version waits until the reader asks
 * for it (src/lib/pwa.ts): an unrequested reload part-way down a cinematic page is the
 * worst moment this site has to offer.
 *
 * BUILD_ID and PRECACHE are injected by the `nvf:service-worker` integration in
 * astro.config.mjs. This file is the source; `dist/client/sw.js` is the artefact.
 */

/* global BUILD_ID, PRECACHE, OFFLINE_SHELLS */

const SHELL = `nvf-shell-${BUILD_ID}`;
const PAGES = `nvf-pages-${BUILD_ID}`;
const IMAGES = `nvf-images-${BUILD_ID}`;

/** Entry caps, which are what actually enforce the 20 MB budget. */
const PAGE_LIMIT = 30;
const IMAGE_LIMIT = 60;
const IMAGE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

/** How long a document waits for the network before the cache answers instead. */
const NETWORK_TIMEOUT = 3000;

/**
 * Video, refused twice.
 *
 * By extension, and by path prefix, because a future R2 layout could serve an mp4 from a
 * URL that does not end in one. Neither test alone is enough and both are cheap.
 */
const VIDEO_EXTENSION = /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i;
const VIDEO_PATH = /\/(video|videos)\//i;
const isVideo = (url) => VIDEO_EXTENSION.test(url.pathname) || VIDEO_PATH.test(url.pathname);

const isImage = (url) => /\.(webp|avif|png|jpe?g|gif|svg|ico)(\?|$)/i.test(url.pathname);
const isImmutable = (url) =>
  url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/__generated/fonts/');

/** The offline document for a path, so an English reader gets the English shell. */
const shellFor = (url) =>
  url.pathname === '/en' || url.pathname.startsWith('/en/') ? OFFLINE_SHELLS.en : OFFLINE_SHELLS.pt;

/* ─────────────────────────────────────────────────────────────────── install */

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    // Individually, so one 404 in the list cannot fail the whole install and leave the
    // site with no worker at all.
    await Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => undefined)));
    // No skipWaiting here. The new worker waits to be asked (src/lib/pwa.ts).
  })());
});

/* ────────────────────────────────────────────────────────────────── activate */

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL, PAGES, IMAGES]);
    const names = await caches.keys();
    await Promise.all(
      names.filter((n) => n.startsWith('nvf-') && !keep.has(n)).map((n) => caches.delete(n)),
    );
    await self.clients.claim();
  })());
});

/**
 * The reader asked for the new version. This is the ONLY path to `skipWaiting`, and it
 * begins with a click (src/lib/pwa.ts).
 */
self.addEventListener('message', (event) => {
  if (event.data === 'nvf:activate-update') self.skipWaiting();
});

/* ───────────────────────────────────────────────────────────────────── fetch */

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  /**
   * Not ours, or explicitly never cached. No respondWith: the browser does it normally.
   *
   * PHASE 12 — in production, delivered media is a DIFFERENT origin (the R2 host), so it
   * takes this branch and is never touched by this worker. That is the intended design,
   * not an oversight: every rendition has a content-addressed name and a one-year
   * immutable Cache-Control, so the browser's own HTTP cache holds it without
   * revalidating, and we avoid filling a 20 MB budget with opaque cross-origin responses
   * that browsers pad to megabytes each. Offline therefore gets the shell and the
   * document, not the photography.
   */
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  // The admin (prod Worker only): a cached copy would show stale content, and keep a
  // signed-in page on the device after the session ended.
  if (url.pathname.startsWith('/admin')) return;
  if (isVideo(url)) return;

  if (request.mode === 'navigate') { event.respondWith(document_(request, url)); return; }
  if (isImmutable(url)) { event.respondWith(immutable(request)); return; }
  if (isImage(url)) { event.respondWith(image(request)); return; }
});

/**
 * Documents — NetworkFirst with a timeout.
 *
 * The timeout is the whole point: on a connection that is technically alive and
 * effectively dead, waiting for the network is worse than showing the page the reader
 * already has. Falls through to the cached copy, then to the offline shell.
 */
async function document_(request, url) {
  const cache = await caches.open(PAGES);
  try {
    const response = await withTimeout(fetch(request), NETWORK_TIMEOUT);
    if (response && response.ok) {
      cache.put(request, response.clone()).then(() => trim(PAGES, PAGE_LIMIT));
      return response;
    }
    if (response) return response;
  } catch {
    // fall through
  }
  return (await cache.match(request))
    ?? (await caches.match(shellFor(url)))
    ?? Response.error();
}

/** Hashed CSS, JS and fonts. Content-addressed, so a hit is always correct. */
async function immutable(request) {
  const cache = await caches.open(SHELL);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

/** Posters and stills — serve what we have, refresh behind it, keep the set bounded. */
async function image(request) {
  const cache = await caches.open(IMAGES);
  const hit = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, stamp(response.clone())).then(() => trim(IMAGES, IMAGE_LIMIT));
      }
      return response;
    })
    .catch(() => undefined);

  if (hit && !isStale(hit)) return hit;
  return (await network) ?? hit ?? Response.error();
}

/* ───────────────────────────────────────────────────────────────── utilities */

const STAMP = 'x-nvf-cached-at';

/** Cached-at time, so a 30-day image expiry is enforceable without a second store. */
function stamp(response) {
  const headers = new Headers(response.headers);
  headers.set(STAMP, String(Date.now()));
  return new Response(response.body, {
    status: response.status, statusText: response.statusText, headers,
  });
}

function isStale(response) {
  const at = Number(response.headers.get(STAMP));
  return Number.isFinite(at) && at > 0 && Date.now() - at > IMAGE_MAX_AGE;
}

/**
 * Oldest-first trim to a fixed entry count.
 *
 * `cache.keys()` returns insertion order, which is close enough to least-recently-added
 * for a cap whose job is to bound storage rather than to be an optimal eviction policy.
 */
async function trim(name, limit) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length <= limit) return;
  await Promise.all(keys.slice(0, keys.length - limit).map((k) => cache.delete(k)));
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('network timeout')), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}
