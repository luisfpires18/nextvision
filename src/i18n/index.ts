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

const DICTIONARIES = { pt, en } as const;

/** Every key that fell back during this build. Reported by scripts/validate-data.mjs. */
export const fallbacks = new Set<string>();

export function t(key: UIKey, locale: Locale = DEFAULT_LOCALE): string {
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
