# Project Context — Next Vision Films

Living state document. **Update this file as work progresses**, in the same commit as the
work it describes. Read it at the start of every session.

**Last updated:** 2026-09-04 (session 15)
**Current phase:** **Phase 15 ✅ COMPLETE — PWA finalised; the site is installable.**
**Next:** step 12 — Cloudflare staging/deploy and DNS. Then the newsletter endpoint (D18)

> **Open items now live in one place: [`BLOCKED_TODOS.md`](BLOCKED_TODOS.md).** Update it
> at the end of every phase.

> ### ✅ Review A — APPROVED (owner, 2026-09-02)
> **Contact Sheet as the overall website system + Projection for immersive/cinematic
> moments.** Slate is not the primary direction; all three originals are kept for
> comparison. The approved refinement is `/__concepts/nvf-direction/`, documented in
> `VISUAL_DIRECTIONS.md` §11. **Final art direction remains subject to owner and Tatiana
> review** — typography, colour weighting and layout are still provisional.

> ### ✅ Review B — APPROVED (owner, 2026-09-02)
> The approved direction applied to the **real Portuguese route `/`** — not another
> concept page. Full record in [`HOMEPAGE_REVIEW.md`](HOMEPAGE_REVIEW.md): structure, the
> eight curated projects and why each one, the hero comparison, the header contrast
> system, motion, mobile, payload and ten open questions. The design is **not** propagated
> anywhere else, and the concept routes are untouched.
>
> Approved after a real-browser visual review plus four targeted fixes: the header theme
> was rebuilt around declared media zones (the section-only rule was wrong across 45% of
> the page's scroll), the doubled section seam that produced the void before Services was
> collapsed, and the Services and About copy were cut by selection — 184→58 and 55→15
> words. `HOMEPAGE_REVIEW.md` §15.

> ### ✅ Review C — APPROVED (owner, 2026-09-02)
> `/portfolio/` is the complete catalogue on one page — **work-first**, with the five
> published categories demoted to filters that are real links to the five preserved
> archive URLs. All 20 projects are migrated into content collections. Full record in
> [`PORTFOLIO_REVIEW.md`](PORTFOLIO_REVIEW.md): the three taxonomy options and the count
> evidence that decided it, the composition, filter URL strategy, legacy routes, payload
> and nine open questions.
>
> Two things this changed outside the portfolio: `Portfólio` links now resolve to the real
> route everywhere, and **the click-to-open project overlay is retired** — a card
> navigates to its project. Both were Review B decisions waiting on project routes to
> exist. The homepage is otherwise unchanged and was re-verified.

> ### ✅ Review D — APPROVED (owner, 2026-09-03)
> **One** representative cinematic project page at `/portfolio/leonor/`. The other
> nineteen still render the Review C placeholder, and that is enforced by content rather
> than a flag: the designed template is selected by a project *having blocks*.
>
> The film's own resolution sets the layout — the best source is 720p, and the crop that
> removes its viewfinder corners leaves 1140px, so the film is **projected inside the dark
> room rather than stretched across it**. Nothing is upscaled. The screen arrives as a
> silent loop and becomes the published film on press, with no YouTube contact until then.
> The Review A signature finally runs on real pages: the clicked frame becomes the
> project's screen, with no library added. *(Review E changed the mechanism — the name is
> now applied to exactly one element at the moment of intent rather than rendered into
> every card. The signature is unchanged; the cost is not. `MOTION_REVIEW.md` §6.)*
>
> Full record, including the four block types used and the five deliberately not used:
> [`PROJECT_PAGE_REVIEW.md`](PROJECT_PAGE_REVIEW.md).
>
> Approved after one refinement. The image strip was under-filled because `<figure>` still
> carried the UA default `margin: 1em 40px`, taking 80px off every framed image and 240px
> off the strip. With that reset the strip recomposed to ascending 3 : 4 : 5 widths on a
> shared baseline, and the seam between two blocks of frames tightened to a breath. §15.

> ### ✅ Phase 11 — COMPLETE (2026-09-03)
> **The site is bilingual, and every English route it advertises was built.** 73 pages:
> 33 Portuguese, 31 English, a 404 and an offline shell in each language, and the five
> internal concepts. 52 URLs in the sitemap — exactly the indexable set. Full record:
> [`SEO_I18N_ROLLOUT.md`](SEO_I18N_ROLLOUT.md).
>
> **One page, mounted twice.** Every page is a component taking a locale; the route files
> are three lines each. Two copies of a page are two chances for the languages to drift
> into different designs of the same content.
>
> **`PAGE_LOCALES` is the single declaration of what exists**, and the built routes, the
> hreflang set, the sitemap, the language switch and the footer all read it. The guarantee
> that used to be "no English at all" is now "no English route without authored English
> content", enforced per page.
>
> **The legal documents stay Portuguese only**, and that is answered in four places rather
> than hidden: no route, no alternates, a disabled switch that says why, and English links
> that carry `lang="pt"` and a visible *(in Portuguese)* note. Machine-translating a
> contract would publish a legal claim nobody wrote.
>
> **Only two project taglines actually needed translating.** Eighteen of the twenty films
> publish English prose on their Portuguese pages, because that is how they were
> published. Those entries now declare `sourceLocale: en` — a field that had been in the
> schema since Phase 0 and had never been load-bearing — so "already English" and "not
> translated yet" are distinguished by a declaration instead of a guess.
>
> **The Yoast excerpts are gone.** The live site publishes a real meta description on one
> of thirty-four pages; everywhere else it emits the top of the page with its punctuation
> removed and a `[…]` on the end. Every page now carries a description composed of whole
> published sentences, checked against the archive word for word — so nothing was written
> to produce one. That also stopped `/contactos/` publishing a **D2** address in its
> og:description, which Phase 10 had shipped verbatim as preserved metadata.
>
> **`/blog` finally resolves.** `routes.json` has held that redirect since Phase 0.5 and
> nothing ever emitted it, so the link on the "Ver Tudo" button of all twenty project
> pages has 404ed in every build. `public/_redirects` is generated from the route map now.
>
> **The 404 and the offline shell are one component**, because they are the same object.
> The one new element is an empty frame carrying the address that failed — which is what a
> 404 is on a site whose vocabulary is frames. The offline page does not get one: it has
> no fact to put in a frame.
>
> **The service worker is hand-written, and ARCHITECTURE §17.3 is amended with the reason.**
> Workbox's `generateSW` precaches from globs over a build output holding ~100 MB of video,
> against a 20 MB budget. The precache is generated explicitly instead — 21 entries,
> 269 KB — and video is refused twice more by the worker itself.
>
> **Two defects found in a real browser, both mine.** The language switch shipped with its
> two halves at different sizes in the mobile menu, because only one of them is an `<a>`
> and the open menu restyles links. And the 404's switch claimed the page existed in
> Portuguese only, which is not true of a page that exists in no language.
>
> `validate:seo` is new and checks nine things against `dist/`; `validate:data` gained
> i18n completeness. **All six new checks were tested by breaking them.**

> ### ✅ Phase 10 — COMPLETE (2026-09-03)
> **The site has no scaffolding left.** The six remaining Portuguese pages are real:
> `/sobre/`, `/servicos/`, `/contactos/`, `/obrigado/`, `/termos-e-condicoes/` and
> `/politica-de-privacidade/`. 38 pages built, 33 canonical routes, 0 placeholders, and
> **0 horizontal overflow across 30 page × viewport combinations**. Full record:
> [`STATIC_PAGES_ROLLOUT.md`](STATIC_PAGES_ROLLOUT.md).
>
> **No new design.** The approved system was applied, not extended. `/contactos/` is the
> only static page that goes dark, and only because it is the one with a photograph wide
> enough to be a plate — the ground follows the frame, as everywhere else.
>
> **The legal text is derived, not transcribed.** `npm run legal:build` reads the Phase 0.5
> WordPress HTML and writes the two content entries; `npm run validate:legal` proves on
> every build that not one word differs from `docs/content/*.txt`, by comparing both with
> all whitespace and all markup removed. Markup-only changes pass, a changed word fails.
> The archive's own SHA-256 is locked. **It was tested by breaking it, four ways.**
>
> **D4 answered as mechanics only.** The privacy page's `Navegação` index — ten links, the
> reader's only way into a 15 000-character document — pointed at digiup.me. It now resolves
> in-page, with the same ten labels and the same ten fragment names. Not one word of the
> policy changed, including the paragraph naming Digiruptiva as the data controller.
>
> **D2 got harder, not easier.** `/termos-e-condicoes/` names a THIRD address,
> `geral@nextvisionfilms.com`. No page publishes any of the three and
> `Organization.email` stays omitted site-wide; the slot renders the moment
> `emailStatus` becomes `confirmed`.
>
> **The contact form is built and inert, and says so in its markup rather than in copy
> addressed to the reader.** Field structure preserved exactly, real labels added, no
> `action`, submit disabled, no fake success. *(Superseded by Phase 13 — §14. The field
> structure and the requiredness are unchanged; the form now posts.)*
>
> **Two real defects found and fixed, neither of them mine.** The open mobile menu covered
> its own close button — on a phone the menu could be left only by navigating away. And the
> legal stylesheet's `scroll-margin` stacked on the site's `scroll-padding`, landing an
> anchored clause 160 px down instead of 76.
>
> Blocking JS **unchanged at 10 858 B gz**. The homepage, the portfolio, the project pages
> and the category archives differ from the previous build in exactly four intended ways.

> ### ✅ Phase 9 — COMPLETE (2026-09-03)
> **Every published project is a real page.** The Review D placeholder is deleted, and the
> build now fails if one comes back: `npm run validate:routes` asserts 20 routes, 20
> reachable, 0 placeholders, and it was tested by breaking it. Full record:
> [`PROJECT_ROLLOUT.md`](PROJECT_ROLLOUT.md).
>
> **One template, composed from content.** Three projects are rich, seven standard, ten are
> a screen plus metadata and neighbours — and no tier name exists in the code or the
> content. A page is longer because the project **has** more. Ten projects publish nothing
> beyond a title and a film, and their pages say exactly that rather than being padded.
>
> **The map was wrong, and finding out changed the sourcing.**
> `media-source-map.json` reported 19 of 20 projects as having no hero-capable source. It
> had graded only `docs/Smash/` and never probed the other shelf: the eight archived
> WordPress card loops are **1920×1080 at 16–17 Mbps**, each one the project's own film.
> Nine projects now have a genuine 1080p entry, and `helder-museu` and `the-end` are built
> from their own footage rather than from the ambiguous Smash files behind **M2** and
> **M3** — so two owner decisions stay the owners'. They are still not masters: five
> seconds each, and **M1 stands for all twenty**.
>
> **One defect in the approved page, fixed.** `.pj-screen` used `object-fit: cover`, which
> crops a 2.22:1 frame by 19% and was scaling leonor's own hero **up 6.8%** — on the page
> whose stated argument is that nothing is upscaled. It is `contain` now: every film shows
> its own letterbox, which is what the player shows a second later. Leonor's geometry is
> otherwise identical to Review D §15.4, measured.
>
> The live site's "Que poderás gostar" pair was **not** reproduced: measured across all
> twenty pages it is the same two projects on eighteen of them — a recency widget, not a
> relationship. Related work is derived from shared category, capped at two, and the two
> single-project categories render nothing at all.
>
> `astro check` 0 errors · 32 pages · validate:data 0 errors · **validate:routes 0 errors**.

> ### ✅ Review E — APPROVED (owner, 2026-09-03)
> The last design-system review. It adds no new design and no new effects: it takes the
> motion the site already had, finds where it disagreed with itself, and makes it one
> system with **one authority per question**. Full record:
> [`MOTION_REVIEW.md`](MOTION_REVIEW.md).
>
> The organising idea is the cutting room — **cut, dissolve, reveal, hold** — and there is
> no fifth verb. Motion answers a question the reader has already asked; it never asks one.
>
> Five real defects were found and fixed. The opening hold was **arriving after the page
> was readable** — hidden by a `:root:not(.js)` rule and revealed when the deferred module
> ran. A `/portfolio/` navigation was naming **twenty elements to move one photograph**,
> each lifted out of the outgoing snapshot to play its own solo fade. The scroll driver
> could **latch itself off permanently** on one undelivered animation frame, freezing the
> ground and the header on stale values. Hover previews loaded **on passing rather than on
> intent**, and keyboard focus autoplayed video at every card. Lenis was running a
> permanent frame loop on phones where it was smoothing nothing.
>
> Two further defects surfaced from the navigation testing and were fixed even though
> neither is motion. **Every filter click was filtering in place *and* making the router
> fetch and swap the category archive** — twelve navigations for twelve clicks that needed
> none. And **`Corporativo` and `Moda & Identidade` shipped a heading, filters and zero
> project cards**: the row cursor advanced for rows that never rendered, so the overflow
> clause always sliced from past the end, and the two single-project categories lost their
> only piece of work. The build now fails if any project does not reach the page.
>
> Blocking JS is down 24.8% (14 431 → 10 858 gz), there are **zero animation-frame loops
> at rest**, zero layout reads per scroll frame, and a phone never downloads Lenis at all.
> **No GSAP** — the claim that nothing here is a timeline was re-tested, not inherited.
>
> Approved after the owner ran the `MOTION_REVIEW.md` §15 test list in a real browser.

> ### ⚠ Session 3 — DIRECTION CHANGE (2026-09-02)
>
> **The current website is no longer the visual target.** It remains the source of truth
> for projects, portfolio data, factual company information, media references and legal
> copy — but its layout, navigation and aesthetic may be replaced entirely.
>
> The new site is a **premium, cinematic, interactive, visually distinctive, international
> creative film production company website**. Explicitly *not* a corporate site, not a
> WordPress/Elementor aesthetic, not template sections, not generic cards, not text-heavy,
> not generic AI visual language.
>
> **The technical baseline survived re-evaluation unchanged** — see §2 (A11–A23). What
> changed is scope, design status, motion, PWA, i18n and the content rule.

---

## 1. What this project is

Rebuild https://www.nextvisionfilms.com — a Portuguese audiovisual production company
("NVF") — as a **premium, cinematic, interactive, visually distinctive** site for an
international creative film production company.

The current site is the source of truth for **content, projects, media references and
legal copy**. It is **not** the visual target — layout, navigation and aesthetic may be
replaced entirely (direction change, 2026-09-02).

The governing constraint: the owners must later be able to request changes, new projects,
new images, new videos, new pages or design improvements **without an architectural
rewrite**.

