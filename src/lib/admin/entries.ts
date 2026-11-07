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
 * Adding and removing entries (team, services, categories) is at the end of the file.
 *
 * Pure apart from the YAML parser, so `npm run test:admin` can prove every rule.
 */

import { Document, parseDocument } from 'yaml';
import { EditError } from './edit.ts';
import { splitMdx, writeFront } from './projects.ts';
import { slugFrom } from './slug.ts';

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


/* ── adding and removing entries (docs/ADMIN_REDESIGN_PLAN.md §8, phase 2) ──────────
 *
 * Team members, services and categories can be added and removed; the contacts file
 * cannot (it is one file the site always needs). Both are drafts like any other and go
 * out with Publicar:
 *
 *   `<prefix>/novo-<tempid>:criar`  the new entry's fields as JSON; written as a new file
 *   `<prefix>/<id>:apagar`          the name the owner confirmed; the file is deleted
 *
 * Refusals come first and name what blocks them: a category still used by a project or
 * by the Serviços carousel, the last person of the team, an address already taken. */

export const CREATE_FIELD = 'criar';
export const ENTRY_REMOVE_FIELD = 'apagar';
/** The temporary id a new entry's draft carries until it is published. */
export const NEW_ENTRY_ID = /^novo-[a-z0-9]{4,16}$/;
/** The types an owner can add to and remove from. */
export const LISTED_TYPES: readonly string[] = ['equipa', 'servico', 'categoria'];
export const REMOVED_CATEGORIES_PATH = 'src/data/removed-categories.json';
export interface RemovedCategoriesDoc { removed: { slug: string; name: string; at: string }[] }

/** What the add form sends. Which fields matter depends on the type. */
export interface NewEntryInput {
  name?: string;
  namePt?: string;
  nameEn?: string;
  rolePt?: string;
  roleEn?: string;
  descriptionPt?: string;
  descriptionEn?: string;
  portrait?: string;
}

export interface EntryFile { id: string; text: string }

const nextOrder = (t: EntryType, existing: EntryFile[]) =>
  existing.reduce((max, f) => Math.max(max, Number(entryData(t, f.text)['order'] ?? 0)), -1) + 1;

const line = (label: string, v: string | undefined, required = true): string => {
  const s = (v ?? '').replace(/\r\n?/g, '\n').trim();
  if (required && !s) throw new EditError(`«${label}» não pode ficar vazio.`);
  if (s.includes('\n')) throw new EditError(`«${label}»: tem de caber numa linha.`);
  return s;
};
const prose = (label: string, v: string | undefined): string => {
  const s = (v ?? '').replace(/\r\n?/g, '\n').trim();
  if (!s) throw new EditError(`«${label}» não pode ficar vazio.`);
  return s;
};

/**
 * A new entry's file, from what the add form sent. The id is the address: made from the
 * name, and refused when another entry already has it.
 */
