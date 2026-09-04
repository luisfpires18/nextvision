# Implementation Plan — Next Vision Films

**Status:** Phases 0, 0.5, 9a and 9b are **COMPLETE**, and Reviews A–E are all APPROVED.
**Every Portuguese route the live site serves is now a real production page** — 38 built
pages, 33 canonical routes, zero placeholders and zero scaffolding. Phase 8 delivered
([`MOTION_REVIEW.md`](MOTION_REVIEW.md)) — the Contact Sheet system + Projection mode (`VISUAL_DIRECTIONS.md` §11),
the real `/` route (`HOMEPAGE_REVIEW.md`), `/portfolio/` with the five preserved category
archives (`PORTFOLIO_REVIEW.md`), and ONE representative cinematic project page at
`/portfolio/leonor/` (`PROJECT_PAGE_REVIEW.md`).

Phases 1–4 were carried out *through* the pages that needed them rather than before them:
tokens, fonts, content entries, the media pipeline and the motion runtime all exist to the
scope the built pages require. **Reviews A-E are approved and Phase 9a is complete: all
twenty project pages are production pages, with zero placeholders and a validator that
fails the build if one returns.** What remains of Phase 9 is the static pages (9b).

> **Correction to the gating.** This plan previously listed R1-R4 as prerequisites *before*
> Phase 1. The owners asked for proposals to react to, not decisions in advance, so the
> order is inverted: the concepts came first and Review A is what resolves R1-R4.
**Date:** 2026-09-01 · **Revision 2** (owner direction change)
**Depends on:** `ARCHITECTURE.md` (decisions) · `DESIGN_REFERENCES.md` (visual directions) ·
`SMASH_MEDIA_INVENTORY.md` (owner source media) · `WEBSITE_AUDIT.md` (content and URL
source of truth) · `CLAUDE.md` (rules).

> ### Revision 2 — what changed in this plan
>
> 1. **Five design review gates (A–E)** now sit between phases. Concept phases produce
>    *one representative artefact* for approval; only after acceptance does anything
>    propagate across the site.
> 2. **A new Phase 0.5 — Source Preservation — runs first**, because the WordPress site is
>    expected to disappear around the end of 2026.
> 3. New phases for **motion**, **PWA** and **EN localisation**.
> 4. A new **Phase 11b** for reviewed SEO/copy proposals, under the amended content rule.
> 5. Phase 1 no longer locks the design system — it builds the **token machinery** that
>    lets the identity change late without a refactor.

---

## Standing rules for every phase

- Existing copy is preserved verbatim. Improvements are **proposals in Phase 11b**, never
  silent edits (`ARCHITECTURE.md` §11.4). **No fact is ever invented.**
- No commit or push unless the user asks.
- No Cloudflare resource is created until the phase that says so, and only with explicit
  approval.
- `PROJECT_CONTEXT.md` is updated in the same change as the work it describes.
- Conventional Commits; one logical change per commit.
- **Every phase that ships UI must satisfy the accessibility floor** (`ARCHITECTURE.md`
  §5.7) and the motion tiers (§16.7). These are not a late clean-up phase.

---

## Phase overview

| # | Phase | Gate | Depends on | Needs owner first |
|---|---|---|---|---|
| 0 | Repository foundation | ✅ **done** | — | no |
| **0.5** | **Source preservation** | ✅ **done** | 0 | R12 still open |
| 1 | Design foundation — tokens, fonts, styleguide | ✅ **Review A APPROVED** ▸ *styleguide route still to build* | 0 | ~~R3~~ resolved **by** Review A |
| 2 | Content model & verbatim migration | ▸ **all 20 projects migrated**; pages, legal, services, team collections still empty | 0.5 | R5 (taxonomy) |
| 3 | Media pipeline & R2 | ▸ *prototype derivatives only; R2 unprovisioned* | 0.5, 2 | **R6, R7, R9** |
| 4 | Motion foundation | ▸ *runtime built to homepage scope* | 1 | no |
| 5 | Homepage concept | ✅ **Review B APPROVED** | 1, 2, 3, 4 | ~~R1, R2~~ · R13 answered by omission (silent hero) |
| 6 | Portfolio organisation & discovery | ✅ **Review C APPROVED** | 5 | R5 answered *provisionally* — work-first, taxonomy unchanged · R8 open |
| 7 | Project page concept | ✅ **Review D APPROVED** ▸ *one designed; nineteen still placeholders* | 6 | R7 |
| 8 | Motion prototype | → **Review E** ⏳ built, awaiting confirmation | 5, 7 | no |
| 9a | Propagate to the twenty project pages | ✅ **done** | Reviews A–E accepted | no |
| 9b | The remaining static pages | ✅ **done** | 9a | D2, D4 surfaced, not answered |
| 10 | Forms & API endpoints | | 9 | **D17, D18, D9** |
| 11 | SEO, redirects, structured data | | 9 | D5 |
| 11b | Reviewed copy & SEO proposals | | 11 | **owner approval per diff** |
| 12 | PWA | ✅ shipped as Phase 15 | 9 | ~~R6~~ — cleared; the vector existed and was never inspected |
| 13 | English localisation | | 9, 11 | **R10** (translations) |
| 14 | Analytics & consent | | 11 | **D8 / D19** |
| 15 | Accessibility & performance hardening | | 9–14 | no |
| 16 | Staging deploy & crawl diff | | 15 | no |
| 17 | Production cutover | | 16 | **D20** (DNS) |
| 18 | Handover documentation | | 17 | no |