Non-negotiable rules live in [`../CLAUDE.md`](../CLAUDE.md). The complete audit lives in
[`WEBSITE_AUDIT.md`](WEBSITE_AUDIT.md). Architecture decisions live in
[`ARCHITECTURE.md`](ARCHITECTURE.md); the phased build plan in
[`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md).

---

## 2. Agreed architecture decisions

Decisions the user has already stated. These are settled.

| # | Decision | Status |
|---|---|---|
| A1 | Hosting target: **Cloudflare** | agreed, not provisioned |
| A2 | Media storage: **Cloudflare R2**, S3-compatible API where appropriate | agreed, not provisioned |
| A3 | Large media (images, video, thumbnails, project assets) **must not live permanently in Git** | agreed |
| A4 | Source control: **Git + GitHub** | agreed; no repo created yet |
| A5 | Fonts: **Barlow, Barlow Condensed, Space Mono** — self-hosted, no substitutes, no third-party font CDN | agreed; **files supplied and inspected 2026-09-01** (§7) |
| A6 | Frontend/design work uses the official Anthropic **`frontend-design`** skill | agreed; **installed and verified loaded 2026-09-01** |
| A7 | Humanizer only for genuinely new copy; **never** on existing site copy | agreed |
| A8 | Existing website copy is canonical; never invent content; mark gaps `UNKNOWN` | agreed |
| A9 | Architecture must leave room for a lightweight CMS/admin workflow later | agreed |
| A10 | Adding/replacing media later must be simple | agreed |

### Decided in session 2 (2026-09-01) — full reasoning in `ARCHITECTURE.md`

| # | Decision | Replaces |
|---|---|---|
| A11 | **Framework: Astro 5**, TypeScript, `output: 'static'`, `@astrojs/cloudflare` adapter, `trailingSlash: 'always'` | D13 |
| A12 | **Hosting: one Cloudflare Worker with Static Assets** — static routes plus two API routes. Pages + Pages Functions kept as an equivalent fallback | — |
| A13 | **Content: local Astro Content Collections, Zod-validated. No CMS in v1.** MDX for projects, Markdown for prose, YAML for pure data. One file = one thing | D14 |
| A14 | **CMS path: git-backed CMS later needs zero code change** — it edits the same MDX/YAML. Headless CMS = swap the collection loader only | D14 |
| A15 | **Video: YouTube keeps the 20 films** (façade-loaded, not eager). Short silent loops + hero renditions → R2 as MP4+WebM. **Cloudflare Stream not used in v1** | D15, D22 |
| A16 | **Images: pre-generated AVIF/WebP/JPEG derivatives in R2**, described by a committed `media-manifest.json` (width/height/hash) so there is zero CLS and no binaries in git. Cloudflare Image Transformations is a one-file swap later | D16 |
| A17 | **R2 key convention** fixed: `projects/{slug}/…`, `team/…`, `pages/…`, `video/…`, `brand/…`, `archive/…`. Hashed derivatives are immutable; originals are replaceable in place | — |
| A18 | **Forms: Astro API routes on the Worker + Cloudflare Turnstile** (reCAPTCHA dropped) + honeypot + timing check + edge rate limiting. Both work without JavaScript | part of D17 |
| A19 | **Analytics: Cloudflare Web Analytics (cookieless) as the baseline**, plus a consent layer that loads nothing non-essential by default | part of D19 |
| A20 | **i18n: Astro built-in**, PT at `/`, EN reserved at `/en/`. v1 is PT-only, and the **language switcher only renders when a second locale has content** — so it does not render in v1 | resolves D1 for v1 |
| A21 | **URLs: all 28 live routes preserved byte-for-byte**, slugs unchanged. `/blog` → `/portfolio/`, `/en/*` → `/`, `/wp-content/uploads/*` → mapped R2 URL | D21 |
| A22 | **Styling: plain CSS with custom properties.** No CSS framework | — |
| A23 | **Branching: trunk-based** — `main` auto-deploys, short-lived branches, PR previews, squash merge | — |

### Session 3 (2026-09-02) — Revision 2. Re-evaluated, then extended

**Re-tested against the new brief and KEPT, all of them:** A11 Astro 5 · A12 Workers with
Static Assets · A13/A14 Content Collections · A15 YouTube + R2, no Stream · A16 R2 images
+ manifest · A18 Turnstile · A19 Cloudflare Web Analytics. Reasoning in
`ARCHITECTURE.md` §2.1 — the only requirement that genuinely threatened Astro was page
transitions, and `ClientRouter` plus `transition:persist` answers it. SEO, now an explicit
requirement, actively *penalises* the SPA alternative.

| # | Decision | Note |
|---|---|---|
| A24 | **Motion stack: CSS + IntersectionObserver + `ClientRouter` + Lenis** as the ~4 KB baseline; **GSAP + ScrollTrigger dynamically imported per route** (~45 KB) only where choreography needs it | `ARCHITECTURE.md` §16 |
| A25 | **Motion is tokenised** like colour — `tokens.motion.css`. Three device/preference tiers (`full` / `reduced` / `minimal`) on `data-motion` | §16.2, §16.7 |
| A26 | **No WebGL / Three.js.** Not one film-production reference uses it; it competes with the footage and costs battery, mobile perf and a11y | §15, `DESIGN_REFERENCES.md` §6 |
| A27 | **No custom cursor, no scroll-jacking** | §15 |
| A28 | **PWA: manifest + Workbox SW, under 20 MB device storage. Video is never cached.** Prompt-to-update, never auto-reload | §17 |
| A29 | **PT + EN both required.** Localised page slugs, **identical project slugs**; switcher renders only where the target locale has content | §10 |
| A30 | **Design system is PROVISIONAL** pending Tatiana. Typography is *not* approved. Everything is a token so the identity can change late without a refactor | §5, §5.8 |
| A31 | **Portfolio taxonomy is data, not structure** — many categories per project, plus tags, curated collections, featured/homepage flags and manual order. Two naming proposals for owner review | §4.5 |
| A32 | **Cinematic project pages via a closed set of ≤ 9 blocks.** Not a page builder | §4.6 |
| A33 | **Content rule amended:** existing copy is still archived verbatim and nothing is invented, but reviewed SEO/copy *proposals* are permitted later as approved diffs (Phase 11b) | §11.4 |
| A34 | **Source preservation is Phase 0.5 and runs first** — the WordPress site may disappear around end-2026 | §18 |
| A35 | **Five design review gates (A–E)** before anything propagates site-wide | `IMPLEMENTATION_PLAN.md` |

### Session 6 (2026-09-02) — Review B

| # | Decision | Note |
|---|---|---|
| A36 | **Header theme is declared, not inferred.** Every section states what is behind the header (`cream` / `dark` / `media`) and the header resolves ink and backdrop from it. Two probes: the ground follows the viewport middle, the header follows the header band | `HOMEPAGE_REVIEW.md` §5 |
| A37 | **Editorial rows are equal-height by construction** — `ratioₙ/ratioₘ = colₙ/colₘ`. A row cannot leave a hole, and a row renders only if it can be filled | §7 |
| A38 | **Unbuilt routes resolve to their homepage section** (`src/lib/nav.ts`), and flip to the real path when the page ships. No link in a review build 404s | §8 |
| A39 | **The project viewer is a transition, never a dead end.** Its action is the project route once project pages exist, and the film itself until then | §8 |
| A40 | **Prototype media is merged at the media seam**, so components keep calling `imageProps()`/`videoProps()` against production keys. Phase 3 deletes `homepage-media.json`; nothing that renders changes | §14 |
| A41 | **A control is rendered only when it controls something.** No sound button on a silent hero; no language switch until a second locale has content | §3, §8 |
| A42 | **A section cannot declare what is behind a fixed header — its own content can.** Media carries `data-header-zone`; the probe is the header's text row, with hysteresis so it cannot strobe between frames | §5 |
| A43 | **A seam that does not change the ground is paid once.** Full section padding on both sides is reserved for ground changes, which is where the composed break belongs | §15.2 |
| A44 | **Published copy may be SELECTED but never edited**, and the build enforces it: every homepage excerpt must be a literal substring of its published source | §15.3 |
| A45 | **Only the copyright year is dynamic.** Wording is the live footer's, and the validator checks the template still matches it | §15.5 |

### Session 7 (2026-09-02) — Review C

| # | Decision | Note |
|---|---|---|
| A46 | **Work-first browsing.** `/portfolio/` is the catalogue; the five published categories are a secondary filter, not the information architecture. Chosen on the count distribution (8/5/5/1/1), not on preference | `PORTFOLIO_REVIEW.md` §2 |
| A47 | **Filters are real links to the five preserved `/categoria-portfolio/` URLs**, progressively enhanced to filter in place with `pushState`. No query parameters, so no parameter surface to canonicalise away | §5, §6 |
| A48 | **The legacy archives are kept, fixed and `noindex, follow`** — 200, own `<h1>`, own canonical, out of the sitemap. Better than their current state, and no duplication | §6 |
| A49 | **The portfolio never goes dark.** Dark means watching; browsing is reading. Hierarchy comes from two full-bleed plates breaking the container, not from changing the ground | §3 |
| A50 | **Slots are assigned from each still's own aspect ratio**, so no frame is cropped harder than its composition allows | §4 |
| A51 | **A project may have no film only if it declares why** (`filmUnavailable`). The guardrail was extended, not loosened, so D6 stays the owners' decision | §8 |
| A52 | **A card is one link to its project.** The Review B click-to-open overlay is retired now that project routes exist | §9 |

### Session 8 (2026-09-02) — Review D

| # | Decision | Note |
|---|---|---|
| A53 | **The designed project template is selected by content**, not by a flag: a project with `blocks` gets it, a project without keeps the placeholder. Rolling one in is authoring | `PROJECT_PAGE_REVIEW.md` §1 |
| A54 | **The film's real resolution sets the layout.** 1140px is the ceiling, so the film is projected inside the room rather than stretched across it. Nothing is ever upscaled to imply a master | §3 |
| A55 | **Every frame on a project page keeps the film's own aspect ratio.** Sizes change; the shape does not | §3 |
| A56 | **The hero IS the film.** A silent caption-free loop that becomes the published film on press — one screen, not a hero plus a player | §4 |
| A57 | **The ground is derived from block scale, never stored.** Full-bleed media is dark, editorial is cream — so the rhythm cannot be set wrong per project | §2 |
| A58 | **The block model is sufficient — no schema change.** Four types used, five deliberately unused, no page-builder escape hatch. `credits` stays undemonstrated because no project publishes any | §5, §6 |
| A59 | **The frame → project morph is Astro `transition:name` only.** No library; without View Transitions it is an ordinary link | §7 |
| A60 | **Consecutive blocks of frames are separated by a breath, not a section break.** Prose-to-pictures and ground changes keep the full break | §15.3 |

### Session 9 (2026-09-03) — Review E

| # | Decision | Note |
|---|---|---|
| A61 | **Motion tokens are named for their ROLE, never their length.** Seven durations, three easings, four distances, and not one raw `ms`, `cubic-bezier`, travel or delay left in production CSS | `MOTION_REVIEW.md` §1, §16 |
| A62 | **The motion tier is decided ONCE, before the first paint**, by an inline bootstrap, and published on `<html data-motion>`. CSS, the production runtime and the concept runtime all READ it. No second `prefers-reduced-motion` block may be added | §2 |
| A63 | **`reduced` removes travel, not legibility.** Distances go to zero and long durations collapse onto `--dur-ui`; interface state changes keep their settle. `minimal` is a cut everywhere | §2.2 |
| A64 | **Exactly one element is ever given a view-transition name, at the moment of intent.** Nothing is named in HTML; candidates carry `data-frame` | §6 |
| A65 | **The pair is the destination's slug, or the origin's if the outgoing document holds no frame for the destination.** The second clause is what makes Back reverse the morph | §6 |
| A66 | **Smooth scroll is desktop-only, dynamically imported, and its frame loop stops when the page is still.** Touch gets native scroll and never downloads Lenis | §4 |
| A67 | **Nothing runs while the page is still.** No frame loop, no decoding video in a hidden tab, no buffering preview | §13 |
| A68 | **Hover previews load on intent** — 140 ms dwell, one at a time, rewound on leave — and **keyboard focus starts no video**. Focus gets the outline and the written cue | §10 |
| A69 | **Motion density drops on touch even with no preference expressed**, in one `(pointer: coarse)` token block | §12 |
| A70 | **A throttle that can latch off is a driver that can die.** The scroll driver probes its first animation frame and falls back to a timer for the life of the document if it never lands | §14, ARCHITECTURE §16.11 |
| A71 | **No GSAP**, re-tested rather than inherited. Nothing on this site is a timeline | ARCHITECTURE §16.11 |
| A72 | **A control that acts locally takes its click in the CAPTURE phase.** `ClientRouter` listens for clicks in the bubble phase and is registered first, so a bubble-phase handler cannot stop it navigating | `MOTION_REVIEW.md` §10 |
| A73 | **Every project must reach the page, and the build enforces it.** `PortfolioIndex` already threw when there were too many projects for the composed sequence; it now also throws when any project fails to be placed. Silently dropping work is the worse failure, because the result looks finished | `MOTION_REVIEW.md` §14 |

### Session 10 (2026-09-03) — Phase 9, propagation

| # | Decision | Note |
|---|---|---|
| A74 | **One project template, composed from content.** No tier field, no flag, no per-project branch. A project with more material gets a longer page; zero blocks is a valid answer and ten projects use it | `PROJECT_ROLLOUT.md` §2, §7 |
| A75 | **Aspect ratios are READ from the media, never typed.** `screenRatio()` and `frameRatio()` derive the screen's box and every framed image on the page, so A55 holds across 16:9, 1.90, 2.17, 2.21, 2.22 and one portrait | `src/lib/project-page.ts` |
| A76 | **The screen CONTAINS the film; it never crops or upscales it.** `cover` was cutting 19% off a scope frame and scaling leonor's own hero up 6.8%. A film showing its own letterbox is what the player shows a second later | §8 |
| A77 | **A tall hero is a poster plate, not a cropped frame.** Portrait media is sized by height; the player takes the room's full width on press, which is a change inside 500 ms of the reader's own input | §5 |
| A78 | **A published tagline appears exactly once** — as prose where the entry declares a `text` block carrying it, as a lead under the title otherwise. Decided by comparing content, not by a flag | §7 |
| A79 | **Related work is derived from shared taxonomy or omitted.** The live site's own pair is a recency widget — the same two projects on 18 of 20 pages — and reproducing it would assert a relationship the data does not support | §9, `src/lib/related.ts` |
| A80 | **A published project with no image fails the BUILD.** A black screen looks like a bug, and looking finished is the worse failure | `src/pages/portfolio/[slug].astro` |
| A81 | **The route validator reads the build and the content independently**, so the expectation and the evidence never come from the same place. It was tested by breaking it | `scripts/validate-routes.mjs` |
| A82 | **Both media shelves are probed, and "hero-capable" has three states**, not two: `full` / `loop+stills` / `none`. A 1080p five-second card loop is a real hero source and is still not a master | `MEDIA_SOURCE_MAP.md` §1 |
| A83 | **Where a project's own footage exists, it is used in preference to an ambiguous match.** `helder-museu` and `the-end` are built from their own published clips, leaving M2 and M3 open for the owners rather than answering them by implication | §4 |

### Session 11 (2026-09-03) — Phase 10, the static pages

| # | Decision | Note |
|---|---|---|
| A84 | **Legal copy is DERIVED from the archive, never transcribed**, and the build proves it. `npm run legal:build` walks the preserved WordPress HTML; `npm run validate:legal` compares production against `docs/content/*.txt` with all whitespace and markup stripped, so markup-only changes pass and a changed word fails | `STATIC_PAGES_ROLLOUT.md` §7 |
| A85 | **The read-only archive is checksummed.** `docs/content/legal-source.lock.json` records the SHA-256 of both extracts, so "the production page changed" and "the baseline moved" are different failures | §7 |
| A86 | **Every published string declares where it was published, and the build checks it.** `v('…', '/sobre/')` is verified against `docs/source-archive/pages.json` — 37 strings, word for word, including form labels and a string published on every project page | `scripts/validate-data.mjs` |
| A87 | **A form that cannot send says so in its markup, not in copy.** No `action`, submit `disabled`, a listener bound to the FORM rather than the document, and no fake success. Writing a sentence to explain a state the owners have not approved would be inventing public copy | `ContactForm.astro`, §5 |
| A88 | **A repointed navigation link keeps the source's own fragment name.** The ten privacy anchors use the exact ids they already pointed at on digiup.me, typo included, so the migration fix is traceable to what it replaced | §6 |
| A89 | **Reordering published copy is presentation; rewriting it is not.** `/sobre/` promotes the live `<h2>` to `<h1>` and demotes the live `<h1>` to the eyebrow. Both strings published, neither changed, `<title>` untouched | §2 |
| A90 | **A published inconsistency is reproduced, never a published control that controls nothing.** `/servicos/` keeps `Vamos Conversar!` and drops the `Subscrever Newsletter` form under it: the newsletter has no destination (D18) and no endpoint | §3, decision A41 |
| A91 | **The header's scroll offset is declared ONCE**, as `scroll-padding-block-start` on `<html>`. A `scroll-margin` elsewhere does not override it — the two are additive, and a legal anchor was landing 160 px down instead of 76 | `src/styles/legal.css` |
| A92 | **A control that opens an overlay is painted above it.** The mobile menu covered its own close button, so a phone could leave it only by navigating | `--z-menu-controls` |
| A93 | **A list published on more than one page lives in a content collection.** Services and the team moved out of `src/lib/homepage.ts`, and the homepage's excerpt rule moved from a text scan into a schema refinement | `src/content.config.ts` |

---

## 3. Current project phase

### Phase 1 — Audit & documentation ✅ COMPLETE (2026-09-01)

Deliverables: `CLAUDE.md`, `docs/PROJECT_CONTEXT.md`, `docs/WEBSITE_AUDIT.md`,
`docs/content/*`.

### Phase 2 — Architecture & implementation plan ✅ COMPLETE (2026-09-01, session 2)

Deliverables: `docs/ARCHITECTURE.md`, `docs/IMPLEMENTATION_PLAN.md`, this update.
Blockers B1 and B2 cleared.

### Phase 3+ — the 14-phase build ⏸ AWAITING APPROVAL

See `IMPLEMENTATION_PLAN.md`. Phases 0–2 can start immediately; Phase 3 needs a short
owner conversation; Phases 7, 9 and 12 are hard-blocked on owner answers (§6).

**Explicitly not done and not to be done without instruction:** no framework
initialization, no npm install, no redesign, no Cloudflare configuration, no R2 uploads,
no deployment, no database, no CMS, no GitHub repository, no `git init`, no commits.

---

## 4. Completed work

### 2026-09-01 — Full public-site audit

- Crawled and archived all **34** discoverable URLs (9 pages + 20 portfolio items +
  5 category archives).
- Discovered 5 `/categoria-portfolio/*` routes that appear in **no sitemap**.
- Extracted all visible copy verbatim; stored the two long legal pages as read-only files.
- Catalogued **77** referenced media assets plus the WP REST media library
  (93 attachments, 64 publicly readable).
- Recorded all 20 YouTube video IDs, poster images, dates, categories and taglines.
- Documented the design system: colour palette, type stack, spacing, grid, breakpoints,
  media ratios, header/footer behaviour.
- Documented every interaction: sticky header, mobile menu, hover previews, carousel,
  background video, scroll behaviour.
- Identified the technical stack with high confidence (§ below).
- Measured performance (89 requests, 530–620 ms TTFB) and ran an accessibility and
  contrast pass.
- Logged **27 problems** and **54 modernization opportunities**.

### 2026-09-01 (session 2) — Architecture & planning

- Verified the `frontend-design` skill is genuinely installed **and loaded** (not just
  configured): `.claude/settings.json` enables
  `frontend-design@claude-plugins-official`, the plugin cache contains a real
  `SKILL.md` (8,260 bytes), and invoking it returned its actual guidance. **B1 cleared.**
- Parsed all **40 supplied font binaries** directly (OS/2, head, name, maxp, cmap tables)
  rather than trusting filenames. **B2 cleared** — full inventory in §7.
- Decoded the brand asset `colors.png` pixel-by-pixel and discovered the company's
  **actual four-colour accent palette**, two colours of which the live site never uses (§7).
- Computed WCAG contrast for every palette pair and found an accessible solution that
  **invents no new colour** (§7).
- Compared Astro and Next.js against 13 project-specific criteria and recorded a decision.
- Designed the content model, media architecture, R2 key convention, form and analytics
  approach, i18n strategy, URL/SEO migration, and repository layout.
- Wrote `docs/ARCHITECTURE.md` (decisions + rejected alternatives) and
  `docs/IMPLEMENTATION_PLAN.md` (14 phases, each with objective / included / excluded /
  verification).

### Files created

```
CLAUDE.md
docs/PROJECT_CONTEXT.md
docs/WEBSITE_AUDIT.md
docs/ARCHITECTURE.md                       session 2
docs/IMPLEMENTATION_PLAN.md                session 2
docs/content/termos-e-condicoes.txt        verbatim
docs/content/politica-de-privacidade.txt   verbatim
docs/content/portfolio_items.json
docs/content/media_inventory.json
docs/content/media.json
docs/content/extracted.json
.gitignore
```

Supplied by the owner (session 2), not created here:
`source-assets/fonts/{Barlow,Barlow_Condensed,Space_Mono}/` — 40 TTF + 3 OFL licences.

---

## 5. Blockers

### B1 — `frontend-design` skill ✅ CLEARED (2026-09-01, session 2)

Installed as `frontend-design@claude-plugins-official` and verified **loaded**, not merely
configured. Verification performed: (a) `.claude/settings.json` lists it under
`enabledPlugins`; (b) the plugin cache holds a real `SKILL.md` on disk; (c) the Skill tool
was invoked and returned the skill's actual content. Its guidance is applied in
`ARCHITECTURE.md` §5.

### B2 — Font files ✅ CLEARED (2026-09-01, session 2)

Supplied under `source-assets/fonts/`. All 40 binaries parsed; weights, italics, coverage
and the absence of variable fonts are now recorded facts, not assumptions (§7).

### B3 — Owner content decisions outstanding — BLOCKS content migration and go-live

See §6. Architecture is complete without them; **content and cutover are not.** Several are
copy questions only the owners can answer, and the content preservation rule forbids
guessing.

---

## 6. Unresolved decisions

### Content & business (owners must decide)

| # | Question | Why it matters |
|---|---|---|
| D1 | **English version:** translate the site properly, or drop the switcher? | `/en/homepage-english/` is an empty stub today. Determines whether i18n is in scope at all. |
| D2 | **Canonical contact email:** `nextvisionfilmsagency@gmail.com` (displayed) or `hello@nextvisionfilms.com` (linked, and used in the footer)? | Both appear on `/contactos/`. Cannot guess. |
| D3 | **Portfolio category descriptions** appear shifted relative to their headings. Corrected copy needed. | `Casamentos` currently describes institutional video. Cannot rewrite under the content rule. |
| D4 | **Privacy policy anchors** point to `digiup.me`. Repoint to NVF's own page? | Ten links currently send readers off-site. |
| D5 | **`Ver Tudo`** on portfolio pages links to `/blog` (404). Should it go to `/portfolio/`? | Assumed but unconfirmed. |
| D6 | **`dont-let-it-fool-you`** embeds a YouTube Studio edit URL for the same video already published at `ana-e-filipe-metro`. Is it a duplicate entry or a missing video? | Two entries, near-identical titles, different categories. |
| D7 | **Ten portfolio items have no hover-preview video (only 9 of 20 work).** Supply the missing clips, or drop hover previews entirely? | Determines whether previews are a real feature or dead code. |
| D8 | **Cookie consent:** add a banner, or continue without one? | GA4, Google Ads and reCAPTCHA all load pre-consent today. **Phase 14: the rebuild sets no cookie at all and stores nothing on the device, so no banner is technically required and none was added.** It becomes required again only if D19 is reversed. |
| D9 | **Contact form consent checkbox** is optional; the newsletter one is required. Which is intended? | GDPR-relevant. **Still open after Phase 13.** The published answer stands — offered, not demanded — in the markup and in the endpoint at once. `CONSENT_REQUIRED` in `src/config/forms.ts` is the ONE boolean that changes both, and `validate:routes` fails the build if the rendered checkbox drifts from it. |
| D10 | **Copy inconsistencies** (formal `sua` on `/obrigado/`, `&Direção` spacing, `Vamos Conversar!` above a `Subscrever Newsletter` button, etc.) — fix or preserve exactly? | Default under the content rule is **preserve exactly**. |
| D11 | **Testimonials:** keep all four including the digiUP one? Add attribution photos? | Currently no avatars. |
| D12 | **Orphan media** (`vcompress_210.mov` 46 MB, `videoplayback.mp4`) — migrate or discard? | Affects R2 migration scope. |

### Technical — RESOLVED in session 2

D13 → A11 · D14 → A13/A14 · D15 → A15 · D16 → A16 · D21 → A21 · D22 → A15.
Reasoning and rejected alternatives in `ARCHITECTURE.md` §2, §4, §6, §11, §15.

### Technical — still open (need owner input, not a technical judgement)

| # | Question | Notes |
|---|---|---|
| D17 | **Transactional email provider and recipient** — Resend or Brevo (EU-hosted, suits a Portuguese controller)? **Who receives contact submissions?** | MailChannels' free Workers tier no longer exists, so a provider must be chosen. **After Phase 13 this blocks DELIVERY ONLY** — the endpoint, validation, Turnstile and the four-adapter seam are built and tested. Unanswered, a production submission is refused with `503 not-configured` and is never reported as sent. Answering it is 2–3 environment variables and no code change. Cloudflare's own Email Routing `send_email` binding is the least-infrastructure option and waits on D20. |
| D18 | **Newsletter destination** — still UNKNOWN where subscriptions currently go. | The only forms work left. `/servicos/` ends with an invitation rather than a dead form (A41), and no newsletter endpoint has been written. When it is, it follows the shape the contact one now has. |
| D19 | **Analytics** — keep GA4 `GT-NF7D37J8` + Google Ads `AW-17960555673` (→ a consent banner becomes mandatory), or cookieless only? | **Phase 14 answered this provisionally: cookieless only, no banner, both Google tags dropped and kept out by `validate:analytics`.** What is open is whether the owners accept that — the live Ads tag suggests active paid campaigns — and the site TOKEN, which needs their Cloudflare account. Interacts with D8. |
| D20 | **DNS migration** — nameservers are `ns1/ns2.digiupcloud.pt`, managed by digiUP. | Requires coordinating with that agency. Blocks Phase 12. MX records must not be touched. |
| — | **R2 media hostname** — e.g. `media.nextvisionfilms.com`? | Blocks R2 delivery. Both buckets are full; neither is public, because delivery needs DNS. |
| — | **Turnstile keys** — a widget must be created at Cloudflare → Turnstile for the production hostname. | Local development uses Cloudflare's own public TEST keys and needs nothing. A deployed build with no `TURNSTILE_SECRET_KEY` refuses every submission with 503 rather than accepting one it cannot verify. |
| — | **Footer video** — keep as an optimised lazy loop, or use the poster still? **Recommended: still.** | Currently 12.33 MB of QuickTime on all 34 pages. |

---

## 7. Important discoveries

### Current stack (high confidence)

WordPress + **Elementor 4.2.4 / Elementor Pro 4.2.2** + **Hello Elementor 3.3.0** theme
with an **empty** child theme. Plus Polylang, Yoast SEO 28.3, Google Site Kit, Ele Custom
Skin 4.3.11, All-in-One WP Migration, Admin Site Enhancements. Elementor Pro Forms with
reCAPTCHA v3. nginx on shared hosting (`hosting235.serverhs.org`, `62.233.41.61`), no CDN,
Brotli on, HSTS on, no CSP.

### Findings that shape the rebuild

1. **All custom CSS lives in the Elementor Kit's admin field**, not in the child theme —
   unversioned, unreviewable, and malformed (orphan `*/`, unmatched `}`, an invalid
   `@font-face`). The child theme's `style.css` is 623 bytes of boilerplate. This is the
   clearest argument for the migration.
2. **A 12.33 MB QuickTime video autoplays in the footer of all 34 pages.** Nine of eleven
   self-hosted videos are `.mov` with no MP4/WebM fallback. ~153 MB of source video total.
   The single biggest performance win.
3. **The English site is an empty stub** while a language switcher is exposed — and that
   switcher is invisible on mobile.
4. **`/portfolio/` serves the CPT archive, not page ID 36.** Page 36 is unreachable but
   still in the sitemap.
5. **Portfolio content is well-structured underneath** — 20 items, one taxonomy, 5 terms,
   consistent fields (title, date, category, YouTube ID, poster, optional preview video,
   optional tagline). It maps cleanly to a typed content model. This is the good news for
   D14.
6. **The design is genuinely distinctive** — cream `#F0EAD6`, amber `#EFB025`, rust
   `#D54B27`, a retro display face and a striped wordmark. Worth preserving carefully; it
   is exactly what a generic AI rebuild would flatten.
