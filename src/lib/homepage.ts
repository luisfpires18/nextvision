/**
 * Homepage content and composition — Review B.
 *
 * ── Copy ─────────────────────────────────────────────────────────────────────
 * Every published string is VERBATIM from the live site, captured in Phase 0.5 and held in
 * docs/source-archive/pages.json. Nothing is written, shortened or corrected, and the
 * Portuguese is never rewritten (CLAUDE.md §2, §8). Source-page provenance is recorded
 * per entry, because
 * some copy is borrowed from another page — placing existing copy in a new position is
 * a design decision, and it is listed for owner approval in docs/HOMEPAGE_REVIEW.md §6.
 *
 * PHASE 11 adds a third field, `en`. It is an authored TRANSLATION of the Portuguese and
 * never a second piece of copy — see the note on `Provenanced` below, and
 * docs/SEO_I18N_ROLLOUT.md §2 for the rule every one of them followed.
 *
 * Its oddities are preserved deliberately: the double space in "roadtrips,  trilhos",
 * the space before the full stop in the services lead, the "&Direção" spacing in a team
 * role. They are catalogued as observations in docs/WEBSITE_AUDIT.md §9, not corrected.
 *
 * ── Composition ──────────────────────────────────────────────────────────────
 * The editorial grid is DESIGNED, not generated. Each row declares its columns and the
 * aspect ratio of every frame in it, chosen so that the frames in a row are exactly the
 * same height at any viewport width:
 *
 *     equal height  ⟺  ratioₙ / ratioₘ  =  colₙ / colₘ
 *
 * With `7fr 5fr` and a single gap, both columns scale from the same remainder, so the
 * relation holds at every width with no subgrid, no JavaScript and no measurement. That
 * is what removes the accidental voids from the Review A grid: a row cannot leave a hole,
 * because every row is complete by construction and its frames cannot disagree on height.
 */

import { DEFAULT_LOCALE, type Locale } from '../config/i18n.ts';
import type { PageId } from '../i18n/routes.ts';
import { PAGE_CONTENT } from './page-content.ts';

/* ═══════════════════════════════════════════════════════════════════ copy ══ */

export interface Provenanced {
  /** The exact published Portuguese string. Never edited (CLAUDE.md 2). */
  text: string;
  /** Live URL it was published on. Verified by scripts/validate-data.mjs. */
  from: string;
  /**
   * The authored English translation - PHASE 11.
   *
   * The live site publishes no English at all (/en/homepage-english/ holds eighteen
   * characters and no content), so there is nothing to preserve and nothing to rewrite:
   * writing this is authoring, and it is the one field on this object that we own.
   *
   * It is a TRANSLATION of `text`, not a second piece of copy. Fidelity to the
   * Portuguese comes first - no fact is added, no claim is strengthened, no sentence is
   * split or joined - and where the source has an oddity that is a typo rather than a
   * voice (the space before the full stop in the services lead) the English simply does
   * not reproduce it. Propagating a typo into a language it was never made in would be
   * inventing a mistake.
   *
   * Optional so that a string can exist in Portuguese before it is translated;
   * `npm run validate:i18n` fails the build if a string reachable from an English route
   * is still missing one, so the gap can be temporary but never silent.
   */
  en?: string | undefined;
}

/**
 * Read a provenanced string in a locale.
 *
 * There is deliberately NO silent fallback to Portuguese for a mixed-language page: a
 * missing English string is recorded in `missingTranslations` and reported by the
 * validators, exactly the way src/i18n/index.ts records a missing UI key. The Portuguese
 * is still returned, because a hole in a paragraph is worse than a sentence in the wrong
 * language - but the build knows, and says so.
 */
export const missingTranslations = new Set<string>();

export function say(p: Provenanced, locale: Locale = DEFAULT_LOCALE): string {
  if (locale === DEFAULT_LOCALE) return p.text;
  if (p.en !== undefined) return p.en;
  missingTranslations.add(`${locale}:${p.from}:${p.text.slice(0, 40)}`);
  return p.text;
}

/**
 * The homepage's published strings. They live in src/content/page-content/home.json since
 * Phase A0 — the string, the page it was published on, and its English — and are read
 * through the schema in src/lib/page-content.ts. Notes on individual strings:
 *
 *   heroLineA/B       two <h2> lines on the live homepage; here they are the single <h1>
 *   servicesLead      the FIRST sentence of servicesLeadFull — selection, not editing
 *   aboutBodyFull     the About page's material, not rendered on `/`; source spacing kept
 *   contactTitle      the live /contactos/ <h2>
 *   copyright         only {year} is substituted, because a hardcoded year goes stale
 */
export const HOME = PAGE_CONTENT.home.copy;

/** Fill the copyright year from the build. No other token exists in the string. */
export const copyrightLine = (template: string, year = new Date().getFullYear()): string =>
  template.replace('{year}', String(year));