Phases 0 and 0.5 are done; Reviews A, B, C and D are all approved.
**Phase 8 is built; Review E is awaiting owner visual confirmation.**
One project page is designed; the other nineteen still render the placeholder, and
propagating them was Phase 9a, now complete. Phases 1–4 are complete *to the scope the
built pages need* and are finished off alongside 9b.

---

# Part I — Foundations

## Phase 0 — Repository foundation

**Objective.** A running, empty Astro project with the agreed structure, strict
TypeScript, CI and secret hygiene.

**Included**
- ~~Astro 5~~ **Astro 7.2.10** + TypeScript strict, `@astrojs/mdx` 8, `@astrojs/sitemap` 3.7.4, `@astrojs/cloudflare` 14.2.6.
- `astro.config.mjs`: `site`, `trailingSlash: 'always'`, `output: 'static'`, i18n (`pt` default, `en` registered), `ClientRouter` wired in the base layout.
- Directory skeleton per `ARCHITECTURE.md` §12.
- `wrangler.jsonc` (no secrets, no account ID), `.env.example`, `.gitignore` extensions.
- CI: install → `astro check` → `astro build`.
- `README.md` stub.

**Excluded** — any page, component, style, content or motion. Any Cloudflare resource,
deploy or GitHub repository. Any design decision.

**Verification**
- `npm run dev` serves a blank page cleanly; `npm run build` and `astro check` pass; CI green.
- `git status` shows no `.env`, no media binaries, no `docs/Smash/`.
- Tree matches `ARCHITECTURE.md` §12.

---

## Phase 0.5 — Source preservation ⚠ **run this first**

**Objective.** Capture everything the current WordPress site holds, before it disappears.
After this phase the project never depends on nextvisionfilms.com being online.

**Included**
- `scripts/archive-source.mjs`:
  - re-fetch and **commit** the raw HTML of all 34 URLs (currently only in a temp folder that will be lost);
  - download all **77** media assets with SHA-256 checksums;
  - write `archive-manifest.json` mapping WordPress URL → archived file → future R2 key — this manifest also **generates the `/wp-content/uploads/*` redirect table** for Phase 11;
  - record YouTube IDs, titles, durations and thumbnail URLs for all 21 videos.
- Upload binaries to **R2 `archive/wordpress/`** (needs the bucket — approval required).
- Verify `docs/content/*` extracts against the fresh fetch; record any drift since 2026-09-01.
- Relocate `docs/Smash/` to an ignored `media-staging/` path — **only with owner confirmation (R12)**, since it is their only local copy.
- Send the owner the master-media request (`SMASH_MEDIA_INVENTORY.md` §6, M1–M9).

**Excluded** — transcoding, renaming, deleting anything from WordPress, any content
modification. The archive is byte-faithful.

**Verification**
- All 34 HTML files committed; all 77 assets archived with matching checksums.
- A diff of the fresh fetch against `docs/content/extracted.json` reports **zero unexplained drift**.
- `archive-manifest.json` resolves every one of the 77 URLs.
- **The build works with the live site unreachable** — tested by blocking the domain.
- No binary in git.

---

## Phase 1 — Design foundation → **Review A**

**Objective.** The token machinery and the type pipeline exist, and there is one page that
shows a visual direction well enough to decide on it. **The design is not locked here.**

**Needs first:** R3 — is typography staying Barlow / Barlow Condensed / Space Mono, or is
Tatiana changing it? The pipeline works either way; the styleguide content depends on it.

