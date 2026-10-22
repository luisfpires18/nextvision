# Admin dashboard — plan

**Status:** PLAN ONLY, 2026-10-22. Nothing here is built or provisioned. Decisions A1–A6
are made (§7); the in-text **DECISION** markers point there.

**The ask.** The owners must change the site themselves — "today there is a video, tomorrow
it might be another" — without Claude Code and without a developer. A login, and access to
everything that is content.

**The short answer.** Almost everything on the site is already content-as-data
(`src/content/`, Zod-validated, media by KEY). That was designed for exactly this
(`docs/ARCHITECTURE.md` §4.4). An admin is therefore a **form that writes the same files
and a button that runs the pipeline that already exists** — not a CMS, not a database,
not a rewrite. Four things are still hardcoded in components and must move into content
first (§2.2), and the media pipeline must learn to run in CI instead of on Luís's machine
(§4). Those two are the real work.

---

## 1. Recommendation in one paragraph

> **Amended 2026-10-22 (decision A8):** the admin lives on the **prod** Worker, at
> `nextvisionfilms.com/admin`, not on dev. Saves still commit to `dev`, which is still the
> preview, and Publish still merges `dev → master`. Where this document says the admin is
> on the dev Worker, read prod. §3.1 records the first setup as it happened.

A small **custom admin at `/admin/`, served only by the `prod` Worker**, behind
**Cloudflare Access** (email one-time code — no passwords stored by us, no user table).
Every save is a **commit to `dev` through a GitHub App**, so CI builds it, runs all eleven
validators, and deploys it to the dev URL as a **live preview**. A **Publish** button opens
and merges the `dev → master` PR — the same deliberate promotion that is the only path to
production today. Video and image uploads go **straight to the private R2 source bucket**,
and a new CI job encodes them with the existing `media:build`, syncs, and commits the
manifest. Git stays the single source of truth; nothing the validators guard can be
bypassed from the admin.

---

## 2. Content inventory — what exists, and can it be controlled

### 2.1 Already data, editable with no code change

| Content | Where | Count | Admin control |
|---|---|---|---|
| Projects | `src/content/projects/*.mdx` | 20 | Full: title, tagline, categories, tags, featured, homepage/portfolio order, draft, date/year, client, roles, credits, film (YouTube / Vimeo id / R2), poster, hero still, hero & preview video, the 9 page blocks, related, previous slugs, SEO |
| Categories | `src/content/categories/*.yml` | 5 | Name PT/EN, description, order, hidden. `internalId` and `accentToken` read-only |
| Collections (curated sets) | `src/content/collections/` | 0 | Create / edit / order |
| Services | `src/content/services/*.md` | 4 | Title, description, excerpt, order. Excerpt is **picked** from the description, never typed (the A44 refine) |
| Team | `src/content/team/*.md` | 2 | Name, role, portrait, links, order |
| Testimonials | `src/content/testimonials/` | 0 | Create / edit / order (none published today) |
| Site settings | `src/content/settings/site.yml` | 1 | Phones, socials, copyright, organisation; **email** — see D2 below |
| Homepage selection | `featured` + `homepageOrder` on projects | — | Drag-to-order list |
| Portfolio order | `portfolioOrder` on projects | — | Drag-to-order list |

### 2.2 Hardcoded today — must move into content first

| What | Where it lives now | Move to |
|---|---|---|
| **Homepage hero video** | `HomePage.astro:40` — `heroKey = 'projects/ana-reels/hero'` | new `settings/home.yml` → `heroVideo: <key>` |
| Homepage copy (verbatim PT + EN) | `src/lib/homepage.ts` (`HOME`) | `settings/home.yml` (or `pages/home.mdx`) |
| Contact banner image | `ContactPage.astro:60` | `pages/contactos` entry |
| Services lead image | `ServicesPage.astro:62` | `pages/servicos` entry |
| BTS frames | `BtsPage.astro` `FRAMES` | `pages/bts` entry (ordered list of media keys) |
| About / Services / Contact page copy | page components + `lib/` | the empty `pages` collection already in the schema |

