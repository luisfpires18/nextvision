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

No development happens on `master`. It receives merges from `dev`, and the owners' own
commits from the admin (§11). **So before every `dev -> master` release, merge `master`
into `dev` first:**

```bash
git switch dev && git pull
git merge origin/master
git push origin dev
```

---

## 2. Deployment

| Branch | Workflow | Worker | URL |
|---|---|---|---|
| `dev` | `.github/workflows/dev.yml` | `dev` | `https://dev.nextvisionfilms.com` |
| `master` | `.github/workflows/prod.yml` | `next-vision-films-production` | `https://www.nextvisionfilms.com` (live) |

Renamed 2026-10-22 from `staging` / `production`. The dev Worker was renamed (old `next-vision-films` deleted); the prod Worker keeps its name because the live domains are bound to it. Never rename it.

Both Workers are on the company Cloudflare account and both serve from Workers Static
Assets. Their domains are listed at the end of this file. `dev.next-vision-films.workers.dev`
and `next-vision-films-production.next-vision-films.workers.dev` also answer. A third
workflow, `.github/workflows/media-ingest.yml`, processes the owners' uploads on `master`.

**The deployment target is chosen at BUILD time, not at deploy time.** `@astrojs/cloudflare`
writes a *redirected* wrangler configuration (`dist/server/wrangler.json`) that is resolved
for exactly one environment, and `CLOUDFLARE_ENV` is what selects it. `wrangler deploy --env x`
is only a cross-check — and it has a hole that was measured, not assumed: a build made with
no `CLOUDFLARE_ENV` resolves to the *top-level* Worker name, and `wrangler deploy --env prod`
against it exits 0 with no error and no warning, deploying to **`dev`** (measured under the
old names, `production` and staging).

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

`dev.yml` and `prod.yml`: checkout → Node 22 → `npm ci` → fontTools → `fonts:build` →
`media:pull` → `npm run verify` → deploy. A failing verify ends the job, so nothing reaches
the edge that has not passed every step of it. `prod.yml` ignores a push that only touches
`src/data/media-uploads.json`.

`media-ingest.yml` runs on a push to `master` touching that list. It encodes the owner's
original, uploads the renditions add-only, points the field at the new media and commits as
the admin's GitHub App, which is what triggers the deploy.

fontTools is installed by the workflow because `fonts:build` shells out to
`python -m fontTools.subset`, which is not an npm dependency. It is version-pinned: font
subsetting produces bytes, and different bytes are a different service-worker precache hash.

**The pipeline is live.** `prod.yml` and `media-ingest.yml` last ran green on 2026-11-06, and
`dev.yml` on 2026-11-03. If `CLOUDFLARE_API_TOKEN` is ever removed, `dev.yml` and `prod.yml` fall back to
doing nothing and passing green with a notice, rather than failing on every push.

Repository secrets (Settings → Secrets and variables → Actions):

| Secret | Why | Minimum permission |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | deploy the Worker | Account → *Workers Scripts: Edit* |
| `CLOUDFLARE_ACCOUNT_ID` | the account to deploy into, and the R2 endpoint host | — (`c87adf05b555c1ff52167b53030b8e39`) |
| `R2_ACCESS_KEY_ID` | fetch the media mirror; `media-ingest.yml` also uploads renditions | R2 → *Object Read & Write*, bucket `nvf-media` |
| `R2_SECRET_ACCESS_KEY` | the other half of that key | — |
| `R2_SOURCE_ACCESS_KEY_ID` | `media-ingest.yml` reads the owner's original | R2 → *Object Read only*, bucket `nvf-source-archive` |
| `R2_SOURCE_SECRET_ACCESS_KEY` | the other half of that key | — |
| `NVF_ADMIN_APP_ID` | `media-ingest.yml` commits as the admin's GitHub App | — |
| `NVF_ADMIN_APP_PRIVATE_KEY` | the App's key | — |

No zone or DNS permission. CI never deletes anything from R2, and its only writes are
`media-ingest.yml`'s add-only uploads to `nvf-media`. The permissions listed are what
`docs/ADMIN_DASHBOARD_PLAN.md` §4.1 specifies; a key's real scope is visible only in Cloudflare.

---

