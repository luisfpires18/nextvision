#!/usr/bin/env node
/**
 * build-media-source-map.mjs
 *
 * Cross-maps every portfolio project against its three possible media sources —
 * WordPress uploads, YouTube, and the owner's docs/Smash/ folder — then records
 * the preferred source for each *role* (poster, hover preview, full film, hero).
 *
 * Emits:
 *   src/data/media-source-map.json       consumed by the app + future media pipeline
 *   docs/source-archive/media-source-map.json   same payload, preservation copy
 *
 * Rules (from docs/ARCHITECTURE.md §6.7 and the session brief):
 *   - Smash/ is NOT assumed to be a master merely because a file exists there.
 *   - Any hero source below 1080p / ~8 Mbps is flagged MASTER_REQUIRED.
 *   - Matches are never invented from weak filename similarity. Every match
 *     carries an explicit `basis` and `confidence`.
 *
 * Reads Smash technical metadata via ffprobe when available; otherwise falls
 * back to the recorded inventory so the script still runs without ffmpeg.
 */

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, '..');

/**
 * Smash/ has moved between machines and checkouts before, and it is gitignored, so a
 * hard-coded path turns a re-run into a crash rather than a report. Look, don't assume —
 * the same candidate list scripts/build-review-media.mjs uses.
 */
const SMASH_CANDIDATES = [
  path.join(ROOT, 'docs', 'Smash'),
  'D:/Workspace/next_vision_info/Smash',
  'D:/Workspace/nextvision_v2/docs/Smash',
  'D:/Workspace/nextvision_v3/docs/Smash',
];
const SMASH_DIR = SMASH_CANDIDATES.find((c) => existsSync(c)) ?? null;

/** Quality floor for a cinematic hero / fullscreen block. Below this → MASTER_REQUIRED. */
const HERO_MIN_HEIGHT = 1080;
const HERO_MIN_BITRATE = 8_000_000;

/**
 * Reviewed Smash → project matches.
 *
 * Every row states WHY. `confidence: 'none'` rows are files with no project.
 * Nothing here is inferred from filename resemblance alone — see `basis`.
 */
