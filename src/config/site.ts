/**
 * Technical site configuration.
 *
 * This file holds values the OWNER should never need to edit. Owner-editable
 * content (contact details, socials, navigation labels) belongs in content
 * collections instead — see docs/ARCHITECTURE.md §4.3.
 */

export const SITE_URL = 'https://www.nextvisionfilms.com';

/**
 * The dev Worker, where a change saved in the admin appears before it is published
 * (docs/ADMIN_DASHBOARD_PLAN.md §4). The admin on the live site previews pages here.
 */
export const PREVIEW_URL = 'https://dev.nextvisionfilms.com';

/**
 * Public base for delivered media.
 *
 * The DEFAULT is the local mirror, not the R2 host, and that is deliberate. `media/dist/`
 * is byte-identical to the bucket at the same relative paths, so an unconfigured checkout
 * builds and runs with no network, no credentials and no dead URLs — and a build that
 * forgot to set the variable fails visibly in development rather than silently shipping
 * links to a host that has nothing on it.
 *
 * Production sets `PUBLIC_MEDIA_BASE_URL` to the R2 delivery origin (Worker var in
 * wrangler.jsonc). No trailing slash. See docs/MEDIA_PIPELINE.md §4.
 */
export const MEDIA_DEV_BASE = '/__media';
export const MEDIA_BASE_URL = (
  import.meta.env['PUBLIC_MEDIA_BASE_URL'] ?? MEDIA_DEV_BASE
).replace(/\/+$/, '');

/**
 * SEO title pattern, preserved verbatim from the live site so search results keep
 * looking the same through the migration (docs/ARCHITECTURE.md §11.3).
 * The Portuguese suffix is EXISTING COPY — do not reword it (CLAUDE.md §2).
 *
 * PHASE 12 — the English suffix is the BRAND, not a translation.
 *
 * It used to be `We are NVF - Audiovisual Production`, a word-for-word rendering of the
 * Portuguese. The owners rejected it: `We are NVF` is a Portuguese-market tagline, and an
 * English search result for a film production company is better served by the company's
 * actual name than by a translated slogan. The Portuguese suffix is untouched, because
 * that one is preserved live copy and this one never existed.
 */
export const BRAND = 'Next Vision Films';
export const TITLE_SUFFIX = 'We are NVF - Produtora Audiovisual';
export const TITLE_SUFFIXES: Record<'pt' | 'en', string> = {
  pt: TITLE_SUFFIX,
  en: BRAND,
};

/**
 * `{Page} - {Suffix}`, except that THE BRAND NEVER SUFFIXES ITSELF.
 *
 * The homepage's `{Page}` half is the brand, so without this rule the English front page
 * would read `Next Vision Films - Next Vision Films`. The rule is stated once, here,
 * rather than special-cased at the homepage — any future page titled with the brand gets
 * the same treatment for the same reason.
 */
export const formatTitle = (pageTitle?: string, locale: 'pt' | 'en' = 'pt'): string => {
  const suffix = TITLE_SUFFIXES[locale];
  if (!pageTitle) return suffix;
  if (pageTitle === BRAND) return BRAND;
  return `${pageTitle} - ${suffix}`;
};

/** Responsive width ladders. Consumed by the media pipeline and by imageProps(). */
export const IMAGE_WIDTHS = [480, 768, 1024, 1440, 1920] as const;
export const PORTRAIT_WIDTHS = [320, 480, 768] as const;
export const VIDEO_HEIGHTS = [720, 1080, 1440] as const;

/**
 * Quality floor for cinematic hero video. Anything below this is MASTER_REQUIRED.
 * Kept in sync with scripts/build-media-source-map.mjs.
 */
export const HERO_MIN_HEIGHT = 1080;
export const HERO_MIN_BITRATE = 8_000_000;

/**
 * The contact form's backend now EXISTS — see src/config/forms.ts.
 *
 * `CONTACT_FORM` used to live here, holding an endpoint that was never built and an
 * `enabled: false` that turned the form off. Both are gone: the endpoint is
 * src/pages/api/contact.ts, and the form's contract — route, field names, limits, outcome
 * codes, Turnstile keys — is declared once in src/config/forms.ts, where the endpoint and
 * the component both read it.
 *
 * It moved rather than growing here because this file is technical SITE configuration and
 * that one is a wire format shared with a runtime route. A limit declared in two places is
 * a limit the two sides can disagree about.
 */
