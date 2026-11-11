/**
 * Brand mark derivatives — PERFORMANCE AUDIT, 2026-10-29.
 *
 * The marks in public/brand/ were rendered at 300–600 dpi so they stay sharp at the
 * largest size the design sets them — but most of them are only ever set small. The
 * homepage fetched the 115 KB, 1400 px stack for a 96 px logo, and every page's footer the
 * 50 KB, 1200 px mono for a mark that never exceeds 24rem.
 *
 * So each target below is TWICE the largest CSS width the mark is rendered at (a DPR 2
 * screen), measured from the stylesheet, never guessed. A mark whose largest use needs the
 * original keeps it: the About page sets the stack at up to 56rem, so the stack original
 * stays and only the hero gets a small copy (`stackSmall` in src/lib/brand.ts).
 *
 * The originals are never edited and nothing is ever upscaled (asserted). Deterministic:
 * the same original always gives the same bytes, so a re-run changes nothing in git.
 * `--check` rebuilds in memory and fails if what is on disk differs.
 *
 *     npm run brand:build
 *     npm run brand:build -- --check
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = path.join(ROOT, 'public/brand');
const CHECK = process.argv.includes('--check');

/** [original, width, where the width comes from] */
const TARGETS = [
  ['nvf-stack.png', 192, 'homepage .hero__marks: var(--space-9) = 6rem'],
  ['nvf-mono.png', 768, '.site-footer__mark and .bts__mark: min(100%, 24rem)'],
  ['nvf-n.png', 192, '.hero__marks 6rem, .ab2-team__mono var(--space-8) = 4rem'],
  ['nvf-colour.png', 640, '.cm__mark: min(70%, 20rem)'],
  ['nvf-n-colour.png', 192, '.loader__mono 4rem, .vhs__logo 64% of a spine'],
];

const derivedName = (file, width) => file.replace(/\.png$/, `-${width}w.png`);

let failed = false;
for (const [file, width, why] of TARGETS) {
  const source = path.join(DIR, file);
  const meta = await sharp(source).metadata();
  if (!meta.width || meta.width < width) {
    console.error(`  ✗ ${file} is ${meta.width} px wide; ${width} would be an upscale`);
    failed = true;
    continue;
  }
  const bytes = await sharp(source)
    .resize({ width, kernel: 'lanczos3' })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  const out = path.join(DIR, derivedName(file, width));

  if (CHECK) {
    const onDisk = await fs.readFile(out).catch(() => null);
    if (!onDisk || !onDisk.equals(bytes)) {
      console.error(`  ✗ ${path.basename(out)} is missing or stale — run \`npm run brand:build\``);
      failed = true;
    }
    continue;
  }
  await fs.writeFile(out, bytes);
  const { size } = await fs.stat(source);
  console.log(`  ${path.basename(out)}  ${(size / 1024).toFixed(1)} KB → ${(bytes.length / 1024).toFixed(1)} KB  (${why})`);
}

/*
 * The link preview (owner request, 2026-11-11): what WhatsApp and the like show for
 * nextvisionfilms.com. The colour mark, downscaled like the rest, over the tagline
 * `We are NVF` (the live site's own title suffix, src/config/site.ts), set in Barlow
 * Condensed from source-assets/fonts. 1200x630 is the size every preview crawler expects.
 * Colours are read from tokens.colour.css, never typed.
 */
const css = await fs.readFile(path.join(ROOT, 'src/styles/tokens.colour.css'), 'utf8');
const token = (name) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
const [cream, ink] = [token('brand-cream'), token('brand-ink')];
if (!cream || !ink) throw new Error('brand-cream or brand-ink missing from tokens.colour.css');

const SHARE = { width: 1200, height: 630, mark: 640, text: 'We are NVF' };
const mark = await sharp(path.join(DIR, 'nvf-colour.png')).resize({ width: SHARE.mark, kernel: 'lanczos3' }).toBuffer();
const markH = (await sharp(mark).metadata()).height;
const words = await sharp({
  text: {
    text: `<span foreground="${ink}">${SHARE.text}</span>`,
    fontfile: path.join(ROOT, 'source-assets/fonts/Barlow_Condensed/BarlowCondensed-SemiBold.ttf'),
    font: 'Barlow Condensed SemiBold 64',
    dpi: 72,
    rgba: true,
  },
}).png().toBuffer();
const wordsMeta = await sharp(words).metadata();
const gap = 48;
const top = Math.round((SHARE.height - markH - gap - wordsMeta.height) / 2);
const share = await sharp({ create: { width: SHARE.width, height: SHARE.height, channels: 3, background: cream } })
  .composite([
    { input: mark, left: Math.round((SHARE.width - SHARE.mark) / 2), top },
    { input: words, left: Math.round((SHARE.width - wordsMeta.width) / 2), top: top + markH + gap },
  ])
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toBuffer();
const shareOut = path.join(DIR, 'share.png');
if (CHECK) {
  const onDisk = await fs.readFile(shareOut).catch(() => null);
  if (!onDisk || !onDisk.equals(share)) {
    console.error('  ✗ share.png is missing or stale — run `npm run brand:build`');
    failed = true;
  }
} else {
  await fs.writeFile(shareOut, share);
  console.log(`  share.png  ${(share.length / 1024).toFixed(1)} KB  (link preview, ${SHARE.width}x${SHARE.height})`);
}

if (failed) process.exit(1);
if (CHECK) console.log('brand:check — every derivative matches its original');
