/**
 * What the admin shows, and where it lives on the site.
 *
 * Phase A1 is READ-ONLY: everything editable is listed, in the five sections the site
 * itself is organised by (the rail's five stripes) plus settings. The groups map one to
 * one onto the content sources — collections in src/content/ and the page files in
 * src/content/page-content/ — so A2 can attach a form to each without reshaping this.
 *
 * `viewPath` is the public page that shows the item, opened in the viewer beside it.
 */

import { getCollection } from 'astro:content';
import { PAGE_CONTENT } from '../page-content.ts';
import { SCREENS, SCREEN_LABELS } from './fields.ts';
import { getAt } from './edit.ts';
import { pagePath, projectPath, categoryPath, type PageId } from '../../i18n/routes.ts';

export type Section = 'home' | 'about' | 'commercial' | 'cinema' | 'bts';

export interface AdminItem {
  id: string;
  label: string;
  /** A short second line: year, draft state, a count. */
  meta?: string | undefined;
  data: unknown;
  /** Markdown body of a collection entry, if it has one. */
  body?: string | undefined;
  viewPath: string | null;
  /** Why this item will not be editable, when that is the case. */
  locked?: string | undefined;
  /** The card's picture: a media key (a film shows its poster). None draws the initial. */
  thumb?: string | undefined;
  /**
   * The draft names that belong to this item, as prefixes (`projeto/leonor:`). The card
   * shows "Alterações por publicar" while any draft starts with one of them.
   */
  draftKeys?: string[] | undefined;
  /** What the toolbar filters on (projects): category ids, year, hidden from the site. */
  facets?: { categories: string[]; year: string; hidden: boolean } | undefined;
  /** Whether the card offers the bin: projects, team members, services, categories. */
  deletable?: boolean | undefined;
  /** What the delete modal adds under its question: what happens to this kind of item. */
  deleteHint?: string | undefined;
  /**
   * Why this item cannot be deleted now, when that is known from the site as built: the
   * bin then explains instead of offering Apagar. Publicar checks again either way
   * (entries.ts `entryRemovalWrites`), against the files as they are on master.
   */
  deleteBlocked?: string | undefined;
}

/** The draft that deletes an item, by the kind of item: `projeto/leonor:apagar`. */
export const deleteDraftOf = (prefix: string, id: string) => `${prefix}/${id}:apagar`;

const HINT = {
  projeto: 'As imagens e os vídeos ficam guardados. Quem abrir o endereço antigo vai parar ao portfólio.',
  equipa: 'Sai da página Sobre. O retrato fica guardado.',
  servico: 'Os serviços não aparecem no site neste momento. O texto original fica no arquivo do site antigo.',
  categoria: 'Só se apaga uma categoria sem projetos e fora do carrossel da página Serviços. O endereço antigo passa a levar ao portfólio.',
};

/** "Novo …": the + in the page header opens one of these (AdminRoute.astro). */
const adding = (items: { id: string; label: string }[]): AdminGroup => ({
  id: 'novo', label: 'Novo',
  load: async () => items.map((i) => ({ ...i, data: null, viewPath: null })),
});

export interface AdminGroup {
  id: string;
  label: string;
  load: () => Promise<AdminItem[]>;
}

export interface AdminArea {
  id: string;
  label: string;
  section: Section | null;
  groups: AdminGroup[];
}

const byOrder = <T extends { data: { order?: number } }>(a: T, b: T) =>
  (a.data.order ?? 0) - (b.data.order ?? 0);

/** One page-content file as a single-item group. Its picture is the screen's first media field. */
function page(file: keyof typeof PAGE_CONTENT, pageId: PageId): AdminGroup {
  const label = SCREEN_LABELS[file];
  const defs = SCREENS[file];
  const media = defs.find((d) => (d.kind === 'image' || d.kind === 'video') && !/[*+]/.test(d.path));
  const thumb = media ? getAt(PAGE_CONTENT[media.file], media.path) : undefined;
  return {
    id: `pagina-${file}`,
    label,
    load: async () => [{
      id: file, label, data: PAGE_CONTENT[file], viewPath: pagePath(pageId),
      thumb: typeof thumb === 'string' ? thumb : undefined,
      draftKeys: [...new Set(defs.map((d) => `${d.file}:${d.path.replace(/.[*+].*$/, '')}`))],
    }],
  };
}

const keyOf = (v: unknown): string | undefined =>
  (v && typeof v === 'object' && typeof (v as { key?: unknown }).key === 'string' ? (v as { key: string }).key : undefined);

