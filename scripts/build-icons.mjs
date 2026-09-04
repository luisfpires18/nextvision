/**
 * PWA / favicon icon derivatives — PHASE 15.
 *
 * ONE SOURCE, one background colour, one geometry rule, and every output a DOWNSCALE.
 *
 * ── Why the raster source and not the SVG ────────────────────────────────────
 * `source-assets/brand/NextVisionFILMS.svg` is a real vector logo (see the README beside
 * it) but it is the 3.25:1 horizontal WORDMARK. An icon is square, and the square NVF
 * monogram is a different lockup — not a crop of the wordmark. Building one from the
 * wordmark's glyphs would be recomposing the mark, which CLAUDE.md §8 forbids.
 *
 * `NVF.png` already IS that square lockup, at 2431 px, and it is the asset the live site
 * itself downscales for every icon slot it has. 2431 → 512 is 4.7:1, so nothing here is
 * ever upscaled; the script asserts that rather than trusting it.
 *
 * ── The one deliberate change ────────────────────────────────────────────────
 * The source is transparent with a LIGHT GREY wordmark, so it disappears against every
 * white ground a platform might composite it onto — the live favicon has this defect now.
 * Everything generated here sits on `--brand-ink` #292929, which is the manifest's
 * existing `theme_color` and the ground the logo is drawn against in the header. Site
 * colour, not a new one. 9.8:1 against the wordmark.
 *
 * ── Geometry ─────────────────────────────────────────────────────────────────
 * Content is measured from the source's ALPHA, not typed in, so a replacement source
 * re-measures itself. It is then scaled to a fraction of the canvas and centred:
 *
 *   any (192, 512)      80 %   ordinary launcher / install-prompt icon
 *   maskable (512)      66 %   must fit the safe circle — asserted below
 *   apple-touch (180)   80 %   iOS applies its own squircle; 80 % clears it
 *   favicon (16/32/48)  94 %   tiny, so it gets the width the live favicon uses
 *
 * Aspect ratio is never typed and never forced: width is chosen, height follows from the
 * measured box, so no output is stretched.
 *
 * Deterministic. `--check` rebuilds in memory and diffs against what is on disk, which is
 * what lets `validate:pwa` prove the committed icons still match the preserved source.
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SOURCE = path.join(ROOT, 'source-assets/brand/NVF.png');
const OUT_DIR = path.join(ROOT, 'public/icons');
const FAVICON = path.join(ROOT, 'public/favicon.ico');

const CHECK = process.argv.includes('--check');

/** --brand-ink. Also the manifest's theme_color. Declared once, here. */
const INK = { r: 0x29, g: 0x29, b: 0x29, alpha: 1 };

/** Maskable safe area: the centred circle of diameter 80 % of the icon. */
const MASKABLE_SAFE = 0.8;

/** @typedef {{ file: string, size: number, fraction: number, note: string }} Target */

/** @type {Target[]} */
const TARGETS = [
  { file: 'icon-192.png', size: 192, fraction: 0.80, note: 'manifest, purpose any' },
  { file: 'icon-512.png', size: 512, fraction: 0.80, note: 'manifest, purpose any' },
  { file: 'icon-maskable-512.png', size: 512, fraction: 0.66, note: 'manifest, purpose maskable' },
  { file: 'apple-touch-icon.png', size: 180, fraction: 0.80, note: 'iOS home screen' },
];

/** Sizes packed into favicon.ico, largest first. */
const FAVICON_SIZES = [48, 32, 16];
const FAVICON_FRACTION = 0.94;

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/* ──────────────────────────────────────────────────────── measure the source */

/**
 * The opaque bounding box of the source, from its alpha channel.
 *
 * Read, never typed — rule 7 in CLAUDE.md applied to the logo: a shape is a fact about
 * the asset, so a replacement source re-measures instead of inheriting a stale number.
 *
 * @param {string} file
 * @returns {Promise<{ left: number, top: number, width: number, height: number, canvas: number }>}
 */
async function contentBox(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;

  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * c + 3] === 0) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) throw new Error(`${file} is fully transparent — no content to place`);
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1, canvas: w };
}

/* ───────────────────────────────────────────────────────────────── rendering */

/**
 * One icon: the measured content, scaled to `fraction` of the canvas width and centred on
 * the ink ground.
 *
 * @param {Buffer} source raw bytes of the brand PNG
 * @param {{ left: number, top: number, width: number, height: number }} box
 * @param {number} size canvas edge in px
 * @param {number} fraction content width as a share of the canvas
 * @returns {Promise<{ buffer: Buffer, width: number, height: number }>}
 */