This is a pure refactor: same output, byte-identical pages, verified by diffing `dist/`
before and after. It is worth doing **even if the admin is never built** — it is what
"change the video without Claude Code" actually depends on.

### 2.3 Deliberately NOT editable from the admin

| What | Why |
|---|---|
| Legal pages | Locked by `validate:legal` + SHA lock. A new legal text is a lawyer's document, replaced by a developer with `legal:build`. **DECISION A1** if they want it |
| Navigation / rail | It IS the design (five logo stripes, five sections). Changing it is design work |
| UI labels (`src/i18n/*.ts`) | Interface chrome, not content. Rarely changes |
| Design tokens, motion, fonts | Design system; changes go through Tatiana |
| Contact-form delivery | Configured once (D17); not a content setting |
| Analytics | Link out to the Cloudflare Web Analytics dashboard instead |

### 2.4 The rules the admin must respect (and where they collide)

- **Content preservation (CLAUDE.md §2).** That rule binds *agents*, not owners — the owners
  are the source of truth. But `validate:data` today fails the build on any homepage /
  about string that is not word-for-word in the archive. **DECISION A2:** owner edits get
  provenance `owner, <date>` and the validator accepts them; archived strings stay as the
  baseline the §2.1 diff is measured against. Without this, the first copy edit breaks CI.
- **PT is required, EN optional** — the form shows both side by side; a missing EN on a
  reachable page is flagged before save, the same check `validate:i18n` runs.
- **Proper nouns** (project titles) have no EN field at all.
- **Media is a KEY.** The admin never shows a URL field.
- **Aspect ratios are read, never typed** — no ratio field anywhere.
- **D2 — the contact email is disputed.** The admin shows the three candidates and lets the
  owners **confirm one**, which sets `emailStatus: confirmed`. That closes a blocker.

---

## 3. Login and access

**Cloudflare Access (Zero Trust), email one-time PIN.** Free up to 50 users.

- An allowlist of owner emails. They type their email, receive a 6-digit code, they are in.
  No password to forget, leak or reset; no account system for us to build or secure.
- Access sits **in front of** `/admin/*` and `/api/admin/*` on the prod Worker. The Worker
  also verifies the `Cf-Access-Jwt-Assertion` JWT on every admin API call (defence in depth:
  a misconfigured Access policy must not equal an open admin).
- Session length: 24 h (Access setting).
- Adding a person = adding an email in the Cloudflare dashboard. **DECISION A3:** which
  emails, and do they want Google sign-in as well as the code.
- The dev Worker has **no admin route at all** — it is not built there (`IS_DEV`-style
  build flag), so the live domain exposes nothing.

Rejected: our own username/password table (a database, hashing, reset flow, brute-force
protection — all for 2–3 users). GitHub login (Decap/Sveltia default) — owners would need
GitHub accounts and repo access.

### 3.1 One-time setup (done by Luís, not by an agent)

These are account settings on Cloudflare and GitHub, so they are done by hand.

**Cloudflare Access** (Zero Trust, company account `c87adf05…8e39`):

1. Zero Trust → create the team (free plan, up to 50 users).
2. Settings → Authentication → enable **One-time PIN**. Nothing else.
3. Access → Applications → add an application in front of the dev Worker's admin, with
   one policy: *Allow*, *Emails*, `nextvisionfilmsagency@gmail.com`. Session: 24 h.
4. Copy the application's **AUD tag** and the team domain (`<team>.cloudflareaccess.com`)
   into the dev Worker as variables `ACCESS_AUD` and `ACCESS_TEAM_DOMAIN`. The Worker
   verifies the JWT against them and refuses every admin request when either is unset.

**Done 2026-10-22, by API.** Team `royal-hall-6f88`, one-time PIN as the only identity
provider, and app "NVF admin" on `dev.next-vision-films.workers.dev/admin` with an
auto-redirect to the code screen. Neither value below is a secret:

