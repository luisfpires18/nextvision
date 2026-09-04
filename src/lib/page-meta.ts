/**
 * Titles and meta descriptions — PHASE 11, the SEO pass.
 *
 * ── The problem this solves ──────────────────────────────────────────────────
 * The live site publishes a meta description on exactly ONE of its thirty-four pages
 * (`/portfolio/nvf-vs-antiqvvm/`). Everywhere else Yoast emits an og:description built by
 * running the page's own DOM together and cutting it mid-word with an ellipsis:
 *
 *     "Sobre Nós De uma ideia a um movimento.  A NVF nasceu entre câmaras, roadtrips,
 *      trilhos de montanha, amizades e um eterno contacto com o audiovisual. […]"
 *
 * That is not a description of the page; it is the top of the page with the punctuation
 * removed. It is what every share card and every SERP snippet has had to work with.
 *
 * ── The rule these follow, and why it is not a rewrite ───────────────────────
 * A description here is a SELECTION of whole published sentences, in their published
 * order, joined by a single space. Not one word is written, shortened or paraphrased —
 * the identical rule the services excerpt already lives under (CLAUDE.md §2, decision
 * A44), applied to metadata.
 *
 * Every Portuguese fragment therefore declares the page it was published on and
 * `npm run validate:data` checks the claim against docs/source-archive/pages.json, word
 * for word. A description that drifts into authorship fails the build; there is no
 * reviewer to remember the rule.
 *
 * English is the authored translation of that selection, held on the same object, so the
 * two locales cannot describe a page differently.
 *
 * ── What DID change, and is therefore a reviewable diff ──────────────────────
 * Two things, both recorded in docs/SEO_I18N_ROLLOUT.md §5 for owner approval:
 *
 *   1. The homepage <title> was `Homepage - We are NVF - Produtora Audiovisual`. The
 *      company's name did not appear in the title of its own front page. Since Phase 12
 *      it is exactly `Next Vision Films`, in both locales: the brand does not suffix
 *      itself (src/config/site.ts). The suffix is preserved everywhere it still applies.
 *   2. `/obrigado/` becomes `noindex, follow`. It is a form's success state, it says so,
 *      and nobody searching for a film production company wants to land on it.
 *
 * Every other <title> is the live one, character for character.
 */

import { HOME, type Provenanced } from './homepage.ts';
import { PORTFOLIO } from './portfolio.ts';
import { CONTACT, THANKS } from './static-pages.ts';
import { say } from './homepage.ts';
import type { PageId } from '../i18n/routes.ts';
import { DEFAULT_LOCALE, type Locale } from '../config/i18n.ts';

const v = (text: string, from: string, en?: string): Provenanced =>
  (en === undefined ? { text, from } : { text, from, en });

/* ═══════════════════════════════════════════ selections made for this pass ══ */

/**
 * Sentences taken from inside a longer published paragraph.
 *
 * Selecting one sentence out of a paragraph is the same operation the homepage already
 * performs on the services lead and on `/sobre/`: the sentence is unchanged and its
 * neighbours are simply not printed here.
 */
const SELECTED = {
  /** First sentence of HOME.contactBody, published on `/`. */
  contactOpening: v(
    'Queremos ouvir a tua história e ajudá-la a ganhar vida.',
    '/',
    'We want to hear your story and help it come to life.',
  ),
  /** First sentence of HOME.aboutBodyFull, published on `/sobre/`. */
  origin: v(
    'A NVF nasceu entre câmaras, roadtrips,  trilhos de montanha, amizades e um eterno contacto com o audiovisual.',
    '/sobre/',
    'NVF was born among cameras, roadtrips, mountain trails, friendships and a lifelong contact with the audiovisual.',
  ),
  /**
   * The privacy policy's own two opening sentences, verbatim.
   *
   * They are the one part of that document that DESCRIBES it rather than binding anyone:
   * everything after them is the notice itself. Selecting them changes no legal wording
   * and adds none (CLAUDE.md §2 — the legal text may never be edited, and this does not
   * touch it; `npm run validate:legal` still compares the rendered document with the
   * archive and would fail on any difference).
   */
  privacyIntro: v(
    'A sua privacidade é importante para nós.',
    '/politica-de-privacidade/',
    'Your privacy is important to us.',
  ),
  privacyIntroB: v(
    'Este comunicado de privacidade explica como usamos a informação pessoal que recolhemos acerca de si quando usa este Website.',
    '/politica-de-privacidade/',
    'This privacy notice explains how we use the personal information we collect about you when you use this Website.',
  ),
} as const;

/* ══════════════════════════════════════════════════════════════ page meta ══ */

export interface PageMeta {
  /**
   * The `{Page}` half of `{Page} - We are NVF - …`. `null` on the homepage's Portuguese
   * entry would print the bare suffix; every page here supplies one.
   */
  title: Record<Locale, string | null>;
  /** Whole published sentences, joined by one space. Empty means: publish none. */
  description: readonly Provenanced[];
  /**
   * Why a page deliberately has no description, when that is the case. Present here means
   * "considered and declined", and `npm run validate:seo` accepts the page only because
   * this string exists — silence is never allowed to look like an oversight.
   */
  noDescriptionBecause?: string;
  noindex?: boolean;
}

