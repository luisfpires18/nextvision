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
 *
 * Pure: no I/O and no imports beyond the field registry, so `npm run test:admin` can
 * prove each rule on its own.
 */

import type { FieldDef, PageFileName } from './fields.ts';

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
    if (!def.path.endsWith('.*')) { out.push({ ...def, key: def.path }); continue; }
    const base = def.path.slice(0, -2);
    const list = getAt(docs[def.file], base);
    if (!Array.isArray(list)) continue;
    list.forEach((_, i) => out.push({ ...def, path: `${base}.${i}`, key: `${base}.${i}`, label: `${def.label} ${i + 1}` }));
  }
  return out;
}

export interface Published { text: string; from: string; en?: string }

/** Form field names: `file:path#pt` / `file:path#en` for text, `file:path` for media. */
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
    if (f.kind === 'text') {
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
    if (f.locked) continue;
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
    } else {
      const value = edits[fieldName(f)];
      if (value === undefined) continue;
      if (!value.trim()) throw new EditError(`«${f.label}»: escolha um ficheiro.`);
      if (getAt(doc, f.key) === value) continue;
      setAt(doc, f.key, value);
      changed.push({ file: f.file, label: f.label });
    }
  }

  return { docs: next, changed };
}

/** The exact on-disk format of a page-content file: two-space JSON and a final newline. */
export const serialise = (doc: unknown): string => `${JSON.stringify(doc, null, 2)}\n`;
