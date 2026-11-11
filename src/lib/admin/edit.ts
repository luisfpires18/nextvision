/**
 * Turning a submitted form into new file contents — and refusing what must not happen.
 *
 * The rules, in the order they are applied:
 *   1. Only a field the screen offers can be written. An unknown or LOCKED field is a
 *      refusal, never ignored: a form that posts something it should not is a defect.
 *   2. A published string needs both languages (decision R11: nothing exists in English
 *      unless it was authored; the build fails on a missing translation, so the admin
 *      refuses first and says which field).
 *   3. When the Portuguese of an archived string changes, its source becomes
 *      `owner:YYYY-MM-DD` (decision A2). The archive itself is never touched; the change
 *      is what a later diff against it will show.
 *   4. Nothing changed means nothing to commit.
 *   5. A list field (`images`, `films`, `categories`) arrives as the whole list in JSON and
 *      replaces the list; each item is checked here and the page schema checks the rest.
 *      An upload-only slot is never a draft.
 *
 * Pure: no I/O and no imports beyond the field registry, so `npm run test:admin` can
 * prove each rule on its own.
 */

import { isListKind, type FieldDef, type PageFileName } from './fields.ts';

export interface Field extends FieldDef {
  /** Concrete path, `*` expanded. */
  key: string;
}

export class EditError extends Error {}

type Json = Record<string, unknown>;

export function getAt(doc: unknown, path: string): unknown {
  if (path === '') return doc;
  return path.split('.').reduce<unknown>((node, part) =>
    (node !== null && typeof node === 'object' ? (node as Json)[part] : undefined), doc);
}

function setAt(doc: unknown, path: string, value: unknown): void {
  const parts = path.split('.');
  const last = parts.pop()!;
  const parent = getAt(doc, parts.join('.'));
  if (parent === null || typeof parent !== 'object') throw new EditError(`caminho inválido: ${path}`);
  (parent as Json)[last] = value;
}

/** A screen's definitions made concrete against the files as they are now. */
export function expandFields(defs: FieldDef[], docs: Partial<Record<PageFileName, unknown>>): Field[] {
  const out: Field[] = [];
  for (const def of defs) {
    if (def.path.endsWith('.+')) {
      // One past the end: offered only while the list exists.
      if (Array.isArray(getAt(docs[def.file], def.path.slice(0, -2)))) out.push({ ...def, key: def.path });
      continue;
    }
    const star = def.path.indexOf('.*');
    if (star < 0) { out.push({ ...def, key: def.path }); continue; }
    const base = def.path.slice(0, star);
    const rest = def.path.slice(star + 2);
    const list = getAt(docs[def.file], base);
    if (!Array.isArray(list)) continue;
    list.forEach((item, i) => {
      // Only the items that have the rest of the path (a carousel frame with a film has `.image`).
      if (rest && getAt(item, rest.slice(1)) === undefined) return;
      const key = `${base}.${i}${rest}`;
      out.push({ ...def, path: key, key, label: `${def.label} ${i + 1}` });
    });
  }
  return out;
}

/** The most items a list field may hold: enough for any page, few enough to stay a page. */
export const MAX_LIST = 24;

/**
 * A list field's submitted JSON, checked item by item and normalised (a film's address
 * becomes its id, names are trimmed). Refuses in the owners' words.
 */