const SMASH_MATCHES = [
  { file: 'Can´t live in you books anymore.mp4', slug: 'leonor', confidence: 'high',
    basis: "Project tagline ends «I can't live in your book anymore.»" },
  { file: 'The lie we tell ourselves.mp4', slug: 'ana-reels', confidence: 'high',
    basis: 'Exact project title «The Lie we tell ourselves»' },
  { file: 'The endless _WAVES_.mp4', slug: 'helder-praia', confidence: 'high',
    basis: 'Exact project title «The endless "WAVES"» (underscores stand in for quotes)' },
  { file: 'Unfinished.mp4', slug: 'nazaryi', confidence: 'high',
    basis: 'Exact project title «Unfinished»' },
  { file: 'NVF VS Antiqvvm.mp4', slug: 'nvf-vs-antiqvvm', confidence: 'high',
    basis: 'Exact project slug' },
  { file: 'NVF VS Filmin.mp4', slug: 'nvf-vs-filmin-details', confidence: 'high',
    basis: 'Exact project slug' },
  { file: 'film in 1 v2.mp4', slug: 'nvf-vs-filmin-details', confidence: 'high', role: 'master',
    basis: 'Matches WordPress FILM-IN-video-2-sem-nvf-v2.mp4; 1080p 14 Mbps — the master of the above' },
  { file: 'Don´t let it fool you.mp4', slug: null, confidence: 'ambiguous',
    candidates: ['ana-e-filipe-metro', 'dont-let-it-fool-you'],
    basis: 'Title matches BOTH halves of the known duplicate pair (audit §9.7 / decision D6). Owner must disambiguate — see M-A' },
  { file: 'Fading.mp4', slug: 'helder-museu', confidence: 'medium',
    basis: 'Taglines of BOTH helder-museu and helder-praia end «…Fading»; helder-praia already has its own file, so this is probably helder-museu. NOT confirmed — see M3' },
  { file: 'In the end.mp4', slug: 'the-end', confidence: 'medium',
    basis: 'Title similarity to «The End»; conflicts with the file below — see M2' },
  { file: 'Sometimes it´s just the start (1).mp4', slug: 'the-end', confidence: 'medium',
    basis: 'Project tagline is «"THE END" sometimes is just a start.»; conflicts with the file above — see M2' },

  { file: 'NVF Showreel.mp4', slug: null, confidence: 'confirmed', kind: 'showreel',
    basis: 'Duration 189.10 s exactly matches WordPress orphan vcompress_210.mov (3:09) — same content' },
  { file: 'NVF showreel 2026.mp4', slug: null, confidence: 'confirmed', kind: 'showreel',
    basis: 'Newer showreel, not published on the website. Which showreel is current is decision R9' },
  { file: 'We are NVF.mp4', slug: null, confidence: 'confirmed', kind: 'brand',
    basis: 'Duration 20.09 s exactly matches WordPress orphan videoplayback.mp4 (0:20). The live homepage hero We-are-NVF-copia.mp4 is a 16 s cut of this' },

  { file: 'Celebrate Pride with Dr Bernard (1).mp4', slug: null, confidence: 'none', kind: 'unpublished',
    basis: 'No matching project on the live site' },
  { file: 'DigiUp anúncio.mp4', slug: null, confidence: 'none', kind: 'unpublished',
    basis: 'Advert for digiUP, the agency credited in the site footer. Not a published project' },
  { file: 'Helder Vs Karl Largerfeld.mp4', slug: null, confidence: 'none', kind: 'unpublished',
    basis: 'The published fashion project is «Yves Saint Laurent» (helder-museu) — a DIFFERENT designer. Possible mislabel or separate unpublished piece — see M4' },
  { file: 'Prato 2 v1.mov', slug: null, confidence: 'none', kind: 'unpublished',
    basis: 'Gastronomy. 1080p ~18 Mbps PCM — a genuine master. No matching project' },
  { file: 'Prato sobremesa v1.mov', slug: null, confidence: 'none', kind: 'unpublished',
    basis: 'Gastronomy, same series. 1080p ~18 Mbps PCM master. No matching project' },
  { file: 'Video Long Version O Gato que Bebe.mp4', slug: null, confidence: 'none', kind: 'unpublished',
    basis: 'No matching project. «Long Version» implies a shorter cut also exists' },
];

const OPEN_QUESTIONS = {
  'M-A': 'Which project does «Don´t let it fool you.mp4» belong to — ana-e-filipe-metro or dont-let-it-fool-you? (decision D6)',
  M1: 'Supply true masters (ProRes/DNxHR or >=1080p high-bitrate, 4K where it exists) for every project intended to have a cinematic hero.',
  M2: 'Which of «In the end.mp4» / «Sometimes it´s just the start (1).mp4» is The End? Teaser vs full film?',
  M3: 'Confirm «Fading.mp4» belongs to Yves Saint Laurent (helder-museu).',
  M4: 'Clarify «Helder Vs Karl Largerfeld» against the published «Yves Saint Laurent».',
  M5: 'Should the six unpublished pieces and the 2026 showreel be added to the portfolio?',
  M6: 'Are masters available for the 10 projects with no local source file — especially the five weddings?',
  M7: 'Which showreel is current — NVF Showreel (3:09) or NVF showreel 2026 (0:55)?',
};

async function probe(file) {
  try {
    const { stdout } = await exec('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration,bit_rate',
      '-show_entries', 'stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt',
      '-of', 'json', file,
    ], { maxBuffer: 8 * 1024 * 1024 });
    const j = JSON.parse(stdout);
    const v = (j.streams ?? []).find((s) => s.codec_type === 'video') ?? {};
    const a = (j.streams ?? []).find((s) => s.codec_type === 'audio');
    return {
      durationSec: +(+j.format?.duration || 0).toFixed(2),
      bitrate: +j.format?.bit_rate || null,
      width: v.width ?? null,
      height: v.height ?? null,
      codec: v.codec_name ?? null,
      pixFmt: v.pix_fmt ?? null,
      fps: v.r_frame_rate ? +(eval(v.r_frame_rate)).toFixed(2) : null,
      hasAudio: Boolean(a),
    };
  } catch {
    return null;
  }
}

