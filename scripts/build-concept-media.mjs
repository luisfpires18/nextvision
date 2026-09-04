#!/usr/bin/env node
/**
 * build-concept-media.mjs — DISPOSABLE prototype media for Review A only.
 *
 * Writes small derivatives to public/__generated/ (gitignored). Nothing here ships:
 * production media goes through scripts/media-sync.mjs into R2 in Phase 3.
 *
 * READ-ONLY against every source. Source files are never modified, renamed or moved.
 *
 * Sources, in order of preference:
 *   posters  — source-archive/wordpress/media/...   (this repo, from Phase 0.5)
 *   previews — Smash/, looked up across known locations because the owner moved the
 *              469 MB folder out of the repo on 2026-09-02
 *
 * Usage: node scripts/build-concept-media.mjs [--force]
 */

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public', '__generated');
const FORCE = process.argv.includes('--force');

/** Smash/ has moved before. Look, don't assume. */
const SMASH_CANDIDATES = [
  path.join(ROOT, 'docs', 'Smash'),
  'D:/Workspace/next_vision_info/Smash',
  'D:/Workspace/nextvision_v2/docs/Smash',
  'D:/Workspace/nextvision_v3/docs/Smash',
];

/** Poster derivatives: every project, so all three concepts can show the full catalogue. */
const POSTER_WIDTH = 1200;
const POSTER_QUALITY = 78;

/**
 * Preview loops. Only projects whose Smash match is `high` or better
 * (src/data/media-source-map.json) — no guessed pairings.
 * `start` picks a representative moment; these are 6-second silent loops.
 */
const PREVIEWS = [
  { slug: 'ana-reels', file: 'The lie we tell ourselves.mp4', start: 8 },
  { slug: 'helder-praia', file: 'The endless _WAVES_.mp4', start: 10 },
  { slug: 'nazaryi', file: 'Unfinished.mp4', start: 14 },
  { slug: 'nvf-vs-antiqvvm', file: 'NVF VS Antiqvvm.mp4', start: 12 },
  { slug: 'nvf-vs-filmin-details', file: 'film in 1 v2.mp4', start: 6 },
  { slug: 'leonor', file: 'Can´t live in you books anymore.mp4', start: 9 },
];

/** Brand film for the concept heroes. 12 s, silent, 960px. */
const HERO = { name: 'we-are-nvf', file: 'We are NVF.mp4', start: 2, duration: 12, width: 960 };

const PREVIEW_WIDTH = 720;
const PREVIEW_DURATION = 6;

const log = (...a) => console.log(...a);

function findSmash() {
  for (const c of SMASH_CANDIDATES) if (existsSync(c)) return c;
  return null;
}

