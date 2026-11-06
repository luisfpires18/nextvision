// @ts-check
import { createHash } from 'node:crypto';
import { cp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

import { loadEnv } from 'vite';

import { SITE_URL, MEDIA_DEV_BASE } from './src/config/site.ts';
import { LOCALES, DEFAULT_LOCALE } from './src/config/i18n.ts';

/**
 * The local bucket mirror, and whether this build is using it.
 *
 * `media/dist/` is byte-identical to the R2 bucket at the same relative paths, so serving
 * it at `/__media/` reproduces production exactly with no network and no credentials.
 * When PUBLIC_MEDIA_BASE_URL points at a real host, MEDIA_BASE_URL is absolute, none of
 * this runs, and not one media byte enters the site build.
 */
const MEDIA_MIRROR = new URL('./media/dist/', import.meta.url);

/**
 * Resolved with Vite's own loader, not from `import.meta.env`.
 *
 * This file runs BEFORE Vite has replaced `import.meta.env` in the site's modules, so
 * reading it here would give a different answer than the pages get — and a build that
 * copied the mirror into dist while the pages pointed at R2 would ship eighteen megabytes
 * nobody fetches. One loader, one answer, both places.
 */
const MEDIA_BASE_URL = (
  loadEnv(process.env['NODE_ENV'] ?? 'production', process.cwd(), 'PUBLIC_')['PUBLIC_MEDIA_BASE_URL']
  || MEDIA_DEV_BASE
).replace(/\/+$/, '');
const SERVING_MEDIA_LOCALLY = MEDIA_BASE_URL.startsWith('/');

/** @type {Record<string, string>} */
const MEDIA_TYPES = {
  '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4',
  '.webm': 'video/webm', '.jpg': 'image/jpeg', '.png': 'image/png',
};

/**
 * A deliberately small static handler for the mirror in `astro dev`.
 *
 * It serves exactly what R2 will serve, with the same immutable Cache-Control, so a
 * caching mistake shows up locally instead of in production. Any path that tries to climb
 * out of the mirror is refused rather than normalised.
 *
 * @type {import('vite').Connect.NextHandleFunction}
 */
const sirvMirror = async (req, res, next) => {
  const rel = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '').replace(/^\/+/, '');
  if (!rel || rel.includes('..')) { next(); return; }
  const file = new URL(rel, MEDIA_MIRROR);
  if (!file.href.startsWith(MEDIA_MIRROR.href)) { next(); return; }
  try {
    const body = await readFile(file);
    const ext = rel.slice(rel.lastIndexOf('.'));
    res.setHeader('Content-Type', MEDIA_TYPES[ext] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.end(body);
  } catch {
    next();
  }
};

/**
 * Astro 7.2.10 · @astrojs/cloudflare 14.2.6 · Node >=22.12.0
 * Decisions: docs/ARCHITECTURE.md §2, §3, §10, §11.
 *
 * `output: 'static'` prerenders every route. The Cloudflare adapter is present so
 * individual routes can opt into on-demand rendering with `export const prerender = false`
 * — that is how /api/contact and /api/newsletter will work in Phase 10. ("hybrid" was
 * removed in Astro 7; static + per-route opt-out replaces it.)
 */
export default defineConfig({
  site: SITE_URL,

  // WordPress serves every URL with a trailing slash. Preserving that is the single
  // cheapest thing we can do for the migration (docs/ROUTE_MIGRATION.md §1).
  trailingSlash: 'always',

  output: 'static',

  // We use no sessions. Left enabled, the Cloudflare adapter injects a "SESSION" KV
  // binding into the generated wrangler config, which would fail to deploy because
  // that namespace does not exist and we do not want one.
  session: false,

  adapter: cloudflare({
    // Astro's default image service needs sharp, which does not run on Workers.
    // Our images are pre-generated into R2 anyway (ARCHITECTURE.md §6.3), so the
    // compile-time service is correct here.
    imageService: 'compile',
  }),

  i18n: {
    defaultLocale: DEFAULT_LOCALE,
    locales: [...LOCALES],
    routing: {
      // Portuguese is unprefixed at "/", English lives under "/en/".
      prefixDefaultLocale: false,
    },
  },

  integrations: [
    mdx(),

    /**
     * The owners' admin, on the PROD Worker only (docs/ADMIN_DASHBOARD_PLAN.md §3).
     *
     * It lives at nextvisionfilms.com/admin (decision A8, 2026-10-22). The dev Worker is the
     * preview the admin's saves land on, and it carries no admin of its own.
     *
     * The route is injected, not a file in src/pages, so any other build does not contain
     * it at all. It exists in `astro dev` and in a build made with CLOUDFLARE_ENV=prod,
     * and nowhere else. An unset CLOUDFLARE_ENV is not prod, so a forgotten variable leaves
     * the admin out rather than in. `validate:routes` checks the built artefact either way.
     */
    {
      name: 'nvf:admin',
      hooks: {
        'astro:config:setup': ({ command, injectRoute, logger }) => {
          if (command !== 'dev' && process.env['CLOUDFLARE_ENV'] !== 'prod') return;
          injectRoute({ pattern: '/admin/api/estado', entrypoint: './src/admin/api/status.ts', prerender: false });
          injectRoute({ pattern: '/admin/api/publicar', entrypoint: './src/admin/api/publish.ts', prerender: false });
          injectRoute({ pattern: '/admin/api/carregar', entrypoint: './src/admin/api/upload.ts', prerender: false });
          injectRoute({ pattern: '/admin/api/carregar/parte', entrypoint: './src/admin/api/upload-part.ts', prerender: false });
          injectRoute({ pattern: '/admin/api/media', entrypoint: './src/admin/api/media.ts', prerender: false });
          injectRoute({ pattern: '/admin/[...path]', entrypoint: './src/admin/AdminRoute.astro', prerender: false });
          logger.info('/admin/ injected (prod Worker only)');
        },
      },
    },

    /**
     * The English 404, at the path a static host will actually look for.
     *
     * `build.format: 'directory'` writes every route as `<route>/index.html`, and Astro
     * special-cases only the ROOT 404 into a bare `404.html`. A host resolving a missing
     * page under /en/ looks for `/en/404.html`, so this moves the emitted document there
     * and removes the directory form — leaving exactly one English 404 rather than two
     * copies of it at two URLs.
     *
     * If a host ignores per-directory 404s entirely, the root `404.html` still answers
     * and the reader gets the Portuguese one. Nothing here depends on the guess.
     */
    {
      name: 'nvf:localised-404',
      hooks: {
        'astro:build:done': async ({ dir, logger }) => {
          const from = new URL('en/404/index.html', dir);
          const to = new URL('en/404.html', dir);
          try {
            await cp(from, to);
            await rm(new URL('en/404/', dir), { recursive: true, force: true });
            logger.info('en/404/index.html -> en/404.html');
          } catch (error) {
            // Loud, not silent: a missing English 404 is a real gap, and a build that
            // hid it would be worse than one that says so.
            logger.warn(`could not place en/404.html: ${String(error)}`);
          }
        },
      },
    },

    /**
     * The local media mirror, copied into the build ONLY when it is the delivery base.
     *
     * This is what makes `no network` a real guarantee rather than a claim: a checkout
     * with no PUBLIC_MEDIA_BASE_URL builds a site that carries its own media and works
     * offline end to end. Point the variable at R2 and this hook copies nothing, so the
     * deployed Worker never carries a megabyte it does not serve.
     */
    {
      name: 'nvf:local-media',
      hooks: {
        'astro:build:done': async ({ dir, logger }) => {
          if (!SERVING_MEDIA_LOCALLY) {
            logger.info(`media served from ${MEDIA_BASE_URL} — nothing copied into the build`);
            return;
          }
          try {
            await cp(MEDIA_MIRROR, new URL('__media/', dir), { recursive: true });
            logger.info('media/dist/ -> __media/ (local delivery base)');
          } catch (error) {
            // Loud. A missing mirror means every image on the site is a broken link, and
            // a build that hid that would be worse than one that says so.
            logger.warn(`no local media mirror — run \`npm run media:build\` (${String(error)})`);
          }
        },
      },
    },

    /**
     * The service worker, assembled at build time.
     *
     * src/pwa/service-worker.js is the SOURCE and holds all the policy; this hook supplies
     * only the three things it cannot know until the build exists — a version, the
     * precache list, and where the two offline shells ended up.
     *
     * ── What goes in the precache, and what must never ──────────────────────
     * The two offline documents, the manifest, the eight font faces, and the hashed CSS and
     * JS those documents and the homepage actually REFERENCE, followed through their
     * imports. Not a listing of /_astro/: that shipped the /__concepts/* bundles and the
     * desktop-only Lenis chunk to every phone (rule 25 — read what pages reference, never a
     * directory). Everything else in /_astro/ arrives through the runtime cache.
     *
     * `public/__generated/` — apart from the fonts — is excluded absolutely. It holds
     * around a hundred megabytes of video renditions and image derivatives, and the
     * storage budget for the whole site is twenty (ARCHITECTURE §17.3). Images arrive
     * through the runtime cache, capped at sixty entries; video is refused by the worker
     * itself and never enters a cache at all. This filter is the first of those two locks,
     * not the only one.
     */
    {
      name: 'nvf:service-worker',
      hooks: {
        'astro:build:done': async ({ dir, logger }) => {
          /**
           * @param {string} prefix directory under dist/client, with a trailing slash
           * @param {string[]} extensions file suffixes to include
           * @returns {Promise<string[]>} site-root paths
           */
          const listing = async (prefix, extensions) => {
            try {
              const files = await readdir(new URL(prefix, dir));
              return files
                .filter((file) => extensions.some((ext) => file.endsWith(ext)))
                .map((file) => `/${prefix}${file}`);
            } catch {
              return [];
            }
          };

          /**
           * Every /_astro/ CSS and JS file the given documents load, plus the modules those
           * import. Lenis is the one import deliberately left out: smooth scroll is desktop
           * only (rule §11), so precaching it would spend a phone's storage on a chunk the
           * phone never runs. It still loads, and is runtime-cached, where it is used.
           * @param {string[]} documents paths under dist/client
           * @returns {Promise<string[]>} site-root paths
           */
          const referenced = async (documents) => {
            /** @type {Set<string>} */
            const found = new Set();
            /** @type {string[]} */
            const queue = [];
            /** @param {string} asset */
            const add = (asset) => { if (!found.has(asset)) { found.add(asset); queue.push(asset); } };
            for (const doc of documents) {
              const html = await readFile(new URL(doc, dir), 'utf8');
              for (const m of html.matchAll(/\/_astro\/[^"'\s)]+?\.(?:css|js)/g)) add(m[0]);
            }
            while (queue.length) {
              const asset = /** @type {string} */ (queue.shift());
              if (!asset.endsWith('.js')) continue;
              const code = await readFile(new URL(asset.slice(1), dir), 'utf8');
              for (const m of code.matchAll(/(?:from|import\(?)\s*["'`]\.\/([^"'`]+\.js)["'`]/g)) {
                const file = m[1] ?? '';
                if (!file.startsWith('lenis.')) add(`/_astro/${file}`);
              }
            }
            return [...found].sort();
          };

          const shells = { pt: '/offline/', en: '/en/offline/' };
          const precache = [
            ...Object.values(shells),
            '/manifest.webmanifest',
            ...await listing('__generated/fonts/', ['.woff2']),
            ...await referenced(['index.html', 'offline/index.html', 'en/offline/index.html']),
          ];

          const source = await readFile(
            new URL('./src/pwa/service-worker.js', import.meta.url), 'utf8',
          );
          // The version is derived from the CONTENT of the precache list, so a rebuild
          // that changed nothing does not evict a reader's caches for no reason.
          const buildId = createHash('sha256').update(precache.join('\n')).digest('hex').slice(0, 12);

          const header = [
            '/* GENERATED at build time — edit src/pwa/service-worker.js, never this file. */',
            `const BUILD_ID = ${JSON.stringify(buildId)};`,
            `const OFFLINE_SHELLS = ${JSON.stringify(shells)};`,
            `const PRECACHE = ${JSON.stringify(precache)};`,
            '',
          ].join('\n');

          await writeFile(new URL('sw.js', dir), header + source, 'utf8');
          logger.info(`sw.js written — ${precache.length} entries precached, build ${buildId}`);
        },
      },
    },

    sitemap({
      /**
       * ONE RULE: a URL belongs in the sitemap if, and only if, it is indexable.
       *
       * Anything this build marks `noindex` is excluded here, because a sitemap is a
       * request to index and listing a page we have asked robots not to index is the
       * site contradicting itself. PHASE 11 closed three gaps in the previous list —
       * the English category archives, and both thank-you pages, were all eligible.
       *
       *   /__concepts/*          internal Review A prototypes; must never appear
       *   /categoria-portfolio/  the five PRESERVED legacy archives — noindex, and each
       *   /en/portfolio-category/  one a subset of /portfolio/, which is the page we
       *                          want ranked
       *   /obrigado/, /en/thank-you/   a form's success state (noindex since Phase 11)
       *   /offline/, /en/offline/      the PWA fallback shell
       *   404                    excluded by the integration, listed here as intent
       *
       * Kept as explicit prefixes rather than a substring test: the old `/_` check would
       * have silently excluded any future route with an underscore anywhere in it.
       */
      filter: (page) => {
        const path = new URL(page).pathname;
        const EXCLUDED = [
          '/__concepts',
          '/categoria-portfolio/',
          '/en/portfolio-category/',
          '/obrigado/',
          '/en/thank-you/',
          '/offline/',
          '/en/offline/',
          '/404',
          '/en/404',
        ];
        return !EXCLUDED.some((prefix) => path.startsWith(prefix));
      },
    }),
  ],

  build: {
    // Emit /sobre/index.html rather than /sobre.html, so trailing-slash URLs
    // resolve identically on Cloudflare's static asset handler.
    format: 'directory',
  },

  vite: {
    build: {
      // The design system is not settled; keep CSS inspectable rather than inlined.
      cssCodeSplit: true,
    },
    plugins: [
      /**
       * `astro dev` serves the bucket mirror at /__media/.
       *
       * media/dist/ deliberately lives OUTSIDE public/, so that the media tree is never
       * copied into a production build that is going to fetch it from R2 instead. In
       * development this middleware puts it back at the same URL, which is why the same
       * manifest paths resolve in both places.
       */
      {
        name: 'nvf:media-mirror',
        configureServer(server) {
          if (!SERVING_MEDIA_LOCALLY) return;
          server.middlewares.use(MEDIA_BASE_URL, sirvMirror);
        },
      },
    ],
  },
});
