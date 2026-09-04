# `Smash/` Source Media Inventory

**Location:** `docs/Smash/` (in this repository — capitalised `Smash`, not `smash`)
**Inventoried:** 2026-09-01
**Files:** 20 · **Total:** 469 MB · **Folder mtime:** 2026-05-31, files 2026-05-28

**Nothing in this folder has been modified, renamed, transcoded, moved or uploaded.**
Read-only inspection with `ffprobe` only.

---

## 1. Headline finding — this is not a master archive

**17 of the 20 files are 1280×720.** Their bitrates (640–2 325 kbps), 24 fps cadence, and
AAC 44.1 kHz stereo audio are the signature of **YouTube-grade downloads or web exports**,
not camera masters or grading exports.

**Only 3 files are 1920×1080, and only those look like genuine masters:**

| File | Resolution | Bitrate | Audio | Reading |
|---|---|---|---|---|
| `Prato 2 v1.mov` | 1920×1080 | **18 233 kbps** | **PCM 24-bit / 48 kHz** | Master or near-master |
| `Prato sobremesa v1.mov` | 1920×1080 | **18 419 kbps** | **PCM 24-bit / 48 kHz** | Master or near-master |
| `film in 1 v2.mp4` | 1920×1080 | **14 329 kbps** | AAC 48 kHz | High-quality export |

**Consequence for the build:** `Smash/` is **not automatically the best source** for most
projects. For the 17 × 720p files, the YouTube-hosted version is very likely equal or
better. `Smash/` is authoritative as a *record of what exists* — including six pieces of
work that are **not on the website at all** — but a hero video cut from a 720p, 1 Mbps
file will look poor on a 1440px display.

→ **Owner action required:** supply true masters (ProRes / DNxHR / ≥1080p high-bitrate, ideally 4K)
for anything intended for a cinematic hero or fullscreen use. See §6.

---

## 2. Complete inventory

All files: H.264 High profile, `yuv420p`. Sorted alphabetically.

| # | Filename | Ext | Size | Duration | Resolution | fps | Bitrate | Audio |
|---|---|---|---|---|---|---|---|---|
| 1 | `Can´t live in you books anymore.mp4` | mp4 | 13.94 MB | 53.92 s | 1280×720 | 24 | 2 168 k | aac 2ch 44.1k |
| 2 | `Celebrate Pride with Dr Bernard (1).mp4` | mp4 | 16.41 MB | 59.21 s | 1280×720 | 24 | 2 325 k | aac 2ch 44.1k |
| 3 | `DigiUp anúncio.mp4` | mp4 | 5.21 MB | 49.09 s | 1280×720 | 24 | 890 k | aac 2ch 44.1k |
| 4 | `Don´t let it fool you.mp4` | mp4 | 16.67 MB | 114.43 s | 1280×720 | 24 | 1 222 k | aac 2ch 44.1k |
| 5 | `Fading.mp4` | mp4 | 6.91 MB | 55.05 s | 1280×720 | 24 | 1 052 k | aac 2ch 44.1k |
| 6 | `Helder Vs Karl Largerfeld.mp4` | mp4 | 11.70 MB | 63.76 s | 1280×720 | 24 | 1 539 k | aac 2ch 44.1k |
| 7 | `In the end.mp4` | mp4 | 7.74 MB | 29.26 s | 1280×720 | 24 | 2 220 k | aac 2ch 44.1k |
| 8 | `NVF Showreel.mp4` | mp4 | 25.47 MB | 189.10 s | 1280×720 | 24 | 1 130 k | aac 2ch 44.1k |
| 9 | `NVF showreel 2026.mp4` | mp4 | 8.14 MB | 55.17 s | 1280×720 | **30** | 1 237 k | aac 2ch 44.1k |
| 10 | `NVF VS Antiqvvm.mp4` | mp4 | 14.62 MB | 64.46 s | 1280×720 | 24 | 1 903 k | aac 2ch 44.1k |
| 11 | `NVF VS Filmin.mp4` | mp4 | 2.16 MB | 28.31 s | 1280×720 | 24 | 640 k | aac 2ch 44.1k |
| 12 | `Prato 2 v1.mov` | **mov** | **113.84 MB** | 52.38 s | **1920×1080** | 24 | **18 233 k** | **pcm_s24le 48k** |
| 13 | `Prato sobremesa v1.mov` | **mov** | **65.87 MB** | 30.00 s | **1920×1080** | 24 | **18 419 k** | **pcm_s24le 48k** |
| 14 | `Sometimes it´s just the start (1).mp4` | mp4 | 35.25 MB | 143.85 s | 1280×720 | 24 | 2 056 k | aac 2ch 44.1k |
| 15 | `The endless _WAVES_.mp4` | mp4 | 11.63 MB | 54.85 s | 1280×720 | 24 | 1 779 k | aac 2ch 44.1k |
| 16 | `The lie we tell ourselves.mp4` | mp4 | 5.61 MB | 50.69 s | 1280×720 | 24 | 929 k | aac 2ch 44.1k |
| 17 | `Unfinished.mp4` | mp4 | 7.57 MB | 80.36 s | 1280×720 | **25** | 790 k | aac 2ch 44.1k |
| 18 | `Video Long Version O Gato que Bebe.mp4` | mp4 | 31.76 MB | 227.56 s | 1280×720 | **30** | 1 171 k | aac 2ch 44.1k |
| 19 | `We are NVF.mp4` | mp4 | 3.30 MB | 20.09 s | 1280×720 | 24 | 1 376 k | aac 2ch 44.1k |
| 20 | `film in 1 v2.mp4` | mp4 | **64.43 MB** | 37.72 s | **1920×1080** | 24 | **14 329 k** | aac 2ch 48k |