- `ACCESS_TEAM_DOMAIN` = `royal-hall-6f88.cloudflareaccess.com`
- `ACCESS_AUD` = `f1b7ab18b88a7e1085ce1e271598a9d1b31d750c195b39552a3b44d8a6abe722`

**Two hostnames.** The dev Worker also answers on the custom domain `dev.nextvisionfilms.com`,
which was not recorded anywhere when Access was first set up. The admin there refused every
request with `403` because Access was not in front of it, so no token reached the Worker.
That is the fail-closed design working. The app now lists both `/admin` destinations
(updated by API, 2026-10-22), and its AUD is unchanged. Verified end to end the same day:
signing in with the emailed code on `dev.nextvisionfilms.com/admin/` reaches "Conteúdo do site". **Any new hostname bound to the dev
Worker must be added to this app**, or its admin refuses everyone.

Path scoping **does** work on `workers.dev`. Measured: `/admin` and `/admin/` answer `302`
to the team's login page, and `/servicos/` still answers `200`. The dev preview stays
public, and no custom domain was needed.

**GitHub App** (owned by `luisfpires18`, installed only on `luisfpires18/nextvision`):

1. Settings → Developer settings → GitHub Apps → New. No webhook.
2. Repository permissions: **Contents: read & write**, **Pull requests: read & write**,
   **Actions: read** (for the build status). Nothing else, and no account permissions.
3. Install it on `nextvision` only.
4. Store the App ID, installation ID and private key as **prod** Worker **secrets** (A8). They never
   go in the repository or in `wrangler.jsonc`.

Why an App and not a personal access token: commits carry a bot author instead of Luís's
name, tokens last one hour and are minted on demand, and no long-lived token can expire
silently and break saving.

---

## 4. How a save becomes the live site

```
 owner (browser)               prod Worker                GitHub                    Cloudflare
 ───────────────                ──────────                ──────                    ──────────
 edit form ── save ──────────▶ /api/admin/save ──commit──▶ dev branch ──CI verify──▶ dev Worker
                                 (Access JWT,                (GitHub App,              = PREVIEW
                                  same Zod schema)            bot author)
 "Publicar" ── confirm ──────▶ /api/admin/publish ─PR+merge▶ master ────CI verify──▶ prod Worker
                                                                                     = LIVE
 upload video ───────────────▶ R2 multipart ─────────────▶ nvf-source-archive/incoming/…
                                                   │
                                  workflow_dispatch▼
                               media-ingest.yml: ffmpeg → media:build --only <key>
                               → media:sync --execute → commit manifest + content to dev
```

- **Saving** validates with the same Zod schemas server-side before committing, so a bad
  edit is refused with a readable message instead of a red CI run.
- **Preview** is real: the dev Worker URL after ~1–2 min (current CI time). The admin polls
  the GitHub Actions API and shows *Building → Ready to preview → Failed (reason)*.
- **Publish** shows the list of changes since the last publish (commit messages written by
  the admin in plain language: "Homepage: hero video replaced"). Production still only moves
  by a `dev → master` merge — it is just an owner pressing it.
- **No undo button** (decision A9, 2026-10-22): a mistake is fixed by editing again. The only thing
  an edit-back does not restore is the field's source label (`owner:` stays), which no visitor sees.
- **Concurrency:** each save commits against the file's current SHA; a conflict tells the
  owner someone else changed it and reloads.

### 4.1 Media ingest (A4) — revised 2026-10-22, after A1–A3 shipped

Today `media:build` runs on Luís's machine against 646 MB of local sources, with a
hand-written `recipe.mjs` entry per asset. Two facts learned while building A1–A3 change
the original sketch:

- **The admin runs on the LIVE Worker, so its media list is the live one.** A file
  processed into `dev` cannot be shown or picked there until it is published, and its
  renditions are not on the live Worker either. So v1 does not upload into a library and
  then pick from it. Each media field gets **"Carregar novo…"**: the owner uploads FOR
  that slot (the homepage film, a BTS frame), and processing puts the file and the field
  change into `dev` together. The preview then shows it, and Publicar releases it like any
  other save.
