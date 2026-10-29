#!/usr/bin/env node
/**
 * validate-media.mjs — the media build gate.
 *
 * Every rule here exists because breaking it would ship something the project has spent
 * eleven phases refusing to ship: an upscaled frame pretending to be a master, an image
 * with no intrinsic size (and therefore layout shift), a URL typed into a component
 * instead of resolved through the manifest, or a page referencing bytes that are not
 * there.
 *
 * Run by `npm run verify`. Exits non-zero on the first class of failure it finds.
 *
 * Usage: npm run media:verify
 */

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { ROOT } from './media/recipe.mjs';
import { MIRROR, MANIFEST_FILE, listMirror, readJson, human } from './media/lib.mjs';

const problems = [];
const fail = (rule, detail) => problems.push(`${rule}: ${detail}`);
const log = (...a) => console.log(...a);

const RENDITION_LEAF = /^(\d+)\.([0-9a-f]{8})\.(webp|avif|mp4|webm)$/;
const ABSOLUTE = /^(https?:)?\/\//i;

/** Media hosts and generated paths that must never appear in a component. */
const FORBIDDEN_IN_SOURCE = [
  /media\.nextvisionfilms\.com/,
  /[a-z0-9]+\.r2\.cloudflarestorage\.com/,
  /[a-z0-9-]+\.r2\.dev/,
  /['"`]\/__media\//,
];

/**
 * The two places `/__generated/` legitimately survives Phase 12.
 *
 * Fonts are site assets, not delivered media — they are precached by the service worker
 * and referenced from CSS. The `/__concepts/*` routes are internal Review A prototypes,
 * noindex and excluded from the sitemap; they have their own disposable media builder and
 * are deliberately not part of the production pipeline.
 */
const GENERATED_ALLOWED = [
  'src/styles/fonts.css',        // @font-face sources
  'src/layouts/BaseLayout.astro', // the two preloaded faces
  'src/pwa/service-worker.js',   // precaches those faces, and only those
  'src/lib/concept-data.ts',     // /__concepts/* prototypes, noindex and disposable
];

async function walk(dir, filter) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(full, filter));
    else if (filter(full)) out.push(full);
  }
  return out;
}

/* ═══════════════════════════════════════════════════════ A–E · the manifest ══ */

function checkManifest(manifest) {
  const seen = new Map();
  const REQUIRED = ['key', 'kind', 'storage', 'contentType', 'width', 'height', 'aspectRatio', 'renditions', 'provenance', 'sourceQuality', 'altStatus'];

  for (const [key, item] of Object.entries(manifest.items)) {
    for (const field of REQUIRED) {
      if (item[field] === undefined) fail('shape', `${key} has no \`${field}\``);
    }
    if (item.key !== key) fail('shape', `${key} declares key \`${item.key}\``);
    if (!(item.width > 0 && item.height > 0)) {
      // Without intrinsic size an <img> has no aspect ratio and the page shifts on load.
      fail('dimensions', `${key} has no usable width/height — CLS would be non-zero`);
    }
    const ar = +(item.width / item.height).toFixed(4);
    if (Math.abs(ar - item.aspectRatio) > 0.01) {
      fail('aspect-ratio', `${key} declares ${item.aspectRatio} but its widest rendition is ${ar}`);
    }

    if (!item.renditions?.length) { fail('renditions', `${key} has none`); continue; }

    /**
     * The upscale rule. The ceiling is the crop's width where the recipe crops, and the
     * source's natural width otherwise; a derivative wider than that would be invented
     * detail, which is the one thing a portfolio of real footage must never publish.
     */
    const crop = item.recipe?.crop;
    const ceiling = crop ? Number(String(crop).split(':')[0]) : item.source?.naturalWidth;

    for (const r of item.renditions) {
      const leaf = r.path.slice(r.path.lastIndexOf('/') + 1);
      const dir = r.path.slice(0, r.path.lastIndexOf('/'));
      const m = RENDITION_LEAF.exec(leaf);
      if (!m) { fail('naming', `${r.path} is not <width>.<hash8>.<ext>`); continue; }
      if (dir !== key) fail('naming', `${r.path} does not sit under its key \`${key}\``);
      if (!r.sha256?.startsWith(m[2])) fail('naming', `${r.path} does not carry its own hash`);
      if (Number(m[1]) !== r.width) fail('naming', `${r.path} claims ${m[1]}px and is ${r.width}px`);
      if (m[3] !== r.format) fail('naming', `${r.path} claims .${m[3]} and declares ${r.format}`);
      if (!(r.width > 0 && r.height > 0 && r.bytes > 0)) fail('renditions', `${r.path} is empty or unmeasured`);
      if (ABSOLUTE.test(r.path)) fail('urls', `${r.path} is a URL; the manifest holds object keys only`);

      if (ceiling && r.width > ceiling) {
        fail('upscale', `${r.path} is ${r.width}px from a ${ceiling}px source`);
      }

      const prior = seen.get(r.path);
      if (prior && prior !== key) fail('collision', `${r.path} is claimed by both ${prior} and ${key}`);
      seen.set(r.path, key);
    }

    const formats = new Set(item.renditions.map((r) => r.format));
    if (item.kind === 'image' && !formats.has('webp')) {
      // WebP is the baseline every supported browser decodes; AVIF is the bonus on top.
      fail('formats', `${key} has no WebP fallback`);
    }
    if (item.kind === 'video' && !formats.has('mp4')) fail('formats', `${key} has no MP4`);
    if (item.kind === 'video' && !item.poster) fail('poster', `${key} has no poster — a video may not render as a black box`);
  }
  return seen;
}

/* ══════════════════════════════════════════════ F · every referenced key exists ══ */

