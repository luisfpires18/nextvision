/**
 * SEO helpers — data and structure only. No copy is written here.
 *
 * Authority: docs/ARCHITECTURE.md §10.4, §11.3.
 *
 * What this fixes from the live site:
 *   - canonicals missing on all 5 category archives (audit §9.18)
 *   - og:image missing on / and /portfolio/
 *   - og:description missing on all 20 project pages
 *   - hreflang present on only 2 of 34 pages
 *   - no VideoObject anywhere, for a company whose product is film
 *
 * Titles and descriptions come from CONTENT, never from this module — src/lib/page-meta.ts
 * composes them out of published sentences and the build checks every one against the
 * archive. This file decides SHAPE: which tags exist, what they point at, and which
 * alternates may honestly be advertised.
 *
 * PHASE 11 changed two things here and nothing else:
 *   - the title suffix and og:site_name follow the locale, because the Portuguese one
 *     ends in `Produtora Audiovisual` and an English page saying that about itself would
 *     be describing itself in a language it is not written in;
 *   - `alternates()` now emits only pairs that were actually BUILT, which is what makes
 *     hreflang reciprocal rather than aspirational. See the note on it.
 */

import { SITE_URL, TITLE_SUFFIXES, formatTitle } from '../config/site.ts';
import { DEFAULT_LOCALE, LOCALE_TAGS, OG_LOCALES, activeLocales, type Locale } from '../config/i18n.ts';
import { translatePath } from '../i18n/routes.ts';

export const absoluteUrl = (path: string): string => new URL(path, SITE_URL).href;

export interface AlternateLink { hreflang: string; href: string }

/**
 * Reciprocal hreflang for a path, plus x-default pointing at Portuguese.
 *
 * ── Why this returns fewer links than you might expect ───────────────────────
 * hreflang is a CLAIM that the other page exists and is the same page in another
 * language. Google discards the whole cluster when the claim is not returned — an
 * annotation pointing at a page that does not point back is worse than no annotation,
 * because it invalidates the pairs that were correct.
 *
 * So `translatePath` returns null wherever a counterpart was not built, and null is
 * simply not emitted. The two legal documents are Portuguese only (no approved English
 * translation exists, and machine-translating a contract is not an option), so those two
 * pages carry a self-referencing canonical, no alternates, and no x-default — which is
 * the correct annotation for a page that exists in one language.
 *
 * x-default is emitted only alongside a real pair, and always points at Portuguese: it
 * is the source language and the one every existing inbound link already resolves to.
 */
export function alternates(path: string, locale: Locale): AlternateLink[] {
  const out: AlternateLink[] = [];
  for (const target of activeLocales()) {
    const href = target === locale ? path : translatePath(path, locale, target);
    if (href) out.push({ hreflang: LOCALE_TAGS[target], href: absoluteUrl(href) });
  }
  // One entry means this page exists in this locale alone; a self-referencing hreflang on
  // its own says nothing, and an x-default beside it would claim a choice that is not there.
  if (out.length < 2) return [];
  const pt = translatePath(path, locale, DEFAULT_LOCALE) ?? path;
  out.push({ hreflang: 'x-default', href: absoluteUrl(pt) });
  return out;
}

export interface SeoInput {
  title?: string;
  description?: string;
  /**
   * og:description when it differs from the meta description — including the case where
   * the source page publishes an og:description and NO meta description at all, which is
   * exactly what the live homepage does. Preserving that asymmetry is the content rule
   * (CLAUDE.md §2): the archived string ships verbatim, and writing a real meta
   * description is an owner-reviewed proposal in Phase 11b.
   */
  ogDescription?: string;
  path: string;
  locale: Locale;
  ogImage?: string | null;
  ogType?: 'website' | 'article' | 'video.other';
  noindex?: boolean;
  /** Described alternative for og:image, when the image is not the page's own subject. */
  ogImageAlt?: string;
}

export interface SeoOutput {
  title: string;
  description: string | null;
  canonical: string;
  robots: string;
  htmlLang: string;
  alternates: AlternateLink[];
  openGraph: Record<string, string>;
  twitter: Record<string, string>;
}

export function buildSeo(input: SeoInput): SeoOutput {
  const canonical = absoluteUrl(input.path);
  const title = formatTitle(input.title, input.locale);
  const alt = alternates(input.path, input.locale);

  const openGraph: Record<string, string> = {
    'og:type': input.ogType ?? 'website',
    'og:title': title,
    'og:url': canonical,
    // Published by every live page; preserved so shared links keep the same card. The
    // English card carries the English suffix for the same reason the <title> does.
    'og:site_name': TITLE_SUFFIXES[input.locale],
    'og:locale': OG_LOCALES[input.locale],
  };
  const og = input.ogDescription ?? input.description;
  if (og) openGraph['og:description'] = og;
  if (input.ogImage) {
    openGraph['og:image'] = input.ogImage;
    // Every og:image on the live site lacks a described alternative; declare it here.
    openGraph['og:image:alt'] = input.ogImageAlt ?? input.title ?? title;
  }
  for (const l of activeLocales()) {
    if (l !== input.locale) openGraph['og:locale:alternate'] = OG_LOCALES[l];
  }

  const twitter: Record<string, string> = { 'twitter:card': 'summary_large_image' };
  if (input.ogImage) twitter['twitter:image'] = input.ogImage;

  return {
    title,
    description: input.description ?? null,
    canonical,
    robots: input.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large',
    htmlLang: LOCALE_TAGS[input.locale],
    alternates: alt,
    openGraph,
    twitter,
  };
}

/* ------------------------------------------------------------ structured data */

/** Organization. Fields the live site does not publish stay absent, never invented. */
export function organizationSchema(opts: {
  logoUrl?: string; sameAs?: string[]; email?: string | null;
}): Record<string, unknown> {
  const node: Record<string, unknown> = {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Next Vision Films',
    url: SITE_URL,
  };
  if (opts.logoUrl) node['logo'] = opts.logoUrl;
  if (opts.sameAs?.length) node['sameAs'] = opts.sameAs;
  if (opts.email) node['email'] = opts.email;
  return node;
}

export function websiteSchema(locale: Locale): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'Next Vision Films',
    inLanguage: LOCALE_TAGS[locale],
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem', position: i + 1, name: t.name, item: absoluteUrl(t.path),
    })),
  };
}

/**
 * VideoObject — new for this rebuild. The live site has none, despite 20 films.
 * Only emitted with a real thumbnail and upload date; a partial VideoObject is worse
 * than none.
 */
export function videoObjectSchema(v: {
  name: string; description?: string | null; thumbnailUrl: string;
  uploadDate: string; embedUrl?: string; contentUrl?: string; duration?: string;
}): Record<string, unknown> {
  const node: Record<string, unknown> = {
    '@type': 'VideoObject',
    name: v.name,
    thumbnailUrl: v.thumbnailUrl,
    uploadDate: v.uploadDate,
  };
  if (v.description) node['description'] = v.description;
  if (v.embedUrl) node['embedUrl'] = v.embedUrl;
  if (v.contentUrl) node['contentUrl'] = v.contentUrl;
  if (v.duration) node['duration'] = v.duration;
  return node;
}

export const jsonLdGraph = (nodes: Record<string, unknown>[]): string =>
  JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes });
