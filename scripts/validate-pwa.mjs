/**
 * PWA validator — PHASE 15.
 *
 * The manifest and the service worker are the two files nobody looks at again, and both
 * fail SILENTLY: an icon that 404s shows as a blank square on someone's home screen, and a
 * precache list that quietly starts matching video fills a phone. Neither shows up in a
 * build log. So both are asserted here, against the BUILT output rather than the source.
 *
 * What it will NOT do is chase a Lighthouse score. Nothing here rewards caching more; the
 * budget checks push the other way, which is the point.
 *
 * Run after `build` — `dist/client/` must exist.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = path.join(ROOT, 'dist/client');

const failures = [];
const notes = [];
const fail = (msg) => failures.push(msg);
const ok = (msg) => notes.push(msg);

/** The 20 MB device-storage ceiling from ARCHITECTURE §17. */
const STORAGE_BUDGET = 20 * 1024 * 1024;

const VIDEO = /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i;

const read = async (p) => fs.readFile(p, 'utf8');

/**
 * Block and line comments removed, so a check counts what the worker DOES.
 *
 * Crude on purpose — it is not a parser, and it does not need to be: the only strings in
 * sw.js that could contain `/*` are cache names and URLs, and neither does.
 */
const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const exists = async (p) => { try { await fs.access(p); return true; } catch { return false; } };

/* ─────────────────────────────────────────────────── the palette, from source */

/**
 * `--brand-ink` and `--brand-cream` as the stylesheet declares them.
 *
 * The manifest colours are checked against THESE rather than against literals, so the
 * install identity cannot drift away from the site's own palette when Review A revises it.
 */