**Filename hazards.** Items 1, 4 and 14 contain **`´` (U+00B4 acute accent)**, not an
apostrophe. Item 15 uses underscores where quotes were intended (`_WAVES_`). Item 2 and 14
carry a trailing ` (1)` — the browser-download duplicate marker. Every name has spaces,
and item 3 has a diacritic (`anúncio`). **None of these names is safe as a URL or an object
key.** The R2 convention (`ARCHITECTURE.md` §6.2) derives keys from project slugs, so these
names never reach the web — but any script touching this folder must quote paths.

---

## 3. Match against the live website

Cross-referenced against the 20 portfolio projects and the WordPress media library in
`docs/WEBSITE_AUDIT.md`.

### 3.1 Confirmed by duration match against WordPress media

| `Smash/` file | Duration | WordPress file | WP duration | Verdict |
|---|---|---|---|---|
| `NVF Showreel.mp4` | 189.10 s | `vcompress_210.mov` (46.11 MB, **orphan**) | 3:09 = 189 s | **Same content.** The audit's unexplained 46 MB orphan is the showreel |
| `We are NVF.mp4` | 20.09 s | `videoplayback.mp4` (1.00 MB, **orphan**) | 0:20 | **Same content.** The second orphan is identified |
| `We are NVF.mp4` | 20.09 s | `We-are-NVF-copia.mp4` (5.68 MB, homepage hero) | 0:16 | The live hero is a **16 s cut** of this 20 s piece |

This resolves audit §9.25 — both "orphan" library files are now explained.

### 3.2 Matched to a published project

