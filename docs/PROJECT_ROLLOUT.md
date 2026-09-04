# Project rollout — Phase 9

**Date:** 2026-09-03 · **Scope:** all twenty `/portfolio/{slug}/` routes
**Status:** ✅ **complete** — twenty production pages, zero placeholders
**Built on:** the Review D system, approved at `/portfolio/leonor/`. No new design.

> Review D designed **one** project page and left nineteen on a placeholder. Phase 9
> removes the placeholder and gives every published project a real page. The design is
> unchanged; what changed is that the template now composes itself from what a project
> actually holds instead of demanding the same material from all twenty.

---

## 1. The finding that changed the sourcing

`src/data/media-source-map.json` reported **19 of 20 projects as having no hero-capable
source**, and that number drove every media decision since Phase 0.5. It was wrong,
because the map only ever graded one of the two shelves.

The map probed `docs/Smash/` with `ffprobe` and found 17 of 20 files were 1280×720 web
exports. It then listed the eight WordPress `.mov` card loops as "existing hover loops"
and **never measured them**. Measured now:

| File | Measured | Project |
|---|---|---|
| `ana_e_filipe_metro.mov` | **1920×1080, 17.6 Mbps**, 4.96 s | `ana-e-filipe-metro` |
| `ana_reels.mov` | **1920×1080, 17.0 Mbps**, 4.79 s | `ana-reels` |
| `helder_museu.mov` | **1920×1080, 16.4 Mbps**, 5.54 s | `helder-museu` |
| `helder_praia.mov` | **1920×1080, 17.3 Mbps**, 5.00 s | `helder-praia` |
| `leonor.mov` | **1920×1080, 17.4 Mbps**, 4.42 s | `leonor` |
| `nazaryi.mov` | **1920×1080, 17.2 Mbps**, 4.38 s | `nazaryi` |
| `paradox_of_affection.mov` | **1920×1080, 17.5 Mbps**, 4.83 s | `paradox-of-affection` |
| `the_end.mov` | **1920×1080, 17.2 Mbps**, 4.88 s | `the-end` |
| `FILM-IN-video-2-sem-nvf-v2.mp4` | **1920×1080, 14.0 Mbps**, 28.31 s | `nvf-vs-filmin-details` |

These are not web exports. They are the best footage the project holds, they are each the
project's **own** film, and the card→file mapping is the audit's observed one
(`WEBSITE_AUDIT.md` §4.3 and the media table under it), not a filename guess.

**What it does not change:** they are ~5 seconds long. A five-second 1080p clip is a hero
**loop** and a source of **stills**; it is not a master, and request **M1** stands for
all twenty. The map now records three states rather than two — `full` / `loop+stills` /
`none` — and `scripts/build-media-source-map.mjs` probes both shelves.

**What it changes for the pages:** nine projects have a genuine 1080p entry instead of a
720p one, and helder-museu and the-end can be built from their own footage rather than
from the ambiguous Smash files at the centre of open questions **M2** and **M3**. Two
owner decisions that would have had to be guessed are simply not touched.

---

## 2. Content-depth tiers — derived, never stored

There is no tier field anywhere in the content, no flag, and no per-project branch in any
component. A page is richer because the project **has more**, exactly the rule Review D
used to pick between two templates — only now the difference is a matter of degree.

| Tier | What it means | Count |
|---|---|---|
| **Rich** | A loop, the project's own prose, and three or more frames worth showing | **3** |
| **Standard** | A loop or a strong frame, plus two or three frames and usually a line of prose | **7** |
| **Minimal** | The screen, the metadata, the neighbours. The project publishes nothing else | **10** |

The names are internal. Nothing renders them, and no reader can tell which bucket a page
is in — only that some films have more to show than others, which is true.

---

## 3. All twenty, in curated portfolio order

`SCREEN` is what the hero holds: a silent loop, a frame from the film, or the published
poster. `BLOCKS` is what the entry declares below it.

