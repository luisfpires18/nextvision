/**
 * Editing a project (A2, projects slice): the fields an owner may change in one project's
 * MDX file, and how a change is written back.
 *
 * A project is not a JSON file. Its data is YAML front matter, full of comments that
 * explain why each value is what it is, followed by an MDX body. So a change is applied
 * to the parsed YAML DOCUMENT (the `yaml` package keeps comments, quoting and block
 * styles of every node it does not touch) and the body is put back as it was. Every
 * project file on disk round-trips byte for byte, and `npm run test:admin` proves it.
 *
 * Draft names follow the page convention with a `projeto/<slug>` file part:
 * `projeto/leonor:tagline#pt`, `projeto/leonor:poster.key`.
 *
 * What an owner may NOT change here is deliberate: the slug (it is the URL, and old URLs
 * need redirects), the date, provenance fields (`sourceOfTruth`, `masterRequired`), and
 * the page blocks (a later slice). Order is a separate screen.
 *
 * Pure, apart from the `yaml` parser: the media check is passed in, so the test can run
 * without the manifest and the Worker can run without the file system.
 */

import { parseDocument, isMap, type Document } from 'yaml';
import { EditError } from './edit.ts';

export const PROJECT_FILE = 'projeto';
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const projectFilePath = (slug: string): string => `src/content/projects/${slug}.mdx`;
export const projectDraftFile = (slug: string): string => `${PROJECT_FILE}/${slug}`;

export type ProjectKind = 'title' | 'tagline' | 'year' | 'category' | 'film' | 'visibility' | 'image' | 'video';

export interface ProjectField {
  /** Dotted path into the front matter. */
  path: string;
  label: string;
  kind: ProjectKind;
  note?: string;
}

export const PROJECT_FIELDS: ProjectField[] = [
  { path: 'title.pt', label: 'Título', kind: 'title', note: 'O nome do filme. Não se traduz: é igual em português e em inglês.' },
  { path: 'tagline', label: 'Frase', kind: 'tagline', note: 'A frase do projeto no portfólio. O texto mais abaixo na página do projeto muda-se nos blocos, numa fase seguinte.' },
  { path: 'year', label: 'Ano', kind: 'year' },
  { path: 'categories', label: 'Categoria', kind: 'category' },
  { path: 'film.id', label: 'Filme no YouTube', kind: 'film', note: 'Cole o endereço do vídeo no YouTube, ou só o código de 11 caracteres.' },
  { path: 'draft', label: 'No site', kind: 'visibility', note: 'Um projeto escondido sai do portfólio e a sua página deixa de existir.' },
  { path: 'poster.key', label: 'Capa', kind: 'image', note: 'A imagem do projeto no portfólio e nas partilhas.' },
  { path: 'heroVideo', label: 'Vídeo de abertura', kind: 'video', note: 'O excerto que corre em silêncio no topo da página do projeto. A capa vem com ele.' },
];

export interface ProjectContext {
  /** Category slugs that exist. */
  categories: ReadonlySet<string>;
  /** What a media key is: `image`, `video` (with its own poster), or neither. */
  mediaKind: (key: string) => 'image' | 'video' | null;
}

/** An MDX file split into its front matter and the rest, exactly as stored. */
export function splitMdx(text: string): { front: string; rest: string } {
  const m = /^---\n([\s\S]*?\n)---\n/.exec(text);
  if (!m) throw new EditError('Este projeto não tem cabeçalho de dados.');
  return { front: m[1]!, rest: text.slice(m[0].length) };
}

const parse = (front: string): Document => {
  const doc = parseDocument(front);
  if (doc.errors.length || !isMap(doc.contents)) throw new EditError('O cabeçalho deste projeto não se consegue ler.');
  return doc;
};
const steps = (path: string) => path.split('.');
const write = (doc: Document) => doc.toString({ lineWidth: 0 });

/** The project's front matter as plain data. */
export const projectData = (text: string): Record<string, unknown> =>
  parse(splitMdx(text).front).toJS() as Record<string, unknown>;

/** A YouTube id from an id or any of the usual YouTube addresses; null if neither. */
export function youtubeId(input: string): string | null {
  const v = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(v)) return v;
  const m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(v);
  return m ? m[1]! : null;
}

/** Which fields this project offers: the film only when its film is on YouTube. */
export function fieldsFor(data: Record<string, unknown>): ProjectField[] {
  const film = data['film'] as { provider?: string } | undefined;
  return PROJECT_FIELDS.filter((f) => f.kind !== 'film' || film?.provider === 'youtube');
}

/**
 * The value a draft name stands for, as the form holds it (always a string). `lang` is
 * `pt` / `en` for the tagline and absent otherwise.
 */
