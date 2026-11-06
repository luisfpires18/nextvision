# CLAUDE.md — Next Vision Films

Stable instructions for **every** Claude Code agent working in this repository.
Read this file before doing anything else. If a request appears to conflict with a rule
here, say so and ask before proceeding.

**Then read `.ai/WORKFLOW.md`, `.ai/PROJECT.md` and `.ai/STATE.md` before acting.** Follow
linked Issues, PRs and task-specific references, and report missing access instead of
guessing. This file wins on content, media, motion and deployment.

For an approved task, publish results or blockers to its Issue or PR before ending, and
return the link. Factual reporting is already part of the handoff, even when a decision is
pending, so do not ask whether to post it. `.ai/WORKFLOW.md` sets the report and approval
boundaries; this does not permit changing scope or starting corrections without approval.

---

## 1. Project purpose

Rebuild **https://www.nextvisionfilms.com** (Next Vision Films / "NVF", a Portuguese
audiovisual production company) as a **premium, cinematic, interactive, visually
distinctive website for an international creative film production company**.

> **Direction change, 2026-09-02.** This was originally scoped as replication plus
> modernization. The owners have since confirmed that **the current website is NOT the
> visual target.** Its layout, navigation and aesthetic may be replaced entirely.

**The current site remains the source of truth for:** existing projects, portfolio data,
factual company information, media references, and legal/content material.

**It is not the source of truth for:** layout, navigation, section structure, or visual
language.

Explicitly **not wanted**: a traditional corporate website · a generic WordPress or
Elementor aesthetic · standard template sections · generic cards everywhere · excessive
text · generic AI-generated visual language.

The owners must be able to request changes, new projects, new images, new videos, new
pages or design improvements **without an architectural rewrite**. Every technical
decision is judged against that requirement.

---

## 2. Content preservation rule (STRICT — highest priority)

**The live website is the single source of truth for content.**

Do **NOT**:

- invent marketing text
- rewrite, "improve", shorten or expand existing copy
- fix typos, grammar, casing or punctuation in existing copy
- add testimonials, clients, projects, awards, statistics or contact details
- substitute placeholder / lorem text where real content can be retrieved
- translate existing copy unless explicitly asked

If something cannot be discovered, write **UNKNOWN**. Never guess.

Existing copy — including its inconsistencies — is canonical. Known content problems are
catalogued in `docs/WEBSITE_AUDIT.md` §9 as *observations for the owners*, not as things
to silently correct. Changing any of them requires explicit owner approval.

Verbatim copies of the long legal pages live in `docs/content/`. Treat those files as
read-only source material. **The archive is never edited** — it is the baseline every
later diff is measured against.

### 2.1 Amendment, 2026-09-02 — reviewed SEO/copy improvements

The rule is relaxed in a **bounded** way. It is not repealed.

**Still absolute:** the original text is preserved and archived verbatim · **no fact is
ever invented** · nothing is rewritten *now* · the archive is never modified.

**Now permitted — later, and only as explicit reviewed proposals:** page titles · meta
descriptions · H1/H2 structure · service copy · project copy · internal linking ·
structured data · image alt text · portfolio metadata · English translations.

**How:** every proposal is a **diff against the archived original**, presented for owner
approval, never applied silently. Copy must read as a premium creative film brand — **no
keyword stuffing, no corporate filler, no SEO boilerplate.** Structural fixes that change
no words (adding a missing `<h1>`, correcting a heading level) are not copy changes.

Scheduled as Implementation **Phase 11b**. See `docs/ARCHITECTURE.md` §11.4.

---

## 3. Humanizer skill rule

The Humanizer skill is **only** for genuinely new copy that we deliberately author.

**Never** run Humanizer — or any rewriting/summarizing pass — over text copied from the
existing Next Vision Films website. See §2.

---

## 4. Fonts and visual identity

> **Review A was approved on 2026-09-02, and Tatiana's design v2 replaced the visual layer
> on 2026-10-22** (`docs/DESIGN_V2_ROLLOUT.md`). What still waits on Tatiana or the owners
> is listed in `docs/BLOCKED_TODOS.md`.

**Fonts in use** — self-hosted, eight faces built by `scripts/build-fonts.mjs`:

- **Barlow** · **Barlow Condensed** · **Space Mono**

Rules:

- Do **not** substitute visually similar faces for these (no Inter, no Roboto Condensed,
  no IBM Plex Mono).
- Do **not** assume which weights exist — inspect the files. They are all **static TTF,
  no variable fonts**, and Barlow's Thin is `usWeightClass` **250** and ExtraLight **275**,
  not the usual 100/200. Full measured inventory: `docs/PROJECT_CONTEXT.md` §7.1.
- **Self-host.** Never Google Fonts or any third-party font CDN.
- **These are not permanently approved typography.** Typography may change after
  owner/design review. Build so that a change is a token edit, never a refactor.

**Colour:** the brand guide's palette, from design v2 — green `#124A43`, blue `#2B3990`,
red `#D52B27`, orange `#F36E21`, yellow `#F9C914`, cream `#FFFAEC`, with ink kept at
`#292929`. `src/styles/tokens.colour.css` is the authority and records the contrast limits.
The palette sampled from `colors.png` (`docs/PROJECT_CONTEXT.md` §7.2) is superseded.

**Binding rule that outlives any design decision:** colour, typography, spacing **and
motion** are all CSS custom properties in `src/styles/tokens.*.css`. **No component may
contain a raw hex, px size, font family, duration or easing.** See
`docs/ARCHITECTURE.md` §5.8.

---

## 5. Frontend / design skill requirement