async function checkContentKeys(manifest) {
  const files = await walk(path.join(ROOT, 'src', 'content'), (f) => /\.(mdx?|ya?ml|json)$/.test(f));
  const referenced = new Set();
  for (const file of files) {
    const text = await fs.readFile(file, 'utf8');
    for (const m of text.matchAll(/^\s*(?:-\s*)?(?:key|heroVideo|previewVideo):\s*["']?((?:projects|pages|team|brand)\/[a-z0-9/-]+)["']?\s*$/gim)) {
      referenced.add(m[1]);
    }
  }
  for (const key of referenced) {
    if (!manifest.items[key]) fail('missing', `content references \`${key}\`, which the manifest does not hold`);
  }
  return referenced;
}

/* ═════════════════════════════════════════ G · the mirror actually holds them ══ */

async function checkMirror(manifest) {
  const present = new Set(await listMirror());
  let missing = 0;
  for (const item of Object.values(manifest.items)) {
    for (const r of item.renditions ?? []) {
      if (!present.has(r.path)) { missing += 1; if (missing <= 5) fail('mirror', `${r.path} is not in media/dist/`); }
    }
  }
  if (missing > 5) fail('mirror', `…and ${missing - 5} more. Run \`npm run media:build\`.`);
  return present;
}

/* ══════════════════════════════ H · no component may contain a media URL ══ */

async function checkSources() {
  const files = await walk(path.join(ROOT, 'src'), (f) => /\.(astro|ts|js|css)$/.test(f));
  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    if (rel === 'src/config/site.ts' || rel === 'src/lib/media.ts') continue;
    const text = await fs.readFile(file, 'utf8');

    for (const pattern of FORBIDDEN_IN_SOURCE) {
      if (pattern.test(text)) fail('hardcoded', `${rel} contains a media host or path — resolve it through the manifest`);
    }
    if (text.includes('/__generated/') && !GENERATED_ALLOWED.includes(rel)) {
      fail('hardcoded', `${rel} references /__generated/, which no longer delivers site media`);
    }
  }
}

/* ═══════════════════════ I · the built pages reference bytes that exist ══ */

async function checkBuild(manifest) {
  const dist = path.join(ROOT, 'dist');
  if (!existsSync(dist)) { log('  (no dist/ — skipping the built-page scan)'); return 0; }

  const known = new Set();
  for (const item of Object.values(manifest.items)) for (const r of item.renditions ?? []) known.add(r.path);

  const pages = await walk(dist, (f) => f.endsWith('.html'));
  const seen = new Set();
  for (const file of pages) {
    const text = await fs.readFile(file, 'utf8');
    for (const m of text.matchAll(/\/__media\/([A-Za-z0-9/_-]+\.[0-9a-f]{8}\.(?:webp|avif|mp4|webm))/g)) {
      seen.add(m[1]);
      if (!known.has(m[1])) {
        fail('broken', `${path.relative(dist, file)} references ${m[1]}, which the manifest does not hold`);
      }
    }
    if (/\/__generated\/(?!fonts\/)/.test(text) && !file.includes('__concepts')) {
      fail('hardcoded', `${path.relative(dist, file)} still serves media from /__generated/`);
    }
  }
  return seen.size;
}

/* ═════════════════════ J · content-addressed delivery is cached as immutable ══ */

/**
 * A `/__media/` name changes whenever its bytes do (rule 12), so the edge may keep it for a
 * year. Without the rule Cloudflare serves `max-age=0, must-revalidate` and every repeat
 * view revalidates every image. Read from the BUILT file — the adapter merges its own
 * `/_astro/*` block into ours, and this is the file that is actually uploaded.
 */
async function checkHeaders() {
  const file = path.join(ROOT, 'dist', 'client', '_headers');
  if (!existsSync(file)) { log('  (no dist/client/_headers — skipping the header check)'); return; }
  const text = await fs.readFile(file, 'utf8');
  const block = text.split(/\n(?=\S)/).find((b) => b.split('\n')[0].trim() === '/__media/*');
  if (!block || !/^\s+Cache-Control:.*\bimmutable\b/im.test(block)) {
    fail('headers', 'dist/client/_headers has no immutable Cache-Control rule for /__media/*');
  }
}

/* ════════════════════════════════════════════════════════════════════ main ══ */

async function main() {
  const manifest = await readJson(MANIFEST_FILE, null);
  if (!manifest?.items || !Object.keys(manifest.items).length) {
    console.error('media-manifest.json is missing or empty. Run `npm run media:build`.');
    process.exit(1);
  }

  log('\nMedia validation\n');
  const paths = checkManifest(manifest);
  const referenced = await checkContentKeys(manifest);
  const present = await checkMirror(manifest);
  await checkSources();
  const inBuild = await checkBuild(manifest);
  await checkHeaders();

  const bytes = Object.values(manifest.items).reduce((n, i) => n + (i.bytes ?? 0), 0);
  log(`  assets              ${Object.keys(manifest.items).length}`);
  log(`  renditions          ${paths.size}   (${human(bytes)} delivered)`);
  log(`  keys used by content ${referenced.size}`);
  log(`  files in the mirror ${present.size}`);
  log(`  referenced by built pages ${inBuild}`);

  const orphans = [...paths.keys()].filter((p) => !present.has(p)).length;
  if (orphans === 0) log('  mirror complete     yes');

  if (problems.length) {
    log(`\n${problems.length} problem(s):\n`);
    for (const p of problems.slice(0, 40)) log(`  ✗ ${p}`);
    if (problems.length > 40) log(`  … and ${problems.length - 40} more`);
    log('');
    process.exit(1);
  }
  log('\nOK — no upscales, no missing entries, no hardcoded media URLs.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