**Included**
- `scripts/fonts-build.mjs`: supplied TTFs → subset WOFF2 (Latin + Latin-Ext), correct `usWeightClass` values (Barlow Thin **250**, ExtraLight **275**), `font-display: swap`, preload for the three above-the-fold faces.
- The four token files — `tokens.colour.css`, `tokens.type.css`, `tokens.space.css`, **`tokens.motion.css`** (`ARCHITECTURE.md` §5.8).
- **Theme switching via `[data-theme]`**, so a dark and a cream direction can be compared side by side without a rebuild — this is what makes Review A a real comparison rather than a slideshow.
- `global.css`: reset, base elements, `:focus-visible`, reduced-motion block, `data-motion` tiering.
- **`docs/DESIGN_DIRECTION.md`** — the `frontend-design` plan: palette rationale, type pairing, layout concept, the signature element, and the one justified risk.
- `/styleguide`: every token with its live value, every type step, every colour pair **with its computed contrast ratio**, base components, and the motion tokens demonstrated.

**Excluded** — real pages, the header/footer, content, the portfolio, any final design lock.

**Verification**
- Six WOFF2 files, ≤ 120 KB total, ≤ 60 KB preloaded; no request to any font CDN.
- `/styleguide` renders Portuguese diacritics (`ção ê õ á ü`) and typographic punctuation (`— " " … €`) correctly in every shipped face.
- **No text pair below 4.5:1**; gold appears only as a surface with ink on it.
- Switching `[data-theme]` restyles the whole styleguide with **no component change**.
- `docs/DESIGN_DIRECTION.md` names the signature element and the risk taken.

### ▶ **Review A — Visual direction** ✅ **APPROVED 2026-09-02**

**Outcome:** Contact Sheet as the site system + Projection as a mode inside it. R1 resolved
(both grounds, causally linked to frame scale) · R2 resolved (the hybrid) · R3 provisional —
Barlow / Barlow Condensed / Space Mono hold pending Tatiana · R4 still open.

