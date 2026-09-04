#!/usr/bin/env node
/**
 * media-inspect.mjs — look at a source file before deciding anything about it.
 *
 * This is step one of adding new media (docs/MEDIA_PIPELINE.md §5). It reports what the
 * file actually is — dimensions, duration, bitrate, whether it carries sound — runs
 * ffmpeg's cropdetect so letterbox bars and rounded corners are measured rather than
 * guessed, and prints the width ladder the source can honestly fill.
 *
 * It writes NOTHING. It never touches the file. Its output is a recipe entry you paste
 * into scripts/media/recipe.mjs and then edit, because the timecode is a judgement about
 * the footage and this script cannot make it for you.
 *
 *   npm run media:inspect                      list media/incoming/
 *   npm run media:inspect -- <path> [seconds]  describe one file (default probe at 1s)
 */

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import * as R from './media/recipe.mjs';
import { INCOMING, probeFull, human } from './media/lib.mjs';

const exec = promisify(execFile);
const log = (...a) => console.log(...a);

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const target = args[0];
const at = Number(args[1] ?? 1);

/** cropdetect over a few seconds. The answer is a crop string the recipe understands. */
async function cropdetect(file, from) {
  try {
    const { stderr } = await exec('ffmpeg', [
      '-hide_banner', '-ss', String(from), '-i', file, '-t', '3',
      '-vf', 'cropdetect=24:2:0', '-f', 'null', '-',
    ], { maxBuffer: 16 * 1024 * 1024 });
    const hits = [...stderr.matchAll(/crop=(\d+:\d+:\d+:\d+)/g)].map((m) => m[1]);
    return hits.length ? hits[hits.length - 1] : null;
  } catch { return null; }
}

async function describe(file) {
  const stat = await fs.stat(file);
  const probe = await probeFull(file);
  const v = probe.streams.find((s) => s.codec_type === 'video');
  const a = probe.streams.find((s) => s.codec_type === 'audio');
  if (!v) { log(`  ${path.basename(file)} — no video stream`); return; }

  const duration = Number(probe.format?.duration ?? 0);
  const bitrate = Number(probe.format?.bit_rate ?? 0);
  const isStill = !duration || duration < 0.1;
  const fps = v.r_frame_rate?.includes('/')
    ? (Number(v.r_frame_rate.split('/')[0]) / Number(v.r_frame_rate.split('/')[1])).toFixed(2)
    : v.r_frame_rate;

  log(`\n${path.relative(process.cwd(), file)}`);
  log(`  ${v.width}×${v.height}  ${v.codec_name}  ${human(stat.size)}`
    + (isStill ? '  (still)' : `  ${duration.toFixed(1)}s  ${fps} fps  ${(bitrate / 1000).toFixed(0)} kbps`));
  log(`  audio: ${a ? `${a.codec_name} — decorative loops are encoded with -an regardless` : 'none'}`);

  /* The quality floor a cinematic hero has to clear (src/config/site.ts). */
  if (!isStill) {
    const heroOk = v.height >= 1080 && bitrate >= 8_000_000;
    log(`  hero floor (${1080}p / 8 Mbps): ${heroOk ? 'CLEARS it' : 'BELOW it — masterRequired: true'}`);
  }

  if (!isStill) {
    const crop = await cropdetect(file, at);
    log(`  cropdetect @${at}s: ${crop ?? 'no bars found — crop: null'}`);
    if (crop) {
      const [cw] = crop.split(':').map(Number);
      log(`  → the crop is ${cw}px wide, which is the ceiling for every derivative`);
    }
  }

  const ceiling = v.width;
  const ladders = {
    'card still (STILL_WIDTHS)': R.STILL_WIDTHS,
    'page still (PAGE_STILL_WIDTHS)': R.PAGE_STILL_WIDTHS,
    'page hero (PAGE_HERO_WIDTHS)': R.PAGE_HERO_WIDTHS,
  };
  for (const [name, ladder] of Object.entries(ladders)) {
    const usable = ladder.filter((w) => w <= ceiling);
    const dropped = ladder.filter((w) => w > ceiling);
    log(`  ${name}: ${usable.join('/') || '—'}${dropped.length ? `   (${dropped.join('/')} dropped — would upscale)` : ''}`);
  }

  log('\n  recipe stub — paste into scripts/media/recipe.mjs and choose the window yourself:\n');
  log(isStill
    ? `    { key: 'pages/<page>/<name>', file: '<archive-relative path>', widths: [${R.PAGE_STILL_WIDTHS.filter((w) => w <= ceiling).join(', ')}], note: 'UNKNOWN — say where this is published' },`
    : `    {
      slug: '<project-slug>',
      // Say what the window avoids: captions, light leaks, client end cards, logo bugs.
      clip: { file: WP('<year>/<month>/<file>'), start: 0, duration: 4, crop: null, posterAt: 1 },
      stills: [{ at: 1, note: 'UNKNOWN' }],
    },`);
  log('');
}

async function main() {
  if (!target) {
    log(`\nmedia:inspect — drop a source file in ${path.relative(process.cwd(), INCOMING)} and name it here.\n`);
    if (!existsSync(INCOMING)) { log('  (the directory does not exist yet; create it or pass a path)\n'); return; }
    const files = await fs.readdir(INCOMING);
    if (!files.length) { log('  (empty)\n'); return; }
    for (const f of files) await describe(path.join(INCOMING, f));
    return;
  }
  const file = path.resolve(target);
  if (!existsSync(file)) { console.error(`not found: ${file}`); process.exit(1); }
  await describe(file);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