## 4. A fresh clone

Two build inputs are generated and deliberately not in the repository:

```bash
npm install
npm run fonts:build     # eight WOFF2 faces, derived from source-assets/fonts/*.ttf
npm run media:pull      # every rendition in the manifest, fetched from R2 and hash-verified
```

`fonts:build` needs Python with `fonttools[woff]==4.64.0` and `brotli==1.2.1`, the versions
CI pins. `media:pull` needs an R2 key in `.env` (`.env.example`).

**On Windows, three more things**, all found on a fresh checkout on 2026-11-06:

- **The Visual C++ Redistributable (x64).** Without `VCRUNTIME140.dll`, the native binding
  Astro's markdown uses and `workerd` both fail to load, so `astro check` and `astro build`
  crash with `Cannot find native binding`. The error's advice to delete the lockfile is wrong
  here.
- **Line endings.** With `core.autocrlf=true`, `test:admin` and `validate:legal` fail on CRLF.
  Clone with `git clone -c core.autocrlf=false` or check the repository out on Linux until
  the repository has a `.gitattributes`.
- **Node 22.** CI runs Node 22; a newer local major may behave differently.

`media/dist/` is the local delivery mirror. `npm run media:build` reproduces it from the
sources — but the sources (`docs/Smash/`, `source-archive/`, 646 MB) are gitignored too,
so on a clean checkout `media:pull` is the only way to get it. Without it `npm run verify`
fails at `validate:media`, which is correct: a build missing its media is not shippable.

`media:pull` is **read-only** — GET from the delivery bucket, every file checked against
the SHA-256 the manifest records before it is written.

---

## 5. Editing content

All content is files. There is no CMS and no database. The owners edit those same files
through the admin (§11); a developer edits them directly.

- **Projects** — `src/content/projects/*.mdx`. Front matter is validated by the Zod schema
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
`npm run validate:data` checks it against the archived original, word for word (49 strings on
2026-11-06, plus 1 the owners edited in the admin, which carries `owner` provenance). A
developer may *select* copy for a shorter context and may not rewrite it. See `CLAUDE.md` §2.

After every content change: `npm run verify`.

---

## 6. Portuguese and English

Portuguese is the source language and lives at `/`; English lives at `/en/`. On 2026-11-06:
75 built pages and 54 sitemap URLs on `dev`, 77 and 56 on `master`.

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

`src/data/media-manifest.json` is the site's **only** media authority: on 2026-11-06, 88
assets / 392 renditions / 17.1 MiB on `dev` and 90 / 398 / 19.8 MiB on `master`, every file content-addressed as `{key}/{width}.{hash8}.{ext}`. That
naming is what makes the cache immutable — a changed derivative gets a new name, so a purge
is never needed.

**No component may contain a media URL, and the manifest may not contain a host.**
Components ask for a *key*; `src/lib/media.ts` is the one place a delivery origin is joined
to an object key. `npm run validate:media` fails the build if a URL is typed into a
component, if a rendition is an upscale, or if its bytes disagree with its own name.

To add media as a developer: add a recipe entry and run `npm run media:build`, then
`npm run media:sync -- --execute`. Never hand-edit a path. The owners upload from the admin
instead. Full recipe: `docs/MEDIA_PIPELINE.md` §5.

`PUBLIC_MEDIA_BASE_URL` unset means *serve the local mirror* — a fresh checkout builds a
site that works with no network. Setting it is the only change that moves delivery to R2,
and it stays unset until a real delivery hostname exists (D20).

### R2 buckets — both on the company account, both private

| Bucket | What | Public? |
|---|---|---|
| `nvf-media` | the delivery renditions | No. `r2.dev` disabled, no custom domain. |
| `nvf-source-archive` | the only off-machine copy of `docs/Smash/` and `source-archive/` (102 files, 645.95 MB), plus the owners' originals under `uploads/` | **Never public. Never referenced by the site.** |

`media:sync` and `media:backup` are **dry runs** unless given `--execute`. Remote deletion
additionally needs `--delete` and only ever removes objects the current manifest does not
reference. `media:backup` has no `--delete` at all. Re-run it after adding source media.

---

## 8. What is deployed but not yet configured

None of these are faked, and none of them can be switched on from here.