export function newEntryFile(t: EntryType, raw: string, existing: EntryFile[], ctx: EntryContext & { today: string }): { id: string; path: string; text: string; name: string } {
  if (!LISTED_TYPES.includes(t.prefix)) throw new EditError(`${t.noun}: não se acrescenta aqui.`);
  let input: NewEntryInput;
  try { input = JSON.parse(raw) as NewEntryInput; } catch { throw new EditError('Pedido inválido.'); }
  if (!input || typeof input !== 'object') throw new EditError('Pedido inválido.');

  let data: Record<string, unknown>;
  let name: string;
  if (t.prefix === 'equipa') {
    name = line('Nome', input.name);
    const portrait = line('Retrato', input.portrait);
    if (ctx.mediaKind(portrait) !== 'image') throw new EditError('«Retrato»: escolha uma imagem da lista.');
    data = {
      name,
      role: { pt: line('Função (português)', input.rolePt), en: line('Função (inglês)', input.roleEn) },
      portrait: { key: portrait, altStatus: 'todo' },
      links: [],
      ownerEdited: ctx.today,
      order: nextOrder(t, existing),
    };
  } else if (t.prefix === 'servico') {
    name = line('Nome (português)', input.namePt);
    data = {
      title: { pt: name, en: line('Nome (inglês)', input.nameEn) },
      description: { pt: prose('Descrição (português)', input.descriptionPt), en: prose('Descrição (inglês)', input.descriptionEn) },
      ownerEdited: ctx.today,
      order: nextOrder(t, existing),
    };
  } else {
    name = line('Nome (português)', input.namePt);
    data = {
      name: { pt: name, en: line('Nome (inglês)', input.nameEn) },
      internalId: '',
      order: nextOrder(t, existing),
      previousSlugs: [],
      hidden: false,
    };
  }

  const id = slugFrom(name);
  if (!id || !ENTRY_ID.test(id)) throw new EditError(`«${name}»: o nome precisa de letras ou algarismos para formar o endereço.`);
  if (existing.some((f) => f.id === id)) throw new EditError(`Já existe ${t.noun.toLocaleLowerCase('pt-PT')} com o endereço «${id}». Escolha outro nome.`);
  if (t.prefix === 'categoria') data['internalId'] = `cat-${id}`;

  const doc = new Document(data);
  const yaml = doc.toString({ lineWidth: 0 });
  const header = `# Added in the admin on ${ctx.today} (docs/ADMIN_REDESIGN_PLAN.md, phase 2).\n`;
  const text = t.front ? `---\n${header}${yaml}---\n` : `${header}${yaml}`;
  return { id, path: entryFilePath(t, id), text, name };
}

export interface RemovalContext {
  existing: EntryFile[];
  /** Every project's title and category ids, for the category guard. */
  projects: { title: string; categories: string[] }[];
  /** The categories the Serviços carousel names (services.json `categories`). */
  carouselCategories: string[];
  /** The removed-categories record, as it is now. */
  removedCategoriesText: string;
  today: string;
}

export type EntryWrite = { path: string; text: string } | { path: string; remove: true };

/**
 * The writes that remove entry `id`, once its name is confirmed. Refuses, naming the
 * reason, when the site still needs it.
 */
export function entryRemovalWrites(t: EntryType, id: string, confirmed: string, ctx: RemovalContext): EntryWrite[] {
  if (!LISTED_TYPES.includes(t.prefix)) throw new EditError(`${t.noun}: não se apaga aqui.`);
  const file = ctx.existing.find((f) => f.id === id);
  if (!file) throw new EditError(`${t.noun}: esta entrada já não existe.`);
  const name = t.name(entryData(t, file.text));
  if (confirmed !== name) throw new EditError(`Para apagar «${name}», confirme o nome. Nada foi publicado.`);

  if (t.prefix === 'equipa' && ctx.existing.length <= 1) {
    throw new EditError(`«${name}» é a última pessoa da equipa, e a página Sobre precisa de pelo menos uma. Acrescente outra pessoa antes de apagar esta.`);
  }
  const writes: EntryWrite[] = [{ path: entryFilePath(t, id), remove: true }];
  if (t.prefix === 'categoria') {
    const using = ctx.projects.filter((p) => p.categories.includes(id)).map((p) => `«${p.title}»`);
    if (using.length) {
      throw new EditError(`A categoria «${name}» ainda tem projetos: ${using.join(', ')}. Mude-os para outra categoria antes de a apagar.`);
    }
    if (ctx.carouselCategories.includes(id)) {
      throw new EditError(`A categoria «${name}» está no carrossel da página Serviços. Tire-a de lá («Projetos no carrossel») antes de a apagar.`);
    }
    const record = JSON.parse(ctx.removedCategoriesText) as RemovedCategoriesDoc;
    record.removed = [...record.removed.filter((r) => r.slug !== id), { slug: id, name, at: ctx.today }];
    writes.push({ path: REMOVED_CATEGORIES_PATH, text: `${JSON.stringify(record, null, 2)}\n` });
  }
  return writes;
}