- **CI must commit as the App.** A push made with GitHub's own Actions token does not
  trigger other workflows, so the preview would never rebuild. The publish rule also only
  trusts the App. So the ingest workflow mints an App token (`actions/create-github-app-token`)
  and commits as `nvf-admin-luisfpires18[bot]`.

The flow:

```
admin (live)                         R2 (private)                GitHub (dev)                 CI
────────────                         ────────────                ────────────                 ──
choose file → plays LOCALLY in the browser: mark loop start/end + cover frame (no upload yet)
"Carregar" → multipart upload ─────▶ nvf-source-archive/uploads/<date>/<id>/<name>
           → POST /admin/api/media ─────────────────────────────▶ commit (App): src/data/media-uploads.json
                                                                  += { key, field, window… }
                                                                        │ push to dev (paths filter)
                                                                        ▼
                                                     media-ingest.yml: ffmpeg · pull that source ·
                                                     media:build --only <key> · media:verify ·
                                                     media:sync --execute (add-only) ·
                                                     commit (App token): manifest + field + status
                                                                        │ push
                                                                        ▼
                                                     dev.yml builds the preview WITH the new media
```

1. **Upload**: browser → Worker → R2 **multipart** into the private `nvf-source-archive`
   (50 MB parts; a Worker request body caps at 100 MB). Max 2 GB (A5). The source is backed
   up the moment it lands, which satisfies rule 4. The prod Worker gets an `r2_buckets`
   binding to that bucket, and the code writes only under `uploads/`.
2. **Window**: chosen on the LOCAL file before uploading (`URL.createObjectURL`, a
   `<video>` and a canvas filmstrip). That's instant, needs no round trip, and the upload
   happens once.
3. **Owner recipes are data**: `src/data/media-uploads.json` (not under `media/`, which is
   gitignored whole), a list the App appends to and `media-build` reads alongside `recipe.mjs`. The hand-written recipes stay as they are.
   Each entry records the window, the cover time and the owner's note on what the window
   avoids.
4. **`media-ingest.yml`**, on push to `dev` touching `src/data/media-uploads.json`. It refuses below
   the hero floor (`media:inspect`) and records the measured reason in the entry, which the
   admin shows. It uploads renditions add-only, never `--delete`.
5. **Images** take the same path with no window.
6. **Publish rule**: allowed files grow to include `src/data/media-manifest.json` and
   `src/data/media-uploads.json`. Allowed authors stay the App only.
7. **Long-form films stay on YouTube/Vimeo**: a pasted link, from which the 11-char id is
   extracted.

Delivery is unchanged: the build still ships media from the mirror that `media:pull`
fetches from `nvf-media`, so new renditions only need to be in that bucket before the
preview builds. A media hostname (Step 15) is not needed.

**Prerequisites (Luís, outside the repo):**
- **An R2 API token for CI** with Object Read & Write on `nvf-media` and Object Read on
  `nvf-source-archive`. The token CI has today was made for `media:pull`, and its scope is
  unknown.
- **The App's credentials as GitHub Actions secrets** (`NVF_ADMIN_APP_ID`,
  `NVF_ADMIN_APP_PRIVATE_KEY`, a NEW private key). An App may hold several keys, so the
  Worker's key stays valid.

---

## 5. Admin UI — design plan (frontend-design)

**Subject.** A film company's back room. Audience: 2–3 owners, Portuguese, comfortable with
cameras and editing software, not with web tooling. Primary job: *replace a piece of footage
or a line of text and see it on the real site before anyone else does.*

**Concept: the edit bay.** Not a SaaS dashboard. The owners already know one interface for
"material in, cut out": an NLE. The admin borrows its logic — a **bin** (the content), a
**viewer** (the real site), a **timeline** (only where time matters: choosing a video loop).
It borrows nothing of its chrome.

### 5.1 Tokens

Reuses the site's own token files; adds an `admin` layer, no new families.