| # | Route | Category | Tier | Screen | Blocks | Stills | Film |
|---|---|---|---|---|---|---|---|
| 1 | `/portfolio/helder-praia/` | Visual Storytelling | Rich | loop 1080p | text · pair · plate | 3 | `O7g2AM9lAo0` |
| 2 | `/portfolio/leonor/` | Visual Storytelling | Rich | loop 720p | text · pair · strip · plate | 6 | `0C-yySHAzCI` |
| 3 | `/portfolio/epitafio/` | Ficção | Minimal | poster | — | 0 | `RIvUTLvdwX8` |
| 4 | `/portfolio/martacharles/` | Casamentos | Minimal | poster | — | 0 | `DT3wUv-vPe4` |
| 5 | `/portfolio/lost-lines-trailer/` | Ficção | Minimal | poster | — | 0 | `JIKvD9Y74oU` |
| 6 | `/portfolio/nvf-vs-filmin-details/` | Visual Storytelling | Standard | loop 1080p | pair | 2 | `8HjA-SOs7Ws` |
| 7 | `/portfolio/the-end/` | Ficção | Standard | loop 1080p | text · pair | 2 | `_3cbRqvPKsk` |
| 8 | `/portfolio/helder-museu/` | Moda & Identidade | Rich | loop 1080p | text · pair · plate | 3 | `dFehZUbaGWU` |
| 9 | `/portfolio/nazaryi/` | Visual Storytelling | Standard | loop 1080p | text · pair | 2 | `sBVD2TxbM-w` |
| 10 | `/portfolio/danieladuarte/` | Casamentos | Minimal | poster | — | 0 | `GJpdoynz2QA` |
| 11 | `/portfolio/ana-e-filipe-metro/` | Visual Storytelling | Standard | loop 1080p | pair | 2 | `e6aK4vEn420` |
| 12 | `/portfolio/dont-let-it-fool-you/` | Ficção | Minimal | poster | — | 0 | **none — D6** |
| 13 | `/portfolio/ananuno/` | Casamentos | Minimal | poster | — | 0 | `DSUXz5VeXiY` |
| 14 | `/portfolio/ana-reels/` | Visual Storytelling | Standard | loop 1080p | text · pair | 2 | `o9X1s3ge_IE` |
| 15 | `/portfolio/paradox-of-affection/` | Visual Storytelling | Standard | **frame** 1080p | text · pair | 2 | `HHB93FuKNrg` |
| 16 | `/portfolio/dormencia-48h/` | Ficção | Minimal | **poster plate** | — | 0 | `4Xur7raVaqU` |
| 17 | `/portfolio/nvf-vs-antiqvvm/` | Corporativo | Standard | loop 720p | strip | 3 | `seuAOrDs3oo` |
| 18 | `/portfolio/susanarafael/` | Casamentos | Minimal | poster | — | 0 | `h8aaihpcLGU` |
| 19 | `/portfolio/madrugada-prince-mark/` | Visual Storytelling | Minimal | poster | — | 0 | `gbXbnpttShw` |
| 20 | `/portfolio/carolinapedro/` | Casamentos | Minimal | poster | — | 0 | `BDJAOp6Eh3E` |

---

## 4. Media selected, per project, and why

Every window below was chosen off a frame-by-frame scan and each one records what it is
avoiding. The full table with crops and timecodes is `scripts/build-review-media.mjs`
(`PROJECT_PAGES`), so a regenerated file is identical to the one that was reviewed.

### Sourced from the project's own 1080p card loop

| Project | Window | Crop | What the crop or trim removes |
|---|---|---|---|
| `helder-praia` | 1.20 – 4.90 s | `1440:810:400:150` | The film's rounded viewfinder corners **and** a rounded-rect overlay at x 130–340. A light-leak flash at 0.83 s is what the window starts after |
| `helder-museu` | 0.20 – 5.20 s | `1920:868:0:106` | 2.21:1 letterbox. One continuous take, no captions anywhere in it |
| `the-end` | 1.35 – 4.85 s | none | The clip's first shot; the cut is at 1.30 s and the second shot runs clean to the end |
| `ana-e-filipe-metro` | 1.55 – 4.40 s | none | The subtitle "Oh really?" runs to 1.45 s; the cut to the camcorder shot is at 4.50 s |
| `ana-reels` | 0.10 – 4.70 s | `1920:1012:0:34` | A slight letterbox. One continuous night walk, no burned-in line |
| `nazaryi` | 0.05 – 2.80 s | `1920:866:0:100` | 2.35 letterbox. The line "i should call and say" arrives at **2.90 s**, which is why the loop is 2.75 s and not longer |
| `nvf-vs-filmin-details` | 5.30 – 9.90 s | `1920:864:0:100` | Letterbox, the "ONDE O CINEMA GANHA VIDA" title card (ends 5.2 s) and the line at 10.0 s. **The FILMIN logo bug stays** |

