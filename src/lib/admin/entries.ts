/**
 * Editing the site's smaller content entries: services, the team, category names, and the
 * contact details (phones, social links).
 *
 * Same machinery as a project (projects.ts): the file's YAML is edited as a document, so
 * every comment explaining a value survives, and only the edited nodes change. Same
 * draft names, with the entry type as the file part: `servico/producao-de-video:title#pt`,
 * `definicoes/site:0.phones.0.number`. Same Publicar.
 *
 * What is NOT offered, and why, is stated next to the field rather than hidden:
 *   - the contact email (decision D2: three candidates, none confirmed);
 *   - a category's slug (it is the archive URL) and its colour (a design decision);
 *   - order fields, which no owner has asked to change for four services or two people.
 *
 * Pure apart from the YAML parser, so `npm run test:admin` can prove every rule.
 */

import { parseDocument, type Document } from 'yaml';
import { EditError } from './edit.ts';
import { splitMdx, writeFront } from './projects.ts';

const parseFront = (text: string): Document => {
  const doc = parseDocument(text);
  if (doc.errors.length || !doc.contents) throw new EditError('Este ficheiro não se consegue ler.');
  return doc;
};

export type EntryKind = 'pair' | 'text' | 'url' | 'phone' | 'image';

export interface EntryField {
  /** Dotted path; `*` expands to every item of a list that exists. */
  path: string;
  label: string;
  kind: EntryKind;
  note?: string;
  /** Long text: a textarea rather than a line. */
  long?: boolean;
  /** Shown but not editable, and why. */
  locked?: string;
}

export interface EntryType {
  /** The draft-name prefix, and the screen an upload is made from. */
  prefix: string;
  /** What the publish list and the commit call one of these. */
  noun: string;
  dir: string;
  ext: '.md' | '.yml';
  /** Markdown with front matter, or a plain YAML file. */
  front: boolean;
  /** For a file holding a one-item list (settings): the path prefix of that item. */
  root?: string;
  /** The entry's name, as the admin shows it. */
  name: (data: Record<string, unknown>) => string;
  fields: EntryField[];
  /** Rules across fields, run after every edit. */
  check?: (data: Record<string, unknown>) => void;
}

type Pair = { pt?: string; en?: string };

export const ENTRY_TYPES: Record<string, EntryType> = {
  servico: {
    prefix: 'servico', noun: 'Serviço', dir: 'src/content/services', ext: '.md', front: true,
    name: (d) => (d['title'] as Pair | undefined)?.pt ?? '',
    fields: [
      { path: 'title', label: 'Nome', kind: 'pair' },
      { path: 'description', label: 'Descrição', kind: 'pair', long: true },
      {
        path: 'excerpt', label: 'Frase na página inicial', kind: 'pair', long: true,
        note: 'Tem de ser uma frase copiada da descrição, tal como está escrita lá, em cada língua.',
      },
    ],
    // Decision A44, the schema's own rule: the excerpt is a SELECTION from the description.
    check: (d) => {
      const desc = d['description'] as Pair;
      const ex = d['excerpt'] as Pair | undefined;
      if (ex?.pt && !desc.pt?.includes(ex.pt)) throw new EditError('«Frase na página inicial» (português) tem de aparecer, igual, dentro da descrição em português.');
      if (ex?.en && !desc.en?.includes(ex.en)) throw new EditError('«Frase na página inicial» (inglês) tem de aparecer, igual, dentro da descrição em inglês.');
    },
  },
  equipa: {
    prefix: 'equipa', noun: 'Equipa', dir: 'src/content/team', ext: '.md', front: true,
    name: (d) => String(d['name'] ?? ''),
    fields: [
      { path: 'name', label: 'Nome', kind: 'text' },
      { path: 'role', label: 'Função', kind: 'pair' },
      { path: 'portrait.key', label: 'Retrato', kind: 'image' },
      { path: 'links.*.url', label: 'Ligação', kind: 'url' },
    ],
  },
  categoria: {
    prefix: 'categoria', noun: 'Categoria', dir: 'src/content/categories', ext: '.yml', front: false,
    name: (d) => (d['name'] as Pair | undefined)?.pt ?? '',
    fields: [
      { path: 'name', label: 'Nome', kind: 'pair', note: 'O endereço da categoria não muda com o nome.' },
    ],
  },
  definicoes: {
    prefix: 'definicoes', noun: 'Contactos', dir: 'src/content/settings', ext: '.yml', front: false, root: '0',
    name: () => 'Contactos e redes sociais',
    fields: [
      { path: 'phones.*.number', label: 'Telefone', kind: 'phone' },
      { path: 'socials.*.url', label: 'Rede social', kind: 'url' },
      {
        path: 'email', label: 'Email', kind: 'text',
        locked: 'Ainda não está decidido qual é o email oficial (há três diferentes no site antigo). Diga ao programador qual é, e ele ativa-o.',
      },
    ],
  },
};

export const entryFilePath = (t: EntryType, id: string): string => `${t.dir}/${id}${t.ext}`;
export const entryDraftFile = (t: EntryType, id: string): string => `${t.prefix}/${id}`;
export const ENTRY_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const steps = (t: EntryType, path: string): (string | number)[] =>
  [...(t.root ? t.root.split('.') : []), ...path.split('.')].map((p) => (/^\d+$/.test(p) ? Number(p) : p));

function open(t: EntryType, text: string): { doc: Document; rest: string } {
  if (!t.front) return { doc: parseFront(text), rest: '' };
  const { front, rest } = splitMdx(text);
  return { doc: parseFront(front), rest };
}
const close = (t: EntryType, doc: Document, rest: string): string =>
  (t.front ? `---\n${writeFront(doc)}---\n${rest}` : writeFront(doc));

