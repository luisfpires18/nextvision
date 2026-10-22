#!/usr/bin/env node
/**
 * media-build.mjs — the production derivative pipeline.
 *
 * Reads scripts/media/recipe.mjs (WHAT to build, and from which frame of which source),
 * encodes every derivative into the local bucket mirror at media/dist/, and writes
 * src/data/media-manifest.json — the single authority the site renders from.
 *
 * READ-ONLY against every source. Nothing in Smash/ or source-archive/ is modified,
 * renamed, moved or transcoded in place. Nothing is ever upscaled: a requested width
 * wider than the cropped source is dropped, not stretched.
 *
 * Cheap to re-run. Every derivative is fingerprinted by (source stamp + recipe + encoder
 * settings); an unchanged fingerprint whose file is still in the mirror is not re-encoded.
 * `--force` ignores the cache. `--only <substring>` limits the run to matching keys.
 *
 * Usage: npm run media:build [-- --force] [-- --only projects/leonor]
 */

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

import * as R from './media/recipe.mjs';
import {
  MIRROR, CACHE_FILE, MANIFEST_FILE, ENCODER, INCOMING,
  ffmpeg, probeSize, resolveSource, filterFor, findSmash,
  emit, fingerprint, sourceStamp, readJson, writeJson, mirrorPath, human,
} from './media/lib.mjs';

const ROOT = R.ROOT;
const FORCE = process.argv.includes('--force');
const ONLY = (() => {
  const i = process.argv.indexOf('--only');
  return i >= 0 ? process.argv[i + 1] : null;
})();

const log = (...a) => console.log(...a);

/** @type {Record<string, any>} */
let CACHE = {};
/** @type {Record<string, any>} */
const items = {};
let encoded = 0;
let reused = 0;

const wanted = (key) => !ONLY || key.includes(ONLY);

/* ═════════════════════════════════════════════════════════════════ encoding ══ */

/**
 * One rendition, cached.
 *
 * The fingerprint covers the source's identity, the recipe values that reach ffmpeg and
 * the encoder settings — so changing a CRF rebuilds the files that CRF touches and
 * nothing else. The cached record is only trusted while its file is still on disk.
 */
async function rendition(key, width, ext, spec, encode) {
  const id = `${key}|${width}|${ext}`;
  const fp = fingerprint({ spec, ext, width, encoder: ENCODER });
  const hit = CACHE[id];
  if (!FORCE && hit?.fingerprint === fp && existsSync(mirrorPath(hit.rendition.path))) {
    reused += 1;
    return hit.rendition;
  }
  const r = await emit(key, width, ext, encode);
  CACHE[id] = { fingerprint: fp, rendition: r };
  encoded += 1;
  return r;
}

/** Widths that the source can actually fill. Never upscale. */
const usableWidths = (widths, ceiling) => {
  const usable = widths.filter((w) => w <= ceiling);
  return usable.length ? usable : [ceiling];
};

/**
 * A still, at every width the source supports, in both WebP and AVIF.
 *
 * Both are encoded FROM THE SOURCE, never from each other — an AVIF made out of a WebP
 * inherits the WebP's artefacts and then adds its own.
 */
async function stillRenditions(key, src, crop, widths, at = null) {
  const natural = await probeSize(src);
  const ceiling = crop ? Number(crop.split(':')[0]) : natural.width;
  const out = [];
  for (const width of usableWidths(widths, ceiling)) {
    const spec = { src: await sourceStamp(src), crop, at, quality: ENCODER.webpQuality };
    const seek = at === null ? [] : ['-ss', String(at)];
    out.push({
      format: 'webp',
      ...await rendition(key, width, 'webp', spec, (dest) => ffmpeg([
        ...seek, '-i', src, '-frames:v', '1',
        '-vf', filterFor(crop, width), '-quality', String(ENCODER.webpQuality), dest,
      ])),
    });
    out.push({
      format: 'avif',
      ...await rendition(key, width, 'avif', { ...spec, quality: ENCODER.avifCrf }, (dest) => ffmpeg([
        ...seek, '-i', src, '-frames:v', '1', '-vf', filterFor(crop, width),
        '-c:v', 'libaom-av1', '-still-picture', '1', '-crf', String(ENCODER.avifCrf),
        '-cpu-used', String(ENCODER.avifCpuUsed), '-pix_fmt', 'yuv420p', '-f', 'avif', dest,
      ])),
    });
  }
  return { renditions: out, natural };
}

