/**
 * A project page's blocks, as the admin edits them (A2, project blocks).
 *
 * The blocks travel as ONE draft, `projeto/<slug>:blocks`, holding a JSON VIEW of the list:
 * only the choices an owner makes (texts, image keys, a layout option, a film). Writing the
 * view back reuses the existing YAML node of every block that did not change, so moving a
 * block keeps the comments that explain it, and keeps each image's alt-text state.
 *
 * Offered: text, one image, two images, a gallery (2–12), and a YouTube film with its
 * poster. The other block types in the closed set (quote, credits, spacer, a self-hosted
 * film) are shown as fixed blocks: they can be moved or removed, but not edited here.
 *
 * Pure apart from the YAML document it is given.
 */

import { isMap, isSeq, YAMLSeq, type Document, type Node } from 'yaml';
import { EditError } from './edit.ts';

export const BLOCKS_PATH = 'blocks';

export type BlockView =
  | { type: 'text'; pt: string; en: string; width: 'narrow' | 'wide' }
  | { type: 'full-width-image'; media: string[] }
  | { type: 'image-pair'; media: string[]; weight: 'left' | 'right' | 'equal' }
  | { type: 'image-grid'; media: string[]; mode: 'strip' | 'stack' | 'scrub' }
  | { type: 'embedded-film'; film: string; poster: string }
  /** A block the admin does not edit, kept as it is: `ref` is its index in the file now. */
  | { type: 'fixed'; kind: string; ref: number };

type Obj = Record<string, unknown>;
const keyOf = (m: unknown): string => String((m as Obj | undefined)?.['key'] ?? '');

/** The editable view of the blocks a project has now. Key order is fixed, so it compares as JSON. */
export function blocksView(blocks: unknown): BlockView[] {
  if (!Array.isArray(blocks)) return [];
  return blocks.map((b: Obj, i): BlockView => {
    switch (b['type']) {
      case 'text': {
        const body = (b['body'] ?? {}) as Obj;
        return { type: 'text', pt: String(body['pt'] ?? ''), en: String(body['en'] ?? ''), width: b['width'] === 'wide' ? 'wide' : 'narrow' };
      }
      case 'full-width-image': return { type: 'full-width-image', media: [keyOf(b['media'])] };
      case 'image-pair': {
        const w = b['weight'];
        return { type: 'image-pair', media: (b['media'] as unknown[]).map(keyOf), weight: w === 'left' || w === 'right' ? w : 'equal' };
      }
      case 'image-grid': {
        const m = b['mode'];
        return { type: 'image-grid', media: (b['media'] as unknown[]).map(keyOf), mode: m === 'stack' || m === 'scrub' ? m : 'strip' };
      }
      case 'embedded-film': {
        const film = b['film'] as Obj | undefined;
        if (film?.['provider'] === 'youtube') return { type: 'embedded-film', film: String(film['id']), poster: keyOf(b['poster']) };
        return { type: 'fixed', kind: 'embedded-film', ref: i };
      }
      default: return { type: 'fixed', kind: String(b['type']), ref: i };
    }
  });
}

/** The draft value: the view as JSON. */
export const blocksValue = (blocks: unknown): string => JSON.stringify(blocksView(blocks));

export interface BlockContext {
  mediaKind: (key: string) => 'image' | 'video' | null;
  /** True when the project's prose is already English (`sourceLocale: en`). */
  englishProse: boolean;
  youtubeId: (input: string) => string | null;
}

