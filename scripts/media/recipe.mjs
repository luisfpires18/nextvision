/**
 * recipe.mjs — WHAT the production media pipeline builds, and from which frame of which
 * source. Extracted VERBATIM from scripts/build-review-media.mjs in Phase 12; every
 * timecode, crop and justification below is the one that was reviewed in B/C/D and rolled
 * out in Phases 9 and 10. Nothing here was re-chosen.
 *
 * This file holds decisions. scripts/media-build.mjs holds the encoder. Adding a project
 * means adding an entry HERE and running `npm run media:build` — no other file changes.
 * See docs/MEDIA_PIPELINE.md.
 *
 * READ-ONLY against every source. Nothing in Smash/ or source-archive/ is modified,
 * renamed, moved or transcoded in place.
 */

import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '..', '..');


/** Smash/ has moved before. Look, don't assume. */
export const SMASH_CANDIDATES = [
  path.join(ROOT, 'docs', 'Smash'),
  'D:/Workspace/next_vision_info/Smash',
  'D:/Workspace/nextvision_v2/docs/Smash',
  'D:/Workspace/nextvision_v3/docs/Smash',
];

/**
 * HERO — provisional (owner decision N7 / M7).
 *
 * Compared: `We are NVF.mp4`, `NVF Showreel.mp4`, `NVF showreel 2026.mp4`.
 * Reasoning is recorded in docs/HOMEPAGE_REVIEW.md §3. Short version: the 2026 reel is
 * wall-to-wall motion graphics, and `We are NVF` carries an animated wordmark across
 * almost every frame plus a "Coming soon" black tail. `NVF Showreel` has one sustained
 * run of clean, full-frame, caption-free footage at 71–86 s, which is what a hero needs.
 */
export const HERO = {
  key: 'pages/home/hero',
  file: 'NVF Showreel.mp4',
  start: 71,
  duration: 15,
  // Full frame at this timecode — verified with cropdetect (crop=1280:720:0:0).
  crop: null,
  widths: [1280, 720],
  posterAt: 71.6,
};

/**
 * FEATURED PROJECT — the single Projection moment after the hero.
 *
 * `The endless "WAVES"` is the highest-bitrate clean 720p we hold (1 779 kbps) and carries
 * no client branding. Its one caption-free, overlay-free run is 25–31 s.
 */
export const FEATURE = {
  key: 'projects/helder-praia/feature',
  file: 'The endless _WAVES_.mp4',
  start: 25,
  duration: 6,
  // The film is framed with rounded "viewfinder" corners and carries a small rounded-rect
  // overlay near one edge. The crop removes both, so nothing on screen can be mistaken for
  // our own interface. 25-31 s is the only run in this film that is also caption-free.
  crop: '960:640:100:40',
  // Two renditions for the same reason as the hero: a phone should not pull a desktop
  // encode for a frame it renders at 375 CSS px.
  widths: [1200, 720],
  posterAt: 26.5,
};

/**
 * HOVER PREVIEW LOOPS — only where a HIGH-confidence Smash match exists
 * (src/data/media-source-map.json). `Fading.mp4` → helder-museu stays MEDIUM (owner
 * request M3), so that project shows its archived still and no loop. No guessed pairings.
 *
 * Crops come from ffmpeg cropdetect and remove letterbox bars and rounded corners, so
 * object-fit: cover never has to crop through a black band.
 */
export const PREVIEWS = [
  {
    key: 'projects/leonor/preview',
    file: 'Can´t live in you books anymore.mp4',
    // Rounded corners cropped away; 15-21 s carries no burned-in line.
    start: 15, duration: 6, crop: '1140:600:70:60', widths: [960], posterAt: 15.5,
  },
  {
    key: 'projects/nvf-vs-antiqvvm/preview',
    file: 'NVF VS Antiqvvm.mp4',
    // Letterbox removed. 34-40 s sits between two burned-in subtitles.
    start: 34, duration: 6, crop: '1280:590:0:64', widths: [960], posterAt: 35,
  },
  {
    key: 'projects/helder-praia/preview',
    file: 'The endless _WAVES_.mp4',
    // Same clean window as the homepage feature, at grid size.
    start: 25, duration: 6, crop: '960:640:100:40', widths: [720], posterAt: 26.5,
  },
  {
    key: 'projects/nazaryi/preview',
    file: 'Unfinished.mp4',
    // 2.35 letterbox removed (cropdetect). The film is subtitled throughout — at grid
    // size those are the film's own titles, not our interface, so they stay.
    start: 40, duration: 6, crop: '1280:578:0:66', widths: [720], posterAt: 41,
  },
  {
    key: 'projects/ana-reels/preview',
    file: 'The lie we tell ourselves.mp4',
    start: 20, duration: 6, crop: '1280:676:0:22', widths: [720], posterAt: 21,
  },
  {
    key: 'projects/nvf-vs-filmin-details/preview',
    file: 'film in 1 v2.mp4',
    // Letterbox removed. The FILMIN logo bug stays: this is a client film, and at grid
    // size a client credit on a client's project is honest rather than intrusive. It is
    // only the HOMEPAGE that must not carry another company's mark.
    start: 23, duration: 6, crop: '1920:864:0:100', widths: [720], posterAt: 23.5,
  },
];