export function parseList(kind: 'images' | 'films' | 'categories', label: string, raw: string): unknown[] {
  let list: unknown;
  try { list = JSON.parse(raw); } catch { list = null; }
  if (!Array.isArray(list)) throw new EditError(`«${label}»: pedido inválido.`);
  if (list.length > MAX_LIST) throw new EditError(`«${label}»: no máximo ${MAX_LIST}.`);
  if (kind === 'films') {
    return list.map((item, i) => {
      const f = (item ?? {}) as Record<string, unknown>;
      const n = `«${label}», vídeo ${i + 1}`;
      const id = youtubeId(String(f['id'] ?? ''));
      if (!id) throw new EditError(`${n}: não reconheço este endereço. Cole o link do vídeo, por exemplo https://www.youtube.com/watch?v=…`);
      const title = String(f['title'] ?? '').trim();
      if (!title) throw new EditError(`${n}: falta o nome do vídeo.`);
      const poster = String(f['poster'] ?? '');
      if (!poster) throw new EditError(`${n}: escolha uma capa.`);
      return { id, title, poster };
    });
  }
  if (kind === 'images') {
    // A frame is a still, or a still with a film that plays when it is pressed. Without a
    // film it is stored as the bare key, exactly as before, so nothing already published changes.
    return list.map((item, i) => {
      if (typeof item === 'string') {
        if (!item) throw new EditError(`«${label}»: escolha uma imagem em cada linha.`);
        return item;
      }
      const f = (item ?? {}) as Record<string, unknown>;
      const image = String(f['image'] ?? '');
      if (!image) throw new EditError(`«${label}»: escolha uma imagem em cada linha.`);
      const address = String(f['film'] ?? '').trim();
      if (!address) return image;
      const film = youtubeId(address);
      if (!film) throw new EditError(`«${label}», imagem ${i + 1}: não reconheço o endereço do vídeo. Cole o link, por exemplo https://www.youtube.com/watch?v=…`);
      const title = String(f['title'] ?? '').trim();
      return title ? { image, film, title } : { image, film };
    });
  }
  const strings = list.map((v) => (typeof v === 'string' ? v : ''));
  if (strings.some((v) => !v)) throw new EditError(`«${label}»: pedido inválido.`);
  if (kind === 'categories') {
    if (strings.some((v) => !/^[a-z0-9-]+$/.test(v))) throw new EditError(`«${label}»: pedido inválido.`);
    return [...new Set(strings)];
  }
  return strings;
}

/** A YouTube id from an id or any of the usual YouTube addresses; null if neither. */
export function youtubeId(input: string): string | null {
  const v = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(v)) return v;
  const m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(v);
  return m ? m[1]! : null;
}

export interface Published { text: string; from: string; en?: string }

/** Form field names: `file:path#pt` / `file:path#en` for text, `file:path` for everything else. */
export const fieldName = (f: Field, lang?: 'pt' | 'en') => `${f.file}:${f.key}${lang ? `#${lang}` : ''}`;

export interface Applied {
  docs: Partial<Record<PageFileName, unknown>>;
  changed: { file: PageFileName; label: string }[];
}

