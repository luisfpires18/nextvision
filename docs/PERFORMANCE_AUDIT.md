# Performance audit — 2026-10-29

The owners asked for the site to be "as fast as possible, good practices". It already was
fast: Lighthouse scored the production homepage 95 and the portfolio 94 on mobile, with
zero blocking time. What remained was a short list of concrete defects, each with a
measured cost. This document records the baseline, every finding and its fix, what was
measured locally afterwards, and what can only be measured once the branch is deployed.

Nothing here is a redesign. The homepage's opening curtain is the largest single cost on
the homepage's LCP, and it is an owner decision, so it is recorded below and left alone.

## 1. Baseline

Lighthouse 13.5 through PageSpeed Insights, mobile (Slow 4G, Moto G Power), against
`https://www.nextvisionfilms.com`, 2026-10-29.

| Page | Perf | A11y | FCP | LCP | TBT | CLS | SI |
|---|---|---|---|---|---|---|---|
| `/` | 95 | 100 | 1.2 s | 2.6 s | 0 | 0 | 3.9 s |
| `/portfolio/` | 94 | 92 | 1.4 s | 1.8 s | 0 | 0.14 | 2.6 s |

What Lighthouse named:

- `/`: LCP element render delay 1.94 s of the 2.6 s (the intro curtain). Render-blocking
  CSS 740 ms. The hero `.mp4` has no cache TTL. Three non-composited loader animations.
- `/portfolio/`: image delivery 125 KiB (six 1400w `<video poster>`s plus the lead
  poster). CLS attributed to `img.brand-mark.vhs__logo`. A link with no name
  (`a.poster__frame`). Contrast on `.spine`.

