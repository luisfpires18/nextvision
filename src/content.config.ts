/**
 * Content collections + schemas.
 *
 * Authority: docs/ARCHITECTURE.md §4. Astro 7 ships zod v4 via `astro:content`.
 *
 * Design intent — the schema is the guardrail, not documentation:
 *   - A malformed entry FAILS THE BUILD rather than shipping a broken page.
 *   - Taxonomy is DATA (many categories, tags, curated collections, manual order), so
 *     reorganising the portfolio never touches a component (§4.5).
 *   - Cinematic pages use a CLOSED set of blocks — creative freedom, bounded
 *     consistency, no free-form page builder (§4.6).
 *   - Media is referenced by KEY, never by URL, so storage can change in one helper (§6.3).
 *
 * Nothing here decides owner-facing names. Category labels, taxonomy shape and English
 * copy are all owner decisions (R5, R10) and live in content files, not in this schema.
 */

import { defineCollection, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
// zod v4 via Astro's own bundled copy, so the version always matches the runtime.
// `z` re-exported from 'astro:content' is deprecated in Astro 7.
import { z } from 'astro/zod';

/* ------------------------------------------------------------------ shared */

const LOCALES = ['pt', 'en'] as const;

/**
 * Localised string. PT is required because PT is the source language.
 *
 * `en` is an authored TRANSLATION of `pt`, never a second piece of copy, and it is
 * optional for two legitimate reasons — one temporary, one permanent:
 *
 *   temporary   a string may exist in Portuguese before it is translated.
 *               `npm run validate:i18n` fails the build if one is reachable from an
 *               English route, so the gap can never ship silently.
 *   permanent   some strings are the same in both languages. A film's title is a proper
 *               noun (`Epitáfio` is `Epitáfio` in English), and a project whose published
 *               prose is already English declares `sourceLocale: en` and needs none.
 *
 * Which of the two applies is DECLARED, not guessed — see `sourceLocale` on projects.
 */
const localised = z.object({
  pt: z.string().min(1),
  en: z.string().optional(),
});

/**
 * A media reference. Always a KEY into the media manifest, never a URL — that is the
 * seam that lets storage move from R2 to a CMS to an image CDN without touching content.
 * `alt` status is explicit so missing alt text is a visible gap, never an empty string
 * that silently passes review.
 */
const mediaRef = z.object({
  key: z.string().min(1),
  alt: z.string().optional(),
  altStatus: z.enum(['written', 'todo', 'decorative']).default('todo'),
  caption: z.string().optional(),
});

/** An external or self-hosted film. YouTube ids are validated, not trusted. */
const filmRef = z.discriminatedUnion('provider', [
  z.object({
    provider: z.literal('youtube'),
    // Exactly 11 chars. This is what structurally prevents the live site's bug of
    // storing a studio.youtube.com edit URL (audit §9.7).
    id: z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'must be an 11-character YouTube video id'),
    title: z.string().optional(),
  }),
  z.object({
    provider: z.literal('vimeo'),
    id: z.string().regex(/^\d+$/, 'must be a numeric Vimeo id'),
    title: z.string().optional(),
  }),
  z.object({
    provider: z.literal('r2'),
    key: z.string().min(1),
    title: z.string().optional(),
  }),
]);

const seoFields = z.object({
  title: localised.partial({ pt: true }).optional(),
  description: localised.partial({ pt: true }).optional(),
  ogImage: z.string().optional(),
  noindex: z.boolean().default(false),
}).default({ noindex: false });

/* ---------------------------------------------------- cinematic block model
   A closed, discriminated union. Nine types, and adding a tenth is an architecture
   decision rather than a content edit (§4.6). */

const blockText = z.object({
  type: z.literal('text'),
  body: localised,
  width: z.enum(['narrow', 'wide']).default('narrow'),
});

const blockFullWidthImage = z.object({
  type: z.literal('full-width-image'),
  media: mediaRef,
});

const blockImagePair = z.object({
  type: z.literal('image-pair'),
  media: z.tuple([mediaRef, mediaRef]),
  weight: z.enum(['left', 'right', 'equal']).default('equal'),
});

const blockImageGrid = z.object({
  type: z.literal('image-grid'),
  media: z.array(mediaRef).min(2).max(12),
  // `scrub` is scroll-driven and degrades to `strip` on touch and under reduced motion.
  mode: z.enum(['strip', 'stack', 'scrub']).default('strip'),
});

const blockFullWidthVideo = z.object({
  type: z.literal('full-width-video'),
  key: z.string().min(1),
  // A poster is MANDATORY. This is what makes the live site's "black box until decode"
  // failure (audit §9.11) impossible to ship.
  poster: mediaRef,
  loop: z.boolean().default(true),
  hasAudio: z.boolean().default(false),
});

const blockEmbeddedFilm = z.object({
  type: z.literal('embedded-film'),
  film: filmRef,
  poster: mediaRef,
});

const blockQuote = z.object({
  type: z.literal('quote'),
  text: localised,
  attribution: z.string().optional(),
});

const blockCredits = z.object({
  type: z.literal('credits'),
  entries: z.array(z.object({ role: localised, name: z.string().min(1) })).min(1),
});