| Role | Value | Note |
|---|---|---|
| Ground | `--ink` `#292929` | The room is dark so footage reads true — the reason edit suites are grey |
| Surface | ink + 6 % cream | Panels distinguished by tone, not borders or shadows |
| Text | cream `#F0EAD6` | Already measured ≥ 4.5:1 on ink (`PROJECT_CONTEXT.md` §7.2) |
| Section colour | the five rail colours | Each content area wears its section's stripe, exactly as the site does |
| State: unsaved / building / live | gold / teal / cream | Re-used, not new hues; each also has a word, never colour alone |
| Danger | rust `#D54B27` | Delete, unpublish |

Type: **Barlow** for everything; **Barlow Condensed** only for the one large element per
screen (the project title in the viewer header). No mono labels, no all-caps eyebrows.
Every size, colour, duration is a token — same rule as the site.

### 5.2 Layout

The navigation **is the rail** — the five stripes on the left this time, one per content
area, plus a sixth neutral stripe for settings. Owners learn one map for both site and admin.

```
┌──┬────────────────────────────┬──────────────────────────────────────────────┐
│▌ │ Projetos            + Novo │                                              │
│▌ │ ─────────────────────────  │        VIEWER — the real dev-Worker page     │
│▌ │ ▢ Epitáfio        rascunho │        (iframe, follows the open item)       │
│▌ │ ▣ Leonor          ● alter. │                                              │
│▌ │ ▢ Lost Lines               │                                              │
│▌ │   …  (drag to reorder)     │                                              │
│  │                            ├──────────────────────────────────────────────┤
│▒ │ ── open item ───────────── │  PT                     │  EN                │
│  │ Título, categorias, filme  │  tagline …              │  tagline …         │
│  │ Imagens / vídeo  [Trocar]  │                         │                    │
└──┴────────────────────────────┴──────────────────────────────────────────────┘
 status bar:  2 alterações por publicar · pré-visualização pronta · [ Publicar ]
```

Left-aligned throughout. PT and EN always side by side, never tabs — a missing translation
is visible as an empty column, not a hidden tab.

### 5.3 The one bold moment: replacing a video

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         [ the uploaded footage, playing ]                    │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ ░░░░░░░░░░░░░░[■■■■■■■■■■■■■■■■■■]░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│               ↑ início 00:12.4    ↑ fim 00:19.0      ◆ capa 00:14.2          │
│ O que esta janela evita: [ sem legendas queimadas, sem cartão final      ]   │
│ 1920×1080 · 24 fps · acima do mínimo para hero ✓                [ Usar ]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

A filmstrip of real frames (sampled in-browser with `<video>` + canvas), two handles and a
poster diamond. The measured facts from `media:inspect` appear underneath in plain words.
Everything else in the admin stays quiet so this is the screen people remember.

### 5.4 Copy

