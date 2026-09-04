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

**Step 14 — GitHub, CI/CD and handover ✅ DONE, with one blocker.** The repository is
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

Not started: DNS cutover, the newsletter endpoint (D18).

---

## BLOCKED

- [ ] **Cloudflare API token for GitHub Actions** — repository secret `CLOUDFLARE_API_TOKEN`. Minimum permission: Account -> **Workers Scripts: Edit**. Nothing else — no zone, no DNS, no R2 write. Without it BOTH workflows deliberately do nothing and pass green, so no push fails and no deploy happens. It is the only thing between the current state and automatic deployment.
- [ ] **Read-only R2 keys for GitHub Actions** — `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`, R2 -> **Object Read only**, bucket `nvf-media`. CI cannot rebuild `media/dist/` (the sources are gitignored and 646 MB), so it fetches the 384 renditions instead. Without them `npm run media:pull` fails loudly and nothing is deployed — a build with no media must never ship.
- [ ] **`CLOUDFLARE_ACCOUNT_ID` as a repository secret** — `c87adf05b555c1ff52167b53030b8e39`. Not a credential; it is the account to deploy into and the R2 endpoint host.
- [ ] **Turnstile production keys** — site key + `TURNSTILE_SECRET_KEY`. Unset, `/api/contact/` refuses every submission with `503`. Needs the owners' Cloudflare account.
- [ ] **Cloudflare Web Analytics site token** — `PUBLIC_ANALYTICS_TOKEN`. Unset, no beacon is emitted at all. Created under **Manage site → JS snippet**; the token, not the snippet, is what we need. (Phase 14)
- [ ] **Outstanding masters / weak media** — M1–M9 in `docs/SMASH_MEDIA_INVENTORY.md` §6. Longest lead time in the project; nothing is upscaled to hide it.
- [ ] **English review by an owner or native speaker** — every English string was authored here and has never been read by the company.

## OWNER DECISION

- [ ] **D2 — canonical contact email.** Three candidates: `nextvisionfilmsagency@gmail.com`, `hello@nextvisionfilms.com`, `geral@nextvisionfilms.com`. No page publishes any of them.
- [ ] **D17 — contact recipient + email provider.** Blocks delivery only; the endpoint and the four-adapter seam are built.
- [ ] **D9 — is the contact consent checkbox required?** The published form says no. `CONSENT_REQUIRED` is the one switch.
- [ ] **D19/D8 — GA4 + Google Ads.** Phase 14 assumes they are DROPPED for cookieless analytics. If the Ads tag is a live paid campaign, keeping it makes a consent banner mandatory and reopens the whole consent layer.
- [ ] **Privacy policy vs. actual behaviour — LEGAL REVIEW.** The policy declares Google Analytics cookies (`_ga`, `_gid`, `_gat`), a `cookie_notice_accepted` cookie and Smartsupp chat. The rebuilt site sets **no cookies at all**. The policy over-declares; it was not amended, because it is binding text (`CLAUDE.md` §2). See `docs/ARCHITECTURE.md` §8.1.
- [ ] **D18 — newsletter destination.** No endpoint is written until there is somewhere to send to.
- [ ] **D3 — portfolio category descriptions.** Four of five do not match their heading. Will not be rewritten here.
- [ ] **English legal translation** — wanted or not? Both legal pages are Portuguese-only and say so in four places.

## DEFERRED

- [ ] **PWA icons track the visual identity** — generated from the EXISTING mark (`source-assets/brand/NVF.png`). If Review A changes the logo, drop the new source in and run `npm run icons:build`; nothing else changes. Not a blocker — the site is installable now.
- [ ] **Personal-account R2 buckets** — two empty buckets left behind by the move to the company account. Manual dashboard cleanup.
- [ ] **Media hostname + DNS** (`media.nextvisionfilms.com`, D20) — staging serves the 384 renditions from its own asset store instead, byte-identical to `nvf-media` and needing no public bucket. `PUBLIC_MEDIA_BASE_URL` stays unset until a real hostname exists.
- [ ] **The `reduced` and `minimal` motion tiers are untested in a browser.** `prefers-reduced-motion` cannot be emulated with the tooling used for step 13. Their code path — the loader never arms — is the repeat-visit path and was verified; the tiers themselves were not.
- [ ] **Two console messages left alone, both non-breaking.** Chromium's `preloaded ... but not used within a few seconds` for the two preloaded faces (both end `loaded`; they are applied after the opening hold), and Astro ClientRouter's unhandled `InvalidStateError: Transition was aborted because of invalid state` on each swap. Every swap completed.
- [ ] **Content-Security-Policy** — the required origins are recorded (`ARCHITECTURE.md` §9). There IS a Worker now, so the blocker is gone and only the work remains; `_headers` currently carries one rule, the adapter's immutable `Cache-Control` for `/_astro/*`.
- [ ] **Phase 11b reviewed copy/SEO proposals** — permitted as diffs against the archive, never applied silently.
- [ ] **DNS cutover and a custom domain** — not started, by instruction (Step 15). Both Workers live on `workers.dev` and need neither.
- [ ] **`media:pull`'s network path is unexercised.** The no-op and hash-check paths were run; the R2 GET was not, because this machine has no R2 read keys. It reuses the same SigV4 signer that already uploaded 384 objects and 645.95 MB, and `getObject` is that signer's `request()` with method GET — but it has not been run against the bucket.
- [ ] **Staging is publicly reachable and not robots-blocked.** Every canonical points at `https://www.nextvisionfilms.com/…`, which is what keeps the workers.dev copy from competing with the real site; no staging-only `X-Robots-Tag` was added, because an artefact that behaves differently from the one that ships is not a staging artefact.