/**
 * REVIEW D — the representative project page (`leonor`, "Words of our story").
 *
 * Its source is the highest-bitrate clean file we hold (2 037 kbps, verified with ffprobe
 * rather than trusted from the inventory), it carries no client branding of any kind, and
 * its subtitles are sparse enough that six caption-free frames and a caption-free run are
 * all available. Selection reasoning: docs/PROJECT_PAGE_REVIEW.md §1.
 *
 * The crop removes the film's own rounded "viewfinder" corners. Every timecode below was
 * chosen off a second-by-second scan; each one is caption-free.
 */
export const PROJECT_HERO = {
  key: 'projects/leonor/hero',
  file: 'Can´t live in you books anymore.mp4',
  // Walking, wide, sea horizon. Calm enough to carry a title, and it loops without a cut.
  start: 19.2,
  duration: 4.6,
  crop: '1140:600:70:60',
  // 1140 is the crop's real width. Asking for 1280 would upscale, and an upscaled hero
  // pretending to be a master is exactly what this project must not ship.
  widths: [1140, 720],
  posterAt: 20,
};

/**
 * Six frames from the film, in the order they occur in it. They are stills of NVF's own
 * work, pulled from the piece they belong to — not decoration, and not sourced from
 * anywhere else. Owner-supplied stills would beat them (request M1).
 */
export const PROJECT_STILLS = [
  { key: 'projects/leonor/still-01', at: 8.5,  note: 'wide — the figure small on the rocks' },
  { key: 'projects/leonor/still-02', at: 19.5, note: 'portrait on the rocks' },
  { key: 'projects/leonor/still-03', at: 26,   note: 'close, waves breaking behind' },
  { key: 'projects/leonor/still-04', at: 37.5, note: 'crouched, wet' },
  { key: 'projects/leonor/still-05', at: 41.5, note: 'lying, arm out' },
  { key: 'projects/leonor/still-06', at: 47.5, note: 'wide — the pool between the rocks' },
];
export const PROJECT_STILL_SOURCE = 'Can´t live in you books anymore.mp4';
export const PROJECT_STILL_CROP = '1140:600:70:60';
/**
 * The crop is 1140px wide, so that is the ceiling. The page is designed around this
 * number rather than around a viewport: the film's own resolution sets the layout's
 * maximum, which is why the hero is projected inside the dark room instead of being
 * stretched across it.
 */
export const PROJECT_STILL_WIDTHS = [560, 900, 1140];

/**
 * `nvf-vs-filmin-details` carries a permanent FILMIN logo bug and a green-screen client
 * card, so it is deliberately NOT the homepage hero. It appears in the portfolio, where a
 * client credit on a client's project is exactly right.
 */

/* ════════════════════════════════════════════════════════ PHASE 9 — rollout ══
 *
 * The finding that shaped this table: `src/data/media-source-map.json` originally graded
 * only `docs/Smash/` and reported nineteen of twenty projects as having no hero-capable
 * source. It had never probed the other shelf. The eight `.mov` card loops preserved from
 * WordPress are **1920x1080 at ~17 Mbps** — the best footage we hold for those projects,
 * each roughly five seconds long, and each chosen by NVF themselves as that project's
 * representative loop. `film in 1 v2` / `FILM-IN-video-2-sem-nvf-v2.mp4` adds a ninth at
 * 1080p and 28 seconds.
 *
 * So the sourcing rule for a project page is:
 *
 *   1. the project's own published clip, trimmed to a run that is free of burned-in
 *      captions, light-leak transitions and client end cards;
 *   2. a frame from that clip, where no run is long enough to loop honestly;
 *   3. the published poster, where we hold no footage at all.
 *
 * Every window below was chosen off a frame-by-frame scan and each one records what it
 * is avoiding, so a regenerated file is identical to the one that was reviewed. Widths
 * never exceed the source: 1140 is the page's ceiling and every source here is wider.
 *
 * Nothing is upscaled, nothing is invented, and no ambiguous match is used —
 * `Fading.mp4`, `In the end.mp4`, `Sometimes it´s just the start (1).mp4` and
 * `Don´t let it fool you.mp4` are all still unconfirmed (M2, M3, M-A / D6), and none of
 * them is touched. helder-museu and the-end are sourced from their OWN published clips
 * instead, which needs no owner decision at all.
 */