/**
 * WebM is built for hero-class clips only — the ones that autoplay before the reader has
 * done anything. A hover preview is fetched on intent and a second encode of it would be
 * storage nobody downloads.
 */
const wantsWebm = (key) => key.endsWith('/hero') || key.endsWith('/feature') || key === 'pages/home/hero';

async function clipRenditions(key, src, spec) {
  const natural = await probeSize(src);
  const ceiling = spec.crop ? Number(spec.crop.split(':')[0]) : natural.width;
  const out = [];
  for (const width of usableWidths(spec.widths, ceiling)) {
    const base = { src: await sourceStamp(src), start: spec.start, duration: spec.duration, crop: spec.crop };
    out.push({
      format: 'mp4',
      ...await rendition(key, width, 'mp4', { ...base, crf: ENCODER.crf }, (dest) => ffmpeg([
        '-ss', String(spec.start), '-i', src, '-t', String(spec.duration),
        '-an', '-vf', filterFor(spec.crop, width),
        '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
        '-crf', String(ENCODER.crf), '-preset', 'slow', '-movflags', '+faststart', dest,
      ])),
    });
    if (wantsWebm(key)) {
      out.push({
        format: 'webm',
        ...await rendition(key, width, 'webm', { ...base, crf: ENCODER.vp9Crf }, (dest) => ffmpeg([
          '-ss', String(spec.start), '-i', src, '-t', String(spec.duration),
          '-an', '-vf', filterFor(spec.crop, width),
          '-c:v', 'libvpx-vp9', '-crf', String(ENCODER.vp9Crf), '-b:v', '0',
          '-row-mt', '1', '-deadline', 'good', '-cpu-used', String(ENCODER.vp9CpuUsed), dest,
        ])),
      });
    }
  }
  return { renditions: out, natural };
}

/* ══════════════════════════════════════════════════════════════ item shape ══ */

/**
 * Every manifest entry is assembled here, so no field can exist on one asset and be
 * quietly missing from another. `renditions` is flat and each entry names its own format;
 * src/lib/media.ts groups them. Nothing in the manifest is a URL.
 */
function record(key, kind, renditions, extra) {
  const primary = renditions.filter((r) => r.format === (kind === 'video' ? 'mp4' : 'webp'));
  const widest = kind === 'video' ? primary[0] : primary[primary.length - 1];
  if (!widest) throw new Error(`no primary rendition for ${key}`);
  items[key] = {
    key,
    kind,
    storage: 'r2',
    contentType: widest.contentType,
    width: widest.width,
    height: widest.height,
    aspectRatio: +(widest.width / widest.height).toFixed(4),
    formats: [...new Set(renditions.map((r) => r.format))],
    renditions,
    bytes: renditions.reduce((n, r) => n + r.bytes, 0),
    ...extra,
  };
  const label = kind === 'video' ? renditions.map((r) => `${r.width}${r.format === 'webm' ? 'w-vp9' : 'w'}`).join(' ') : `${primary.length} widths ×2 formats`;
  log(`  ${key.padEnd(44)} ${human(items[key].bytes).padStart(9)}  ${label}`);
}

/* ══════════════════════════════════════════════════════════════════ stages ══ */

