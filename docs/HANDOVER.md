# Handover — running, editing and deploying this site

How to operate the site. It does not repeat `docs/ARCHITECTURE.md` (why a thing is built
that way) or `CLAUDE.md` (the rules). It says what to do, and what will refuse you.

---

## 1. Git workflow

Two long-lived branches. Nothing else is permanent.

- **`dev`** — the **default branch**, and where all work starts. Every push deploys the **`dev`** Worker.
- **`master`** — what is released. Every push deploys the **`prod`** Worker.

`dev` is GitHub's default, so a fresh `git clone` lands on it and a new branch created in
the web UI forks from it. Nothing needs to be selected.

```bash
git switch dev
git pull
# …work…
npm run verify                 # the same gate CI runs. Run it before you commit.
git commit -m "feat: …"
git push origin dev            # -> CI verify -> dev Worker
```

**Direct commits on `dev` are the normal workflow.** Feature branches are optional and
worth it only when a change is long enough to want isolating:

```bash
git switch dev && git pull
git switch -c feature/whatever
# …work, then merge back into dev, which deploys the dev Worker…
```

Promoting to production is a decision, not an automation. Either a PR from `dev` to
`master` merged with **Merge pull request** (the button gives a merge commit; squash and
rebase are disabled on the repository), or locally:

```bash
git switch master && git pull
git merge --no-ff dev          # a NORMAL MERGE COMMIT, always
git push origin master         # -> CI verify -> prod Worker
git switch dev
```

`--no-ff` is the point: `dev -> master` must leave a visible merge commit, so the history
shows what was released and when. **Never** squash or rebase that merge.

No development happens on `master`. It only ever receives merges from `dev`.

---

## 2. Deployment

| Branch | Workflow | Worker | URL |
|---|---|---|---|
| `dev` | `.github/workflows/dev.yml` | `dev` | `https://dev.next-vision-films.workers.dev` |
| `master` | `.github/workflows/prod.yml` | `next-vision-films-production` | `https://www.nextvisionfilms.com` (live) |

Renamed 2026-10-22 from `staging` / `production`. The dev Worker was renamed (old `next-vision-films` deleted); the prod Worker keeps its name because the live domains are bound to it. Never rename it.

Both Workers are on the company Cloudflare account, both serve from Workers Static
Assets, and neither has a custom domain — that is Step 15.

**The deployment target is chosen at BUILD time, not at deploy time.** `@astrojs/cloudflare`
writes a *redirected* wrangler configuration (`dist/server/wrangler.json`) that is resolved
for exactly one environment, and `CLOUDFLARE_ENV` is what selects it. `wrangler deploy --env x`
is only a cross-check — and it has a hole that was measured, not assumed: a build made with
no `CLOUDFLARE_ENV` resolves to the *top-level* Worker name, and `wrangler deploy --env production`
against it exits 0 with no error and no warning, deploying to **staging**.

`scripts/deploy.mjs` exists to close that hole. It sets `CLOUDFLARE_ENV`, then reads the
built configuration back and refuses to deploy if the resolved Worker name is not the one
the target declares. Always deploy through it:

```bash
npm run deploy:dev           # verify -> build -> Worker `dev`
npm run deploy:prod          # verify -> build -> Worker `next-vision-films-production` (LIVE)
```

Manual deploys are emergency tooling. The normal path is `git push`.

---

## 3. What CI does, and what it needs

Both workflows: checkout → Node 22 → `npm ci` → fontTools → `fonts:build` → `media:pull` →
`npm run verify` → deploy. A failing verify ends the job, so nothing reaches the edge that
has not passed all eleven validators. A push to `dev` takes about 1m20s end to end.

fontTools is installed by the workflow because `fonts:build` shells out to
`python -m fontTools.subset`, which is not an npm dependency. It is version-pinned: font
subsetting produces bytes, and different bytes are a different service-worker precache hash.

**All four secrets are set and the pipeline is live.** If `CLOUDFLARE_API_TOKEN` is ever
removed, both workflows fall back to doing nothing and passing green with a notice, rather
than failing on every push.

Repository secrets (Settings → Secrets and variables → Actions):

