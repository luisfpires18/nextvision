/**
 * Page content — the owner-editable half of every page that is not a collection entry.
 *
 * PHASE A0 (docs/ADMIN_DASHBOARD_PLAN.md §2.2). The homepage hero video, the page
 * images, the BTS frames and the page prose used to be literals inside components and
 * `src/lib/*.ts`. They live in `src/content/page-content/*.json` now, one file per page,
 * so that changing them is a data edit — by hand today, through the admin later — and
 * never a code change. Every string is unchanged; only its home moved.
 *
 * JSON rather than a content collection because the copy is read SYNCHRONOUSLY by
 * modules like `page-meta.ts`, and a static JSON import keeps every existing call site
 * as it was. The schema below is still the guardrail: a malformed file fails the build at
 * import time, and a media key the manifest does not hold fails it too.
 *
 * Provenance is unchanged: `scripts/validate-data.mjs` walks these files and checks every
 * `{ text, from }` against the archive, exactly as it checked the `v()` literals before.
 */

import { z } from 'astro/zod';
import { getMedia, hasMedia } from './media.ts';
import home from '../content/page-content/home.json' with { type: 'json' };
import about from '../content/page-content/about.json' with { type: 'json' };
import services from '../content/page-content/services.json' with { type: 'json' };
import contact from '../content/page-content/contact.json' with { type: 'json' };
import thanks from '../content/page-content/thanks.json' with { type: 'json' };
import portfolio from '../content/page-content/portfolio.json' with { type: 'json' };
import bts from '../content/page-content/bts.json' with { type: 'json' };
import brand from '../content/page-content/brand.json' with { type: 'json' };

/**
 * Where a string came from: the live page it was archived from (`/sobre/`), or an owner's
 * edit in the admin (`owner:2026-10-22`, decision A2). Archived strings are checked word
 * for word against the archive by validate:data; owner strings are the owners' own copy.
 */
export const OWNER_SOURCE = /^owner:\d{4}-\d{2}-\d{2}$/;

/** A published string: the Portuguese, where it came from, its translation. */
const provenanced = z.object({
  text: z.string().min(1),
  from: z.string().refine((f) => f.startsWith('/') || OWNER_SOURCE.test(f), {
    message: 'from must be an archived page path or owner:YYYY-MM-DD',
  }),
  en: z.string().min(1).optional(),
});

/** A key into the media manifest. Checked against it, so a typo fails the build. */
const mediaKey = z.string().refine(hasMedia, { message: 'not in src/data/media-manifest.json' });

/** A still. A video key here would render as a broken picture. */
const imageKey = mediaKey.refine((k) => getMedia(k)?.kind === 'image', { message: 'must be an image, not a video' });

/** A film that can open a page: a video, AND the poster the page paints before it plays. */
const videoKey = mediaKey.refine((k) => getMedia(k)?.kind === 'video' && hasMedia(`${k}/poster`), {
  message: 'must be a video with a poster',
});

/** A fixed set of named strings. Named, so a renamed or missing key fails the build. */
function strings<const K extends string>(...keys: K[]) {
  return z.object(Object.fromEntries(keys.map((k) => [k, provenanced])) as Record<K, typeof provenanced>);
}

export const PAGE_SCHEMAS = {
  home: z.object({
    heroVideo: videoKey,
    copy: strings(
      'heroLineA', 'heroLineB', 'workLineA', 'workLineB', 'workBody', 'workBodyB', 'ctaPortfolio',
      'servicesTitle', 'servicesLead', 'servicesLeadFull',
      'aboutTitle', 'aboutLead', 'aboutBodyB', 'aboutBodyFull',
      'contactTitle', 'contactLead', 'contactBody', 'ctaContact', 'phoneNote', 'copyright',
    ),
  }),
  about: z.object({
    copy: strings('storyB', 'workLineA', 'workLineB', 'ctaPortfolio').extend({ closing: z.array(provenanced).min(1) }),
    wordpressExcerpt: z.string(),
  }),
  services: z.object({
    leadImage: imageKey,
    /** The portfolio categories whose projects join the stage after the collage. Slugs from src/content/categories/. */
    categories: z.array(z.string().regex(/^[a-z0-9-]+$/)),
    /** The stage's opening stills. The second opens in front. Owners add and remove them in the admin. */
    collage: z.array(imageKey),
    /** The films under the stage, top to bottom; none is allowed. `title` is the film's name, used only as the accessible name. */
    films: z.array(z.object({
      id: z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'must be an 11-character YouTube video id'),
      title: z.string().min(1),
      poster: imageKey,
    })),
    lead: z.array(z.object({ text: z.string().min(1), en: z.string().min(1), mark: z.boolean().optional() })).min(1),
    copy: strings('closeLineA', 'closeLineB', 'closeBody'),
    wordpressExcerpt: z.string(),
  }).refine((s) => s.collage.length + s.categories.length > 0, { message: 'the stage needs at least one image or one category', path: ['collage'] }),
  contact: z.object({
    banner: imageKey,
    copy: strings('formHeading', 'directHeading', 'directBody'),
    form: z.object({
      labels: strings('nome', 'email', 'telefone', 'mensagem'),
      consent: provenanced,
      consentLink: z.object({ pt: z.string().min(1), en: z.string().min(1) }),
      submit: provenanced,
    }),
    wordpressExcerpt: z.string(),
  }),
  thanks: z.object({ copy: strings('title', 'lineA', 'lineB'), wordpressExcerpt: z.string() }),
  portfolio: z.object({ copy: strings('title', 'lead', 'all', 'more') }),
  bts: z.object({ frames: z.array(imageKey).min(1) }),
  /**
   * The words the site repeats on several pages, editable in the admin since 2026-11-07
   * ("Textos do site"): the brand's closing line, the opening's greeting, the reel's two
   * lines, and the five section names the menu, the footer and the page spines show.
   * They are one language on the site today, so a name has both languages and the same
   * text is allowed in each.
   */
  brand: z.object({
    tagline: z.string().min(1).max(60),
    hello: z.string().min(1).max(20),
    talk: z.object({ a: z.string().min(1).max(12), b: z.string().min(1).max(12) }),
    menu: z.object({
      home: z.object({ pt: z.string().min(1).max(40), en: z.string().min(1).max(40) }),
      about: z.object({ pt: z.string().min(1).max(40), en: z.string().min(1).max(40) }),
      commercial: z.object({ pt: z.string().min(1).max(40), en: z.string().min(1).max(40) }),
      cinema: z.object({ pt: z.string().min(1).max(40), en: z.string().min(1).max(40) }),
      bts: z.object({ pt: z.string().min(1).max(40), en: z.string().min(1).max(40) }),
    }),
  }),
};

function load<S extends z.ZodType>(page: string, schema: S, data: unknown): z.infer<S> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`src/content/page-content/${page}.json is invalid:
${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

export type PageFile = keyof typeof PAGE_SCHEMAS;

export const PAGE_CONTENT = {
  home: load('home', PAGE_SCHEMAS.home, home),
  about: load('about', PAGE_SCHEMAS.about, about),
  services: load('services', PAGE_SCHEMAS.services, services),
  contact: load('contact', PAGE_SCHEMAS.contact, contact),
  thanks: load('thanks', PAGE_SCHEMAS.thanks, thanks),
  portfolio: load('portfolio', PAGE_SCHEMAS.portfolio, portfolio),
  bts: load('bts', PAGE_SCHEMAS.bts, bts),
  brand: load('brand', PAGE_SCHEMAS.brand, brand),
};