const blockSpacer = z.object({
  type: z.literal('spacer'),
  size: z.enum(['s', 'm', 'l', 'xl']).default('m'),
});

const block = z.discriminatedUnion('type', [
  blockText, blockFullWidthImage, blockImagePair, blockImageGrid,
  blockFullWidthVideo, blockEmbeddedFilm, blockQuote, blockCredits, blockSpacer,
]);

export type Block = z.infer<typeof block>;

/* ------------------------------------------------------------- collections */

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    /**
     * The work's own title, and therefore a PROPER NOUN in every locale.
     *
     * No `en` is ever declared for it: translating `Epitáfio` or `Dormência 48h` would
     * rename someone's film, and it is the same reasoning that keeps project SLUGS
     * locale-invariant (docs/ARCHITECTURE.md §10.1). Eighteen of the twenty are English
     * or bare names already, because that is how they were published.
     */
    title: localised,
    tagline: localised.partial({ pt: true }).optional(),
    /**
     * The language the project's PUBLISHED PROSE is actually written in.
     *
     * Dead until Phase 11 and load-bearing since: most of these films carry English
     * taglines on Portuguese pages, so `en` here means "the `pt` field already holds
     * English, and no translation is missing". `pt` means the tagline and text blocks are
     * Portuguese prose and must carry an `en`. `npm run validate:i18n` enforces exactly
     * that, so the difference between "already English" and "not translated yet" is a
     * declaration rather than an inference.
     */
    sourceLocale: z.enum(LOCALES).default('pt'),

    // --- taxonomy: data, not structure (§4.5)
    categories: z.array(reference('categories')).min(1),
    tags: z.array(z.string()).default([]),
    collections: z.array(reference('collections')).default([]),

    // --- curation
    featured: z.boolean().default(false),
    homepageOrder: z.number().int().nullable().default(null),
    portfolioOrder: z.number().int().nullable().default(null),
    draft: z.boolean().default(false),

    // --- production metadata
    date: z.coerce.date(),
    year: z.number().int().min(1990).max(2100).optional(),
    client: z.string().optional(),
    roles: z.array(z.string()).default([]),
    credits: z.array(z.object({ role: localised, name: z.string().min(1) })).default([]),

    // --- media
    film: filmRef.optional(),
    poster: mediaRef,
    heroStill: mediaRef.optional(),
    heroVideo: z.string().optional(),
    previewVideo: z.string().optional(),
    /** Which source the media came from. Auditable because Smash/ is mostly 720p (§6.7). */
    sourceOfTruth: z.enum(['youtube', 'smash', 'wordpress', 'master', 'unknown']).default('unknown'),
    masterRequired: z.boolean().default(false),
    /**
     * Why this project has nothing watchable. The ONLY way past the refine below.
     *
     * It exists because one published project genuinely has a broken video reference on
     * the live site (decision D6), and the honest model is "declare it", not "guess a
     * video id" and not "loosen the guardrail". Setting this is a conscious act that
     * names the open decision; forgetting a film still fails the build.
     */
    filmUnavailable: z.string().min(1).optional(),

    // --- page body
    blocks: z.array(block).default([]),

    // --- relationships
    related: z.array(reference('projects')).default([]),
    /** Old slugs this project used to live at; redirects are generated from these. */
    previousSlugs: z.array(z.string()).default([]),

    seo: seoFields,
  })
    // A hero video without a still is the exact failure the live site ships. Refuse it.
    .refine((d) => !d.heroVideo || d.heroStill !== undefined, {
      message: 'heroStill is required whenever heroVideo is set (docs/ARCHITECTURE.md §4.2b)',
      path: ['heroStill'],
    })
    // Non-negotiable: a project must be watchable somehow — or must SAY why it is not.
    .refine((d) => Boolean(d.film ?? d.heroVideo ?? d.previewVideo ?? d.filmUnavailable), {
      message: 'a project needs at least one of: film, heroVideo, previewVideo — or filmUnavailable explaining why it has none',
      path: ['film'],
    }),
});

/**
 * Categories.
 *
 * Names are OWNER-FACING and NOT DECIDED (decision R5) — the `name` field is localised
 * data, so renaming is a content edit. `previousSlugs` keeps indexed URLs resolving
 * after a rename (docs/ROUTE_MIGRATION.md §2).
 */
const categories = defineCollection({
  loader: glob({ pattern: '**/*.{yml,yaml}', base: './src/content/categories' }),
  schema: z.object({
    name: localised,
    description: localised.partial({ pt: true }).optional(),
    order: z.number().int().default(0),
    /** Working identifier, so code never depends on an owner-facing name. */
    internalId: z.string().min(1),
    previousSlugs: z.array(z.string()).default([]),
    /** Token name from src/styles/tokens.colour.css — never a raw hex (CLAUDE.md §4). */
    accentToken: z.string().optional(),
    hidden: z.boolean().default(false),
  }),
});

