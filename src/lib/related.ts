/**
 * Related work — derived, never asserted.
 *
 * ── What the live site does, and why we do not copy it ───────────────────────
 * Every one of the twenty published pages carries a "Que poderás gostar" pair, and
 * measured across all twenty (docs/content/portfolio_items.json) that pair is
 * `madrugada-prince-mark` + `carolinapedro` on eighteen of them and a one-item variation
 * on the other two. It is a recency widget, not a relationship: it says the same thing
 * about a wedding film that it says about a gastronomy advert. Reproducing it would ship
 * a claim the source data does not support, which is the same rule that stops us
 * inventing credits.
 *
 * ── What can be derived honestly ─────────────────────────────────────────────
 * The site's own taxonomy. Two projects sharing a category is a published fact, so the
 * only claim this makes is "these are also filed under Casamentos" — which is exactly how
 * it is labelled. Nothing is inferred from how images look, from dates, or from titles.
 *
 * The next and previous projects are already offered at the scale of a film, so they are
 * excluded here: repeating them as a smaller second offer would be noise. Two is the cap,
 * because a third would start competing with the Next Project block above it.
 *
 * `Corporativo` and `Moda & Identidade` hold one project each. They derive nothing, and
 * the section simply does not render — an empty relationship is not rendered as an empty
 * section (docs/PROJECT_PAGE_REVIEW.md, and the same rule as the sound control).
 */

import type { CuratedProject } from './curated.ts';

/**
 * Up to `limit` other projects in the same category, in curated portfolio order,
 * excluding this project and the two it already links to.
 *
 * Order is the owners' own `portfolioOrder`, so which two appear is a data edit, and the
 * walk starts after the current project and wraps — so a project at the end of its
 * category does not always show the same two openers.
 */
export function relatedProjects(
  all: readonly CuratedProject[],
  index: number,
  limit = 2,
): CuratedProject[] {
  const self = all[index];
  if (!self?.categorySlug) return [];

  const excluded = new Set([self.slug, all[index - 1]?.slug, all[index + 1]?.slug]);
  const out: CuratedProject[] = [];

  for (let step = 1; step < all.length && out.length < limit; step += 1) {
    const candidate = all[(index + step) % all.length];
    if (!candidate || excluded.has(candidate.slug)) continue;
    if (candidate.categorySlug !== self.categorySlug) continue;
    out.push(candidate);
  }
  return out;
}