export function applyEdits(
  fields: Field[],
  docs: Partial<Record<PageFileName, unknown>>,
  edits: Record<string, string>,
  today: string,
): Applied {
  const byName = new Map<string, { field: Field; lang?: 'pt' | 'en' }>();
  for (const f of fields) {
    if (f.uploadOnly) continue;
    if (f.kind === 'text' || f.kind === 'pair') {
      byName.set(fieldName(f, 'pt'), { field: f, lang: 'pt' });
      byName.set(fieldName(f, 'en'), { field: f, lang: 'en' });
    } else byName.set(fieldName(f), { field: f });
  }

  for (const name of Object.keys(edits)) {
    const hit = byName.get(name);
    if (!hit) throw new EditError(`Campo desconhecido: ${name}.`);
    if (hit.field.locked) throw new EditError(`«${hit.field.label}» não pode ser alterado aqui.`);
  }

  const next = structuredClone(docs);
  const changed: Applied['changed'] = [];
  const clean = (v: string) => v.replace(/\r\n?/g, '\n');

  for (const f of fields) {
    if (f.locked || f.uploadOnly) continue;
    const doc = next[f.file];
    if (doc === undefined) continue;

    if (f.kind === 'text') {
      const pt = edits[fieldName(f, 'pt')];
      const en = edits[fieldName(f, 'en')];
      if (pt === undefined && en === undefined) continue;
      const before = getAt(doc, f.key) as Published | undefined;
      if (!before || typeof before.text !== 'string') throw new EditError(`«${f.label}» não existe neste ficheiro.`);

      const text = pt === undefined ? before.text : clean(pt);
      const english = en === undefined ? before.en : clean(en);
      if (!text.trim()) throw new EditError(`«${f.label}»: o texto em português não pode ficar vazio.`);
      if (!english?.trim()) throw new EditError(`«${f.label}»: falta o texto em inglês.`);
      if (text === before.text && english === before.en) continue;

      const from = text === before.text ? before.from : `owner:${today}`;
      setAt(doc, f.key, { text, from, en: english });
      changed.push({ file: f.file, label: f.label });
    } else if (f.kind === 'pair') {
      const pt = edits[fieldName(f, 'pt')];
      const en = edits[fieldName(f, 'en')];
      if (pt === undefined && en === undefined) continue;
      const before = getAt(doc, f.key) as { pt?: string; en?: string } | undefined;
      if (!before || typeof before.pt !== 'string') throw new EditError(`«${f.label}» não existe neste ficheiro.`);
      const nextPt = (pt ?? before.pt).trim();
      const nextEn = (en ?? before.en ?? '').trim();
      if (!nextPt) throw new EditError(`«${f.label}»: o texto em português não pode ficar vazio.`);
      if (!nextEn) throw new EditError(`«${f.label}»: falta o texto em inglês.`);
      if (/\n/.test(nextPt + nextEn)) throw new EditError(`«${f.label}»: tem de caber numa linha.`);
      if (nextPt === before.pt && nextEn === before.en) continue;
      setAt(doc, f.key, { pt: nextPt, en: nextEn });
      changed.push({ file: f.file, label: f.label });
    } else if (isListKind(f.kind)) {
      const raw = edits[fieldName(f)];
      if (raw === undefined) continue;
      const value = parseList(f.kind, f.label, raw);
      if (JSON.stringify(getAt(doc, f.key)) === JSON.stringify(value)) continue;
      setAt(doc, f.key, value);
      changed.push({ file: f.file, label: f.label });
    } else {
      const raw = edits[fieldName(f)];
      if (raw === undefined) continue;
      if (!raw.trim()) {
        throw new EditError(f.kind === 'line' || f.kind === 'film' ? `«${f.label}» não pode ficar vazio.` : `«${f.label}»: escolha um ficheiro.`);
      }
      const id = f.kind === 'film' ? youtubeId(raw) : null;
      if (f.kind === 'film' && !id) {
        throw new EditError(`«${f.label}»: não reconheço este endereço. Cole o link do vídeo, por exemplo https://www.youtube.com/watch?v=…`);
      }
      const value = id ?? (f.kind === 'line' ? raw.trim() : raw);
      if (getAt(doc, f.key) === value) continue;
      setAt(doc, f.key, value);
      changed.push({ file: f.file, label: f.label });
    }
  }

  return { docs: next, changed };
}

/**
 * The live value a draft name points at: `file:path#pt` / `#en` for text, `file:path` for
 * media, compact JSON for a list (the form's `data-original` is written the same way).
 * Publish compares it with the value the draft started from (per-field freshness).
 */
export function liveValue(docs: Partial<Record<PageFileName, unknown>>, name: string): unknown {
  const [file, rest = ''] = name.split(':') as [PageFileName, string];
  const [path = '', lang] = rest.split('#');
  const v = getAt(docs[file], path);
  // A published string is { text, from, en }; a plain name (`pair`) is { pt, en }.
  if (lang === 'pt') return (v as Published | undefined)?.text ?? (v as { pt?: string } | undefined)?.pt;
  if (lang === 'en') return (v as Published | undefined)?.en ?? '';
  return Array.isArray(v) ? JSON.stringify(v) : v;
}

/** The exact on-disk format of a page-content file: two-space JSON and a final newline. */
export const serialise = (doc: unknown): string => `${JSON.stringify(doc, null, 2)}\n`;