Frontend and design work must use the official Anthropic **`frontend-design`** skill.

Purpose: avoid generic AI-generated website aesthetics and produce a polished,
professional production website.

**Status:** installed as a project skill in `.claude/skills/frontend-design`, from Anthropic's
`anthropics/skills`, and verified loaded on 2026-11-06. `.claude/settings.json` also enables
the plugin `frontend-design@claude-plugins-official`, but enabling is not installing: on that
checkout the plugin never loaded. Where the skill conflicts with this file, for example by
inviting new copy or a new palette, this file wins.

Verify it still loads at the start of any frontend session — invoke it, do not merely
check the config. If it is missing, **stop and tell the user** rather than proceeding
without it.

Design references, extracted principles, anti-patterns and the candidate visual
directions live in `docs/DESIGN_REFERENCES.md`. Read it before any visual work.

---

## 6. Infrastructure targets

All in place. Do not create new infrastructure without an explicit request:

- **Hosting:** Cloudflare Workers with Static Assets, two Workers on the company account (§10)
- **Media storage:** Cloudflare R2, `nvf-media` (delivery) and `nvf-source-archive` (private
  sources), used through the S3-compatible API. Neither bucket is public
- **Source control:** GitHub, `luisfpires18/nextvision`, public since 2026-10-29

Media rules:

- Images, videos, thumbnails, project assets and other large files **must not** live
  permanently in the Git repository.
- Adding or replacing media later must be simple — a media manifest / structured data
  layer, not hardcoded asset paths scattered through components.
- The owners asked for an admin workflow, and it exists: `nextvisionfilms.com/admin`, which
  commits to the same content files (`docs/ADMIN_DASHBOARD_PLAN.md`). There is no CMS or database.

---

## 7. Git conventions

- Meaningful commits; one logical change per commit. Conventional Commits style
  (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).
- Clean, linear history. Branch when a change is non-trivial; work directly on the
  default branch only for small documentation edits.
- Keep repository documentation current — update `docs/PROJECT_CONTEXT.md` in the same
  commit as the work it describes.
- **Never commit secrets.** No Cloudflare account IDs paired with tokens, no R2 access
  keys, no API keys, no `.env` files. `.env*` is gitignored; keep it that way.
- Never commit large media binaries. They belong in R2.
- Commit or push only when the user asks. A clear instruction to start a named, approved
  Implementation Issue is that ask, for commits and pushes to its feature branch and its
  draft PR (`.ai/WORKFLOW.md`). Merging into `dev` or `master` deploys, and always needs its
  own instruction.

---

## 8. Never invent missing content

Restating, because it is the rule most easily broken:

If a value is not discoverable — a client name, a date, a video source, an email
address, a service description — write `UNKNOWN` and surface it as an open question.
Do not fill gaps with plausible-sounding text.

---

## 9. Where project documentation lives

| File | Purpose |
|---|---|
| `CLAUDE.md` | This file. Stable rules for all agents. |
| `.ai/WORKFLOW.md` | The shared workflow: planning, Issue-start authorization, evidence, independent review, releasing. |
| `.ai/PROJECT.md` | Project facts, test commands and the documentation index for that workflow. |
| `.ai/STATE.md` | Pointers: current task, branch positions and setup blockers. |
| `docs/PROJECT_CONTEXT.md` | Living state: decisions, phase, completed work, open questions. **Update as work progresses.** |
| `docs/WEBSITE_AUDIT.md` | Complete audit of the existing site (structure, content, media, design, interaction, technical). |
| `docs/ARCHITECTURE.md` | Technical decisions and rejected alternatives. Framework, content, media, motion, PWA, i18n, SEO, repo. |
| `docs/IMPLEMENTATION_PLAN.md` | Phased build with review gates. Each phase: objective / included / excluded / verification. |
| `docs/DESIGN_V2_ROLLOUT.md` | Design v2 (Tatiana). The rail, spine, slide, opening, five sections, BTS, the guide palette, how C1–C8 were resolved, and what waits on the owners. |
| `docs/DESIGN_REFERENCES.md` | Reference analysis, extracted principles, anti-patterns, candidate visual directions. |
| `docs/VISUAL_DIRECTIONS.md` | Review A. The three directions, the approved refinement, and why. |
| `docs/HOMEPAGE_REVIEW.md` | Review B. Homepage structure, the curated selection, the hero comparison, header contrast, motion, payload, open questions. |
| `docs/PORTFOLIO_REVIEW.md` | Review C. Browsing strategy and the taxonomy alternatives, filter/URL behaviour, composition, legacy routes, navigation, payload, open questions. |
| `docs/PROJECT_PAGE_REVIEW.md` | Review D. The representative project and why, page structure, block usage, the film façade, the frame→project transition, payload, open questions. |
| `docs/MOTION_REVIEW.md` | Review E. The motion principle, the tier contract, the loader, smooth scroll, page transitions, hover rules, mobile differences, measurements, the final tokens, cleanup, and the real-browser test list. |
| `docs/PROJECT_ROLLOUT.md` | Phase 9. All twenty projects: content-depth tier, hero source, blocks, source limitations, master status, generated derivatives, related-work strategy, payload, route validation and the open owner-media questions. |
| `docs/STATIC_PAGES_ROLLOUT.md` | Phase 10. The six remaining Portuguese pages: source used per page, layout approach, the copy the homepage left out, media, the contact form's frontend/backend state, the legal integrity mechanism and the open content questions. |
| `docs/SEO_I18N_ROLLOUT.md` | Phase 11. The PT/EN architecture, the translation rule, why the legal pages stay Portuguese-only, the language switch, the three reviewable copy diffs, the SEO pass, the 404 and offline shell, the service-worker amendment and the new validators. |
| `docs/BLOCKED_TODOS.md` | Everything the build cannot answer for itself: BLOCKED / OWNER DECISION / DEFERRED. **Update it at the end of every phase.** Not a project plan. |
| `docs/MEDIA_PIPELINE.md` | Phase 12. R2 buckets, the derivative pipeline, formats, cache policy, credentials, the private source backup, and **how to add media later**. |
| `docs/SMASH_MEDIA_INVENTORY.md` | Owner-supplied source media in `docs/Smash/`, with quality analysis and project matching. |
| `docs/SOURCE_ARCHIVE.md` | What was preserved from the live WordPress site, and what could not be. |
| `docs/MEDIA_SOURCE_MAP.md` | Per project: WordPress vs YouTube vs Smash, and the preferred source per role. |
| `docs/ROUTE_MIGRATION.md` | Every old URL and what happens to it. |
| `docs/PERFORMANCE_AUDIT.md` | The 2026-10-29 performance audit: Lighthouse baseline, every finding and its fix, the font measurements, what was verified locally, and the after-deploy numbers still to fill. |
| `docs/PWA-ICONS-TODO.md` | Phase 15. The archived vector logo, why the icons are rasterised from the square monogram anyway, and what ships. |
| `docs/HANDOVER.md` | Step 14. How to run, edit and deploy: git flow, the two Workers, what CI needs, a fresh clone, content, PT/EN, media, R2, and what is deployed but unconfigured. |
| `docs/STAGING_DEPLOY.md` | Step 12, a historical record: the first deploy, its environment matrix, the QA, and the `_redirects` defect only a real deploy could find. Its Worker and URL are gone; `docs/HANDOVER.md` is current. |
| `docs/ADMIN_DASHBOARD_PLAN.md` | The owners' admin, BUILT, at `/admin/` on the prod Worker: content inventory, Cloudflare Access login, CI media ingest, admin UI design, phases A0–A5 and decisions A1–A10. Written as the plan, so its status note says what later decisions changed. |
| `docs/content/` | Verbatim content extracts and machine-readable inventories. **Read-only source material — never edited.** |