### Sourced from Smash

| Project | Window | Crop | Why |
|---|---|---|---|
| `leonor` | 19.2 – 23.8 s | `1140:600:70:60` | **Unchanged from Review D.** Its approved page was not re-cut |
| `nvf-vs-antiqvvm` | 34.5 – 39.0 s | `1280:590:0:64` | The only project with no 1080p source at all. The film is subtitled almost throughout and closes on an `ANTIQVVM.PT` end card at 58 s; 34–40 s is its one sustained caption-free run |

### Sourced as a frame, not a loop

**`paradox-of-affection` — hero still at 0.50 s.** Its card clip is a montage: van
(0.25–1.0), field (1.25–2.0, carrying the viewfinder overlay), cliff (2.5–3.0), beach
(3.75–4.25), every shot separated by a light-leak burn, and the last frames carry a
decorative script overlay. **No run is long enough to loop honestly**, so the screen holds
the strongest frame and the published film is one press away. Its two editorial stills are
the cliff and the water — the two places the clip goes that the poster does not.

### Sourced as the published poster — ten projects

`epitafio` · `martacharles` · `lost-lines-trailer` · `dont-let-it-fool-you` · `ananuno` ·
`danieladuarte` · `dormencia-48h` · `susanarafael` · `madrugada-prince-mark` ·
`carolinapedro`.

No local footage exists for any of them. The screen holds the still the live site itself
publishes, at 560/960/1400, and the film is one press away. **Nothing was manufactured to
make these pages longer.**

---

## 5. The two weak assets, handled rather than hidden

### `dormencia-48h` — a designed poster, not a frame

Its published image is a **portrait film poster**: title lettering, three cast names across
the top, and a full credits block set into the artwork. No source footage exists for this
project anywhere in the archive or in `Smash/`, so there is no cleaner frame to cut.

It is kept, and it is **presented as a poster**. A portrait hero gets a screen sized by
height rather than width — 437 × 648 at a 1440 viewport instead of 1140 × 1689, which is
what a full-width portrait would have been and which no reader would ever see the bottom
of. Cropping it to a landscape screen would have destroyed the object.

The rule is derived, not special-cased: `screenRatio()` in `src/lib/project-page.ts`
returns the media's own ratio whenever it is taller than the player, and the CSS follows.
On press the screen becomes a full-width 16:9 player, which is a change the reader asked
for, inside 500 ms of their own press.

**The credits in that artwork are NOT transcribed.** They are an image of type at poster
resolution; reading a name wrong is worse than not publishing it (Review D §5, owner
question **Q3**).

### `madrugada-prince-mark` — a black title card

Its published image is a title card: `PRINCE MARK` / `MADRUGADA` / `PROD. LOIC ANTÓNIO &
ARTUR MONTEIRO` / `DIRECTED BY NEXT VISION FILMS`, gold on black.

We hold **no source for this project** — no Smash file, no WordPress card loop. There is
nothing to cut a stronger frame from, and inventing one is not available. It ships as
published, and it is owner request **M8** below.

---

## 6. `dont-let-it-fool-you` — still no film, and the page still works

Validation was **not** loosened. The live page stores
`https://studio.youtube.com/video/e6aK4vEn420/edit` — a Studio edit URL, not a video URL,
and that id is already published at `/portfolio/ana-e-filipe-metro/`. Whether this is a
duplicate entry or a missing film is decision **D6**, and it is the owners'.

The page therefore:

- renders its published poster on the screen, at full size;
- renders **no play control** — not a disabled one, none;
- carries no `data-film`, so nothing can mount a player;
- emits **no `VideoObject`**, because a VideoObject for a film that does not exist is a lie
  to a search engine;