/** Is this file good enough to cut a cinematic hero from? */
function heroVerdict(tech) {
  if (!tech) return { ok: false, reason: 'technical metadata unavailable' };
  if ((tech.height ?? 0) < HERO_MIN_HEIGHT) return { ok: false, reason: `${tech.width}x${tech.height} is below ${HERO_MIN_HEIGHT}p` };
  if ((tech.bitrate ?? 0) < HERO_MIN_BITRATE) return { ok: false, reason: `${Math.round((tech.bitrate ?? 0) / 1000)} kbps is below the ${HERO_MIN_BITRATE / 1000} kbps floor` };
  return { ok: true, reason: `${tech.width}x${tech.height} at ${Math.round(tech.bitrate / 1000)} kbps` };
}

/**
 * A source that clears the quality floor but is only a few seconds long is hero-capable
 * for a LOOP and for stills, and for nothing else.
 *
 * The distinction matters because the first version of this map graded only `Smash/` and
 * assumed the WordPress `.mov` card loops were the same class of web export. They are
 * not: measured with ffprobe they are 1920x1080 at ~17 Mbps — the highest-quality footage
 * we hold for eight of the twenty projects — and each is roughly five seconds long. A
 * project can therefore have an honest 1080p hero loop and still need a master for any
 * cinematic use longer than its own card clip.
 */
const LOOP_MIN_SECONDS = 2.5;
function loopVerdict(tech) {
  const v = heroVerdict(tech);
  if (!v.ok) return { ok: false, reason: v.reason };
  if ((tech.durationSec ?? 0) < LOOP_MIN_SECONDS) {
    return { ok: false, reason: `${tech.durationSec}s is shorter than the ${LOOP_MIN_SECONDS}s loop floor` };
  }
  return { ok: true, reason: `${v.reason}, ${tech.durationSec}s — enough for a loop and stills, not for a long cut` };
}

