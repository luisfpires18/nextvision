# Blocked / open items

Everything the build cannot answer for itself. **Update at the end of every phase.**
Not a project plan — no dates, no owners, no estimates. Detail lives in the phase docs.

- **BLOCKED** — needs a credential, a file or a translation nobody here can produce.
- **OWNER DECISION** — a choice only the owners can make.
- **DEFERRED** — deliberately postponed to a later phase.

---

## ROADMAP

**Step 12 — Cloudflare staging deploy ✅ DONE.** The site is live on the company account at
`https://next-vision-films.next-vision-films.workers.dev` — one Worker, `next-vision-films`,
Workers Static Assets, no custom domain and no secret. `npm run deploy` is verify → build →
`wrangler deploy`. Record: `docs/STAGING_DEPLOY.md`.

Done: audit · architecture · Phase 0/0.5 · Reviews A–E · 9 · 10 · 11 · 12 · 13 · 14 ·
15 (PWA finalisation) · step 12 (staging deploy) · step 13 (QA) · **step 14 (GitHub + CI/CD + handover)**.

**Step 13 — full QA against the staging URL ✅ DONE.** Measured on the live workers.dev
URL, not on a local approximation: 35 routes and assets 200, both localised 404s, every
redirect class, the contact endpoint's 405/403/503, archives rendering their own subsets,
canonicals and hreflang on the production domain, zero trackers, zero cookies, no 500 and
no secret in any served file. ClientRouter, Back/Forward, filters, cards, the mobile menu
and a direct project URL at 375 px all verified in a real browser.

**Four defects found and fixed** (`docs/STAGING_DEPLOY.md` §8.3): the first visit of a
session rendered blank; the hit-test anomaly that hid behind it; the category filter hid
nothing; a preloaded font was never used. Three regression checks now run inside
`npm run validate:routes`, and all three were tested by breaking them.

**Not exercised:** the `reduced` and `minimal` motion tiers — `prefers-reduced-motion`
cannot be emulated with the available tooling. Their code path (loader never armed) is the
repeat-visit path, which was verified.

**Step 14 — GitHub, CI/CD and handover ✅ COMPLETE.** The repository is
`luisfpires18/nextvision` (private). Public history is ONE root commit, `Initial Commit`;
`master` and `dev` start at the same SHA. Two Cloudflare Workers, and they cannot overwrite
each other: `dev` -> `next-vision-films` (staging), `master` ->
`next-vision-films-production`. Two workflows, one per branch, verify-gated. Record:
`docs/HANDOVER.md`.

**Two findings, both measured rather than assumed.** (1) `wrangler deploy --env production`
against a build made with no `CLOUDFLARE_ENV` exits 0 with no error and deploys to
**staging** — the target is resolved at BUILD time by `@astrojs/cloudflare`'s redirected
config, and `--env` only cross-checks it when the build declared one. `scripts/deploy.mjs`
reads the built config back and refuses the mismatch; it was tested by breaking it. (2) A
clean checkout **cannot build the site at all**: `media/dist/` is gitignored and
`media:build` needs 646 MB of gitignored sources, so `npm run verify` failed at
`validate:media` with 0 of 384 renditions present. `npm run media:pull` restores the mirror
from R2, read-only and hash-verified. The full CI recipe was then run in a clean worktree
and passed.

**CI/CD is live and was proved end to end.** All four repository secrets are set, and a
push to `dev` ran checkout -> `npm ci` -> fontTools -> `fonts:build` -> `media:pull` ->
`npm run verify` -> deploy in 1m21s, green. It deployed Worker `next-vision-films`
(version `ff6cf3fb`), and `next-vision-films-production` still **does not exist on the
account** — the cleanest possible proof that staging and production cannot overwrite each
other. Smoke-tested on the live URL: 8 routes 200, a media rendition 200, and the Step-14
copy fix visible in the served HTML. Repository merge settings are configured through the
API: merge commits ON, squash OFF, rebase OFF, auto-merge OFF, no required reviews.

**One defect, found only by running it.** `npm run fonts:build` shells out to
`python -m fontTools.subset`, which is not an npm dependency and is not on the runner, so
the first credentialed run died with `ModuleNotFoundError` before it reached the mirror.
The script had always documented the requirement; nothing enforced it, because a developer
machine that installed it once never notices again. Both workflows now install it, pinned
to the versions that produced the QA'd faces.