Portuguese UI, plain verbs, one name per action across the flow: **Guardar** → toast
"Guardado — pré-visualização em ~1 min"; **Publicar** → "Publicado no site". Errors say what
and how to fix ("Falta a imagem de capa — o vídeo precisa de uma para carregar sem ecrã
preto"), drawn from the schema's own messages, which already explain *why*.

### 5.5 Floor

Keyboard-complete (drag-to-reorder has up/down buttons), visible focus, `data-motion` tiers
respected, usable on a tablet. A phone gets text edits and publish; upload/timeline is
desktop and tablet.

---

## 6. Phases

Each phase ships on its own and is useful without the next.

| # | Phase | Delivers | Size |
|---|---|---|---|
| A0 ✅ | Content extraction (§2.2) | Hero video, page images, page copy, BTS frames become data in `src/content/page-content/*.json`. Done 2026-10-22; `PROJECT_CONTEXT.md` §20 | S |
| A1 ✅ | Access + shell | `/admin/` on dev Worker only, Cloudflare Access, JWT check, read-only browse of all content. Done 2026-10-22; `PROJECT_CONTEXT.md` §21 | S |
| A2 ◐ | Text & settings editing — **slice 1 done 2026-10-22** (the seven page screens: texts and media picks; `PROJECT_CONTEXT.md` §23). Collections (projects, services, team, settings) still to come | Forms for every §2.1 collection, schema validation server-side, commit via GitHub App, build status | M |
| A3 ✅ | Publish | `dev → master` PR/merge button, with the list of what is waiting to go live, refused unless everything waiting is owner content. No undo (A9). Done 2026-10-22; `PROJECT_CONTEXT.md` §24 | S |
| A4 ◐ | Media ingest — **built 2026-10-22, not yet live** (`PROJECT_CONTEXT.md` §25) | R2 multipart upload, `recipes.json`, `media-ingest.yml`, video window picker, image upload | L |
| A5 | Ordering & blocks | Drag-to-order homepage/portfolio, project page block editor (the 9 closed types) | M |

**Smallest useful slice for "change the video tomorrow":** A0 + A1 + A3 + the video path
of A4. Text editing (A2) can follow.

### 6.1 Considered and rejected

| Option | Why not |
|---|---|
| **Sveltia / Decap CMS** (`ARCHITECTURE.md` §4.4 option 1) | Zero code for text, but: owners need GitHub accounts; uploads land **in git** (forbidden, CLAUDE.md §6); cannot run the video pipeline; generic UI. Still the fallback if budget only covers text editing |
| **Keystatic** | Same media-in-git problem; needs its own auth story on Workers |
| **Headless CMS** (Sanity, Storyblok) | Already rejected (`ARCHITECTURE.md` §15): hosted dependency, cost, second source of truth |
| **Database (D1) as content store** | Two sources of truth; the validators and git history stop being the guarantee |
| **Own login system** | §3 |

---

## 7. Decisions

Decided by Luís, 2026-10-22.

| Id | Question | Decision |
|---|---|---|
| A1 | Legal pages editable in the admin? | **Never.** A new legal text goes to a developer, who runs `legal:build` and re-locks it |
| A2 | Owner edits to archived copy? | **Allowed, with provenance `owner, <date>`.** `validate:data` accepts owner strings; the archive stays the untouched baseline |
| A3 | How owners sign in | **Cloudflare Access, email one-time code only.** No Google sign-in. Allowlist: `nextvisionfilmsagency@gmail.com` (Luís, 2026-10-22), shared by the owners and Luís; no other address. This is a login address only and does **not** settle D2, the public contact email |
| A7 | Where edits are committed | **`luisfpires18/nextvision`**, through a GitHub App owned by Luís's account and installed on that repository only (§3.1) |
| A4 | Who publishes to the live site | **Owners.** Publish merges `dev → master` after a confirm screen listing the changes; validators still block anything broken |
| A5 | Max upload size per video | **2 GB** |
| A10 | Save / preview / publish steps | **One Publicar, straight to production** (Luís, 2026-10-22). Edits are drafts kept in the browser, across pages; Publicar shows them all in a modal and writes them as ONE commit to `master` = one deploy, followed until live. No Save, no `dev` preview, no Publish page. Uploads publish themselves once processed; a refused file never deploys. `dev` is the developer's branch only. Supersedes the save-to-dev parts of §4 and of A3/A8 |
| A9 | Undo button | **None.** A mistake is fixed by editing again; only the field's source label (`owner:`) is not restored, and no visitor sees it (Luís, 2026-10-22) |
| A8 | Where the admin lives | **On the live site, `nextvisionfilms.com/admin` (prod Worker only).** Moved from dev the same day it was built. Saves still go to `dev` (preview), Publish still merges to `master`. The prod build carries the admin route; dev carries none (Luís, 2026-10-22) |
| A6 | Media hostname | **Deferred to Step 15.** Not needed for A0–A3; until then CI pulls new media into the build mirror |

Still open: D2 (which contact email is canonical). Access is set up and guards `/admin`
only (§3.1).

## 8. Cost

Cloudflare Access: free ≤ 50 users. GitHub App: free. R2: existing buckets, pennies.
GitHub Actions: video encodes are the only new minutes (~2–5 min per video on the free
2 000 min/month private-repo allowance).