export const AREAS: AdminArea[] = [
  {
    id: 'inicio', label: 'Início', section: 'home',
    groups: [page('home', 'home')],
  },
  {
    id: 'sobre', label: 'Sobre', section: 'about',
    groups: [
      page('about', 'about'),
      adding([{ id: 'equipa', label: 'Nova pessoa na equipa' }]),
      {
        id: 'equipa', label: 'Equipa',
        load: async () => (await getCollection('team')).sort(byOrder).map((e, _i, all) => ({
          id: e.id, label: e.data.name, meta: e.data.role.pt, data: e.data, body: e.body, viewPath: pagePath('about'),
          thumb: keyOf(e.data.portrait), draftKeys: [`equipa/${e.id}:`], deletable: true, deleteHint: HINT.equipa,
          deleteBlocked: all.length <= 1 ? 'É a última pessoa da equipa, e a página Sobre precisa de pelo menos uma. Acrescente outra pessoa primeiro.' : undefined,
        })),
      },
    ],
  },
  {
    id: 'comercial', label: 'Comercial', section: 'commercial',
    groups: [
      page('services', 'services'),
      adding([{ id: 'servico', label: 'Novo serviço' }]),
      {
        id: 'servicos', label: 'Serviços',
        load: async () => (await getCollection('services')).sort(byOrder).map((e) => ({
          id: e.id, label: e.data.title.pt, data: e.data, body: e.body, viewPath: pagePath('services'),
          draftKeys: [`servico/${e.id}:`], deletable: true, deleteHint: HINT.servico,
        })),
      },
      {
        id: 'testemunhos', label: 'Testemunhos',
        load: async () => (await getCollection('testimonials')).sort(byOrder).map((e) => ({
          id: e.id, label: e.data.attribution, data: e.data, body: e.body, viewPath: null,
        })),
      },
    ],
  },
  {
    id: 'cinema', label: 'Cinema', section: 'cinema',
    groups: [
      page('portfolio', 'portfolio'),
      // Above the projects, not under all of them: an owner looked for it and did not find it (2026-11-07).
      {
        id: 'novo', label: 'Novo',
        load: async () => [
          { id: 'projeto', label: 'Novo projeto', data: null, viewPath: null },
          { id: 'categoria', label: 'Nova categoria', data: null, viewPath: null },
        ],
      },
      {
        id: 'projetos', label: 'Projetos',
        load: async () => (await projectsWithNames())
          .sort((a, b) => (a.data.portfolioOrder ?? 999) - (b.data.portfolioOrder ?? 999)
            || a.data.title.pt.localeCompare(b.data.title.pt, 'pt'))
          .map((e) => ({
            id: e.id,
            label: e.data.title.pt,
            meta: [e.data.year ?? e.data.date.getFullYear(), e.categoryName].filter(Boolean).join(' · '),
            data: e.data,
            body: e.body,
            viewPath: e.data.draft ? null : projectPath(e.id),
            thumb: keyOf(e.data.poster),
            draftKeys: [`projeto/${e.id}:`],
            facets: {
              categories: e.data.categories.map((c) => c.id),
              year: String(e.data.year ?? e.data.date.getFullYear()),
              hidden: Boolean(e.data.draft),
            },
            deletable: true,
            deleteHint: HINT.projeto,
          })),
      },
      {
        id: 'ordem', label: 'Ordem',
        load: async () => [{ id: 'portfolio', label: 'Ordem do portfólio', data: null, viewPath: pagePath('portfolio') }],
      },
      {
        id: 'categorias', label: 'Categorias',
        load: async () => {
          const projects = await getCollection('projects');
          return (await getCollection('categories')).sort(byOrder).map((e) => {
            const inIt = projects.filter((p) => p.data.categories.some((c) => c.id === e.id));
            return {
              id: e.id, label: e.data.name.pt, data: e.data,
              meta: [`${inIt.length} ${inIt.length === 1 ? 'projeto' : 'projetos'}`, e.data.hidden ? 'escondida' : null].filter(Boolean).join(' · '),
              viewPath: e.data.hidden ? null : categoryPath(e.id),
              thumb: keyOf(inIt[0]?.data.poster),
              draftKeys: [`categoria/${e.id}:`],
              deletable: true,
              deleteHint: HINT.categoria,
              deleteBlocked: inIt.length
                ? `Ainda tem ${inIt.length} ${inIt.length === 1 ? 'projeto' : 'projetos'}. Mude-${inIt.length === 1 ? 'o' : 'os'} para outra categoria no formulário de cada projeto antes de apagar esta.`
                : PAGE_CONTENT.services.categories.includes(e.id)
                  ? 'Está no carrossel da página Serviços. Tire-a de lá («Projetos no carrossel», em Comercial › Páginas) antes de a apagar.'
                  : undefined,
            };
          });
        },
      },
      {
        id: 'colecoes', label: 'Coleções',
        load: async () => (await getCollection('collections')).sort(byOrder).map((e) => ({
          id: e.id, label: e.data.name.pt, data: e.data, viewPath: null,
        })),
      },
    ],
  },
  {
    id: 'definicoes', label: 'Definições', section: null,
    groups: [
      {
        id: 'site', label: 'Contactos e redes',
        load: async () => (await getCollection('settings')).map((e) => ({
          id: e.id, label: 'Contactos e redes sociais', data: e.data, viewPath: pagePath('contact'),
          draftKeys: [`definicoes/${e.id}:`],
        })),
      },
      page('contact', 'contact'),
      page('thanks', 'thank-you'),
      {
        id: 'menu', label: 'Menu',
        load: async () => (await getCollection('navigation')).map((e) => ({
          id: e.id, label: 'Menu do site', data: e.data, viewPath: pagePath('home'),
          locked: 'O menu é parte do design (as cinco riscas do logótipo). Alterá-lo é trabalho de design.',
        })),
      },
      {
        id: 'legal', label: 'Páginas legais',
        load: async () => (await getCollection('legal')).map((e) => ({
          id: e.id, label: e.data.title.pt, data: e.data, body: e.body, viewPath: pagePath(e.data.pageId),
          locked: 'Texto legal bloqueado. Um texto novo é entregue ao programador, que o substitui e volta a bloquear (decisão A1).',
        })),
      },
    ],
  },
];

/** Projects with their first category's Portuguese name, for the card's second line. */
async function projectsWithNames() {
  const names = new Map((await getCollection('categories')).map((c) => [c.id, c.data.name.pt]));
  return (await getCollection('projects')).map((e) => Object.assign(e, { categoryName: names.get(e.data.categories[0]?.id ?? '') ?? null }));
}

export const findArea = (id: string | undefined) => AREAS.find((a) => a.id === id) ?? null;