7. **The type stack is changing** (Minya/Cabin/Roboto → Barlow/Barlow Condensed/Space
   Mono). This is the one approved visual departure. Everything else stays faithful.
8. **DNS is controlled by digiUP**, the agency credited in the footer — who also supplied
   one of the four testimonials. Relevant to D20 and to how the migration is communicated.
9. **Three contrast pairs fail WCAG**, worst at 1.60:1 (amber on cream). Fixable without
   changing the palette, by re-pairing rather than recolouring — and session 2 found how
   (§7.2 below).
10. **Category archives are invisible to search engines** — no canonical, no `<h1>`, in no
    sitemap.

### 7.1 Supplied fonts — measured, not assumed (session 2)

All 40 binaries under `source-assets/fonts/` were parsed directly (OS/2, head, name, maxp,
cmap tables).

| Family | Files | Format | Weights (`usWeightClass`) | Italics | Variable? | Version | Glyphs | Width class |
|---|---|---|---|---|---|---|---|---|
| Barlow | 18 | static TTF | 250, 275, 300, 400, 500, 600, 700, 800, 900 | all 9 | **no** | 1.408 | 680 | 5 normal |
| Barlow Condensed | 18 | static TTF | same 9 | all 9 | **no** | 1.408 | 680 | 3 condensed |
| Space Mono | 4 | static TTF | 400, 700 | both | **no** | 1.003 | 760 / 724 | 5 normal |

- **No WOFF2 supplied, no variable fonts supplied** — a build step is required (Phase 1).
- **Thin is `usWeightClass` 250 and ExtraLight is 275**, not the usual 100/200. The
  `@font-face` rules must use the real values or the browser synthesises the wrong face.
- Coverage verified by cmap: **every Portuguese diacritic present**, plus curly quotes,
  en/em dash, ellipsis, `€`, `«»`, `º`, `ª`. Latin-Extended and Vietnamese present; no
  Cyrillic or Greek (irrelevant here).
- **6 faces will ship** (Barlow Condensed 700/500, Barlow 400/600, Space Mono 400/700),
  ≈96 KB as subset WOFF2. The other 34 files stay in `source-assets/` — no italic run
  exists in the site's copy.
- All three families are OFL-licensed; `OFL.txt` accompanies each.

### 7.2 The real brand palette — decoded from the company's own swatch file (session 2)

`colors.png` (100×22, referenced on `/sobre/`) was decoded pixel-by-pixel. It is not
decoration — it is **four equal swatches**, the company's defined accent palette:

| Swatch | Hex | on cream `#F0EAD6` | white on it | ink on it |
|---|---|---|---|---|
| Gold | `#EFB025` | 1.60 ✗ | 1.93 ✗ | **7.56 AAA** |
| Rust | `#D54B27` | 3.59 UI-only | 4.32 large-only | 3.37 UI-only |
| **Oxblood** | `#982703` | **6.64 AA** | **8.00 AAA** | 1.82 ✗ |
| **Teal** | `#3D7D70` | 4.00 UI-only | **4.81 AA** | 3.02 UI-only |

Logo wordmark ink samples as `#292929` (12.09 AAA on cream).

**Oxblood and teal are part of the identity and appear nowhere in the live site's CSS.**
Oxblood passes AA as text on cream *and* takes white text at AAA — it is exactly the
accessible colour the current palette was missing. This resolves audit §9.23 **without
inventing a single colour**, and gives an honest basis for colour-coding the five
portfolio categories. Binding token rules in `ARCHITECTURE.md` §5.2.

---

## 8. Infrastructure intentions

Target (**nothing provisioned**):

```
GitHub repo
   └── Astro source + content collections + media-manifest.json + docs   (no binaries)
Cloudflare
   ├── Worker with Static Assets          site delivery + /api/contact + /api/newsletter
   ├── R2  (media.nextvisionfilms.com?)   projects/ team/ pages/ video/ brand/ archive/
   ├── Turnstile                          form spam protection (replaces reCAPTCHA)
   └── Web Analytics                      cookieless baseline
YouTube                                   the 20 project films stay, façade-loaded
```

**Not used:** Cloudflare Stream, Cloudflare Images transformations, any database, any CMS.
Reasoning and revisit triggers in `ARCHITECTURE.md` §6.6 and §15.

Principles carried into implementation:

- Media referenced through a **manifest / structured content layer**, never hardcoded
  paths scattered across components — so replacing an asset is a data change.
- **Stable, descriptive asset URLs**, so a swap needs no code edit (current filenames
  include `ffffffffff.png` and `Capture.png`).
- A **clean CMS seam** so A9 does not require a rewrite.
- **Design tokens in one place** so a future restyle is a token change.
- **No secrets in Git.** Cloudflare and R2 credentials stay in environment/secret storage.
  `.env*` is gitignored.

---

## 9. Owner-change flexibility requirement

The recurring test for every decision:

> Can the owners add a project, swap a video, replace an image, add a page, or ask for a
> design tweak — without a developer restructuring the codebase?

Concretely, this must stay true:

| Owner request | Must cost |
|---|---|
| Add a portfolio project | one content entry + assets uploaded to R2 |
| Replace a project video or poster | upload to R2 at the same key; no code change |
| Reorder or re-categorise projects | a data edit |
| Add a category | a data edit |
| Add a static page | one file, reusing existing layout components |
| Change a colour, font size or spacing step | a design-token edit |
| Edit copy | one place, never duplicated across templates |
| Add a CMS later | plug into the existing content layer, no rewrite |

The current site fails several of these — layout and content are entangled inside
Elementor templates, and the header, footer, newsletter block, project card and related
grid are duplicated template instances.

---

## 10. Future ideas (parked)

Not commitments. Revisit once the core rebuild ships.

- Combined portfolio index with client-side category filtering (today, seeing all 20
  projects means visiting five separate archives).
- Genuinely related "related work" + prev/next project navigation.
- Proper English translation, if D1 goes that way.
- `VideoObject` structured data per project for richer search results.
- Lightweight git-backed CMS for owner self-service.
- Case-study format for larger projects — process, stills, credits.
- Showreel page distinct from the homepage hero.
- Client/brand logo strip, if the owners supply real clients (never invented).
- Automated Lighthouse/CWV checks in CI with a before/after record.
- Image-transform pipeline (Cloudflare Images or build-time) for responsive art direction.

---

## 11. Session log