Read `docs/PROJECT_CONTEXT.md` at the start of every session to pick up where the last
one left off.

---

## 10. Current phase

**Audit ✅ · Architecture ✅ · Phase 0 + 0.5 ✅ · Reviews A, B, C, D, E ✅ ·
Phase 9 ✅ · Phase 10 ✅ · Phase 11 ✅ · Phase 12 ✅ · Phase 13 ✅ ·
Phase 14 ✅ · Phase 15 ✅ · Step 12 staging deploy ✅ · Step 13 QA ✅ ·
Step 14 GitHub + CI/CD + handover ✅ COMPLETE (2026-09-04) ·
Design v2 (Tatiana) ✅ live (2026-10-22) · Owner admin A0–A5 ✅ live ·
Owner feedback round 1, the performance audit and the owner bug round ✅ live (released 2026-11-06).**

**Design v2 replaced the visual layer, and nothing else.** The menu is the rail (five logo
stripes on the right; a bottom bar on a phone), each page wears its section's colour through
`<html data-section>`, sections slide in as view transitions on real routes, the homepage
plays Tatiana's opening once per session, and `/bts/` is new. Every route, string, form
field and validator contract is unchanged. One pre-existing defect was found: ClientRouter's
swap dropped `data-motion` after the first navigation, so every `full`-tier rule stopped
applying; BaseLayout now carries it across. Record: `docs/DESIGN_V2_ROLLOUT.md`.

**The project is on GitHub, with two branches and two Workers.** `luisfpires18/nextvision`,
public since 2026-10-29 (private before that), with history starting from ONE root commit,
`Initial Commit`. The `dev` branch deploys the **`dev`** Worker, `master` the
**prod** Worker (`next-vision-films-production`, which serves the live domain), one verify-gated workflow each (`dev.yml`, `prod.yml`), and they
are two separate files precisely so that no condition decides which Worker gets overwritten.
The prod Worker now carries the live domains `nextvisionfilms.com` and `www.nextvisionfilms.com`
(Custom Domains, found bound on 2026-10-22). Record: `docs/HANDOVER.md`.

**The owners publish to the live site themselves, so `master` does not only receive merges.**
The admin at `nextvisionfilms.com/admin` (prod Worker, behind Cloudflare Access) writes each
Publicar as one commit to `master` through a GitHub App, and `media-ingest.yml` commits
processed uploads there too (decision A10). **Before any `dev -> master` release, merge
`master` into `dev`.** Record: `docs/ADMIN_DASHBOARD_PLAN.md`, `docs/PROJECT_CONTEXT.md` §21–§32.

**Two findings, and neither was visible from reading configuration.** `wrangler deploy
--env prod` against a build made with no `CLOUDFLARE_ENV` exits 0 and deploys to the
top-level Worker, `dev` (measured under the old names `production` and staging) — the target is resolved at BUILD time by the adapter's redirected config, and
`--env` is only a cross-check when the build declared one. And a clean checkout could not
build the site at all: `media/dist/` is gitignored and `media:build` needs 646 MB of
gitignored sources, so `npm run verify` failed at `validate:media` with 0 of 384 renditions.
`npm run media:pull` fetches them from R2, read-only and hash-verified.

**The site is deployed twice, and both Workers have a domain.** Both Workers are on
the COMPANY account (`c87adf05…8e39`), both serve from Workers Static Assets:

