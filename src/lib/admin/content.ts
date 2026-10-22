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
import { SCREEN_LABELS } from './fields.ts';
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
}

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

/** One page-content file as a single-item group. */
function page(file: keyof typeof PAGE_CONTENT, pageId: PageId): AdminGroup {
  const label = SCREEN_LABELS[file];
  return {
    id: `pagina-${file}`,
    label,
    load: async () => [{ id: file, label, data: PAGE_CONTENT[file], viewPath: pagePath(pageId) }],
  };
}

export const AREAS: AdminArea[] = [
  {
    id: 'inicio', label: 'Início', section: 'home',
    groups: [page('home', 'home')],
  },
  {
    id: 'sobre', label: 'Sobre', section: 'about',
    groups: [
      page('about', 'about'),
      {
        id: 'equipa', label: 'Equipa',
        load: async () => (await getCollection('team')).sort(byOrder).map((e) => ({
          id: e.id, label: e.data.name, meta: e.data.role.pt, data: e.data, body: e.body, viewPath: pagePath('about'),
        })),
      },
    ],
  },
  {
    id: 'comercial', label: 'Comercial', section: 'commercial',
    groups: [
      page('services', 'services'),
      {
        id: 'servicos', label: 'Serviços',
        load: async () => (await getCollection('services')).sort(byOrder).map((e) => ({
          id: e.id, label: e.data.title.pt, data: e.data, body: e.body, viewPath: pagePath('services'),
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
      {
        id: 'projetos', label: 'Projetos',
        load: async () => (await getCollection('projects'))
          .sort((a, b) => (a.data.portfolioOrder ?? 999) - (b.data.portfolioOrder ?? 999)
            || a.data.title.pt.localeCompare(b.data.title.pt, 'pt'))
          .map((e) => ({
            id: e.id,
            label: e.data.title.pt,
            meta: [e.data.year ?? e.data.date.getFullYear(), e.data.draft ? 'rascunho' : null].filter(Boolean).join(' · '),
            data: e.data,
            body: e.body,
            viewPath: e.data.draft ? null : projectPath(e.id),
          })),
      },
      {
        id: 'categorias', label: 'Categorias',
        load: async () => (await getCollection('categories')).sort(byOrder).map((e) => ({
          id: e.id, label: e.data.name.pt, meta: e.data.hidden ? 'escondida' : undefined, data: e.data,
          viewPath: e.data.hidden ? null : categoryPath(e.id),
        })),
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
    id: 'bts', label: 'BTS', section: 'bts',
    groups: [page('bts', 'bts')],
  },
  {
    id: 'definicoes', label: 'Definições', section: null,
    groups: [
      {
        id: 'site', label: 'Contactos e redes',
        load: async () => (await getCollection('settings')).map((e) => ({
          id: e.id, label: 'Contactos e redes sociais', data: e.data, viewPath: pagePath('contact'),
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

export const findArea = (id: string | undefined) => AREAS.find((a) => a.id === id) ?? null;
