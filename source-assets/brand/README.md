# Brand source assets

Two files, fetched from the live WordPress media library and **preserved byte-for-byte**.
Neither is edited. `scripts/build-icons.mjs` reads them and writes `public/icons/`.

| File | Bytes | SHA-256 | Source |
|---|---|---|---|
| `NextVisionFILMS.svg` | 6 521 | `d4817923366d4aa5b40cb135ec1c57d708e7e46861ca8cccd10014c920a029a3` | `wp-content/uploads/2025/02/NextVisionFILMS.svg` (attachment 1161) |
| `NVF.png` | 89 884 | `c9bb2cfc2a20a6b9c44a0dd2f3d56e546d7838b47a99b246a0f1267f623ce1aa` | `wp-content/uploads/2025/02/NVF.png` |

Both byte counts match `docs/content/media.json` / `media_inventory.json`. Neither was
pulled by `npm run archive:source`, which fetches only media a **page references** — these
two are library assets no page uses, which is why `docs/PWA-ICONS-TODO.md` recorded the SVG
as un-inspected rather than as missing.

## What they are

**`NextVisionFILMS.svg` — the authoritative vector logo.** 737.01 × 226.77 viewBox, an
Illustrator export: 17 `<path>` + 3 `<polygon>`, text already outlined, **no embedded
raster, no `<image>`, no external font**. It is the full horizontal wordmark
*Next Vision FILMS* over the four-bar device. Its five class colours are the brand palette
as the designer actually specified it:

| Class | Hex | Role | Nearest token in `src/styles/tokens.colour.css` |
|---|---|---|---|
| `.cls-2` | `#d9d8d6` | wordmark | — (light grey, close to `--brand-cream` in role) |
| `.cls-1` | `#ffb71b` | bar | `--brand-gold` `#efb025` |
| `.cls-3` | `#d2451e` | bar | `--brand-rust` `#d54b27` |
| `.cls-5` | `#9e3223` | bar | `--brand-oxblood` `#982703` |
| `.cls-4` | `#235b4e` | bar | `--brand-teal` `#3d7d70` |

This is independent confirmation that the palette sampled from `colors.png` (CLAUDE.md §4)
is the real one. **The tokens were NOT changed to these values** — that is a design
decision for Review A, not a build step.

**`NVF.png` — the square monogram, 2431 × 2431, RGBA.** Content bounding box 2337 × 1509
(1.549:1), centred, 65.4 % transparent. Its opaque colours are the same five above. This is
the mark the live site already uses for every square icon slot: `cropped-NVF-32x32.png`,
`-180x180`, `-192x192` and `-270x270` are all plain downscales of it with the framing
unchanged (verified — each keeps the same ~1.5 % side / ~19 % top-bottom padding ratio).

## Why the icons are rasterised from the PNG, not the SVG

The SVG is 3.25:1 — a horizontal wordmark. An app icon is square. There is no square
lockup inside the SVG: the monogram *NVF* is a different arrangement in a different weight,
not a crop of the wordmark. Building one would mean **recomposing the mark**, which
CLAUDE.md §8 forbids.

So the square mark comes from the asset that already is one, at 2431 px — 4.7× the largest
icon generated, so every derivative is a downscale and never an upscale. The SVG stays here
as the authoritative vector for any future work that needs one (a header logo swap is a
Review A decision and was NOT made here).

## The one deliberate change: an opaque ground

The source is transparent with a **light grey** (`#d9d8d6`) wordmark. Left transparent, the
icon is near-invisible wherever the platform composites it onto white — which is the
default Android adaptive-icon background and most light browser tab strips. The live site's
favicon has exactly this defect today.

Every generated icon is therefore composited onto **`#292929`** — `--brand-ink`, already
the manifest's `theme_color`, and the ground this logo is drawn against in the site header.
That is the site's own colour, not a new one, and it gives **9.8:1** against the wordmark.
