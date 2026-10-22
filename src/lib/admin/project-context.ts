/**
 * What a project edit is checked against, from the build: the categories that exist and
 * what each media key is. Kept apart from projects.ts so that file stays free of the
 * build's modules and the test can pass its own.
 */
import { getMedia, hasMedia } from '../media.ts';
import { getCollection } from 'astro:content';
import type { ProjectContext } from './projects.ts';

export const projectContext = async (): Promise<ProjectContext> => ({
  categories: new Set((await getCollection('categories')).map((c) => c.id)),
  mediaKind: (key) => {
    const m = getMedia(key);
    if (m?.kind === 'video') return hasMedia(`${key}/poster`) ? 'video' : null;
    // A video's own poster belongs to that video, not to the image list.
    if (m?.kind === 'image' && !(key.endsWith('/poster') && getMedia(key.slice(0, -'/poster'.length))?.kind === 'video')) return 'image';
    return null;
  },
});
