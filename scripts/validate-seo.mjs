#!/usr/bin/env node
/**
 * validate-seo.mjs — the built site's metadata, links and locale pairing.
 *
 * PHASE 11. `validate-routes.mjs` proves every PROJECT and static page reached the build
 * and is not a placeholder. This proves the things that are invisible in a screenshot and
 * expensive to discover after a cutover:
 *
 *   pairing        every English route has a Portuguese counterpart and vice versa
 *   hreflang       reciprocal — B is annotated as A's alternate only if B says so too
 *   x-default      present exactly where a pair exists, always pointing at Portuguese
 *   canonical      present, self-referencing, unique
 *   title/desc     present, and UNIQUE across indexable pages
 *   translation    no English page carries Portuguese chrome, and no Portuguese page
 *                  carries English chrome
 *   links          every internal href resolves to something the build emitted, or to a
 *                  declared redirect
 *   sitemap        contains every indexable page and NO page marked noindex
 *   projects       unique metadata, a VideoObject exactly where a film exists, and
 *                  editorial frames that are not silently alt-less
 *
 * Runs against dist/, and derives its expectations from src/ — so the two sides are
 * independent and agreeing is evidence rather than tautology.
 *
 * Exit code 1 on any failure. Nothing here warns: each of these is a defect.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist', 'client');
const SITE = 'https://www.nextvisionfilms.com';

const errors = [];
const ok = [];

const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

if (!exists(DIST)) {
  console.error('  FAIL  dist/client is missing — run `npm run build` first');
  process.exit(1);
}

/* ------------------------------------------------------- collect the build */

/** Every emitted document, keyed by its site path. */
const pages = new Map();
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    if (!entry.name.endsWith('.html')) continue;
    const rel = path.relative(DIST, full).replace(/\\/g, '/');
    const route = entry.name === 'index.html'
      ? `/${rel.slice(0, -'index.html'.length)}`.replace(/\/{2,}/g, '/')
      : `/${rel}`;
    pages.set(route, read(full));
  }
};
walk(DIST);

/** Internal prototypes are excluded from every check here; they are not the site. */
const isConcept = (route) => route.startsWith('/__concepts');
const routes = [...pages.keys()].filter((r) => !isConcept(r)).sort();

const tagOf = (html, re) => (html.match(re) ?? [])[1] ?? null;
const titleOf = (html) => tagOf(html, /<title>([^<]*)<\/title>/);
const descOf = (html) => tagOf(html, /<meta name="description" content="([^"]*)"/);
const canonicalOf = (html) => tagOf(html, /<link rel="canonical" href="([^"]+)"/);
const robotsOf = (html) => tagOf(html, /<meta name="robots" content="([^"]*)"/) ?? '';
const langOf = (html) => tagOf(html, /<html lang="([^"]+)"/);
const isNoindex = (html) => robotsOf(html).includes('noindex');

const alternatesOf = (html) =>
  [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)]
    .map((m) => ({ hreflang: m[1], href: m[2] }));

const pathOf = (url) => { try { return new URL(url).pathname; } catch { return null; } };

/* The two error states and the archives are not part of the indexable surface, and the
   404s are not routes at all. Named once, so every check below agrees about them. */
const IS_ERROR = (r) => r === '/404.html' || r === '/en/404.html' || r.endsWith('/offline/');
const IS_ARCHIVE = (r) => r.startsWith('/categoria-portfolio/') || r.startsWith('/en/portfolio-category/');

/* ═══════════════════════════════════════════════════ 1 · locale pairing ══ */

/**
 * The Portuguese counterpart of an English route, and vice versa.
 *
 * Derived from src/i18n/routes.ts's own table rather than restated, so a slug renamed
 * there is a slug renamed here.
 */