async function ffmpeg(args) {
  await exec('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { maxBuffer: 16 * 1024 * 1024 });
}

async function sizeKB(p) {
  try { return Math.round((await fs.stat(p)).size / 1024); } catch { return 0; }
}

async function buildPosters(map) {
  const dir = path.join(OUT, 'posters');
  await fs.mkdir(dir, { recursive: true });
  let made = 0, skipped = 0, total = 0;

  for (const p of map.projects) {
    const src = p.wordpress.posterArchived ? path.join(ROOT, p.wordpress.posterArchived) : null;
    if (!src || !existsSync(src)) { log(`  !! no archived poster for ${p.slug}`); continue; }
    const dest = path.join(dir, `${p.slug}.webp`);
    if (existsSync(dest) && !FORCE) { skipped++; total += await sizeKB(dest); continue; }

    // scale to width, keep aspect, force even dimensions
    await ffmpeg(['-i', src, '-vf', `scale=${POSTER_WIDTH}:-2:flags=lanczos`, '-quality', String(POSTER_QUALITY), '-frames:v', '1', dest]);
    made++; total += await sizeKB(dest);
  }
  log(`  posters: ${made} built, ${skipped} cached, ${total} KB total`);
}

async function buildPreviews(smashDir) {
  const dir = path.join(OUT, 'preview');
  await fs.mkdir(dir, { recursive: true });
  let made = 0, skipped = 0, total = 0;

  for (const item of [...PREVIEWS.map((p) => ({ ...p, out: p.slug, width: PREVIEW_WIDTH, duration: PREVIEW_DURATION })),
                      { ...HERO, out: HERO.name }]) {
    // Filenames carry accents; normalise before matching (macOS NFD vs NFC).
    const files = await fs.readdir(smashDir);
    const match = files.find((f) => f.normalize('NFC') === item.file.normalize('NFC'));
    if (!match) { log(`  !! source not found: ${item.file}`); continue; }

    const src = path.join(smashDir, match);
    const dest = path.join(dir, `${item.out}.mp4`);
    const poster = path.join(dir, `${item.out}.webp`);

    if (existsSync(dest) && !FORCE) { skipped++; total += await sizeKB(dest); continue; }

    // Silent loop: audio stripped (-an), faststart so it plays before fully buffered,
    // CRF kept modest because these are decorative loops, not the films themselves.
    await ffmpeg([
      '-ss', String(item.start), '-i', src, '-t', String(item.duration),
      '-an', '-vf', `scale=${item.width}:-2:flags=lanczos`,
      '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
      '-crf', '30', '-preset', 'slow', '-movflags', '+faststart',
      dest,
    ]);
    // First frame as the poster, so the video never renders as a black box.
    await ffmpeg(['-ss', String(item.start), '-i', src, '-frames:v', '1',
      '-vf', `scale=${item.width}:-2:flags=lanczos`, '-quality', '72', poster]);

    made++; total += await sizeKB(dest);
    log(`  ${item.out}.mp4  ${await sizeKB(dest)} KB`);
  }
  log(`  previews: ${made} built, ${skipped} cached, ${total} KB total`);
}

async function main() {
  const map = JSON.parse(await fs.readFile(path.join(ROOT, 'src/data/media-source-map.json'), 'utf8'));

  log('\nGenerating DISPOSABLE prototype media → public/__generated/\n');
  await fs.mkdir(OUT, { recursive: true });

  log('1/2  Posters (from the Phase 0.5 archive)');
  await buildPosters(map);

  log('\n2/2  Preview loops (from Smash)');
  const smash = findSmash();
  if (!smash) {
    log('  !! Smash/ not found in any known location:');
    for (const c of SMASH_CANDIDATES) log(`       ${c}`);
    log('     Skipping preview loops. Concepts fall back to posters — which is a real,');
    log('     supported state, since 10 of 20 projects have no preview source anyway.');
  } else {
    log(`  source: ${smash}`);
    await buildPreviews(smash);
  }

  await fs.writeFile(path.join(OUT, 'README.md'),
`# public/__generated/ — DISPOSABLE

Prototype media for the Review A concepts. **Gitignored. Nothing here ships.**

Regenerate: \`npm run concepts:media\`

- \`posters/*.webp\` — ${POSTER_WIDTH}px from \`source-archive/wordpress/media/\`
- \`preview/*.mp4\`  — ${PREVIEW_DURATION}s silent loops, ${PREVIEW_WIDTH}px, from Smash/
- \`preview/*.webp\` — first frame of each loop, so no video renders as a black box

Production media is built by \`scripts/media-sync.mjs\` into R2 in Phase 3.
Sources are read-only and were not modified.

Generated ${new Date().toISOString()}
`);

  const all = await fs.readdir(OUT, { recursive: true });
  let bytes = 0;
  for (const f of all) {
    const p = path.join(OUT, f);
    try { const s = await fs.stat(p); if (s.isFile()) bytes += s.size; } catch { /* dir */ }
  }
  log(`\ntotal generated: ${(bytes / 1048576).toFixed(2)} MB`);
}

main().catch((e) => { console.error(e); process.exit(1); });