**Production is live on workers.dev.** PR #1 merged `dev` into `master` as a merge commit,
and the production workflow ran green in 1m27s: `deploy target: production -> Worker
"next-vision-films-production"`, version `5793e05f`, at
`https://next-vision-films-production.next-vision-films.workers.dev`. Smoke-tested: 7 routes
200, a media rendition 200, a missing route 404, the contact endpoint refusing an
Origin-less POST with 403, and canonicals still pointing at `www.nextvisionfilms.com` — which
is what keeps the workers.dev copies from competing with the real site. **`dev` is now the
GitHub default branch**, so a clone lands there and new branches fork from it.

Not started: DNS cutover, the newsletter endpoint (D18).

---

## BLOCKED

- [x] **GitHub Actions would not start (2026-10-27 → 2026-10-29).** Billing refused every job on the private repo; resolved by making the repository public, after which `media-ingest` created «Agente Imobiliário sem Casa para Viver» (hidden, year 2026 — the owners' second try said 2024, so they should confirm the year).
- [ ] **Owner photos.** New founder portraits for `/sobre/` and new images for the Services carousels are coming from the owners (2026-10-29).
- [ ] **Design v2 assets.** VHS spine artwork (spines are drawn from titles until then), the
      NOWHERE poster and project, Need to Talk, Agente Imobiliário Sem Casa Para Viver, the
      About team-photo carousel, and a vector export of the logos (C8; PNG masks for now).
- [ ] **Contact "Company/brand" field.** The honeypot is already named `empresa`; renaming it
      and adding the field is a contract change on both sides (`src/config/forms.ts`).

- [ ] **Branch protection is impossible on this plan.** Both the branch-protection and the ruleset APIs answer `403 Upgrade to GitHub Pro or make this repository public` for a private repo on GitHub Free, so "no deletion, no force-push" on `dev` and `master` cannot be enforced server-side. `scripts/hooks/pre-push` enforces both on the CLIENT (`git config core.hooksPath scripts/hooks`) and protects only the machine that has it. Exits: GitHub Pro, or making the repository public — which would publish the archived source data and internal documents too.
- [ ] **Turnstile production keys** — site key + `TURNSTILE_SECRET_KEY`. Unset, `/api/contact/` refuses every submission with `503`. Needs the owners' Cloudflare account.
- [ ] **Cloudflare Web Analytics site token** — `PUBLIC_ANALYTICS_TOKEN`. Unset, no beacon is emitted at all. Created under **Manage site → JS snippet**; the token, not the snippet, is what we need. (Phase 14)
- [ ] **Outstanding masters / weak media** — M1–M9 in `docs/SMASH_MEDIA_INVENTORY.md` §6. Longest lead time in the project; nothing is upscaled to hide it.
- [ ] **English review by an owner or native speaker** — every English string was authored here and has never been read by the company.

## OWNER DECISION

- [ ] **Second Services carousel.** The owners asked for "Publicidade & Branding"; no category carries that label. It shows `corporativo` (one project, Antiqvvm); `moda-identidade` (one project, YSL) is the alternative. One word in `services.json` `categories`.
- [ ] **"Tira a cena dos BTS".** Read as the six-still grid on `/bts/`, now removed (the page is all yellow). If only the cream spine was meant, restore the grid in `BtsPage.astro`.
- [ ] **Design v2 copy (Tatiana's storyboard).** New About lead and paragraphs, and the
      contact-sheet heading (contains "SCREME", "WOHOLE", "ALREDY"). Not published; the
      live copy stays until approved. `docs/DESIGN_V2_ROLLOUT.md` §5.
- [ ] **Founders' roles and contacts in design v2.** The storyboard's "Co-Founder & …" roles
      differ from the live ones; its e-mails and personal phones wait on D2 and both
      founders' consent.
- [ ] **Design v2 mobile layout.** The storyboard is desktop-only; the bottom-rail/top-spine
      adaptation needs Tatiana's sign-off.
- [ ] **Design v2 dark-state text (C2 caveat).** The rail's lights-down darkens text with
      everything else; turning it cream needs a colour transition and a §11 amendment.

- [ ] **D2 — canonical contact email.** Three candidates: `nextvisionfilmsagency@gmail.com`, `hello@nextvisionfilms.com`, `geral@nextvisionfilms.com`. No page publishes any of them.
- [ ] **D17 — contact recipient + email provider.** Blocks delivery only; the endpoint and the four-adapter seam are built.
- [ ] **D9 — is the contact consent checkbox required?** The published form says no. `CONSENT_REQUIRED` is the one switch.
- [ ] **D19/D8 — GA4 + Google Ads.** Phase 14 assumes they are DROPPED for cookieless analytics. If the Ads tag is a live paid campaign, keeping it makes a consent banner mandatory and reopens the whole consent layer.
- [ ] **Privacy policy vs. actual behaviour — LEGAL REVIEW.** The policy declares Google Analytics cookies (`_ga`, `_gid`, `_gat`), a `cookie_notice_accepted` cookie and Smartsupp chat. The rebuilt site sets **no cookies at all**. The policy over-declares; it was not amended, because it is binding text (`CLAUDE.md` §2). See `docs/ARCHITECTURE.md` §8.1.
- [ ] **D18 — newsletter destination.** No endpoint is written until there is somewhere to send to.
- [ ] **The opening curtain vs LCP.** The 6.6 s hold on the first page of a session is 1.94 s of element render delay on the homepage's 2.6 s mobile LCP, and the hero video decodes under it. The design is the owners'; the number is in `docs/PERFORMANCE_AUDIT.md` §1.
- [ ] **Prune 25 unreferenced delivery objects (5.6 MB).** Four `pages/home/hero/1280.*` videos the homepage no longer uses, among others. A manifest/recipe prune plus `media:sync --execute --delete` — a bucket deletion the owners should see before it runs.
- [ ] **D3 — portfolio category descriptions.** Four of five do not match their heading. Will not be rewritten here.
- [ ] **English legal translation** — wanted or not? Both legal pages are Portuguese-only and say so in four places.

## DEFERRED

- [ ] **PWA icons track the visual identity** — generated from the EXISTING mark (`source-assets/brand/NVF.png`). If Review A changes the logo, drop the new source in and run `npm run icons:build`; nothing else changes. Not a blocker — the site is installable now.
- [ ] **Personal-account R2 buckets** — two empty buckets left behind by the move to the company account. Manual dashboard cleanup.
- [ ] **Media hostname + DNS** (`media.nextvisionfilms.com`, D20) — staging serves the 384 renditions from its own asset store instead, byte-identical to `nvf-media` and needing no public bucket. `PUBLIC_MEDIA_BASE_URL` stays unset until a real hostname exists.
- [ ] **The `reduced` and `minimal` motion tiers are untested in a browser.** `prefers-reduced-motion` cannot be emulated with the tooling used for step 13. Their code path — the loader never arms — is the repeat-visit path and was verified; the tiers themselves were not.
- [ ] **Two console messages left alone, both non-breaking.** Chromium's `preloaded ... but not used within a few seconds` for the two preloaded faces (both end `loaded`; they are applied after the opening hold), and Astro ClientRouter's unhandled `InvalidStateError: Transition was aborted because of invalid state` on each swap. Every swap completed.
- [ ] **Content-Security-Policy** — the required origins are recorded (`ARCHITECTURE.md` §9). There IS a Worker now, so the blocker is gone and only the work remains. `public/_headers` now carries the cache rules and five security headers (performance audit, 2026-10-29) but no CSP: it needs a nonce strategy for the inline motion bootstrap and JSON-LD, and allow-lists for Turnstile and youtube-nocookie. Ship it Report-Only first.
- [ ] **Performance audit, after-deploy measurements.** Once `claude/perf-audit-006eb2` reaches `dev`: `curl -sI` a `/__media/*` object, a font and a page on `https://dev.nextvisionfilms.com` (rule 20 — only a real deploy validates `_headers`), then PageSpeed Insights (mobile) on `/` and `/portfolio/`. Fill the `UNKNOWN` column in `docs/PERFORMANCE_AUDIT.md` §2.
- [ ] **`/__concepts/*` and `public/__generated/posters|preview` (2.5 MB) still deploy.** CLAUDE.md keeps the concepts; recorded by the performance audit, unchanged.
- [ ] **Phase 11b reviewed copy/SEO proposals** — permitted as diffs against the archive, never applied silently.
- [ ] **DNS cutover and a custom domain** — not started, by instruction (Step 15). Both Workers live on `workers.dev` and need neither.

- [ ] **Staging is publicly reachable and not robots-blocked.** Every canonical points at `https://www.nextvisionfilms.com/…`, which is what keeps the workers.dev copy from competing with the real site; no staging-only `X-Robots-Tag` was added, because an artefact that behaves differently from the one that ships is not a staging artefact.
