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
import { hasMedia } from './media.ts';
import home from '../content/page-content/home.json' with { type: 'json' };
import about from '../content/page-content/about.json' with { type: 'json' };
import services from '../content/page-content/services.json' with { type: 'json' };
import contact from '../content/page-content/contact.json' with { type: 'json' };
import thanks from '../content/page-content/thanks.json' with { type: 'json' };
import portfolio from '../content/page-content/portfolio.json' with { type: 'json' };
import bts from '../content/page-content/bts.json' with { type: 'json' };

/** A published string: the Portuguese, the page it was published on, its translation. */
const provenanced = z.object({
  text: z.string().min(1),
  from: z.string().startsWith('/'),
  en: z.string().min(1).optional(),
});

/** A key into the media manifest. Checked against it, so a typo fails the build. */
const mediaKey = z.string().refine(hasMedia, { message: 'not in src/data/media-manifest.json' });

/** A fixed set of named strings. Named, so a renamed or missing key fails the build. */
function strings<const K extends string>(...keys: K[]) {
  return z.object(Object.fromEntries(keys.map((k) => [k, provenanced])) as Record<K, typeof provenanced>);
}

const schemas = {
  home: z.object({
    heroVideo: mediaKey,
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
    leadImage: mediaKey,
    collage: z.array(mediaKey).length(3),
    lead: z.array(z.object({ text: z.string().min(1), en: z.string().min(1), mark: z.boolean().optional() })).min(1),
    copy: strings('closeLineA', 'closeLineB', 'closeBody'),
    wordpressExcerpt: z.string(),
  }),
  contact: z.object({
    banner: mediaKey,
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
  bts: z.object({ frames: z.array(mediaKey).min(1) }),
};

function load<S extends z.ZodType>(page: string, schema: S, data: unknown): z.infer<S> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`src/content/page-content/${page}.json is invalid:
${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

export const PAGE_CONTENT = {
  home: load('home', schemas.home, home),
  about: load('about', schemas.about, about),
  services: load('services', schemas.services, services),
  contact: load('contact', schemas.contact, contact),
  thanks: load('thanks', schemas.thanks, thanks),
  portfolio: load('portfolio', schemas.portfolio, portfolio),
  bts: load('bts', schemas.bts, bts),
};