- states the fact in the metaline: `Sem vídeo publicado`;
- carries its published tagline, `We are NVF 🌏`, verbatim.

`Don´t let it fool you.mp4` in `Smash/` matches **both** halves of the pair (request
**M-A**) and is used by neither project.

The route validator asserts all of this both ways: a project declaring `filmUnavailable`
must not emit a VideoObject or a play control, and a project with a film must emit one.

---

## 7. Template and schema changes

**Schema: none.** The block model held for all twenty, as it did for one. Four of the nine
types are used — `text`, `image-pair`, `image-grid`, `full-width-image` — and the five
unused ones stay unused. `embedded-film` is still not needed, because on every project
that has a film the film **is** the screen. `credits` and `quote` remain undemonstrated
because no project publishes either, and `full-width-video` because no project has a
second piece of footage.

**Template — `src/pages/portfolio/[slug].astro`:**

| Change | Why |
|---|---|
| The two-template branch is **gone** | One template, composing from content. Zero is a valid number of blocks |
| The hero image is a **build-time assertion** | A published project with no image would render a black box that looks like a bug. It now fails the build instead |
| `--screen-ar` and `--film-ar` are read from the hero media | Twenty projects are not one aspect ratio. A56/A55 stay true across 16:9, 1.90, 2.17, 2.21, 2.22 and one portrait, with nothing typed into a component |
| The screen **contains** the film rather than cropping it | See §8 — this is the one thing the approved page renders differently |
| The caption gained a **lead** | Ten projects publish a one-line tagline and nothing else. It appears once: as prose where the project declares a `text` block carrying it, and as a lead under the title otherwise. Decided by content, not by a flag |
| `filmUnavailable` is stated on the page | §6 |
| A `<noscript>` anchor beside the play button | Every other route on the page is an ordinary link; without JS the façade button was inert and the film unreachable |
| `RelatedWork` slot | §9 |

**New modules:** `src/lib/project-page.ts` (the two derived ratios),
`src/lib/related.ts` (the derivation), `src/components/project/RelatedWork.astro`.

**One new UI string:** `project.moreIn` = `Mais em`, completed with the category's own
published name. No page copy was written, rewritten or invented.

---

## 8. The one change to the approved page, and why it is a fix

`.pj-screen` used `object-fit: cover`. Across twenty projects that is wrong twice over:

- **It crops.** A 2.22:1 frame cover-fitted into a 16:9 box loses **19% of its width**.
  Five of the nine loop projects are wider than 16:9, so five scope compositions would have
  been cut for a box.
- **It upscales.** Leonor's own hero is 1140 × 600 in a 1140 × 641 box, so `cover` was
  scaling it **up 6.8%** — on the one page whose entire stated argument is that nothing is
  ever upscaled to imply a master.

It is now `contain`, on black, in a screen that stays 16:9. A scope film shows its own
letterbox — which is exactly what the YouTube player shows a second later — nothing is
cropped, and nothing is scaled up.

**Leonor's approved geometry is otherwise untouched.** Measured at 1440 after the change:
strip `319×168 · 425×224 · 531×280`, pair `651×343 / 465×245`, plate `1323×696`,
pair→grid seam 48 px. Those are the Review D §15.4 numbers exactly.

---

## 9. Related work — derived, and mostly absent

**The live site's own "Que poderás gostar" pair was not reproduced.** Measured across all
twenty pages (`docs/content/portfolio_items.json`), it is `madrugada-prince-mark` +
`carolinapedro` on eighteen of them. It is a recency widget: it says the same thing about a
wedding film that it says about a gastronomy advert. Shipping it would assert a
relationship the data does not support.

What is derived instead is the site's **own taxonomy**: at most two other projects in the
same category, in curated order, excluding the projects already offered as next and
previous. The heading says exactly that and nothing more — `Mais em Casamentos`. Nothing is
inferred from dates, titles or how the images look.

It is visually secondary by construction: 260 px frames against the Next Project block's
1322 px, inside the same section, on the same ground, with no rule between them.

