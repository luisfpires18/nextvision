#!/usr/bin/env node
/**
 * archive-source.mjs — Phase 0.5 source preservation.
 *
 * Captures everything the live WordPress site holds, so the project never
 * depends on nextvisionfilms.com staying online. See docs/ARCHITECTURE.md §18.
 *
 * READ-ONLY against production. Never POSTs, never mutates, never authenticates.
 *
 * Outputs
 *   source-archive/            (gitignored)  byte-faithful raw responses + media binaries
 *   docs/source-archive/       (committed)   structured JSON extracted from those responses
 *
 * Usage
 *   node scripts/archive-source.mjs            # everything
 *   node scripts/archive-source.mjs --no-media # pages + REST only
 */

import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const ORIGIN = 'https://www.nextvisionfilms.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const ROOT = path.resolve(import.meta.dirname, '..');
const RAW = path.join(ROOT, 'source-archive', 'wordpress');
const OUT = path.join(ROOT, 'docs', 'source-archive');

const SKIP_MEDIA = process.argv.includes('--no-media');
const CAPTURED_AT = new Date().toISOString();

/* ------------------------------------------------------------------ paths */

const PAGE_PATHS = [
  '/', '/sobre/', '/portfolio/', '/servicos/', '/contactos/', '/obrigado/',
  '/termos-e-condicoes/', '/politica-de-privacidade/', '/en/homepage-english/',
];

const PROJECT_SLUGS = [
  'paradox-of-affection', 'the-end', 'leonor', 'helder-praia', 'ana-reels',
  'nazaryi', 'ana-e-filipe-metro', 'danieladuarte', 'susanarafael', 'martacharles',
  'carolinapedro', 'ananuno', 'nvf-vs-antiqvvm', 'lost-lines-trailer', 'epitafio',
  'dormencia-48h', 'dont-let-it-fool-you', 'helder-museu', 'nvf-vs-filmin-details',
  'madrugada-prince-mark',
];

const CATEGORY_SLUGS = [
  'ficcao', 'moda-identidade', 'visual-storytelling', 'corporativo', 'casamentos',
];

const REST_ENDPOINTS = {
  'wp-json-root': '/wp-json/',
  'wp-types': '/wp-json/wp/v2/types',
  'wp-pages': '/wp-json/wp/v2/pages?per_page=100&context=view',
  'wp-media': '/wp-json/wp/v2/media?per_page=100&context=view',
  'wp-settings-pll': '/wp-json/pll/v1/languages',
};

const TEXT_ENDPOINTS = {
  'robots.txt': '/robots.txt',
  'sitemap_index.xml': '/sitemap_index.xml',
  'page-sitemap.xml': '/page-sitemap.xml',
  'portfolio-sitemap.xml': '/portfolio-sitemap.xml',
};

/* ---------------------------------------------------------------- helpers */

const log = (...a) => console.log(...a);
const ensure = (d) => fs.mkdir(d, { recursive: true });
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

/** Filesystem-safe local name for a URL path, preserving the original in metadata. */
function safeName(urlPath) {
  return decodeURIComponent(urlPath)
    .replace(/^\/+|\/+$/g, '')
    .replace(/[<>:"|?*\\]/g, '_')
    .replace(/\//g, '__') || 'index';
}

async function fetchWithRetry(url, { asBuffer = false, tries = 3 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 120_000);
      const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: ctrl.signal });
      clearTimeout(timer);
      const body = asBuffer ? Buffer.from(await res.arrayBuffer()) : await res.text();
      return {
        ok: res.ok, status: res.status, finalUrl: res.url, body,
        headers: Object.fromEntries(res.headers.entries()),
      };
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  return { ok: false, status: 0, error: String(lastErr?.message ?? lastErr), finalUrl: url };
}

/* ------------------------------------------- HTML extraction (regex-based)
   Deliberately dependency-free: this script must keep working years from now
   with no node_modules present. It extracts the metadata we actually need;
   the byte-faithful HTML is kept in source-archive/ as the ultimate fallback. */

const decodeEntities = (s) => (s ?? '')
  .replace(/&#0?38;|&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&hellip;/g, '…')
  .replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d));

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return m ? decodeEntities(m[1]) : null;
};

