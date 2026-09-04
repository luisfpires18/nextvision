/**
 * Media resolution — the single seam between content and storage.
 *
 * Components ask for a KEY. They never know whether the bytes are being served from the
 * local mirror, from R2 behind a custom domain, or from somewhere neither of those yet.
 * Changing that is an edit to ONE environment variable and nothing else — no component
 * contains a media URL, and the manifest contains no host (docs/MEDIA_PIPELINE.md).
 *
 * Dimensions come from the manifest, so every <img> ships width/height and there is no
 * layout shift — the classic failure with remote images.
 *
 * Rendition filenames are content-addressed (`1140.a1b2c3d4.webp`), which is what lets the
 * delivery cache be immutable: a changed derivative is a NEW name, so an update never
 * needs a purge and a stale file can never be served.
 */

import manifest from '../data/media-manifest.json' with { type: 'json' };
import { MEDIA_BASE_URL } from '../config/site.ts';

export type MediaProvenance = 'wordpress' | 'smash' | 'master' | 'authored' | 'unknown';
export type SourceQuality = 'master' | 'web-export' | 'derivative' | 'unknown';
export type MediaFormat = 'webp' | 'avif' | 'mp4' | 'webm';

/** One encoded file in the bucket. `path` is an object key, never a URL. */
export interface Rendition {
  format: MediaFormat;
  path: string;
  sha256: string;
  width: number;
  height: number;
  bytes: number;
  contentType: string;
}

export interface MediaItem {
  key: string;
  kind: 'image' | 'video';
  /** Where the bytes live. Everything the pipeline builds is `r2`. */
  storage: 'r2' | 'external';
  contentType: string;
  width: number;
  height: number;
  aspectRatio: number;
  formats: MediaFormat[];
  renditions: Rendition[];
  bytes: number;
  poster?: string | null;
  provenance: MediaProvenance;
  sourceQuality: SourceQuality;
  altStatus: 'written' | 'todo' | 'decorative';
  alt?: string | null;
  /** True when this asset is not good enough for cinematic hero use. */
  masterRequired?: boolean;
  /** Videos only. A sound control is rendered only where there is sound to control. */
  hasAudio?: boolean;
  /** Provenance of the bytes: which file, how big it was, and its natural size. */
  source?: { file: string; size: number; mtimeMs: number; naturalWidth?: number; naturalHeight?: number };
  /** The reviewed decision that produced this derivative — timecode and crop. */
  recipe?: { start?: number; duration?: number; crop?: string | null; at?: number; posterAt?: number };
  notes?: string | null;
}

interface Manifest {
  generatedAt: string;
  items: Record<string, MediaItem>;
}

const MANIFEST = manifest as unknown as Manifest;

export const hasMedia = (key: string): boolean => MANIFEST.items[key] !== undefined;
export const getMedia = (key: string): MediaItem | null => MANIFEST.items[key] ?? null;

/**
 * The ONLY place a delivery host is joined to an object key.
 *
 * `MEDIA_BASE_URL` is `/__media` in development — the local mirror, served straight off
 * disk with no network and no credentials — and the R2 host in production. Nothing else
 * in the codebase concatenates a media path.
 */
export const assetUrl = (objectPath: string): string => `${MEDIA_BASE_URL}/${objectPath}`;

/** Renditions of one asset in one format, narrowest first. */
export function renditions(key: string, format: MediaFormat): (Rendition & { src: string })[] {
  const item = getMedia(key);
  if (!item) return [];
  return item.renditions
    .filter((r) => r.format === format)
    .map((r) => ({ ...r, src: assetUrl(r.path) }));
}

/** The widest rendition in the asset's primary format — its `src` when only one is needed. */
export function mediaUrl(key: string): string | null {
  const item = getMedia(key);
  if (!item) return null;
  const primary = renditions(key, item.kind === 'video' ? 'mp4' : 'webp');
  const chosen = item.kind === 'video' ? primary[0] : primary[primary.length - 1];
  return chosen?.src ?? null;
}