async function main() {
  const projects = JSON.parse(await fs.readFile(path.join(ROOT, 'docs/content/portfolio_items.json'), 'utf8'));

  let mediaArchive = null;
  try {
    mediaArchive = JSON.parse(await fs.readFile(path.join(ROOT, 'docs/source-archive/media-archive.json'), 'utf8'));
  } catch { /* archive not built yet */ }

  // ---- Smash inventory, probed
  if (!SMASH_DIR) {
    console.warn('  !! Smash/ not found in any known location; the inventory will be empty:');
    for (const c of SMASH_CANDIDATES) console.warn(`       ${c}`);
  }
  const smashFiles = SMASH_DIR
    ? (await fs.readdir(SMASH_DIR)).filter((f) => /\.(mp4|mov|webm|m4v)$/i.test(f)).sort()
    : [];
  const smash = [];
  for (const f of smashFiles) {
    const full = path.join(SMASH_DIR, f);
    const stat = await fs.stat(full);
    const tech = await probe(full);
    // Filenames carry accents (´, ú). macOS writes NFD, Windows/our literals are NFC,
    // so normalise both sides before comparing or the match silently fails.
    const key = f.normalize('NFC');
    const match = SMASH_MATCHES.find((m) => m.file.normalize('NFC') === key)
      ?? { file: f, slug: null, confidence: 'none', basis: 'Not reviewed — new file since the 2026-09-02 inventory' };
    smash.push({
      file: f,
      localPath: `docs/Smash/${f}`,
      bytes: stat.size,
      sizeMB: +(stat.size / 1048576).toFixed(2),
      tech,
      heroCapable: heroVerdict(tech),
      match: { slug: match.slug ?? null, confidence: match.confidence, basis: match.basis, kind: match.kind ?? null, candidates: match.candidates ?? null },
    });
  }
  const unreviewed = smash.filter((s) => s.match.basis.startsWith('Not reviewed'));
  if (unreviewed.length) console.warn(`  !! ${unreviewed.length} Smash file(s) are new and unmatched:`, unreviewed.map((s) => s.file));

  const smashBySlug = new Map();
  for (const s of smash) {
    if (!s.match.slug) continue;
    if (!smashBySlug.has(s.match.slug)) smashBySlug.set(s.match.slug, []);
    smashBySlug.get(s.match.slug).push(s);
  }

  // ---- WordPress media, indexed by filename
  const wpByFile = new Map();
  for (const item of mediaArchive?.items ?? []) {
    if (!item.localPath) continue;
    wpByFile.set(path.basename(item.localPath), item);
  }
  const wpLookup = (url) => (url ? wpByFile.get(path.basename(decodeURIComponent(new URL(url).pathname))) ?? null : null);

  /**
   * The card loops the live site publishes, per the audit's observed card→video mapping
   * (docs/WEBSITE_AUDIT.md §4.3 and the media table beneath it). These are the project's
   * OWN footage, chosen by NVF, and each one is probed here rather than assumed.
   */
  const WP_CARD_PREVIEWS = {
    'the-end': 'the_end.mov', 'helder-museu': 'helder_museu.mov', 'leonor': 'leonor.mov',
    'helder-praia': 'helder_praia.mov', 'ana-reels': 'ana_reels.mov',
    'ana-e-filipe-metro': 'ana_e_filipe_metro.mov', 'paradox-of-affection': 'paradox_of_affection.mov',
    'nazaryi': 'nazaryi.mov', 'nvf-vs-filmin-details': 'FILM-IN-video-2-sem-nvf-v2.mp4',
  };
  const wpPreviewBySlug = new Map();
  for (const [slug, filename] of Object.entries(WP_CARD_PREVIEWS)) {
    const rec = wpByFile.get(filename);
    if (!rec?.localPath) continue;
    const full = path.join(ROOT, rec.localPath);
    const tech = existsSync(full) ? await probe(full) : null;
    wpPreviewBySlug.set(slug, {
      filename,
      archived: rec.localPath,
      sha256: rec.sha256 ?? null,
      sizeMB: rec.sizeMB ?? null,
      tech,
      heroCapable: heroVerdict(tech),
      loopCapable: loopVerdict(tech),
    });
  }

  // ---- per-project map
  const entries = projects.map((p) => {
    const ytId = extractYouTubeId(p.youtube);
    const smashHits = smashBySlug.get(p.slug) ?? [];
    const best = [...smashHits].sort((a, b) => (b.tech?.height ?? 0) - (a.tech?.height ?? 0) || (b.tech?.bitrate ?? 0) - (a.tech?.bitrate ?? 0))[0] ?? null;

    const posterWp = wpLookup(p.poster);
    const wpPreview = wpPreviewBySlug.get(p.slug) ?? null;

    /**
     * The hero source is whichever HELD file actually clears the floor — Smash or the
     * archived WordPress clip. Grading only one of the two shelves was the defect this
     * map shipped with, and it under-reported the material by eight projects.
     */
    const heroOk = best?.heroCapable?.ok ?? false;
    const loopOk = wpPreview?.loopCapable?.ok ?? false;

    const warnings = [];
    if (!ytId) warnings.push('NO_VALID_YOUTUBE_ID');
    if (p.youtube && /studio\.youtube\.com/.test(p.youtube)) warnings.push('YOUTUBE_URL_IS_A_STUDIO_EDIT_LINK');
    if (!posterWp) warnings.push('POSTER_NOT_IN_WORDPRESS_ARCHIVE');
    if (!smashHits.length && !wpPreview) warnings.push('NO_LOCAL_SOURCE');
    else if (!smashHits.length) warnings.push('NO_SMASH_SOURCE');
    // A short 1080p loop is not a master. Both facts are recorded, neither is rounded off.
    if (!heroOk) warnings.push('MASTER_REQUIRED');
    if (!heroOk && loopOk) warnings.push('LOOP_CAPABLE_1080P');
    if (smashHits.length > 1) warnings.push('MULTIPLE_SMASH_CANDIDATES');

    return {
      slug: p.slug,
      title: p.h1,
      legacyCategory: p.category,
      wordpress: {
        poster: p.poster ?? null,
        posterArchived: posterWp?.localPath ?? null,
        posterSha256: posterWp?.sha256 ?? null,
        ogImage: p.ogimg ?? null,
        previewVideo: wpPreview
          ? {
              filename: wpPreview.filename, archived: wpPreview.archived,
              sha256: wpPreview.sha256, sizeMB: wpPreview.sizeMB,
              tech: wpPreview.tech, loopCapable: wpPreview.loopCapable,
            }
          : null,
      },
      youtube: { id: ytId, rawValue: p.youtube ?? null, url: ytId ? `https://www.youtube.com/watch?v=${ytId}` : null },
      smash: smashHits.map((s) => ({ file: s.file, sizeMB: s.sizeMB, tech: s.tech, confidence: s.match.confidence, basis: s.match.basis })),
      preferredSource: {
        poster: posterWp ? { from: 'wordpress', ref: p.poster } : { from: 'UNKNOWN', ref: null },
        hoverPreview: best
          ? { from: 'smash', ref: best.file, note: 'Crop to <=6 s, strip audio, 720p is acceptable for a silent loop' }
          : wpPreview
            ? { from: 'wordpress', ref: wpPreview.filename, note: 'Existing hover loop; re-encode to MP4 + WebM, strip audio' }
            : { from: 'UNKNOWN', ref: null, note: 'No local source; a preview clip must be supplied or the card ships still-only' },
        fullFilm: ytId ? { from: 'youtube', ref: ytId } : { from: 'UNKNOWN', ref: null },
        /**
         * Three states, not two. A held 1080p card clip is a real hero source for a loop
         * and for stills; it is still not a master, and saying so is the whole point of
         * this file.
         */
        hero: heroOk
          ? { from: 'smash', ref: best.file, scope: 'full', note: best.heroCapable.reason }
          : loopOk
            ? { from: 'wordpress', ref: wpPreview.filename, scope: 'loop+stills', note: wpPreview.loopCapable.reason }
            : { from: 'MASTER_REQUIRED', ref: null, scope: 'none', note: best ? `Best local source is ${best.file} — ${best.heroCapable.reason}` : 'No local source file exists for this project' },
      },
      sourceQualityWarning: warnings.length ? warnings : null,
    };
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/build-media-source-map.mjs',
    rules: {
      heroFloor: { minHeight: HERO_MIN_HEIGHT, minBitrate: HERO_MIN_BITRATE },
      note: 'Smash/ is not treated as a master source merely because a file exists. Every project whose best local source is below the hero floor is marked MASTER_REQUIRED.',
    },
    counts: {
      projects: entries.length,
      withYouTube: entries.filter((e) => e.youtube.id).length,
      withSmash: entries.filter((e) => e.smash.length).length,
      heroReady: entries.filter((e) => e.preferredSource.hero.scope === 'full').length,
      loopCapable: entries.filter((e) => e.preferredSource.hero.scope === 'loop+stills').length,
      noLocalHeroSource: entries.filter((e) => e.preferredSource.hero.scope === 'none').length,
      masterRequired: entries.filter((e) => e.sourceQualityWarning?.includes('MASTER_REQUIRED')).length,
      previewUnknown: entries.filter((e) => e.preferredSource.hoverPreview.from === 'UNKNOWN').length,
    },
    projects: entries,
    smashInventory: smash,
    unmatchedSmash: smash.filter((s) => !s.match.slug),
    openQuestions: OPEN_QUESTIONS,
  };

  await fs.mkdir(path.join(ROOT, 'src/data'), { recursive: true });
  await fs.mkdir(path.join(ROOT, 'docs/source-archive'), { recursive: true });
  const json = JSON.stringify(payload, null, 1);
  await fs.writeFile(path.join(ROOT, 'src/data/media-source-map.json'), json);
  await fs.writeFile(path.join(ROOT, 'docs/source-archive/media-source-map.json'), json);

  console.log(JSON.stringify(payload.counts, null, 1));
  console.log(`\nunmatched Smash files: ${payload.unmatchedSmash.length}`);
  for (const e of entries.filter((x) => x.sourceQualityWarning)) {
    console.log(`  ${e.slug.padEnd(24)} ${e.sourceQualityWarning.join(', ')}`);
  }
}

/** Accepts only a real 11-char YouTube id; rejects Studio edit links and bare paths. */
function extractYouTubeId(raw) {
  if (!raw) return null;
  if (/studio\.youtube\.com/i.test(raw)) return null;
  const m = raw.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/);
  return m ? m[1] : null;
}

main().catch((e) => { console.error(e); process.exit(1); });
