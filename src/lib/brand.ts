/**
 * Brand marks — DESIGN V2. The ONE place a logo file is named.
 *
 * Rendered from the owners' own LOGOTIPOS- NVF.pdf (review/Material Site NVF) by
 * Ghostscript at 300–600 dpi, so they stay sharp at the sizes the design sets them. The
 * originals are never edited. Single-colour marks are ALPHA MASKS: the ink is the alpha
 * channel, so CSS paints them in any token colour (cream over film, ink over cream). The
 * two colour marks keep their stripes and have the artboard's white keyed out; they are
 * only ever set on cream.
 *
 * A vector export (decision C8) replaces these when a converter is available; the keys
 * stay, so no component changes.
 */
export const BRAND = {
  /** "NEXT / VISION / FILMS" stacked — the guide's "logótipo tipográfico". Mask. */
  stack: { src: '/brand/nvf-stack.png', width: 1400, height: 1087, mask: true },
  /** NVF with the stripes cut out of the V. Mask. */
  mono: { src: '/brand/nvf-mono.png', width: 1200, height: 472, mask: true },
  /** The striped N monogram. Mask. */
  monogram: { src: '/brand/nvf-n.png', width: 600, height: 583, mask: true },
  /** NVF with the five colour stripes. Colour, cream grounds only. */
  colour: { src: '/brand/nvf-colour.png', width: 1200, height: 472, mask: false },
  /** The striped N in the five colours. Colour, cream grounds only. */
  monogramColour: { src: '/brand/nvf-n-colour.png', width: 400, height: 389, mask: false },
} as const;

export type BrandKey = keyof typeof BRAND;

/**
 * The brand strings the design sets as display type.
 *
 *   wordmark   "We are NVF" — the live site's own <title> suffix on every page
 *              ("Homepage - We are NVF - Produtora Audiovisual", docs/source-archive).
 *   tagline    "LOVING EVERY FRAME" — the brand guide's closing page (p. 21) and the
 *              approved design v2 prototype. Owner material, set in English in both
 *              locales because it is a slogan, not a sentence of page copy.
 */
export const BRAND_LINES = {
  wordmark: 'We are NVF',
  tagline: 'Loving every frame',
} as const;