- **Contact form.** `POST /api/contact/` is the one route with `prerender = false`. It
  validates, checks Origin, caps the body at 16 KB, has a honeypot, and verifies Turnstile
  **server-side** on every submission, failing closed. Delivery itself is **not configured**:
  it is not switched on yet, so production refuses a
  submission with `503 not-configured` rather than reporting a success it has no evidence
  for. The recipient, `geral@nextvisionfilms.com`, and the sender are set on the prod Worker, and the
  provider is Cloudflare Email Service; its onboarding and the binding are what is missing
  (`BLOCKED_TODOS.md`).
  `/obrigado/` is the answer the endpoint gives to a POST and is never a link —
  `validate:routes` fails the build if one appears. Local development needs no account and
  no secret. `npm run test:forms` drives the live endpoint.
- **Turnstile.** No production keys. Both live sites serve Cloudflare's always-passes TEST
  site key (read from `/contactos/` on 2026-11-06), which is the fallback when
  `PUBLIC_TURNSTILE_SITE_KEY` is unset at build. With the secret unset too, every submission
  is refused. Whether a Worker secret has been set cannot be read from here.
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

These were set on 2026-09-04; they need an authenticated call to re-check.

- **Default branch** — `dev` (re-checked 2026-11-06)
- **Allow merge commits** — ON
- **Allow squash merging** — OFF
- **Allow rebase merging** — OFF
- **Allow auto-merge** — OFF

A PR is a convenient way to merge `dev -> master`; no review is required and nothing
merges itself. You decide when.

**The repository is public** since 2026-10-29, made so because GitHub billing refused every
Actions job on the private repository. That publishes the archived source data and the
internal project documents along with the code.

**Branch protection is NOT configured:** GitHub's API reports `protected: false` for `dev` and
`master` (2026-11-06). While the repository was private on GitHub Free, both protection APIs
answered `403 Upgrade to GitHub Pro or make this repository public`, so that refusal should no
longer apply; nobody has tried since. Any protection set on `master` must still let the
admin's GitHub App push there.

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
the next `dev -> master` release, the contact recipient and email provider, production
Turnstile keys, the analytics token and the media delivery hostname.

---

## 11. The owners' admin

The owners edit the site at **`nextvisionfilms.com/admin`**, on the prod Worker only. `/admin/`
is a 404 on the dev Worker, and `validate:routes` checks both builds.

- **Login:** Cloudflare Access, emailed one-time code, team `royal-hall-6f88`. The Worker
  verifies the token itself and refuses every request if `ACCESS_TEAM_DOMAIN` or `ACCESS_AUD`
  (in `wrangler.jsonc`) is unset. Any new hostname on the prod Worker must be added to the
  Access application.
- **Editing:** every change is a draft kept in the browser. **Publicar** writes them all as one
  commit to `master` through the GitHub App (its keys are prod Worker secrets), which is one
  production deploy. Validators still run in `prod.yml`, so a bad edit fails before it deploys.
- **Uploads:** originals go to `nvf-source-archive/uploads/`, a request is added to
  `src/data/media-uploads.json`, and `media-ingest.yml` does the rest (§3).
- **Not editable there:** the legal pages, ever (decision A1).

Tests: `npm run test:access` and `npm run test:admin`, both in `verify`. `npm run mock:github`
stands in for GitHub locally. Record: `docs/ADMIN_DASHBOARD_PLAN.md` and
`docs/PROJECT_CONTEXT.md` §21–§32.


## Custom domains (2026-10-22)

| Hostname | Worker |
|---|---|
| `nextvisionfilms.com`, `www.nextvisionfilms.com` | `next-vision-films-production` (prod, live) |
| `dev.nextvisionfilms.com` | `dev` |

All three are Workers **Custom Domains** attached in Cloudflare, not in `wrangler.jsonc`, so
deploys leave them alone (see the comment there). `dev.` replaced a leftover A record pointing
at the old cPanel host (`62.233.41.61`), which served only the host's default placeholder page.
Unchanged on purpose: the `dev` TXT (SPF) record and `www.dev`, which still point at that host.
The dev copy does not compete in search, because every page's canonical points at
`www.nextvisionfilms.com`.
