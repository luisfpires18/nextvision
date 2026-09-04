/**
 * Locale configuration. Portuguese is the source language and is unprefixed;
 * English lives under /en/. See docs/ARCHITECTURE.md §10.
 *
 * Confirmed against the live site's Polylang config (docs/source-archive/endpoints.json):
 *   pt / pt_PT — default
 *   en / en_GB
 */

export const LOCALES = ['pt', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'pt';

/** BCP-47 tags for <html lang>, hreflang and og:locale. */
export const LOCALE_TAGS: Record<Locale, string> = { pt: 'pt-PT', en: 'en-GB' };
export const OG_LOCALES: Record<Locale, string> = { pt: 'pt_PT', en: 'en_GB' };

/** Human label for the language switch. Written in the language it refers to. */
export const LOCALE_LABELS: Record<Locale, string> = { pt: 'Português', en: 'English' };

/** Two-letter code for the compact switch in the header. */
export const LOCALE_SHORT: Record<Locale, string> = { pt: 'PT', en: 'EN' };

/** URL prefix per locale. The default locale has none. */
export const LOCALE_PREFIX: Record<Locale, string> = { pt: '', en: '/en' };

/**
 * Which locales are allowed to emit routes.
 *
 * PHASE 11 — English is ON.
 *
 * It was off through Review E and Phase 10 precisely so that an empty English page could
 * never ship, which is the failure the live site has (audit §9.1). It is on now because
 * the pages behind it are real: every marketing route has authored English copy, checked
 * by `npm run validate:i18n`, and the two pages that do NOT have an approved English
 * version — the legal documents — declare that in PAGE_LOCALES rather than being
 * machine-translated (docs/SEO_I18N_ROLLOUT.md §3).
 *
 * The guarantee therefore moved rather than weakened: it used to be "no English at all",
 * and it is now "no English route without authored English content", enforced per page.
 */
export const ENABLED_LOCALES: Record<Locale, boolean> = { pt: true, en: true };

export const activeLocales = (): Locale[] => LOCALES.filter((l) => ENABLED_LOCALES[l]);
export const isLocaleEnabled = (l: Locale): boolean => ENABLED_LOCALES[l];

/** The other enabled locales, in declaration order. */
export const otherLocales = (l: Locale): Locale[] => activeLocales().filter((x) => x !== l);