| Branch | Worker | URL |
|---|---|---|
| `dev` (default) | `dev` | `https://dev.nextvisionfilms.com` (also `dev.next-vision-films.workers.dev`) |
| `master` | `next-vision-films-production` | `https://www.nextvisionfilms.com` (live; also `nextvisionfilms.com`) |

Renamed 2026-10-22 from `staging` / `production`. The dev Worker was renamed (old `next-vision-films` deleted); the prod Worker keeps its name because the live domains are bound to it. Never rename it.

The first deploy, of what is now the `dev` Worker, needed **no custom domain, no DNS, no secret and no owner input** —
every unset variable already had a defined, safe meaning, which is what made a
zero-credential deploy possible at all. **Deployment is now CI**: push `dev` for the `dev` Worker;
a `dev -> master` merge or an owner's Publicar for `prod`. `npm run deploy:dev` / `deploy:prod` remain
as emergency tooling and both run the full `verify` first, so nothing reaches the edge that
has not passed every step of it. `npm run preview:cloudflare` runs the BUILT Worker
under workerd, which is the only local surface where the asset handler, `_headers`,
`_redirects` and the 404 fallthrough behave as they do in production.

The `dev` Worker refuses the contact form with `503 not-configured` and **cannot be configured into
pretending otherwise**: `IS_DEV` is false in every build, so the development sink cannot
run there. `compatibility_date` moved 2026-09-01 → **2026-08-31** to match the workerd
wrangler actually bundles, because a preview running newer semantics than production is a
preview that agrees with it by luck. One real defect surfaced, and only a real deploy could
find it: **`_redirects` may not carry a trailing comment on a rule line** — Pages tolerated
it, Workers Static Assets rejects it server-side, and miniflare parses the same file
happily, so `wrangler dev` is green on a file the API refuses.

**Step 13 QA is complete, against the deployed URL of the time (2026-09-04).** 35 routes and assets 200, both localised
404s, every redirect class, `405`/`403`/`503` from the contact endpoint, archives rendering
their own subsets, canonicals and hreflang on the PRODUCTION domain, zero trackers, zero
cookies, no 500 and no secret in any served file; ClientRouter, Back/Forward, filters,
cards, the mobile menu and a direct project URL at 375 px all verified in a real browser.

**Four defects were found and fixed, and three of them were invisible to every validator
the project had.** (1) The first visit of a session rendered BLANK: `<html data-loader>`
is the state flag and the overlay div carried the SAME attribute name, so
`querySelector('[data-loader]')` returned the root — first in document order — and
`loader.hidden = true` put `hidden` on `<html>`, which the UA stylesheet turns into
`display: none` on the whole document. That is why no author rule could explain it. (2)
The hit-test anomaly was that same blank document, plus a Chromium behaviour where a view
transition SKIPPED in a hidden pane leaves the root captured — proved by disabling
`startViewTransition` and watching the fallback swap hit-test correctly. Nothing in the
site was changed for it. (3) The category filter hid NOTHING: `[hidden] { display: none }`
is a user-agent rule and `.item { display: grid }` is an author one, so `card.hidden` lost
and every category showed all twenty projects. (4) `barlow-500.woff2` was preloaded on
every page while `body` resolves to weight 400 — bytes no glyph used, and the real body
face left to stylesheet discovery. Record: `docs/STAGING_DEPLOY.md` §8.

**Phase 15 made the site installable, and closed a blocker that was never real.**
`NextVisionFILMS.svg` had been recorded as an un-approved unknown for four phases because
nobody had ever LOOKED at it — `archive:source` fetches only media a page references, and it
is a library asset no page uses. It is a genuine clean vector (737×226, 17 paths, text
outlined, no raster) and its five colours ARE the brand palette. Preserved untouched at
`source-assets/brand/`, with `NVF.png` (2431²), the square monogram the live site already
downscales for its own icons. **The SVG is not the icon source and that is deliberate**: it
is a 3.25:1 wordmark, the square lockup is a different arrangement, and deriving one would
be recomposing the mark. Five icons, ~45 KB, all downscales of `NVF.png`, all deterministic.
Record: `docs/PWA-ICONS-TODO.md`, `docs/ARCHITECTURE.md` §17.

Measured in a real browser, not asserted: first install **271 KB of the 20 MB budget, 0
video**; offline serves the PT shell to a PT route and the EN shell to an EN route while a
page cached before the outage still renders itself; a new `BUILD_ID` **installs and waits**
until the reader's message, and activation deletes all three stale caches; a preview `.mp4`
fetches 200 and is never cached. `validate:pwa` and `icons:check` were tested by breaking
them — 11 defects, 11 caught, **2 of them real and fixed**.

**Every open item is in `docs/BLOCKED_TODOS.md`, and it is updated at the end of every
phase.** Three sections, checkboxes, no dates and no owners.

**Phase 14 gave the site analytics and no consent banner.** **Cloudflare Web Analytics
only** — cookieless, one `defer` script, 10 125 B gz once per visit and 227 B of markup per
page. GA4 and Google Ads are NOT carried over and `npm run validate:analytics` fails the
build if either returns. Nothing is emitted unless `PUBLIC_ANALYTICS_TOKEN` is configured
AND the build is production, so `astro dev` and `npm run test:forms` measure nothing.
Measured after a full visit: **0 cookies, 0 localStorage keys, 0 IndexedDB databases**, and
a probe form submission reaching `/obrigado/` with no query string. **`ANALYTICS_SPA` is
`false`, and that is a measurement, not a default**: one ClientRouter navigation makes
three `history` calls, two of which change no URL, and the beacon counts each as a page
load — so `spa: true` triples every page. The published privacy policy still declares
Google Analytics cookies this site no longer sets; it was NOT amended, because it is
binding text. Record: `docs/ARCHITECTURE.md` §8.1–§8.3.

