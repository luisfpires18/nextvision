/**
 * Curated homepage projects — the bridge between content collections and the layout.
 *
 * Content decides WHAT (title, tagline, category, date, film, media keys, order).
 * src/lib/homepage.ts decides HOW the selection is composed.
 * This file joins them and resolves media through the normal media seam, so moving the
 * bytes between the local mirror and R2 changes nothing in any component.
 */

import { getCollection, getEntry } from 'astro:content';
import { getMedia, mediaUrl, imageProps, videoProps, youtubeWatchUrl } from './media.ts';
import { DEFAULT_LOCALE, type Locale } from '../config/i18n.ts';
import { projectPath } from '../i18n/routes.ts';

export interface CuratedProject {
  slug: string;
  title: string;
  tagline: string | null;
  categoryName: string;
  /** Token name from tokens.colour.css, never a raw colour. */
  categoryToken: string;
  /** Printed exactly the way the live site prints it: "11 Fevereiro '25". */
  date: string;
  /** ISO date, for structured data. */
  iso: string;
  posterSrc: string | null;
  /** Real encoded widths, so a phone never downloads the 1400px file. */
  posterSrcset: string | undefined;
  /** The same ladder in AVIF, offered first inside a <picture>. */
  posterAvifSrcset: string | undefined;
  posterWidth: number | undefined;
  posterHeight: number | undefined;
  previewSrc: string | null;
  heroSrc: string | null;
  /** Narrow rendition of the same clip, for phones. */
  heroSrcSmall: string | null;
  /** VP9, where it exists. The runtime prefers it only when the browser decodes it. */
  heroWebm: string | null;
  heroWebmSmall: string | null;
  heroPosterSrc: string | null;
  heroWidth: number | undefined;
  heroHeight: number | undefined;
  filmUrl: string | null;
  /** Why this project has nothing watchable, when that is the case (decision D6). */
  filmUnavailable: string | null;
  /** Canonical route for this project. */
  href: string;
  /** Category slug, for filtering. */
  categorySlug: string;
  featured: boolean;
  order: number;
}

/** Portuguese month names, as printed on the live site's post-info line. */
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** "11 Fevereiro '25" — the live site's own date format, reproduced rather than restyled. */
export function formatDate(d: Date): string {
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(2)}`;
}

const src = (key: string | undefined): string | null =>
  key && getMedia(key) ? mediaUrl(key) : null;

type Entry = Awaited<ReturnType<typeof getCollection<'projects'>>>[number];

/** One shared mapper, so the homepage and the portfolio can never describe a project differently. */
async function build(entries: Entry[], locale: Locale): Promise<CuratedProject[]> {
  const out: CuratedProject[] = [];
  for (const p of entries) {
    const catRef = p.data.categories[0];
    const cat = catRef ? await getEntry(catRef) : undefined;

    const posterKey = p.data.poster.key;
    const poster = getMedia(posterKey);
    const heroKey = p.data.heroVideo;
    const hero = heroKey ? getMedia(heroKey) : null;
    const heroVideo = heroKey ? videoProps(heroKey) : null;

    out.push({
      slug: p.id,
      title: p.data.title[locale] ?? p.data.title.pt,
      tagline: p.data.tagline?.[locale] ?? p.data.tagline?.pt ?? null,
      categoryName: cat?.data.name[locale] ?? cat?.data.name.pt ?? '',
      categoryToken: cat?.data.accentToken ?? 'ink',
      date: formatDate(p.data.date),
      iso: p.data.date.toISOString().slice(0, 10),
      posterSrc: src(posterKey),
      posterSrcset: imageProps(posterKey)?.srcset,
      posterAvifSrcset: imageProps(posterKey)?.avifSrcset,
      posterWidth: poster?.width ?? undefined,
      posterHeight: poster?.height ?? undefined,
      previewSrc: src(p.data.previewVideo),
      heroSrc: heroVideo?.mp4[0]?.src ?? null,
      heroSrcSmall: heroVideo?.mp4[1]?.src ?? heroVideo?.mp4[0]?.src ?? null,
      heroWebm: heroVideo?.webm[0]?.src ?? null,
      heroWebmSmall: heroVideo?.webm[1]?.src ?? heroVideo?.webm[0]?.src ?? null,
      heroPosterSrc: src(p.data.heroStill?.key),
      heroWidth: hero?.width ?? undefined,
      heroHeight: hero?.height ?? undefined,
      filmUrl: p.data.film?.provider === 'youtube' ? youtubeWatchUrl(p.data.film.id) : null,
      filmUnavailable: p.data.filmUnavailable ?? null,
      href: projectPath(p.id, locale),
      categorySlug: catRef?.id ?? '',
      featured: p.data.featured,
      order: p.data.portfolioOrder ?? p.data.homepageOrder ?? 0,
    });
  }
  return out;
}

/**
 * Every project with a homepageOrder, in that order.
 *
 * Ordering lives in content, so the owners can re-curate the homepage by editing two
 * numbers in two files — no code, no layout change (the composition is keyed by
 * position, not by slug).
 */
export async function curatedProjects(locale: Locale = DEFAULT_LOCALE): Promise<CuratedProject[]> {
  const all = await getCollection('projects', (p) => !p.data.draft && p.data.homepageOrder !== null);
  return build(all.sort((a, b) => (a.data.homepageOrder ?? 0) - (b.data.homepageOrder ?? 0)), locale);
}

/**
 * Every published project in curated portfolio order.
 *
 * `portfolioOrder` lives in the content files, so re-curating the index is a data edit
 * and needs no code change — which is the flexibility requirement in PROJECT_CONTEXT §9.
 * A project without an order sorts last rather than disappearing: a missing number must
 * never silently drop work from the catalogue.
 */
export async function portfolioProjects(locale: Locale = DEFAULT_LOCALE): Promise<CuratedProject[]> {
  const all = await getCollection('projects', (p) => !p.data.draft);
  const ordered = all.sort(
    (a, b) => (a.data.portfolioOrder ?? Number.MAX_SAFE_INTEGER) - (b.data.portfolioOrder ?? Number.MAX_SAFE_INTEGER),
  );
  return build(ordered, locale);
}

/** Categories that actually have work, with their counts. */
export async function categoryFacets(locale: Locale = DEFAULT_LOCALE): Promise<{
  slug: string; name: string; token: string; count: number; order: number;
}[]> {
  const projects = await getCollection('projects', (p) => !p.data.draft);
  const categories = await getCollection('categories', (c) => !c.data.hidden);

  return categories
    .map((c) => ({
      slug: c.id,
      name: c.data.name[locale] ?? c.data.name.pt,
      token: c.data.accentToken ?? 'ink',
      order: c.data.order,
      count: projects.filter((p) => p.data.categories.some((r) => r.id === c.id)).length,
    }))
    // A category with no work is not a filter, it is a dead end.
    .filter((c) => c.count > 0)
    .sort((a, b) => a.order - b.order);
}