| Date | Session | Outcome |
|---|---|---|
| 2026-09-01 | 1 — Audit | Full public-site audit of all 34 URLs; `CLAUDE.md`, `PROJECT_CONTEXT.md`, `WEBSITE_AUDIT.md` and `docs/content/*` created. 27 problems and 54 modernization opportunities logged. `frontend-design` skill found unavailable (B1). |
| 2026-09-01 | 2 — Architecture | `frontend-design` verified installed **and loaded** (B1 cleared). 40 font binaries parsed (B2 cleared). Brand palette decoded from `colors.png` — two unused brand colours found, resolving the contrast failures without inventing a colour. Framework, content, media, forms, analytics, i18n, URL and repo decisions recorded in `ARCHITECTURE.md`; 14-phase build in `IMPLEMENTATION_PLAN.md`. **No code written, nothing provisioned.** |
| 2026-09-04 | 15 — Phase 15, PWA finalisation | Closed a blocker that was never real. `NextVisionFILMS.svg` had been recorded for four phases as an un-approved unknown — because **nobody had ever looked at it**: `archive:source` fetches only media a PAGE REFERENCES, and both it and `NVF.png` are library assets no page uses, so neither was ever on disk. Fetched, the SVG is a genuine clean vector (737×226, 17 paths + 3 polygons, text outlined, no embedded raster, no external font) and its five class colours ARE the brand palette — independent confirmation that the `colors.png` sampling is right. Both preserved byte-identical at `source-assets/brand/`. **The SVG is deliberately NOT the icon source**: it is a 3.25:1 wordmark, the square *NVF* monogram is a different lockup rather than a crop, and deriving one would be recomposing the mark (§8). `NVF.png` at 2431² already IS that lockup and is what the live site downscales for its own icon slots — verified: `cropped-NVF-32x32`/`-180`/`-192`/`-270` are plain resizes with framing unchanged. Five icons, ~45 KB, every one a downscale (2431→512 is 4.7:1) with the geometry MEASURED from the source's alpha, not typed. One deliberate change: an opaque `#292929` ground, because the mark is light grey on transparency and vanishes on the white a platform composites it onto — the live favicon has that defect today; `#292929` is `--brand-ink`, already `theme_color`, 9.8:1. `BaseLayout` READS `theme_color` from the manifest rather than retyping a hex. Service worker audited and unchanged — it was already right. Two new validators, **tested by breaking them: 11 deliberate defects, 11 caught, and 2 were REAL** — the apple-touch icon was RGBA-but-opaque (`flatten` leaves the channel; `removeAlpha` fixed it) and the first `skipWaiting` count read the worker's own header COMMENT as a second call site, so it now strips comments, the same prose trap `validate:analytics` avoids. Driven in a real browser against the build: manifest served as `application/manifest+json`, all five assets 200 with rendered pixels equal to every declared `sizes`; first install 21 entries / **271 KB of the 20 MB budget** / 0 video / 0 generated media; with the server killed, an uncached PT route rendered the PT shell and an uncached EN route the EN shell at `lang="en-GB"` while a page cached beforehand still rendered itself, URL preserved throughout; a bumped `BUILD_ID` **installed and WAITED** with the old worker still in control, and only the `nvf:activate-update` message activated it, deleting all three stale caches; a preview `.mp4` fetched 200 and was never cached. Did NOT touch analytics tokens, form secrets, DNS or deploy. `verify` green across all ten stages. |
| 2026-09-04 | 14 — Phase 14, analytics + privacy | Gave the site cookieless analytics and no consent banner, and found by MEASURING rather than reading that the obvious configuration is wrong: **one Astro ClientRouter navigation makes three `history` calls** — two `replaceState(state, '', undefined)` that only stash scroll offsets and change no URL, then the real `pushState` — and Cloudflare's beacon reports each as a fresh page load with its own `pageloadId`, so `/` to `/portfolio/` produced THREE reports, two of them for `/`. There is no third setting: the beacon exposes no report API and re-inserting its script does nothing (it finds `window.__cfBeacon` set and returns). Shipped `spa: false` — under-counting can be stated, over-counting is a number that looks like data — and re-measured 1 report on the initial document and 0 on each of home to portfolio, portfolio to project, back, forward and PT/EN. NO GA4, no Google Ads, no cookie banner, no consent layer (with nothing non-essential loading it would gate nothing), no CSP header. Analytics is emitted only when a token is configured AND the build is production; a dev server with a token and no override served 0 beacons. A malformed token FAILS the build, because it is interpolated into an HTML attribute. Measured privacy after a full visit including a real form submission: 0 cookies, 0 localStorage keys, 0 IndexedDB databases, a probe submission landing on `/obrigado/` with no query string, and the beacon's payload captured verbatim — two URLs and timings. Did NOT amend the privacy policy: it declares `_ga`, `_gid`, `_gat`, Smartsupp and Google cookies this site no longer sets, and that mismatch is an OWNER/LEGAL REVIEW item, not a silent edit. Cost 10 125 B gz once per visit, non-render-blocking, plus 227 B of markup per page. `validate:analytics` is new, checks eight things and **all eight were tested by breaking them**, plus one scope test proving the preserved policy's own mention of Google Analytics does not fail the build. Created `docs/BLOCKED_TODOS.md`. `verify` 0 errors across all eight stages. |
| 2026-09-04 | 13 — Phase 13, the contact backend | Gave the contact form a real, verified backend: `POST /api/contact/`, the one route with `prerender = false`. Found TWO adapter facts by running the endpoint rather than reading about it, each a 500 on every submission — **`Astro.locals.runtime.env` no longer exists** in @astrojs/cloudflare 14 and throws (the environment is now read with `import { env } from 'cloudflare:workers'`), and **`Astro.clientAddress` is not implemented by this adapter and throws** (Cloudflare puts the address on `CF-Connecting-IP`). Both are in `CLAUDE.md` §10.1. Preserved the published field structure exactly and added three things: a hidden `locale` so the SERVER chooses the thank-you page, the Turnstile container, and one polite live region plus a `<noscript>` line. Turnstile is verified server-side on every submission and fails closed. Refused a filled honeypot instead of silently discarding it — a password manager can reach an off-screen field, and telling that person their message was delivered when it was not is worse than refusing them. DROPPED the timing check `ARCHITECTURE` §7 specified, and recorded why: it needs a fresh per-render timestamp on a prerendered, cached page, so it would have to be written by JavaScript — a mechanism and no protection. Added no KV and no D1. Built the delivery seam with four adapters and NO recipient anywhere, because D17 and D2 are open: an unconfigured production build refuses with 503 rather than reporting a success. Evaluated Cloudflare's own Email Routing `send_email` binding as the least-infrastructure option and deferred it to D20/DNS. Amended the "works without JavaScript" claim rather than dropping it quietly. `npm run test:forms` drives the live endpoint in three server modes — all three run, 0 failures — and both locales were submitted through the real form in a real browser. `verify` 0 errors across all seven stages. |
| 2026-09-03 | 11 — Phase 10 static pages | Built the six remaining Portuguese routes on the approved system with no new visual direction, and the site now has no scaffolding anywhere: 38 pages, 33 canonical routes, 0 placeholders, 0 horizontal overflow across 30 page x viewport combinations. Did NOT transcribe 23 000 characters of contract and privacy law: `scripts/build-legal.mjs` derives both documents from the preserved WordPress HTML, and `scripts/validate-legal.mjs` proves on every build that not one word differs — comparing with all whitespace and all markup removed, so a heading level, a split paragraph, a list, a table and a repointed anchor all pass while a changed word fails. Tested by breaking it four ways. Answered D4 as MECHANICS ONLY: the privacy page's ten `Navegação` links, which sent readers to digiup.me, resolve in-page with the same labels and the same fragment names, and no word of the policy changed. Found a THIRD email address in `/termos-e-condicoes/` (`geral@nextvisionfilms.com`), which makes D2 harder rather than easier — no page publishes any of the three. Built the contact form as production markup with no backend and no pretence of one: field structure preserved exactly, real labels added where the live form has only placeholders, no `action`, submit disabled, and a guard bound to the form rather than to the document so six router navigations leave one handler. Found and fixed two real defects that were not mine: the open mobile menu covered its own close button, and the legal stylesheet's `scroll-margin` stacked on the site's `scroll-padding` and landed an anchored clause 160 px down instead of 76. Derived `/sobre/`'s two team columns from the two portraits' own aspect ratios, because `1fr 1fr` left a 125 px hole under one caption. Cut the one dark moment `/sobre/` could have had after checking the footage frame by frame: `We are NVF` carries a burned-in wordmark on every frame. Moved services and the team into content collections and the homepage's excerpt rule into a schema refinement; the homepage's rendered output is byte-identical apart from four intended link changes. Blocking JS unchanged at 10 858 B gz. `astro check` 0 errors, 38 pages, validate:data 0 errors, validate:legal 0 errors, validate:routes 0 errors. |
| 2026-09-03 | 10 — Phase 9 rollout | Propagated the approved project system to all twenty projects and deleted the placeholder. Found the map wrong first: `media-source-map.json` had graded only `docs/Smash/` and reported 19 of 20 projects as having no hero-capable source, while the eight archived WordPress card loops it listed but never probed are **1920x1080 at 16-17 Mbps** — nine projects gained a genuine 1080p entry, and `helder-museu` and `the-end` are now built from their own footage instead of the ambiguous files behind M2 and M3. Classified by content rather than by a field: 3 rich / 7 standard / 10 screen-and-metadata, with no tier name anywhere in code or content. Generated 8 hero loops, 1 still hero and 21 editorial stills, every width a downscale. Fixed one real defect in the approved page — `.pj-screen` used `object-fit: cover`, cropping a 2.22:1 frame by 19% and upscaling leonor's own hero 6.8% on the page whose argument is that nothing is upscaled — and verified leonor's geometry is otherwise identical to Review D §15.4. Handled the two weak assets honestly: `dormencia-48h`'s portrait poster is presented as a poster (437x648, not 1140x1689) and `madrugada-prince-mark`'s title card ships as published with a new owner request. `dont-let-it-fool-you` still has no film, no play control and no VideoObject. Related work derived from shared category after measuring that the live site's own pair is the same two projects on 18 of 20 pages. Trimmed the one payload outlier (antiqvvm 302 -> 246 KB). New `validate:routes` asserts 20 routes, 20 reachable, 0 placeholders, and was tested by breaking it. `astro check` 0 errors, 32 pages, 0 validation errors, 0 route errors. |
| 2026-09-03 | 9 — Review E motion | Rationalised the whole motion system into one contract with one authority per question, and found five real defects doing it: the loader arrived **after** the page was readable, a portfolio navigation named **20 elements to pair 1** (19 solo fades over 19 holes in the outgoing snapshot), the scroll driver could **latch itself off for good** on one undelivered animation frame, hover previews loaded on passing rather than on intent and autoplayed on keyboard focus, and Lenis ran a permanent frame loop on phones it was not smoothing. Tokens renamed for role; the tier decided once before paint and read everywhere else; the morph rebuilt to name exactly one element at the moment of intent, verified across all seven navigations in both history directions; smooth scroll narrowed to desktop, dynamically imported, idle-stopping. Blocking JS 14 431 → 10 858 gz (−24.8%), 0 RAF loops at rest, 0 layout reads per scroll frame, 0 listener leaks over ten navigations, 0 video requests from a twenty-frame sweep. `astro check` 0 errors, 32 pages, 0 validation errors. **No GSAP.** Two non-motion defects fixed on the way, both found by navigation testing: every filter click was also triggering a router navigation (12 → 0), and the two single-project category archives were rendering **zero cards** because the row cursor advanced past rows that never rendered — `Corporativo` and `Moda & Identidade` had been shipping a heading and no work, and the build now fails if any project does not reach the page (5 / 1 / 5 / 1 / 8, 20 on the index). Not approved — motion needs a real browser, and `MOTION_REVIEW.md` §15 is the test list. |
| 2026-09-02 | 8 — Review D project page | Built one cinematic project page at `/portfolio/leonor/`, selected over three alternatives on measured evidence — highest-bitrate clean source (2 037 kbps, verified with ffprobe), no embedded client branding, the longest published copy, and the widest compositional range. Designed the page around the source's real 1140px width rather than the viewport: the film is projected inside the dark room, never upscaled. Merged hero and player into one screen that becomes the film on press — 0 YouTube bytes before, 0 layout shift after. Implemented the Review A frame→project morph with Astro's own transitions and no library; it pairs on all 20 projects including placeholders. Schema needed **no change** — four block types used, five deliberately unused. Fixed three real defects: a mismatched srcset, a frame collapsed by an inline `<span>`, and two renditions that were upscaling a 1140px source. `astro check` 0 errors, 32 pages, 0 validation errors. |
| 2026-09-02 | 7 — Review C portfolio | Built `/portfolio/` as one work-first catalogue, plus the five preserved category archives and 20 temporary project routes (32 pages). Evaluated three taxonomies and rejected two on evidence: the existing five make two single-project filters, and the `Narrativa/Marcas/Pessoas` regrouping puts 13 of 20 in one bucket and asserts a claim the source data does not support. Migrated the remaining 11 projects verbatim; `dont-let-it-fool-you` has no valid film, so the schema gained `filmUnavailable` rather than being loosened or guessing D6. Filters are real links to real routes, enhanced with pushState. Retired the Review B overlay. 0 px of header-contrast error across the page. First screen ≈148 KB, zero video bytes on load, zero on touch. `astro check` 0 errors, 32 pages, 0 validation errors. |
| 2026-09-02 | 6 — Review B homepage | **Review A approved.** Built the real `/` route on the approved direction: 8 curated projects across all 5 categories, one cinematic feature, four grounds instead of seven. Compared three showreels frame by frame and found every NVF source carries burned-in material — the hero is a 15 s clean run from `NVF Showreel` (71–86 s). Replaced Review A's guessing header with a declared theme system, measured at 12.09 / 16.25 / 8.16:1. Migrated 9 projects into content collections. Found and fixed three real defects: `astro:page-load` double-init left the menu toggle dead (also live in `ConceptLayout`), the hero entrance could hide the statement permanently, and the `reduced` tier still autoplayed video. Raised secondary text from 3.98:1 to 5.30:1. `astro check` 0 errors, 6 pages, 0 validation errors. JS+CSS **19 KB compressed**. |
| 2026-09-02 | 6 — Refined direction | Owners chose **Contact Sheet system + Projection mode**. Built `/__concepts/nvf-direction/` on one idea: the site is *the same frame at different scales*, and the ground colour follows the frame — which makes the cream/dark duality causal rather than decorative. Hero reworked to film-first with the statement at caption weight. Archive furniture removed; editorial grid given a deliberate proportion rhythm. Stripe cut to four functional uses. **Real fonts now in use** — 6 subsetted WOFF2 faces, 83.3 KB, all PT diacritics verified. Signature: click/tap opens the frame into a dark viewer. **No GSAP.** Replaced the IntersectionObserver ground driver with the scroll handler already needed, because a silent IO failure would have hidden the entire cream half of the design. `astro check` 0 errors, 6 pages, 0 validation errors. |
| 2026-09-02 | 5 — Review A | Built three visual directions at `/__concepts/` using real preserved content — 20 projects, verbatim copy, nothing invented. Decoded `colors.png` as a **film colour-reference strip** and made it the shared system across all three. Added Lenis only (no GSAP). Generated 2.42 MB of disposable prototype media. Found and fixed a real fragility: reveals depended on IntersectionObserver, which never fires in the preview pane, so content stayed blank — the default is now inverted with a failsafe. Fixed Portuguese diacritic clipping at tight display leading. `astro check` 0 errors, build 5 pages, 44 KB JS / 24 KB CSS total. **Ranked recommendation: Contact Sheet, then Projection, then Slate.** |
| 2026-09-02 | 4 — Foundation | **Phase 0 + 0.5 complete.** Preserved the live site: 34/34 pages, 9/9 endpoints, 39/39 media originals (174.5 MB), 0 failures. Built the WordPress/YouTube/Smash source map — **19 of 20 projects are MASTER_REQUIRED**. Checked versions rather than assuming: Astro stable is **7.2.10**, not 5. Initialized Astro + Cloudflare adapter, content schemas (7/7 malformed fixtures rejected), i18n with EN disabled, SEO helpers, media manifest, route map, PWA manifest without invented icons. `astro check` 0 errors, build passes, 0 media or secrets tracked. 3 local commits, no remote. **No visual design started.** |
| 2026-09-02 | 3 — Revision 2 | Owner direction change: the current site is no longer the visual target. Fingerprinted all 25 reference sites (evidence, not recall) → `DESIGN_REFERENCES.md` with extracted principles, anti-patterns and three visual directions. Inventoried `docs/Smash/` (20 files, 469 MB) with `ffprobe` → `SMASH_MEDIA_INVENTORY.md`; **found 17 of 20 are 720p web exports, not masters**, and identified both WordPress "orphan" videos. Re-evaluated and **kept** the whole technical baseline. Added motion architecture, PWA, full PT/EN, flexible taxonomy, cinematic blocks, amended content rule, and Phase 0.5 preservation. Restructured the plan around **five review gates**. **Still no code written, nothing provisioned.** |

---

## 12. Session 4 (2026-09-02) — Foundation + preservation ✅ COMPLETE

### 12.1 Versions — checked, not assumed

The architecture document said "Astro 5". **That label was stale.** Current stable was
checked against the registry before installing:

| Package | Installed | Constraint verified |
|---|---|---|
| `astro` | **7.2.10** | engines: node >=22.12.0, npm >=9.6.5 — local 22.23.2 / 10.9.8 ✓ |
| `@astrojs/cloudflare` | **14.2.6** | peer `astro ^7.2.0`, `wrangler ^4.125.0` ✓ |
| `@astrojs/mdx` | **8.0.0** | peer `astro ^7.2.6`, node >=22.12.0 ✓ |
| `@astrojs/sitemap` | 3.7.4 | ✓ |
| `@astrojs/check` | 0.9.10 | peer `typescript ^5 \|\| ^6` ✓ |
| `wrangler` | 4.128.0 | ✓ |
| `typescript` | 5.9.3 | |
| `zod` | 4.5.4 (via astro) | **v4, not v3** |

**Package manager: npm.** None was already established; npm is what Node ships with and
keeps the toolchain to one lockfile.

### 12.2 Three Astro 7 realities that changed the plan

| Assumption | Reality | Response |
|---|---|---|
| "Astro 5" | Stable is **7.2.10** | Installed 7.2.10. `A11` amended |
| `z` from `astro:content` | **Deprecated** in Astro 7; zod v4 also moved string formats to top level | Schemas import from `astro/zod`; `z.email()` / `z.url()` |
| `output: 'hybrid'` | **Removed** | `output: 'static'` + per-route `prerender = false` — how the Phase 10 form endpoints will work |

