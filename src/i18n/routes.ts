/**
 * Route localisation.
 *
 * Two rules, from docs/ARCHITECTURE.md §10.1:
 *   1. Page slugs ARE localised   — /sobre/ ↔ /en/about/   (ordinary words, SEO weight)
 *   2. Project slugs are NOT      — /portfolio/epitafio/ ↔ /en/portfolio/epitafio/
 *      (proper nouns and stable identifiers; translating them would double the URL
 *       surface and split link equity for nothing)
 *
 * The PT column is EXISTING, INDEXED URLs and must not change (docs/ROUTE_MIGRATION.md §2).
 *
 * PHASE 11 adds the third rule, and it is the one that keeps the language switch honest:
 *   3. A page exists in a locale only if PAGE_LOCALES says so. `translatePath` returns
 *      null for anything else, so no caller can accidentally link to a route that was
 *      never built.
 */

import { DEFAULT_LOCALE, LOCALE_PREFIX, type Locale } from '../config/i18n.ts';

export type PageId =
  | 'home' | 'about' | 'portfolio' | 'services'
  | 'contact' | 'thank-you' | 'terms' | 'privacy';

/** Path segment per page, per locale. Empty string = site root. */
export const PAGE_SLUGS: Record<PageId, Record<Locale, string>> = {
  home: { pt: '', en: '' },
  about: { pt: 'sobre', en: 'about' },
  portfolio: { pt: 'portfolio', en: 'portfolio' },
  services: { pt: 'servicos', en: 'services' },
  contact: { pt: 'contactos', en: 'contact' },
  'thank-you': { pt: 'obrigado', en: 'thank-you' },
  terms: { pt: 'termos-e-condicoes', en: 'terms-and-conditions' },
  privacy: { pt: 'politica-de-privacidade', en: 'privacy-policy' },
};

/**
 * Which locales actually PUBLISH each page.
 *
 * The two legal documents are Portuguese only, and that is a content fact rather than a
 * scheduling gap: `termos-e-condicoes` and `politica-de-privacidade` are binding text,
 * no owner-approved English translation exists, and machine-translating a contract or a
 * GDPR notice would publish a legal claim nobody wrote (CLAUDE.md §2, §8). Their EN slugs
 * stay declared above so that the day a translation is approved, this array is the only
 * edit.
 *
 * Everything a caller derives from a locale — the built routes, the hreflang set, the
 * sitemap, the language switch, the footer's legal links — reads THIS, so those five
 * things cannot disagree about what exists.
 */
export const PAGE_LOCALES: Record<PageId, readonly Locale[]> = {
  home: ['pt', 'en'],
  about: ['pt', 'en'],
  portfolio: ['pt', 'en'],
  services: ['pt', 'en'],
  contact: ['pt', 'en'],
  'thank-you': ['pt', 'en'],
  terms: ['pt'],
  privacy: ['pt'],
};

export const pageExists = (id: PageId, locale: Locale): boolean =>
  PAGE_LOCALES[id].includes(locale);

/** Every page published in a locale, in PageId declaration order. */
export const pagesIn = (locale: Locale): PageId[] =>
  (Object.keys(PAGE_LOCALES) as PageId[]).filter((id) => pageExists(id, locale));

/** Taxonomy archive base. PT segment is an indexed URL and is frozen. */
export const CATEGORY_BASE: Record<Locale, string> = {
  pt: 'categoria-portfolio',
  en: 'portfolio-category',
};

const join = (...parts: string[]): string => {
  const p = parts.filter(Boolean).join('/');
  return `/${p}/`.replace(/\/{2,}/g, '/');
};

/** Canonical path for a static page in a locale. Always trailing-slashed. */
export function pagePath(id: PageId, locale: Locale = DEFAULT_LOCALE): string {
  return join(LOCALE_PREFIX[locale], PAGE_SLUGS[id][locale]);
}

/** Project detail page. The slug is deliberately the same in every locale. */
export function projectPath(slug: string, locale: Locale = DEFAULT_LOCALE): string {
  return join(LOCALE_PREFIX[locale], PAGE_SLUGS.portfolio[locale], slug);
}

/** Category archive page. */
export function categoryPath(slug: string, locale: Locale = DEFAULT_LOCALE): string {
  return join(LOCALE_PREFIX[locale], CATEGORY_BASE[locale], slug);
}

/**
 * Given any path, return its equivalent in another locale — the language switch's job,
 * and the source of every hreflang pair on the site.
 *
 * Returns null when there is no equivalent, so the caller decides what to do rather than
 * silently linking somewhere wrong. That happens for exactly one reason today: the legal
 * documents are PT-only (PAGE_LOCALES).
 */
export function translatePath(path: string, from: Locale, to: Locale): string | null {
  if (from === to) return path;

  const stripped = from === DEFAULT_LOCALE
    ? path
    : path.replace(new RegExp(`^${LOCALE_PREFIX[from]}(?=/|$)`), '') || '/';
  const segments = stripped.split('/').filter(Boolean);

  if (segments.length === 0) return pageExists('home', to) ? pagePath('home', to) : null;

  // /portfolio/{slug}/ — slug is locale-invariant
  const portfolioSeg = PAGE_SLUGS.portfolio[from];
  if (segments[0] === portfolioSeg && segments[1]) {
    return pageExists('portfolio', to) ? projectPath(segments[1], to) : null;
  }

  // /categoria-portfolio/{slug}/ — the preserved archives exist in both locales
  if (segments[0] === CATEGORY_BASE[from] && segments[1]) {
    return pageExists('portfolio', to) ? categoryPath(segments[1], to) : null;
  }

  // a static page
  const entry = (Object.entries(PAGE_SLUGS) as [PageId, Record<Locale, string>][])
    .find(([, slugs]) => slugs[from] === segments[0]);
  if (!entry) return null;
  return pageExists(entry[0], to) ? pagePath(entry[0], to) : null;
}

/** Detect the locale a path belongs to. */
export function localeFromPath(path: string): Locale {
  return path === '/en' || path.startsWith('/en/') ? 'en' : DEFAULT_LOCALE;
}

/** The PageId a path resolves to, or null for project and category routes. */
export function pageIdFromPath(path: string, locale: Locale = localeFromPath(path)): PageId | null {
  const stripped = locale === DEFAULT_LOCALE
    ? path
    : path.replace(new RegExp(`^${LOCALE_PREFIX[locale]}(?=/|$)`), '') || '/';
  const segments = stripped.split('/').filter(Boolean);
  if (segments.length === 0) return 'home';
  if (segments.length > 1) return null;
  const entry = (Object.entries(PAGE_SLUGS) as [PageId, Record<Locale, string>][])
    .find(([, slugs]) => slugs[locale] === segments[0]);
  return entry ? entry[0] : null;
}
