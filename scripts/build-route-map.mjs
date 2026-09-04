#!/usr/bin/env node
/**
 * build-route-map.mjs
 *
 * Produces the machine-readable route migration map used for
 *   - generating redirects at build time,
 *   - the pre-cutover route parity check (scripts/verify-routes.mjs),
 *   - documenting what happens to every URL the old site served.
 *
 * The uploads → future-R2 mapping is derived from the preservation archive,
 * so it stays correct as media moves. Everything else is a curated migration
 * decision recorded in one place.
 *
 * Emits: src/data/routes.json
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

const PROJECT_SLUGS = [
  'paradox-of-affection', 'the-end', 'leonor', 'helder-praia', 'ana-reels',
  'nazaryi', 'ana-e-filipe-metro', 'danieladuarte', 'susanarafael', 'martacharles',
  'carolinapedro', 'ananuno', 'nvf-vs-antiqvvm', 'lost-lines-trailer', 'epitafio',
  'dormencia-48h', 'dont-let-it-fool-you', 'helder-museu', 'nvf-vs-filmin-details',
  'madrugada-prince-mark',
];

/** Legacy taxonomy terms. Names are NOT final (decision R5); slugs must keep resolving. */
const LEGACY_CATEGORIES = [
  { slug: 'ficcao', legacyName: 'Ficção', termId: 44, itemCount: 5 },
  { slug: 'moda-identidade', legacyName: 'Moda & Identidade', termId: 26, itemCount: 1 },
  { slug: 'visual-storytelling', legacyName: 'Visual Storytelling', termId: 11, itemCount: 8 },
  { slug: 'corporativo', legacyName: 'Corporativo', termId: 28, itemCount: 1 },
  { slug: 'casamentos', legacyName: 'Casamentos', termId: 45, itemCount: 5 },
];

/** PT page slug → EN page slug. Project slugs are deliberately identical across locales. */
const PAGE_SLUG_MAP = [
  { pt: '/', en: '/en/', id: 'home' },
  { pt: '/sobre/', en: '/en/about/', id: 'about' },
  { pt: '/portfolio/', en: '/en/portfolio/', id: 'portfolio' },
  { pt: '/servicos/', en: '/en/services/', id: 'services' },
  { pt: '/contactos/', en: '/en/contact/', id: 'contact' },
  { pt: '/obrigado/', en: '/en/thank-you/', id: 'thank-you' },
  { pt: '/termos-e-condicoes/', en: '/en/terms-and-conditions/', id: 'terms' },
  { pt: '/politica-de-privacidade/', en: '/en/privacy-policy/', id: 'privacy' },
];