One more, found by building: the Cloudflare adapter **injects a `SESSION` KV binding**
unless sessions are disabled. Deploying against a namespace that does not exist would
fail, so `session: false` is set. Verified: `kv_namespaces` is now `[]`.

Also: `main` and the assets binding must come **from the adapter**. Hand-setting `main`
in `wrangler.jsonc` breaks the Cloudflare Vite plugin ("doesn't point to an existing
file"), because the entry does not exist until after the build.

### 12.3 Source preservation — the urgent part, done first

**34/34 pages · 9/9 endpoints · 39/39 media originals · 0 failures.**

- Raw HTML, REST responses and 174.5 MB of media → `source-archive/` (gitignored).
- Structured extraction → `docs/source-archive/*.json` (committed): titles, all meta, Open Graph, canonicals, hreflang, Yoast JSON-LD, heading hierarchy, every anchor, image alt, form structure, Elementor widget settings, and the visible text of each page. SHA-256 on every response and asset.
- **38 WordPress-generated size variants deliberately skipped** — the original upload is archived instead, and each variant records what it derives from.
- Polylang config captured, confirming the i18n design: `pt`/`pt_PT` default and unprefixed, `en`/`en_GB` with its home at the empty stub.

The archive scripts are **dependency-free on purpose** so they still run years from now
with no `node_modules` present. Media downloads are resumable and checksum-verified.

### 12.4 The `Smash/` finding that changes sourcing

`src/data/media-source-map.json` applies an explicit hero floor (**1080p / 8 Mbps**) and
records a `basis` + `confidence` for every match. Result:

- **19 of 20 projects are `MASTER_REQUIRED`.** Only `nvf-vs-filmin-details` can carry a cinematic hero from material we hold.
- 10 of 20 have **no hover-preview source** at all.
- 19 of 20 have a valid YouTube id — `dont-let-it-fool-you` stores a Studio edit URL, which the extractor **rejects rather than passing through**.
- Both WordPress "orphans" identified by exact duration match: `vcompress_210.mov` = `NVF Showreel.mp4` (189.10 s), `videoplayback.mp4` = `We are NVF.mp4` (20.09 s).

**Obtaining masters (M1) is now the longest lead time in the project.**

### 12.5 Schemas as a guardrail — proven, not asserted

Seven malformed fixtures were built against the schema. **All seven were rejected**, and
each maps to a real defect on the live site:

| Fixture | Live-site defect it prevents |
|---|---|
| `studio.youtube.com/…/edit` as a video id | audit §9.7 |
| Wrong-length YouTube id | audit §4 (id stored without scheme) |
| `heroVideo` with no `heroStill` | audit §9.11, black box until decode |
| Project with nothing watchable | audit §9.8 |
| Unknown category reference | — |
| Missing title | audit §8.9, missing `<h1>` |
| Unknown block type | prevents page-builder drift |

### 12.6 What was deliberately left blank

Under CLAUDE.md §8, these are **nulls with a reason**, never placeholders:

- **Contact email** — the live `/contactos/` displays one address and links another (D2).
- **Category descriptions** — four of five do not match their heading (D3).
- **Alt text** — authored copy; Phase 11b, owner-reviewed.
- ~~**PWA icons**~~ — **shipped, Phase 15.** R6 cleared: the vector existed and had never been looked at. Icons are downscales of the preserved square monogram; the site is installable.
- **English UI strings** — `en.ts` is empty and the validator **fails** a partially translated dictionary.
- **Organisation legal name / VAT / address** — not published anywhere on the live site.

### 12.7 Verification

```
astro check      0 errors, 0 warnings (17 files)
astro build      1 page, 0 errors
validate:data    6 ok, 4 warnings, 0 errors
schema fixtures  7/7 malformed entries rejected
git hygiene      0 media binaries, 0 archive files, 0 secrets tracked
```

Built output verified for `lang="pt-PT"`, the verbatim title pattern, a self-referencing
canonical, the manifest link, `og:locale`, the skip link, and `_headers` carrying
immutable cache for hashed assets. Sitemap emits at `/sitemap-index.xml`, matching the
redirect map.

Six `glob-loader` warnings for empty collections are **expected** — those collections are
populated in Phase 2. They are accurate signals of what is not yet migrated.

### 12.8 Commits

| | |
|---|---|
| `66c5753` | `feat: preserve the live WordPress site before it disappears` |
| `ec41daa` | `feat: initialize Astro foundation targeting Cloudflare` |
| `270d0d4` | `feat: content, i18n, SEO and media schemas` |

No remote. No GitHub repository created.

### 12.9 ⚠ Still at risk if the WordPress site vanished tomorrow

**Mostly nothing — with one real exception.**

Recoverable from the archive: every page's content and metadata, all portfolio data,
legal copy, SEO metadata, the media originals, routes and redirects.

| Still at risk | Why |
|---|---|
| **The archive itself is a single copy** on one machine — 175 MB of WordPress media plus 469 MB of `Smash/`, both gitignored. A disk failure loses them | **Largest open risk.** Phase 3 uploads to R2; until then, back it up manually |
| **Masters for 19 of 20 projects** | Never existed locally. Only YouTube's 720p-grade renditions exist (M1, M6) |
| Form recipient and newsletter destination | Server-side config, never public (D17, D18) |
| 29 media attachments not readable via REST | Not enumerable anonymously; may be unused |
| Analytics history | No account access |

### 12.10 Adjustments to recorded architecture

| Was | Now | Why |
|---|---|---|
| `A11` "Astro 5" | **Astro 7.2.10** | Version label was stale; API checked and adapted |
| `media-manifest.json` in `src/content/` | **`src/data/`** | `src/content/` is scanned for collections; a loose JSON there is ambiguous |
| Cloudflare adapter config | + `session: false`, `imageService: 'compile'` | Avoids an unprovisioned KV binding; sharp does not run on Workers |
| `@vite-pwa/astro` for the service worker | **Not installed** | Its peer range stops at `astro ^5` — incompatible with 7. PWA manifest is hand-written; the SW is revisited in Phase 12 |

---

## 13. Session 12 (2026-09-03) — R2 + the production media pipeline ✅ COMPLETE

Full record: `docs/MEDIA_PIPELINE.md`. Decisions that departed from the recorded
architecture: `docs/ARCHITECTURE.md` §6.9.

**What changed.** The prototype media builder is gone. `scripts/build-review-media.mjs` and
`src/data/review-media.json` are deleted; their reviewed decisions — every timecode, crop
and justification from Reviews B/C/D and Phases 9/10 — were moved verbatim into
`scripts/media/recipe.mjs`, which now holds WHAT to build while `scripts/media-build.mjs`
holds how. `src/data/media-manifest.json` went from a one-entry placeholder to the site's
only media authority: **86 assets, 384 renditions, 16.69 MB**.

**The two ideas.** Every delivered file is content-addressed
(`projects/leonor/hero/1140.a1b2c3d4.mp4`), so the cache is immutable, an update is a new
name, a purge is never needed, and sync is a set difference. And the local mirror is
byte-identical to the bucket at the same paths, so `PUBLIC_MEDIA_BASE_URL` is the only
switch between "serve our own media, offline, no credentials" and "serve from R2".

**Buckets.** `nvf-media` (delivery, 384 objects) and `nvf-source-archive` (private, 102
files / 645.95 MB, never given a public URL, never read by the site). Both in `weur` on the
company account, both filled 2026-09-04. Neither is public yet — that needs DNS, which this
phase does not touch. They were first built on the owner's personal account by mistake; that
correction, and how the uploads were verified without a live object count, is
`docs/MEDIA_PIPELINE.md` §9.1–9.2.

**A trap that was live and is now closed.** `wrangler.jsonc` declared
`PUBLIC_MEDIA_BASE_URL: "https://media.nextvisionfilms.com"` for a host that has never
existed. Vite substituted it into every built page — so the site linked to nothing — while
`astro.config.mjs`, reading the same name at config time, saw it unset and ALSO copied
18 MB of local media into `dist`. Both halves now resolve through one `loadEnv` call and
the `vars` block is gone.

**Phase 11 locks applied.** The English title suffix is `Next Vision Films`, not
`We are NVF - Audiovisual Production`; the homepage title is the brand alone, in both
locales, because the brand does not suffix itself; `validate:seo` now treats a title shared
by an hreflang pair the way it already treated a shared description.

### 13.1 Answering §12.9 — the single-copy risk

`npm run media:backup` exists and reports **102 files, 645.95 MB** ready to go to the
private bucket. It has NOT been run: it is paid storage and the decision is the owner's.
Until it is, the risk row in §12.9 stands unchanged.

### 13.2 What is still not done

Forms, Turnstile, analytics, DNS and deployment — all out of scope, all untouched. PWA
icons remain blocked on an owner-supplied vector logo. The delivery hostname is the one
decision left before media can actually serve from R2. *(Forms and Turnstile were done in
session 13 — §14. Analytics, DNS and deployment are still untouched.)*

---

## 14. Session 13 (2026-09-04) — the contact form's backend + Turnstile ✅ COMPLETE

**The form posts, and every refusal path was run rather than reasoned about.**
`POST /api/contact/` is the one route on this site with `prerender = false`. Record:
`ARCHITECTURE.md` §7, `STATIC_PAGES_ROLLOUT.md` §5.

### 14.1 Two adapter facts that were 500s until they were found

Both were discovered by driving the endpoint over HTTP, not by reading documentation. Both
are now in `CLAUDE.md` §10.1 because they will bite anyone who writes a second endpoint.

- **`Astro.locals.runtime.env` NO LONGER EXISTS.** @astrojs/cloudflare 14 removed it and
  throws on access: *"Astro.locals.runtime.env has been removed in Astro v6. Use
  `import { env } from "cloudflare:workers"` instead."* Every submission was a 500.
  `@cloudflare/workers-types` is a devDependency of the adapter and is not hoisted, so the
  one export used is declared in `src/env.d.ts` rather than installing an ambient Workers
  type package across a codebase that is mostly DOM.
- **`Astro.clientAddress` is not implemented by this adapter and THROWS.** The address is
  on the `CF-Connecting-IP` header. It is passed to Cloudflare for challenge scoring and
  nowhere else — never logged, never delivered, never stored.

And one routing fact worth writing down: `trailingSlash: 'always'` DOES apply to endpoints
whose route carries no file extension, so the real URL is `/api/contact/`.

### 14.2 What was built

| Piece | Where |
|---|---|
| The contract — field names, limits, outcome codes, Turnstile keys, the D9 switch | `src/config/forms.ts` |
| Normalisation + zod v4 validation, and the body reader | `src/lib/forms/contact.ts` |
| Turnstile `siteverify`, failing closed | `src/lib/forms/turnstile.ts` |
| The delivery seam — 4 adapters behind 1 interface | `src/lib/forms/delivery.ts` |
| Request-time env, via `cloudflare:workers` | `src/lib/forms/env.ts` |
| The endpoint | `src/pages/api/contact.ts` |
| The form — 3 additions, 0 changes to the preserved structure | `src/components/site/ContactForm.astro` |
| 14 authored outcome strings per locale | `src/i18n/pt.ts`, `src/i18n/en.ts` |
| The live-endpoint test runner | `scripts/test-forms.mjs` |

### 14.3 The decisions that shaped it

- **A filled honeypot is REFUSED, not silently discarded.** The classic pattern reports
  success to a bot so it stops trying. But an over-eager password manager can reach an
  off-screen field named `empresa`, and telling that person their message was delivered
  when it was not is the worst outcome this form can produce. `202`, no detail, and the
  page says it could not be sent.
- **The timing check in `ARCHITECTURE` §7 was DROPPED, and the reason is recorded.** It
  needs a fresh per-render timestamp, and both contact pages are prerendered and cached, so
  the timestamp would have to be written by JavaScript — which is exactly the client
  Turnstile already covers. A mechanism and no protection.
- **No KV and no D1 were added.** A counter store is infrastructure this project would then
  own; edge rate limiting on `/api/*` is a WAF rule set at deployment.
- **The "works without JavaScript" claim was AMENDED, not dropped.** The form still posts
  without scripting and **will be refused**, because Turnstile cannot issue a token without
  it. A `<noscript>` line says so before anyone types, rather than letting them write a
  message and discover it on submit.
- **`CONTACT_FORM` moved out of `src/config/site.ts`.** That file is technical site
  configuration; the form's contract is a wire format shared with a runtime route, and a
  limit declared in two places is a limit the two sides can disagree about.

### 14.4 The delivery seam is real and deliberately empty

**D17 and D2 are still open**, so no address exists anywhere in the code and the endpoint
has no default to fall back to. Four adapters: `unconfigured` (503, never pretends),
`dev-sink` (`astro dev` only, logs `NOT DELIVERED` with field LENGTHS and no contents),
`resend` and `brevo` (one HTTPS POST each). Answering D17 is two or three environment
variables — no component, no route and no validator changes.

**The lowest-infrastructure option was evaluated and deferred**: Cloudflare's own Email
Routing `send_email` binding needs no third party, no account and no API key, but requires
the zone to be ON Cloudflare with Email Routing enabled — decision D20, a later phase. It
is a ~40-line adapter when DNS moves.

### 14.5 Verification

`npm run verify` — all seven stages, 0 errors. `validate:routes` gained ten assertions
about the live form, including two that would have been meaningless before: **no
key-shaped string other than the declared site key may appear in either document**, and
**nothing may link to `/obrigado/`**.

`npm run test:forms` drives the running endpoint. Three server modes, because three
branches cannot coexist on one server — a captcha that always passes cannot be seen to
fail, and a server that delivers cannot be seen to be unconfigured. The runner probes,
asserts the branch that server can produce, and prints the one-line `.dev.vars` change that
reaches the others. **All three were run:**

| Mode | Result |
|---|---|
| `delivering` (default, no config) | 23 passed, 0 failed |
| `captcha-fails` (`TURNSTILE_SECRET_KEY=2x00…0AA`) | 21 passed, 0 failed |
| `unconfigured` (`CONTACT_PROVIDER=nonesuch`) | 22 passed, 0 failed |

And through the **real form in a real browser**, both locales: the widget mounts and issues
a token, `/contactos/` submits and lands on `/obrigado/`, `/en/contact/` submits and lands
on `/en/thank-you/`, a bad address is caught client-side with no round trip, a server
refusal renders in the page's own language (`Complete the security check.`), and a
`?erro=` landing renders the Portuguese message and then removes the parameter so a reload
does not replay it. The dev sink's log lines carry lengths only — no name, address, phone
or message text.

### 14.6 What the owners must supply before a real message can be delivered

Nothing here is blocked on us. See §6 and the final report.

---

## 15. Session 14 (2026-09-04) — analytics + privacy ✅ COMPLETE

**Cloudflare Web Analytics, cookieless, no consent banner, and one finding that changed
the configuration.** Full record: `docs/ARCHITECTURE.md` §8.1–§8.3 and §9.

### 15.1 The finding — ClientRouter makes the beacon count every page three times

This was found by counting the beacon's own outbound reports in a real browser, not by
reading documentation. **One ClientRouter navigation makes three `history` calls**, and
beacon.min.js `2026.9.1` reports each one as a fresh page load with its own `pageloadId`:
two `replaceState(state, '', undefined)` calls, which Astro uses to stash scroll offsets
and which do not change the URL at all, then the real `pushState`. `/` → `/portfolio/`
produced **three** reports, two of them for `/`.

There is no third setting. The beacon exposes no "report a page view" API, and
re-inserting its script does nothing — it finds `window.__cfBeacon` already set and
returns. So the choice is `spa: true` (every page counted about three times) or
`spa: false` (only real document loads counted).

**`ANALYTICS_SPA = false` ships.** Under-counting is a limitation that can be stated;
over-counting is a number that looks like data and is not. Re-measured after the change:
**1 report on the initial document, 0 on each of home→portfolio, portfolio→project, back,
forward and PT↔EN.** The constant is one line and `validate:analytics` fails the build if
the built tag ever disagrees with it.

### 15.2 What was built

| Thing | Where |
|---|---|
| The token, the gate, the two CSP origins, the SPA decision | `src/config/analytics.ts` |
| One `<script>`, or nothing at all | `src/components/site/Analytics.astro` |
| Mounted once, in the head, after `ClientRouter` | `src/layouts/BaseLayout.astro` |
| Eight checks against `dist/` | `scripts/validate-analytics.mjs` |

`PUBLIC_ANALYTICS_TOKEN` unset means **no script is emitted at all**. Configured is still
not enough — `import.meta.env.PROD` must hold too, so `astro dev` and `npm run test:forms`
measure nothing; `PUBLIC_ANALYTICS_IN_DEV=true` is the opt-in for verifying locally. Both
were confirmed in a browser: with a token set and the override absent, the dev server
served **0 beacons**.

The token is shape-checked at build time and a malformed one **fails the build**, because
it is interpolated into an HTML attribute holding JSON — a value carrying a quote would be
markup injection rather than a broken beacon. Tested by passing it a JSON blob.

### 15.3 Privacy — measured, not asserted

- **0 cookies, 0 `localStorage` keys, 0 IndexedDB databases** from analytics, after a full
  visit including a real form submission. The only client-side state on the site is still
  our own `nvf-seen` (`sessionStorage`, the motion loader).
- **The beacon's payload, captured verbatim:** `startTime`, `pageloadId`, `n`,
  `eventType`, `nt`, `location`, `referrer`, `versions`, `bi`, `ntapi`, `siteToken`, `st`.
  Two URLs and timings.
- **It cannot see a form value.** The contact form is `method="post"`, so no field has ever
  been in a URL; a probe submission with a sentinel name, email, phone and message landed
  on `/obrigado/` with **no query string** and a bare `/contactos/` referrer.
- **The backend was not touched.** No adapter, no endpoint, no Turnstile change.
- **No consent UI was added**, because nothing is stored on the reader's device. The
  remaining question is legal, not technical, and it is recorded rather than answered.

**The published privacy policy now over-declares** — it names `_ga`, `_gid`, `_gat`,
`cookie_notice_accepted`, Smartsupp and Google cookies that this site does not set, and
says NVF uses analytics cookies. It was **not** amended: it is binding text (CLAUDE.md §2)
and the mismatch is in the safe direction. It is an OWNER/LEGAL REVIEW item in
`docs/BLOCKED_TODOS.md`, together with reCAPTCHA → Turnstile and whichever provider
answers D17.

### 15.4 Cost

One `defer`, `renderBlockingStatus: non-blocking` script: **10 125 bytes gzipped** over the
wire once per visit, plus **227 bytes** of markup per page. Blocking JS unchanged. The
service worker returns early on any cross-origin request, so the beacon is never cached
and the site is unaffected when it is unavailable.

### 15.5 Verification

`npm run validate:analytics` is new and checks eight things against `dist/`, and **all
eight were tested by breaking them**: the persist attribute removed, `spa` flipped behind
the config's back, a second beacon on one page, a `gtag` snippet restored, the contact form
regressed to GET, `document.cookie` appended to a bundle, a beacon in a build that
configured no token — and one scope test proving the opposite direction, that the preserved
privacy policy naming Google Analytics in prose and linking to Google's own documentation
does **not** fail the build. The tracker scan reads scripts and resource references, never
prose.

It runs inside `npm run verify`, after `validate:seo`.

### 15.6 What was deliberately NOT done

No GA4, no Google Ads, no cookie banner, no consent layer (with nothing non-essential
loading, it would be a mechanism with nothing to gate), no CSP header — the two origins
analytics needs are recorded in `ARCHITECTURE.md` §9 and in `src/config/analytics.ts`, and
a permissive CSP written early looks like protection without being any. No deployment, no
DNS, no media hostname, no email provider, no production Turnstile keys, no GitHub remote.

### 15.7 New file — `docs/BLOCKED_TODOS.md`

Three sections, checkboxes, no dates and no owners: BLOCKED, OWNER DECISION, DEFERRED.
**Update it at the end of every phase.** It is a list of what the build cannot answer for
itself, not a project plan.

---

## 16. Session 15 (2026-09-04) — step 12, the Cloudflare staging deploy ✅ COMPLETE

### 16.1 What exists that did not exist this morning

**A deployed site.** One Worker, `next-vision-films`, on the company account
`c87adf05b555c1ff52167b53030b8e39`, serving from **Workers Static Assets** at

    https://next-vision-films.next-vision-films.workers.dev

No Pages project, no deprecated Workers Sites, no custom domain, no DNS record, no zone
change. The account had no workers.dev subdomain at all; the first deploy registered
`next-vision-films.workers.dev` for it, which is why the hostname repeats the name.

718 static files, a 622.65 KiB Worker script (157 KiB gzipped, 31 ms startup), and exactly
one binding: `env.ASSETS`.

### 16.2 The finding: it needed no secret

The step began expecting to stop and ask for credentials. It did not have to. Every
environment variable this project reads is optional at the point of use, and every unset
one has a defined, safe meaning — the media base falls back to the local mirror, the
Turnstile site key falls back to Cloudflare's documented test key, the analytics token
being absent emits **no beacon at all**, and an absent delivery provider is a refusal
rather than a pretence. So a full staging deployment was possible with zero owner input.

The matrix of required / optional / deferred is `docs/STAGING_DEPLOY.md` §3. The
"required" row is empty, and that is a property of the design rather than a shortcut.

### 16.3 What staging refuses to pretend

`POST /api/contact/` answers `503 {"ok":false,"outcome":"not-configured"}`; a POST with no
`Origin` is `403`; a `GET` is `405`. There is no configuration under which this deployment
reports a message as sent, because the development sink is gated on `import.meta.env.DEV`,
which is **false in every build**. The Turnstile widget renders with the test site key, so
the challenge passes in the browser and delivery still fails — a reader gets an error,
never a thank-you page.

### 16.4 Two configuration facts, both found by doing it

**`compatibility_date` moved 2026-09-01 → 2026-08-31.** wrangler 4.128.0 bundles workerd
1.20260831.1, whose newest supported date is 2026-08-31. A date one day AHEAD of the local
runtime means `wrangler dev` and `npm run preview:cloudflare` execute different semantics
from the deployed Worker — a preview that can only agree with production by luck. Pin it
to the bundled runtime; raise it with wrangler, never alone.

**`_redirects` may not carry a trailing comment on a rule line.** The generated file had
carried `/blog    /portfolio/    301   # ASSUMED — decision D5` since Phase 11. Cloudflare
Pages tolerated it. Workers Static Assets rejects it server-side, at deploy time:

    Invalid _redirects configuration:
    Line 7: Expected exactly 2 or 3 whitespace-separated tokens. Got 8. [code: 100324]

The first deploy uploaded all 519 changed assets and then failed on that line. What makes
it worth a standing rule is that **no local surface catches it** — miniflare parsed the
same file and reported `✨ Parsed 6 valid redirect rules`, so `wrangler dev` is green on a
file the API refuses. `scripts/build-redirects.mjs` now emits the note on its own line.

### 16.5 The commands

    npm run deploy              verify → build → wrangler deploy
    npm run preview:cloudflare  build → wrangler dev  (the BUILT Worker, under workerd)
    npm run deploy:dry          build → wrangler deploy --dry-run

`deploy` is `npm run verify && wrangler deploy`; `verify` already builds, so nothing is
built twice and nothing reaches the edge that has not passed all eleven validators. No
`--config` flag: the build writes `.wrangler/deploy/config.json`, wrangler follows it, and
naming a config by hand would let a stale one ship.

### 16.5b The smoke test, and the two things it found

Against the live URL, everything at HTTP level is green: 22 routes, both localised 404
documents, `/sobre` → `/sobre/` (307) and `/blog` → `/portfolio/` (301), immutable
`Cache-Control` on `/_astro/*`, media and fonts, `405`/`403`/`503` from the contact
endpoint, canonicals and hreflang pointing at the PRODUCTION domain, zero trackers, and no
500 from any request. In the browser: no console messages, one `<h1>`, 0 cookies, 0
localStorage keys, and `/portfolio/` at 375×812 with no horizontal overflow.

Two rendering items came out of it, and **neither is a deployment defect** — both reproduce
against the local built Worker under `wrangler dev`:

1. **The first visit of a session renders blank.** With the opening loader armed
   (`<html data-loader="on">`, first visit per session only), `<html>` computes
   `display: none`, `body` has zero height, and the loader overlay is never hidden —
   sampled at 0, 0.5, 1, 2 and 4 seconds with `readyState: "complete"`. A second load in
   the same session renders normally. No CSS rule sets that `display`.
2. **ClientRouter navigation is untested, not broken.** Synthetic clicks never reached a
   link: at the header link's own measured rect, `elementsFromPoint()` returns `HTML` above
   `NAV.site-nav` and `HEADER.site-header`, with no overlay or `pointer-events` rule to
   account for it.

Both are filed for step 13 in `docs/BLOCKED_TODOS.md`. Also worth knowing for the next
fresh subdomain: the workers.dev certificate took about an hour to issue, during which
every request failed TLS while the deployment was already live at 100%.

### 16.6 What was deliberately NOT done

No custom domain, no DNS, no media hostname (`PUBLIC_MEDIA_BASE_URL` stays unset, so
staging serves the 384 renditions from its own asset store — byte-identical to `nvf-media`
and needing no public bucket). Neither R2 bucket's privacy was touched and
`nvf-source-archive` is not bound, not referenced and not exposed. No production Turnstile
widget or secret, no email provider, no recipient, no analytics token, no CSP header, no
GitHub remote, no CI. No staging-only `X-Robots-Tag`: every canonical points at
`https://www.nextvisionfilms.com/…`, and an artefact that behaves differently from the one
that ships is not a staging artefact.

---

## 17. Session 16 (2026-09-04) — step 13, live QA on the deployed URL ✅ COMPLETE

Measured against `https://next-vision-films.next-vision-films.workers.dev`, version
`dc08d349`. Full record: `docs/STAGING_DEPLOY.md` §8.

### 17.1 Four defects, and what each of them really was

**1. The first visit of a session rendered blank.** `<html data-loader="on">` is the state
flag the bootstrap writes before paint. The overlay div carried an attribute of the SAME
name. `querySelector` walks document order, so `querySelector('[data-loader]')` returned
the ROOT, and `loader.hidden = true` set `hidden` on `<html>` — which the user-agent
stylesheet turns into `display: none` on the entire document. That is why no author rule
could be found to explain it, and why it only ever happened on a session's first document.
The overlay is now `data-loader-overlay`.

**2. Hit-testing resolved to `HTML` above the header.** Two causes stacked. A
`display: none` document has nothing to hit, so defect 1 accounted for most of it. What
survived the fix only reproduced while the browser pane was HIDDEN, which makes Chromium
skip the view transition and leave the root captured. Proved by stubbing out
`document.startViewTransition`: the fallback swap hit-tested correctly. With the pane
fronted, hit-testing is correct before and after every swap. **No site change was made for
this one** — reporting it as a site defect would have been wrong.

**3. The category filter hid nothing.** `[hidden] { display: none }` is a user-agent rule;
`.item { display: grid }` is an author rule. Author wins. So `card.hidden = true` in
`src/lib/portfolio-filter.ts` marked the link current, rewrote the URL and announced a
count while all twenty projects stayed on screen. `.item[hidden] { display: none }` now
sits directly beneath the rule that caused it.

**4. A preloaded font was never used.** Every page preloaded `barlow-500.woff2` while
`body` resolves to weight 400; `document.fonts` reported Barlow 500 as `unloaded` on a
fully painted page. The preload spent bytes no glyph used AND left the real body face to
stylesheet discovery — the exact late load a preload exists to prevent.

### 17.2 Regression checks

Three assertions inside `npm run validate:routes`, against the BUILT output, all three
tested by breaking them: one overlay per page with the unambiguous attribute and no
hardcoded root flag; no loaded script querying `[data-loader]`; and an author-level
`[hidden]` rule for `.item` in the built CSS.

The bundle check reads the scripts the PAGES REFERENCE rather than a directory listing.
Its first version failed on a stale pre-fix bundle: **Astro cannot clean `dist/` while
`wrangler dev` holds it open**, so `dist/client/_astro/` had two copies of the same script.

### 17.3 What passed

35 routes and assets 200, both localised 404s, every redirect class, the contact endpoint's
405/403/503, archives rendering their own subsets (ficção 5, corporativo 1), immutable
`_astro` and revalidated documents, canonicals and hreflang on the PRODUCTION domain, zero
trackers, zero cookies, zero localStorage keys, no 500, and no secret in the served HTML or
in any loaded bundle — the contact page ships Cloudflare's test site key. In the browser:
ClientRouter, Back and Forward all swap without a document load, cards and all five filters
and the mobile menu are reachable, filtering yields 20/5/5/1/20, and a direct project URL
at 375×812 renders with no horizontal overflow.

### 17.4 What was NOT verified, and is recorded rather than claimed

The `reduced` and `minimal` motion tiers: `prefers-reduced-motion` cannot be emulated with
the tooling used here. Their code path — the loader never arms — is the repeat-visit path,
which was verified. Two console messages were left alone: Chromium's "preloaded ... but not
used within a few seconds" for both faces (both end `loaded`; they are applied after the
opening hold), and Astro ClientRouter's unhandled `InvalidStateError: Transition was
aborted because of invalid state` on each swap. Every swap completed.



---

## 18. Step 14 — GitHub, CI/CD and handover (2026-09-04)

### 18.1 The repository, and the history it does not carry

`github.com/luisfpires18/nextvision`, private, created by the owner. The public history is
ONE root commit, `Initial Commit`: the long local development history was audit material
for building the site, not a record anyone needs to read, and the owner asked for the
current complete state instead. The old history was tagged locally before the rewrite and
was never pushed. `master` and `dev` were created at the same SHA.

### 18.2 Two Workers, and why staging kept its name

| Branch | Workflow | Worker | URL |
|---|---|---|---|
| `dev` | `.github/workflows/staging.yml` | `next-vision-films` | `https://next-vision-films.next-vision-films.workers.dev` |
| `master` | `.github/workflows/production.yml` | `next-vision-films-production` | `https://next-vision-films-production.next-vision-films.workers.dev` |

