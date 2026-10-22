/**
 * Portfolio index — copy, browsing model and composition. Review C.
 *
 * ── The browsing model ───────────────────────────────────────────────────────
 * WORK FIRST. `/portfolio/` is one page holding all twenty projects, and the five
 * published categories are a secondary filter over it rather than the information
 * architecture. The reasoning, and the two alternatives that lost, are in
 * docs/PORTFOLIO_REVIEW.md §2 — the short version is that the existing taxonomy is too
 * lopsided to be a primary IA (8 / 5 / 5 / 1 / 1), and the owners' actual complaint is
 * that seeing all the work today means visiting five separate archives.
 *
 * ── The composition ──────────────────────────────────────────────────────────
 * A contact sheet is a regular grid; that regularity is the point. The hierarchy comes
 * from breaking it rarely, not from making every frame a different size. Three row types
 * in a composed nine-row sequence:
 *
 *     A  two frames, 7fr / 5fr      asymmetric — a wide frame and a tall one
 *     B  three frames, equal        the contact-sheet row
 *     C  one frame, full-bleed      the plate: edge to edge, twice on the page
 *
 * Row heights match exactly because ratioₙ/ratioₘ = colₙ/colₘ, the same relation the
 * homepage uses — so no row can leave a hole.
 *
 * Every project is assigned to a slot whose ratio its own still can survive: the one
 * portrait source sits in the one tall slot, the two widest sit on the two plates, and
 * nothing is cropped harder than its composition allows. Curated order lives in the
 * content files (`portfolioOrder`), so re-ordering the page is a data edit.
 */

/* ═══════════════════════════════════════════════════════════════════ copy ══ */

import { PAGE_CONTENT } from './page-content.ts';

/**
 * The live `/portfolio/` <h1> (`title`) and <h2> (`lead`); `all` is the live "Ver Tudo"
 * button on all 20 project pages, used as the "all" filter; `more` is the live card
 * button, reused as the per-project action. In src/content/page-content/portfolio.json.
 */
export const PORTFOLIO = PAGE_CONTENT.portfolio.copy;

/**
 * DELIBERATELY UNUSED: the five category descriptions published on `/portfolio/`.
 *
 * Four of the five do not describe their own heading — `Casamentos` is given an
 * institutional-video description, `Corporativo` a fashion one, and so on (audit §9.3,
 * decision D3). Printing them against their headings would ship a known error to a
 * prospective client; rewriting them would invent copy. So the filters carry names and
 * counts and no descriptions until the owners supply corrected text.
 */

/* ════════════════════════════════════════════════════════════ composition ══ */

export type RowType = 'A' | 'B' | 'C';

export interface PortfolioRow {
  type: RowType;
  cols: string;
  /** Desktop ratios, chosen so every frame in the row resolves to the same height. */
  ratios: number[];
  /** Two equal columns; a three-frame row widens its last frame so it cannot half-fill. */
  tabletRatios: number[];
  tabletSpans?: number[];
  mobileRatios: number[];
  /** The plate breaks the container and runs edge to edge. */
  fullBleed?: boolean;
}

const A: Omit<PortfolioRow, 'type'> = {
  cols: '7fr 5fr',
  ratios: [1.778, 1.27],
  tabletRatios: [1.5, 1.5],
  mobileRatios: [1.5, 1.5],
};
const B: Omit<PortfolioRow, 'type'> = {
  cols: '4fr 4fr 4fr',
  ratios: [1.5, 1.5, 1.5],
  tabletRatios: [1.2, 1.2, 2.45],
  tabletSpans: [1, 1, 2],
  mobileRatios: [1.5, 1.5, 1.5],
};
const C: Omit<PortfolioRow, 'type'> = {
  cols: '1fr',
  ratios: [2.4],
  tabletRatios: [2.2],
  mobileRatios: [1.4],
  fullBleed: true,
};

/**
 * The sequence. Twenty frames in nine rows, and the two plates land at 8 and 17 — a
 * little past a third and a little past three quarters, so neither the top nor the tail
 * of the page carries both.
 */
export const ROWS: PortfolioRow[] = [
  { type: 'A', ...A },
  { type: 'B', ...B },
  { type: 'A', ...A },
  { type: 'C', ...C },
  { type: 'B', ...B },
  { type: 'B', ...B },
  { type: 'A', ...A },
  { type: 'C', ...C },
  { type: 'B', ...B },
];

export const ROW_CAPACITY = ROWS.reduce((n, r) => n + r.ratios.length, 0);

/** Ratio used by every frame once a filter is applied. See the note in the page. */
export const FILTERED_RATIO = 1.5;

/* ══════════════════════════════════════════════════════════════ filtering ══ */

/**
 * The "all" filter is a real link to `/portfolio/`, and each category filter is a real
 * link to its own preserved archive URL. That is not a compatibility hack — it is what
 * makes the control work with JavaScript off, keeps every view crawlable, and turns five
 * legacy URLs that had no `<h1>` and no canonical into five useful pages.
 *
 * Declared in portfolio-filter.ts, the browser module, and re-exported here: this module
 * reads the page-content JSON through its schema, and importing it from client code
 * would ship zod and the media manifest to every reader (Phase A0 measured 14 KB → 240 KB).
 */
export { FILTER_ALL } from './portfolio-filter.ts';