/** The entry's data: the item itself, for a file holding a one-item list. */
export function entryData(t: EntryType, text: string): Record<string, unknown> {
  const js = open(t, text).doc.toJS() as unknown;
  return (t.root ? (js as unknown[])[Number(t.root)] : js) as Record<string, unknown>;
}

const getAt = (data: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((n, p) => (n !== null && typeof n === 'object' ? (n as Record<string, unknown>)[p] : undefined), data);

/** The fields this entry offers, `*` expanded over the lists it has. */
export function entryFields(t: EntryType, data: Record<string, unknown>): EntryField[] {
  const out: EntryField[] = [];
  for (const f of t.fields) {
    if (!f.path.includes('*')) { out.push(f); continue; }
    const [base = '', tail = ''] = f.path.split('.*.');
    const list = getAt(data, base);
    if (!Array.isArray(list)) continue;
    list.forEach((item, i) => {
      const label = (item as Record<string, unknown>)['label'];
      out.push({ ...f, path: `${base}.${i}.${tail}`, label: `${f.label}: ${typeof label === 'string' ? label : i + 1}` });
    });
  }
  return out;
}

/** A field's value as the form holds it (always a string). `lang` for a pair. */
export function entryValue(data: Record<string, unknown>, path: string, lang?: string): string {
  const v = getAt(data, path);
  if (lang) return (v as Pair | undefined)?.[lang as 'pt' | 'en'] ?? '';
  return v === undefined || v === null ? '' : String(v);
}

export interface EntryContext {
  mediaKind: (key: string) => 'image' | 'video' | null;
  /** YYYY-MM-DD. Recorded as `ownerEdited` on any entry the admin changes (decision A2). */
  today?: string;
}

/**
 * Apply one entry's edits, keyed `path` or `path#lang`, to its file's text. A refusal
 * (EditError) names the field; nothing a build would reject is ever written.
 */
export function applyEntryEdits(t: EntryType, text: string, edits: Record<string, string>, ctx: EntryContext): { text: string; changed: string[] } {
  const { doc, rest } = open(t, text);
  const item = () => {
    const js = doc.toJS() as unknown;
    return (t.root ? (js as unknown[])[Number(t.root)] : js) as Record<string, unknown>;
  };
  const before = item();
  const offered = new Map(entryFields(t, before).map((f) => [f.path, f]));

  for (const name of Object.keys(edits)) {
    const [path = '', lang] = name.split('#');
    const f = offered.get(path);
    if (!f || (f.kind === 'pair' ? lang !== 'pt' && lang !== 'en' : lang !== undefined)) throw new EditError(`Campo desconhecido: ${name}.`);
    if (f.locked) throw new EditError(`«${f.label}» não pode ser alterado aqui.`);
  }

  const clean = (v: string) => v.replace(/\r\n?/g, '\n').trim();
  const changed: string[] = [];
  for (const f of offered.values()) {
    if (f.kind === 'pair') {
      const pt = edits[`${f.path}#pt`];
      const en = edits[`${f.path}#en`];
      if (pt === undefined && en === undefined) continue;
      const nextPt = pt === undefined ? entryValue(before, f.path, 'pt') : clean(pt);
      const nextEn = en === undefined ? entryValue(before, f.path, 'en') : clean(en);
      if (nextPt === entryValue(before, f.path, 'pt') && nextEn === entryValue(before, f.path, 'en')) continue;
      if (!nextPt) throw new EditError(`«${f.label}»: o texto em português não pode ficar vazio.`);
      if (!nextEn) throw new EditError(`«${f.label}»: falta o texto em inglês.`);
      if (!f.long && (nextPt.includes('\n') || nextEn.includes('\n'))) throw new EditError(`«${f.label}»: tem de caber numa linha.`);
      doc.setIn([...steps(t, f.path), 'pt'], nextPt);
      doc.setIn([...steps(t, f.path), 'en'], nextEn);
      changed.push(f.label);
      continue;
    }
    const raw = edits[f.path];
    if (raw === undefined) continue;
    const value = clean(raw);
    if (value === entryValue(before, f.path)) continue;
    if (!value) throw new EditError(`«${f.label}» não pode ficar vazio.`);
    if (value.includes('\n')) throw new EditError(`«${f.label}»: tem de caber numa linha.`);
    if (f.kind === 'url') {
      let ok = false;
      try { ok = new URL(value).protocol === 'https:'; } catch { /* not a URL */ }
      if (!ok) throw new EditError(`«${f.label}»: escreva o endereço completo, a começar por https://`);
    }
    if (f.kind === 'phone' && !/^\+?[0-9 ]{6,20}$/.test(value)) throw new EditError(`«${f.label}»: escreva só algarismos, com o indicativo, por exemplo +351 912 345 678.`);
    if (f.kind === 'image' && ctx.mediaKind(value) !== 'image') throw new EditError(`«${f.label}»: escolha uma imagem da lista.`);
    doc.setIn(steps(t, f.path), f.kind === 'phone' ? value.replace(/ /g, '') : value);
    changed.push(f.label);
  }

  if (!changed.length) return { text, changed };
  t.check?.(item());
  // Decision A2: the owners' own words from now on, dated. Validators that hold archived
  // copy word for word (the two team roles) accept an entry that declares this.
  if (ctx.today) doc.setIn([...steps(t, 'ownerEdited')], ctx.today);
  return { text: close(t, doc, rest), changed };
}

/** True when the file survives a parse and a write unchanged. */
export function entryRoundTrips(t: EntryType, text: string): boolean {
  const { doc, rest } = open(t, text);
  return close(t, doc, rest) === text;
}

/** The type whose draft prefix this is, if any. */
export const entryTypeOf = (prefix: string): EntryType | null => ENTRY_TYPES[prefix] ?? null;