| `Smash/` file | Project slug | Project title | Basis | Confidence |
|---|---|---|---|---|
| `Can´t live in you books anymore.mp4` | `leonor` | *Words of our story* | Tagline ends *"…I can't live in your book anymore."* | **High** |
| `The lie we tell ourselves.mp4` | `ana-reels` | *The Lie we tell ourselves* | Exact title | **High** |
| `The endless _WAVES_.mp4` | `helder-praia` | *The endless "WAVES"* | Exact title | **High** |
| `Unfinished.mp4` | `nazaryi` | *Unfinished* | Exact title | **High** |
| `NVF VS Antiqvvm.mp4` | `nvf-vs-antiqvvm` | *Antiqvvm* | Exact slug | **High** |
| `NVF VS Filmin.mp4` | `nvf-vs-filmin-details` | *Filmin* | Exact slug | **High** |
| `film in 1 v2.mp4` | `nvf-vs-filmin-details` | *Filmin* | Also matches WP `FILM-IN-video-2-sem-nvf-v2.mp4`; **1080p master of the above** | **High** |
| `Don´t let it fool you.mp4` | `ana-e-filipe-metro` **and/or** `dont-let-it-fool-you` | *Don't Let It Fool You* | Title matches **both** halves of the D6 duplicate pair | High title match, **ambiguous target** |
| `Fading.mp4` | `helder-museu` (probable) | *Yves Saint Laurent* | Taglines of **both** `helder-museu` and `helder-praia` end *"…Fading"*; `helder-praia` already has its own file (§ above) | **Medium** — needs owner confirmation |
| `In the end.mp4` | `the-end` | *The End* | Title similarity | **Medium** — see conflict below |
| `Sometimes it´s just the start (1).mp4` | `the-end` | *The End* | Tagline is *"THE END" sometimes is just a start.* | **High** — see conflict below |

**Conflict to resolve:** two files both point at `the-end` — `In the end.mp4` (29 s) and
`Sometimes it´s just the start (1).mp4` (144 s). Most likely a **teaser and the full film**,
but which is the published one is not determinable from here. Owner call.

### 3.3 Not on the website — six pieces of unpublished work

| File | Duration | Note |
|---|---|---|
| `Celebrate Pride with Dr Bernard (1).mp4` | 59 s | No matching project. Client work, English-titled |
| `DigiUp anúncio.mp4` | 49 s | An advert for **digiUP** — the agency credited in the site footer, who also supplied one of the four testimonials and control the DNS |
| `Helder Vs Karl Largerfeld.mp4` | 64 s | Fashion piece. The site's fashion project is *Yves Saint Laurent* (`helder-museu`) — **a different designer**. Either a separate unpublished piece, or the site's title is wrong |
| `Prato 2 v1.mov` | 52 s | **1080p master.** Gastronomy. `v1` implies versions exist |
| `Prato sobremesa v1.mov` | 30 s | **1080p master.** Gastronomy, same series |
| `Video Long Version O Gato que Bebe.mp4` | 228 s | Longest file. *"Long Version"* implies a short cut also exists |
| `NVF showreel 2026.mp4` | 55 s | **A newer showreel than the one on the site.** The live homepage embeds YouTube `NVy4UY_xscM`; this 2026 cut is not published |

That is **new portfolio material the owners already have and are not showing** — directly
relevant to the "better project presentation" goal.

### 3.4 Published projects with **no** `Smash/` file (10 of 20)

`ananuno` · `carolinapedro` · `danieladuarte` · `martacharles` · `susanarafael`
(all five **Casamentos**) · `dormencia-48h` · `epitafio` · `lost-lines-trailer` ·
`madrugada-prince-mark` · `paradox-of-affection`

This set overlaps almost exactly with the 10 projects whose hover previews are broken
(audit §9.8) — the same nine, plus `paradox-of-affection` (which has a working WordPress
`.mov`) and minus `dont-let-it-fool-you` (which does have a `Smash/` file).

**Reading:** these projects have never had a local source file in this folder. For them,
YouTube is currently the only source. Owner must supply masters if they are to get
cinematic treatment.

### 3.5 Duplicates and variants

- No two files are byte-identical (no matching sizes).
- **Same content at different quality:** `NVF VS Filmin.mp4` (720p, 2.16 MB) and
  `film in 1 v2.mp4` (1080p, 64.43 MB) — the second is the master; durations differ
  (28.31 s vs 37.72 s), so they are also **different cuts**.
- **Same project, two cuts:** `In the end.mp4` / `Sometimes it´s just the start (1).mp4`.
- **Two showreels:** `NVF Showreel.mp4` (3:09, on the site as an orphan) and
  `NVF showreel 2026.mp4` (0:55, newer, unpublished).
- **Version markers in names:** `v1`, `v2`, `(1)`, `Long Version` — a versioning scheme
  exists in the owners' workflow but is not systematic.

---

## 4. Source-quality decision table

For each project, the best available source, given what is known today.

