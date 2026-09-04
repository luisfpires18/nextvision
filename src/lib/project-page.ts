/**
 * The two shapes a project page derives from its own media.
 *
 * Both exist so that no component and no content file has to state an aspect ratio.
 * A project's shape is a fact about the footage, and a fact should be read, not typed —
 * which is also what keeps `docs/PROJECT_PAGE_REVIEW.md` A55 true across twenty projects
 * shot at 16:9, 1.9:1, 2.2:1 and, in one case, portrait.
 */

import type { MediaItem } from './media.ts';

/** The screen the film is projected onto. 16:9 is the shape the YouTube player takes. */
const PLAYER_RATIO = 16 / 9;

/**
 * The screen's own aspect ratio.
 *
 * Landscape material keeps the player's 16:9 and is CONTAINED inside it, so a 2.2:1 film
 * shows its own letterbox exactly as it will when it plays. Cropping it to fill would cut
 * a fifth of a scope composition away, and scaling it up to fill would be the upscale
 * this page's whole argument is against.
 *
 * Taller-than-16:9 material — which on this site means one designed film poster — gets a
 * taller screen instead, and the player is centred inside it when it mounts. Either way
 * the box is decided before paint and nothing shifts on press.
 */
export function screenRatio(item: MediaItem | null): number {
  const ar = item?.aspectRatio ?? null;
  if (!ar || ar >= PLAYER_RATIO) return round(PLAYER_RATIO);
  // Between portrait and 16:9 (a 4:3 still, say) the frame's own shape is the honest box.
  return round(ar);
}

/**
 * The shape every framed image further down the page takes.
 *
 * One film, many frames: the pair, the strip and the plate are all the hero's ratio, so
 * sizes carry the hierarchy and nothing is ever cropped to make a shape. A portrait hero
 * is the exception — a poster is not the film's frame — so those pages fall back to the
 * player's ratio for their editorial frames.
 */
export function frameRatio(item: MediaItem | null): number {
  const ar = item?.aspectRatio ?? null;
  if (!ar || ar < 1) return round(PLAYER_RATIO);
  return round(ar);
}

const round = (n: number): number => +n.toFixed(4);