/** A clip plus its poster frame. Used by the hero, the feature, the loops and the pages. */
async function buildClip(smash, spec) {
  if (!wanted(spec.key)) return;
  const src = spec.resolved ? spec.file : (smash ? await resolveSource(smash, spec.file) : null);
  if (!src) { log(`  !! source not found: ${spec.file}`); return; }

  const { renditions, natural } = await clipRenditions(spec.key, src, spec);
  record(spec.key, 'video', renditions, {
    poster: `${spec.key}/poster`,
    // Every loop is encoded with -an. A sound control is only rendered where there is
    // sound to control, so the site simply does not show one.
    hasAudio: false,
    provenance: spec.provenance ?? 'smash',
    sourceQuality: 'web-export',
    altStatus: 'decorative',
    alt: null,
    // A 1080p card loop clears the hero floor at the width the page renders, and is still
    // not a master. Only the files that genuinely fall short carry the flag.
    masterRequired: spec.masterRequired ?? true,
    ...(spec.provenance === 'owner' ? { sourceQuality: 'owner-upload' } : {}),
    source: { ...await sourceStamp(src), naturalWidth: natural.width, naturalHeight: natural.height },
    recipe: { start: spec.start, duration: spec.duration, crop: spec.crop, posterAt: spec.posterAt },
    notes: `${path.basename(String(spec.file))} @ ${spec.start}s +${spec.duration}s${spec.crop ? `, crop ${spec.crop}` : ''}. ${spec.note ?? 'Replaced by an owner master when one is supplied (request M1).'}`,
  });

  const posterKey = `${spec.key}/poster`;
  const { renditions: pr } = await stillRenditions(posterKey, src, spec.crop, [spec.widths[0]], spec.posterAt);
  record(posterKey, 'image', pr, {
    provenance: spec.provenance ?? 'smash',
    sourceQuality: 'derivative',
    altStatus: 'decorative',
    alt: null,
    source: await sourceStamp(src),
    recipe: { at: spec.posterAt, crop: spec.crop },
    notes: `Poster for ${spec.key}, frame at ${spec.posterAt}s.`,
  });
}

/** Frames from a source at a fixed set of widths. */
async function buildStillsFrom(src, specs, crop, widths, sourceLabel, provenance = 'wordpress') {
  for (const spec of specs) {
    if (!wanted(spec.key)) continue;
    const { renditions, natural } = await stillRenditions(spec.key, src, crop, widths, spec.at);
    record(spec.key, 'image', renditions, {
      provenance,
      sourceQuality: 'web-export',
      // A hero frame sits directly under the project's own <h1>, so it is decorative in
      // the accessibility sense; an editorial still is content and still needs alt text.
      altStatus: spec.key.endsWith('/hero/poster') ? 'decorative' : 'todo',
      alt: null,
      source: { ...await sourceStamp(src), naturalWidth: natural.width, naturalHeight: natural.height },
      recipe: { at: spec.at, crop },
      notes: `Frame at ${spec.at}s of ${path.basename(sourceLabel)}${crop ? `, crop ${crop}` : ''} — ${spec.note}. Owner stills would beat it (M1).`,
    });
  }
}

/** 1/6 — the twenty card stills, from the Phase 0.5 WordPress archive. */
async function buildCardStills(map) {
  for (const p of map.projects) {
    const key = `projects/${p.slug}/poster`;
    if (!wanted(key)) continue;
    if (!p.wordpress?.posterArchived) { log(`  !! no archived poster for ${p.slug}`); continue; }
    const src = path.join(ROOT, p.wordpress.posterArchived);
    if (!existsSync(src)) { log(`  !! archived poster missing on disk for ${p.slug}`); continue; }

    const { renditions, natural } = await stillRenditions(key, src, null, R.STILL_WIDTHS);
    record(key, 'image', renditions, {
      provenance: 'wordpress',
      sourceQuality: 'web-export',
      // Alt text is authored copy and is owner-reviewed in Phase 11b (CLAUDE.md §2.1).
      altStatus: 'todo',
      alt: null,
      source: { ...await sourceStamp(src), naturalWidth: natural.width, naturalHeight: natural.height },
      recipe: { crop: null },
      notes: `From ${p.wordpress.posterArchived} (source ${natural.width}px).`,
    });
  }
}