| Secret | Why | Minimum permission |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | deploy the Worker | Account → *Workers Scripts: Edit* |
| `CLOUDFLARE_ACCOUNT_ID` | the account to deploy into, and the R2 endpoint host | — (`c87adf05b555c1ff52167b53030b8e39`) |
| `R2_ACCESS_KEY_ID` | fetch the media mirror | R2 → *Object Read only*, bucket `nvf-media` |
| `R2_SECRET_ACCESS_KEY` | the other half of that key | — |

Nothing else. No zone permission, no DNS permission, no R2 write, and no access to
`nvf-source-archive`. CI never uploads to R2 and never deletes anything.

---

## 4. A fresh clone

Two build inputs are generated and deliberately not in the repository:

```bash
npm install
npm run fonts:build     # six WOFF2 faces, derived from source-assets/fonts/*.ttf
npm run media:pull      # 384 renditions, 16.69 MB, fetched from R2 and hash-verified
```

`media/dist/` is the local delivery mirror. `npm run media:build` reproduces it from the
sources — but the sources (`docs/Smash/`, `source-archive/`, 646 MB) are gitignored too,
so on a clean checkout `media:pull` is the only way to get it. Without it `npm run verify`
fails at `validate:media`, which is correct: a build missing its media is not shippable.

`media:pull` is **read-only** — GET from the delivery bucket, every file checked against
the SHA-256 the manifest records before it is written.

---

## 5. Editing content

All content is files. There is no CMS and no database.

- **Projects** — `src/content/projects/*.md`. Front matter is validated by the Zod schema
  in `src/content.config.ts`; a malformed project fails the build rather than rendering
  wrong. A project page is composed from what the content *has*, not from a tier flag:
  give a project more material and its page gets longer. Never add a per-project branch to
  `src/pages/portfolio/[slug].astro`.
- **Aspect ratios are read, never typed.** A project's shape is a fact about its footage
  (`src/lib/project-page.ts`). Do not state one in content.
- **Site settings** — `src/content/settings/site.yml`.
- **Categories** — `src/content/categories/`.
- **Legal pages** — `src/content/legal/`. **These may not be edited.**
  `npm run validate:legal` compares them against `docs/content/*.txt` with all whitespace
  and markup removed; a changed word fails the build. Regenerate with `npm run legal:build`,
  never by retyping.

Published copy declares where it was published — `v('…', '/sobre/')` — and
`npm run validate:data` checks all 50 strings against the archived original, word for word.
Copy may be *selected* for a shorter context. It may not be rewritten. See `CLAUDE.md` §2.

After every content change: `npm run verify`.

---

## 6. Portuguese and English

Portuguese is the source language and lives at `/`; English lives at `/en/`. 73 built
pages, 52 in the sitemap.

`PAGE_LOCALES` in `src/i18n/routes.ts` is the **one** declaration of which pages exist in
which locale. Routes, hreflang, the sitemap, the language switch and the footer all read
it. Adding an English page means adding it there — `translatePath` returns `null` rather
than inventing a counterpart, so a missing entry is a missing link, not a broken one.

Nothing exists in English unless it was authored in English. **Both legal documents are
Portuguese-only**, and say so in four places, because no approved translation exists and
machine-translating binding text publishes a claim nobody wrote.

`npm run validate:seo` fails the build on a one-way hreflang, a missing pair, a duplicate
title, a broken internal link, or a sitemap that disagrees with `robots.txt`.

---

## 7. Media

`src/data/media-manifest.json` is the site's **only** media authority: 86 assets, 384
renditions, 16.69 MB, every file content-addressed as `{key}/{width}.{hash8}.{ext}`. That
naming is what makes the cache immutable — a changed derivative gets a new name, so a purge
is never needed.

**No component may contain a media URL, and the manifest may not contain a host.**
Components ask for a *key*; `src/lib/media.ts` is the one place a delivery origin is joined
to an object key. `npm run validate:media` fails the build if a URL is typed into a
component, if a rendition is an upscale, or if its bytes disagree with its own name.

To add media: add a recipe entry and run `npm run media:build`, then
`npm run media:sync -- --execute`. Never hand-edit a path. Full recipe:
`docs/MEDIA_PIPELINE.md` §5.

