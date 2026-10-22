/**
 * The media an owner can pick for a field, shared by every editor: a still where a still
 * goes, a film with its own poster where a film goes, grouped by where each comes from.
 */
import { allMedia, getMedia, renditions } from '../lib/media.ts';

export const thumb = (key: string): string => {
  const item = getMedia(key);
  const still = item?.kind === 'video' ? `${key}/poster` : key;
  return renditions(still, 'webp')[0]?.src ?? '';
};

/** The candidates for each kind, grouped by where they come from (`projects/leonor`). */
const options = (kind: 'image' | 'video') => {
  // A video's own poster (`…/hero/poster`) belongs to that video, not to the image list.
  // A project's poster (`projects/x/poster`) is a still like any other and stays in.
  const isVideoPoster = (key: string) => key.endsWith('/poster') && getMedia(key.slice(0, -'/poster'.length))?.kind === 'video';
  const items = allMedia().filter((m) => (kind === 'image'
    ? m.kind === 'image' && !isVideoPoster(m.key)
    : m.kind === 'video' && getMedia(`${m.key}/poster`) !== null));
  const groups = new Map<string, string[]>();
  for (const m of items) {
    const group = m.key.split('/').slice(0, 2).join('/');
    groups.set(group, [...(groups.get(group) ?? []), m.key]);
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b));
};

export const MEDIA = { image: options('image'), video: options('video') };
