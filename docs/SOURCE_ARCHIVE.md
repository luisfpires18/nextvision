# Source Archive — preservation of the live WordPress site

**Captured:** 2026-09-02 · **Script:** `scripts/archive-source.mjs` · **Result:** 34/34 pages, 9/9 endpoints, 39/39 media originals, **0 failures**

The owners expect nextvisionfilms.com to become unavailable around the end of 2026.
This archive exists so the migration never depends on it being online again.

**The archive is read-only evidence.** Nothing here is edited. It is the baseline every
later content diff is measured against (`CLAUDE.md` §2).

---

## 1. What is where

| Path | Tracked? | Contents |
|---|---|---|
| `docs/source-archive/*.json` | **committed** | Structured extraction — the durable record |
| `source-archive/wordpress/html/` | gitignored | 34 raw HTML responses, byte-faithful (2.6 MB) |
| `source-archive/wordpress/rest/` | gitignored | 9 raw REST / sitemap / robots responses (802 KB) |
| `source-archive/wordpress/media/` | gitignored | 39 media originals (175 MB) |
| `docs/Smash/` | gitignored | Owner-supplied source media (469 MB) — see `SMASH_MEDIA_INVENTORY.md` |

Binaries are excluded from git by policy (`CLAUDE.md` §6). The committed JSON carries
every fact we need; the raw files are the last-resort fallback.

> ### ⚠ The gitignored archive is currently a single copy on one machine
> 175 MB of WordPress media + 469 MB of `Smash/` exist **only** in this working
> directory. Until they are uploaded to R2 (Implementation Phase 3) or backed up
> elsewhere, a disk failure loses them. **This is the largest open risk in the project.**

---

## 2. Committed record

| File | Contents |
|---|---|
| `archive-summary.json` | Capture run: counts and per-endpoint status |
| `pages.json` | Per URL: title, all `<meta>`, canonical, hreflang, icons, **JSON-LD**, headings with levels, every anchor (href + text + aria-label), images with alt/dimensions, iframes, **Elementor widget settings** (YouTube ids, background videos, sticky config), Elementor widget types, **full form structure**, body classes, and the visible text of `<main>`. Plus the raw file path, byte length and SHA-256 of each response |
| `endpoints.json` | WP REST root (plugin namespaces), types, pages, media, Polylang languages, robots.txt, all three sitemaps — with sizes, checksums and `X-WP-Total` |
| `media-archive.json` | Per asset: original URL, local path, bytes, content type, **SHA-256**, pages referencing it, original-vs-derivative |
| `media-source-map.json` | Cross-source map — see `MEDIA_SOURCE_MAP.md` |

Earlier extracts from the audit remain in `docs/content/` (verbatim legal text, per-page
extraction, portfolio items, media inventory). They are unchanged and still canonical.

---

## 3. What was preserved

**Pages (34/34):** 8 PT pages · the EN stub · 20 project pages · 5 category archives.
Every one returned 200.

**Structured data per page** — titles, meta descriptions, Open Graph, Twitter cards,
canonicals, hreflang, Yoast JSON-LD (`WebPage`, `BreadcrumbList`, `WebSite`,
`Organization`), heading hierarchy, internal and external links, image alt text,
form field structure, and the Elementor settings blobs that hold the YouTube ids and
background-video references.

**WordPress REST** — `wp-json` root (which fingerprints the plugin set), post types,
all 9 pages, the media library (93 attachments, 64 publicly readable), and Polylang's
language configuration.

**Polylang** confirms the i18n architecture: `pt` / `pt_PT` is default and unprefixed;
`en` / `en_GB` exists with its home at the empty `/en/homepage-english/` stub.

**Media (39/39 originals, 174.5 MB)** — 20 PNG, 4 JPG, 2 JPEG, 1 SVG, 8 `.mov`, 2 `.mp4`,
2 TTF. **38 WordPress-generated size variants were deliberately skipped**; the original
upload is archived instead, and `media-archive.json` records each skipped variant and the
original it derives from.

**Routes** — every URL, redirect and dead route is in `src/data/routes.json`; see
`ROUTE_MIGRATION.md`.

---

## 4. What is *not* preserved, and cannot be

| Missing | Why | Consequence |
|---|---|---|
| WordPress admin: plugin list, theme settings, Elementor template internals | No credentials | Inferred from public output only |
| Form submission destination (recipient, autoresponder, integrations) | Server-side config | **Decision D17 / D18 stay blocked** |
| Newsletter subscriber list and destination | Server-side | Blocked |
| 29 media attachments (93 total − 64 REST-readable) | Not enumerable anonymously | Unknown whether any are still in use |
| Google Analytics / Search Console history | No account access | No traffic baseline for the migration |
| The 20 films at full quality | They live on YouTube | See `MEDIA_SOURCE_MAP.md` — 19 of 20 are `MASTER_REQUIRED` |
| Database, PHP/WordPress versions | Not disclosed | Not needed |

---

## 5. Re-running

```bash
node scripts/archive-source.mjs            # everything (media is resumable — cached files are skipped)
node scripts/archive-source.mjs --no-media # pages and REST only
```

Read-only: it only ever issues GETs, never authenticates, never mutates. Media downloads
resume — already-downloaded files are checksummed and skipped, so an interrupted run costs
nothing.

The script is **dependency-free on purpose** (no `node_modules`), so it still runs years
from now against whatever is left.

---

## 6. Verification performed

- All 34 pages returned 200; SHA-256 recorded for every response.
- All 9 endpoints returned 200.
- All 39 media originals downloaded with checksums; 0 failures.
- `git add --dry-run` confirms **zero** media binaries and **zero** secrets would be tracked.
- `docs/content/` extracts from the 2026-09-01 audit remain byte-identical — no drift.

## 7. Outstanding

1. **Back the archive up off this machine.** Phase 3 uploads it to R2 under `archive/wordpress/`; until then it is a single copy (§1).
2. Obtain masters for the 19 projects marked `MASTER_REQUIRED` (`MEDIA_SOURCE_MAP.md` §4).
3. Decide whether `docs/Smash/` moves out of `docs/` (decision R12).
