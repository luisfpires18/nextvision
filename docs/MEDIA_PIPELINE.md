# Media pipeline — R2, derivatives, and how to add more

Phase 12. This is the operating manual for every image and video on the site. It replaces
the prototype pipeline (`scripts/build-review-media.mjs`, `src/data/review-media.json`),
both of which are deleted.

Related: `docs/MEDIA_SOURCE_MAP.md` (which source belongs to which project),
`docs/SMASH_MEDIA_INVENTORY.md` (what the owners supplied),
`docs/SOURCE_ARCHIVE.md` (what was preserved from WordPress).

---

## 1. The shape of it

```
scripts/media/recipe.mjs      WHAT to build — timecodes, crops, widths, and why
        media-build.mjs       encodes derivatives            → media/dist/ + the manifest
        media-inspect.mjs     describes a source file before you write a recipe entry
        media-sync.mjs        uploads media/dist/ to R2      (dry run by default)
        media-backup.mjs      uploads the SOURCES to a private bucket (dry run by default)
        validate-media.mjs    the build gate

media/dist/                   the bucket, mirrored on disk. Gitignored.
src/data/media-manifest.json  the site's only media authority. Committed.
src/lib/media.ts              the only file that joins a host to an object key.
```

Two ideas carry the whole thing:

1. **Every delivered file is content-addressed.** `projects/leonor/hero/1140.a1b2c3d4.mp4`
   ends in eight hex characters of its own SHA-256. Two files with that name are the same
   bytes. So the CDN cache is `immutable` for a year and **no derivative update ever needs
   a purge** — a changed file is a new name. And sync becomes a set difference rather than
   a checksum comparison.

2. **The local mirror is byte-identical to the bucket, at the same relative paths.**
   Switching between them is one environment variable, which is why local development
   needs no network and no credentials.

Nothing in `src/` contains a media URL. The manifest contains no host. `validate:media`
fails the build if either stops being true.

---

## 2. Bucket layout

One **public delivery** bucket, `nvf-media` (company account, `weur`, populated):

```
projects/{slug}/poster/{w}.{hash}.{webp,avif}      the card still, all 20 projects
projects/{slug}/hero/{w}.{hash}.{mp4,webm}         the project page's loop
projects/{slug}/hero/poster/{w}.{hash}.{webp,avif}
projects/{slug}/preview/{w}.{hash}.mp4             the hover loop
projects/{slug}/still-NN/{w}.{hash}.{webp,avif}    editorial frames
pages/home/hero/{w}.{hash}.{mp4,webm}
pages/{page}/{name}/{w}.{hash}.{webp,avif}         /servicos/ lead, /contactos/ banner
team/{person}/portrait/{w}.{hash}.{webp,avif}
```

The manifest key is the **directory** and the rendition is the leaf, so every derivative of
one asset sits together and `projects/{slug}/` lists a project's whole footprint.

There is no `brand/` yet — the owners have supplied no logo (see `docs/PWA-ICONS-TODO.md`),
and inventing one is not on the table. There is no `video/` prefix because a video already
lives under the thing it belongs to, and no `archive/` prefix **in this bucket** because
archives are not delivery (§7).

One **private source-backup** bucket, `nvf-source-archive` (company account, `weur`,
populated). Separate on purpose — §7.

### Long-form film stays on YouTube

R2 holds hero loops, hover previews, short silent cinematic clips and posters. It does
**not** hold the published films: those are on YouTube, façade-loaded, and nothing about
this phase changes that. Cloudflare Stream is not used.

---

## 3. Formats, and what is deliberately absent

| | built | why |
|---|---|---|
| **WebP** | every image, every width | the baseline every supported browser decodes |
| **AVIF** | every image, every width | ~43% smaller, measured on this project's own frames; offered first inside `<picture>` |
| **JPEG** | never | it would only serve browsers that also lack WebP, and there are none in the support target. Three formats to reach nobody. |
| **H.264/MP4** | every clip | universal |
| **VP9/WebM** | hero-class clips only | ~20% smaller. A hero autoplays before the reader has asked for anything; a hover preview is fetched on intent, so a second encode of it is storage nobody downloads. |

Videos are encoded `-an`. A sound control is rendered only where there is sound to control.