/** Curated sets — "Showreel 2026", a festival selection. Independent of categories. */
const collections = defineCollection({
  loader: glob({ pattern: '**/*.{yml,yaml}', base: './src/content/collections' }),
  schema: z.object({
    name: localised,
    description: localised.partial({ pt: true }).optional(),
    order: z.number().int().default(0),
    internalId: z.string().min(1),
    hidden: z.boolean().default(false),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    pageId: z.enum(['home', 'about', 'portfolio', 'services', 'contact', 'thank-you']),
    title: localised,
    seo: seoFields,
    draft: z.boolean().default(false),
  }),
});

const legal = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/legal' }),
  schema: z.object({
    pageId: z.enum(['terms', 'privacy']),
    title: localised,
    /** Provenance: this text is archived verbatim and must not be edited (CLAUDE.md §2). */
    sourceUrl: z.url(),
    capturedAt: z.string(),
    seo: seoFields,
  }),
});

/**
 * Services — the four the company actually publishes on /servicos/.
 *
 * NOT the five portfolio categories. Those are a different list describing a different
 * thing, and merging them would invent an offer the company does not make.
 *
 * `excerpt` is the ONE published sentence the homepage shows, and the refinement below is
 * decision A44 moved from a validator into the schema: an excerpt that is not a literal
 * substring of its own published description fails the build. Copy may be SELECTED for a
 * shorter context; it may never be rewritten, shortened or joined (CLAUDE.md §2).
 */
const services = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/services' }),
  schema: z.object({
    title: localised,
    description: localised,
    excerpt: localised.partial({ pt: true }).optional(),
    order: z.number().int().default(0),
  })
    .refine(
      (d) => !d.excerpt?.pt || d.description.pt.includes(d.excerpt.pt),
      {
        message: 'excerpt must appear verbatim inside description — published copy may be selected, never rewritten (CLAUDE.md §2, decision A44)',
        path: ['excerpt'],
      },
    )
    /**
     * PHASE 11 — the same rule, in English.
     *
     * The excerpt is a SELECTION from the description, and selection is a property of the
     * relationship rather than of the language. If the English excerpt is not a literal
     * substring of the English description, then one of the two was reworded on its own
     * and the two pages that print them — the homepage and /en/services/ — have started
     * disagreeing about what the company offers.
     */
    .refine(
      (d) => !d.excerpt?.en || (d.description.en?.includes(d.excerpt.en) ?? false),
      {
        message: 'excerpt.en must appear verbatim inside description.en — the selection rule holds in both languages',
        path: ['excerpt', 'en'],
      },
    )
    /** An English excerpt without an English description is a half-translated service. */
    .refine(
      (d) => !d.description.en || Boolean(d.title.en),
      { message: 'a service translated into English needs an English title too', path: ['title', 'en'] },
    ),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/testimonials' }),
  schema: z.object({
    quote: localised,
    /** Verbatim attribution line as published, e.g. "— Marco Ferreira, digiUP". */
    attribution: z.string().min(1),
    order: z.number().int().default(0),
  }),
});

const team = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/team' }),
  schema: z.object({
    name: z.string().min(1),
    role: localised,
    portrait: mediaRef.optional(),
    links: z.array(z.object({
      label: z.string().min(1),
      url: z.url(),
      platform: z.enum(['instagram', 'linkedin', 'youtube', 'vimeo', 'other']).default('other'),
    })).default([]),
    order: z.number().int().default(0),
  }),
});

/**
 * Site settings — owner-editable facts (contact details, socials, copyright).
 *
 * Deliberately NOT populated yet: the canonical contact email is contested on the live
 * site (decision D2 — the displayed address differs from the mailto: target), and
 * CLAUDE.md §8 forbids guessing.
 */
const settings = defineCollection({
  loader: file('./src/content/settings/site.yml'),
  schema: z.object({
    id: z.string(),
    email: z.email().nullable().default(null),
    emailStatus: z.enum(['confirmed', 'disputed', 'unknown']).default('unknown'),
    phones: z.array(z.object({ label: z.string(), number: z.string() })).default([]),
    socials: z.array(z.object({
      platform: z.enum(['instagram', 'youtube', 'whatsapp', 'linkedin', 'vimeo', 'other']),
      url: z.url(),
      label: z.string().min(1),
    })).default([]),
    copyright: localised.partial({ pt: true }).optional(),
    organisation: z.object({
      legalName: z.string().nullable().default(null),
      vatId: z.string().nullable().default(null),
      address: z.string().nullable().default(null),
    }).default({ legalName: null, vatId: null, address: null }),
  }),
});

const navigation = defineCollection({
  loader: file('./src/content/settings/navigation.yml'),
  schema: z.object({
    id: z.string(),
    items: z.array(z.object({
      /** Reference into src/i18n/routes.ts, never a hardcoded href. */
      pageId: z.enum(['home', 'about', 'portfolio', 'services', 'contact', 'thank-you', 'terms', 'privacy']),
      labelKey: z.string().min(1),
      showIn: z.array(z.enum(['header', 'footer'])).default(['header']),
      order: z.number().int().default(0),
    })).default([]),
  }),
});

export const collections_ = {
  projects, categories, collections, pages, legal,
  services, testimonials, team, settings, navigation,
};

export { collections_ as collections };