**The site is bilingual, optimised, and has both error states.** At Phase 11 it had 73 built
pages: 33 Portuguese routes, 31 English, a 404 and an offline shell in each language, and the
five internal concepts, with 52 URLs in the sitemap — exactly the indexable set. Zero
placeholders. With `/bts/` and the owners' new project it is now 75 pages and 54 sitemap URLs
on `dev`, 77 and 56 on `master` (sitemaps counted live on 2026-11-06). Record:
`docs/SEO_I18N_ROLLOUT.md`.

Every page is **one component mounted twice**, once per locale. The two legal documents
are **Portuguese only** and say so in four places, because no approved English translation
exists and machine-translating binding text would publish a claim nobody wrote. The
concept routes at `/__concepts/*` stay.

**Phase 13 gave the contact form a real backend.** `POST /api/contact/` is the ONE route
with `prerender = false` — validation, an Origin check, a 16 KB body cap, the honeypot and
**Cloudflare Turnstile verified server-side on every submission**, then a delivery seam with
four adapters behind one interface. `/obrigado/` is the answer to a POST and never a link;
`validate:routes` fails the build if the page ever links to it. **Delivery itself is not
configured and is not faked**: D17 and D2 are open, so a production submission is refused
with `503 not-configured` rather than reported as sent. Local development needs no account
and no secret — Cloudflare's own test keys, and a sink that logs `NOT DELIVERED` and no
field contents. `npm run test:forms` drives the live endpoint; all three server modes pass.
Record: `docs/ARCHITECTURE.md` §7.

**Phase 12 added the production media pipeline.** `src/data/media-manifest.json` is the
site's only media authority, and every file in it is content-addressed. It held 86 assets,
384 renditions and 16.69 MB at Phase 12. It grows with every owner upload: on 2026-11-06 it
holds **88 assets / 392 renditions / 17.1 MiB on `dev` and 90 / 398 / 19.8 MiB on `master`**.
Both buckets live on the COMPANY account (`c87adf05…8e39`), and Phase 12 filled them with 384
delivery objects in `nvf-media` and 102 source files / 645.95 MB in the private
`nvf-source-archive`. Neither is public — `r2.dev` disabled, no custom domain, because
delivery needs DNS. The empty personal-account buckets are a manual cleanup item. Record:
`docs/MEDIA_PIPELINE.md` §9.

**CI/CD is live, and `dev` is the GitHub default branch.** The workflows use eight repository
secrets (`docs/HANDOVER.md` §3); a push to `dev` runs checkout -> `npm ci` -> fontTools ->
`fonts:build` -> `media:pull` -> `npm run verify` -> deploy. **Branch protection is not
configured**: every branch reports `protected: false` (measured 2026-11-06). GitHub refused it
while the repository was private on the Free plan, but the repository is public now, so that
reason is gone. Until someone sets it, no-deletion and no-force-push are enforced only
client-side by `scripts/hooks/pre-push` (`git config core.hooksPath scripts/hooks`), which
protects only the machine that has it.

**Still not started:** the media hostname (D20) and the NEWSLETTER endpoint (D18). The site's
domains are already bound (above). The site IS installable and IS deployed to both Workers.

Do not redesign, touch DNS, attach a domain, make a bucket public, or create a database or
CMS until the user explicitly says to. Deploying is now a push; deploying to PRODUCTION is
a deliberate `dev -> master` merge or an owner's Publicar in the admin (decision A10), and
nothing else may trigger it.

Standing rules that outlive this phase:

1. **The WordPress site is already preserved** (`docs/SOURCE_ARCHIVE.md`) — 34 pages, 9
   endpoints, 39 media originals. Work from the archive. **Do not re-run
   `npm run archive:source`:** its origin is `https://www.nextvisionfilms.com`, which now
   serves this rebuild, so it would capture the rebuild and write it over the record.
2. **Design work is gated.** Five review checkpoints (A–E) precede any site-wide
   propagation. Build one representative artefact, get it accepted, *then* apply it.
3. `docs/Smash/` is 469 MB of owner source media. It is gitignored, **read-only**, and
   must never be committed, renamed or transcoded without approval.
4. **`source-archive/` and `docs/Smash/` are backed up off-machine.** All 646 MB is in the
   private `nvf-source-archive`, uploaded 2026-09-04. `npm run media:backup` is still a dry
   run without `--execute` and still has no `--delete`, because a backup that can prune
   itself is not a backup. Re-run it after adding source media.
5. **Motion has one authority per question** (Review E). The tier is decided once, before
   paint, in `src/lib/motion/tier.ts`, and everything else READS `data-motion`. No
   component may re-derive a reader's motion preference, and no second
   `prefers-reduced-motion` block may be added to a stylesheet. The same doctrine covers
   the header's scroll offset: `scroll-padding-block-start` on `<html>` is the ONLY
   declaration of it. A `scroll-margin` added elsewhere does not override that number —
   the two are additive, and Phase 10 found an anchor landing at 160 px instead of 76.
6. **A project page is composed from content, never from a flag** (Phase 9). There is one
   template and no tier field: a project with more material gets a longer page. Adding a
   per-project branch to `src/pages/portfolio/[slug].astro` is a design defect, not a fix.
7. **Aspect ratios are READ, never typed.** A project's shape is a fact about its footage
   (`src/lib/project-page.ts`), so no component and no content file states one. Twenty
   projects run 16:9, 1.90, 2.17, 2.21, 2.22 and one portrait; `/sobre/` derives its two
   team columns from its two portraits the same way.