The runtime picks WebM in `src/lib/site-motion.ts` (`clipSource`), and only when
`canPlayType` answers `"probably"`. It is chosen in script rather than with `<source>`
elements because these clips are attached lazily — a `<source>` list would start loading
immediately, which is exactly what the motion tiers exist to prevent.

**Nothing is ever upscaled.** A requested width wider than the cropped source is dropped,
not stretched. `validate:media` fails the build on a violation, and the ceiling it checks
is the crop's width where the recipe crops and the source's natural width otherwise.

---

## 4. Where the bytes are served from

`PUBLIC_MEDIA_BASE_URL`, and nothing else.

| unset (the default) | `/__media` — the local mirror. `astro dev` serves it from `media/dist/` through a small Vite middleware; `astro build` copies it into `dist/client/__media/`. No network, no credentials, offline end to end. |
|---|---|
| set | the R2 delivery origin. The mirror is **not** copied into the build, so the deployed Worker carries no media at all. |

Both `astro.config.mjs` and the site's modules resolve it through Vite's `loadEnv`, so the
config and the pages can never disagree. It used to be declared in `wrangler.jsonc` for a
host that has never existed — a local build then emitted links to nothing *and* copied
18 MB into `dist`. That `vars` block is gone; adding it back is correct only once the
hostname is real.

**Cache-Control** is `public, max-age=31536000, immutable` on every object, set at upload
and reproduced by the dev middleware so a caching mistake shows up locally.

**Service worker:** in production the media origin is cross-origin, so the worker does not
touch it. That is intentional — every rendition is immutable in the browser's own HTTP
cache, and filling a 20 MB budget with opaque cross-origin responses would be worse.
Offline gets the shell and the document, not the photography.

---

## 5. Adding media later — the whole workflow

```bash
# 1. look at the file. This writes nothing and never touches the source.
npm run media:inspect -- media/incoming/new-film.mp4
```

It reports dimensions, duration, bitrate, whether it clears the hero floor, a `cropdetect`
measurement of letterbox bars and rounded corners, which widths the source can honestly
fill — and prints a recipe stub.

```bash
# 2. paste the stub into scripts/media/recipe.mjs and choose the window.
```

The timecode is a judgement about the footage, so it is yours: pick a run with no burned-in
caption, no light-leak transition and no client end card, and **write down what it avoids**.
Every existing entry does; that is what makes a regenerated file identical to the one that
was reviewed.

```bash
npm run media:build            # 3. encode. Only what changed is re-encoded.
npm run media:build -- --only projects/new-film    #    or just this one
npm run media:verify           # 4. check it
npm run media:sync             # 5. DRY RUN — see exactly what would upload
npm run media:sync -- --execute   # 6. upload only what is missing
```

Then reference it from content by **key** (`projects/new-film/hero`). No component changes,
no URL is typed anywhere, and no R2 path appears in the repository.

`media:build` is cheap to re-run: every rendition is fingerprinted by source stamp + recipe
+ encoder settings, and an unchanged fingerprint whose file is still in the mirror is not
re-encoded. `--force` ignores the cache.

---

## 6. Credentials

The site uses none. It emits plain HTTPS URLs; there is no R2 binding in `wrangler.jsonc`
and no write credential anywhere in the frontend.

Upload tooling reads `.env` (gitignored) or the environment:

```
R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
```

Get them from **Cloudflare dashboard → R2 → API → Create API token → Object Read & Write**,
scoped to `nvf-media`. Wrangler's OAuth login can `put` and `delete` an object but **cannot
list** one, which is why the S3 API is the primary transport: a sync that cannot list is a
sync that cannot tell you what it is about to do.

Without those keys **both** `media:sync --execute` and `media:backup --execute` still work:
each falls back to `wrangler r2 object put`, one process per file. Correct, slow, and unable
to verify what is already in the bucket — the plan then comes from the local ledger
(`media/.remote-ledger.json`, `media/.backup-ledger.json`) and says so on every run. That
is how the company migration was actually performed; no S3 token exists yet.

The unverifiability costs more on the backup than on delivery. A delivery filename contains
a hash of its own bytes, so a name that is present is bytes that are correct; an archive key
carries no such proof and is worth spot-checking by restore (§9.2).

---

## 7. The private source backup

