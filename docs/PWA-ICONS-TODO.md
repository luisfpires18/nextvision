# PWA icons — RESOLVED (Phase 15)

This file recorded a blocker. The blocker was wrong, and this is the correction.

## What the blocker said

That no clean vector logo existed, that `NextVisionFILMS.svg` sat unapproved in the
WordPress library, and that generating icons would mean inventing a brand mark.

## What was actually true

**The SVG was never inspected — only listed.** `npm run archive:source` fetches media that
a PAGE REFERENCES, and both the vector logo and the square monogram are library assets no
page uses, so neither was ever on disk to look at. The blocker was recorded against a
filename, not against a file.

Fetched and examined, `NextVisionFILMS.svg` is a **legitimate, clean vector logo**: a
737 × 226 Illustrator export, 17 paths and 3 polygons, text already outlined, no embedded
raster and no external font. Its five colours are the brand palette — independent
confirmation that the `colors.png` sampling in CLAUDE.md §4 is correct.

So R6's premise is gone. **A vector logo exists and is preserved**, at
`source-assets/brand/NextVisionFILMS.svg`, byte-identical to the live original.

## Why the icons are still rasterised, and why that is not a compromise

The SVG is **3.25:1 — a horizontal wordmark**. An app icon is square. The square *NVF*
monogram is a different lockup in a different weight, not a crop of the wordmark, so
building one out of the wordmark's glyphs would be **recomposing the mark** — the guess
CLAUDE.md §8 forbids, and the guess the original blocker was right to refuse.

It does not need building. `NVF.png` — **2431 × 2431**, preserved alongside the SVG — is
already that square lockup, and it is the asset the live site itself downscales for every
icon slot it has (`cropped-NVF-32x32` / `-180x180` / `-192x192` / `-270x270` are all plain
resizes of it, framing unchanged; verified). At 2431 px it is **4.7× the largest icon
generated**, so every derivative is a downscale. `scripts/build-icons.mjs` fails the build
rather than upscale.

## What ships

Five files, ~45 KB, all from that one source, all deterministic:

| File | Size | Purpose |
|---|---|---|
| `public/icons/icon-192.png` | 192 | manifest, `any` |
| `public/icons/icon-512.png` | 512 | manifest, `any` |
| `public/icons/icon-maskable-512.png` | 512 | manifest, `maskable` |
| `public/icons/apple-touch-icon.png` | 180 | iOS, opaque |
| `public/favicon.ico` | 48/32/16 | what browsers request unprompted |

The one deliberate change from the source: an **opaque `#292929` ground**. The mark is
light grey on transparency, so it vanishes wherever a platform composites it onto white —
the live favicon has exactly that defect today. `#292929` is `--brand-ink`, already the
manifest's `theme_color`, and the ground the logo is drawn against in the header. Site
colour, not a new one. 9.8:1 against the wordmark.

`theme_color` and `background_color` are no longer placeholders: `validate:pwa` checks both
against `--brand-ink` and `--brand-cream` in `src/styles/tokens.colour.css`, so the install
identity cannot drift from the palette.

## Still open — but not blocking

The visual identity remains provisional (CLAUDE.md §4). These icons are the mark the
company uses **now**. If Review A changes it, replace `source-assets/brand/NVF.png` and run
`npm run icons:build` — the geometry is measured from the source's alpha, not typed, so a
new mark re-measures itself. No other file changes.

One honest limitation: at **16 px** the three letters and four bars are mush. That is
inherent to this mark at that size and is not fixable without redrawing it. The 32 px entry
is clean, and 32 is what modern displays actually render.