Wrangler environments, each declaring an explicit `name`. Explicit, because the default is
to append the environment to the top-level name — which would have renamed the existing
staging Worker out from under every measurement in `STAGING_DEPLOY.md` §8 and step 13's QA.
Those documents describe a specific artefact at a specific URL; repurposing the URL would
have invalidated the record rather than updated it.

The top-level `name` is the STAGING name on purpose: a bare `wrangler deploy` is then a
mistake that lands on staging, and reaching production requires typing the flag. The
dangerous direction is the one that needs the extra word.

Nothing else differs between the environments. Every deferred capability — media hostname,
analytics token, Turnstile keys, contact recipient — is unset in both, because an unset
value already has a defined, safe meaning (rule 19).

### 18.3 The deploy target is decided at BUILD time, and `--env` does not save you

`@astrojs/cloudflare` deploys through a REDIRECTED wrangler configuration: the build writes
`dist/server/wrangler.json` and `.wrangler/deploy/config.json` points wrangler at it. That
file is resolved for ONE environment — a single `name`, no `env` block at all — so
`CLOUDFLARE_ENV` chooses the target and `wrangler deploy --env x` is only a cross-check.

Measured, not assumed:

    CLOUDFLARE_ENV=production npm run build ; wrangler deploy --dry-run --env staging
      -> ERROR "This does not match the target environment"        (the guard works)

    npm run build                           ; wrangler deploy --dry-run --env production
      -> EXIT 0. No error. No warning.                             (the guard is absent)

The second case resolves to the top-level name and would have deployed **production's
branch to the staging Worker**. `scripts/deploy.mjs` closes it: it sets `CLOUDFLARE_ENV`,
reads the built configuration back, and refuses when the resolved name is not the target's.
It was tested by breaking it — `deploy.mjs production --built` against a default build
refuses with the resolved name printed. The Worker names are read out of `wrangler.jsonc`
by a comment-tolerant parser, never copied into the script.

### 18.4 A clean checkout could not build the site

Run on a fresh worktree, which is what CI is: `npm run verify` **failed**. Two generated
inputs are gitignored and neither is in the repository —

- `public/__generated/fonts/*.woff2` — six faces. Regenerable: `npm run fonts:build`
  derives them from the TTF originals in `source-assets/fonts/`, which ARE committed.
- `media/dist/` — 384 renditions, 16.69 MB. **Not** regenerable here: `media:build` needs
  `docs/Smash/` and `source-archive/`, 646 MB, both gitignored. `validate:media` gate G
  requires every rendition unconditionally, so verify reported 0 of 384 and exited 1.

`scripts/media-pull.mjs` restores the mirror from the delivery bucket instead. Read-only:
GET only, no write, no delete, and never `nvf-source-archive`. Every file is checked against
the manifest's SHA-256 and byte length BEFORE it is written, so a restore cannot poison the
mirror from the network, and a file already present but wrong is re-fetched rather than
trusted. It needs a key with R2 *Object Read only*.

The whole CI recipe — `fonts:build`, the mirror, `CLOUDFLARE_ENV=staging npm run verify` —
was then run in the clean worktree and passed, resolving to `next-vision-films`.

The network path of `media:pull` is the one thing NOT exercised: this machine has no R2
read keys. It reuses the SigV4 signer that already uploaded 384 objects and 645.95 MB, and
`getObject` is that signer's `request()` with method GET.

### 18.5 CI that stays quiet until it is given credentials

Two workflow files rather than one with a branch condition: a single file whose `if`
decides which Worker gets overwritten is one typo away from putting `dev` on production.

Both map secrets to job-level `env` and gate every step on `CLOUDFLARE_API_TOKEN != ''` —
the `secrets` context cannot be read from a step `if:`, but `env` can. Until the token
exists both workflows do nothing and pass green with a notice, so the bootstrap pushes
produce no red runs and no broken deploy. Adding the secrets engages the pipeline with no
file change.

Verify gates the deploy because a failing step ends the job. CI deploys the application
only: it never syncs, uploads or deletes anything in R2.

### 18.6 Credentials, and the two defects only a credentialed run could find

