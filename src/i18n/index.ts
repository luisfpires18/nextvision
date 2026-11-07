/**
 * Translation lookup with explicit, reported fallback.
 *
 * A missing translation falls back to Portuguese AND is recorded, so gaps are visible
 * in the build output instead of shipping as invisible mixed-language pages
 * (docs/ARCHITECTURE.md §10.2).
 */
import { DEFAULT_LOCALE, type Locale } from '../config/i18n.ts';
import { pt, type UIKey } from './pt.ts';
import { en } from './en.ts';
import { PAGE_CONTENT } from '../lib/page-content.ts';

/**
 * The five section names are the owners' to change (admin, "Textos do site"), so they are
 * read from src/content/page-content/brand.json rather than from the dictionaries. Every
 * caller (the menu, the footer, the spines, the BTS page title) keeps asking for its key.
 */
const SECTION_KEYS: Partial<Record<UIKey, keyof typeof PAGE_CONTENT.brand.menu>> = {
  'rail.home': 'home', 'rail.about': 'about', 'rail.commercial': 'commercial', 'rail.cinema': 'cinema', 'rail.bts': 'bts',
};

const DICTIONARIES = { pt, en } as const;

/** Every key that fell back during this build. Reported by scripts/validate-data.mjs. */
export const fallbacks = new Set<string>();

export function t(key: UIKey, locale: Locale = DEFAULT_LOCALE): string {
  const section = SECTION_KEYS[key];
  if (section) return PAGE_CONTENT.brand.menu[section][locale === 'en' ? 'en' : 'pt'];
  if (locale === DEFAULT_LOCALE) return pt[key];
  const value = (DICTIONARIES[locale] as Partial<Record<UIKey, string>>)[key];
  if (value !== undefined) return value;
  fallbacks.add(`${locale}:${key}`);
  return pt[key];
}

/** Bind a locale once, for use inside a component. */
export const useTranslations = (locale: Locale) => (key: UIKey): string => t(key, locale);

/** Which UI keys are still untranslated for a locale. */
export function missingKeys(locale: Locale): UIKey[] {
  if (locale === DEFAULT_LOCALE) return [];
  const dict = DICTIONARIES[locale] as Partial<Record<UIKey, string>>;
  return (Object.keys(pt) as UIKey[]).filter((k) => dict[k] === undefined);
}

export { pt, en };
export type { UIKey };