function extractHtml(html, url) {
  const rec = { url, capturedAt: CAPTURED_AT };

  rec.title = decodeEntities((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [, ''])[1]).trim() || null;
  rec.lang = attr((html.match(/<html[^>]*>/i) || [''])[0], 'lang');

  // <meta>
  rec.meta = {};
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const key = attr(tag, 'name') || attr(tag, 'property');
    const val = attr(tag, 'content');
    if (key && val !== null && !(key in rec.meta)) rec.meta[key] = val;
  }

  // <link rel>
  rec.links = { canonical: null, alternate: [], icons: [] };
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const rel = (attr(tag, 'rel') || '').toLowerCase();
    const href = attr(tag, 'href');
    if (!href) continue;
    if (rel === 'canonical') rec.links.canonical = href;
    else if (rel === 'alternate') rec.links.alternate.push({ hreflang: attr(tag, 'hreflang'), type: attr(tag, 'type'), title: attr(tag, 'title'), href });
    else if (rel.includes('icon')) rec.links.icons.push({ rel, sizes: attr(tag, 'sizes'), href });
  }

  // JSON-LD
  rec.jsonLd = [];
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { rec.jsonLd.push(JSON.parse(m[1])); } catch { rec.jsonLd.push({ _unparsed: m[1].slice(0, 4000) }); }
  }

  // headings
  rec.headings = [];
  for (const m of html.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const text = decodeEntities(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    if (text) rec.headings.push({ level: m[1].toLowerCase(), text });
  }

  // anchors
  const seen = new Set();
  rec.anchors = [];
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = attr(`<a ${m[1]}>`, 'href');
    if (!href) continue;
    const text = decodeEntities(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    const key = `${href}|${text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rec.anchors.push({ href, text, ariaLabel: attr(`<a ${m[1]}>`, 'aria-label') });
  }

  // images
  rec.images = [];
  for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
    const src = attr(tag, 'src');
    if (!src) continue;
    rec.images.push({ src, alt: attr(tag, 'alt'), width: attr(tag, 'width'), height: attr(tag, 'height'), loading: attr(tag, 'loading') });
  }

  // iframes (YouTube etc.)
  rec.iframes = (html.match(/<iframe\b[^>]*>/gi) || [])
    .map((t) => ({ src: attr(t, 'src'), title: attr(t, 'title') }))
    .filter((x) => x.src);

  // Elementor widget settings — where video ids, background videos and form config live
  rec.elementorSettings = [];
  for (const m of html.matchAll(/data-settings=["']([^"']+)["']/gi)) {
    const raw = decodeEntities(m[1]);
    try {
      const parsed = JSON.parse(raw);
      if (/video|background|youtube|sticky|autoplay|pagination|template_id/i.test(raw)) rec.elementorSettings.push(parsed);
    } catch { /* ignore non-JSON */ }
  }
  rec.elementorWidgets = [...new Set((html.match(/data-widget_type=["']([^"']+)["']/gi) || [])
    .map((t) => attr(t.replace(/^/, '<x '), 'data-widget_type')).filter(Boolean))].sort();

  // forms
  rec.forms = [];
  for (const m of html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)) {
    const open = `<form ${m[1]}>`, inner = m[2];
    rec.forms.push({
      name: attr(open, 'name'), id: attr(open, 'id'), class: attr(open, 'class'),
      action: attr(open, 'action'), method: attr(open, 'method'),
      fields: (inner.match(/<(input|textarea|select|button)\b[^>]*>/gi) || []).map((t) => ({
        tag: t.match(/<(\w+)/)[1].toLowerCase(), type: attr(t, 'type'), name: attr(t, 'name'),
        placeholder: attr(t, 'placeholder'), required: /\brequired\b/i.test(t), value: attr(t, 'value'),
      })),
      labels: [...inner.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/gi)]
        .map((l) => decodeEntities(l[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()).filter(Boolean),
    });
  }

  // body classes (template identification)
  rec.bodyClasses = (attr((html.match(/<body[^>]*>/i) || [''])[0], 'class') || '').split(/\s+/).filter(Boolean);

  // visible text of <main>, falling back to <body>
  const scope = (html.match(/<main\b[\s\S]*?<\/main>/i) || html.match(/<body\b[\s\S]*?<\/body>/i) || [''])[0];
  rec.text = decodeEntities(
    scope.replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, '\n')
  ).split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n');

  return rec;
}

/* -------------------------------------------------------------------- run */

async function archivePages() {
  await ensure(path.join(RAW, 'html'));
  const urls = [
    ...PAGE_PATHS,
    ...PROJECT_SLUGS.map((s) => `/portfolio/${s}/`),
    ...CATEGORY_SLUGS.map((s) => `/categoria-portfolio/${s}/`),
  ];
  const pages = [];
  for (const p of urls) {
    const url = ORIGIN + p;
    const res = await fetchWithRetry(url);
    if (!res.ok) { log(`  !! ${res.status} ${p}`); pages.push({ url, path: p, status: res.status, error: res.error ?? null }); continue; }
    const file = `${safeName(p)}.html`;
    await fs.writeFile(path.join(RAW, 'html', file), res.body, 'utf8');
    const rec = extractHtml(res.body, url);
    rec.path = p;
    rec.status = res.status;
    rec.rawFile = `source-archive/wordpress/html/${file}`;
    rec.rawBytes = Buffer.byteLength(res.body);
    rec.rawSha256 = sha256(Buffer.from(res.body));
    pages.push(rec);
    log(`  ok ${String(res.status)} ${p} (${Math.round(rec.rawBytes / 1024)} KB)`);
  }
  return pages;
}

async function archiveEndpoints() {
  await ensure(path.join(RAW, 'rest'));
  const out = {};
  for (const [name, p] of Object.entries({ ...REST_ENDPOINTS, ...TEXT_ENDPOINTS })) {
    const res = await fetchWithRetry(ORIGIN + p);
    if (!res.ok) { log(`  !! ${res.status} ${p}`); out[name] = { path: p, status: res.status, error: res.error ?? null }; continue; }
    const isJson = /json/.test(res.headers['content-type'] ?? '') || p.includes('wp-json');
    const ext = isJson ? 'json' : (p.endsWith('.xml') ? 'xml' : 'txt');
    await fs.writeFile(path.join(RAW, 'rest', `${name.replace(/\.(txt|xml)$/, '')}.${ext}`), res.body, 'utf8');
    out[name] = {
      path: p, status: res.status, bytes: Buffer.byteLength(res.body),
      sha256: sha256(Buffer.from(res.body)),
      file: `source-archive/wordpress/rest/${name.replace(/\.(txt|xml)$/, '')}.${ext}`,
      xWpTotal: res.headers['x-wp-total'] ?? null,
    };
    log(`  ok ${res.status} ${p} (${Math.round(Buffer.byteLength(res.body) / 1024)} KB)`);
  }
  return out;
}

const DERIVATIVE_RE = /-(\d{2,4})x(\d{2,4})\.(png|jpe?g|gif|webp)$/i;

async function archiveMedia() {
  const inv = JSON.parse(await fs.readFile(path.join(ROOT, 'docs/content/media_inventory.json'), 'utf8'));
  const originals = inv.filter((x) => !DERIVATIVE_RE.test(x.url));
  const skipped = inv.filter((x) => DERIVATIVE_RE.test(x.url));
  log(`  ${originals.length} originals to fetch; skipping ${skipped.length} WordPress-generated derivatives`);

  const entries = [];
  for (const item of originals) {
    const url = item.url;
    const rel = decodeURIComponent(new URL(url).pathname.replace(/^\/wp-content\/uploads\//, ''));
    const dest = path.join(RAW, 'media', ...rel.split('/').map((s) => s.replace(/[<>:"|?*\\]/g, '_')));
    await ensure(path.dirname(dest));

    let stat = null;
    try { stat = await fs.stat(dest); } catch { /* not yet downloaded */ }

    if (stat && stat.size > 0) {
      const buf = await fs.readFile(dest);
      entries.push(mediaEntry(item, url, rel, dest, buf.length, sha256(buf), null, true));
      log(`  -- cached ${rel}`);
      continue;
    }

    const res = await fetchWithRetry(url, { asBuffer: true });
    if (!res.ok) { log(`  !! ${res.status} ${rel}`); entries.push({ url, localPath: null, status: res.status, error: res.error ?? 'fetch failed' }); continue; }
    await fs.writeFile(dest, res.body);
    entries.push(mediaEntry(item, url, rel, dest, res.body.length, sha256(res.body), res.headers['content-type'] ?? null, false));
    log(`  ok ${rel} (${(res.body.length / 1048576).toFixed(2)} MB)`);
  }

  for (const item of skipped) {
    entries.push({
      url: item.url, localPath: null, skipped: true,
      reason: 'WordPress-generated derivative; the original upload is archived instead',
      derivedFrom: item.url.replace(DERIVATIVE_RE, '.$3'),
    });
  }
  return entries;
}

function mediaEntry(item, url, rel, dest, bytes, hash, contentType, cached) {
  const filename = path.basename(rel);
  const ext = path.extname(filename).slice(1).toLowerCase();
  return {
    url,
    originalFilename: filename,
    localPath: path.relative(ROOT, dest).split(path.sep).join('/'),
    bytes,
    sizeMB: +(bytes / 1048576).toFixed(3),
    contentType: contentType ?? guessType(ext),
    ext,
    sha256: hash,
    referencedOnPages: item.pages ?? null,
    isOriginal: true,
    cached,
  };
}

const guessType = (ext) => ({
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  svg: 'image/svg+xml', mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
  ttf: 'font/ttf', woff: 'font/woff', woff2: 'font/woff2', ico: 'image/x-icon',
}[ext] ?? 'application/octet-stream');

/* -------------------------------------------------------------------- main */

async function main() {
  log(`\nArchiving ${ORIGIN}  —  ${CAPTURED_AT}\n`);
  await ensure(RAW);
  await ensure(OUT);

  log('1/3  Pages');
  const pages = await archivePages();
  await fs.writeFile(path.join(OUT, 'pages.json'), JSON.stringify({ capturedAt: CAPTURED_AT, origin: ORIGIN, count: pages.length, pages }, null, 1));

  log('\n2/3  REST, sitemaps, robots');
  const endpoints = await archiveEndpoints();
  await fs.writeFile(path.join(OUT, 'endpoints.json'), JSON.stringify({ capturedAt: CAPTURED_AT, endpoints }, null, 1));

  let media = [];
  if (SKIP_MEDIA) {
    log('\n3/3  Media — SKIPPED (--no-media)');
  } else {
    log('\n3/3  Media binaries');
    media = await archiveMedia();
    await fs.writeFile(path.join(OUT, 'media-archive.json'), JSON.stringify({
      capturedAt: CAPTURED_AT,
      note: 'Binaries live in source-archive/wordpress/media/ (gitignored). This manifest is the committed record.',
      downloaded: media.filter((m) => m.localPath).length,
      skippedDerivatives: media.filter((m) => m.skipped).length,
      failed: media.filter((m) => m.error).length,
      totalBytes: media.reduce((s, m) => s + (m.bytes ?? 0), 0),
      items: media,
    }, null, 1));
  }

  const summary = {
    capturedAt: CAPTURED_AT,
    origin: ORIGIN,
    pages: { requested: pages.length, ok: pages.filter((p) => p.status === 200).length, failed: pages.filter((p) => p.status !== 200).length },
    endpoints: Object.fromEntries(Object.entries(endpoints).map(([k, v]) => [k, v.status])),
    media: SKIP_MEDIA ? 'skipped' : {
      downloaded: media.filter((m) => m.localPath).length,
      skippedDerivatives: media.filter((m) => m.skipped).length,
      failed: media.filter((m) => m.error).length,
      totalMB: +(media.reduce((s, m) => s + (m.bytes ?? 0), 0) / 1048576).toFixed(1),
    },
  };
  await fs.writeFile(path.join(OUT, 'archive-summary.json'), JSON.stringify(summary, null, 1));

  log('\n--- summary ---');
  log(JSON.stringify(summary, null, 1));
}

main().catch((e) => { console.error(e); process.exit(1); });