async function render(source, box, size, fraction) {
  const width = Math.round(size * fraction);
  // Height FOLLOWS the measured box. Never supplied, so nothing can be stretched.
  const content = await sharp(source)
    .extract(box)
    .resize({ width, kernel: 'lanczos3' })
    .png()
    .toBuffer();
  const meta = await sharp(content).metadata();
  const height = meta.height ?? 0;

  if (height > size) throw new Error(`content ${width}x${height} is taller than the ${size} canvas`);

  const buffer = await sharp({
    create: { width: size, height: size, channels: 4, background: INK },
  })
    .composite([{
      input: content,
      left: Math.round((size - width) / 2),
      top: Math.round((size - height) / 2),
    }])
    // Composite onto the ink ground, then drop the channel outright. `flatten` alone
    // leaves an RGBA image whose alpha happens to be 255 everywhere, which still reads as
    // "has transparency" to iOS and to any tool that checks the channel rather than its
    // values. `removeAlpha` makes the file honestly opaque, and smaller.
    .flatten({ background: INK })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer();

  return { buffer, width, height };
}

/* ───────────────────────────────────────────────────────────────────── .ico */

/**
 * A PNG-compressed ICO.
 *
 * Every browser still in service reads PNG payloads inside an ICO container, and it keeps
 * `/favicon.ico` — which browsers and feed readers request whether or not it is linked —
 * from being a 404.
 *
 * @param {{ size: number, buffer: Buffer }[]} images
 * @returns {Buffer}
 */
function ico(images) {
  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(0, 0);              // reserved
  dir.writeUInt16LE(1, 2);              // type: icon
  dir.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, buffer }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);   // 0 means 256
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);                        // palette size — 0 for true colour
    e.writeUInt8(0, 3);                        // reserved
    e.writeUInt16LE(1, 4);                     // colour planes
    e.writeUInt16LE(32, 6);                    // bits per pixel
    e.writeUInt32LE(buffer.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += buffer.length;
    return e;
  });

  return Buffer.concat([dir, ...entries, ...images.map((i) => i.buffer)]);
}

/* ─────────────────────────────────────────────────────────────────────  main */

async function main() {
  const source = await fs.readFile(SOURCE);
  const box = await contentBox(SOURCE);
  const meta = await sharp(source).metadata();

  console.log(`source   ${path.relative(ROOT, SOURCE)}  ${meta.width}x${meta.height}`);
  console.log(`content  ${box.width}x${box.height} at (${box.left},${box.top}) — measured from alpha`);

  /** @type {{ file: string, buffer: Buffer }[]} */
  const written = [];
  const problems = [];

  for (const target of TARGETS) {
    const { buffer, width, height } = await render(source, box, target.size, target.fraction);

    // Never upscale. The whole reason this source was chosen is that it is big enough.
    if (width > box.width) {
      problems.push(`${target.file}: UPSCALE — ${width}px wide from a ${box.width}px source`);
    }

    // A maskable icon promises its content survives an arbitrary mask, so the content's
    // DIAGONAL — not its width — has to fit the safe circle. Asserted, not assumed.
    if (target.file.includes('maskable')) {
      const diagonal = Math.hypot(width, height);
      const safe = target.size * MASKABLE_SAFE;
      if (diagonal > safe) {
        problems.push(`${target.file}: content diagonal ${diagonal.toFixed(1)}px exceeds the ${safe}px safe circle`);
      } else {
        console.log(`         maskable safe area ok — diagonal ${diagonal.toFixed(1)} of ${safe}px`);
      }
    }

    written.push({ file: target.file, buffer });
  }

  const faviconImages = [];
  for (const size of FAVICON_SIZES) {
    const { buffer } = await render(source, box, size, FAVICON_FRACTION);
    faviconImages.push({ size, buffer });
  }
  const faviconBuffer = ico(faviconImages);

  if (problems.length) {
    for (const p of problems) console.error(`  !! ${p}`);
    process.exit(1);
  }

  /** @type {{ path: string, buffer: Buffer }[]} */
  const all = [
    ...written.map((w) => ({ path: path.join(OUT_DIR, w.file), buffer: w.buffer })),
    { path: FAVICON, buffer: faviconBuffer },
  ];

  if (CHECK) {
    let drift = 0;
    for (const item of all) {
      const rel = path.relative(ROOT, item.path).replace(/\\/g, '/');
      let existing = null;
      try { existing = await fs.readFile(item.path); } catch { /* missing */ }
      if (!existing) { console.error(`  !! MISSING  ${rel}`); drift++; continue; }
      if (sha256(existing) !== sha256(item.buffer)) {
        console.error(`  !! DIFFERS  ${rel} — rebuild with: npm run icons:build`);
        drift++;
      }
    }
    if (drift) process.exit(1);
    console.log(`\n  ${all.length} icons match the preserved source.`);
    return;
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  for (const item of all) {
    await fs.writeFile(item.path, item.buffer);
    const rel = path.relative(ROOT, item.path).replace(/\\/g, '/');
    console.log(`  ok ${rel.padEnd(38)} ${String(item.buffer.length).padStart(6)} B  ${sha256(item.buffer).slice(0, 12)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