Four repository secrets, and the minimum permission for each, are in `HANDOVER.md` §3.
`CLOUDFLARE_API_TOKEN` carries Account -> Workers Scripts: Edit and nothing else — no zone,
no DNS, no R2 write — and the R2 key is Object Read only on `nvf-media` alone. The wrangler
OAuth session CANNOT create either (`403`, code 9109 on `/user/tokens/permission_groups`),
so both were made in the dashboard and entered at `gh secret set`'s hidden prompt. That
detail matters: **PowerShell 5.1 cannot pipe a secret to a native executable** — it prepends
a UTF-8 BOM and appends CRLF, measured at 11 bytes for a 6-byte string, and the BOM survives
a `--body` trim. Git Bash pipes clean. `gh`'s own prompt avoids the question entirely.

Two defects, both invisible until a run had credentials:

1. **`fonts:build` shells out to `python -m fontTools.subset`.** Not an npm dependency, not
   on the runner, so the first credentialed run died with `ModuleNotFoundError` before it
   reached the mirror. The script had always documented the requirement; nothing enforced
   it, because a developer machine that installed it once never notices again. Both
   workflows now install it, version-pinned — subsetting produces bytes, and different
   bytes are a different service-worker precache hash.

2. **`media:pull` had no retry.** A later run fetched 350 of 384 objects and then failed
   with a bare `fetch failed` after 5m39s: one transient socket took the whole staging
   deploy red. Now 30 s per attempt, four attempts, backoff — and a hash mismatch is never
   retried, because those bytes arrived and were wrong.

### 18.7 The branch model, and the protection GitHub Free will not sell

`dev` is the GitHub **default branch**: a clone lands on it, and a branch made in the web UI
forks from it. `master` receives only merges from `dev`. Repository settings allow merge
commits and disable squash, rebase and auto-merge, so the PR button can only produce the
visible merge commit the model depends on.

Branch protection was asked for and **cannot be configured**: for a private repository on
GitHub Free, both `/branches/{b}/protection` and `/rulesets` answer

    403  Upgrade to GitHub Pro or make this repository public to enable this feature.

Confirmed by retrying with an explicit payload — a plan limit, not a token scope. The two
rules that matter are therefore enforced on the CLIENT by `scripts/hooks/pre-push`
(`git config core.hooksPath scripts/hooks`): no deletion of `dev` or `master`, and no push
to either that is not a fast-forward. Tested by breaking it — deletion refused, a real
non-fast-forward to `master` refused, a fast-forward and an unprotected branch both allowed.
`--no-verify` bypasses it deliberately, because a hook that cannot be bypassed locks you out
of your own repository. It protects one machine and is not a substitute for the real thing.

### 18.8 Both Workers, measured

| Branch | Worker | Version | Result |
|---|---|---|---|
| `dev` | `next-vision-films` | `a6b1a246` | run `33920024531`, success, 1m10s |
| `master` | `next-vision-films-production` | `5793e05f` | run `33918496298` from PR #1, success, 1m27s |

Production smoke test: 7 routes 200, a media rendition 200, a missing route 404, the contact
endpoint refusing an Origin-less POST with 403, and canonicals still pointing at
`https://www.nextvisionfilms.com/` — which is what keeps both workers.dev copies from
competing with the live site. No domain, no DNS, no bucket made public.


## 19. Design v2 — Tatiana's identity (2026-10-22) ✅ ON STAGING

Built on `feat/design-v2` from Tatiana's storyboard and recording, after the user approved a
standalone prototype and settled the eight rule conflicts C1–C8. All decisions went with the
recommendation; C7 (American Typewriter) turned out to be leftover stray glyphs. The full
record is `docs/DESIGN_V2_ROLLOUT.md`.

- **Chrome.** `Rail.astro` and `Spine.astro` replace `Header.astro` (deleted). Navigation is
  data: `navigation.yml` items now carry `section` and `showIn: [rail, footer]`.
- **Colour.** The palette comes from the brand guide's p. 10. The old token names alias to
  it. `--brand-ink` stays `#292929` because the install icons are composited on it, and the
  manifest `background_color` follows the new cream `#FFFAEC`.
- **Type.** Barlow Condensed 300 and 900 were added to `build-fonts.mjs`.
- **Brand marks.** Rendered from the owners' logo PDF into `public/brand/`, named only in
  `src/lib/brand.ts`.
- **New route.** `/bts/` and `/en/bts/` (PageId `bts`). They have no meta description, by
  declaration in `page-meta.ts` and `validate-seo.mjs`.
- **Defect fixed.** `data-motion` was lost on every client-side navigation (§3 of the
  rollout doc).
- **Verified.** `npm run verify` is green: routes 14 ok, SEO, analytics, PWA (326 KB of
  20 MB), and media. The opening, the slide (via `getAnimations()`), both Cinema views,
  `?view=list`, BTS, the contact sheet and the phone layout were all checked in a real
  browser.
- **Waiting on the owners or Tatiana:** see `docs/BLOCKED_TODOS.md`.

## 20. Admin dashboard — plan, decisions, and phase A0 (2026-10-22)

The owners want to change the site themselves (the homepage film today, another tomorrow)
without Claude Code. The plan, the content inventory and the A1–A6 decisions are in
`docs/ADMIN_DASHBOARD_PLAN.md`. Nothing of the admin itself is built yet.

**Phase A0 ✅ — content that was code is now data.** Seven files in
`src/content/page-content/` (`home`, `about`, `services`, `contact`, `thanks`, `portfolio`,
`bts`), read through one schema in `src/lib/page-content.ts`:

- **Media keys:** the homepage hero video (`home.json` `heroVideo`), the services lead image
  and collage, the contact banner and the six BTS frames. A key the manifest does not hold
  fails the build.
- **Page prose:** every `v()` literal from `homepage.ts`, `static-pages.ts` and
  `portfolio.ts`, generated from the running modules, so every byte is the same. Those
  modules still export `HOME`, `ABOUT`, `CONTACT`, … with the same shapes, and no call site
  changed. Meta-description selections stay `v()` literals in `page-meta.ts`.
- **Validator:** `validate:data` walks the JSON for `{ text, from, en? }` and still checks
  50 strings word for word, plus 51 translations and both services-lead spellings. The
  counts are the same as before.

**Verified, not assumed.**

- All 75 pages are byte-identical except for the hash of the one client bundle.
- `/servicos/` and `/en/services/` list the same stylesheets in a different order. Vite
  orders the CSS per graph and was already inconsistent across pages. In a real browser,
  every element's computed style is identical to the baseline on both pages.
- `npm run verify` is green.

**One defect, found by that diff.** `portfolio-filter.ts` (browser code) imported
`FILTER_ALL` from `portfolio.ts`. Once that module read the schema, the client bundle went
from 14.6 KB to 240 KB, because it shipped zod and the manifest. `FILTER_ALL` is now
declared in the browser module and re-exported. The bundle is 14.2 KB: 468 B smaller than
before, because the dead portfolio row data no longer ships either.

**Rule:** a browser module never imports from `homepage.ts`, `static-pages.ts`,
`portfolio.ts` or `page-content.ts`.

## 21. Admin phase A1 — login and read-only browsing (2026-10-22)

`/admin/` exists on the **dev Worker only**, behind Cloudflare Access (team
`royal-hall-6f88`, email one-time code, `nextvisionfilmsagency@gmail.com` only). It lists
everything the owners will be able to change, grouped by the five rail sections plus
Definições. Each item shows its fields, with Portuguese and English side by side and media
shown as the picture, next to the real page in a preview frame. Nothing can be edited
yet; that is A2.

- **Not in production, by construction.** The route is *injected* by `nvf:admin` in
  `astro.config.mjs`, only under `astro dev` or `CLOUDFLARE_ENV=dev`. An unset variable
  leaves it out. `validate:routes` reads the server bundle's route manifest and fails a
  dev build without the route, or any other build with it. A `CLOUDFLARE_ENV=prod` build
  was checked: no admin file anywhere in `dist/`.
- **Fails closed.** The Worker verifies the `Cf-Access-Jwt-Assertion` RS256 signature
  against the team's keys, plus audience, issuer, expiry and email, using WebCrypto with
  no dependency (`src/lib/admin/access.ts`). `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` are
  non-secret `vars` on `env.dev` in `wrangler.jsonc`; unset means every request is
  refused. `npm run test:access` (now in `verify`) signs real tokens with throwaway keys:
  22 cases, and only the valid token gets in. It was tested by deleting the audience check,
  which made it fail. Under workerd, a missing token, a forged `alg: none` token and a deep
  path each answered `403` with `no-store`, `noindex` and `X-Frame-Options: DENY`.
- **`astro dev`** skips the check only when the host is `localhost`; `IS_DEV` is false in
  every build.
- **The service worker** now leaves `/admin*` alone, so a signed-in page is never cached
  on a device.
- **Layout tokens** for the edit bay are in `tokens.space.css` (`--admin-*`). Colours are
  mixes of brand ink and cream, so no new hue was added. Checked at 1440 px and 375 px:
  no horizontal scroll, one `<h1>`.

**Measured on the way:** a stopped `wrangler dev` task left its node and workerd processes
running and holding `dist/` (rule 25 again). Stop `wrangler dev` by its process tree, not
by the shell that launched it.

## 22. The admin moves to the live site (decision A8, 2026-10-22)

The owners sign in at **`nextvisionfilms.com/admin`**, not on dev. Only the address and
the carrying Worker change. Saves still commit to `dev`, which stays the preview, and
Publish still merges `dev → master`.

- **Code.** `nvf:admin` now injects the route only under `astro dev` or
  `CLOUDFLARE_ENV=prod`. `validate:routes` requires it in a prod build and forbids it in
  any other, including dev. The Access vars moved to `env.prod` in `wrangler.jsonc`. The
  admin's preview pane shows `PREVIEW_URL` (`https://dev.nextvisionfilms.com`, in
  `src/config/site.ts`), where a saved but unpublished change appears, with a second link
  to the published page.
- **Verified.** A dev build has no admin, and a prod build has it. The prod build under
  workerd answers `403` with no token, a forged token or a deep path; `/` is `200` and
  `/api/contact/` still `405` to a GET. `npm run verify` is green.
- **Outside the repo, done by Luís:** point the Access app at
  `nextvisionfilms.com/admin` and `www.nextvisionfilms.com/admin`, and store the GitHub
  App secrets on `next-vision-films-production` instead of `dev`.
- **To reach production** the change needs a `dev → master` merge, and `master` is 14+
  commits behind `dev`, including all of design v2. Merging ships design v2 to the live
  site as well. That is an owner decision, not a side effect.
- **Done the same day:** PR #2 merged (design v2 live), Access moved to the two live
  hostnames, and the GitHub App secrets were stored on the prod Worker. A test login as
  the App got a token with exactly contents:write, pull_requests:write, actions:read and
  metadata:read, and could reach only `luisfpires18/nextvision`.

## 23. Admin phase A2, slice 1: the owners can edit the page screens (2026-10-22)

The seven page screens (Página inicial, Sobre, Serviços, Contactos, Obrigado, Portfólio,
BTS) are now forms. Texts are edited in Portuguese and English side by side. Media is
picked from the footage already on the site: a still where a still goes, and a video
with a poster for the opening film. **Save** commits to `dev`. The admin then follows
that commit's build, says when the preview is ready, and reloads the preview pane.
Branch `feat/admin-a2-core`.

- **Edited where it appears, not where it is stored** (`src/lib/admin/fields.ts`). The
  About page's title lives in `home.json`, so one screen can write two files. Strings
  the current design does not render (home `workLineA/B`, `workBodyB`, `ctaPortfolio`,
  `servicesLead`, `aboutBodyB`; portfolio `more`) and the WordPress excerpts are not
  offered. Three fields are shown **locked**, with the reason in the owners' words: the
  services lead (it must spell the three highlighted phrases), the copyright line, and
  the contact consent sentence.
- **One commit or none** (`commitFiles`, Git trees/commits/refs API). Before writing,
  every file is checked against the blob SHA the form was opened on, and the branch moves
  fast-forward only. So a save that raced another one is refused with "Esta página foi
  alterada entretanto…", and the other change survives. After a save, the response
  carries the new blob SHAs (git's own `blob <n>\0` SHA-1, computed in the Worker), so a
  second save without reloading is not a false conflict.
- **Rules, server-side** (`src/lib/admin/edit.ts`): only offered fields; a locked or
  unknown field is refused, never ignored; both languages are required; a changed
  Portuguese text gets `from: owner:YYYY-MM-DD` (decision A2), while an English-only edit
  keeps the archived source. Then the build's own zod schema runs, which now also
  rejects a video where a still goes, or a video without its poster.
- **`validate:data`** accepts `owner:` strings as the owners' copy and counts them;
  archived strings are still checked word for word.
- **Endpoints** live under `/admin` so Access covers them: `POST /admin/api/guardar/`
  and `GET /admin/api/estado/`, both prod-only like the page.
- **Tested.** `npm run test:admin` (in `verify`) has 20 checks: the edit rules; the App
  JWT really signed with a generated key and refused with another; token reuse; one-commit
  saves; stale-file and racing-push refusals; a build followed from queued to completed.
  Mutation-tested on the locked-field rule. It caught a real bug before any browser did:
  a top-level field such as `heroVideo` could not be saved.
- **Clicked through** under `astro dev` against `npm run mock:github`: changed the
  opening film and a line, saved, preview ready; saved again without reloading; conflict
  refused with the owner's text kept; the About screen saving two files as one commit; an
  empty English field refused by name. Every field on all seven screens matches the stored
  value on load, so no page starts "changed".
- **Two defects found that way:** the media list hid project posters, which are real
  stills (and an absent current value would have made the browser silently select
  another picture); and the conflict message was overwritten by the change counter.
- **Measured under workerd:** a POST refused with its body unread made wrangler's local
  proxy drop the next connection ("Error inside ProxyWorker: Network connection lost").
  The Worker itself answered correctly. The save endpoint now reads the body before any
  refusal, as `/api/contact/` does.

**Local run:** put `GITHUB_API_URL=http://127.0.0.1:8790` in `.dev.vars`, run
`npm run mock:github`, then `npm run dev`. It honours the override only under `astro dev`.

**Not yet verified:** a real save against GitHub. It needs this branch on the live
Worker, which means a merge into `dev` and then a `dev → master` merge.

**Verified live after PR #3 merged:** the first real save, from the Next Vision login on
the Thank-you page, made commit `c0e429b` on `dev`. It was authored by
`nvf-admin-luisfpires18[bot]`, with one parent and one file (`thanks.json`), and the PT
title was recorded as `owner:2026-10-22`. Its dev build sat queued for minutes because
GitHub reported Actions in "degraded performance", which is outside this project. Decision
**A9** followed: no undo button, a mistake is fixed by editing again.

## 24. Admin phase A3: the owners publish (2026-10-22)

`/admin/publicar/` lists what is saved but not yet live, in the owners' words (page,
fields, when, by whom), with a link to the preview. **Publicar no site** asks for
confirmation, then opens the `dev → master` pull request (or reuses an open one) and
merges it, then follows the live build until "Publicado". A yellow **Publicar** link in
the navigation carries the count of waiting saves; on a phone it comes right after the
NVF mark, because at the end of the scrolling strip it was off-screen. Branch
`feat/admin-a3-publish`.

**The rule** (`src/lib/admin/publish.ts`): publishing merges ALL of `dev`, so it is allowed
only when every waiting commit is by the admin's App AND every changed file is a
page-content file. Anything else (a developer commit, a commit GitHub cannot attribute, an
App commit touching other files) refuses with the reason: "1 alteração técnica do
programador ainda por rever… Fale com o programador". **Consequence:** while developer
work sits on `dev`, the owners cannot publish. So developer work merges into `dev` only
when it is ready to go live with the next owner publish, or the developer publishes it
first.

**The server checks everything itself** (`POST /admin/api/publicar/`), in order:
1. `dev` is still exactly the commit the page showed.
2. Everything waiting is owner content.
3. The preview of that exact commit built successfully.
4. GitHub merges only at that same SHA.

So a stale page or a race publishes nothing: GitHub refuses the merge with a 409 at a
different head.

**Tested:**
- `npm run test:admin` now has 28 checks, adding the publish rules and the
  compare → PR (reused, not duplicated) → merge → live-build flow against the fake GitHub.
  It also covers a merge refused after a newer save, and a developer commit blocking in a
  real comparison. Mutation-tested on the block rule (3 checks fail without it).
- Clicked through under `astro dev` against `npm run mock:github`:
  - The empty state.
  - A save listed while its preview builds, with no button.
  - Button, confirm, "Publicado", and the change on `master` with nothing left waiting.
  - A developer commit (`POST /__mock/push`, a test-only mock endpoint) blocks the
    screen, and the endpoint refuses it directly too, as it does a stale review. The
    developer file never reached `master`.
- The prod build under workerd answers 403 to every unauthenticated or forged call to
  the new endpoint and pages.