/** Archived WordPress originals. Present in the repo working tree, gitignored. */
export const WP = (rel) => path.join(ROOT, 'source-archive', 'wordpress', 'media', rel);

/** The film's own resolution is the ceiling. 1140 desktop, 720 phone. */
export const PAGE_HERO_WIDTHS = [1140, 720];
/** Same three widths as every other still on a project page. */
export const PAGE_STILL_WIDTHS = [560, 900, 1140];

export const PROJECT_PAGES = [
  {
    slug: 'helder-praia',
    // The film is framed with rounded viewfinder corners AND carries a rounded-rect
    // overlay on the LEFT at x 130-340, y 410-670. The crop removes both. A light-leak
    // flash at 0.83 s is what the window starts after.
    clip: { file: WP('2025/02/helder_praia.mov'), start: 1.2, duration: 3.7, crop: '1440:810:400:150', posterAt: 3.0 },
    stills: [
      { at: 1.5, note: 'the figure and the chair against the low sun' },
      { at: 2.9, note: 'mid-dune, the light flattening' },
      { at: 4.7, note: 'further along, the sea behind' },
    ],
  },
  {
    slug: 'helder-museu',
    // 2.21:1 letterbox removed. One continuous take, standing to lying, no captions
    // anywhere in it. This is the project's own clip — `Fading.mp4` stays unused (M3).
    clip: { file: WP('2025/02/helder_museu.mov'), start: 0.2, duration: 5.0, crop: '1920:868:0:106', posterAt: 1.0 },
    stills: [
      { at: 0.5, note: 'standing at the console table' },
      { at: 2.3, note: 'seated, legs crossed' },
      { at: 4.8, note: 'lying along the table' },
    ],
  },
  {
    slug: 'the-end',
    // Two shots. The cut is at 1.30 s; the window is the second, which runs clean to the
    // end. Sourced from the project's own clip, so M2 stays open and unanswered.
    clip: { file: WP('2025/02/the_end.mov'), start: 1.35, duration: 3.5, crop: null, posterAt: 2.6 },
    stills: [
      { at: 0.5, note: 'the close two-shot, before the cut' },
      { at: 4.5, note: 'the wide — the dune and the sea' },
    ],
  },
  {
    slug: 'ana-e-filipe-metro',
    // Subtitle "Oh really?" runs to 1.45 s; the cut to the camcorder shot is at 4.50 s.
    // The window is the caption-free middle. `Don´t let it fool you.mp4` is NOT used —
    // it is the ambiguous file at the centre of D6 / M-A.
    clip: { file: WP('2025/02/ana_e_filipe_metro.mov'), start: 1.55, duration: 2.85, crop: null, posterAt: 2.5 },
    stills: [
      { at: 1.7, note: 'the two-shot across the carriage' },
      { at: 4.7, note: 'the camcorder — the last shot of the clip' },
    ],
  },
  {
    slug: 'ana-reels',
    // Slight letterbox removed. One continuous night walk, no burned-in line anywhere.
    clip: { file: WP('2025/02/ana_reels.mov'), start: 0.1, duration: 4.6, crop: '1920:1012:0:34', posterAt: 2.0 },
    stills: [
      { at: 0.6, note: 'the far end of the walk, the lit quay behind' },
      { at: 4.3, note: 'close, the city out of focus' },
    ],
  },
  {
    slug: 'nazaryi',
    // 2.35 letterbox removed. The burned-in line "i should call and say" arrives at
    // 2.90 s, so the caption-free run is everything before it.
    clip: { file: WP('2025/02/nazaryi.mov'), start: 0.05, duration: 2.75, crop: '1920:866:0:100', posterAt: 0.8 },
    stills: [
      { at: 0.3, note: 'the two figures still standing' },
      { at: 2.6, note: 'the field alone, the sun on the horizon' },
    ],
  },
  {
    slug: 'paradox-of-affection',
    // NO LOOP. The clip is a montage: van (0.25-1.0), field (1.25-2.0, carries the
    // viewfinder overlay), cliff (2.5-3.0), beach (3.75-4.25) — every shot separated by a
    // light-leak burn, and the last frames carry a decorative script overlay. No run is
    // long enough to loop honestly, so the hero is a frame and the page says so.
    heroStill: { file: WP('2025/02/paradox_of_affection.mov'), at: 0.5, crop: null, note: 'the van and the bear, before the first burn' },
    stills: [
      { at: 2.75, note: 'the two figures on the cliff' },
      { at: 4.0, note: 'the three of them at the water' },
    ],
  },
  {
    slug: 'nvf-vs-filmin-details',
    // The archived WordPress master, not the Smash copy of it — same content, and this
    // one lives in source-archive/ where the build can always reach it. Letterbox removed.
    // The FILMIN logo bug is on every frame and STAYS: this is a client film, and a client
    // credit on the client's own project is honest. Title card ends at 5.2 s and the line
    // "Hidden in the details is" arrives at 10.0 s.
    clip: { file: WP('2025/04/FILM-IN-video-2-sem-nvf-v2.mp4'), start: 5.3, duration: 4.6, crop: '1920:864:0:100', posterAt: 8.2 },
    stills: [
      { at: 8.0, note: 'the figure against the projected wall' },
      { at: 20.0, note: 'the close — the frame the poster is cut from' },
    ],
  },
  {
    slug: 'nvf-vs-antiqvvm',
    // The only project here with no 1080p source. Smash is 720p, so 1140 is the top of
    // its ladder and nothing above it is built. Letterbox removed. The film is subtitled
    // almost throughout and closes on an ANTIQVVM.PT end card at 58 s; 34-40 s is the one
    // sustained caption-free run, and the still timecodes are the three other gaps.
    smash: true,
    // 4.5 s rather than the full 6 s of the gap: at 6 s this was the heaviest loop on the
    // site (302 KB against leonor's 206 KB) for a busy, high-detail plating shot, and the
    // extra second and a half bought nothing a viewer would notice.
    clip: { file: 'NVF VS Antiqvvm.mp4', start: 34.5, duration: 4.5, crop: '1280:590:0:64', posterAt: 35 },
    stills: [
      { at: 14, note: 'the fish on the plate, before the sauce' },
      { at: 26, note: 'the ravioli under seafoam' },
      { at: 46, note: 'coriander oil across the foam' },
    ],
  },
];