export const PAGE_META: Record<PageId, PageMeta> = {
  home: {
    // Was `Homepage`. See the note at the top of this file — reviewable diff 1.
    title: { pt: 'Next Vision Films', en: 'Next Vision Films' },
    description: [HOME.workBody, SELECTED.contactOpening],
  },

  about: {
    title: { pt: 'Sobre', en: 'About' },
    description: [HOME.aboutLead, SELECTED.origin],
  },

  portfolio: {
    title: { pt: 'Portfólio', en: 'Portfolio' },
    description: [PORTFOLIO.lead, HOME.workBody],
  },

  services: {
    title: { pt: 'Serviços', en: 'Services' },
    // The whole published lead, which is already exactly a description's length.
    description: [HOME.servicesLeadFull],
  },

  contact: {
    title: { pt: 'Contactos', en: 'Contact' },
    description: [CONTACT.lead, SELECTED.contactOpening],
  },

  'thank-you': {
    title: { pt: 'Obrigado', en: 'Thank you' },
    description: [THANKS.lineA, THANKS.lineB],
    // Reviewable diff 2. A success state has no business in a search result.
    noindex: true,
  },

  terms: {
    title: { pt: 'Termos e Condições', en: null },
    description: [],
    noDescriptionBecause:
      'Every sentence in this document is a binding clause, including its first. Selecting '
      + 'one would present a term of contract as a summary of the page, and writing a '
      + 'neutral one would be authoring legal-adjacent copy. The page ships without a meta '
      + 'description, exactly as published, and search engines derive their own snippet.',
  },

  privacy: {
    // Lower case, because the live <title> is lower case. Preserved (CLAUDE.md §2).
    title: { pt: 'política de privacidade', en: null },
    description: [SELECTED.privacyIntro, SELECTED.privacyIntroB],
  },
};

/** The `{Page}` half of the title, in a locale. */
export const pageTitle = (id: PageId, locale: Locale = DEFAULT_LOCALE): string | undefined =>
  PAGE_META[id].title[locale] ?? undefined;

/** The composed description, or null where the page deliberately publishes none. */
export function pageDescription(id: PageId, locale: Locale = DEFAULT_LOCALE): string | null {
  const parts = PAGE_META[id].description;
  if (parts.length === 0) return null;
  return parts.map((p) => say(p, locale)).join(' ').replace(/\s+/g, ' ').trim();
}

export const pageNoindex = (id: PageId): boolean => PAGE_META[id].noindex === true;

/* ═════════════════════════════════════════════════════ projects & archives ══ */

/**
 * A project's description.
 *
 * Where the project publishes a tagline, that IS the description — it is the only prose
 * the source gives, and it is what the work says about itself.
 *
 * Where it publishes none — ten of the twenty do not — the description is assembled from
 * FACTS the content already holds: the work's title, the category it is filed under, and
 * the year. No adjective, no atmosphere, and nothing about a film we have not been told
 * anything about. `docs/PROJECT_ROLLOUT.md` records which projects those are and why.
 *
 * The one connective phrase ("A Next Vision Films project") names the publisher and
 * claims nothing else.
 */
export function projectDescription(project: {
  title: string;
  tagline: string | null;
  categoryName: string;
  year: number;
}, locale: Locale = DEFAULT_LOCALE): string {
  const tagline = project.tagline?.replace(/\s+/g, ' ').trim();
  if (tagline) {
    // A tagline set as several lines describes itself in its first one; the rest is the
    // rhythm of the piece and belongs on the page, not in a 160-character box.
    return tagline.length <= 165 ? tagline : firstSentence(tagline);
  }
  const suffix = locale === 'en'
    ? `${project.categoryName}, ${project.year}. A Next Vision Films project.`
    : `${project.categoryName}, ${project.year}. Um projeto da Next Vision Films.`;
  return `${project.title} — ${suffix}`;
}

/** The five preserved archives. Noindex, so this exists for humans arriving on old links. */
export function categoryDescription(
  name: string,
  count: number,
  locale: Locale = DEFAULT_LOCALE,
): string {
  return locale === 'en'
    ? `${count} ${count === 1 ? 'project' : 'projects'} filed under ${name}. ${say(PORTFOLIO.lead, locale)}`
    : `${count} ${count === 1 ? 'projeto' : 'projetos'} em ${name}. ${say(PORTFOLIO.lead, locale)}`;
}

/** Up to the first sentence break, so a truncated description never ends mid-clause. */
function firstSentence(text: string): string {
  const cut = text.search(/[.!?](\s|$)/);
  return cut === -1 ? text.slice(0, 160).trimEnd() : text.slice(0, cut + 1);
}