**`Corporativo` and `Moda & Identidade` hold one project each, so they derive nothing and
the section does not render at all** — an empty relationship is not shown as an empty
heading.

---

## 10. Generated derivatives

`npm run review:media` → `public/__generated/home/` (gitignored), recorded in
`src/data/review-media.json` (committed). **82 entries**, up from 44.

| | New in Phase 9 |
|---|---|
| Hero loops | **8** × 2 renditions (1140 + 720) — helder-praia, helder-museu, the-end, ana-e-filipe-metro, ana-reels, nazaryi, nvf-vs-filmin-details, nvf-vs-antiqvvm |
| Hero posters | 8 (one per loop) + **1** still-only hero (paradox-of-affection) |
| Editorial stills | **21** × 3 widths (560 / 900 / 1140) |
| Total video payload, whole site | **9.5 MB** across every variant |

Nothing in `source-archive/` or `docs/Smash/` was modified, renamed, moved or transcoded
in place. Every width is a **downscale**: the ladder skips any width wider than the cropped
source, so no derivative anywhere is an upscale.

`scripts/build-review-media.mjs` also lost a duplicate: `buildProjectStills`, the
leonor-only frame extractor, is replaced by the general `buildStillsFrom` that every
project now uses, so there is one encoder and one quality setting rather than two.

---

## 11. Payload

Shared across every page: **17 KB** of gzipped CSS + JS, plus 83.3 KB of fonts, both cached
after the first page.

| | Above the fold, desktop | Mobile | Lazy, below |
|---|---|---|---|
| `helder-museu` (heaviest) | 272 KB | 150 KB | 112 KB |
| `nvf-vs-antiqvvm` | 246 KB | 122 KB | 117 KB |
| `helder-praia` | 245 KB | 121 KB | 128 KB |
| `leonor` (the approved reference) | 226 KB | 118 KB | 216 KB |
| `the-end` | 215 KB | 108 KB | 119 KB |
| `ana-e-filipe-metro` | 142 KB | 78 KB | 33 KB |
| `paradox-of-affection` | 66 KB | 66 KB | 42 KB |
| `ananuno` (typical minimal) | 48 KB | 48 KB | — |
| `epitafio` (lightest) | 31 KB | 31 KB | — |

**One outlier was found and fixed.** `nvf-vs-antiqvvm`'s loop was 302 KB — half again
leonor's 206 KB — because it ran the full 6 s of its caption-free gap on a busy,
high-detail plating shot. Trimmed to 4.5 s inside the same gap: **246 KB**, and the second
and a half bought nothing a viewer would notice.

Standing rules, all verified: no project gallery is preloaded, every still below the fold
is `loading="lazy"`, YouTube receives **0 bytes and 0 requests** until the play control is
pressed, and hover previews remain portfolio-only, loaded on intent.

---

## 12. Verification

```
astro check       0 errors, 0 warnings (54 files)
astro build       32 pages, 0 errors
validate:data     8 ok, 4 warnings, 0 errors
validate:routes   9 ok, 0 errors          ← new
```

`scripts/validate-routes.mjs` runs against `dist/` and reads the content files
independently, so the expectation and the evidence come from different places. Per project
it asserts: the route was emitted · it carries no placeholder marker · its screen holds a
real image · exactly one `<h1>` · a self-referencing canonical, unique site-wide · a
non-empty title · `og:title`/`og:url`/`og:image` · `lang="pt-PT"` · a `BreadcrumbList` · a
`VideoObject` exactly where a film exists and never where it does not · no play control
where `filmUnavailable` is declared · a link from `/portfolio/` · a link from its own
category archive · and that every `/portfolio/…` link it emits resolves to a route that
exists.

**The guard was tested by breaking it**: a placeholder marker injected into one built page
produced `FAIL placeholder: /portfolio/epitafio/ still carries /por desenhar/`. It is
wired into `npm run verify`.

