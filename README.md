# Next Vision Films — website

Rebuild of [nextvisionfilms.com](https://www.nextvisionfilms.com) as a premium, cinematic
production-company site.

**Read [`CLAUDE.md`](CLAUDE.md) first** — it holds the rules every contributor follows.
Current state and decisions live in [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md);
day-to-day operation is in [`docs/HANDOVER.md`](docs/HANDOVER.md).

## Stack

Astro 7.2.10 · `@astrojs/cloudflare` 14.2.6 · MDX · sitemap · TypeScript strict · plain
CSS with custom properties · no UI framework, no CSS framework, no animation library.
Deployed as **one Cloudflare Worker with Workers Static Assets**. Node **>= 22.12.0**,
npm **>= 9.6.5**, one lockfile.

## Getting started

The default branch is **`dev`** — a clone lands there, and that is where work starts.
`master` is the release branch and only ever receives merges from `dev`.

```bash
git config core.hooksPath scripts/hooks   # refuses force-push/deletion of dev and master
npm install
npm run fonts:build      # the six WOFF2 faces — generated, not committed
npm run media:pull       # restore media/dist/ from R2 (needs read-only R2 keys)
npm run dev              # http://localhost:4321
```

`fonts:build` and `media:pull` are needed **once** on a fresh clone: both outputs are
generated and neither is in the repository. Without the media mirror `npm run verify`
fails at its last gate, which is correct — the build is not shippable without it. See
[`docs/HANDOVER.md`](docs/HANDOVER.md) §4.

## Commands

```bash
npm run dev                 # local dev server
npm run build               # production build
npm run check               # astro check (types + templates)
npm run verify              # all eleven validators + build — run before committing
npm run test:forms          # drives the live contact endpoint (needs a running dev server)

npm run deploy              # = deploy:dev
npm run deploy:dev          # verify -> build -> deploy the dev Worker
npm run deploy:prod         # verify -> build -> deploy the prod Worker
npm run preview:cloudflare  # build -> wrangler dev (the BUILT Worker, under workerd)

npm run media:pull          # restore media/dist/ from R2       (read only)
npm run media:build         # rebuild media/dist/ from sources  (needs docs/Smash/)
npm run media:sync          # push media/dist/ to R2            (dry run without --execute)
npm run media:backup        # back the sources up to R2         (dry run without --execute)
npm run archive:source      # re-capture the live WordPress site (read-only, resumable)
```

Manual deploys are **emergency tooling, not the normal workflow** — normally you push.

## Branches and deployment

Two long-lived branches, and one merge commit between them:

```
dev (default)  ->  git push origin dev      ->  CI verify  ->  STAGING Worker
                                                                     |
when you decide it is ready:  PR dev -> master, merged as a merge commit
                                                                     |
                              push reaches master ->  CI verify  ->  PRODUCTION Worker
```

Direct commits on `dev` are normal; feature branches are optional and merge back into
`dev`. Nothing is developed on `master`.

| Branch | Workflow | Cloudflare Worker | URL |
|---|---|---|---|
| `dev` | `.github/workflows/dev.yml` | `dev` | `https://dev.nextvisionfilms.com` |
| `master` | `.github/workflows/prod.yml` | `next-vision-films-production` | `https://www.nextvisionfilms.com` (live) |

Both pipelines are live. A failing `npm run verify` stops the deploy. Staging is never deployed from `master` and
production is never deployed from `dev` — they are two separate workflow files precisely
so that no condition decides which Worker gets overwritten.

No custom domain and no DNS yet; both live on `workers.dev`. That is Step 15.

## Where things are

| Path | What |
|---|---|
| `src/content/` | Content collections (projects, categories, settings…) |
| `src/content.config.ts` | Zod schemas — malformed content fails the build |
| `src/data/` | Generated data: route map, media manifest, media source map |
| `src/lib/` | `media.ts` (storage seam), `seo.ts`, `forms/` |
| `src/i18n/` | Locale routing and UI strings. PT is the source, EN is authored |
| `src/styles/` | Design tokens — **provisional**, see `CLAUDE.md` §4 |
| `scripts/` | Preservation, media and deploy tooling (dependency-free) |
| `docs/` | Audit, architecture, plan, design references, archive records |
| `media/` | **gitignored** — the local delivery mirror, restored with `media:pull` |
| `source-archive/`, `docs/Smash/` | **gitignored** — source material, read-only |

## Documentation

| File | Purpose |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | The rules. Content preservation, motion, media, forms, analytics. |
| [`docs/HANDOVER.md`](docs/HANDOVER.md) | How to run, edit and deploy this site. |
| [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) | Living state: decisions, phase, open questions. |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Technical decisions and rejected alternatives. |
| [`docs/BLOCKED_TODOS.md`](docs/BLOCKED_TODOS.md) | Everything still open. |
| [`docs/MEDIA_PIPELINE.md`](docs/MEDIA_PIPELINE.md) | R2, derivatives, and how to add media. |
| [`docs/STAGING_DEPLOY.md`](docs/STAGING_DEPLOY.md) | The Worker, the deploy, and what staging refuses to pretend. |

## Current phase

The site is built, bilingual, installable, deployed to staging and QA'd against the live
URL. Visual design is still gated on Review A. Every open item is in
[`docs/BLOCKED_TODOS.md`](docs/BLOCKED_TODOS.md).