| Source | Best for | Caveat |
|---|---|---|
| **YouTube** (20 films) | The full film on project pages | Already adaptive, captioned, free to serve. Keep (`ARCHITECTURE.md` §6.5) |
| **`Smash/` 1080p (3 files)** | Hero video, fullscreen moments, hover loops | Only covers Filmin + two unpublished gastronomy pieces |
| **`Smash/` 720p (17 files)** | **Short silent hover loops only** (cropped, ≤6 s, ≤720p) | Do **not** use for fullscreen or hero — the bitrate will not hold up |
| **WordPress `.mov` (9 files)** | Nothing — they are 10–12 MB QuickTime versions of the same short loops | Archive, then retire |
| **Owner masters (not yet supplied)** | Everything cinematic | **The gap that must be closed** |

---

## 5. What this changes in the plan

1. **Preservation is now urgent** (the WordPress site may disappear at the end of the
   year). `Smash/` covers 10 of 20 projects; the rest exist only on YouTube and in the
   WordPress library. Archival moves to **Implementation Phase 0.5**.
2. **A master-media request goes to the owner now**, not at Phase 3 — sourcing and
   exporting masters is likely the longest lead time in the project.
3. **`Smash/` is not the transcode source by default.** Per project, pick the highest
   quality available; record the chosen source in the project's content entry so the
   decision is auditable.
4. **Six unpublished pieces plus a 2026 showreel** are candidates for the new portfolio —
   an owner decision, not ours to make.
5. **`docs/Smash/` should not stay in `docs/`.** It is 469 MB of binary in a documentation
   folder and is at risk of being committed. Action in Phase 0: move to an ignored
   `media-staging/` path (or leave in place and add an explicit ignore rule) — **with the
   owner's confirmation, since it is their only local copy.** Until then it must be
   gitignored.

---

## 6. Owner requests arising from this inventory

| # | Request | Why |
|---|---|---|
| M1 | **Supply true masters** (ProRes/DNxHR or ≥1080p high-bitrate; 4K where it exists) for every project intended to have a cinematic hero or fullscreen video | 17 of 20 files here are 720p web-grade |
| M2 | Confirm which of `In the end.mp4` / `Sometimes it´s just the start (1).mp4` is *The End* | Two cuts, one project |
| M3 | Confirm `Fading.mp4` belongs to *Yves Saint Laurent* (`helder-museu`) | Both fashion projects share the tagline |
| M4 | Clarify `Helder Vs Karl Largerfeld` vs the published *Yves Saint Laurent* | Different designers; possible mislabel or unpublished piece |
| M5 | Should the six unpublished pieces and the 2026 showreel be added to the portfolio? | New material, owner's editorial call |
| M6 | Are there masters for the 10 projects with no local file — especially the five weddings? | Otherwise those stay YouTube-only |
| M7 | Which showreel is current — `NVF Showreel` (3:09) or `NVF showreel 2026` (0:55)? | The homepage hero depends on it |
| M8 | Confirm we may relocate `docs/Smash/` out of `docs/` | It is 469 MB in a docs folder |
| M9 | Is `Prato` / `O Gato que Bebe` / `Dr Bernard` client work that may be published? | Rights/permission unknown |

---

## 7. Method

```
ffprobe -v error -show_entries format=duration,bit_rate,format_name \
        -show_entries stream=codec_type,codec_name,profile,width,height,\
r_frame_rate,bit_rate,sample_rate,channels,pix_fmt -of json "<file>"
```

Read-only. No file was opened for writing, renamed, moved, transcoded or uploaded.
Sizes from `stat`. Matching is by filename, title, tagline text and duration
cross-reference against `docs/WEBSITE_AUDIT.md` §4 and §5.1 — **no content was inferred or
invented**; every uncertain match is marked and escalated in §6.

**Also noted:** sibling folders `D:\Workspace\nextvision_v2\docs\Smash\` and
`D:\Workspace\nextvision_v3\docs\Smash\` contain the same 20 files, and `nextvision_v2`
contains a `public/videos/` directory. Earlier attempts at this project appear to exist
outside this repository. They were **not** read, modified or used as a source.