| Checked in a real browser | Result |
|---|---|
| Widths | 375 · 768 · 1440 · 1920 — **no horizontal overflow at any width on any tier** |
| Morph | 20 candidate frames on `/portfolio/`, **0 named at rest, exactly 1 named at the moment of intent**, released after load |
| Navigation | portfolio→project, project→next, Back, Forward, project→portfolio — all four pair exactly one element and land correctly |
| Façade | 0 iframes and 0 third-party requests before the press; 1 `youtube-nocookie` iframe after |
| Layout shift on play | **0 px** — 641 → 641 on every landscape project |
| Portrait on play | 437×648 → 1140×641, deliberate, inside 500 ms of the press |
| Motion tiers | `reduced` and `minimal` both remove the loop; the poster is the designed state |
| Keyboard | one tab stop per destination, all named; the play control is a real button |
| No JS | 14 anchors on a minimal page — home, portfolio, next, previous, Ver Tudo, related ×2, socials — plus a `<noscript>` route to the film |
| Regression, `/` | 1 feature + 7 editorial cards, one `<h1>`, no overflow |
| Regression, `/portfolio/` | 20 cards in rows 2·3·2·1·3·3·2·1·3, filters 20/5/8/1/1/5, no overflow |
| Regression, `leonor` | strip 319·425·531, pair 651/465, plate 1323 — Review D §15.4 exactly |

**Not verified here:** the animation itself. This preview pane rejects `ready` with
`InvalidStateError` and composites only the first viewport, the same limitation recorded
since Review B. The morph's markup, pairing, timing and history behaviour are all verified;
how it *looks* still needs a real browser.

---

## 13. Master status

| | |
|---|---|
| Hero-capable outright (1080p, long) | **1** — `nvf-vs-filmin-details` |
| Loop + stills capable (1080p, ~5 s) | **8** |
| No local hero source at all | **11** |
| `masterRequired` | **19 of 20** — unchanged. A five-second clip is not a master |

---

## 14. Open owner questions

Carried forward, none of them pre-empted by this phase:

| # | Question | What it blocks |
|---|---|---|
| **M1** | True masters (ProRes/DNxHR, or ≥1080p high-bitrate) for every project meant to have a cinematic hero | 19 of 20. Still the longest lead time in the project |
| **M2** | Which of `In the end.mp4` / `Sometimes it´s just the start (1).mp4` is *The End*? | Nothing now — the page is built from the project's own clip |
| **M3** | Does `Fading.mp4` belong to *Yves Saint Laurent*? | Nothing now — same reason |
| **M-A / D6** | Which project owns `Don´t let it fool you.mp4`, and is `dont-let-it-fool-you` a duplicate or a missing film? | One project page has no film |
| **M6** | Masters for the ten projects with no local file — especially the five weddings | Those ten pages stay poster-only |
| **M8** *(new)* | **`madrugada-prince-mark` publishes a black title card as its image.** Is there a frame, a still or a master for this videoclip? | Its page opens on type, not on the film |
| **M9** *(new)* | **`dormencia-48h` publishes a designed poster and no footage.** Is there source video, or is the poster the intended image? | §5 |
| **Q3** | Credits. `Dormência 48h`'s poster carries a full credits block **as artwork**. Should it be transcribed, with every name owner-checked? | The `credits` block stays undemonstrated |
| **Q4** | Do production stills exist? Every editorial frame here is pulled from the film itself | Sharper, wider-ranging pages |
| **Q5** | The 1140 px ceiling. Now that nine projects hold 1080p, is the projected screen still the design, or should the room grow when masters arrive? | Decides whether the layout survives better media |

---

## 15. Where things live

| | |
|---|---|
| Route, one template | `src/pages/portfolio/[slug].astro` |
| Blocks | `src/components/project/ProjectBlocks.astro` |
| Next / previous | `src/components/project/NextProject.astro` |
| Related work | `src/components/project/RelatedWork.astro` · `src/lib/related.ts` |
| Derived ratios | `src/lib/project-page.ts` |
| Façade (for a film that is not the hero) | `src/components/project/FilmFacade.astro` |
| Styles | `src/styles/project.css` |
| Content | `src/content/projects/*.mdx` — the `blocks` array is the page |
| Media build | `scripts/build-review-media.mjs` → `npm run review:media` |
| Route validation | `scripts/validate-routes.mjs` → `npm run validate:routes` |