**Present:** design principles · typography proposal · colour application · motion language
· visual mood · the two-to-three directions from `DESIGN_REFERENCES.md` §8, rendered live
via theme tokens.
**Decide:** R1 (dark vs cream) · R2 (direction) · R3 (typography) · R4 (Tatiana's scope).
**Do not proceed to Phase 5 until accepted.**

---

## Phase 2 — Content model & verbatim migration

**Objective.** Every word and every project lives in this repository as typed, validated
content, with a taxonomy that can be reorganised without touching components.

**Included**
- `src/content.config.ts` — schemas for all collections, including the extended project schema (`ARCHITECTURE.md` §4.2b): multiple `categories`, `tags`, `collections`, `featured`, `homepage`, `order`, `client`, `year`, `roles`, `credits`, `blocks`, `locale`, `translationOf`, `sourceOfTruth`.
- Zod refinement: **`heroStill` is required whenever `heroVideo` is set** — making the current "black box" failure unshippable.
- Migrate verbatim: 20 projects, 5 categories (descriptions exactly as published, `TODO(D3)` noted), 4 testimonials, 4 services, 2 team members, 6 page-copy entries, 2 legal pages byte-identical to `docs/content/*.txt`, `settings/site.yml`, `settings/navigation.yml`.
- `previousSlugs` on categories so renaming generates a redirect automatically.
- `src/i18n/pt.ts` for UI strings; **`en.ts` created with keys and no translations**.
- `scripts/verify-content.mjs` — character-level diff against the archive.

**Excluded** — correcting any copy · translating anything · Humanizer on migrated text ·
choosing final category names · rendering.

**Verification**
- `astro check` and `astro build` pass; every category/collection reference resolves.
- `verify-content.mjs` reports **zero character differences** against the archive.
- 20 projects; every `youtubeId` matches `^[\w-]{11}$`; the `dont-let-it-fool-you` anomaly (D6) recorded as `UNKNOWN`, not guessed.
- Renaming a category slug in a fixture generates the expected redirect.
- No sentence exists in `src/content/` that does not exist in the archive.

---

## Phase 3 — Media pipeline & R2

**Objective.** Media is archived, transcoded, optimised and describable in code, with no
binaries in git — and with the source of each asset recorded.

**Needs first:** R6 (vector logo) · R7 (masters) · R9 (current showreel) · R2 hostname.
**Requires approval to create Cloudflare resources.**

**Included**
- Create the R2 bucket; bind the media hostname (**explicit approval**).
- `scripts/media-sync.mjs` — width ladder in AVIF/WebP/JPEG at the §6.4 quality settings, upload, and write `media-manifest.json` with `width`/`height`/`hash`.
- `scripts/video-encode.mjs` — MP4 (H.264 High, `yuv420p`, `faststart`) + WebM, poster extraction, audio stripped for ambient loops.
- **Per-project source selection** recorded in `sourceOfTruth`: masters where supplied, else `Smash/` 1080p, else YouTube. **720p `Smash/` files are used for silent hover loops only — never for a hero** (`SMASH_MEDIA_INVENTORY.md` §4).
- Hero renditions at 2560 / 1920 / 1280 for projects that have masters.
- `src/lib/media.ts` — `imageProps()` / `videoProps()`, the single swap seam.
- Cache headers: originals `max-age=86400`; hashed derivatives `immutable, max-age=31536000`.

**Excluded** — Cloudflare Stream · Image Transformations · re-encoding the YouTube films ·
deleting anything from WordPress · any component that consumes the manifest.

**Verification**
- `media-manifest.json` has real `width`/`height`/`hash` for every referenced key.
- Preview-clip payload drops from ~100 MB to **under 8 MB** total.
- Every video has MP4 + WebM + poster; `ffprobe` confirms `faststart` and no audio track on ambient loops.
- Posters reviewed **visually at 1440 px** — no banding. Compression is not tuned down for a score.
- No image or video binary staged in git; a derivative returns `cache-control: immutable`.
- Every project records a `sourceOfTruth`.

---

## Phase 4 — Motion foundation

**Objective.** The motion primitives exist and are provably clean across navigation, before
any page depends on them.

**Included**
- `ClientRouter` navigation with `transition:persist` on header, footer and the scroll root.
- **Lenis**, initialised once, persisted, single shared RAF loop.
- The **three-tier motion resolver** (`full` / `reduced` / `minimal`) writing `data-motion` on the root (`ARCHITECTURE.md` §16.7).
- IntersectionObserver reveal utility driven by motion tokens.
- The **lifecycle contract** of §16.9: `astro:before-swap` teardown, `astro:after-swap` scroll reset, `astro:page-load` re-init.
- Loader shell — capped at 1.2 s, session-skipped, bypassed under reduced motion.
- A dev-only `/motion-lab` route exercising every primitive.

**Excluded** — GSAP (not yet needed) · designed page transitions · any real page ·
scroll-scrubbed sequences.

**Verification**
- **After 20 back-and-forth navigations:** zero leaked IntersectionObservers, zero orphan RAF loops, zero duplicate listeners (verified in devtools), and heap size returns to baseline.
- Scroll settles in **under 1 s**; no scroll-jacking; native paging, find-in-page and keyboard scrolling all still work.
- `prefers-reduced-motion: reduce` → Lenis off, no loader, transitions ≤ 120 ms; **nothing becomes unreachable**.
- Simulated `saveData` / low memory → `minimal` tier, GSAP never imported.
- Baseline motion JS **≤ 4 KB gz**.

---

# Part II — Design concepts, one gate at a time

> Each phase below produces **one representative artefact**, desktop and mobile, for
> approval. Nothing propagates until the gate is passed.

## Phase 5 — Homepage concept → **Review B**

**Needs first:** Review A accepted · R1, R2, R13 (hero audio).

**Included**
- `BaseLayout`, `Header` (emitted **once**, CSS-driven responsive — killing the 20 duplicate tab stops), `Footer` with accessible names, and a **working language switcher** present on mobile.
- Homepage in the accepted direction: cinematic hero (single video element, `heroStill`, explicit unmute if R13 says so), work-first ordering, YouTube façade, selected projects, testimonials, newsletter markup.
- Desktop **and** mobile, both real, not a scaled desktop.

**Excluded** — the portfolio index, project pages, other pages · working forms · analytics
· propagating the design anywhere else.

**Verification**
- Exactly one `<h1>`; no heading gaps (the current homepage has **no** `<h1>`).
- Under 20 requests; JS + CSS under 100 KB combined.
- The YouTube iframe makes **zero** network requests until play is pressed.
- Reduced motion → poster, no autoplay.
- Keyboard-only pass clean; correct at 320 / 375 / 768 / 1024 / 1440 / 1920 px.
- **Verified on a real mid-range Android**, not only an emulator.

### ▶ **Review B — Homepage concept** ✅ **APPROVED 2026-09-02**

**Outcome:** the direction was approved on a real-browser visual review, with four
targeted fixes applied afterwards — header contrast rebuilt around declared media zones,
the doubled section seam removed, and the Services and About copy reduced by selection.
`HOMEPAGE_REVIEW.md` §15.

Built at `/`. Full record, including the ten questions that need answers before Review C:
[`HOMEPAGE_REVIEW.md`](HOMEPAGE_REVIEW.md).

**Deviations from the plan above, and why**

- **The language switcher does not render.** The rule is that it appears only where a second
  locale has content (A20/A29). Shipping a visible switch to an empty English site is the
  live site's own bug. The component exists; enabling `en` renders it.
- **No testimonials and no newsletter block.** Both are on the live homepage. Both were left
  out to hold text density down, and both are open questions (Q9, D11), not omissions.
- **No sound control.** Every prototype loop is silent by construction, and a control that
  controls nothing is worse than none (R13 / N8).
- **Under 20 requests** is met for code, fonts and the hero; the eight lazy stills take the
  total higher as the reader scrolls. That is the correct trade for a contact sheet.

Present the desktop and mobile homepage in context. Decide: does it read as premium,
cinematic and unmistakably NVF?

---

## Phase 6 — Portfolio organisation & discovery → **Review C**

**Needs first:** Review B accepted · R5 (taxonomy) · R8 (unpublished work).

**Included**
- Implement the chosen taxonomy from `ARCHITECTURE.md` §4.5a, with old slugs redirecting.
- **One index containing all work**, with filtering by category/collection — replacing the current five-separate-archives structure.
- The `ProjectFrame` signature component: 16:9 frame, condensed title, mono metadata, category accent. Hover/focus preview gated on `(hover:hover) and (pointer:fine)`; a **defined still-only state** for projects with no clip.
- Category and collection routes generated from data.
- **Filtering works with JavaScript disabled** (or degrades to showing everything).

**Excluded** — project detail pages · renaming any project slug · publishing the
unpublished pieces unless R8 says so.

**Verification**
- All 20 projects reachable from one page; every existing category URL still resolves (directly or via redirect).
- Filtering is keyboard operable, announced to screen readers, and reflected in the URL.
- Card titles and metadata readable on touch **without hovering**.
- CLS ≈ 0 (dimensions from the manifest).
- Adding a fixture category in data creates its route with **no component change**.

### ▶ **Review C — Portfolio / navigation** ✅ **APPROVED 2026-09-02**

Built at `/portfolio/`, with the five preserved `/categoria-portfolio/{slug}/` archives and
twenty temporary `/portfolio/{slug}/` routes. Full record, including the taxonomy evidence
and the nine questions that need answers before Review D:
[`PORTFOLIO_REVIEW.md`](PORTFOLIO_REVIEW.md).

**Deviations worth stating rather than burying**

- **The taxonomy is unchanged.** Review C recommends *work-first browsing* and explicitly
  does not settle R5 — regrouping the catalogue is a claim about the work, and it is the
  owners' to make. The page is built so that adopting a regrouping later is a content edit.
- **Category descriptions are not shown at all**, because four of the five describe the
  wrong category (D3).
- **The Review B click-to-open overlay is retired**, which changes homepage behaviour. It
  was always documented as a transition that existed only until project routes did.
- **Project pages are scaffolding and say so on the page**, so a reviewer never has to
  guess whether they are looking at finished work.

Present the organisation, discovery and filtering. Decide: taxonomy, labels, ordering,
what appears on the homepage.

---

## Phase 7 — Project page concept → **Review D**

**Needs first:** Review C accepted.

**Included**
- The **cinematic block system** of `ARCHITECTURE.md` §4.6 — at most nine block types: `fullscreen-media`, `media-pair`, `image-sequence`, `text`, `pull-quote`, `video-embed`, `credits`, `metadata`, `spacer`.
- **One** fully realised project page as the reference implementation, chosen for having the best available media.
- Genuinely related work (same category, current item excluded) and prev/next navigation.
- `Ver Tudo` points at the portfolio index (D5), repairing the `/blog` 404.

**Excluded** — building the other 19 pages · a free-form page builder · new block types
beyond the nine · inventing project copy.

**Verification**
- Every block renders correctly at 320 px and at 1920 px.
- Every block has a reduced-motion form; `image-sequence` degrades to a static strip.
- The page reads as a story, not a template — judged at Review D.
- No page links to `studio.youtube.com`.
- A project with **no** hero video still looks finished.

### ▶ **Review D — Project-page concept** ✅ **APPROVED 2026-09-03**

Built at `/portfolio/leonor/`. Full record, including the eight questions that need
answers before Review E: [`PROJECT_PAGE_REVIEW.md`](PROJECT_PAGE_REVIEW.md).

**Deviations worth stating rather than burying**

- **One project, not twenty.** The designed template is selected by a project *having
  blocks*, so the other nineteen keep the placeholder and cannot silently inherit an
  unapproved design.
- **The hero and the player are one screen.** Built separately first; on screen they were
  the same box twice, so they were merged.
- **`credits` is not demonstrated.** No project on the live site publishes credits, and
  inventing or transcribing them is not acceptable.
- **The block schema needed no change** — which was one of the questions this review
  existed to answer.
- **The morph's animation could not be observed here.** Everything else about it is
  verified; the environment runs no `requestAnimationFrame`.

Present one cinematic project page, desktop and mobile. Decide: block set, media rhythm,
credits treatment, how much text a project carries.

---

## Phase 8 — Motion prototype → **Review E** ⏳ BUILT (2026-09-03)

**Needs first:** Reviews B and D accepted. ✅

Full record: [`MOTION_REVIEW.md`](MOTION_REVIEW.md).

**Delivered**
- One **motion token vocabulary**, named for role rather than length — seven durations,
  three easings, four distances. Zero raw durations or easings remain in production CSS.
- **One tier authority.** `data-motion` is written before the first paint by a ~430-byte
  inline bootstrap; CSS and both runtimes read it and never re-derive it. The three
  competing copies of the policy are gone.
- The **frame → film** shared-element transition, rebuilt: exactly one element is named,
  at the moment of intent, on both documents. It was twenty-one snapshot layers to move
  one photograph; it is now two.
- **Smooth scroll narrowed** to desktop fine pointers, dynamically imported, and its frame
  loop stops when the page is still. Blocking JS down 24.8%.
- The **loader in its final form** — armed before paint rather than revealed after it.
- **Hover previews on intent**, one at a time, and keyboard focus never autoplays.
- Touch, keyboard, reduced-motion and `minimal` passes.

**GSAP was NOT introduced.** The claim that nothing on this site is a timeline was
re-tested rather than inherited, and it held.

**Excluded** — WebGL · custom cursors · scroll-jacking · applying motion beyond the built
pages.

**Verification — done**
- `astro check` 0 errors · `astro build` 32 pages · `validate:data` 0 errors.
- 0 `view-transition-name` declarations in the built output; exactly one pair formed per
  navigation across all seven cases, in both history directions.
- 0 animation-frame loops at rest · 0 layout reads per scroll frame · 0 listener leaks
  over ten navigations · 0 video requests from a twenty-frame pointer sweep.
- Blocking JS 14 431 → 10 858 gz; Lenis not fetched at all on touch.

**Verification — still owed, and it needs a human**
- Scroll damping, loader length, dissolve pacing and the morph itself: `MOTION_REVIEW.md`
  §15 is the test list.
- **60 fps on a real mid-range Android**, CLS < 0.05, INP < 200 ms. Deferred to Phase 10
  with the rest of the field measurement; not claimed here.
- Any effect that cannot hold 60 fps is **cut**, and that is recorded.

### ▶ **Review E — Motion prototype** ⏳ AWAITING OWNER VISUAL CONFIRMATION
Validate transitions, scrolling and project interactions live, on desktop **and** a real
phone. Decide: pacing, intensity, what to cut. **The design review phase closes when this
is confirmed** — not before, and propagation waits on it.

---

# Part III — Propagation and launch

## Phase 9 — Propagate across all pages

Split in two once Review E was approved, because the project pages and the static pages
share nothing but the shell and have completely different blockers: the projects were
blocked on media, the static pages are blocked on owner copy decisions (D2, D3, D4).

### Phase 9a — the twenty project pages ✅ **COMPLETE (2026-09-03)**

**Objective.** Every published project is a real production page. Delivered:
`docs/PROJECT_ROLLOUT.md`.

**Done** — the Review D placeholder deleted and its architecture removed · one template
composing itself from content (3 rich / 7 standard / 10 screen-and-metadata, no tier field
anywhere) · 8 hero loops, 1 still hero and 21 editorial stills generated, every width a
downscale · the media source map corrected after it was found to have graded only one of
the two media shelves · aspect ratios derived from the media rather than typed · related
work derived from shared taxonomy, and omitted where it cannot be · `scripts/validate-routes.mjs`
wired into `npm run verify`.

**Verified** — 20 routes emitted, 20 reachable from `/portfolio/` and from their own
category archive, **0 placeholders** · unique self-referencing canonicals site-wide · one
`<h1>` per page · `VideoObject` exactly where a film exists and never where it does not ·
no horizontal overflow at 375 / 768 / 1440 / 1920 on any tier · 0 layout shift on play ·
exactly one element named per navigation · `reduced` and `minimal` remove every loop ·
no-JS navigation complete, including a `<noscript>` route to the film.

### Phase 9b — the remaining static pages ✅ **COMPLETE (2026-09-03)**

**Objective.** Every Portuguese route the live site serves is a real production page.
Delivered: `docs/STATIC_PAGES_ROLLOUT.md`.

**Done** — `/sobre/` with both team members, their real portraits and their socials ·
`/servicos/` with all four service descriptions in full and the source's own gold
emphasis · `/contactos/` with dialable phones, verified socials, `#contactar` and a
production contact form · `/obrigado/` · both legal pages, **derived from the Phase 0.5
archive rather than transcribed** (`npm run legal:build`), with the ten `Navegação`
anchors repointed in-page (D4, mechanics only).

Services and the team moved into content collections, so `/`, `/sobre/` and
`/servicos/` read one source. `BUILT_PAGES` is complete, so no navigation item falls
back to a homepage section. The footer's two legal links returned with the pages.

**Verified** — 38 pages · 33 unique canonicals · **0 placeholders** · **0 horizontal
overflow across 30 page × viewport combinations** (375 / 768 / 1024 / 1440 / 1920) ·
exactly one `<h1>` per page and no heading-level gaps · titles preserved verbatim,
including the lower-case privacy title · all ten privacy anchors resolve in-page and land
at 76 px under the header · both phones dialable at 44 px · the form inert, labelled,
keyboard-complete and provably non-submitting after six router navigations · all three
motion tiers leave **0 elements hidden** · the mobile menu closes from its own button ·
header contrast measured through the `/contactos/` scroll as dark → media → cream.

**No regression.** `/`, `/portfolio/`, the project pages and the category archives differ
from the previous build in exactly four intended ways.

**Still outstanding from this phase's original scope:** a designed 404 and the offline page
shell. Neither carries preserved content; both are recorded rather than quietly dropped.

**Excluded, as planned** — rewriting legal text · drafting a privacy policy · working
forms · resolving D2 (all **three** addresses surfaced, none silently chosen).

---

## Phase 10 — Forms & API endpoints

**Hard-blocked on:** D17 (provider + recipient), D18 (newsletter destination), D9 (consent required?).

**The frontend already exists.** `src/components/site/ContactForm.astro` ships the live
form's field structure exactly, with real labels, a honeypot and no `action`. Turning it
on was `CONTACT_FORM.enabled` in `src/config/site.ts` plus the route it named — no markup
changes (`docs/STATIC_PAGES_ROLLOUT.md` §5).

**Included** — `POST /api/contact`, `POST /api/newsletter` as `prerender = false` routes ·
**Turnstile** + honeypot + timing check + edge rate limiting · shared Zod validation ·
contact success → 303 to `/obrigado/` · newsletter behind a provider interface that
**returns an explicit error rather than pretending to succeed** when unconfigured · both
forms work with JavaScript disabled.

**Excluded** — reCAPTCHA · any database · marketing automation · editing the privacy policy.

**Verification** — a test submission reaches the confirmed recipient · works with JS off ·
honeypot and timing rejections work · missing Turnstile token rejected server-side · rate
limiting triggers · no secret in client bundles or git.

---

## Phase 11 — SEO, redirects, structured data

**Included** — self-referencing canonicals on **every** page including the five category
archives · title pattern preserved · `og:image` on `/` and the portfolio index ·
`og:description` on all 20 project pages · JSON-LD `Organization`, `WebSite`,
`BreadcrumbList`, **`VideoObject` per project** · one sitemap including category archives ·
the full redirect table (§11.2), with `/wp-content/uploads/*` generated from the Phase 0.5
archive manifest · `scripts/verify-routes.mjs`.

**Excluded** — changing any slug · writing new copy (that is 11b) · `hreflang` for EN until
Phase 13 · submitting to Search Console.

**Verification** — **28 routes return 200; every redirect lands where the table says; zero
unintended 404s** · structured data validates clean · sitemap contains exactly the canonical
set · `/blog` 301s to the portfolio · a known `/wp-content/uploads/…` URL 301s to R2.

---

## Phase 11b — Reviewed copy & SEO proposals

**Objective.** Improve titles, descriptions, headings and metadata **as approved diffs**,
under the amended rule (`ARCHITECTURE.md` §11.4).

**Included** — proposed diffs for page titles, meta descriptions, H1/H2 structure, service
copy, project copy, internal linking, structured data, image alt text, portfolio metadata.
Each presented **against the archived original**.

**Excluded** — applying anything without explicit per-item approval · inventing facts ·
keyword stuffing · corporate filler · touching legal text · editing the archive.

**Verification** — every change traces to an approved diff · the archive is unmodified ·
a read-aloud check confirms the copy still sounds like a premium creative film brand ·
`verify-content.mjs` reports **only** approved differences.

---

## Phase 12 — PWA

**Needs first:** R6 (vector logo).

**Included** — manifest generated from colour tokens · icons 192 / 512 / **maskable 512** /
`apple-touch-icon` 180 from the vector logo · `@vite-pwa/astro` service worker with the
§17.3 strategy table · designed `/offline/` page (**new copy — Humanizer applies**) ·
prompt-to-update toast.

**Excluded** — push notifications · background sync · **caching any video** · auto-reload
on update.

**Verification** — installable on Android Chrome and desktop; correct iOS icon and splash ·
offline page appears with the network off · **no video is ever served from cache** ·
`navigator.storage.estimate()` **under 20 MB** after browsing the entire portfolio · update
prompt appears on a new deploy and never auto-reloads · Lighthouse PWA checks pass.

---

## Phase 13 — English localisation

**Needs first:** R10 — who writes the translations, and when.

**Included** — `/en/` routes with **localised page slugs and identical project slugs**
(§10.1) · a language switcher linking to the current page's equivalent, operable by
keyboard and touch, **visible on mobile** · explicit PT fallback that is *reported* in the
build, never silent · reciprocal `hreflang` + `x-default` · localised metadata · `/en/homepage-english/` → `/en/`.

**Excluded** — writing or machine-translating any content · exposing EN pages that have no
content · translating project slugs.

**Verification** — the switcher appears **only** where the target has content · every EN
page has reciprocal `hreflang` and a self-canonical · the build reports every fallback ·
**no empty EN page is reachable** — the exact failure of the current site · PT is unaffected.

---

## Phase 14 — Analytics & consent

**Hard-blocked on:** D8 / D19.

**Included** — Cloudflare Web Analytics (cookieless) baseline · a consent layer defaulting
to **loading nothing non-essential** · if GA4/Ads are kept: a banner with Consent Mode v2
`denied` defaults, tags only after opt-in, and a way to change the choice · a written list
of every third party the site contacts and when, handed to the owner.

**Excluded** — **writing or amending the privacy policy** · any tag firing before consent ·
server-side tagging.

**Verification** — with no consent, a network trace shows **zero** Google requests on every
page · YouTube contacted only after play is pressed · declining leaves no non-essential
storage · the third-party list matches an actual trace.

---

## Phase 15 — Accessibility & performance hardening

**Included** — axe pass on every route in both locales · manual keyboard pass · screen
reader pass on header, project frame, filtering and both forms · contrast re-verified
against shipped CSS · Lighthouse on homepage, portfolio index and a project page · motion
verified on a real mid-range Android · fixes.

**Excluded** — compressing portfolio imagery for a score · removing motion purely for
metrics (cut effects at Review E instead) · new features.

**Verification** — **zero** axe violations at WCAG 2.1 AA on all routes · every interactive
element keyboard reachable with a visible focus ring · no text pair below 4.5:1, no UI
boundary below 3:1 · Lighthouse ≥ 95 / 100 / 100 / ≥ 95 · **LCP < 2.0 s, CLS < 0.05,
INP < 200 ms** · homepage transfer **< 1 MB** including the hero's initial range · hero
range ≤ 2.5 MB desktop, ≤ 1.2 MB mobile · reduced-motion and `saveData` paths verified by hand.

---

## Phase 16 — Staging deploy & crawl diff

**Included** — deploy to a preview hostname (**approval**) · security headers including CSP
· crawl the live WordPress site **and the Phase 0.5 archive** against staging; diff URLs,
titles, headings, canonicals and body text · reconcile every difference as intended or a
bug · owner review on real devices.

**Excluded** — DNS changes · touching WordPress · content changes without an owner decision.

**Verification** — the diff lists **only** intended differences, each traceable to a
documented decision · all 34 audited URLs accounted for: preserved, redirected, or
deliberately gone · correct on a real iOS **and** a real Android device · CSP produces no
console violations during a full click-through · owner signs off in writing.

---

## Phase 17 — Production cutover

**Hard-blocked on:** D20 — nameservers are `ns1/ns2.digiupcloud.pt`, controlled by digiUP.

**Included** — lower DNS TTL · full WordPress backup · freeze WordPress edits · nameserver
change (**owner-executed or explicitly authorised**) · verify TLS, HSTS, redirects, headers
· resubmit the sitemap · monitor for 30 days · keep WordPress available but unlinked for a
defined rollback window.

**Excluded** — deleting the WordPress site or its media · changing the registrar ·
**touching MX records**.

**Verification** — all routes 200 over HTTPS on the live hostname · every redirect correct
in production · **MX unchanged and a test email still arrives** · contact form delivers from
production · no Search Console coverage spike within 14 days · a tested rollback path exists
for the whole window.

---

## Phase 18 — Handover documentation

**Included** — `docs/CONTENT_GUIDE.md` in plain language with screenshots: add a project,
replace an image, upload a video, change a service, change navigation, change contact
details, **change a design token**, **add an English translation** · `README.md` with
commands and troubleshooting · final `PROJECT_CONTEXT.md` update · a recommendation and
effort estimate for the git-backed CMS option.

**Excluded** — installing a CMS · Cloudflare dashboard training beyond the workflows.

**Verification** — the owner adds a test project end to end from the guide alone, unaided ·
every README command runs clean on a fresh clone · **no documented workflow requires editing
a component**.

---

## Explicitly out of scope for this whole plan

Blog · site search · e-commerce · client login or gated deliveries · booking · a CMS
installation · redesigning the logo · WebGL/3D · custom cursor · migrating email ·
changing the registrar · Cloudflare Stream · push notifications.

Each would be separate, scoped work.