/** 5/6 — one project's page media. */
async function buildProjectPage(smash, spec) {
  const provenance = spec.smash ? 'smash' : 'wordpress';
  /* A 720p source still needs a master for hero use; a 1080p 17 Mbps card clip does not,
     at the 1140 px the page actually renders. The flag says which, per project. */
  const masterRequired = Boolean(spec.smash);

  const resolve = async (file) => {
    if (!spec.smash) return existsSync(file) ? file : null;
    if (!smash) return null;
    return resolveSource(smash, file);
  };

  if (spec.clip) {
    const src = await resolve(spec.clip.file);
    if (!src) { log(`  !! ${spec.slug}: source not found — ${spec.clip.file}`); return; }
    await buildClip(smash, {
      ...spec.clip,
      key: `projects/${spec.slug}/hero`,
      widths: R.PAGE_HERO_WIDTHS,
      file: src,
      resolved: true,
      provenance,
      masterRequired,
      note: masterRequired
        ? 'Best local source is 720p; replaced by an owner master when one is supplied (request M1).'
        : "The project's own published card loop, 1080p — downscaled to the page's 1140px ceiling, never upscaled.",
    });
  }

  if (spec.heroStill) {
    const src = await resolve(spec.heroStill.file);
    if (!src) { log(`  !! ${spec.slug}: source not found — ${spec.heroStill.file}`); return; }
    await buildStillsFrom(
      src, [{ key: `projects/${spec.slug}/hero/poster`, ...spec.heroStill }],
      spec.heroStill.crop, R.PAGE_STILL_WIDTHS, spec.heroStill.file, provenance,
    );
  }

  if (spec.stills?.length) {
    const from = spec.clip ?? spec.heroStill;
    const src = await resolve(from.file);
    if (!src) return;
    const specs = spec.stills.map((s, i) => ({
      ...s, key: `projects/${spec.slug}/still-${String(i + 1).padStart(2, '0')}`,
    }));
    await buildStillsFrom(src, specs, from.crop, R.PAGE_STILL_WIDTHS, from.file, provenance);
  }
}

/** 6/6 — the static pages' own photographs, and the two team portraits. */
async function buildPageImages() {
  for (const spec of R.PAGE_IMAGES) {
    if (!wanted(spec.key)) continue;
    const src = R.WP(spec.file);
    if (!existsSync(src)) { log(`  !! archived original missing - ${spec.file}`); continue; }

    const { renditions, natural } = await stillRenditions(spec.key, src, null, spec.widths);
    record(spec.key, 'image', renditions, {
      provenance: 'wordpress',
      sourceQuality: 'web-export',
      // The live site ships all four with alt="". Alt text is authored copy and is
      // owner-reviewed in Phase 11b (CLAUDE.md §2.1) — recorded as a gap, not written.
      altStatus: 'todo',
      alt: null,
      source: { ...await sourceStamp(src), naturalWidth: natural.width, naturalHeight: natural.height },
      recipe: { crop: null },
      notes: `From source-archive/wordpress/media/${spec.file} (source ${natural.width}px). ${spec.note}`,
    });
  }
}

/**
 * 7/7 — files the owners uploaded from the admin (phase A4, src/data/media-uploads.json).
 *
 * Their sources live only in the private bucket; `scripts/media-ingest.mjs` downloads the
 * one being processed into media/incoming/<id>/ first. When a source is NOT on disk — a
 * full local rebuild on a machine that never downloaded it — the asset already in the
 * manifest is CARRIED OVER unchanged. Without that, a full rebuild would replace the
 * manifest and silently delete every owner film from the site.
 */
const OWNER_VIDEO_WIDTHS = [1280, 720];

async function buildOwnerUploads(previous) {
  const doc = await readJson(path.join(ROOT, 'src', 'data', 'media-uploads.json'), { uploads: [] });
  for (const u of doc.uploads) {
    if (u.status === 'failed' || !wanted(u.key)) continue;
    const src = path.join(INCOMING, u.id, path.basename(u.source));
    if (!existsSync(src)) {
      for (const k of [u.key, `${u.key}/poster`]) if (previous[k]) items[k] = previous[k];
      if (previous[u.key]) log(`  ${u.key.padEnd(44)} carried over (source not on this machine)`);
      else if (u.status === 'ready') log(`  !! ${u.key}: marked ready but neither its source nor a manifest entry is here`);
      continue;
    }
    const note = `Uploaded in the admin by ${u.by}, ${u.at.slice(0, 10)}: ${u.name}.${u.note ? ` Window avoids: ${u.note}.` : ''}`;
    if (u.kind === 'video') {
      await buildClip(null, {
        key: u.key, file: src, resolved: true, start: u.start, duration: u.duration, crop: null,
        widths: OWNER_VIDEO_WIDTHS, posterAt: u.posterAt, provenance: 'owner', masterRequired: false, note,
      });
    } else {
      const { renditions, natural } = await stillRenditions(u.key, src, null, R.STILL_WIDTHS);
      record(u.key, 'image', renditions, {
        provenance: 'owner',
        sourceQuality: 'owner-upload',
        altStatus: 'todo',
        alt: null,
        source: { ...await sourceStamp(src), naturalWidth: natural.width, naturalHeight: natural.height },
        recipe: { crop: null },
        notes: note,
      });
    }
  }
}