`source-archive/` (178 MB) and `docs/Smash/` (469 MB) are **not** delivery media. The first
is a byte-faithful copy of a WordPress site including its uploads; the second is the
owners' own footage. Putting either into `nvf-media` would publish the originals of every
film on the site.

They go to `nvf-source-archive` instead, under `archive/wordpress/` and `archive/smash/`.
That bucket is private, is never given a public URL, and is never read by the site.

```bash
npm run media:backup                 # dry run: 102 files, 645.95 MB
npm run media:backup -- --execute    # upload
npm run media:backup -- --only smash
```

It is **not** run automatically and there is no `--delete`: a backup that can prune itself
is not a backup. Note that this material currently exists in exactly one place, on one
machine — so running it is the thing that stops a disk failure from being a project-losing
event (CLAUDE.md §10, standing rule 4).

---

## 8. Safety rules the tooling enforces

- **`media:sync` is a dry run unless you pass `--execute`.**
- **It never deletes by default.** Removing orphaned remote objects needs `--delete` *and*
  `--execute`, and only ever touches objects the current manifest does not reference.
- **Sources are read-only.** Nothing in `source-archive/` or `Smash/` is modified, renamed,
  moved or transcoded in place, by any script here.
- **`validate:media` runs in `npm run verify`** and fails the build on: a missing manifest
  field, an image with no intrinsic size, an upscale, a rendition whose name disagrees with
  its own bytes, two assets claiming one object path, a video with no poster, a content key
  the manifest does not hold, a mirror that is missing a file, a media URL hardcoded in a
  component, and a built page referencing a rendition that does not exist.

---

## 9. Current state

- **86 assets, 384 renditions, 16.69 MB** built, verified, mirrored locally **and uploaded**
  to `nvf-media` on the company account.
- **102 source files, 645.95 MB** uploaded to the private `nvf-source-archive`. Standing
  rule 4 is discharged: the masters are no longer a single copy on one machine.
- **Neither bucket is public.** `r2.dev` is disabled on both and neither has a custom
  domain. That is a deliberate stop — delivery needs DNS, which this phase does not touch.
- `PUBLIC_MEDIA_BASE_URL` is unset, so the site still serves its own mirror and works
  offline. Setting it is the only change needed to move delivery to R2.

### 9.1 The account correction, 2026-09-04

Phase 12 created both buckets on the owner's **personal** Cloudflare account
(`00fbdee9…1dfb`). They were empty; nothing had been uploaded. Wrangler is now
authenticated as `nextvisionfilmsagency@gmail.com`, account `c87adf05…8e39`, R2 has been
enabled there, and both buckets were recreated and filled on that account.

**Cleanup still owed, manually, from the personal account's own session:** delete personal
`nvf-media` and personal `nvf-source-archive`. Nothing in this repo touches that account.

**The trap this walked past.** `media/.remote-ledger.json` listed all 384 objects as
synced. A bucket name is not a bucket, so the ledger could not tell it was describing a
different tenant's bucket of the same name; left in place, the first company sync would
have skipped every file and reported success. It was moved to
`media/.remote-ledger.personal-account.bak.json` before the migration and the plan
correctly read *upload 384*. Both ledgers are regenerated and now name the company buckets.

### 9.2 Verification, and why it is not an object count

`wrangler r2 bucket info` reports `object_count: 0` for a freshly filled bucket. That
figure is a periodic aggregate, not a live count, so it proves nothing either way for hours.
Both uploads were verified by **fetching objects back instead**:

- `nvf-media` — 12 objects spread across the key space, re-downloaded and hashed. All 12
  matched local bytes by SHA-256, and each file's name-embedded hash equalled its actual
  digest, so content-addressing holds end to end.
- `nvf-source-archive` — 5 objects including the three largest (113.8 MB, 65.9 MB,
  64.4 MB). All matched by size, which is what rules out a truncated large upload.

### The one decision left

Choose the delivery hostname, then set `PUBLIC_MEDIA_BASE_URL` to it:

- **`media.nextvisionfilms.com`** — a custom domain on `nvf-media`. Needs a DNS record, so
  it belongs to the deployment phase. This is the one to want.
- **`pub-<id>.r2.dev`** — Cloudflare's managed dev URL. No DNS, one toggle, but it is
  rate-limited and Cloudflare says not to use it in production.