const routesSrc = read(path.join(ROOT, 'src/i18n/routes.ts'));
const slugPairs = [...routesSrc.matchAll(/^\s{2}(?:'([^']+)'|([\w-]+)):\s*\{\s*pt:\s*'([^']*)',\s*en:\s*'([^']*)'\s*\},/gm)]
  .map((m) => ({ id: m[1] ?? m[2], pt: m[3], en: m[4] }));

if (slugPairs.length < 8) {
  errors.push(`pairing: could not read PAGE_SLUGS from src/i18n/routes.ts (found ${slugPairs.length} entries)`);
}

/** Locales each page id is published in, read from PAGE_LOCALES. */
const localeBlock = routesSrc.slice(routesSrc.indexOf('export const PAGE_LOCALES'));
const publishedIn = new Map(
  [...localeBlock.matchAll(/^\s{2}(?:'([^']+)'|([\w-]+)):\s*\[([^\]]*)\],/gm)]
    .map((m) => [m[1] ?? m[2], m[3].split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean)]),
);

const ptOf = (route) => {
  if (!route.startsWith('/en/') && route !== '/en') return route;
  const rest = route.slice(3) || '/';
  const segments = rest.split('/').filter(Boolean);
  if (!segments.length) return '/';
  if (segments[0] === 'portfolio' && segments[1]) return `/portfolio/${segments[1]}/`;
  if (segments[0] === 'portfolio-category' && segments[1]) return `/categoria-portfolio/${segments[1]}/`;
  const pair = slugPairs.find((p) => p.en === segments[0]);
  return pair ? `/${pair.pt}/`.replace('//', '/') : null;
};

let paired = 0;
for (const route of routes) {
  if (!route.startsWith('/en/')) continue;
  if (IS_ERROR(route)) continue;
  const pt = ptOf(route);
  if (!pt) { errors.push(`pairing: ${route} has no Portuguese counterpart in PAGE_SLUGS`); continue; }
  if (!pages.has(pt)) { errors.push(`pairing: ${route} exists but its counterpart ${pt} was not emitted`); continue; }
  paired += 1;
}

/* And the other direction: a page declared as published in English must BE there. */
for (const pair of slugPairs) {
  const locales = publishedIn.get(pair.id) ?? [];
  const enRoute = `/en/${pair.en}/`.replace(/\/{2,}/g, '/');
  const built = pages.has(enRoute);
  if (locales.includes('en') && !built) {
    errors.push(`pairing: PAGE_LOCALES says "${pair.id}" is published in English, but ${enRoute} was not emitted`);
  }
  if (!locales.includes('en') && built) {
    errors.push(`pairing: ${enRoute} was emitted, but PAGE_LOCALES does not list "${pair.id}" as English`);
  }
}
if (paired) ok.push(`pairing: ${paired} English routes each have a Portuguese counterpart`);

/* ═════════════════════════════════════════════════════════ 2 · hreflang ══ */

/**
 * Reciprocity, checked as a claim rather than as a formatting rule.
 *
 * Google discards a whole hreflang cluster when an annotation is not returned, so a pair
 * that points one way is worse than no pair at all: it invalidates the ones that were
 * correct. Every alternate is therefore followed to the document it names, and that
 * document must name this one back.
 */
let reciprocal = 0;
for (const route of routes) {
  const html = pages.get(route);
  const alts = alternatesOf(html);
  if (IS_ERROR(route)) {
    if (alts.length) errors.push(`hreflang: ${route} is an error state and must not advertise alternates`);
    continue;
  }
  if (!alts.length) continue;

  const xDefault = alts.filter((a) => a.hreflang === 'x-default');
  if (xDefault.length !== 1) {
    errors.push(`hreflang: ${route} has ${xDefault.length} x-default entries, expected exactly 1`);
  } else if (pathOf(xDefault[0].href)?.startsWith('/en/')) {
    errors.push(`hreflang: ${route} points x-default at an English URL — it must be the source language`);
  }

  for (const alt of alts.filter((a) => a.hreflang !== 'x-default')) {
    const target = pathOf(alt.href);
    if (!target) { errors.push(`hreflang: ${route} has an unparseable alternate "${alt.href}"`); continue; }
    if (!alt.href.startsWith(SITE)) errors.push(`hreflang: ${route} alternate leaves the site — ${alt.href}`);
    if (!pages.has(target)) {
      errors.push(`hreflang: ${route} claims an alternate at ${target}, which was not emitted`);
      continue;
    }
    if (target === route) continue; // the self-reference
    const back = alternatesOf(pages.get(target))
      .some((b) => pathOf(b.href) === route && b.hreflang !== 'x-default');
    if (!back) errors.push(`hreflang: ${route} -> ${target} is not returned; the annotation is not reciprocal`);
    else reciprocal += 1;
  }
}
if (reciprocal) ok.push(`hreflang: ${reciprocal} alternate annotations are reciprocal, x-default always Portuguese`);

/* ═══════════════════════════════════════ 3 · canonical, title, description ══ */

const seenTitles = new Map();
const seenDescriptions = new Map();
let described = 0;

/**
 * Which pages are the SAME page in another language.
 *
 * Duplicate metadata is a defect between unrelated pages and correct between hreflang
 * alternates — that is what the annotation is for. Ten of the twenty projects publish an
 * English tagline on their Portuguese page (`sourceLocale: en`), so their description is
 * legitimately identical in both locales, and flagging it would be demanding a difference
 * that does not exist in the source.
 *
 * Built from the emitted annotations rather than from the route table, so the exemption
 * is only ever granted to a pair the site actually declares.
 */
const clusterOf = new Map();
for (const route of routes) {
  const group = alternatesOf(pages.get(route))
    .filter((a) => a.hreflang !== 'x-default')
    .map((a) => pathOf(a.href))
    .filter(Boolean)
    .sort()
    .join('|');
  clusterOf.set(route, group || route);
}

/**
 * Pages that deliberately publish no meta description, and the reason.
 *
 * The reason lives in src/lib/page-meta.ts as `noDescriptionBecause`; this is the
 * built-side half of the same declaration. A page missing a description without appearing
 * here is a defect, which is the point: silence never looks like an oversight.
 */
// Design v2 adds /bts/: the live site has no such page, so there is no published sentence
// to select a description from (src/lib/page-meta.ts records the reason, PAGE_META.bts).
const NO_DESCRIPTION = new Set(['/termos-e-condicoes/', '/bts/', '/en/bts/']);

for (const route of routes) {
  const html = pages.get(route);
  const at = route;

  const canonical = canonicalOf(html);
  if (!canonical) errors.push(`seo: ${at} has no canonical`);
  else if (!IS_ERROR(route) && pathOf(canonical) !== route) {
    errors.push(`seo: ${at} canonical is not self-referencing — ${canonical}`);
  }

  const title = titleOf(html);
  if (!title?.trim()) { errors.push(`seo: ${at} has an empty <title>`); }
  else if (!IS_ERROR(route)) {
    /**
     * Two pages may share a title only when they are the same page in two languages —
     * the same exemption a shared meta description already has, and for the same reason:
     * hreflang tells a search engine they are alternates, so it never has to choose
     * between them. The homepage is the case that needs it: since Phase 12 its title is
     * the brand alone, and a company's name is not translated.
     */
    const previous = seenTitles.get(title);
    if (previous && clusterOf.get(previous) !== clusterOf.get(route)) {
      errors.push(`seo: ${at} and ${previous} share the title "${title}" and are not alternates of each other`);
    } else if (!previous) {
      seenTitles.set(title, at);
    }
  }

  const description = descOf(html);
  if (!description?.trim()) {
    if (!NO_DESCRIPTION.has(route) && !IS_ERROR(route)) {
      errors.push(`seo: ${at} has no meta description, and is not one of the pages declared to publish none`);
    }
  } else {
    described += 1;
    if (!IS_ERROR(route) && !isNoindex(html)) {
      const previous = seenDescriptions.get(description);
      if (previous && clusterOf.get(previous) !== clusterOf.get(route)) {
        errors.push(`seo: ${at} and ${previous} share a meta description and are not alternates of each other`);
      } else if (!previous) {
        seenDescriptions.set(description, at);
      }
    }
  }

  const lang = langOf(html);
  const expected = route.startsWith('/en/') ? 'en-GB' : 'pt-PT';
  if (lang !== expected) errors.push(`seo: ${at} declares lang="${lang}", expected "${expected}"`);
}
ok.push(`seo: ${seenTitles.size} unique titles and ${seenDescriptions.size} distinct descriptions across ${routes.length} pages; a title or description shared by an hreflang pair is not a duplicate`);
ok.push(`seo: ${described} pages publish a meta description; ${NO_DESCRIPTION.size} deliberately publish none`);

/* ══════════════════════════════════════════ 4 · no half-translated pages ══ */

/**
 * Chrome that belongs to one locale must never appear in the other.
 *
 * This is what "no empty English routes" actually means once the routes exist: not that
 * the page is blank, but that it silently fell back to Portuguese. Each sentinel is a
 * string that can only come from a locale's own dictionary or its own published copy.
 *
 * The English footer's two legal links are the one deliberate exception on the whole
 * site — they are Portuguese-labelled because they lead to Portuguese documents, and they
 * say so — so those labels are not sentinels.
 */
const PT_ONLY = ['Produtora Audiovisual', 'Consultar Portfólio', 'Vamos Criar Juntos?', 'Ver projeto', 'Ver Tudo', 'Sobre Nós', 'Pular para o conteúdo'];
const EN_ONLY = ['Audiovisual Production', 'See the Portfolio', 'Shall We Create Together?', 'View project', 'View All', 'About Us', 'Skip to content'];

let clean = 0;
for (const route of routes) {
  const html = pages.get(route);
  const body = html.slice(html.indexOf('<body'));
  const head = html.slice(0, html.indexOf('<body'));
  const both = body + head;
  const english = route.startsWith('/en/');
  const leaked = (english ? PT_ONLY : EN_ONLY).filter((s) => both.includes(s));
  if (leaked.length) {
    errors.push(`i18n: ${route} is ${english ? 'English' : 'Portuguese'} but carries ${leaked.map((s) => `"${s}"`).join(', ')}`);
  } else clean += 1;
}
ok.push(`i18n: ${clean} pages carry only their own locale's chrome`);

/* ═════════════════════════════════════════════════════ 5 · internal links ══ */

const redirects = exists(path.join(ROOT, 'public/_redirects'))
  ? read(path.join(ROOT, 'public/_redirects'))
      .split('\n')
      .filter((l) => l.trim() && !l.trim().startsWith('#'))
      .map((l) => l.trim().split(/\s+/)[0])
  : [];

const SKIP = /^(https?:|mailto:|tel:|#|\/_astro\/|\/__generated\/|\/manifest\.webmanifest|\/sw\.js|\/sitemap)/;
let checked = 0;
const broken = new Set();
for (const route of routes) {
  for (const m of pages.get(route).matchAll(/href="([^"]+)"/g)) {
    const href = m[1];
    if (SKIP.test(href) || !href.startsWith('/')) continue;
    const target = href.split('#')[0].split('?')[0];
    checked += 1;
    if (pages.has(target)) continue;
    if (exists(path.join(DIST, target.replace(/^\//, '')))) continue;
    if (redirects.includes(target) || redirects.includes(target.replace(/\/$/, ''))) continue;
    broken.add(`${route} -> ${href}`);
  }
}
if (broken.size) errors.push(`links: ${broken.size} internal link(s) resolve to nothing:\n        ${[...broken].join('\n        ')}`);
else ok.push(`links: ${checked} internal links all resolve to an emitted page or a declared redirect`);

/* The one link the whole portfolio depends on, checked by name because it was broken on
   the live site for as long as the live site has existed (audit §9.6). */
if (!redirects.includes('/blog')) errors.push('links: /blog has no redirect — it is linked from all 20 project pages and 404s without one');
else ok.push('links: /blog -> /portfolio/ is declared (decision D5, still ASSUMED)');

/* ═══════════════════════════════════════════════════════════ 6 · sitemap ══ */

const sitemapFiles = fs.readdirSync(DIST).filter((f) => /^sitemap.*\.xml$/.test(f));
if (!sitemapFiles.length) errors.push('sitemap: nothing was emitted');
else {
  const locs = new Set();
  for (const file of sitemapFiles) {
    for (const m of read(path.join(DIST, file)).matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const p = pathOf(m[1]);
      if (p && !/sitemap/.test(p)) locs.add(p);
    }
  }

  const indexable = routes.filter((r) => !IS_ERROR(r) && !isNoindex(pages.get(r)));
  const missing = indexable.filter((r) => !locs.has(r));
  const surplus = [...locs].filter((r) => !pages.has(r));
  const contradictory = [...locs].filter((r) => pages.has(r) && isNoindex(pages.get(r)));

  if (missing.length) errors.push(`sitemap: ${missing.length} indexable page(s) missing: ${missing.join(', ')}`);
  if (surplus.length) errors.push(`sitemap: lists ${surplus.length} URL(s) that were not emitted: ${surplus.join(', ')}`);
  if (contradictory.length) {
    errors.push(`sitemap: lists ${contradictory.length} page(s) marked noindex — the site would be contradicting itself: ${contradictory.join(', ')}`);
  }
  if (!missing.length && !surplus.length && !contradictory.length) {
    ok.push(`sitemap: ${locs.size} URLs, exactly the indexable set (${IS_ARCHIVE('/categoria-portfolio/x/') ? '' : ''}archives and error states excluded)`);
  }
}

/* ══════════════════════════════════════════════════════════ 7 · projects ══ */

const projectRoutes = routes.filter((r) => /^\/(en\/)?portfolio\/[^/]+\/$/.test(r));
// One page per published project per locale. Counted from the content, because the
// owners add projects from the admin.
const publishedProjects = fs.readdirSync('src/content/projects')
  .filter((f) => /\.mdx?$/.test(f) && !/^draft:\s*true\s*$/m.test(fs.readFileSync(`src/content/projects/${f}`, 'utf8').split('\n---\n')[0]));
if (projectRoutes.length !== publishedProjects.length * 2) {
  errors.push(`projects: expected ${publishedProjects.length * 2} project pages (${publishedProjects.length} × 2 locales), found ${projectRoutes.length}`);
}

let withVideo = 0;
let altless = 0;
for (const route of projectRoutes) {
  const html = pages.get(route);

  if (!html.includes('property="og:image"')) errors.push(`projects: ${route} has no og:image`);
  if (!html.includes('"BreadcrumbList"')) errors.push(`projects: ${route} has no BreadcrumbList`);

  const hasFilm = html.includes('data-film-play') || html.includes('data-embed=');
  const hasVideoObject = html.includes('"VideoObject"');
  if (hasFilm && !hasVideoObject) errors.push(`projects: ${route} offers a film but emits no VideoObject`);
  if (!hasFilm && hasVideoObject) errors.push(`projects: ${route} emits a VideoObject with no film to describe`);
  if (hasVideoObject) withVideo += 1;

  /* Editorial frames sit in figures with nothing beside them, so an empty alt there is a
     hole rather than a decision (src/lib/alt.ts). The hero and the cards are the opposite
     case and are expected to be empty — they are named by the text around them. */
  for (const figure of html.matchAll(/<figure class="pj-figure">.*?<\/figure>/gs)) {
    if (/<img[^>]+alt=""/.test(figure[0])) altless += 1;
  }
}
if (altless) errors.push(`projects: ${altless} editorial frame(s) ship an empty alt with no text beside them`);
else ok.push(`projects: ${projectRoutes.length} pages, ${withVideo} with a VideoObject, every editorial frame described`);

/* ────────────────────────────────────────────────────────────────── report */

for (const o of ok) console.log(`  ok    ${o}`);
for (const e of errors) console.error(`  FAIL  ${e}`);
console.log(`\n${ok.length} ok, ${errors.length} errors`);
process.exit(errors.length ? 1 : 0);