`PUBLIC_MEDIA_BASE_URL` unset means *serve the local mirror* — a fresh checkout builds a
site that works with no network. Setting it is the only change that moves delivery to R2,
and it stays unset until a real delivery hostname exists (Step 15).

### R2 buckets — both on the company account, both private

| Bucket | What | Public? |
|---|---|---|
| `nvf-media` | the 384 delivery renditions | No. `r2.dev` disabled, no custom domain. |
| `nvf-source-archive` | 102 source files, 645.95 MB — the only off-machine copy of `docs/Smash/` and `source-archive/` | **Never public. Never referenced by the site.** |

`media:sync` and `media:backup` are **dry runs** unless given `--execute`. Remote deletion
additionally needs `--delete` and only ever removes objects the current manifest does not
reference. `media:backup` has no `--delete` at all. Re-run it after adding source media.

---

## 8. What is deployed but not yet configured

None of these are faked, and none of them can be switched on from here.

- **Contact form.** `POST /api/contact/` is the one route with `prerender = false`. It
  validates, checks Origin, caps the body at 16 KB, has a honeypot, and verifies Turnstile
  **server-side** on every submission, failing closed. Delivery itself is **not configured**:
  no provider and no recipient have been decided (D17/D2), so production refuses a
  submission with `503 not-configured` rather than reporting a success it has no evidence
  for. `/obrigado/` is the answer the endpoint gives to a POST and is never a link —
  `validate:routes` fails the build if one appears. Local development needs no account and
  no secret. `npm run test:forms` drives the live endpoint.
- **Turnstile.** No production keys. Unset, every submission is refused. Local work uses
  Cloudflare's own always-passes test key.
- **Analytics.** Cloudflare Web Analytics only — cookieless, no banner, no GA4, no Google
  Ads (`validate:analytics` fails the build if either returns). Nothing is emitted unless
  `PUBLIC_ANALYTICS_TOKEN` is set *and* the build is production, so `astro dev` measures
  nothing. The token does not exist yet. Measured after a full visit: 0 cookies, 0
  localStorage keys, 0 IndexedDB databases. `ANALYTICS_SPA` is `false` because the beacon
  triples page views under ClientRouter — that is a measurement, and flipping it without
  re-measuring is a defect.
- **PWA.** Installable. Five icons, all downscales of `source-assets/brand/NVF.png`;
  replace the mark and run `npm run icons:build` — no other file changes. First install is
  271 KB of a 20 MB budget and caches **no video, ever**. An update installs and waits for
  the reader; it never auto-reloads.

---

## 9. Repository settings, and the protection that is not available

Configured through the API, and recorded here because a dashboard click can undo them:

- **Default branch** — `dev`
- **Allow merge commits** — ON
- **Allow squash merging** — OFF
- **Allow rebase merging** — OFF
- **Allow auto-merge** — OFF

A PR is a convenient way to merge `dev -> master`; no review is required and nothing
merges itself. You decide when.

**Branch protection is NOT configured, because this plan cannot have it.** Both the
branch-protection and the ruleset APIs answer, for a private repository on GitHub Free:

    403  Upgrade to GitHub Pro or make this repository public to enable this feature.

So "no deletion, no force-push" on `dev` and `master` cannot be enforced on the server.
Two exits, whenever you want them: **GitHub Pro**, or making the repository public — and
public would publish the archived source data and the internal project documents along
with the site, so it is not a small decision.

Until then the rules are enforced on the CLIENT, by `scripts/hooks/pre-push`. Enable it
once per clone:

```bash
git config core.hooksPath scripts/hooks
```

It refuses to delete `dev` or `master`, and refuses any push to them that is not a
fast-forward. It protects the machine that has it installed and nothing else, and
`--no-verify` bypasses it deliberately — a hook you cannot bypass is a hook that locks you
out of your own repository. It is what is available, not a substitute for the real thing.

---

## 10. Deferred

Everything still open — blocked items, owner decisions and deferred work — is in
[`BLOCKED_TODOS.md`](BLOCKED_TODOS.md), updated at the end of every phase. The largest are
the production domain and DNS, the contact recipient and email provider, production
Turnstile keys, the analytics token, the media delivery hostname, and Review A (the visual
identity is still provisional).