/**
 * SERVICES and TEAM used to live here as literals.
 *
 * They are content-collection entries now — `src/content/services/*.md` and
 * `src/content/team/*.md` — because the Services page and the About page publish the same
 * four services and the same two people, and two hardcoded copies of a list is how two
 * pages start disagreeing. The strings are unchanged; only their home moved.
 *
 * The homepage's excerpt rule moved with them, from a text scan in
 * `scripts/validate-data.mjs` into the schema itself: `excerpt` must be a literal
 * substring of `description`, checked by `astro check` and `astro build`
 * (src/content.config.ts, decision A44). Published copy may be SELECTED for a shorter
 * context; it may never be rewritten.
 *
 * `src/lib/curated.ts` reads projects, `getCollection('services')` reads services, and
 * `getCollection('team')` reads the team. Nothing in this file needs to know about any of
 * them.
 */

/**
 * The mono line under the hero statement.
 *
 * Facts only, each one derivable from preserved data: the descriptor is the live site's
 * own title suffix, the country follows from the published +351 numbers, and the count is
 * the number of projects actually published. No claim, no superlative, nothing invented.
 */
export const heroFacts = (projectCount: number, locale: Locale = DEFAULT_LOCALE): string[] =>
  locale === 'en'
    // "Audiovisual production" translates the live title suffix's own words
    // ("Produtora Audiovisual"); the country and the count are the same two facts.
    ? ['Audiovisual production', 'Portugal', `${projectCount} projects`]
    : ['Produtora audiovisual', 'Portugal', `${projectCount} projetos`];

/**
 * Render an E.164 number the way the live /contactos/ page prints it:
 * "+351932797025" → "(+351) 932 797 025". A display format, not a content change — the
 * stored value stays dialable and is what the tel: link uses.
 */
export function formatPhone(e164: string): string {
  const m = /^\+(\d{3})(\d{3})(\d{3})(\d{3})$/.exec(e164);
  return m ? `(+${m[1]}) ${m[2]} ${m[3]} ${m[4]}` : e164;
}

/* ════════════════════════════════════════════════════════════ composition ══ */

/**
 * One editorial row. `cols` is the CSS grid track list; `ratios` are the frame aspect
 * ratios that make those tracks equal in height (see the note at the top of this file).
 * `mobileRatios` apply in the single-column stack, where nothing has to line up and the
 * ratio should follow the picture instead.
 */
export interface EditorialRow {
  cols: string;
  ratios: number[];
  mobileRatios: number[];
  /** Two equal columns: one shared ratio per row keeps the heights matched there too. */
  tabletRatios: number[];
  /** A row of three widens its last frame across both tablet columns, so no half-row. */
  tabletSpans?: number[];
}

/**
 * Rows are keyed by position, not by project, so re-ordering the curated selection in
 * the content files reflows the page without touching the layout.
 *
 * Group A — two rows before the cinematic feature. Landscape-led, then portrait-led.
 * Group B — one row of three after it, the most contact-sheet moment on the page.
 */
export const GROUP_A: EditorialRow[] = [
  // 7fr : 5fr  →  1.778 / 1.270 = 7/5. Landscape lead, portrait-ish partner.
  { cols: '7fr 5fr', ratios: [1.778, 1.27], tabletRatios: [1.5, 1.5], mobileRatios: [1.778, 0.9] },
  // 5fr : 7fr  →  0.833 / 1.166 = 5/7. Portrait lead; the tallest row on the page.
  { cols: '5fr 7fr', ratios: [0.833, 1.166], tabletRatios: [0.9, 0.9], mobileRatios: [0.833, 1.5] },
];

export const GROUP_B: EditorialRow[] = [
  // Three equal columns, so equal ratios are equal heights. Square rather than 3:4:
  // these three stills are all wide, and a square keeps more of each composition than a
  // portrait crop would.
  {
    cols: '4fr 4fr 4fr',
    ratios: [1, 1, 1],
    tabletRatios: [1, 1, 2.4],
    mobileRatios: [1.333, 1, 1.5],
    // At two columns the third frame spans both, so the row still cannot leave a hole.
    tabletSpans: [1, 1, 2],
  },
];

/** How many curated projects each group takes, in homepageOrder sequence. */
export const GROUP_A_COUNT = GROUP_A.reduce((n, r) => n + r.ratios.length, 0);
export const GROUP_B_COUNT = GROUP_B.reduce((n, r) => n + r.ratios.length, 0);

/* ══════════════════════════════════════════════════════════════ sections ══ */

/** Ground per section. Four grounds, three changes before the footer (Review A had seven). */
export interface SectionGround { id: string; ground: 'dark' | 'cream' }

export const SECTION_ANCHORS: Record<'work' | 'services' | 'about' | 'contact', string> = {
  work: 'trabalho',
  services: 'servicos',
  about: 'sobre',
  contact: 'contacto',
};

/** Header nav order. Labels and hrefs are resolved through i18n + src/lib/nav.ts. */
export const NAV_ORDER: PageId[] = ['portfolio', 'about', 'services', 'contact'];