Edge headers (curl): `/__media/*` and `/__generated/fonts/*` were served
`Cache-Control: public, max-age=0, must-revalidate`; only `/_astro/*` was immutable. No
HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy` or frame protection.

## 2. Before and after

The after column needs the branch deployed: PageSpeed Insights cannot reach a local
server, and `_headers` is validated only by a real deploy (CLAUDE.md rule 20).

| Page | Metric | Before | After (dev deploy) |
|---|---|---|---|
| `/` | Perf | 95 | UNKNOWN |
| `/` | LCP | 2.6 s | UNKNOWN |
| `/` | CLS | 0 | UNKNOWN |
| `/portfolio/` | Perf | 94 | UNKNOWN |
| `/portfolio/` | A11y | 92 | UNKNOWN |
| `/portfolio/` | LCP | 1.8 s | UNKNOWN |
| `/portfolio/` | CLS | 0.14 | UNKNOWN |
| edge | `/__media/*` Cache-Control | `max-age=0, must-revalidate` | UNKNOWN |
| edge | security headers | none | UNKNOWN |

Targets: portfolio CLS under 0.05, accessibility 100, the image-delivery and
cache-lifetime insights gone, the homepage unchanged or better.

## 3. Findings and fixes

Each fix is its own commit on `claude/perf-audit-006eb2`.

1. **Cache and security headers** (`fix(headers)`). New `public/_headers`: `/__media/*`
   immutable for a year (names are content-addressed, rule 12), fonts 30 days and brand
   PNGs one day (not hashed, so never immutable), and on every path HSTS, `nosniff`,
   `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy` that turns
   off camera, microphone and geolocation, and `X-Frame-Options: DENY`. The adapter merges
   its own `/_astro/*` rule into this file. `validate:media` now fails if the built
   `_headers` has no immutable `/__media/*` rule; tested by breaking it.
2. **Duplicate poster downloads** (`perf(media)`). A `<video poster>` is fetched whatever
   `preload` says and is never lazy. Every such video sits at opacity 0 over a `<picture>`
   painting the same still, so the attribute only cost a second download. Removed from
   the project card, the homepage hero and the project-page hero.
3. **Portfolio image priorities were inverted** (`perf(portfolio)`). The visible shelf
   poster, the real LCP candidate, was `loading="lazy"`; two images in the hidden list
   claimed `eager` and `fetchpriority="high"`. The poster is now eager, high priority and
   has an AVIF source (cinema.ts keeps it in step on hover). The list claims priority only
   on the category archives, where it is the first thing shown, and its `sizes` is the
   thumbnail track's real bound, `17rem`.
4. **Unsized brand image** (`fix(cls)`). `.brand-mark { block-size: auto }` overrode the
   `<img>`'s `height`, so the twenty shelf logos reserved no box. The `<img>` branch now
   carries `--mark-ar` like the mask branch, and `.brand-mark` applies it.
5. **Font preloads** (`perf(fonts)`, two commits). Measured with `document.fonts` and the
   computed face of every text node in the first screen, in a real browser:

   | Page | Faces in the first screen (by painted area) | Preloaded now |
   |---|---|---|
   | `/` | Condensed 900 (wordmark), Barlow 500 (statement), Condensed 300 (rail). Barlow 400 only in visually-hidden text; Condensed 700 only the "PT" | Condensed 900, Barlow 500 |
   | `/portfolio/` | Condensed 700 (spines), Condensed 900 (tagline, the LCP element), Barlow 400, Condensed 300 | Condensed 900, Condensed 700, Barlow 400 |
   | `/portfolio/leonor/` | Space Mono 400, Condensed 300 | default pair |
   | `/sobre/` | Condensed 500, Condensed 400 (served by the 500 file), Condensed 300 | default pair |

   `BaseLayout` takes a `preloadFonts` prop; the default stays Barlow 400 + Condensed 700.
   On `/portfolio/` the LCP tagline's face was not preloaded and `font-display: swap`
   moved everything beneath it, which is the second CLS suspect the audit named.
6. **Service-worker precache** (`perf(pwa)`). It listed the whole `/_astro/` directory,
   including the `/__concepts/*` bundles and the desktop-only Lenis chunk. It now holds
   the CSS and JS that the homepage and both offline shells reference, followed through
   their imports, with Lenis left to the runtime cache: **24 entries, 333 KB → 18 entries,
   199 KB**.
7. **`class="js"` lost across swaps** (`fix(router)`, two commits). The swap replaces every
   `<html>` attribute; only `data-motion` was carried across, so the view-transition
   snapshot rendered the no-script state. Fixing that showed a second cause: the server
   sends `data-view="both"` and the cinema view was set only at page-load. cinema.ts now
   owns the one reading of `?view=` and BaseLayout applies it to the incoming document.
   Measured at `astro:after-swap` on `/sobre/` → `/portfolio/`: `class="js"`,
   `data-view="shelf"`, list `display: none`.
8. **Dead per-frame work** (`refactor(motion)`). Design v2 removed the fixed header, the
   progress stripe, the section nav, the mobile menu, the feature loop, the sound toggle
   and `.hero__foot`, but every scroll frame still tested the header row against every
   `[data-header-zone]` box (20 on the portfolio) and wrote `data-header-over`, which no
   CSS reads. Removed with `hero-armed` and its CSS, the window `resize` listener (the body
   `ResizeObserver` covers any resize that moves a section, and `innerHeight` is read
   live) and the Lenis anchor path that ClientRouter pre-empts. The `data-header-zone`
   attributes stay in the markup; they are inert.
9. **Accessibility** (`fix(a11y)`). `a.poster__frame` now takes the film's own title as
   its name (no new copy). Spine contrast measured on the cinema ground: ink on
   `rgb(243 110 33)` is **4.89:1** and passes; the other-language link at `opacity: 0.7`
   was **3.11:1** and failed the 4.5:1 floor. It is now full ink, and the current locale is
   marked by weight alone. A locale with no translation stays dimmed (it is disabled).
10. **Contact form and error page scripts** (`fix(contact)`). The contact module runs once
    per session but assumed it re-ran on every swap, so a second visit got no Turnstile
    and no fetch submission. It now wires from `astro:page-load`, guarded per form. The
    error page's retry button got two listeners on first load; it now assigns `onclick`.

Tier 2, same branch:

11. **Brand derivatives** (`perf(brand)`). `npm run brand:build` downscales each mark with
    sharp to twice the largest CSS width it is set at, never upscaling, originals
    untouched; `--check` verifies the committed files.

    | Mark | Largest use | Before | After |
    |---|---|---|---|
    | stack (homepage sign, `stackSmall`) | 6rem | 111.8 KB | 11.4 KB |
    | mono (footer on every page, BTS) | 24rem | 48.6 KB | 27.0 KB |
    | monogram | 6rem | 14.4 KB | 3.5 KB |
    | colour (services) | 20rem | 82.0 KB | 47.4 KB |
    | monogram colour (shelf, loader) | 4rem | 13.4 KB | 6.5 KB |

    The About page sets the stack at up to 56rem, so it keeps the original. Each mark is
    one fixed file rather than a `srcset`: five of the six uses are masks, and a CSS mask
    cannot choose by rendered width.
12. **Turnstile on first interaction; player preconnect on press** (`perf(contact)`).
    Turnstile loads on the first focus or press inside the form (its 65px box was already
    reserved). The film façade opens a connection to the player's origin on `pointerdown`,
    never on hover, because hovering a poster must not reach YouTube.
13. **Prefetch** — verified, nothing changed. ClientRouter's `prefetchAll` is live:
    hovering the BTS link on `/sobre/` added `<link rel="prefetch" href="/bts/">` and
    fetched it.

## 4. Verified locally

- `npm run verify` green, with the new `_headers` assertion.
- `npm run test:forms` against `npm run dev`: 23 passed, 0 failed, 2 not exercised in
  this mode.
- Contact form, second visit in one document (`/contactos/` → `/sobre/` → back):
  `data-wired` set, Turnstile mounted, and a submission went through fetch (`POST
  /api/contact/` answered 200 JSON, then `/obrigado/` with `redirectCount: 0`).
- Turnstile: no script and no widget until the first click in the form; then both, and a
  token.
- `npm run preview:cloudflare`, `/portfolio/`: zero `/poster/1400.*` requests; the lead
  poster's AVIF is requested at first paint beside the shelf monogram; the hidden list
  requests nothing; list thumbnails pick the 560w rendition at 272 CSS px, on desktop and
  at 375 px (DPR 2).
- Homepage: only the AVIF hero still is requested (no WebP poster beside it), and both
  preloaded faces end `loaded`.
- `X-Frame-Options: DENY` is live under workerd: a same-origin iframe was refused.

## 5. Not verified here

- The PageSpeed after-numbers and the edge headers (section 2). After the branch reaches
  `dev`: `curl -sI` a `/__media/*` object, a font and a page on
  `https://dev.nextvisionfilms.com`, then PageSpeed Insights (mobile) on `/` and
  `/portfolio/`.
- Cold-load CLS. The browser pane's viewport emulation registers as recent input, so
  local layout-shift entries were not trustworthy; Lighthouse on the deploy is the measure.

## 6. Follow-ups, not done here

Recorded in `docs/BLOCKED_TODOS.md`.

- **The opening curtain vs LCP.** The 6.6 s hold on the first page of a session is 1.94 s
  of element render delay on the homepage LCP, and the hero video decodes under it. Owner
  decision.
- **Content-Security-Policy**, Report-Only first. Needs a nonce strategy for the inline
  bootstrap and JSON-LD, plus Turnstile and youtube-nocookie allow-lists.
- **25 unreferenced delivery objects, 5.6 MB**, in `__media/` (for example four
  `pages/home/hero/1280.*` videos the homepage no longer uses). A manifest prune plus
  `media:sync --execute --delete`, which is a bucket operation the owners should see.
- **`/__concepts/*` still deploy**, and `__generated/posters|preview` (2.5 MB) ride along
  in `public/`. CLAUDE.md says the concepts stay; unchanged.
- **Render-blocking CSS** (3–5 sheets, ~20 KB gz). Inlining was considered and rejected:
  ClientRouter keeps sheets across navigations, and inlining would resend them on every
  page.
- **`.lights--grey`** (`mix-blend-mode: saturation` plus `:root:has(.rail:hover)`): a
  hover-only cost from design decision C2. Unchanged.