const srcsetOf = (key: string, format: MediaFormat): string | undefined => {
  const list = renditions(key, format);
  return list.length ? list.map((r) => `${r.src} ${r.width}w`).join(', ') : undefined;
};

export interface ImageProps {
  src: string;
  srcset?: string;
  /** AVIF ladder for a <source> ahead of the <img>. ~40% smaller than the WebP beside it. */
  avifSrcset?: string;
  sizes?: string;
  width: number | undefined;
  height: number | undefined;
  alt: string;
  loading: 'lazy' | 'eager';
  decoding: 'async' | 'sync' | 'auto';
  fetchpriority?: 'high' | 'auto';
  style?: string;
  type?: string;
}

/**
 * Everything a `<picture>` needs, derived from the manifest.
 *
 * `priority` marks the LCP image: eager, high priority, never lazy.
 * A missing manifest entry is NOT silently rendered — callers get null and decide,
 * so a broken key surfaces in review instead of shipping as a broken image.
 */
export function imageProps(
  key: string,
  opts: { alt?: string; sizes?: string; priority?: boolean } = {},
): ImageProps | null {
  const item = getMedia(key);
  if (!item) return null;

  const webp = renditions(key, 'webp');
  const widest = webp[webp.length - 1];
  if (!widest) return null;
  const webpSet = srcsetOf(key, 'webp');
  const avifSet = srcsetOf(key, 'avif');

  return {
    src: widest.src,
    ...(webpSet ? { srcset: webpSet } : {}),
    ...(avifSet ? { avifSrcset: avifSet } : {}),
    sizes: opts.sizes ?? '100vw',
    width: item.width,
    height: item.height,
    alt: opts.alt ?? item.alt ?? '',
    loading: opts.priority ? 'eager' : 'lazy',
    decoding: opts.priority ? 'sync' : 'async',
    ...(opts.priority ? { fetchpriority: 'high' as const } : {}),
    ...(item.aspectRatio ? { style: `aspect-ratio:${item.aspectRatio}` } : {}),
  };
}

export interface VideoRendition { label: string; src: string; width: number; height: number; bytes: number }

/**
 * Video sources plus the poster. Poster is required by policy — a video that renders
 * as a black box while it decodes is the live site's bug (audit §9.11).
 *
 * `mp4` is the universal ladder, widest first, and is what every player gets. `webm` is
 * present only on hero-class clips, where the ~20% saving is paid for by a reader who has
 * not asked for anything yet; the runtime prefers it when the browser reports VP9.
 */
export function videoProps(
  key: string,
  opts: { posterKey?: string } = {},
): {
  mp4: VideoRendition[];
  webm: VideoRendition[];
  poster: string | null;
  width: number | undefined;
  height: number | undefined;
  masterRequired: boolean;
  hasAudio: boolean;
} | null {
  const item = getMedia(key);
  if (!item) return null;

  const ladder = (format: MediaFormat): VideoRendition[] =>
    renditions(key, format).map((r) => ({
      label: `${r.width}w`, src: r.src, width: r.width, height: r.height, bytes: r.bytes,
    }));

  const posterKey = opts.posterKey ?? item.poster ?? null;
  return {
    mp4: ladder('mp4'),
    webm: ladder('webm'),
    poster: posterKey ? mediaUrl(posterKey) : null,
    width: item.width,
    height: item.height,
    masterRequired: item.masterRequired ?? false,
    hasAudio: item.hasAudio ?? false,
  };
}

/** YouTube façade thumbnail. No request reaches YouTube until the viewer presses play. */
export const youtubeWatchUrl = (id: string): string => `https://www.youtube.com/watch?v=${id}`;
export const youtubeEmbedUrl = (id: string): string =>
  `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`;

export const manifestMeta = (): { generatedAt: string; count: number } => ({
  generatedAt: MANIFEST.generatedAt,
  count: Object.keys(MANIFEST.items).length,
});