8. **Every published project must reach the page and must not be a placeholder**, and
   `npm run validate:routes` fails the build otherwise. Since Phase 10 it also asserts the
   six static routes, their headings, their reachability, the contact form's inert state
   and the legal pages' in-page anchors.
9. **Published copy declares where it was published**, and the build checks the claim.
   `v('...', '/sobre/')` is verified against `docs/source-archive/pages.json` by
   `npm run validate:data` — 49 strings, word for word, plus any the owners edited in the
   admin, which carry `owner` provenance (decision A2; 1 on 2026-11-06). Copy may be SELECTED for a shorter
   context and never rewritten; the services excerpt rule is now a schema refinement, and
   since Phase 11 every meta description is a selection checked the same way.
10. **The legal text may never be edited, and that is enforced, not trusted.**
    `npm run validate:legal` compares production against `docs/content/*.txt` with all
    whitespace and all markup removed — markup-only changes pass, a changed word fails —
    and checks the archive's own SHA-256 against `docs/content/legal-source.lock.json`.
    Regenerate with `npm run legal:build`; never retype. It was tested by breaking it.
11. **Nothing exists in English unless it was authored in English** (Phase 11). The
    Portuguese is never rewritten to make translating easier, a proper noun is never
    translated, and a source typo is not carried into a language it was never made in. A
    string that is already English declares `sourceLocale: en` rather than being guessed
    at. `PAGE_LOCALES` in `src/i18n/routes.ts` is the ONE declaration of which pages exist
    in which locale — routes, hreflang, the sitemap, the language switch and the footer
    all read it, and `translatePath` returns null rather than inventing a counterpart.
    `npm run validate:seo` fails the build on a one-way hreflang, a missing pair, a
    duplicate title, a broken internal link or a sitemap that disagrees with `robots`.
12. **No component may contain a media URL, and the manifest may not contain a host**
    (Phase 12). Components ask for a KEY; `src/lib/media.ts` is the ONE place a delivery
    origin is joined to an object key. Every delivered file is content-addressed
    (`{key}/{width}.{hash8}.{ext}`), which is what makes the cache immutable — a changed
    derivative is a NEW name, so a purge is never needed and sync is a set difference.
    `PUBLIC_MEDIA_BASE_URL` unset means "serve the local mirror", so a fresh checkout builds
    a site that works with no network; setting it is the only change that moves delivery to
    R2. `npm run validate:media` fails the build on an upscale, a missing intrinsic size, a
    rendition whose name disagrees with its own bytes, a content key the manifest does not
    hold, or a media URL typed into a component. A developer adds media with a recipe entry
    plus `media:build`, and the owners with an upload in the admin — never a hand-edited
    path (`docs/MEDIA_PIPELINE.md` §5).
13. **`media:sync` and `media:backup` are DRY RUNS unless given `--execute`, and neither
    deletes anything by default.** Remote deletion needs `--delete` as well, and only ever
    removes objects the current manifest does not reference. `media:backup` has no
    `--delete` at all. Every source is read-only to every script here.
14. **A form may never report a success it has no evidence for** (Phase 13). `/obrigado/`
    is the answer the ENDPOINT gives to a POST — never a link on the contact page, never an
    optimistic redirect in the client script — and `npm run validate:routes` fails the build
    if a link to it appears. An unconfigured provider is `503`, a refused challenge is
    `403`, and a filled honeypot is refused rather than silently dropped, because a password
    manager can reach an off-screen field and a person told their message was sent when it
    was not is the worst outcome available. Turnstile is verified SERVER-SIDE on every
    submission and fails closed: a timeout, a network error or a malformed answer is a
    refusal, never a pass. The contract — field names, limits, outcome codes, the D9
    consent switch — is declared ONCE in `src/config/forms.ts` and read by both sides. No
    secret is ever read from `import.meta.env`, and no message content is ever logged, in
    any adapter, in any mode. `npm run test:forms` drives the live endpoint and needs no
    account and no secret.
15. **The contact form sends to `geral@nextvisionfilms.com`** (the user's choice, 2026-11-06,
    `env.prod.vars` in `wrangler.jsonc`), **but which address to PUBLISH is still open, with THREE
    candidates** (D2): `nextvisionfilmsagency@gmail.com` displayed on `/contactos/`,
    `hello@nextvisionfilms.com` linked from the same element and used in the footer, and
    `geral@nextvisionfilms.com` named in `/termos-e-condicoes/`. No page publishes any of
    them and `Organization.email` is omitted site-wide. The slot is reserved:
    `emailStatus: confirmed` in `src/content/settings/site.yml` turns it on.
16. **Analytics may never report a page view that did not happen** (Phase 14), which is
    the same rule as §14 applied to measurement rather than delivery. `ANALYTICS_SPA` is a
    MEASURED decision with its evidence attached, not a preference — flipping it without
    re-measuring the beacon against ClientRouter is a defect. Nothing is emitted unless a
    token is configured and the build is production, so a developer's page views and a test
    run are never data. No component and no runtime module may name the beacon: the ONE
    declaration is `src/config/analytics.ts` and the ONE placement is
    `src/components/site/Analytics.astro`. GA4, Google Ads, cookies, fingerprinting and
    advertising pixels are out, and `npm run validate:analytics` fails the build on any of
    them — it reads scripts and resource references, never prose, because the preserved
    privacy policy names Google Analytics and that text may not be touched.