export function projectValue(data: Record<string, unknown>, path: string, lang?: string): string {
  const v = steps(path).reduce<unknown>((n, p) => (n !== null && typeof n === 'object' ? (n as Record<string, unknown>)[p] : undefined), data);
  if (path === 'tagline') return ((v as Record<string, string> | undefined)?.[lang ?? 'pt']) ?? '';
  if (path === 'categories') return Array.isArray(v) ? String(v[0] ?? '') : '';
  if (path === 'draft') return v === true ? 'true' : 'false';
  return v === undefined || v === null ? '' : String(v);
}

export interface ProjectApplied { text: string; changed: string[] }

/**
 * Apply one project's edits, keyed `path` or `path#lang`, to the file's text.
 * Refuses (EditError) rather than writing anything a build would reject.
 */
export function applyProjectEdits(text: string, edits: Record<string, string>, ctx: ProjectContext): ProjectApplied {
  const { front, rest } = splitMdx(text);
  const doc = parse(front);
  const data = doc.toJS() as Record<string, unknown>;
  const offered = new Map(fieldsFor(data).map((f) => [f.path, f]));
  const clean = (v: string) => v.replace(/\r\n?/g, '\n');

  for (const name of Object.keys(edits)) {
    const [path = '', lang] = name.split('#');
    const f = offered.get(path);
    if (!f || (f.kind === 'tagline' ? lang !== 'pt' && lang !== 'en' : lang !== undefined)) {
      throw new EditError(`Campo desconhecido: ${name}.`);
    }
  }

  const changed: string[] = [];
  const set = (path: string, value: unknown) => doc.setIn(steps(path), value);

  for (const f of offered.values()) {
    if (f.kind === 'tagline') {
      const pt = edits['tagline#pt'];
      const en = edits['tagline#en'];
      if (pt === undefined && en === undefined) continue;
      const beforePt = projectValue(data, 'tagline', 'pt');
      const beforeEn = projectValue(data, 'tagline', 'en');
      const nextPt = pt === undefined ? beforePt : clean(pt).trim();
      const nextEn = en === undefined ? beforeEn : clean(en).trim();
      if (nextPt === beforePt && nextEn === beforeEn) continue;
      if (!nextPt && nextEn) throw new EditError('«Frase»: falta o texto em português.');
      // R11: Portuguese prose needs its English; prose already in English needs none.
      if (nextPt && !nextEn && data['sourceLocale'] !== 'en') throw new EditError('«Frase»: falta o texto em inglês.');
      if (!nextPt) doc.deleteIn(['tagline']);
      else {
        if (!isMap(doc.getIn(['tagline']))) set('tagline', doc.createNode({ pt: nextPt }));
        else set('tagline.pt', nextPt);
        if (nextEn) set('tagline.en', nextEn); else doc.deleteIn(['tagline', 'en']);
      }
      changed.push(f.label);
      continue;
    }

    const raw = edits[f.path];
    if (raw === undefined) continue;
    const value = clean(raw).trim();
    if (value === projectValue(data, f.path)) continue;

    switch (f.kind) {
      case 'title':
        if (!value) throw new EditError('«Título»: o título não pode ficar vazio.');
        if (value.includes('\n')) throw new EditError('«Título»: o título tem de caber numa linha.');
        set(f.path, value);
        break;
      case 'year': {
        const year = Number(value);
        if (!/^\d{4}$/.test(value) || year < 1990 || year > 2100) throw new EditError('«Ano»: escreva um ano com quatro algarismos.');
        set(f.path, year);
        break;
      }
      case 'category':
        if (!ctx.categories.has(value)) throw new EditError('«Categoria»: escolha uma das categorias da lista.');
        set(f.path, doc.createNode([value]));
        break;
      case 'film': {
        const id = youtubeId(value);
        if (!id) throw new EditError('«Filme no YouTube»: não reconheço este endereço. Cole o link do vídeo, por exemplo https://www.youtube.com/watch?v=…');
        if (id === projectValue(data, f.path)) continue;
        set(f.path, id);
        break;
      }
      case 'visibility':
        if (value !== 'true' && value !== 'false') throw new EditError('«No site»: valor inválido.');
        set(f.path, value === 'true');
        break;
      case 'image':
        if (ctx.mediaKind(value) !== 'image') throw new EditError(`«${f.label}»: escolha uma imagem da lista.`);
        set(f.path, value);
        break;
      case 'video':
        if (ctx.mediaKind(value) !== 'video') throw new EditError(`«${f.label}»: escolha um vídeo da lista.`);
        set(f.path, value);
        // The still that stands in for the video until it plays is the video's own poster
        // (content.config.ts: heroVideo requires heroStill).
        if (isMap(doc.getIn(['heroStill']))) set('heroStill.key', `${value}/poster`);
        else set('heroStill', doc.createNode({ key: `${value}/poster`, altStatus: 'decorative' }));
        break;
    }
    changed.push(f.label);
  }

  return { text: changed.length ? `---\n${write(doc)}---\n${rest}` : text, changed };
}

/** True when the file survives a parse and a write unchanged: the guarantee edits rely on. */
export const roundTrips = (text: string): boolean => {
  const { front } = splitMdx(text);
  return write(parse(front)) === front;
};