/* PHASE 10 - the static pages =============================================
 *
 * Four images, all of them the pages' OWN published photographs, taken from the Phase 0.5
 * WordPress archive rather than from anywhere else. Nothing is sourced by resemblance and
 * nothing is borrowed from the portfolio: each file is the one the live page publishes at
 * that position.
 *
 * The ladder is capped at the original's width in every case, so none of them is
 * upscaled - which matters most for `pages/servicos/lead`, whose original is only 624px
 * and therefore can never be a full-bleed plate.
 */
export const PAGE_IMAGES = [
  {
    key: 'team/francisco-cardoso/portrait',
    file: '2025/08/WhatsApp-Image-2025-08-07-at-18.16.31_99256236.jpg',
    widths: [420, 836],
    // The live /sobre/ pairs this photograph with Francisco Cardoso's name and role. The
    // pairing is the source's, not ours (docs/STATIC_PAGES_ROLLOUT.md, question P1).
    note: 'Team portrait as published on /sobre/, paired there with Francisco Cardoso.',
  },
  {
    key: 'team/helder-afonso/portrait',
    file: '2025/02/Helder-Afonso-1-scaled-700x1000-1-e1745226778827.jpeg',
    widths: [350, 700],
    note: 'Team portrait as published on /sobre/, paired there with Helder Afonso.',
  },
  {
    key: 'pages/servicos/lead',
    file: '2025/02/servicos3NextVision.jpg',
    // 624px is the whole original. It is the page's own og:image and its only photograph,
    // and it is far too small to run full bleed - so the layout gives it a column, never
    // the page width.
    widths: [312, 624],
    note: "The /servicos/ lead image and og:image, at its own 624px ceiling.",
  },
  {
    key: 'pages/contactos/banner',
    file: '2025/04/banner-contactos-2-e1744213581116.jpg',
    widths: [820, 1200, 1640],
    note: 'The /contactos/ banner and og:image. 1640x644 - the one page image wide enough to be a plate.',
  },
];

/**
 * STILLS. Projects without a reviewed local source use the Phase 0.5 WordPress archive —
 * which is the same still the live site publishes, so nothing is invented or upgraded.
 */
/**
 * STILLS: null means "every project in the source map" — the portfolio index shows all
 * twenty, so all twenty need a derivative.
 */
export const STILLS = null;

/**
 * Three widths per still, so a phone does not download a 1400px file for a 343px frame.
 * The largest is 1400 because the full-bleed plates run edge to edge; the smallest covers
 * a 375px column at 1.5x.
 */
export const STILL_WIDTHS = [560, 960, 1400];
export const STILL_WIDTH = 1400;
export const STILL_QUALITY = 76;
/** Loops are decorative and muted; CRF can be modest. Nothing here is the film itself. */
export const CRF = 30;