17. **An icon is a DOWNSCALE of a preserved mark, never a drawing** (Phase 15). One source,
    `source-assets/brand/NVF.png`, and the geometry is MEASURED from its alpha rather than
    typed — rule 7 applied to the logo, so replacing the mark re-measures instead of
    inheriting a stale number. `build-icons.mjs` fails rather than upscale and asserts the
    maskable content's DIAGONAL against the safe circle, because a mask crops a circle and
    checking width would pass an icon that gets its corners cut. The originals are never
    edited. If Review A changes the identity, drop in a new source and run
    `npm run icons:build`; no other file changes. `theme_color` has ONE declaration — the
    manifest — and `BaseLayout` reads it rather than retyping a hex, because a `<meta>`
    cannot hold a CSS custom property and a second copy would be free to drift.
    `validate:pwa` ties both manifest colours back to `tokens.colour.css`.
18. **The service worker's caching is never broadened to raise a score** (Phase 15). Video
    is refused by extension AND by path, `public/__generated/` may never be precached, and
    `skipWaiting()` has exactly ONE call site, behind a message the reader sends. All three
    are enforced against the BUILT `sw.js`, and the skipWaiting count strips comments first
    — the worker's own header explains that it never calls `skipWaiting()` on its own, and
    reading that sentence as code is the same prose trap §16 names for the beacon.

19. **The `dev` Worker (first called staging) may never acquire a capability production has not been granted**
    (step 12). `PUBLIC_MEDIA_BASE_URL` stays unset rather than pointed at a hostname that
    does not exist, no bucket's privacy is changed, no production Turnstile widget is
    created, and no analytics token is invented — an unset value already has a defined,
    safe meaning everywhere, which is why the whole deployment needed no secret. The
    contact endpoint answers `503 not-configured` on `dev` and CANNOT be configured into
    doing otherwise, because `IS_DEV` is false in every build: that is §14 holding at a URL
    a person could actually type. The one deliberate difference runs the other way: the prod
    Worker alone carries the admin's Access variables and `SOURCES` bucket (decision A8).

