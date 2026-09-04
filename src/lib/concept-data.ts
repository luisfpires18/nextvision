/**
 * Real NVF content for the Review A concepts.
 *
 * Every string here is VERBATIM from the live site, captured in Phase 0.5 and held in
 * docs/source-archive/pages.json. Nothing is invented, translated or reworded
 * (CLAUDE.md §2, §8). Where the live site has no tagline, this file has none.
 *
 * Prototype-only. Production reads content collections, not this module.
 */

import map from '../data/media-source-map.json' with { type: 'json' };

export interface ConceptProject {
  slug: string;
  /** The <h1> on the live project page. */
  title: string;
  /** Verbatim tagline, where the live site has one. 12 of 20 do. */
  tagline?: string;
  /** Legacy WordPress term. Names are not final (decision R5). */
  category: string;
  categoryToken: 'accent' | 'rust' | 'gold' | 'teal' | 'ink';
  /** Display date exactly as the live site prints it. */
  date: string;
  year: number;
  youtubeId: string | null;
  poster: string;
  /** Silent loop, only where a reviewed Smash match exists. */
  preview: string | null;
}

/** Verbatim taglines, from docs/WEBSITE_AUDIT.md §4.1. Absent = the live site has none. */
const TAGLINES: Record<string, string> = {
  'ana-e-filipe-metro': 'Love is never as it seems',
  'ana-reels': 'I’ll be happier in another place, doing something different, loving someone new. That’s the lie we tell ourselves…',
  'dont-let-it-fool-you': 'We are NVF 🌏',
  'helder-museu': 'You start to look around and think – where’d it all go? The moments you couldn’t hold onto… Fading',
  'helder-praia': 'One day you wake up, and its not just another morning, its a moment. When you realize the pages of your life have turned, and you’re no longer who you used to be. The moments you couldn’t hold onto… Fading',
  'leonor': 'It’s like I’m reading a book, and it’s a book I deeply love, but I’m reading it slowly now. I can still feel you and the words of our story. This is who I am now. And I need you to let me go. As much as I want to I can’t live in your book anymore.',
  'madrugada-prince-mark': 'Madrugada – Prince Mark Videoclip',
  'nazaryi': 'As memories play on repeat, silence answers the messages that words could never heal.',
  'nvf-vs-antiqvvm': 'Onde o “Sensorial” se pode ver.',
  'nvf-vs-filmin-details': 'Onde o cinema ganha vida',
  'paradox-of-affection': 'We search for something, but in the end, it’s the journey that leaves us forgotten in places we never meant to be.',
  'the-end': '“THE END” sometimes is just a start.',
};

/** Live post-info dates, verbatim ("11 Fevereiro '25"). */
const DATES: Record<string, string> = {
  'ana-e-filipe-metro': "11 Fevereiro '25", 'ana-reels': "11 Fevereiro '25",
  'ananuno': "23 Maio '25", 'carolinapedro': "23 Maio '25", 'danieladuarte': "23 Maio '25",
  'dont-let-it-fool-you': "23 Maio '25", 'dormencia-48h': "23 Maio '25", 'epitafio': "23 Maio '25",
  'helder-museu': "11 Fevereiro '25", 'helder-praia': "11 Fevereiro '25", 'leonor': "11 Fevereiro '25",
  'lost-lines-trailer': "23 Maio '25", 'madrugada-prince-mark': "7 Agosto '25",
  'martacharles': "23 Maio '25", 'nazaryi': "7 Fevereiro '25", 'nvf-vs-antiqvvm': "12 Abril '25",
  'nvf-vs-filmin-details': "3 Abril '25", 'paradox-of-affection': "11 Fevereiro '25",
  'susanarafael': "23 Maio '25", 'the-end': "11 Fevereiro '25",
};

/** Category → brand colour token. Five categories, five values from colors.png. */
const CATEGORY_TOKEN: Record<string, ConceptProject['categoryToken']> = {
  'Ficção': 'accent',
  'Visual Storytelling': 'rust',
  'Casamentos': 'gold',
  'Corporativo': 'teal',
  'Moda & Identidade': 'ink',
};

/** Projects with a generated preview loop (scripts/build-concept-media.mjs). */
const HAS_PREVIEW = new Set([
  'ana-reels', 'helder-praia', 'nazaryi', 'nvf-vs-antiqvvm', 'nvf-vs-filmin-details', 'leonor',
]);

export const projects: ConceptProject[] = (map.projects as Array<{
  slug: string; title: string; legacyCategory: string; youtube: { id: string | null };
}>).map((p) => {
  const date = DATES[p.slug] ?? '';
  const tagline = TAGLINES[p.slug];
  return {
    slug: p.slug,
    title: p.title,
    ...(tagline ? { tagline } : {}),
    category: p.legacyCategory,
    categoryToken: CATEGORY_TOKEN[p.legacyCategory] ?? 'ink',
    date,
    year: 2025,
    youtubeId: p.youtube.id,
    poster: `/__generated/posters/${p.slug}.webp`,
    preview: HAS_PREVIEW.has(p.slug) ? `/__generated/preview/${p.slug}.mp4` : null,
  };
});

export const bySlug = (slug: string): ConceptProject | undefined =>
  projects.find((p) => p.slug === slug);

/** Projects that have a preview loop — used where a concept wants motion in the grid. */
export const withPreview = projects.filter((p) => p.preview);

/** The brand film. Live homepage hero is a 16 s cut of this 20 s piece. */
export const heroFilm = {
  src: '/__generated/preview/we-are-nvf.mp4',
  poster: '/__generated/preview/we-are-nvf.webp',
} as const;

/**
 * Verbatim site copy used across the concepts. Source: docs/source-archive/pages.json.
 * Selected, never rewritten — the owners dislike excessive text, so each concept shows
 * a subset. The full copy stays canonical in the archive.
 */
export const copy = {
  heroLine1: 'Captamos emoções',
  heroLine2: 'Contamos Histórias',
  workLine1: 'Fica a Conhecer o',
  workLine2: 'Nosso Trabalho',
  workBody: 'O vídeo não é apenas imagem em movimento — é emoção, identidade e impacto!',
  workBody2: 'Cada projeto que fazemos tem uma energia própria, porque acreditamos que um bom vídeo não se impõe, sente-se.',
  aboutLead: 'De uma ideia a um movimento.',
  aboutBody: 'A NVF nasceu entre câmaras, roadtrips,  trilhos de montanha, amizades e um eterno contacto com o audiovisual.',
  aboutBody2: 'Não somos apenas videógrafos, somos contadores de histórias visuais.',
  ctaWork: 'Consultar Portfólio',
  ctaContact: 'Vamos Criar Juntos?',
  footerTitle: 'Get in Touch',
  footerEmail: 'hello@nextvisionfilms.com',
  copyright: 'copyright 2025 © todos os direitos reservados',
  nav: { about: 'Sobre', portfolio: 'Portfólio', services: 'Serviços', contact: 'Contactos' },
} as const;

/** Team, verbatim from /sobre/ — including the source's own "&Direção" spacing. */
export const team = [
  { name: 'Francisco Cardoso', role: 'Direção Criativa & Videógrafo' },
  { name: 'Helder Afonso', role: 'Produção &Direção Artística' },
] as const;

export const categories = [
  { name: 'Ficção', token: 'accent' },
  { name: 'Visual Storytelling', token: 'rust' },
  { name: 'Casamentos', token: 'gold' },
  { name: 'Corporativo', token: 'teal' },
  { name: 'Moda & Identidade', token: 'ink' },
] as const;