/* ════════════════════════════════════════════════════════════════════ main ══ */

async function main() {
  const map = JSON.parse(await fs.readFile(path.join(ROOT, 'src/data/media-source-map.json'), 'utf8'));
  await fs.mkdir(MIRROR, { recursive: true });
  CACHE = await readJson(CACHE_FILE, {});

  log(`\nProduction media → ${path.relative(ROOT, MIRROR)}/${ONLY ? `  (only: ${ONLY})` : ''}\n`);

  log('1/6  Card stills, all twenty (Phase 0.5 WordPress archive)');
  await buildCardStills(map);

  const smash = findSmash();
  if (!smash) {
    log('\n  !! Smash/ not found in any known location:');
    for (const c of R.SMASH_CANDIDATES) log(`       ${c}`);
    log('     The homepage hero, the feature and the hover loops are skipped, and so is');
    log('     the one project page sourced from Smash. Every project sourced from');
    log('     source-archive/ still builds — those are in the working tree.');
  } else {
    log(`\n2/6  Homepage hero + feature  (source: ${smash})`);
    await buildClip(smash, R.HERO);
    await buildClip(smash, R.FEATURE);

    log('\n3/6  Editorial preview loops');
    for (const spec of R.PREVIEWS) await buildClip(smash, spec);

    log('\n4/6  The representative project (Review D)');
    await buildClip(smash, R.PROJECT_HERO);
    await buildStillsFrom(
      await resolveSource(smash, R.PROJECT_STILL_SOURCE), R.PROJECT_STILLS,
      R.PROJECT_STILL_CROP, R.PROJECT_STILL_WIDTHS, R.PROJECT_STILL_SOURCE, 'smash',
    );
  }

  log('\n5/6  The remaining project pages');
  for (const spec of R.PROJECT_PAGES) await buildProjectPage(smash, spec);

  log('\n6/6  The static pages and the team portraits');
  await buildPageImages();

  const before = (await readJson(MANIFEST_FILE, { items: {} })).items;
  log('\n7/7  Uploaded by the owners in the admin');
  await buildOwnerUploads(before);

  await writeJson(CACHE_FILE, CACHE);

  /**
   * `--only` builds a subset, so it MERGES into the manifest rather than replacing it.
   * A full run replaces, which is how a removed recipe entry leaves the manifest. (Owner
   * uploads are the exception, carried over above whenever their source is not on disk.)
   */
  const previous = ONLY ? before : {};
  const merged = { ...previous, ...items };
  const totalBytes = Object.values(merged).reduce((n, it) => n + (it.bytes ?? 0), 0);

  await writeJson(MANIFEST_FILE, {
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/media-build.mjs',
    note: 'Production media. Keys are storage-agnostic and carry NO URL: src/lib/media.ts joins '
      + 'a rendition path to PUBLIC_MEDIA_BASE_URL, which is the local mirror in development '
      + 'and the R2 delivery host in production. Rendition names are content-addressed, so a '
      + 'name that matches is bytes that match — that is what makes the cache immutable and '
      + 'the sync a set difference. Regenerate with `npm run media:build`.',
    encoder: ENCODER,
    items: merged,
  });

  log(`\nwrote ${path.relative(ROOT, MANIFEST_FILE)} — ${Object.keys(merged).length} assets`);
  log(`${encoded} renditions encoded, ${reused} reused from cache`);
  log(`total delivered payload: ${human(totalBytes)}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
