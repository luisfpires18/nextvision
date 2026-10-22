/**
 * Site navigation resolution.
 *
 * Navigation is DATA (src/content/settings/navigation.yml) resolved through
 * src/i18n/routes.ts. Nothing here hardcodes an href or a label.
 *
 * The one thing this file adds is honesty about what has actually been built.
 * Review B shipped the homepage only, so a link to a page that did not exist yet resolved
 * to its section on the homepage instead of 404-ing during an owner review. When a real
 * route ships, its id joins BUILT_PAGES and every link in the site follows automatically —
 * header, footer, in-page CTAs and the project viewer.
 *
 * As of Phase 10 that list is complete: every Portuguese route the live site serves is a
 * real page, and no navigation item resolves to a homepage section any more. The
 * mechanism stays because it costs nothing and it is what a new page will use next.
 */

import { pagePath, pageExists, type PageId } from '../i18n/routes.ts';
import { DEFAULT_LOCALE, type Locale } from '../config/i18n.ts';

/**
 * Routes that exist in the build. Add an id here the moment its page ships.
 * `home` is implicit and never listed.
 */
export const BUILT_PAGES: readonly PageId[] = [
  'portfolio', 'about', 'services', 'contact', 'thank-you', 'terms', 'privacy', 'bts',
];

/** Homepage section anchors, used while the real page is still to be built. */
const HOME_SECTION: Partial<Record<PageId, string>> = {
  portfolio: '#trabalho',
  services: '#servicos',
  about: '#sobre',
  contact: '#contacto',
};

export const isBuilt = (id: PageId): boolean => BUILT_PAGES.includes(id);

/**
 * Where a navigation item should point today.
 *
 * Three answers, in order:
 *   1. the page does not exist yet          → its section on the homepage
 *   2. it exists, but not in THIS locale    → the locale that does publish it
 *   3. otherwise                            → its canonical path in this locale
 *
 * Case 2 is PHASE 11 and it is not a fallback dressed up as a feature: the two legal
 * documents are Portuguese only because no approved English translation exists
 * (src/i18n/routes.ts PAGE_LOCALES), and an English page still has to be able to link to
 * the privacy policy it asks readers to accept. Linking to the Portuguese one and SAYING
 * SO is the honest answer; linking to a route that was never built is a 404, and
 * machine-translating a contract is not on the table.
 *
 * Callers that render the link must pair this with `isForeignLanguagePage` so the reader
 * is told the destination changes language before they follow it.
 */
export function navHref(id: PageId, locale: Locale = DEFAULT_LOCALE): string {
  if (!isBuilt(id)) return HOME_SECTION[id] ?? pagePath('home', locale);
  if (!pageExists(id, locale)) return pagePath(id, DEFAULT_LOCALE);
  return pagePath(id, locale);
}

/** True when `navHref` had to leave this locale to find the page. */
export const isForeignLanguagePage = (id: PageId, locale: Locale): boolean =>
  isBuilt(id) && !pageExists(id, locale);

/** The locale a page is actually published in, for `lang` and `hreflang` on the link. */
export const localeOfPage = (id: PageId, locale: Locale): Locale =>
  pageExists(id, locale) ? locale : DEFAULT_LOCALE;

/** True when a link leaves the current document — used to mark real navigation. */
export const isPageLink = (id: PageId): boolean => isBuilt(id);

/**
 * Project detail routes exist as of Review C. They are TEMPORARY scaffolding — Review D
 * designs them — but they resolve, so a card is a link to the project rather than to a
 * preview that then needs a second tap.
 */
export const PROJECT_PAGES_BUILT = true;