async function tokens() {
  const css = await read(path.join(ROOT, 'src/styles/tokens.colour.css'));
  const pick = (name) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`))?.[1]?.toLowerCase() ?? null;
  return { ink: pick('brand-ink'), cream: pick('brand-cream') };
}

/* ────────────────────────────────────────────────────────────────── manifest */

async function checkManifest(palette) {
  const file = path.join(DIST, 'manifest.webmanifest');
  if (!await exists(file)) { fail('manifest.webmanifest is not in the build'); return null; }

  let manifest;
  try {
    manifest = JSON.parse(await read(file));
  } catch (error) {
    fail(`manifest.webmanifest does not parse: ${error.message}`);
    return null;
  }
  ok('manifest parses');

  // Installability. A browser needs all of these before it will offer to install.
  for (const field of ['name', 'short_name', 'start_url', 'scope', 'display', 'icons']) {
    if (manifest[field] === undefined) fail(`manifest is missing "${field}"`);
  }
  if (!['standalone', 'fullscreen', 'minimal-ui'].includes(manifest.display)) {
    fail(`manifest display "${manifest.display}" is not an installable value`);
  }
  if (manifest.start_url !== '/' || manifest.scope !== '/') {
    fail(`manifest start_url/scope must both be "/" — got "${manifest.start_url}" / "${manifest.scope}"`);
  }

  // Colours belong to the palette, not to this file.
  if (palette.ink && manifest.theme_color?.toLowerCase() !== palette.ink) {
    fail(`manifest theme_color ${manifest.theme_color} is not --brand-ink ${palette.ink}`);
  }
  if (palette.cream && manifest.background_color?.toLowerCase() !== palette.cream) {
    fail(`manifest background_color ${manifest.background_color} is not --brand-cream ${palette.cream}`);
  }

  // Shortcuts must point somewhere real, or they are dead entries in a launcher menu.
  for (const shortcut of manifest.shortcuts ?? []) {
    if (!await exists(path.join(DIST, shortcut.url.replace(/^\//, ''), 'index.html'))) {
      fail(`manifest shortcut "${shortcut.name}" points at ${shortcut.url}, which is not built`);
    }
  }

  return manifest;
}

/* ───────────────────────────────────────────────────────────────────── icons */

async function checkIcons(manifest) {
  const icons = manifest.icons ?? [];
  if (icons.length === 0) { fail('manifest declares no icons — the site is not installable'); return; }

  let hasAny192 = false;
  let hasAny512 = false;
  let hasMaskable = false;

  for (const icon of icons) {
    const file = path.join(DIST, icon.src.replace(/^\//, ''));
    if (!await exists(file)) { fail(`manifest icon ${icon.src} is not in the build`); continue; }

    const meta = await sharp(file).metadata();

    // Declared size vs ACTUAL pixels. A mismatch is how an icon ends up stretched.
    const [w, h] = icon.sizes.split('x').map(Number);
    if (meta.width !== w || meta.height !== h) {
      fail(`icon ${icon.src} declares ${icon.sizes} but is ${meta.width}x${meta.height}`);
    }
    if (meta.width !== meta.height) fail(`icon ${icon.src} is not square (${meta.width}x${meta.height})`);

    // Declared MIME vs actual format.
    const actual = meta.format === 'png' ? 'image/png' : `image/${meta.format}`;
    if (icon.type !== actual) fail(`icon ${icon.src} declares ${icon.type} but is ${actual}`);

    const purposes = (icon.purpose ?? 'any').split(/\s+/);
    if (purposes.includes('maskable')) {
      hasMaskable = true;
      // A maskable icon is cropped to an arbitrary shape, so a transparent ground shows
      // the launcher through the corners. It must be fully opaque.
      if (meta.hasAlpha) {
        const { channels } = await sharp(file).stats();
        const alpha = channels[3];
        if (alpha && alpha.min < 255) fail(`maskable icon ${icon.src} has transparent pixels`);
      }
    }
    if (purposes.includes('any')) {
      if (w >= 512) hasAny512 = true;
      if (w >= 192) hasAny192 = true;
    }
  }

  if (!hasAny192) fail('no "any" icon of at least 192px — Chrome will not offer to install');
  if (!hasAny512) fail('no "any" icon of at least 512px — the splash screen has nothing to use');
  if (!hasMaskable) fail('no maskable icon — Android will letterbox the mark in a white circle');
  if (hasAny192 && hasAny512 && hasMaskable) ok(`${icons.length} manifest icons, sizes and MIME types verified against their bytes`);
}

/**
 * `/favicon.ico`, decoded rather than merely present.
 *
 * A truncated or mislabelled ICO is served happily by every host and rendered by none.
 */
async function checkFavicon() {
  const file = path.join(DIST, 'favicon.ico');
  if (!await exists(file)) { fail('favicon.ico is not in the build'); return; }

  const buf = await fs.readFile(file);
  if (buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1) { fail('favicon.ico is not an icon container'); return; }

  const count = buf.readUInt16LE(4);
  if (count === 0) { fail('favicon.ico contains no images'); return; }

  const sizes = [];
  for (let i = 0; i < count; i++) {
    const entry = 6 + i * 16;
    const declared = buf.readUInt8(entry) || 256;
    const length = buf.readUInt32LE(entry + 8);
    const offset = buf.readUInt32LE(entry + 12);
    if (offset + length > buf.length) { fail(`favicon.ico entry ${i} runs past the end of the file`); return; }

    const meta = await sharp(buf.subarray(offset, offset + length)).metadata();
    if (meta.width !== declared) {
      fail(`favicon.ico entry ${i} declares ${declared}px but the image is ${meta.width}px`);
    }
    sizes.push(declared);
  }
  if (!sizes.includes(32)) fail('favicon.ico has no 32px entry — the size browsers actually render');
  ok(`favicon.ico decodes: ${sizes.join('/')}px`);

  const apple = path.join(DIST, 'icons/apple-touch-icon.png');
  if (!await exists(apple)) { fail('apple-touch-icon.png is not in the build'); return; }
  const meta = await sharp(apple).metadata();
  if (meta.width !== 180 || meta.height !== 180) fail(`apple-touch-icon is ${meta.width}x${meta.height}, not 180x180`);
  // iOS composites transparency onto black rather than honouring it, so an alpha channel
  // here means the mark's ground is the platform's choice instead of ours.
  if (meta.hasAlpha) fail('apple-touch-icon has an alpha channel — iOS will fill it with black');
  else ok('apple-touch-icon 180x180, opaque');
}

/* ────────────────────────────────────────────────────────── the head markup */

async function checkHead(manifest) {
  const pages = ['index.html', 'en/index.html', 'offline/index.html', 'contactos/index.html'];
  for (const page of pages) {
    const file = path.join(DIST, page);
    if (!await exists(file)) { fail(`${page} is not in the build`); continue; }
    const html = await read(file);

    if (!html.includes('rel="manifest"')) fail(`${page} does not link the manifest`);
    if (!html.includes('rel="apple-touch-icon"')) fail(`${page} has no apple-touch-icon`);
    if (!html.includes('/favicon.ico')) fail(`${page} does not link favicon.ico`);
    if (!html.includes(`name="theme-color" content="${manifest.theme_color}"`)) {
      fail(`${page} theme-color does not match the manifest (${manifest.theme_color})`);
    }
  }
  ok(`install metadata present on ${pages.length} sampled pages, both locales`);
}

/* ────────────────────────────────────────────────────────── service worker */

async function checkServiceWorker() {
  const file = path.join(DIST, 'sw.js');
  if (!await exists(file)) { fail('sw.js was not generated'); return; }
  const source = await read(file);

  // The three build-time injections. Without them the worker is a syntax error at install.
  for (const symbol of ['BUILD_ID', 'PRECACHE', 'OFFLINE_SHELLS']) {
    if (!new RegExp(`const ${symbol} =`).test(source)) fail(`sw.js is missing its injected ${symbol}`);
  }

  const buildId = source.match(/const BUILD_ID = "([^"]+)"/)?.[1];
  if (!buildId) { fail('sw.js has no BUILD_ID — cache versioning cannot work'); return; }

  const precache = JSON.parse(source.match(/const PRECACHE = (\[[^\n]*\]);/)?.[1] ?? 'null');
  if (!Array.isArray(precache)) { fail('sw.js PRECACHE did not parse'); return; }

  const shells = JSON.parse(source.match(/const OFFLINE_SHELLS = (\{[^\n]*\});/)?.[1] ?? 'null');
  if (!shells?.pt || !shells?.en) fail('sw.js has no offline shell for both locales');

  // The rule this whole worker exists to keep. Checked in the LIST, not just in the code:
  // the runtime guard can be correct while the precache list quietly holds an mp4.
  const video = precache.filter((url) => VIDEO.test(url));
  if (video.length) fail(`sw.js precaches ${video.length} video file(s): ${video.slice(0, 3).join(', ')}`);

  // `public/__generated/` is ~100 MB of posters and preview renditions against a 20 MB
  // budget. Nothing from it may be precached; images are runtime-cached under a cap.
  const media = precache.filter((url) => url.startsWith('/__generated/') && !url.startsWith('/__generated/fonts/'));
  if (media.length) fail(`sw.js precaches ${media.length} generated media file(s) — budget is ${STORAGE_BUDGET / 1048576} MB`);

  // Every precached URL must exist, or install silently drops it and offline breaks.
  let bytes = 0;
  const missing = [];
  for (const url of precache) {
    const target = url.endsWith('/')
      ? path.join(DIST, url.replace(/^\//, ''), 'index.html')
      : path.join(DIST, url.replace(/^\//, ''));
    try { bytes += (await fs.stat(target)).size; } catch { missing.push(url); }
  }
  if (missing.length) fail(`sw.js precaches ${missing.length} path(s) that are not built: ${missing.slice(0, 3).join(', ')}`);

  if (bytes > STORAGE_BUDGET) {
    fail(`precache is ${(bytes / 1048576).toFixed(1)} MB, over the ${STORAGE_BUDGET / 1048576} MB budget`);
  }

  // Both offline documents must be real routes, not just names in a list.
  for (const [locale, url] of Object.entries(shells ?? {})) {
    if (!await exists(path.join(DIST, url.replace(/^\//, ''), 'index.html'))) {
      fail(`the ${locale} offline shell ${url} is not built`);
    }
    if (!precache.includes(url)) fail(`the ${locale} offline shell ${url} is not precached — it would be unavailable offline`);
  }

  // Update behaviour: skipWaiting must be reachable ONLY from the reader's click.
  //
  // Counted in CODE, not in prose. The worker's own header comment explains that it never
  // calls `skipWaiting()` on its own, and a naive count reads that sentence as a second
  // call site — the same trap validate:analytics avoids by refusing to read comments.
  const skipWaiting = [...stripComments(source).matchAll(/skipWaiting\(\)/g)].length;
  if (skipWaiting !== 1) fail(`sw.js calls skipWaiting() ${skipWaiting} times — exactly one, behind the message handler, is the contract`);
  if (!/addEventListener\('message'/.test(source)) fail('sw.js has no message handler, so a waiting update can never be accepted');

  // Stale-cache cleanup on activate, keyed to BUILD_ID.
  if (!/caches\.delete/.test(source)) fail('sw.js never deletes an old cache — versions would accumulate');

  ok(`sw.js build ${buildId}: ${precache.length} precached, ${(bytes / 1024).toFixed(0)} KB of the ${STORAGE_BUDGET / 1048576} MB budget, 0 video`);
}

/* ──────────────────────────────────────────────────────────────────── main */

const palette = await tokens();
if (!palette.ink || !palette.cream) fail('could not read --brand-ink / --brand-cream from tokens.colour.css');

const manifest = await checkManifest(palette);
if (manifest) {
  await checkIcons(manifest);
  await checkHead(manifest);
}
await checkFavicon();
await checkServiceWorker();

for (const note of notes) console.log(`  ok  ${note}`);
if (failures.length) {
  console.error('');
  for (const failure of failures) console.error(`  !!  ${failure}`);
  console.error(`\nvalidate:pwa FAILED — ${failures.length} problem(s)\n`);
  process.exit(1);
}
console.log(`\nvalidate:pwa passed — ${notes.length} checks\n`);