**Not yet verified:** a real publish. It needs this branch live (dev, then a
`dev → master` merge done by the developer, because this branch is itself technical
work that would block the owners' button). After that, the first real owner publish
releases the two Thank-you saves already on `dev`.

**Live after PR #4 merged directly (`99c496f`)** at the developer's request. Nothing was
left waiting on `dev`.

## 25. Admin phase A4: new videos and images from the admin (2026-10-22)

Every image or video field on the seven page screens has **"Carregar novo ficheiro…"**.
The owner chooses a file. For a film, they mark the loop's start, end and cover frame on
the LOCAL file, with buttons or typed seconds; the typed seconds are the fallback when the
browser cannot play the format, as with some ProRes `.mov`. The file uploads in 20 MB
parts with a progress bar. The admin then reports, in order: received → processed →
preview ready. Earlier requests show next to their field, with the reason when one failed.
Branch `feat/admin-a4-media`.

**The chain** (design: `ADMIN_DASHBOARD_PLAN.md` §4.1, revised):
1. **Upload.** Browser → prod Worker → **private** `nvf-source-archive` under
   `uploads/<date>/<id>/<name>`, as an R2 multipart upload through a new `SOURCES`
   binding on `env.prod` only. The id is made by the server, and every key is checked
   against that exact shape (`uploads.ts isUploadKey`), so nothing can be written
   elsewhere. Parts are streamed, never buffered. The size limit is 2 GB (A5).
2. **Request.** `POST /admin/api/media/` checks it against the screen's fields: right
   kind, unlocked, a 2–30 s window that contains its cover. It confirms the object exists
   with a HEAD, then appends one entry to **`src/data/media-uploads.json`** as one App
   commit. That file is not under `media/` because `/media/` is gitignored whole, which is
   how the original plan's `media/uploads.json` would have silently never been committed.
3. **Ingest.** `.github/workflows/media-ingest.yml`, on push to `dev` touching that file:
   - mints an App token, installs ffmpeg and runs `media:pull`;
   - runs `scripts/media-ingest.mjs`, which downloads the original with the **read-only
     source key**, refuses a still under 1140 px or a film under 1280 px (the site never
     upscales) or a window past the end, encodes with `media-build --only owner/<id>/…`,
     points the field at the new key, and marks the entry ready or failed with the
     owners' reason;
   - uploads renditions **add-only** with `media:sync --execute`;
   - commits as `nvf-admin-luisfpires18[bot]`, so dev.yml rebuilds the preview and
     Publish trusts it. The `[ingest]` marker stops it re-triggering itself, and it
     rebases rather than overwriting if an owner saved meanwhile.
4. **Publish.** It is unchanged in shape. Its allowed files now include the uploads list
   and the media manifest; allowed authors are still the App only.

**`media-build` stage 7/7** builds owner uploads whose source is in
`media/incoming/<id>/`. When the source is NOT there, it **carries the existing manifest
entry over**. Measured: without that rule, a full local rebuild replaces the manifest and
would delete every owner film from the site.

Keys: `owner/<id>/hero` for a film (its cover is `…/hero/poster`, as the homepage schema
requires, and it gets WebM like other hero clips) and `owner/<id>/image` for a still.
`MediaProvenance` gains `owner`, and `SourceQuality` gains `owner-upload`.

**Tested:**
- `npm run test:admin` has 39 checks, adding the request rules: kind per field, the
  window, keys outside `uploads/` or walking out of it, unsupported types, safe names
  (`Vídeo` → `Video`, a bug those checks caught), duplicate ids, and the publish
  allowlist for processed media.
- **The real ingest script ran on this machine** against the real showreel: the 1280 px
  film encoded (MP4 and WebM at 1280 and 720, plus its cover), the homepage field
  pointed at it, the entry was marked ready, `media:verify` passed, and the site BUILT
  with the homepage referencing the new renditions. A 624 px still was refused with the
  owners' reason, and its field was left unchanged. A full rebuild without the source
  carried the film over (0 encoded, 384 reused). Then everything was restored.
- In the browser, under `CLOUDFLARE_ENV=prod astro dev` (wrangler's local R2) against
  `npm run mock:github`:
  - a 1.6 MB clip with its window marked by the buttons, uploaded, and the request commit
    carrying exactly 3 s + 7 s with the cover at 5 s;
  - a 45 MB file in three parts (20 + 20 + 5 MB), with the typed-seconds fallback;
  - the status chain through to "Pronto";
  - a failed request shown next to its field with its reason.
- The prod build under workerd answers 403 to every unauthenticated or forged call to
  the five admin APIs, and `/` is 200, `/api/contact/` 303 throughout.

**Not yet verified, only possible live:**
- the R2 binding deploys with CI's Cloudflare token (if the prod deploy fails at the
  binding, that token needs R2 permission);
- `nvf-ci-media` can WRITE and `nvf-ci-sources` can READ;
- `actions/create-github-app-token` with the Actions secrets;
- ffmpeg on the runner;
- a real end-to-end upload.

The first real upload should be a small film for one field, followed on GitHub Actions.

**Live, 2026-10-22.** The first prod deploy of A4 failed safely: the deploy token
`nvf-github-actions-deploy` had no R2 permission, so wrangler could not validate the new
binding (`code 10000`). Luís added *Workers R2 Storage: Read*, and PR #6 deployed. The
first `media-ingest` run hung for over 20 minutes on a stalled Ubuntu mirror;
`f8edb6f` added apt download timeouts and retries. After that, a dispatched run passed
every step: App token, ffmpeg with x264, VP9, AV1 and WebP, and the 384-file mirror via
`nvf-ci-media`. **First real upload:** a 640×368 phone export for the homepage was refused
by name ("precisa de pelo menos 1280 px"), the field was left unchanged, and the App
committed only the status. It exposed one bug, a test asserting the uploads list was
EMPTY, which failed every build after the first real upload (`a47b2bb`).

## 26. One Publicar, straight to production (decision A10, 2026-10-22)

The owners found Save → preview → Publish too many steps. Now:
- **Every change is a draft the moment it is typed**, kept in the browser
  (`localStorage`, in memory if storage is refused), across all pages. The menu shows
  **Publicar (N)**.
- **Publicar** opens a modal listing every draft by page, before → after. Confirming
  writes them all as **one commit to `master`**, which is one production deploy, and the
  modal follows it until "Publicado". "Descartar todos os rascunhos" is there too.
- **Uploads** publish themselves once processed. `prod.yml` now has `paths-ignore` for
  `src/data/media-uploads.json`, so an upload REQUEST or a REFUSED file never deploys;
  only the successful ingest commit (new media plus the field) does. `media-ingest.yml`
  runs on, and commits to, `master`.
- **Removed:** Save, the `/admin/api/guardar/` endpoint, the Publish page and its menu
  badge, the A3 publish rule (`publish.ts`) and its PR/merge/compare GitHub calls,
  `PREVIEW_URL`. The preview pane shows the live page. The `dev` branch and Worker
  remain, for developer work only.

**Freshness is per field, not per file.** Each draft carries the value the field had when
editing began. Publish refuses (409, naming the fields) only if someone else published a
different value for THAT field. Drafts can therefore wait days without being blocked by
unrelated publishes. On reopening a page, a stale draft is dropped and named, and the
field shows the newer live value. `liveValue` is in `edit.ts` and tested.

**Developer rule this creates:** owner edits now land on `master` only, so before every
`dev → master` release, merge `master` into `dev` first.

**Tested:**
- `test:admin` has 32 checks: A3's publish/PR tests removed with their code; added
  per-field freshness and drafts from three files applying as one change.
- Clicked through against the fake GitHub:
  - drafts on two pages, kept across navigation, counted (1) → (2), and restored on
    return;
  - the modal grouped by page; Publicar → ONE commit to `master` with both edits →
    "Publicado";
  - a same-field conflict refused by name, then the stale draft dropped on reload.
- The prod build under workerd answers 403 to every unauthenticated or forged publish,
  the removed save route and the status endpoint, while `/` stays 200.

**Two phone-layout defects found and fixed.** One uploaded file name with no spaces
stretched a `<fieldset>`, which will not shrink below its widest word, and with it the
page, to 1069 px. And the locked Copyright field's text sat beside its floated legend at
0 px wide, which made every page 45 px too wide; this one dated from A2. All five
editable pages now measure 375 px.

**Local tooling note:** wrangler's local proxy drops the next connection after ANY POST
refused with its body unread. That includes Astro's own cross-site form check on pages,
which my code cannot drain. It is local-only (the edge has no such proxy), and the admin
page route now drains bodies itself.

## 27. Admin phase A2, slice 2: the owners can edit projects (2026-10-22)

**Every project now opens as a form** at `/admin/cinema/projetos/<slug>/`, read from its
file on `master` at that moment. The fields are: title, tagline (PT/EN), year, category,
YouTube film, visible/hidden, cover, and opening video. The opening video brings its own
poster as `heroStill`. The edits are drafts, like the page drafts, and the same Publicar
sends both as ONE commit to `master`. Draft names are `projeto/<slug>:<path>[#lang]`.

**A project is MDX, not JSON, so it is edited as a YAML document.** The project rules live in
`src/lib/admin/projects.ts`. It uses the `yaml` package (now a direct dependency, 2.9.0)
to change only the nodes that were edited. Every comment, quote style and `|-` block
survives, and the MDX body is put back as it was. A title edit changes exactly one line.
Eight project files had double blank lines inside the front matter, which a YAML writer
collapses. They were collapsed once, here, so that every file now round-trips byte for
byte. `npm run test:admin` asserts that for all twenty.

**Not editable, deliberately:**
- the slug (it is the URL);
- the date;
- `sourceOfTruth` and `masterRequired`;
- the page blocks (slice 3).

The tagline's English is required unless the project declares `sourceLocale: en`, which
is rule 11 applied in the admin. A YouTube link is reduced to its 11-character id.
Uploading a NEW file for a project field is not wired yet: project fields pick from the
manifest. New projects and the portfolio order come next.

`npm run test:admin`: 40 checks (was 32). The mock GitHub now serves the project files.
Clicked through locally: a project edit published as one commit that changed exactly the
two edited lines.

## 28. Admin: the portfolio order (2026-10-22)

**Cinema → Ordem → Ordem do portfólio** lists every project, as the site sorts it. A row
can be dragged, or moved with its ↑/↓ buttons, which are the keyboard and touch
equivalent: HTML drag-and-drop does not work on phones. The whole order is ONE draft,
`ordem:portfolio`: every slug, first to last. It publishes through the same Publicar.
`applyOrder` (src/lib/admin/projects.ts) numbers the projects 1…n and rewrites only the
files whose number changes, one line each. An order that misses, repeats or invents a
project is refused. If anyone published a different order in the meantime, it is a 409.

**`homepageOrder` is not offered.** No page of the current design reads it (only the
retired Review B homepage grid did), so editing it would change nothing anyone can see.

**The GitHub client checks a commit's files with ONE tree listing** instead of one read per
file. An order change can touch all twenty projects, and a Worker has a budget of
subrequests per request: twenty reads plus twenty checks came close to the free plan's 50.
`listFiles` uses the same listing to find the projects that exist on `master`. The mock
models `GET /git/trees/:ref`.

`npm run test:admin`: 43 checks. Clicked through locally: one ↑ press survived a reload as
a draft (1), and published as one commit that changed exactly two lines in two files. The
screen measures 375 px on a phone.

## 29. Admin: new projects, and uploads onto a project (2026-10-22)

**Cinema → Novo projeto** asks for:
- the title (with a live preview of its address);
- the tagline in PT and EN, or "já está em inglês";
- the year and the category;
- the YouTube link;
- visible or hidden;
- the cover, as an uploaded image.

«Criar projeto» uploads the cover and makes ONE upload request that carries the project
(`create` on the entry in `media-uploads.json`). The server checks every rule first, with
the same function that will write the file (`newProjectText`): title, film, English, and
a slug that is not already taken. The project file is written by `media-ingest.mjs` only
once its cover is processed. That ingest commit is the deploy, so **a project can never
reach the site pointing at a picture that does not exist yet.** A new project goes FIRST
in the portfolio (one before the current first); the owners move it in «Ordem».

**Project covers and opening videos now take uploads too**, through the same panel as the
pages (`UploadPanel.astro`, extracted from the page editor). Targets are
`projeto/<slug>:poster.key` / `:heroVideo`; the ingest applies them with
`applyProjectEdits`, which keeps comments and brings a video's poster as its `heroStill`.
`media-ingest.yml` now runs with `--experimental-strip-types` (it imports
`src/lib/admin/projects.ts`) and commits `src/content/projects/`.

**Three things assumed twenty projects forever. All of them were found by building a 21st
project, not by reading the code:**
1. **The project page, «next project» and «related work» derived media keys from the slug**
   (`projects/<slug>/hero`, `/poster`) instead of reading the keys the project names. A
   changed cover, or any project the admin creates, would have shown the wrong picture or
   failed the build. They now read `posterKey` / `heroKey` / `heroStillKey` from
   `curated.ts`. One project disagreed with the convention: `helder-praia` named the
   retired Review B homepage feature as its `heroVideo`, while its page showed
   `projects/helder-praia/hero`. Its data now names what the page shows. **All 40 project
   pages are byte-identical before and after** (built both, diffed).
2. **The portfolio grid was a hand-composed sequence of exactly 20 slots** and refused to
   build with 21. Past twenty it now starts the sequence again. Twenty projects render
   exactly as composed.
3. `validate:routes` (exactly 20) and `validate:seo` (exactly 40 pages) are now a floor
   of 20 and "2 × the published projects".

**Proved end to end locally:**
- the admin form, the request recorded on the fake GitHub, and `media-ingest.mjs` run on
  that exact entry;
- the new project file written and the build passing every validator with 21 projects
  (the project first in the portfolio and in its category);
- a project-cover upload changing exactly one line of `leonor.mdx`.

All of it was reverted afterwards. `npm run test:admin`: 46 checks.

**Line endings:** several admin files in the last two commits had been saved with CRLF by a
Python edit. Those were put back to LF here. Older CRLF files in `src/components/concepts/`
predate this work and were left alone.

## 30. Admin: services, team, categories and contacts (2026-10-22)

**Every remaining owner-facing entry now opens as a form.** It is the same YAML editing
as projects, through one field list per type in `src/lib/admin/entries.ts`, the generic
`EntryEditor.astro`, and the same drafts and Publicar:

| Type (draft prefix) | Editable |
|---|---|
| Serviço (`servico/`) | name, description, homepage sentence — PT and EN |
| Equipa (`equipa/`) | name, role (PT/EN), portrait (pick or upload), each link |
| Categoria (`categoria/`) | name (PT/EN) — never the slug, which is the archive URL |
| Contactos (`definicoes/site`) | each phone, each social link. **The email stays locked (D2)** |

Rules, all refusals:
- both languages are required;
- a link must be `https://`;
- a phone is digits with its country code, stored without spaces;
- a service's homepage sentence must still be a literal selection from its description,
  in each language. That is decision A44, the schema's own refinement, checked before
  the build would.

**Decision A2 for entries:** any entry the admin changes gets `ownerEdited: YYYY-MM-DD`. The
schemas ignore the extra key. `validate:data` held the two team members' names and roles
word for word against the archive, and it now accepts an entry that declares itself
owner-edited, exactly as `owner:` provenance does for page copy.

`site.yml` had comments at column 0 inside its single list item, which a YAML writer
indents. They were indented once, here, so every entry file round-trips byte for byte.
Only comment lines moved. Team portraits take uploads: the ingest applies them with
`applyEntryEdits`, and `media-ingest.yml` now commits `src/content/team/` too.

`npm run test:admin`: 52 checks. Clicked through locally: a phone on the contacts screen
and a service name on the services screen published as ONE commit. It changed exactly
those two lines, plus each file's `ownerEdited`.

## 31. Admin: a project page's blocks (2026-10-22)

**Every project form now ends with «Blocos da página»: the page below the film, top to
bottom.**
- Add a text, an image, two images, a gallery (2–12 images) or a YouTube film with its
  poster.
- Remove any block, after a confirmation.
- Move any block with ↑/↓.
- Edit each block: texts in PT/EN and their width; images from the site's list, starting
  on the project's own cover; a pair's weight; a gallery's layout.

Quote, credits, spacer and a self-hosted film are shown as fixed blocks. They can be moved
or removed, but not edited here.

**The whole list is ONE draft** (`projeto/<slug>:blocks`), a JSON view of the owner's
choices, drawn by the browser and published like any field. `src/lib/admin/blocks.ts`
writes it back into the YAML and **reuses the existing node of every block that did not
change**, so a moved block keeps the comments that explain it. Every image keeps the
alt-text state it already had anywhere on that page; a new image is `altStatus: todo`.

Refusals: an empty text; a missing English text unless the project is `sourceLocale: en`
(the same rule `validate:data` applies); a gallery outside 2–12; a film with no YouTube
link; a video where an image goes; a fixed block that no longer matches the file.

**Known limit:** if a block whose comment sits above it is moved to the top and then moved
back, the comment may stay at the top of the list. YAML attaches a comment above the
first item to the list itself. The content is unaffected.

**Not built: uploading a NEW image straight into a block.** Blocks pick from the site's
images. A new still goes in through a field that takes uploads (the cover, for example),
and from then on it is in the list.

`npm run test:admin`: 57 checks. Clicked through locally:
- the text moved below the image pair and a film block was added;
- the draft survived a reload and published as one commit;
- that file built, the film rendered as the YouTube embed, and every validator passed;
- the screen fits 375 px.