/** One view checked and turned into the stored block, carrying over what the owner did not choose. */
function toBlock(v: BlockView, n: number, ctx: BlockContext, refs: Map<string, Obj>): Obj {
  const label = `Bloco ${n}`;
  const image = (key: string): Obj => {
    if (ctx.mediaKind(key) !== 'image') throw new EditError(`${label}: escolha imagens da lista.`);
    // Keep the alt text and its state the image already had anywhere on this page.
    return refs.get(key) ?? { key, altStatus: 'todo' };
  };
  switch (v.type) {
    case 'text': {
      const pt = v.pt.replace(/\r\n?/g, '\n').trim();
      const en = v.en.replace(/\r\n?/g, '\n').trim();
      if (!pt) throw new EditError(`${label} (texto): o texto não pode ficar vazio.`);
      if (!en && !ctx.englishProse) throw new EditError(`${label} (texto): falta o texto em inglês.`);
      return { type: 'text', width: v.width === 'wide' ? 'wide' : 'narrow', body: en ? { pt, en } : { pt } };
    }
    case 'full-width-image':
      if (v.media.length !== 1) throw new EditError(`${label} (imagem): escolha uma imagem.`);
      return { type: 'full-width-image', media: image(v.media[0]!) };
    case 'image-pair':
      if (v.media.length !== 2) throw new EditError(`${label} (duas imagens): escolha duas imagens.`);
      if (!['left', 'right', 'equal'].includes(v.weight)) throw new EditError(`${label}: disposição inválida.`);
      return { type: 'image-pair', weight: v.weight, media: v.media.map(image) };
    case 'image-grid':
      if (v.media.length < 2 || v.media.length > 12) throw new EditError(`${label} (galeria): escolha entre 2 e 12 imagens.`);
      if (!['strip', 'stack', 'scrub'].includes(v.mode)) throw new EditError(`${label}: disposição inválida.`);
      return { type: 'image-grid', mode: v.mode, media: v.media.map(image) };
    case 'embedded-film': {
      const id = ctx.youtubeId(v.film);
      if (!id) throw new EditError(`${label} (filme): cole o endereço do vídeo no YouTube.`);
      if (!v.poster) throw new EditError(`${label} (filme): escolha a imagem de capa do filme.`);
      return { type: 'embedded-film', film: { provider: 'youtube', id }, poster: image(v.poster) };
    }
    default:
      throw new EditError(`${label}: tipo de bloco desconhecido.`);
  }
}

/** Every image reference on the page now, by key, so a moved image keeps its alt state. */
function mediaRefs(blocks: unknown[]): Map<string, Obj> {
  const out = new Map<string, Obj>();
  const add = (m: unknown) => { if (m && typeof m === 'object' && keyOf(m)) out.set(keyOf(m), m as Obj); };
  for (const b of blocks as Obj[]) {
    const media = b['media'];
    if (Array.isArray(media)) media.forEach(add); else add(media);
    add(b['poster']);
  }
  return out;
}

const same = (a: unknown, b: unknown) => JSON.stringify(blocksView([a])) === JSON.stringify(blocksView([b]));

/**
 * Write a new view of the blocks into the document. Returns false if nothing changed.
 * An unchanged block keeps its own YAML node (comments and all), wherever it moved to.
 */
export function applyBlocks(doc: Document, json: string, ctx: BlockContext): boolean {
  let view: BlockView[];
  try { view = JSON.parse(json) as BlockView[]; } catch { throw new EditError('Os blocos chegaram estragados. Recarregue a página.'); }
  if (!Array.isArray(view) || view.length > 60) throw new EditError('Os blocos chegaram estragados. Recarregue a página.');

  const node = doc.getIn([BLOCKS_PATH], true) as Node | undefined;
  const items: Node[] = isSeq(node) ? (node.items as Node[]) : [];
  const current = (doc.toJS() as Obj)[BLOCKS_PATH];
  const blocks: Obj[] = Array.isArray(current) ? current : [];
  if (JSON.stringify(blocksView(blocks)) === JSON.stringify(view)) return false;

  const refs = mediaRefs(blocks);
  const used = new Set<number>();
  const next: Node[] = view.map((v, i) => {
    if (v?.type === 'fixed') {
      if (!Number.isInteger(v.ref) || !items[v.ref] || used.has(v.ref) || blocksView([blocks[v.ref]])[0]?.type !== 'fixed') {
        throw new EditError('Os blocos mudaram entretanto. Recarregue a página.');
      }
      used.add(v.ref);
      return items[v.ref]!;
    }
    const block = toBlock(v, i + 1, ctx, refs);
    // An unchanged block keeps its node: the first not yet used whose view is the same.
    const reuse = blocks.findIndex((b, j) => !used.has(j) && same(b, block));
    if (reuse >= 0 && isMap(items[reuse])) { used.add(reuse); return items[reuse]!; }
    return doc.createNode(block) as Node;
  });

  // The files put one blank line between blocks and none before the first.
  next.forEach((n, i) => { n.spaceBefore = i > 0; });
  const seq = isSeq(node) ? node : new YAMLSeq();
  seq.items = next;
  if (!isSeq(node)) doc.setIn([BLOCKS_PATH], seq);
  // An empty list reads `blocks: []`, as the files write it.
  (seq as YAMLSeq).flow = next.length === 0;
  return true;
}
