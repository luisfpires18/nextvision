/**
 * New media from the owners (phase A4): what a request may ask for, and how it is recorded.
 *
 * An owner uploads FOR a field — the homepage film, a collage image — never into a free
 * library: the admin runs on the live site and can only show media the live site has, so
 * a file is processed and attached in one step and appears in the preview like any save
 * (docs/ADMIN_DASHBOARD_PLAN.md §4.1). The request is one entry appended to
 * `src/data/media-uploads.json`; `scripts/media-ingest.mjs` in CI does the encoding, sets
 * the field, and marks the entry ready or failed with the reason.
 *
 * The rules, all refusals rather than corrections:
 *   - only a field the screen offers, and not a locked one;
 *   - the file's kind must be the field's kind (a film where a film goes);
 *   - a film's window is 2–30 s, inside the file, and its cover frame inside the window;
 *   - the source must be an object this admin uploaded, under `uploads/`.
 *
 * Pure: `npm run test:admin` proves every rule.
 */

import { EditError } from './edit.ts';
import type { NewProject } from './projects.ts';

/**
 * A field a file can be uploaded for. `file` is a page file (`home`) or a project
 * (`projeto/<slug>`); `screen` is where the request was made.
 */
export interface UploadField { file: string; key: string; kind: string; label: string; locked?: string | undefined }

export const UPLOADS_PATH = 'src/data/media-uploads.json';
/** Where uploads land in the private source bucket. Nothing else may be written there. */
export const UPLOAD_PREFIX = 'uploads/';
export const MAX_UPLOAD_BYTES = 2 * 1024 ** 3;
/** Multipart part size: well under a Worker's 100 MB request cap and its memory. */
export const PART_BYTES = 20 * 1024 ** 2;

const VIDEO_EXT = /\.(mp4|mov|m4v|webm)$/i;
const IMAGE_EXT = /\.(jpe?g|png|webp|tiff?)$/i;
export const MIN_LOOP_S = 2;
export const MAX_LOOP_S = 30;

export interface UploadEntry {
  id: string;
  /** The media-manifest key the file becomes. */
  key: string;
  kind: 'video' | 'image';
  /** Object key in the private source bucket. */
  source: string;
  /** The file's own name, as the owner chose it. */
  name: string;
  start?: number;
  duration?: number;
  posterAt?: number;
  /** What the chosen window avoids, in the owner's words (MEDIA_PIPELINE.md §5). */
  note?: string;
  target: { screen: string; file: string; path: string; label: string };
  /** A new project, written once its cover is processed (projects.ts `NewProject`). */
  create?: { slug: string; project: NewProject };
  by: string;
  at: string;
  status: 'pending' | 'ready' | 'failed';
  error?: string;
}

export interface UploadsDoc { uploads: UploadEntry[] }

/** `owner/<id>/hero` for a film (its poster is `…/hero/poster`), `owner/<id>/image` for a still. */
export const ownerKey = (id: string, kind: 'video' | 'image') => `owner/${id}/${kind === 'video' ? 'hero' : 'image'}`;

/** A safe object name: the original's letters, digits, dots, dashes; nothing that walks. */
export function safeName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  // Accents off first (Vídeo → Video), or the combining mark itself would become a dash.
  const clean = base.normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^[-.]+/, '');
  return clean.slice(-120) || 'ficheiro';
}

/** The kind a file name is, or null if the admin does not take it. */
export function kindOf(name: string): 'video' | 'image' | null {
  return VIDEO_EXT.test(name) ? 'video' : IMAGE_EXT.test(name) ? 'image' : null;
}

/** `uploads/<yyyy-mm-dd>/<id>/<name>`, and the check that a key is one of those. */
export const uploadKey = (date: string, id: string, name: string) => `${UPLOAD_PREFIX}${date}/${id}/${safeName(name)}`;
export const isUploadKey = (key: string) => /^uploads\/\d{4}-\d{2}-\d{2}\/[a-z0-9]{8,32}\/[\w.-]{1,120}$/.test(key);

export interface MediaRequest {
  screen: string;
  target: string;
  source: string;
  name: string;
  /** Seconds, for a film. */
  start?: number | undefined;
  end?: number | undefined;
  posterAt?: number | undefined;
  note?: string | undefined;
}

/**
 * One request made concrete, or a refusal in the owners' words.
 * `fields` are the screen's fields, expanded; `id`, `by`, `at` come from the server.
 */
export function planUpload(fields: UploadField[], req: MediaRequest, id: string, by: string, at: string): UploadEntry {
  const [file = '', path = ''] = req.target.split(':');
  const field = fields.find((f) => f.file === file && f.key === path);
  if (!field || field.kind === 'text') throw new EditError('Este campo não aceita ficheiros.');
  if (field.locked) throw new EditError(`«${field.label}» não pode ser alterado aqui.`);
  if (!isUploadKey(req.source)) throw new EditError('O ficheiro carregado não foi encontrado. Volte a carregá-lo.');

  const kind = kindOf(req.name);
  if (!kind) throw new EditError('Este tipo de ficheiro não é aceite. Use MP4, MOV ou WebM para vídeo, e JPG, PNG, WebP ou TIFF para imagem.');
  if (kind !== field.kind) {
    throw new EditError(field.kind === 'video' ? `«${field.label}» precisa de um vídeo.` : `«${field.label}» precisa de uma imagem.`);
  }

  const entry: UploadEntry = {
    id,
    key: ownerKey(id, kind),
    kind,
    source: req.source,
    name: req.name.slice(0, 200),
    target: { screen: req.screen, file, path, label: field.label },
    by,
    at,
    status: 'pending',
  };
  const note = req.note?.trim().slice(0, 300);
  if (note) entry.note = note;

  if (kind === 'video') {
    const { start, end, posterAt } = req;
    const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
    if (!finite(start) || !finite(end) || !finite(posterAt) || start < 0) {
      throw new EditError('Marque o início, o fim e a capa do excerto.');
    }
    const duration = +(end - start).toFixed(2);
    if (duration < MIN_LOOP_S) throw new EditError(`O excerto tem de ter pelo menos ${MIN_LOOP_S} segundos.`);
    if (duration > MAX_LOOP_S) throw new EditError(`O excerto pode ter no máximo ${MAX_LOOP_S} segundos.`);
    if (posterAt < start || posterAt > end) throw new EditError('A capa tem de ser um momento dentro do excerto.');
    entry.start = +start.toFixed(2);
    entry.duration = duration;
    entry.posterAt = +posterAt.toFixed(2);
  }
  return entry;
}

/** The uploads file with one more entry. A request id seen before is a refusal. */
export function appendUpload(doc: UploadsDoc, entry: UploadEntry): UploadsDoc {
  if (doc.uploads.some((u) => u.id === entry.id)) throw new EditError('Este pedido já foi feito.');
  return { uploads: [...doc.uploads, entry] };
}

/** A field's requests worth showing beside it: still processing, or failed in the last week. */
export const requestsFor = (uploads: UploadEntry[], file: string, path: string, now = Date.now()): UploadEntry[] =>
  uploads.filter((u) => u.target.file === file && u.target.path === path
    && (u.status === 'pending' || (u.status === 'failed' && now - Date.parse(u.at) < 7 * 86_400_000))).slice(0, 3);