20. **What only a real deploy can check, only a real deploy checks** (step 12). Cloudflare
    validates `_headers` and `_redirects` SERVER-SIDE at deploy time, and miniflare's local
    parser is more permissive than the API — `wrangler dev` reported "6 valid redirect
    rules" for a file the API refused with `Expected exactly 2 or 3 whitespace-separated
    tokens. Got 8`. So a rule line carries no trailing comment; a note goes on its own
    line, and `scripts/build-redirects.mjs` says why at the emission site. Never conclude
    from a green `wrangler dev` that an asset-config file is valid.

21. **`compatibility_date` is pinned to the workerd wrangler actually bundles**, not to
    today's date (step 12). Ahead of it, `wrangler dev` and `npm run preview:cloudflare`
    run under different semantics than the deployed Worker, and a preview that disagrees
    with production is worth nothing. Raise it together with wrangler, never on its own.

22. **A STATE flag and the ELEMENT it controls never share an attribute name** (step 13).
    `<html data-loader="on">` is the flag; the overlay is `data-loader-overlay`. They were
    both `data-loader`, `querySelector` walks document order, so the shorter selector
    returned the ROOT and `hidden` landed on `<html>` — `display: none` on the entire
    document, on the first visit of every session, with no author rule to explain it.
    `validate:routes` now fails the build if any loaded script queries `[data-loader]`.
    Renaming fixed it; forbidding the ambiguous selector is what keeps it fixed.

23. **`[hidden]` is a USER-AGENT rule, so any author `display` on the same element beats
    it** (step 13). Anything toggled with `el.hidden` needs its own author-level
    `display: none`, right beneath the rule that would otherwise win —
    `.item[hidden]` exists because `.item { display: grid }` made the portfolio filter hide
    nothing while still marking the link current and rewriting the URL. `validate:routes`
    asserts the pair against the BUILT stylesheet.

24. **A `preload` names the face the page actually renders** (step 13), and that is a
    measurement, not a guess: `document.fonts` reported the preloaded Barlow 500 as
    `unloaded` on a fully painted page while `body` resolved to 400. A wrong preload is
    worse than none — it spends bytes AND leaves the real face to stylesheet discovery.

25. **Astro cannot clean `dist/` while `wrangler dev` holds it open**, so orphaned bundles
    from an earlier build survive there (step 13). Any validator that scans built output
    must read what the PAGES REFERENCE, never a directory listing, or it fails on a file
    nothing loads. When a build's output looks stale, stop the dev server and
    `rm -rf dist .astro` before trusting it.

26. **The deploy target is chosen at BUILD time, and the artefact is checked, not the
    intention** (step 14). `@astrojs/cloudflare` writes a REDIRECTED wrangler configuration
    resolved for exactly one environment, so `CLOUDFLARE_ENV` selects the Worker and
    `wrangler deploy --env x` only cross-checks it — and the check has a hole: a build made
    with no `CLOUDFLARE_ENV` resolves to the top-level name, and `--env prod` against
    it exits 0 with no warning and deploys to `dev`. `scripts/deploy.mjs` is the ONE way
    this project reaches Cloudflare: it sets the variable, reads `dist/server/wrangler.json`
    back, and refuses if the resolved name is not the target's. The Worker names are read
    out of `wrangler.jsonc`, never copied into the script. Never call `wrangler deploy`
    directly.

27. **A clean checkout must be able to build the site, and it could not** (step 14).
    `media/dist/` is gitignored and `media:build` reproduces it only from the 646 MB of
    gitignored sources, so `npm run verify` failed at `validate:media` with 0 of 384
    renditions — measured on a fresh worktree, not assumed. `npm run media:pull` restores
    the mirror from the delivery bucket: GET only, never a write, never a delete, never
    `nvf-source-archive`, and every file verified against the manifest's SHA-256 BEFORE it
    is written. CI runs it, and a missing mirror fails the build rather than shipping a
    site with no images.

28. **A restore that dies on one bad socket is not a restore** (step 14). The first CI run
    to fetch the whole mirror got 350 of 384 objects and then failed with a bare
    `fetch failed` after five minutes — one transient error against R2 took the entire
    deploy red, and the five minutes says the socket hung rather than refused. `media:pull`
    now gives each object a 30 s per-attempt timeout and four attempts with backoff. A HASH
    MISMATCH is deliberately never retried: those bytes were delivered and they were wrong,
    and asking again would only hide it — the same doctrine as §14 and §16, applied to a
    download.

29. **Every byte the edge serves outside `/_astro/` has a cache rule, and no image is
    fetched twice** (performance audit, 2026-10-29). `public/_headers` gives each asset
    path a lifetime matched to whether its NAME changes with its bytes: `/__media/*` is
    content-addressed and immutable for a year (`validate:media` fails the build without
    that rule), fonts and brand PNGs are not hashed and get finite TTLs, never `immutable`.
    A `<video>` that sits over a `<picture>` carries NO `poster`: the poster is fetched
    whatever `preload` says and is never lazy, and the picture already paints that still.
    Brand marks are served at twice their largest rendered width (`npm run brand:build`);
    the originals in `public/brand/` are never edited. Record: `docs/PERFORMANCE_AUDIT.md`.

## 10.1 Stack, as actually installed

Astro **7.2.10** · `@astrojs/cloudflare` **14.2.6** · `@astrojs/mdx` 8 · sitemap 3.7.4 ·
wrangler 4.128.0 · TypeScript 5.9.3 strict · **npm**, one lockfile · Node >= 22.12.0.

Three Astro 7 facts that will bite if forgotten:

- **`z` re-exported from `astro:content` is deprecated.** Import from `astro/zod`. It is **zod v4** — string formats moved to the top level (`z.email()`, `z.url()`, not `z.string().email()`).
- **`output: 'hybrid'` is gone.** Use `output: 'static'` plus `export const prerender = false` per route.
- **`session: false` is required** in `astro.config.mjs`, or the Cloudflare adapter injects a `SESSION` KV binding that does not exist and deployment fails. Likewise, never hand-set `main` or the assets binding in `wrangler.jsonc` — the adapter supplies them.

Two more, found by RUNNING the endpoint rather than by reading about it — each was a 500 on
every submission until it was fixed:

- **`Astro.locals.runtime.env` no longer exists.** @astrojs/cloudflare 14 removed it and THROWS on access. Read the Worker's environment with `import { env } from 'cloudflare:workers'`, at request time (`src/lib/forms/env.ts`). `@cloudflare/workers-types` is not installed, so the one export used is declared in `src/env.d.ts`.
- **`Astro.clientAddress` is not implemented by this adapter and THROWS.** Cloudflare puts the address on the `CF-Connecting-IP` header instead.

And one routing fact: `trailingSlash: 'always'` DOES apply to endpoints whose route carries
no file extension, so `src/pages/api/contact.ts` answers on `/api/contact/`. The unslashed
form 308s, which preserves the method and the body.

Before every commit: `npm run verify` (validate:data → test:access → test:admin →
validate:legal → **icons:check** →
check → redirects:build → build → validate:routes → validate:seo → validate:analytics →
**validate:pwa** → validate:media). `icons:check` runs BEFORE the build because a drifted
icon should fail in a second, not after a full build; `validate:pwa` and `validate:media`
run after it because what they check is the built output.

`npm run test:forms` is deliberately NOT in `verify`: it needs a running server, and a
verification step that fails when a dev server is not up is a step people learn to ignore.
Run it against `npm run dev` whenever the endpoint or the form changes.

**On Windows, `verify` fails on a default checkout.** With `core.autocrlf=true` and no
`.gitattributes`, `test:admin` and `validate:legal` fail because they expect LF; both pass on
an LF export of the same commit (measured 2026-11-06). CI runs on Linux and never sees this.
`docs/HANDOVER.md` §4 lists the rest of a Windows setup.

---

## 11. Motion, PWA and accessibility floor

Non-negotiable, because they are easy to lose late:

- **Motion** is tokenised and has three tiers — `full`, `reduced`, `minimal` — resolved
  ONCE before the first paint and published on `<html data-motion>`. Everything else reads
  it. Every duration, easing, travel distance and stagger lives in
  `src/styles/tokens.motion.css` and is named for its ROLE, never its length; a component
  containing a raw `ms`, `cubic-bezier`, travel or delay is a bug. No scroll-jacking, no
  custom cursor, no WebGL, no GSAP. (**Amended 2026-10-22, design v2 decision C1:** the ONE
  cursor allowed is a native CSS `cursor: url()` image, declared as a token and applied only
  under `(hover: hover) and (pointer: fine)`, with no script following the pointer.) Animate
  only `transform` and `opacity`. Smooth scroll
  is desktop-only, dynamically imported, and its frame loop stops when the page is still.
  (`docs/ARCHITECTURE.md` §16, `docs/MOTION_REVIEW.md`.)
- **PWA** never caches video and stays under 20 MB of device storage. Never auto-reload
  on update. (§17.)
- **Accessibility:** one `<h1>` per page · accessible names on every control · visible
  focus · every hover behaviour has a touch and keyboard equivalent · no text pair below
  4.5:1. (§5.7.)