async function main() {
  let mediaArchive = null;
  try {
    mediaArchive = JSON.parse(await fs.readFile(path.join(ROOT, 'docs/source-archive/media-archive.json'), 'utf8'));
  } catch {
    console.warn('  !! media-archive.json missing — run scripts/archive-source.mjs first. Uploads mapping will be empty.');
  }

  // /wp-content/uploads/... → future R2 key. Derived, never hand-maintained.
  const uploads = [];
  for (const item of mediaArchive?.items ?? []) {
    const from = new URL(item.url).pathname;
    uploads.push({
      from,
      archivedAt: item.localPath ?? null,
      sha256: item.sha256 ?? null,
      futureR2Key: item.localPath ? `archive/wordpress/${item.localPath.replace(/^source-archive\/wordpress\/media\//, '')}` : null,
      status: item.skipped ? 'derivative-not-archived' : (item.localPath ? 'archived' : 'failed'),
      note: item.skipped ? 'WordPress-generated size variant; redirect to the archived original instead' : null,
      derivedFrom: item.derivedFrom ? new URL(item.derivedFrom).pathname : null,
    });
  }

  const preserve = [
    ...PAGE_SLUG_MAP.filter((p) => p.pt !== '/en/').map((p) => ({
      path: p.pt, kind: 'page', id: p.id, locale: 'pt',
      note: p.id === 'portfolio' ? 'Served by the portfolio CPT archive on WordPress, NOT page id 36 (audit §1.1)' : null,
    })),
    ...PROJECT_SLUGS.map((s) => ({ path: `/portfolio/${s}/`, kind: 'project', id: s, locale: 'pt', note: null })),
    ...LEGACY_CATEGORIES.map((c) => ({
      path: `/categoria-portfolio/${c.slug}/`, kind: 'category', id: c.slug, locale: 'pt',
      note: 'No canonical and no <h1> on the live site (audit §9.18); in neither sitemap',
    })),
  ];

  const redirects = [
    { from: '/blog', to: '/portfolio/', status: 301, reason: 'Broken "Ver Tudo" link on all 20 project pages (audit §9.6). Target assumed — decision D5', confidence: 'assumed' },
    { from: '/en/homepage-english/', to: '/en/', status: 301, reason: 'Empty Polylang stub (audit §9.1). Redirect to the real EN home once EN content exists; until then /en/ itself redirects to /', confidence: 'decided' },
    { from: '/sitemap_index.xml', to: '/sitemap-index.xml', status: 301, reason: 'Yoast sitemap path; keep Search Console working', confidence: 'decided' },
    { from: '/page-sitemap.xml', to: '/sitemap-index.xml', status: 301, reason: 'Yoast child sitemap', confidence: 'decided' },
    { from: '/portfolio-sitemap.xml', to: '/sitemap-index.xml', status: 301, reason: 'Yoast child sitemap', confidence: 'decided' },
    { from: '/wp-sitemap.xml', to: '/sitemap-index.xml', status: 301, reason: 'WordPress core sitemap, exposed alongside Yoast', confidence: 'decided' },
  ];

  const gone = [
    { pattern: '/wp-json/*', status: 410, reason: 'WordPress REST API — archived, never returning' },
    { pattern: '/wp-admin/*', status: 410, reason: 'WordPress admin' },
    { pattern: '/wp-includes/*', status: 410, reason: 'WordPress core assets' },
    { pattern: '/xmlrpc.php', status: 410, reason: 'Already blocked on the live host' },
    { pattern: '/feed/', status: 410, reason: 'RSS feed with no posts' },
    { pattern: '/comments/feed/', status: 410, reason: 'Comments feed with no comments' },
  ];

  const problems = [
    { path: '/portfolio/', issue: 'Yoast lists page id 36 in page-sitemap.xml, but this URL serves the portfolio CPT archive. Page 36 is unreachable', audit: '§1.1' },
    { path: '/portfolio/dont-let-it-fool-you/', issue: 'Video source is a studio.youtube.com edit URL for video e6aK4vEn420, which is already published at /portfolio/ana-e-filipe-metro/. Duplicate entry or missing video', audit: '§9.7', decision: 'D6' },
    { path: '/politica-de-privacidade/', issue: "The in-page 'Navegação' anchors resolve to digiup.me, not to this page", audit: '§9.4', decision: 'D4' },
    { path: '/contactos/', issue: 'Displayed email (nextvisionfilmsagency@gmail.com) differs from the mailto: target (hello@nextvisionfilms.com)', audit: '§9.5', decision: 'D2' },
    { path: '/politica-de-privacidade', issue: 'Linked without a trailing slash from the newsletter consent label; the footer uses the trailing-slash form', audit: '§1.6' },
  ];

  const payload = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/build-route-map.mjs',
    origin: 'https://www.nextvisionfilms.com',
    conventions: {
      trailingSlash: 'always',
      defaultLocale: 'pt',
      localePrefix: { pt: '', en: '/en' },
      projectSlugsAreLocaleInvariant: true,
      pageSlugsAreLocalised: true,
    },
    counts: {
      preserve: preserve.length,
      redirects: redirects.length,
      gonePatterns: gone.length,
      uploadsMapped: uploads.filter((u) => u.status === 'archived').length,
      uploadsDerivative: uploads.filter((u) => u.status === 'derivative-not-archived').length,
      knownProblems: problems.length,
    },
    preserve,
    pageSlugMap: PAGE_SLUG_MAP,
    legacyCategories: LEGACY_CATEGORIES,
    previousProjectSlugs: {
      _note: 'slug → previous slugs. Empty today: no project has been renamed. Populated automatically when a content entry declares previousSlugs.',
    },
    redirects,
    gone,
    uploads,
    problems,
  };

  await fs.mkdir(path.join(ROOT, 'src/data'), { recursive: true });
  await fs.writeFile(path.join(ROOT, 'src/data/routes.json'), JSON.stringify(payload, null, 1));
  console.log(JSON.stringify(payload.counts, null, 1));
}

main().catch((e) => { console.error(e); process.exit(1); });
