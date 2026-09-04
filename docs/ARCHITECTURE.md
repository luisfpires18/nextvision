# Architecture — Next Vision Films

**Status:** decisions recorded, nothing implemented.
**Date:** 2026-09-01 · **Revision 2** (owner direction change, same day)
**Supersedes:** the open technical questions D13–D22 in `PROJECT_CONTEXT.md` §6.

> ### Revision 2 — what changed and why
>
> The owners supplied authoritative notes that **change the design brief, not the technical
> baseline**. The site is no longer a replication of the current WordPress design; it is a
> **premium, cinematic, motion-led international production-company site**. The existing
> site remains the source of truth for *content, projects, media references and legal copy*
> — it is no longer the *visual* target.
>
> **Kept unchanged** (re-evaluated against the new requirements and confirmed): Astro 5 (§2),
> Content Collections (§4), Cloudflare Workers with Static Assets (§3), R2 (§6), the YouTube
> façade (§6.5), no Cloudflare Stream for v1 (§6.6), Turnstile (§7), Cloudflare Web
> Analytics (§8).
>
> **Changed or added:** scope (§1) · framework re-evaluation against motion (§2.1) ·
> flexible portfolio taxonomy (§4.5) · cinematic project blocks (§4.6) · design system
> demoted to **provisional** pending Tatiana (§5) · media sourcing revised after the
> `Smash/` inventory (§6.7) · **full PT/EN** (§10) · SEO copy rule relaxed (§11.4) ·
> **new §16 Motion architecture** · **new §17 PWA** · **new §18 Source preservation**.
>
> Companion documents: `DESIGN_REFERENCES.md` (principles and visual directions),
> `SMASH_MEDIA_INVENTORY.md` (owner source media).

This document records **decisions**. Where a decision genuinely belongs to the owner it is
marked `OWNER` and listed in §14 — it is not silently resolved. Rejected alternatives and
the reason for rejecting them are in §15.

Inputs: `CLAUDE.md`, `docs/WEBSITE_AUDIT.md`, `docs/content/*`, the font files under
`source-assets/fonts/`, and direct measurement performed for this document (font binary
parsing, brand-asset colour sampling, WCAG contrast computation).

---

## 1. Scope of the first implementation

### What the site is

A **premium, cinematic, interactive, visually distinctive** website for an international
creative film production company. Users must feel NVF's specific vision and identity
within seconds.

**Explicitly not:** a traditional corporate site · a WordPress/Elementor aesthetic ·
standard template sections · generic cards · text-heavy pages · generic AI visual language.

### Preserve (source of truth = the current site)

All 20 projects and their metadata · exact existing copy · legal copy · media references ·
SEO metadata · **every URL that resolves today**. Layout and navigation are **not**
preserved — they may be replaced entirely.

### Build

Cinematic project pages · substantially stronger motion design · smooth scrolling ·
refined page transitions · a loading sequence · excellent mobile experience · **PWA** ·
**Portuguese and English** · SEO/Google optimisation · better portfolio organisation.

### Visual identity is **provisional**

The final identity is still being developed, with **Tatiana** contributing art direction,
typography, mood, colour and visual language. Therefore:

- the sampled brand palette (§5.2) is the **starting** palette, not the final one;
- **Barlow / Barlow Condensed / Space Mono are the current supplied fonts, not permanently approved typography** — they stay supported, and the type system must be swappable;
- colour, type, spacing and **motion** are all token-driven so a change is a token edit, never a refactor (§5.8).

### Not in scope for v1

A CMS or admin UI · a blog · e-commerce · user accounts · site search ·
newsletter automation beyond one provider hand-off · WebGL/3D (§15).

---

## 2. Framework — **Astro** (installed: 7.2.10)

> **Corrected 2026-09-02 (session 4).** This section previously said "Astro 5". That was a
> stale label: current stable is **7.2.10**, and it is what is installed. Everything below
> still holds — the reasoning was never version-specific — but three APIs differ and are
> noted inline: `z` from `astro:content` is deprecated (use `astro/zod`, and zod is v4);
> `output: 'hybrid'` is removed (static + per-route `prerender = false`); and the
> Cloudflare adapter needs `session: false` unless a `SESSION` KV namespace exists.

### Decision

**Astro 7.2.10**, TypeScript strict, `output: 'static'` with `@astrojs/cloudflare` 14.2.6,
and `export const prerender = false` on the two form endpoints only.

Verified peer ranges before install: adapter requires `astro ^7.2.0` + `wrangler ^4.125.0`;
`@astrojs/mdx` 8.0.0 requires `astro ^7.2.6` and Node >= 22.12.0. **Package manager: npm**,
one lockfile.

### Why, against Next.js

| Criterion | Astro | Next.js (App Router) | Winner |
|---|---|---|---|
| **JS shipped for a content page** | 0 KB by default; islands opt in | React + hydration runtime on every route (~90 KB gz baseline) even for static content | **Astro** |
| **Fit to the actual site** | 34 content routes, ~4 genuinely interactive widgets | Optimised for app state, mutations, auth — none present here | **Astro** |
| **Cloudflare path** | First-party `@astrojs/cloudflare`; static output also deploys with no adapter at all | Requires the OpenNext Cloudflare adapter — an extra layer that must track Next releases | **Astro** |
| **Content model** | Content Collections + Zod: typed, **build fails on bad content** | Bring your own (contentlayer-style tooling, or hand-rolled) | **Astro** |
| **20 portfolio projects** | `getCollection('projects')`, one MDX file each | Same outcome, more plumbing | **Astro** |
| **SEO** | Static HTML, full control of `<head>`, official sitemap integration | Equivalent, with more machinery | tie |
| **YouTube embeds / video-heavy pages** | Façade as a tiny vanilla island; nothing else hydrates | A façade component still drags the React runtime onto the page | **Astro** |
| **Build & deploy speed** | 34 pages, seconds | Slower; OpenNext adds a bundling step | **Astro** |
| **Complexity a future dev must learn** | "components render to HTML; islands opt in" | Server vs client components, caching directives, adapter quirks | **Astro** |
| **Future lightweight CMS** | Content Layer loaders; git-backed CMSs edit MDX natively | Equally possible | tie |
| **R2 integration** | Static URLs at build; bindings available in the adapter when needed | Same | tie |
| **Forms** | `prerender = false` API route on the Worker | Route handler / server action | tie |
| **i18n** | Built-in routing, `prefixDefaultLocale: false` → `/` + `/en/` | Built-in, heavier | **Astro** |
| **Maintainability** | Less code, fewer moving parts | More capability the project never uses | **Astro** |

Next.js would win if the project needed client-side application state, authenticated
areas, server actions, or on-demand ISR driven by CMS webhooks. None of those appear in
this brief, now or in the stated future (a *lightweight* CMS).

The decisive argument is the audit's own finding: the site's core disease is **38 scripts
and 30 stylesheets for a page that is text, images and one video**. Choosing a framework
whose floor is a React runtime would re-import a smaller version of the same problem.

**When to revisit:** if the owner asks for a client area, gated deliveries, or an
interactive quoting tool, re-evaluate — Astro can host React islands for that, and a full
migration would only be warranted if the app surface came to dominate.

### 2.1 Re-evaluation against the Revision 2 requirements — **Astro confirmed**

The new brief adds heavy motion, page transitions, persistent smooth scroll and a PWA.
That is the one scenario where an MPA is genuinely harder than an SPA, so the decision was
re-tested rather than assumed.

| New requirement | Does it threaten Astro? | Resolution |
|---|---|---|
| **Refined page transitions** | This is the real MPA risk | **No.** Astro's `<ClientRouter />` swaps the DOM without a full reload and exposes `astro:before-preparation` / `astro:before-swap` / `astro:after-swap` / `astro:page-load`, plus native View Transitions where supported. `blueboypictures.com` — a Portuguese film production site — already ships native View Transitions in production |
| **Persistent smooth scroll across navigations** | The classic MPA failure | **No.** Lenis is initialised once and *persisted* across swaps via `transition:persist` on the scroll root, with `scrollTo(0)` on `astro:after-swap` (§16.4) |
| **Animation lifecycle / cleanup** | Needs explicit teardown | **Solved better than in an SPA** — the swap events are a precise, documented lifecycle. GSAP contexts are reverted on `astro:before-swap` (§16.9) |
| **Loading sequence** | — | First paint is real HTML; the loader masks *asset* loading, not framework boot |
| **PWA / service worker** | — | Static output is the easiest possible thing to precache (§17) |
| **Cinematic interactions** | — | Islands where needed; the rest is CSS and GSAP on a static page |
| **SEO explicitly required** | Would kill a CSR shell | **Astro's core strength.** Two references (`resn.co.nz` 4 KB, `activetheory.net` 6 KB) ship empty shells and forfeit exactly this |

**Verdict: Astro 5 stays.** Nothing in the new brief needs a client-side framework, and
one new requirement — SEO — actively penalises the alternative. The reference-site
fingerprints in `DESIGN_REFERENCES.md` §2 reinforce it: the two heaviest sites in the set
(Instrument at **3.4 MB** of HTML, The Line at **1.6 MB**) are framework-driven, and
Locomotive — whose scroll library the whole genre uses — publishes an article titled
*"Why don't we use front-end frameworks"*.

Adjustment: `<ClientRouter />` is now **required**, not optional (§16.3).

### Fixed choices inside Astro

| Setting | Value | Reason |
|---|---|---|
| `trailingSlash` | `'always'` | Matches WordPress's current URLs exactly (§11) |
| `site` | `https://www.nextvisionfilms.com` | Canonicals, sitemap |
| `output` | `'static'` | Everything prerenders except `/api/*` |
| Adapter | `@astrojs/cloudflare` | Needed only so the two API routes run on the Worker |
| Integrations | `@astrojs/mdx`, `@astrojs/sitemap` | Content + SEO |
| Styling | **Plain CSS with custom properties**, no framework | ~15 components; a utility framework adds a build dependency and a class-soup migration cost for no benefit at this size. Tokens in one file satisfy CLAUDE.md's "restyle = token change" requirement |
| UI framework islands | **None** | The four interactive widgets are vanilla TS in `<script>` tags |
| Package manager | `npm` | Lowest friction for a future maintainer |
| Node | 22 LTS | Matches Cloudflare's supported runtime |

---

## 3. Hosting & rendering — Cloudflare Workers with Static Assets

### Decision

One Cloudflare **Worker with Static Assets**, built from this repo, serving:

- all 34 prerendered HTML routes as static assets from the edge
- `/api/contact` and `/api/newsletter` as Worker routes
- `_headers`-equivalent caching and security headers set in the Worker

Configuration lives in `wrangler.jsonc` (committed, no secrets). GitHub → Cloudflare
Builds handles deploys; preview deployments for pull requests.

**Why not Cloudflare Pages:** Pages remains supported and would work identically. Workers
with Static Assets is Cloudflare's converged direction and keeps static hosting *and* the
form endpoints in one project, one config file, one deploy. Pages + Pages Functions is
recorded as an equivalent fallback if anything about the Workers path proves awkward at
implementation time.

**Verify at implementation time:** exact adapter/wrangler versions and the current
Workers-Static-Assets configuration keys. This document fixes the *shape*, not version
numbers.

### Expected result vs today

| | Today | Target |
|---|---|---|
| TTFB | 530–620 ms uncached PHP | edge-cached static HTML |
| Requests (homepage) | 89 | < 20 |
| Stylesheets / scripts | 30 / 38 | 1 / ≤ 2 (both small, deferred) |
| Footer payload per page | 12.33 MB `.mov` | 0 by default (§7.4) |

---

## 4. Content architecture

### Decision: Astro Content Collections, local files, Zod-validated. No CMS in v1.

A headless CMS is rejected for v1 because it adds a hosted dependency, a second source of
truth, an auth surface and a monthly cost, for content that changes a handful of times a
year and is edited by two people. Local typed files give **build-time validation** — a
missing field or a bad category slug fails the build instead of shipping a broken page.
That is a stronger guarantee than most CMSs provide, and it costs nothing.

The migration path to a CMS is preserved by choosing formats a CMS can adopt (§4.4).

### 4.1 Collections

| Collection | Location | Format | Count | Why this format |
|---|---|---|---|---|
| `projects` | `src/content/projects/{slug}.mdx` | MDX | 20 | Structured frontmatter + optional prose body. One file per project. Exactly what git-backed CMSs edit natively |
| `categories` | `src/content/categories/{slug}.yml` | YAML | 5 | Pure data, no prose |
| `testimonials` | `src/content/testimonials/{id}.md` | Markdown | 4 | Quotes are long; body text avoids YAML escaping pain |
| `services` | `src/content/services/{id}.md` | Markdown | 4 | Title in frontmatter, description in body |
| `team` | `src/content/team/{slug}.md` | Markdown | 2 | Role + socials in frontmatter |
| `pages` | `src/content/pages/{slug}.md` | Markdown | 6 | Page-specific structured copy (heading lines, CTA labels) in frontmatter |
| `legal` | `src/content/legal/{slug}.md` | Markdown | 2 | Long-form, sourced verbatim from `docs/content/*.txt` |
| `settings` | `src/content/settings/site.yml` | YAML | 1 | Contact details, socials, copyright line — owner-editable |
| `navigation` | `src/content/settings/navigation.yml` | YAML | 1 | Header + footer link lists |

**Rule: one file = one thing.** No exceptions, so the mental model never branches.

### 4.2 The project schema (the important one)

```ts
// src/content.config.ts  (shape, not final code)
const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: z.object({
    title:        z.string(),               // the <h1>, verbatim from the live site
    tagline:      z.string().optional(),    // verbatim; 12 of 20 have one
    category:     reference('categories'),  // validated against the 5 terms
    date:         z.coerce.date(),          // ISO; the "11 Fevereiro '25" display form is derived
    youtubeId:    z.string().regex(/^[\w-]{11}$/).optional(),
    poster:       z.string(),               // R2 key, e.g. "projects/epitafio/poster.jpg"
    preview:      z.string().optional(),    // R2 key for the silent hover loop
    order:        z.number().optional(),    // manual override; defaults to date desc
    draft:        z.boolean().default(false),
    seo: z.object({ description: z.string().optional(), ogImage: z.string().optional() }).default({}),
  }),
});
```

Consequences that matter:

- `category` is a **reference**. A typo fails the build.
- `youtubeId` is a **validated 11-character ID**, not a URL. This structurally prevents the
  current bug where one project stores a `studio.youtube.com/…/edit` link (audit §9.7) and
  another stores a URL with no scheme (§4 table).
- `preview` is optional. The 10 projects with no clip (§9.8) simply omit it and the card
  renders a still — a defined state, not a broken `<source src="">`.
- `poster` and `preview` hold **R2 keys, never absolute URLs**. Changing CDN domain or
  image strategy is a change in one helper (§6).

### 4.2b Revision 2 — the project schema, extended

The owners dislike the current organisation and want cinematic project pages. The schema
grows accordingly, while staying **structured** — no free-form page builder.

```ts
schema: z.object({
  // identity
  title, tagline?, slug (from filename),
  // taxonomy — see §4.5
  categories:  z.array(reference('categories')).min(1),   // MANY, not one
  tags:        z.array(z.string()).default([]),
  collections: z.array(reference('collections')).default([]),
  // curation
  featured:    z.boolean().default(false),
  homepage:    z.boolean().default(false),
  order:       z.number().optional(),            // manual override
  draft:       z.boolean().default(false),
  // production metadata (film-industry fields, all optional)
  client:      z.string().optional(),
  year:        z.number().optional(),
  roles:       z.array(z.string()).default([]),  // "Direção", "Produção", …
  credits:     z.array(z.object({ role: z.string(), name: z.string() })).default([]),
  // media
  film:        FilmRef.optional(),               // youtube | vimeo | r2
  heroVideo:   MediaRef.optional(),              // R2 key, cinematic hero
  heroStill:   MediaRef.optional(),              // always required if heroVideo set
  preview:     MediaRef.optional(),              // silent hover loop
  poster:      MediaRef,                         // required
  sourceOfTruth: z.enum(['youtube','smash','wordpress','master']).optional(),
  // page body
  blocks:      z.array(Block).default([]),       // §4.6
  seo:         SeoFields,
  locale:      z.enum(['pt','en']).default('pt'),
})
```

`sourceOfTruth` records **which master a project's media came from**, so the decision is
auditable — necessary because `Smash/` turned out to be mostly 720p web exports
(`SMASH_MEDIA_INVENTORY.md` §1).

`heroStill` is **mandatory whenever `heroVideo` is set**, enforced by a Zod refinement.
That makes the current "black box until decode" failure (audit §9.11) impossible to ship.

### 4.5 Portfolio taxonomy — flexible by construction

The current WordPress taxonomy is **not** preserved as-is. It is imported so no data is
lost, then treated as changeable data.

**Four independent axes**, so the owners can reorganise without a frontend change:

| Axis | Purpose | Cardinality |
|---|---|---|
| `categories` | The primary way work is grouped and browsed | **many per project** |
| `tags` | Free-form, cheap, no route of their own | many |
| `collections` | **Curated sets** — "Showreel 2026", "Casamentos 2025", a festival selection | many |
| `featured` / `homepage` / `order` | Curation and manual ordering | flags |

- **Category names, slugs and descriptions live in data.** Renaming one is a file edit; a redirect from the old slug is generated automatically from a `previousSlugs` field.
- **Adding a category needs no frontend change** — routes are generated from the collection.
- A project may sit in several categories, which the current one-term taxonomy cannot express.
- **No final category names are proposed here.** Two starting proposals for owner review are in §4.5a; the decision is theirs.

#### 4.5a Two proposals for owner review (not decided)

The existing five (`Ficção`, `Moda & Identidade`, `Visual Storytelling`, `Corporativo`,
`Casamentos`) have a known problem: four of the five *descriptions* do not match their
heading (audit §9.3), and the five categories do not correspond to the four services on
`/servicos/`. Both proposals below preserve every project; neither invents copy.

**Proposal A — by form (what the film is).** Closest to today, minimal disruption:
`Ficção` · `Videoclipe` · `Moda & Identidade` · `Marcas` (replacing `Corporativo`) ·
`Casamentos` · `Documentário`.

**Proposal B — by intent (why it exists).** Fewer, broader, better for a small catalogue,
and it removes the current services-vs-categories mismatch:
`Narrativa` (fiction, trailers, music video) · `Marcas` (corporate, advertising, brand) ·
`Pessoas` (weddings, portraits, lifestyle) — with **tags** carrying the finer grain
(`videoclipe`, `moda`, `documentário`, `evento`).

Both keep the five current slugs alive as redirects. **Owner decision — see §14.**

### 4.6 Cinematic project pages — a closed set of blocks

A `blocks` array of **discriminated-union** entries. Creative flexibility, bounded
consistency, no page builder. Each block is a component with a fixed contract:

| Block | Fields | Notes |
|---|---|---|
| `fullscreen-media` | image \| video, caption?, `fit` | Full-bleed moment |
| `media-pair` | two media, `weight: left \| right \| equal` | Asymmetric layouts |
| `image-sequence` | media[], `mode: strip \| stack \| scrub` | `scrub` is scroll-driven and degrades to `strip` |
| `text` | markdown, `width: narrow \| wide`, `align` | Editorial prose |
| `pull-quote` | text, attribution? | |
| `video-embed` | FilmRef, poster | Façade-loaded (§6.5) |
| `credits` | rows of role + name | Formal end block |
| `metadata` | client, year, roles, categories | The Space Mono information band |
| `spacer` | size token | Deliberate negative space |

**Rules:** ≤ 9 block types, ever. Every block works at 320 px. Every block has a
reduced-motion form. New block types need an architecture decision, not a content edit.

### 4.3 What is NOT content

Anything the owner should never need to touch stays in `src/config/`: the R2 base URL,
responsive width ladders, SEO title templates, cache policy. Typed TS, not YAML.

### 4.4 CMS migration path (deliberate, not accidental)

The seam is the **collection loader**. Content lives behind `getCollection()`; components
never read files. Swapping the source is one file:

1. **Git-backed CMS** (Decap / Sveltia / Pages CMS) — edits the same MDX/YAML in place.
   **Zero code change.** This is the recommended first step if the owner wants a UI.
2. **Headless CMS** (Sanity/Storyblok/…) — replace `glob()` with that CMS's Astro loader.
   Schemas and components stay.

Because option 1 needs no code change at all, a CMS is a *later, cheap* decision rather
than an upfront commitment.

---

## 5. Design system architecture

Produced with the `frontend-design` skill loaded.

> ### ⚠ Revision 2 — this system is **PROVISIONAL**
>
> The final visual identity is still being developed, with **Tatiana** contributing art
> direction, typography, mood, colour and visual language.
>
> - The palette below is the **starting** palette. Its measured facts (§5.2) remain valid whatever is chosen.
> - **The typography in §5.3 is not approved.** Barlow / Barlow Condensed / Space Mono are the *currently supplied* fonts and stay supported; the roles, scale and pairing are a proposal.
> - Nothing here is locked until **Review A** (`IMPLEMENTATION_PLAN.md`).
> - What *is* fixed is §5.8: every one of these values is a token, so changing the identity is a token edit and never a refactor.
>
> Visual directions for that review are in `DESIGN_REFERENCES.md` §8.

### 5.1 The trap, stated honestly

Two AI-default looks dominate right now: **(a)** warm cream + high-contrast serif +
terracotta accent, and **(b)** near-black with one bright accent. NVF's existing palette
sits on top of (a). The entire cinematic reference set sits on top of (b). **Neither pole
is safe by default**, and the new brief explicitly rejects "generic AI visual language".

What keeps NVF out of both is the thing neither default has: **a four-colour retro system
that is genuinely theirs** (§5.2), and the striped wordmark it comes from. The identity has
to be earned through structure, typography and motion — not through picking a background
colour.

### 5.2 Colour — sourced from the brand's own swatch file, not invented

The audit listed the CSS colours. For this document the actual brand asset
`colors.png` (100×22, referenced on `/sobre/`) was decoded pixel-by-pixel. It is **four
equal swatches** — the company's defined accent palette:

| Swatch | Hex | Share |
|---|---|---|
| Gold | `#EFB025` | 25% |
| Rust | `#D54B27` | 25% |
| **Oxblood** | `#982703` | 25% |
| **Teal** | `#3D7D70` | 25% |

The logo wordmark ink samples as `#292929`.

**Two of the four brand colours — oxblood and teal — appear nowhere in the live site's
CSS.** They are part of the identity and are currently unused.

Measured contrast (WCAG 2.1), against cream `#F0EAD6` and ink `#292929`:

| Colour | on cream | white on it | ink on it |
|---|---|---|---|
| Ink `#292929` | **12.09 AAA** | — | — |
| Oxblood `#982703` | **6.64 AA** | **8.00 AAA** | 1.82 ✗ |
| Teal `#3D7D70` | 4.00 UI-only | **4.81 AA** | 3.02 UI-only |
| Rust `#D54B27` | 3.59 UI-only | 4.32 large-only | 3.37 UI-only |
| Gold `#EFB025` | 1.60 ✗ | 1.93 ✗ | **7.56 AAA** |

**This resolves audit §9.23 without inventing a single colour.** Oxblood — already the
brand's — is the accessible workhorse the palette was missing.

**Token rules (binding):**

```
--ground      #F0EAD6   page background
--ink         #292929   all body text                     12.09 AAA on ground
--accent      #982703   links, small accent text, primary button fill (white label)
--rust        #D54B27   large display accents, graphic elements, secondary fill
--gold        #EFB025   SURFACE ONLY — always with --ink on it. Never text. Never white on it.
--teal        #3D7D70   surface with white text; graphic element
--surface-dk  #1E1E1E   inverted sections, footer
```

Hard rules, enforced in review:
- Gold is never a text colour and never carries white text.
- Rust carries white only at ≥24px, or ≥19px semibold; below that, use oxblood.
- Every interactive element meets 3:1 for its non-text boundary and 4.5:1 for its label.

**Category colour-coding.** Five categories, five brand values. Colour becomes information
— it tells you what kind of film you are looking at before you read the label:

| Category | Token |
|---|---|
| Ficção | `--accent` oxblood |
| Visual Storytelling | `--rust` |
| Casamentos | `--gold` |
| Corporativo | `--teal` |
| Moda & Identidade | `--ink` |

Applied as a hairline rule and a metadata dot — never as the only signal, always paired
with the text label.

### 5.3 Typography — from the actual supplied files

Every fact below was read from the font binaries in `source-assets/fonts/`, not assumed.

**Inventory**

| Family | Files | Format | Weights (`usWeightClass`) | Italics | Variable? | Version | Glyphs | Width class |
|---|---|---|---|---|---|---|---|---|
| Barlow | 18 | static TTF | 250, 275, 300, 400, 500, 600, 700, 800, 900 | all 9 | **no** (`fvar` absent) | 1.408 | 680 | 5 (normal) |
| Barlow Condensed | 18 | static TTF | same 9 | all 9 | **no** | 1.408 | 680 | 3 (condensed) |
| Space Mono | 4 | static TTF | 400, 700 | both | **no** | 1.003 | 760 / 724 | 5 (normal) |

Notes that affect the CSS:
- **Thin is 250 and ExtraLight is 275**, not the usual 100/200. `@font-face` declarations
  must use the real values or the browser will synthesise the wrong face.
- Naming follows the RIBBI convention — `Barlow-Black.ttf` reports family
  `Barlow Black` / subfamily `Regular`. Irrelevant once we declare one
  `font-family: Barlow` with explicit `font-weight`, but it will look odd in a font menu.
- Units per em: 1000 across all three, so metrics are directly comparable.
- **Coverage verified**: 525 codepoints (Barlow) / 624 (Space Mono). Every Portuguese
  diacritic present (`á à â ã é ê í ó ô õ ú ü ç` + capitals). Curly quotes, en/em dash,
  ellipsis, `€`, `«»`, `º`, `ª` all present. Latin-Extended and Vietnamese present. No
  Cyrillic, no Greek — irrelevant here.
- No WOFF2 supplied. No variable fonts supplied.

**Faces to self-host (6) — provisional.** TTF → subsetted WOFF2 at build. Latin + Latin-Ext
subset. If Tatiana changes the typeface, `scripts/fonts-build.mjs` takes a different input
folder and the `--font-*` tokens change; **no component changes.**

| Role | File | Est. WOFF2 |
|---|---|---|
| Display | `BarlowCondensed-Bold.ttf` (700) | ~16 KB |
| Display secondary | `BarlowCondensed-Medium.ttf` (500) | ~16 KB |
| Body | `Barlow-Regular.ttf` (400) | ~17 KB |
| UI / emphasis | `Barlow-SemiBold.ttf` (600) | ~17 KB |
| Metadata | `SpaceMono-Regular.ttf` (400) | ~15 KB |
| Metadata emphasis | `SpaceMono-Bold.ttf` (700) | ~15 KB |

≈ 96 KB total; **3 preloaded** (Barlow Condensed 700, Barlow 400, Space Mono 400) ≈ 48 KB.

**Not shipped in v1:** all 34 remaining files — every italic (no italic run exists in the
site's copy) and the 250/275/300/800/900 weights. They stay in `source-assets/fonts/` so
adding one later is a build-script line, not a re-supply.

**Role assignment — and why it is right for this subject.** Barlow Condensed set tight and
heavy is slate and end-credit typography; it belongs to film. Space Mono for dates,
categories and runtimes is the vernacular of a camera slate and an edit decision list —
so mono here is *information design*, not decoration. Barlow carries prose without
competing.

**Scale** — fluid, rem-based, replacing the current ~10 hardcoded px values:

| Token | Face | Size | Treatment |
|---|---|---|---|
| `--t-display-xl` | BC 700 | `clamp(2.75rem, 1.5rem + 6vw, 6rem)` | uppercase, `-0.02em`, `line-height: .92` |
| `--t-display-l` | BC 700 | `clamp(2rem, 1.2rem + 3.5vw, 3.75rem)` | uppercase, `-0.015em`, `.95` |
| `--t-display-m` | BC 700 | `clamp(1.5rem, 1.1rem + 1.8vw, 2.25rem)` | card titles |
| `--t-lead` | Barlow 400 | `clamp(1.125rem, 1.05rem + .35vw, 1.375rem)` | `line-height: 1.55` |
| `--t-body` | Barlow 400 | `1.0625rem` | `line-height: 1.6`, `max-width: 68ch` |
| `--t-ui` | Barlow 600 | `.9375rem` | buttons, labels |
| `--t-meta` | Space Mono 400 | `.8125rem` | uppercase, `+0.06em` |

Fixes audit §10.2 item 11: no line-height below 1.1 on any running text.

### 5.4 Spacing, layout, grid

- **Spacing scale** (replaces the measured 63–224 px drift): `4 8 12 16 24 32 48 64 96 128 160`, exposed as `--space-1 … --space-11`.
- **Section rhythm:** `--space-section: clamp(4rem, 2rem + 8vw, 10rem)`. One value, used everywhere.
- **Measures:** `--w-text: 68ch` · `--w-content: 1140px` (preserved from today, for visual continuity) · `--w-wide: 1440px` for media rows · full-bleed for hero and footer. This adds the missing large-desktop tier (audit §6.6).
- **Grid:** `repeat(auto-fill, minmax(min(100%, 22rem), 1fr))` — column count follows available width instead of three hardcoded breakpoints.
- **Aspect ratios, not pixel heights** (fixes §9.14): project frames are `16 / 9`; portraits `3 / 4`. `object-fit: cover`, `background: var(--surface-dk)`.
- **Breakpoints:** content-driven, not device-driven. Expected `48rem` and `64rem`, confirmed against real content during Phase 3.

### 5.5 The signature element — the frame

One memorable thing; everything else stays quiet.

The project card is a **film frame**: a fixed 16:9 window on the poster, the title in
condensed caps beneath, a Space Mono metadata line (`11 FEV '25 · FICÇÃO`), and a 2px rule
in the category's brand colour. On hover *or keyboard focus*, the silent loop plays inside
the frame — like scrubbing a clip on a timeline — with the title reversing out. On touch,
the still and the metadata are already complete; nothing is hidden behind a hover
(fixes §9.8 / §10.5).

The single risk taken, and its justification: the portfolio index becomes **one contact
sheet of all 20 films with category filtering**, rather than five separate archives you
must visit in turn. The five category routes remain (URLs are preserved), but a production
company's site must be able to show its whole body of work in one view.

### 5.6 Motion

Purposeful and small. A short page-load sequence on the hero; frame previews on hover/focus;
0.2–0.3 s transitions matching the existing feel. **All of it behind
`@media (prefers-reduced-motion: no-preference)`** — including autoplaying video, which
today ignores the preference entirely (§8.9). Hover previews additionally gated on
`@media (hover: hover) and (pointer: fine)`.

### 5.7 Accessibility floor (non-negotiable)

Exactly one `<h1>` per page · real heading hierarchy · accessible names on every link and
control · visible `:focus-visible` on everything · navigation emitted **once** and
restyled by CSS (kills the 20 duplicate tab stops) · every form field labelled · contrast
rules of §5.2 enforced · correct `lang` per locale · skip link retained ·
**every hover behaviour has a touch and keyboard equivalent** · **all motion honours
`prefers-reduced-motion`** (§16.7).

### 5.8 Token architecture — the requirement that outlives the design

Because the identity is not final, **every** design value is a CSS custom property in one
place, and components reference tokens only. Four token families:

```
src/styles/
  tokens.colour.css    --ground --ink --accent --rust --gold --teal --surface-* …
  tokens.type.css      --font-display --font-body --font-mono --t-* (sizes, leading, tracking)
  tokens.space.css     --space-1…11 --space-section --w-text --w-content --w-wide --radius-*
  tokens.motion.css    --dur-* --ease-* --stagger-* --parallax-*     ← new in Revision 2
```

**Binding rules**
1. No component may contain a raw hex, px size, font family or animation duration.
2. Motion is tokenised exactly like colour — a "calmer site" is a `--dur-*` edit.
3. Themes are token overrides on a root attribute (`[data-theme]`), so a dark and a cream direction can both exist and be compared **without a rebuild** — directly useful at Review A.
4. `/styleguide` renders every token with its live value and computed contrast, and is the artefact reviewed at Review A.

This is what makes "the identity is not final" a manageable condition rather than a risk.

---

## 6. Media architecture

### 6.1 Where each thing lives

| Asset | Home | Why |
|---|---|---|
| Logo (SVG), favicons, UI icons | **Git** (`src/assets/`) | Tiny, near-static, must be inlined/hashed at build. < 200 KB total |
| Fonts (WOFF2, built from `source-assets/`) | **Git** (`src/assets/fonts/`) | ~96 KB, must be preloaded from the same origin |
| Project posters, team portraits, page imagery | **R2** | Owner-replaceable; CLAUDE.md §6 keeps image binaries out of git |
| Short silent preview loops, hero/brand video | **R2** | Owner-replaceable, large |
| Full project films (20) | **YouTube — stay** | See §6.5 |
| Generated media manifest (JSON, text) | **Git** | It is source, not a binary; it is what makes R2 assets renderable without layout shift |

**Cloudflare Stream: not used in v1.** See §6.6 for the reasoning and the trigger to revisit.

### 6.2 R2 key convention

Grouped by entity, no dates in the path (dates change and are often wrong), stable and
guessable so a file can be replaced in place.

```
projects/{slug}/poster.jpg                 original, source of truth
projects/{slug}/poster-{w}.{hash}.avif     generated derivative
projects/{slug}/poster-{w}.{hash}.webp     generated derivative
projects/{slug}/poster-{w}.{hash}.jpg      generated fallback
projects/{slug}/preview.mp4                silent loop, H.264
projects/{slug}/preview.webm               silent loop, VP9/AV1
projects/{slug}/preview-poster.jpg         first frame
projects/{slug}/stills/{nn}.jpg            future gallery

team/{person-slug}/portrait.jpg
pages/{page-slug}/{name}.jpg               e.g. pages/contactos/banner.jpg
video/hero/we-are-nvf-{height}p.mp4|webm
video/hero/we-are-nvf-poster.jpg
brand/og-default.jpg
docs/{filename}                            future downloadables
```

**Caching:** originals `max-age=86400` (replaceable in place). Derivatives carry a content
hash and get `max-age=31536000, immutable` — so replacing a poster never requires a cache
purge; new derivatives simply have new names.

Bucket bound to a custom subdomain (e.g. `media.nextvisionfilms.com`) — `OWNER` to confirm
the hostname. The site never uses S3 credentials at runtime; it emits plain HTTPS URLs.

### 6.3 The media manifest — how R2 assets avoid layout shift

R2 images cannot be measured at build time, and missing intrinsic dimensions are the
classic cause of CLS. Solution:

`scripts/media-sync.mjs` — run locally by the owner:

1. reads originals from a staging folder (or from R2),
2. generates the width ladder in AVIF + WebP + JPEG with `sharp`,
3. uploads originals and derivatives to R2 via the S3-compatible API,
4. writes **`src/data/media-manifest.json`** — key → `{ width, height, hash, formats[] }`.
   *(Moved out of `src/content/` in session 4: that directory is scanned for content
   collections, so a loose JSON file there is ambiguous.)*

Components then render a complete `<img>` with `width`, `height`, `srcset`, `sizes`,
`loading`, `decoding` — from data, with **zero CLS**. The manifest is text, tiny, diffable
and committed. This is the "media manifest / structured data layer" CLAUDE.md §6 requires.

The whole thing sits behind one helper:

```ts
imageProps(key, { sizes, priority }) → { src, srcSet, width, height, ... }
```

If the owner later moves to a CMS and stops running the script, swap that helper's body to
emit Cloudflare Image Transformation URLs (`/cdn-cgi/image/width=…,format=auto/…`). **One
file changes.** That is the seam.

### 6.4 Image policy

- **Ladder:** 480 / 768 / 1024 / 1440 / 1920 px. Portraits 320 / 480 / 768.
- **Formats:** AVIF → WebP → JPEG, via `<picture>`.
- **Quality — deliberately high.** This is a film-production portfolio; posters are the
  product. AVIF q≈62, WebP q≈82, JPEG q≈85, chroma subsampling **off** for posters.
  Expected ~120–260 KB at 1440 px. **Do not tune these down for a Lighthouse point.**
- **Loading:** `loading="lazy"` + `decoding="async"` everywhere below the fold;
  `fetchpriority="high"` and no lazy on the LCP image only.
- Every `<img>` always carries `width`/`height` (from the manifest) and real `alt` text.
  Decorative images get `alt=""` deliberately, not by omission.

### 6.5 Video policy

Four distinct roles, four different answers:

**1. Full project films (20) — stay on YouTube.**
Business reasons outweigh technical ones: the channel is a distribution asset, YouTube
gives adaptive streaming, captions and analytics free, and the owners already publish
there as part of their workflow. Change only *how* they are embedded:
**façade** — poster + play button; the `youtube-nocookie.com` iframe mounts on click.
Saves ~600 KB and 2 requests per page, and removes a pre-consent third-party contact.

**2. Silent hover-preview loops → R2.**
Re-encode the existing `.mov` clips to **MP4 (H.264, yuv420p, faststart)** + **WebM (VP9)**,
720p, no audio track, ~300–800 KB each (from 10–12 MB). `<video muted loop playsinline
preload="none" poster>`; the source is attached only on hover/focus intent, and only where
`(hover: hover)` and reduced-motion is not requested.

**3. Hero / brand video → R2.**
Renditions at 1920 / 1280 / 720, MP4 + WebM, plus a real poster frame — so the hero is
never the black box it is today (§9.11). `preload="metadata"`, rendered **once**, not three
times (§9.10). Under reduced-motion, the poster is shown and the video never loads.

**4. Footer video → removed by default.**
Today `helder_museu.mov` is 12.33 MB of QuickTime autoplaying on all 34 pages. **Default:
the footer uses the poster still.** If the owner wants motion there, it becomes a ≤300 KB
optimised loop, mounted by `IntersectionObserver` when the footer is actually reached, and
never under reduced-motion or `navigator.connection.saveData`. `OWNER` decision, still
recommended.

All source `.mov` files are archived in R2 under `archive/` so nothing is lost.

### 6.7 Revision 2 — media sourcing after the `Smash/` inventory

`docs/Smash/` (20 files, 469 MB) was inventoried — full detail in
`SMASH_MEDIA_INVENTORY.md`. It **changes the sourcing assumption**:

- **17 of 20 files are 1280×720** at 640–2 325 kbps — YouTube-grade web exports, not masters.
- **Only 3 are 1920×1080** with master-like bitrates (`Prato 2 v1.mov`, `Prato sobremesa v1.mov` at ~18 Mbps with PCM audio; `film in 1 v2.mp4` at 14 Mbps).
- **10 of the 20 published projects have no local file at all** — including all five weddings.
- Two WordPress "orphans" are now identified: `vcompress_210.mov` = `NVF Showreel.mp4` (both 189 s), `videoplayback.mp4` = `We are NVF.mp4` (both 20 s).
- **Six unpublished pieces plus a newer 2026 showreel** exist that the website does not show.

**Consequences:**

1. **`Smash/` is not the default transcode source.** Per project, choose the best available and record it in `sourceOfTruth` (§4.2b).
2. **720p files may be used for silent hover loops only** — never for a cinematic hero or fullscreen block. A 1 Mbps 720p file cannot carry a 1440 px hero.
3. **A master-media request goes to the owner immediately** (`SMASH_MEDIA_INVENTORY.md` §6, items M1–M9). Sourcing masters is likely the longest lead time in the project, so it starts now, not at Phase 3.
4. Until masters arrive, cinematic heroes fall back to **`heroStill` + the YouTube façade** — a defined, good-looking state, not a placeholder.

### 6.8 Revision 2 — video roles, updated

The four roles in §6.5 stand, with one addition:

**5. Cinematic hero / fullscreen block video (new).** Per-project, optional, from a master.
R2, three renditions (2560 / 1920 / 1280 wide), MP4 (H.264 High) + WebM (VP9/AV1),
`faststart`, **audio stripped for ambient loops**; audio retained only where a visible
unmute control exists (the `promenade.pt` pattern — muted autoplay, explicit opt-in, never
the reverse). Always paired with `heroStill`. Never loaded under reduced-motion or
`saveData`.

**Budget:** ≤ 2.5 MB for the initial hero range request on desktop, ≤ 1.2 MB on mobile,
enforced in Phase 10 verification.

### 6.6 Why not Cloudflare Stream (v1)

Stream is the right tool for long-form, adaptive, possibly-private video. Here:

- the long-form catalogue is on YouTube and should stay (§6.5);
- what remains is silent 4–6 second loops and one 16-second brand clip, where HLS/DASH and
  a player runtime cost more than they return;
- Stream bills per minute stored and per minute delivered — poor value for decorative loops
  that R2 serves as a single cached byte range.

**Revisit Stream when** the owner wants to leave YouTube, host client-private deliveries,
publish long films directly, or needs signed/expiring video URLs. The `videoProps()` helper
is the seam, exactly as `imageProps()` is for images.

### 6.9 Phase 12 — what was actually built, and where it departs from §6.2–§6.4

The pipeline exists. Operating manual: `docs/MEDIA_PIPELINE.md`. Four decisions above were
changed by contact with the material, and the changes are here rather than edited into the
original so the reasoning stays visible.

**1. Object keys are `{key}/{width}.{hash}.{ext}`, not `{key}-{w}.{hash}.{ext}`.**
The manifest key became the DIRECTORY and the rendition the leaf, so every derivative of an
asset sits together and `projects/{slug}/` lists a project's whole footprint. `video/` and
a separate originals-vs-derivatives split are gone: a clip lives under the thing it belongs
to, and originals are not in the delivery bucket at all (point 4).

**2. There are no unhashed objects, so there is no `max-age=86400` tier.** §6.2 kept a
short cache for "originals, replaceable in place". Nothing replaceable is delivered any
more — every object in `nvf-media` is content-addressed and `immutable` for a year. A
purge is now structurally impossible to need rather than merely unlikely.

**3. JPEG is not built, and WebM is built only for hero-class clips.** JPEG would serve
only browsers that also lack WebP, and there are none in the support target — three formats
to reach nobody. WebM is ~20% smaller than the H.264 beside it, which is worth paying for
on a clip that autoplays before the reader has asked for anything, and not worth doubling
storage for on a hover preview that is fetched on intent. Measured, not assumed.

**4. Two buckets, and the source archive is in neither of the site's paths.**
`nvf-media` is delivery. `nvf-source-archive` is private, holds `source-archive/` and
`Smash/` under `archive/`, is never given a public URL and is never read by the site —
because putting a byte-faithful WordPress copy into the delivery namespace would publish
the originals of every film on it.

**Also:** `sharp` was never introduced. The encoder is ffmpeg, which the project already
depended on for frame extraction and clip trimming, and which does WebP, AVIF, H.264 and
VP9 in one tool. `PUBLIC_MEDIA_BASE_URL` unset now means "serve the local mirror" rather
than "use the production host", so a checkout with no configuration builds a site that
works offline instead of one that links to a hostname nobody has created.

---

## 7. Forms

**Status: the contact endpoint is BUILT (Phase 13). The newsletter endpoint is not, and
will not be until D18 is answered.**

`src/pages/api/contact.ts` is the only route on this site with `prerender = false` — every
other page is a file, this one is a Worker. Astro 7 has no `hybrid` mode; `output: 'static'`
plus a per-route opt-out replaces it.

| | Contact — BUILT | Newsletter — NOT BUILT |
|---|---|---|
| Route | `POST /api/contact/` | `POST /api/newsletter/` |
| Fields | `nome`, `email` (req), `telefone`, `mensagem`, `consentimento`, `empresa` (honeypot), `locale` | `email` (req), consent |
| Success | 303 → `/obrigado/` · `/en/thank-you/` | inline confirmation |
| Delivery | provider seam, D17 open | subscriber API, D18 open |

The route carries a trailing slash because `trailingSlash: 'always'` applies to endpoints
whose route has no file extension. Posting to `/api/contact` still works — it 308s, which
preserves the method and the body — but the form is pointed at the real URL.

### 7.1 The checks, in the order they run

Each one is cheaper than the next and refuses before the next has to allocate.

| # | Check | Refusal |
|---|---|---|
| 1 | method — only POST | `405` with `Allow` |
| 2 | **origin** — `Sec-Fetch-Site: same-origin`, or an `Origin` matching the request's own origin or `SITE_URL`. A missing `Origin` on a POST is not a browser. | `202 rejected` |
| 3 | size — `Content-Length` (a claim) first, then the body's real byte length against 16 KB | `413 too-long` |
| 4 | shape — normalise, then validate with zod v4 via `astro/zod` | `422` / `400` |
| 5 | **honeypot** — read FIRST, so a bot cannot map the field rules by filling the trap | `202 rejected` |
| 6 | **Turnstile** — verified with Cloudflare, server-side, every time, failing closed | `400` / `403` |
| 7 | delivery — the provider seam | `503` / `502` |

Every outcome is a CODE from a closed set (`src/config/forms.ts`). The wire carries the
code; the page says it in the reader's own language from a table the server serialised into
the document. The endpoint never composes a sentence and never knows about language.

**Two answer shapes, one code path.** Our own script sends `x-nvf-form: fetch` and gets
JSON. A browser that simply submitted the form gets a `303` — to the thank-you page when
accepted, back to the form with `?erro=<code>#contactar` when not. The outcome is computed
once, so the two cannot disagree. The 303 also means back and reload do not re-submit.

**`/obrigado/` is the answer to a POST, not a link.** Nothing in either contact document
links to it, and `npm run validate:routes` fails the build if anything ever does. There is
no optimistic redirect anywhere in the client script.

### 7.2 Spam and abuse — what was built, and what was dropped

1. **Cloudflare Turnstile** — free, no ad-tech profiling, no cookies in managed mode,
   Cloudflare is the processor. Materially better GDPR posture than reCAPTCHA v3, which
   today loads on *every* page including pages with no form. Verified server-side with
   `siteverify`; a network error, a timeout or a malformed answer is a FAILURE, never a
   pass. **Only the token, the secret and the connecting IP are sent — nothing the reader
   typed ever reaches Cloudflare's verification endpoint.**
2. **Honeypot** — the live form's own hidden field, kept. A filled trap is REFUSED rather
   than silently discarded: an over-eager password manager can reach an off-screen field,
   and telling that person their message was delivered when it was not is worse than
   refusing them.
3. ~~**Timing check** — reject submissions faster than ~2 s.~~ **DROPPED.** It needs a
   fresh per-render timestamp, and both contact pages are prerendered and cached, so the
   timestamp would have to be written by JavaScript — which is exactly the client Turnstile
   already covers. It would have added a mechanism and no protection.
4. **Rate limiting at the Cloudflare edge on `/api/*`** — still the plan, and still a WAF
   rule set in the dashboard at deployment. **No KV and no D1 were added**: a counter store
   is infrastructure this project would then own, back up and reason about, and Turnstile
   plus the honeypot plus server-side validation is the control that actually stops the
   traffic.

**Progressive enhancement — the claim is amended, not quietly dropped.** Both forms are
real `<form method="post">` and still post without JavaScript. **A submission without
JavaScript will be refused**, because Turnstile cannot issue a token without it. That is a
real cost of choosing a challenge at all, and the form says so up front in a `<noscript>`
line rather than letting someone write a message and discover it on submit.

### 7.3 Delivery — the seam, and why it is empty

**DECISION D17 IS OPEN**, and D2 has not settled which of three addresses reaches the
company. So `src/lib/forms/delivery.ts` contains no address and the endpoint has no default
one to fall back to. What exists is the boundary: one `Provider` interface, four adapters,
one resolver that picks between them from configuration.

| Adapter | What it needs | Behaviour |
|---|---|---|
| `unconfigured` | nothing | refuses with `503 not-configured`. Never pretends. |
| `dev-sink` | `astro dev` only | logs `accepted, NOT DELIVERED` with field LENGTHS and no contents |
| `resend` | account · verified domain · `RESEND_API_KEY` · recipient · sender | one HTTPS POST |
| `brevo` | the same three, EU-hosted | one HTTPS POST |

Answering D17 is setting two or three environment variables. No component, no route and no
validator changes. Adding a fifth adapter is one object and one line.

**The simplest reliable option was evaluated and deferred.** Cloudflare's own **Email
Routing `send_email` binding** needs no third party, no account and no API key — it is the
least infrastructure of anything available. It requires the zone to be ON Cloudflare with
Email Routing enabled and the recipient verified there, which is **decision D20** and a
later phase. When DNS moves, it is a ~40-line adapter and a `send_email` entry in
`wrangler.jsonc`. Until then, Resend (works today) or Brevo (EU-hosted, which suits a
Portuguese data controller) are the two that can be turned on now. **MailChannels' free
Workers tier no longer exists**, so doing nothing is not an option that delivers.

**Newsletter destination is UNKNOWN** (audit §11) — the current form posts to
`admin-ajax.php` and where subscribers end up was not discoverable. `/servicos/` therefore
ends with an invitation rather than a dead form (decision A41), and no endpoint has been
written. When D18 is answered it follows the same shape as the contact one.

### 7.4 Privacy and data minimisation

The Worker holds a submission for the duration of one request and then does not. **No
database, in v1 or now.** No submission is stored anywhere. **No adapter logs message
content in any mode**, including the local development sink, which prints field lengths and
nothing else — a terminal is a log, and the privacy rule has no local exemption. The
connecting IP goes to Cloudflare for challenge scoring and nowhere else.

Secrets are read at REQUEST time from the Worker's environment through
`import { env } from 'cloudflare:workers'`. **`Astro.locals.runtime.env` no longer exists** —
@astrojs/cloudflare 14 removed it and throws on access. `import.meta.env` is never used for
a secret, because Vite inlines it at build time.

### 7.5 Testing

`npm run test:forms` drives the live endpoint over HTTP against `npm run dev` and needs no
account and no production secret: unset, the dev server verifies against Cloudflare's own
always-passes test secret and delivers to the sink.

Three branches cannot coexist on one server — a captcha that always passes cannot be seen
to fail, and a server that delivers cannot be seen to be unconfigured. So the runner probes
the server, asserts the branch that server can produce, and prints the one-line `.dev.vars`
change that reaches the others. All three were run and all three pass.

---

## 8. Analytics & consent

Today GA4 (`GT-NF7D37J8`), Google Ads (`AW-17960555673`) and reCAPTCHA all load before any
consent, with no banner — for a Portuguese company under GDPR/ePrivacy and the Lei
n.º 41/2004 transposition.

**Architecture:**

1. **Baseline: Cloudflare Web Analytics.** Cookieless, no cross-site identifiers, no
   personal data retained. This is the default and needs no consent banner.
2. **A consent layer exists from day one**, defaulting to *nothing non-essential loads*.
   Nothing is wired into it unless the owner opts in.
3. **If GA4 and Google Ads conversion tracking are retained** — and the live Ads tag
   suggests active paid campaigns, i.e. a real business dependency — then a **consent
   banner becomes mandatory**, with Google Consent Mode v2 defaults set to `denied` and
   tags firing only after explicit opt-in. `OWNER` decision D8/D19.
4. **Third-party contact is removed by default anyway:** the YouTube façade means no
   YouTube request until the visitor presses play; Turnstile replaces reCAPTCHA; fonts are
   self-hosted, so Google Fonts disappears entirely.

**Not done here:** writing or amending the privacy policy. The processors change
(reCAPTCHA → Turnstile, plus whichever email/newsletter provider is chosen), so the policy
**will** need owner/legal review. That is flagged, not drafted.

### 8.1 Phase 14 — what was actually built

**Cloudflare Web Analytics, and nothing else.** GA4 and Google Ads are *not* carried over,
so point 3 above is now a decision the owners would have to REVERSE rather than one this
build is waiting on. Point 2 — the consent layer — was **not built, and that is the
finding**: with nothing non-essential loading, a consent layer would be a mechanism with
nothing to gate. It becomes a real requirement the moment D19/D8 goes the other way.

*One declaration.* `src/config/analytics.ts` holds the token, the gate, the two external
origins and the SPA decision; `src/components/site/Analytics.astro` places one `<script>`
and nothing else. No component and no runtime module may name the beacon.

*The gate.* `PUBLIC_ANALYTICS_TOKEN` unset means **no script is emitted at all** — not a
disabled one, not an empty tag. Configured is still not enough: `import.meta.env.PROD`
must also hold, so `astro dev` and `npm run test:forms` measure nothing.
`PUBLIC_ANALYTICS_IN_DEV=true` is the deliberate opt-in for verifying locally. The token
is validated for shape at build time, because it is interpolated into an HTML attribute
and a value carrying a quote would be markup injection rather than a broken beacon.

*No consent UI is required for it, and none was added.* Measured in a real browser after a
full visit: **0 cookies, 0 `localStorage` keys, 0 IndexedDB databases** attributable to
analytics. The only client-side state on the site remains our own `nvf-seen`
(`sessionStorage`, the motion loader). Nothing is stored on the reader's device, so the
rule a banner exists to satisfy is not engaged. **The remaining question is legal, not
technical, and it is recorded rather than answered** — see §8.3.

*What the beacon sends*, captured verbatim from its own request: `startTime`,
`pageloadId`, `n`, `eventType`, `nt`, `location`, `referrer`, `versions`, `bi`, `ntapi`,
`siteToken`, `st`. Two URLs and timings. It cannot see a form value, because the contact
form is `method="post"` and no field has ever been in a URL — `validate:analytics` asserts
that on every build.

*Cost.* One `defer`, `renderBlockingStatus: non-blocking` script — **10 125 bytes gzipped**
over the wire, once per visit, plus **227 bytes** of markup per page. Blocking JS is
unchanged. The service worker never touches it: `sw.js` returns early on any cross-origin
request, so the beacon is never cached and the site is unaffected when it fails.

### 8.2 The SPA setting — measured, and it is a choice between two wrong numbers

Every page after the first is a ClientRouter navigation, so `spa: true` looks like the
setting this site wants. Counting the beacon's own reports in a browser says otherwise.

**One ClientRouter navigation makes three `history` calls**, and beacon.min.js `2026.9.1`
reports each as a fresh page load with its own `pageloadId`:

| call | URL argument | reported as |
|---|---|---|
| `replaceState` | `undefined` — Astro stashing scroll offsets | a page load of the page being LEFT |
| `replaceState` | `undefined` — again, after the swap | a page load of the page being LEFT |
| `pushState` | `/portfolio/` — the actual navigation | a page load of the page arrived at |

`/` to `/portfolio/` produced **three** reports, two of them for `/`. A same-URL `replace`
is not a navigation, but the Navigation API announces it (`nt: "routing-apis"`) and the
beacon counts it.

So `spa: true` inflates every page roughly threefold, and `spa: false` counts only real
document loads and leaves client-side navigation invisible. **`ANALYTICS_SPA = false`
ships**, because under-counting is a limitation that can be stated and over-counting is a
number that looks like data and is not. Verified after the change: **1 report on the
initial document, 0 on each of home to portfolio, portfolio to project, back, forward and
PT/EN.**

There is no third option. The beacon exposes no "report a page view" API, and
**re-inserting its script does nothing** — it finds `window.__cfBeacon` already set and
returns (measured). The only remaining trick would be for our own code to wrap
`sendBeacon` and `XMLHttpRequest` and drop the duplicates, which puts a first-party
interceptor in front of every request the site makes, the contact form's included. Not
worth owning. Flipping the constant is one line, and `validate:analytics` fails the build
if the built tag and the declaration ever disagree.

**`data-astro-transition-persist="cf-beacon"` is on the tag** so Astro's head swap leaves
the live script element alone instead of tearing it down and appending a fresh one on
every navigation. That is not a double count — a re-executed beacon bails — but it is a
script element, a cache hit and a parse per navigation bought for nothing.

### 8.3 The privacy policy now over-declares — OWNER/LEGAL REVIEW

The published policy is binding text and was **not** amended (CLAUDE.md §2). It declares
cookies this site does not set:

- `_ga`, `_gid`, `_gat` (Google Analytics), `1P_JAR`, `CONSENT`, `NID` (Google)
- `cookie_notice_accepted` (digiUP), `PHPSESSID`, `AWSALBCORS` (Smartsupp), `__cfduid`
- and the sentence naming *Cookies técnicos, Cookies de personalização e Cookies de análise*

**The rebuilt site sets none of them, and no cookie at all.** The mismatch is in the safe
direction — the policy claims more collection than happens — but it is still a statement
about processing that no longer matches reality, and correcting it is the owners' and
their counsel's call rather than ours. Recorded in `docs/BLOCKED_TODOS.md`. The same
review has to cover reCAPTCHA to Turnstile and whichever email provider answers D17.

---

## 9. Security & headers

Set at the Worker: `Content-Security-Policy` (none today), `X-Frame-Options`/
`frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS.
CSP is achievable strictly because there is no third-party script soup left — the only
external frame origin is `youtube-nocookie.com`, mounted on demand.

**Phase 14 — the exact origins analytics will need, recorded and not yet enforced.** No
header is set today; a permissive CSP written early is worse than none, because it looks
like protection. When one is written, analytics costs exactly two entries:

```
script-src   https://static.cloudflareinsights.com
connect-src  https://cloudflareinsights.com
```

The `connect-src` value is for the **manual embed**, which posts to
`cloudflareinsights.com/cdn-cgi/rum`. A site proxied through Cloudflare with automatic
injection reports to a same-origin `/cdn-cgi/rum` instead and needs `'self'` — which one
applies is not decidable until the site is actually deployed (D20), so both are written
down and neither is assumed. Both strings live in `src/config/analytics.ts`; a CSP typed
from memory is a CSP that blocks the thing it was written for.

---

## 10. Internationalisation — **PT + EN both required** (Revision 2)

English is no longer optional. Portuguese remains the **source** language; nothing is
translated until the owners review translations.

### 10.1 Routing

```js
i18n: { defaultLocale: 'pt', locales: ['pt', 'en'], routing: { prefixDefaultLocale: false } }
```

| Locale | Pattern | Examples |
|---|---|---|
| `pt` (default, unprefixed) | `/…` | `/` · `/sobre/` · `/portfolio/epitafio/` |
| `en` | `/en/…` | `/en/` · `/en/about/` · `/en/portfolio/epitafio/` |

Two rules that matter:

1. **Project slugs are identical in both locales.** `/portfolio/epitafio/` and `/en/portfolio/epitafio/`. Slugs are proper nouns and stable identifiers; translating them would double the URL surface and fragment link equity for no benefit.
2. **Page slugs are localised**, because they are ordinary words and carry SEO weight: `/sobre/` ↔ `/en/about/`, `/servicos/` ↔ `/en/services/`, `/contactos/` ↔ `/en/contact/`. The mapping lives in one file, so a route never has to be reasoned about twice.

The existing `/en/homepage-english/` stub 301s to `/en/`.

### 10.2 Content schema implications

```ts
locale:        z.enum(['pt','en']).default('pt'),
translationOf: z.string().optional(),   // slug of the PT source entry
```

- **PT is canonical.** An EN entry declares which PT entry it translates.
- **Fallback is explicit, never silent.** A missing EN field falls back to PT and is *marked* in the build report, so gaps are visible rather than invisible.
- **Media, dates, categories and credits are shared** — only text fields are per-locale. A poster is never translated, so it is never duplicated.
- Category and collection names are localised objects: `{ pt: "Ficção", en: "Fiction" }`. **Not filled in yet.**

### 10.3 Language switch

A real control in the header **and** in the mobile menu — fixing audit §9.2, where the
switcher is invisible below 768 px. It links to the **current page's** equivalent, not to
the homepage; where no translation exists it links to that locale's home and says so.
Keyboard and touch operable — never `:hover`-only, which is the current bug.

### 10.4 SEO across locales

- Self-referencing `canonical` per locale.
- **Reciprocal `hreflang`** on every page — `pt-PT`, `en`, plus `x-default` → the PT page.
- One sitemap containing both locales with `xhtml:link` alternates.
- `<html lang>` correct per locale; `og:locale` + `og:locale:alternate`.
- **Metadata is localised, not machine-translated** — titles, descriptions and alt text are authored per locale (§11.4) and owner-reviewed.

### 10.5 Rollout — **DONE, Phase 11 (2026-09-03)**

The switcher renders **only when the target locale actually has content**, so EN can be
merged page-by-page without ever exposing an empty page — the exact failure the current
site has. PT ships complete; EN follows on owner-approved translations.

**English is enabled.** The guarantee above did not weaken, it moved: it used to mean "no
English at all" and now means "no English route without authored English content",
enforced per page by `PAGE_LOCALES` in `src/i18n/routes.ts` — one declaration that the
built routes, the hreflang set, the sitemap, the language switch and the footer all read.

The two legal documents are the one place it says no. They are Portuguese only, they emit
no alternates, and the switch and the footer say so rather than linking to a route that
was never built. Full record: [`SEO_I18N_ROLLOUT.md`](SEO_I18N_ROLLOUT.md) §3.

---

## 11. URL compatibility & SEO migration

### 11.1 Preserved exactly (28 routes, byte-for-byte, trailing slash included)

`/` · `/sobre/` · `/portfolio/` · `/servicos/` · `/contactos/` · `/obrigado/` ·
`/termos-e-condicoes/` · `/politica-de-privacidade/` ·
`/portfolio/{20 slugs}/` (all 20, unchanged, including the awkward ones —
`nvf-vs-antiqvvm`, `nvf-vs-filmin-details`, `ana-e-filipe-metro`) ·
`/categoria-portfolio/{ficcao,moda-identidade,visual-storytelling,corporativo,casamentos}/`

Slugs are **not** "tidied up". They are indexed and linked; renaming them trades real SEO
equity for cosmetics.

### 11.2 Redirects (301 unless noted)

| From | To | Why |
|---|---|---|
| `/blog` | `/portfolio/` | Repairs the 404 linked from all 20 project pages (§9.6) |
| `/en/`, `/en/homepage-english/` | `/` | The English page is empty; do not ship a dead route |
| any path without trailing slash | same path with `/` | Matches WordPress today |
| `/sitemap_index.xml`, `/page-sitemap.xml`, `/portfolio-sitemap.xml`, `/wp-sitemap.xml` | `/sitemap-index.xml` | Keeps Search Console and existing crawlers working |
| `/wp-content/uploads/{path}` | the mapped R2 URL | **Preserves inbound hotlinks and cached `og:image` references.** The mapping is derivable from `docs/content/media_inventory.json` (77 known URLs). Unmapped paths → 410 |
| `/wp-json/*`, `/wp-admin/*`, `/wp-includes/*`, `/xmlrpc.php`, `/feed/`, `/comments/feed/` | 410 Gone | Honest signal; these will never return |

### 11.5 Phase 11 — what the SEO pass actually changed

Everything in §11.3 is done. Three changes touched published metadata and are **owner
proposals, not applied decisions** — the homepage `<title>`, `noindex` on `/obrigado/`,
and real meta descriptions replacing the Yoast `[…]` excerpts. Each description is a
SELECTION of whole published sentences, checked against the archive word for word, so no
copy was written to produce one. Diffs: [`SEO_I18N_ROLLOUT.md`](SEO_I18N_ROLLOUT.md) §5.

`/blog → /portfolio/` finally ships. `routes.json` has held that redirect since Phase 0.5
and nothing emitted it; `public/_redirects` is generated from the route map now
(`npm run redirects:build`). The `/wp-content/uploads/*` map and the 410 patterns are
deliberately still not emitted — the first needs R2, the second needs a Worker.

### 11.4 Revision 2 — the content rule, as amended by the owners

The preservation rule is **relaxed in a specific, bounded way**. It is not repealed.

**Still absolute:**
- The existing website text is preserved as **source material** and archived verbatim (`docs/content/`, §18).
- **No facts may be invented.** Ever. Unknown stays `UNKNOWN`.
- Nothing is rewritten *now*. Copy ships as published until a change is reviewed and approved.

**Now permitted — later, as explicit reviewed proposals:**
page titles · meta descriptions · H1/H2 structure · service copy · project copy ·
internal linking · structured data · image alt text · portfolio metadata · English translations.

**How it works in practice:**
1. Every proposal is a **diff against the archived original**, presented for owner approval. Never applied silently.
2. The archived verbatim source is **never edited** — it is the baseline the diff is measured against.
3. **Voice constraint:** copy must read as a premium creative film brand. **No keyword stuffing, no corporate filler, no SEO boilerplate.** A page that reads worse but ranks better is rejected.
4. The Humanizer skill applies only to genuinely **new** copy we author — never to migrated text (CLAUDE.md §3).
5. Structural fixes that change **no words** (adding the missing `<h1>`, correcting the stray `<h3>` on `/portfolio/`) are not copy changes and need no approval.

Scheduled as **Phase 8b**, after the design is settled and before launch.

### 11.3 SEO preservation checklist

1. Identical URLs and trailing-slash behaviour.
2. Self-referencing `canonical` on **every** page — fixes the 5 category archives that have none.
3. Title pattern kept verbatim: `{Page} - We are NVF - Produtora Audiovisual`.
4. Metadata parity **plus** the gaps closed: `og:image` on `/` and `/portfolio/`;
   `og:description` on all 20 project pages; `hreflang` handled by the locale list.
5. JSON-LD: `Organization`, `WebSite`, `BreadcrumbList`, and **`VideoObject` per project**
   (new — 20 films currently have no video structured data).
6. One sitemap, including the category archives (in neither sitemap today).
7. `robots.txt` stays permissive.
8. **Crawl diff before cutover:** crawl the live site, crawl the staging build, diff URLs,
   titles, descriptions, canonicals and headings. Cutover only on a clean diff.
9. Post-cutover: resubmit the sitemap, watch Search Console coverage and Core Web Vitals
   for 30 days.

---

## 12. Repository, environments, secrets

```
next_vision/
├── .github/workflows/ci.yml         build + typecheck + link/route parity check
├── .claude/settings.json
├── CLAUDE.md
├── README.md                        setup + the owner's day-to-day commands
├── docs/
│   ├── PROJECT_CONTEXT.md
│   ├── WEBSITE_AUDIT.md
│   ├── ARCHITECTURE.md              this file
│   ├── IMPLEMENTATION_PLAN.md
│   ├── CONTENT_GUIDE.md             owner-facing (Phase 8)
│   └── content/                     read-only audit extracts
├── source-assets/
│   └── fonts/                       owner-supplied TTF originals (not shipped)
├── scripts/
│   ├── media-sync.mjs               derivatives → R2 → manifest
│   ├── fonts-build.mjs              TTF → subset WOFF2
│   ├── video-encode.mjs             .mov → MP4 + WebM + poster
│   └── verify-routes.mjs            route parity vs the audit
├── src/
│   ├── assets/                      fonts (woff2), logo.svg — build-time only
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   │   ├── api/                     contact.ts (prerender = false) — BUILT
│   │   ├── portfolio/[slug].astro
│   │   └── categoria-portfolio/[slug].astro
│   ├── content/                     collections (MDX / YAML / MD)
│   ├── content.config.ts            Zod schemas
│   ├── config/                      site.ts, media.ts, seo.ts
│   ├── i18n/                        pt.ts
│   ├── lib/                         imageProps, videoProps, formatDate, …
│   └── styles/                      tokens.css, global.css
├── public/                          robots.txt, favicons
├── astro.config.mjs
├── wrangler.jsonc                   no secrets, no account id
├── .env.example
└── .gitignore
```

**Branching — trunk-based.** `main` is production and auto-deploys. Short-lived
`feat/…` / `fix/…` branches, PR with a Cloudflare preview URL, squash-merge, Conventional
Commits, linear history. No long-lived `develop`: with one or two contributors it only adds
merge overhead.

**Environments:** local `npm run dev` · PR preview (per-branch Cloudflare URL) · production
on `main`.

**Secrets — nothing sensitive in git.**

| Secret | Where |
|---|---|
| R2 access key / secret | Local `.env` only (used by `media-sync`), and GitHub Actions secrets if it ever runs in CI |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | GitHub Actions secrets — deliberately **not** in `wrangler.jsonc` |
| `TURNSTILE_SECRET_KEY` | Worker secret (`wrangler secret put`). **Required** — unset, the contact endpoint refuses every submission with 503 |
| `RESEND_API_KEY` / `BREVO_API_KEY` | Worker secret. One of them, per decision D17 |
| `CONTACT_RECIPIENT`, `CONTACT_SENDER`, `CONTACT_PROVIDER` | Not secret, but **not in git** while D17/D2 are open — a recipient in version control is a recipient nobody reviewed |
| `PUBLIC_TURNSTILE_SITE_KEY`, `PUBLIC_MEDIA_BASE_URL` | Non-secret, **build-time**. Vite inlines them into the HTML |
| Local overrides for any of the above | `.dev.vars` — wrangler's own format, gitignored, never `.env.example` |

`.env` is already gitignored; `.env.example` is committed and documents every variable.

### 12.1 Step 12 — what was actually deployed (2026-09-04)

The plan above described environments that did not exist. One of them does now.

**One Worker, `next-vision-films`, on the company account `c87adf05…8e39`, serving from
Workers Static Assets at `https://next-vision-films.next-vision-films.workers.dev`.** No
custom domain, no DNS record, no zone change, no Pages project and no deprecated Workers
Sites. 718 static files and a 622 KiB Worker script with a 31 ms startup; the only binding
is `env.ASSETS`.

**It needed no secret.** That is the part worth recording: every unset variable in the
table above already had a defined, safe meaning, so the deployment required no owner input
at all. The full matrix — required, optional, deferred — is `docs/STAGING_DEPLOY.md` §3.

Three configuration facts changed or were confirmed by doing it rather than by reading:

- **`compatibility_date` is 2026-08-31, not 2026-09-01.** It is pinned to the workerd
  wrangler bundles (1.20260831.1), because a date ahead of the local runtime makes
  `wrangler dev` and `npm run preview:cloudflare` run different semantics from the
  deployed Worker.
- **`_redirects` rejects a trailing comment on a rule line**, server-side, at deploy time
  — and miniflare's parser accepts the same file, so no local surface catches it. §11.2's
  generated file carried one since Phase 11 and had never been deployed.
- **`session: false` and `imageService: 'compile'` do what §3 claimed**: the generated
  `dist/server/wrangler.json` has empty `kv_namespaces`, empty `r2_buckets` and no Images
  binding. The private `nvf-source-archive` is not bound, not referenced and not exposed.

The branching and CI described above are still unbuilt: there is no GitHub remote, and
`npm run deploy` is run by a person from a checkout. `npm run deploy` is
`npm run verify && wrangler deploy`, so the eleven validators gate the edge.

---

## 13. Owner maintainability — the workflows that must stay simple

| Task | Steps |
|---|---|
| **Add a portfolio project** | 1. Drop `poster.jpg` (+ optional `preview.mov`) into `media-staging/projects/{slug}/`. 2. `npm run media:sync`. 3. Create `src/content/projects/{slug}.mdx` — copy an existing file, change ~6 fields. 4. Commit. Deploy is automatic. **The build fails loudly if a field is missing or the category is misspelled.** |
| **Replace a project image** | Overwrite the file in staging, `npm run media:sync`, commit. New content hash → new URL → no cache purge needed. **No code change.** |
| **Upload a new video** | Drop the source in staging, `npm run media:sync` (transcodes MP4 + WebM + poster), commit. |
| **Change a service** | Edit one file in `src/content/services/`. |
| **Change navigation** | Edit `src/content/settings/navigation.yml`. |
| **Change contact details / socials** | Edit `src/content/settings/site.yml` — one place, used by header, footer, contact page and structured data. |
| **Change a colour, size or spacing step** | Edit `src/styles/tokens.css`. |
| **Add a CMS later** | Point a git-backed CMS at `src/content/`. **Zero code change** (§4.4). |

`README.md` and `docs/CONTENT_GUIDE.md` document these for a non-developer.

---

## 14. Decisions that remain with the owner

Architecture is complete without these; **content and go-live are not.**

| # | Decision | Blocks |
|---|---|---|
| D2 | Canonical contact email — `nextvisionfilmsagency@gmail.com` (displayed) or `hello@nextvisionfilms.com` (linked)? | Contact page, structured data, form recipient |
| D3 | Corrected portfolio category descriptions (four appear shifted) | `/portfolio/` copy |
| D4 | Privacy-policy anchors currently point to digiup.me — repoint to NVF's own page? | Legal page |
| D5 | Confirm `Ver Tudo` → `/portfolio/` | Redirect (assumed, low risk) |
| D6 | `dont-let-it-fool-you` vs `ana-e-filipe-metro` — duplicate entry, or a missing video? | One project page |
| D7 | Supply the 10 missing preview clips, or ship stills for those projects? | Media scope. **Not blocking** — stills are a defined state |
| D8/D19 | Keep GA4 + Google Ads (→ consent banner required), or move to cookieless analytics only? | **Phase 14 shipped cookieless-only, with no banner** (§8.1). Now a decision to REVERSE rather than one to make; reversing it makes a consent banner mandatory |
| D9 | Make the contact consent checkbox required? **Recommended: yes** | Form validation. **STILL OPEN.** The published form does not require it and neither does ours; `CONSENT_REQUIRED` in `src/config/forms.ts` is the one switch that changes it, for the markup and the server at once, and `validate:routes` fails the build if the markup drifts from the decision |
| D12 | Orphan media (`vcompress_210.mov` 46 MB, `videoplayback.mp4`) — migrate or discard? | R2 scope |
| D17 | Transactional email provider (Resend / Brevo / other) **and who receives submissions** | Contact form **delivery only** — the endpoint, validation, Turnstile and the seam are built (§7.3). Unanswered, submissions are refused with 503 and never reported as sent |
| D18 | Newsletter destination — currently UNKNOWN | Newsletter form |
| D20 | DNS migration: nameservers are `ns1/ns2.digiupcloud.pt`, managed by digiUP | Cutover |
| — | Footer video: keep as an optimised lazy loop, or use the still? **Recommended: still** | Footer |
| — | R2 media hostname (e.g. `media.nextvisionfilms.com`) | R2 setup |
| — | D1 English: confirm PT-only for v1 | i18n scope |

Content rule reminder: D3, D4, D6 and D10 are **copy** questions. Nothing will be invented
or rewritten; the owner supplies replacements or the current wording ships unchanged.
(As amended in §11.4, reviewed copy *proposals* are now permitted later — never silent edits.)

### 14.1 Added by Revision 2 — blocks the first design concept

| # | Decision | Blocks |
|---|---|---|
| **R1** | **Ground: dark or cream?** The single largest fork; everything follows it | Review A |
| **R2** | **Visual direction** — Projection / Contact Sheet / Slate / hybrid (`DESIGN_REFERENCES.md` §8) | Review A |
| **R3** | **Typography** — keep Barlow / Barlow Condensed / Space Mono, or is Tatiana changing it? | Review A, font build |
| **R4** | **When does Tatiana join, and what does she own?** | Review sequencing |
| **R5** | **Portfolio taxonomy** — Proposal A (by form) or B (by intent), or the owners' own (§4.5a) | Content model, routes |
| ~~**R6**~~ | ~~**Vector logo** — is a clean SVG available?~~ **CLEARED, Phase 15.** One always existed and had never been inspected: `NextVisionFILMS.svg`, a genuine 737×226 vector, now preserved at `source-assets/brand/`. Icons ship. A header swap is still a Review A decision and was NOT made. | PWA ✅, header (open) |
| **R7** | **Master media** — see `SMASH_MEDIA_INVENTORY.md` §6 M1–M9. **Longest lead time in the project** | Cinematic heroes |
| **R8** | **Publish the six unpublished pieces and the 2026 showreel?** | Portfolio scope |
| **R9** | **Which showreel is current** — 3:09 or the 2026 55 s cut? | Homepage hero |
| **R10** | **EN translation** — who writes it, and when? PT ships first regardless | i18n rollout |
| **R11** | **Confirm or drop `fi.co`; supply the Readymag examples** | Reference set |
| **R12** | **May `docs/Smash/` move out of `docs/`?** It is 469 MB and is the owners' only local copy | Repo hygiene |
| **R13** | **Audio on the hero** — muted-with-unmute (the `promenade.pt` pattern) or silent? | Hero design |

---

## 15. Rejected alternatives

| Rejected | Why |
|---|---|
| **Next.js** | Ships a React runtime for a site with no application state; needs the OpenNext adapter on Cloudflare; more concepts than the project uses (§2) |
| **Staying on WordPress and optimising it** | Does not fix the root causes: custom CSS unversioned in an admin field, layout entangled with content, 89 requests. Would preserve the maintenance problem |
| **Headless CMS in v1** | Hosted dependency, second source of truth, cost and auth surface — for content that changes a few times a year. Git-backed CMS later is free and needs no code change (§4.4) |
| **Cloudflare Stream** | Long-form video stays on YouTube; the remainder are silent 4–6 s loops where Stream's player and per-minute billing lose to R2 (§6.6) |
| **Self-hosting the 20 project films** | Discards the YouTube channel as a distribution asset and adds real bandwidth cost for no user-facing gain |
| **Tailwind / a CSS framework** | ~15 components; tokens in one file already satisfy the "restyle = token change" requirement without a build dependency |
| **Keeping reCAPTCHA v3** | Loads on every page including form-less ones, profiles users pre-consent, and adds a persistent badge. Turnstile is free and a better GDPR posture (§7) |
| **Keeping Google Fonts** | Three families requested, one used; a third-party pre-consent request; CLAUDE.md §4 requires self-hosting |
| **Images committed to git for build-time optimisation** | Convenient, but contradicts CLAUDE.md §6. The generated manifest gives the same CLS-free result with no binaries in the repo (§6.3) |
| **On-the-fly Cloudflare Image Transformations in v1** | Per-transformation billing and a runtime dependency, for 20 posters that change rarely. Pre-generated derivatives are cheaper and deterministic — and the helper keeps the swap to one file |
| **Renaming portfolio slugs to be tidier** | Trades indexed SEO equity for cosmetics |

### Rejected in Revision 2

| Rejected | Why |
|---|---|
| **Three.js / WebGL scenes** | Large runtime, GPU and battery cost, poor on mid-range Android, hard to make accessible — and **it competes with the footage**. Not one film-production reference uses it; only the non-film agency sites do (`DESIGN_REFERENCES.md` §2). For a production company the spectacle is the film |
| **Switching to Next.js now that motion is a requirement** | Re-tested in §2.1. Nothing in the new brief needs a client framework, and one new requirement — SEO — actively penalises the SPA-shell approach two references take |
| **Locomotive Scroll** | Superseded by Lenis, which is lighter and is what the closest genre match (`mariaemayer.com`) runs |
| **Barba.js for page transitions** | Astro's `ClientRouter` covers it with no extra dependency and a documented lifecycle |
| **GSAP loaded globally** | 45 KB on a legal page for nothing. Dynamically imported per route instead (§16.1) |
| **Web Animations API as the primary motion tool** | No scroll-trigger primitive and no timeline sequencing; more hand-written code for the same result |
| **Bespoke cursor replacing the system cursor** | Desktop-only, invisible on touch, an accessibility and pointer-precision problem, and the most-copied device in this genre — it would read as borrowed |
| **Scroll-jacking / forced horizontal navigation** | Breaks find-in-page, keyboard paging, screen readers and trackpad expectations |
| **Caching video in the service worker** | Would consume hundreds of MB on a user's device for a site whose value is streamed. Explicitly denylisted (§17.3) |
| **Auto-reloading on service-worker update** | An unrequested reload mid-scroll is the worst moment on a cinematic site. Prompt-to-update instead (§17.5) |
| **Translating slugs per locale** | Doubles the URL surface and fragments link equity. Page slugs are localised; **project slugs are not** (§10.1) |
| **Treating `Smash/` as the master archive** | 17 of its 20 files are 720p web exports, not masters (`SMASH_MEDIA_INVENTORY.md` §1) |
| **Rewriting copy now for SEO** | Permitted later only as reviewed diffs against the archived original, in brand voice, never keyword-stuffed (§11.4) |

---

## 16. Motion architecture (Revision 2)

Motion is now a first-class requirement: cinematic fluidity, refined page transitions, a
loading sequence, smooth scrolling, project reveals. **Fluid, not heavy or janky** — and
never animation for its own sake.

### 16.1 Decision — the smallest stack that actually gets there

| Layer | Choice | Weight (gz) | Scope |
|---|---|---|---|
| **Micro-interaction** | Plain **CSS** transitions/animations | 0 | Hover, focus, state changes, marquees, button and link feedback. **Most of the site's motion lives here.** |
| **Enter-on-scroll** | **IntersectionObserver** + CSS classes | ~1 KB own code | Reveals, staggered lists, typography entrances |
| **Page navigation** | Astro **ClientRouter** (View Transitions) | 0 extra | Route swaps, shared-element continuity |
| **Scroll feel** | **Lenis** | ~3 KB | One damped scroll model across trackpad, wheel and touch |
| **Choreography** | **GSAP core + ScrollTrigger**, dynamically imported per route | ~45 KB, code-split | Only scrubbed/pinned/timeline sequences that genuinely need it |

**Baseline cost on every page: about 4 KB.** GSAP is not global — it is a dynamic
import on the routes that use it, so a legal page or the contact page never pays for it.

**Rejected:** Web Animations API as the primary tool (no scroll-trigger primitive, no
timeline sequencing — more code for the same result; it is still used *under* View
Transitions) · Locomotive Scroll (superseded by Lenis, which the closest genre reference
mariaemayer.com uses) · Barba.js (ClientRouter covers it) · Framer Motion / React
Spring (would drag in a UI framework) · **Three.js / WebGL** (§15).

*Verify at implementation:* GSAP's licence terms and the current ClientRouter API.

### 16.2 Motion tokens

Motion is tokenised exactly like colour, in `tokens.motion.css`:

```
--dur-instant 80ms   --dur-fast 180ms   --dur-base 320ms
--dur-slow 600ms     --dur-cinematic 1200ms
--ease-out    cubic-bezier(.16,1,.3,1)      /* the house easing */
--ease-in-out cubic-bezier(.65,0,.35,1)
--ease-cut    steps(1,end)                  /* hard cut, for the film vocabulary */
--stagger-tight 40ms  --stagger-base 80ms
--parallax-subtle .04  --parallax-base .1
```

**No component may hardcode a duration or easing.** "Make it calmer" is a token edit.

### 16.3 Page navigation

`ClientRouter` in the base layout. Native View Transitions where supported; Astro's
JS fallback swap elsewhere. blueboypictures.com ships native View Transitions in
production for a Portuguese film company — this is not experimental.

- **Shared-element continuity** is the signature move: a clicked project frame carries `transition:name="project-{slug}"` and *becomes* the project page's hero. Continuity, not a curtain.
- Header, footer and the Lenis scroll root use `transition:persist` — they never re-mount.
- **Budget: total transition 400 ms or less.** Anything longer reads as slow.
- Transitions **never** delay first paint on a cold entry.
- Fallback where View Transitions are unsupported: a plain cross-fade, or nothing under reduced motion. Navigation always works.

### 16.4 Smooth scrolling

Lenis, initialised **once**, persisted across swaps, single shared `requestAnimationFrame`
loop (also driving ScrollTrigger, so there is never a second RAF).

- Light damping, settle **under 1 s**. Cinematic means considered pacing, not sluggishness.
- **Never scroll-jacking.** No hijacked direction, no forced section snapping, no disabled native paging.
- `scrollTo(0, { immediate: true })` on `astro:after-swap`.
- **Disabled entirely** under `prefers-reduced-motion`, on the `minimal` device tier, and while a modal or the mobile menu is open (with scroll locking).
- Anchor links (`/contactos#contactar`) route through Lenis with a header offset.

### 16.5 The loader

A short branded hold that masks **real** asset loading — never an artificial delay.

- Cap: **1.2 s**, then it leaves regardless.
- Skipped on repeat visits within a session (`sessionStorage`).
- Skipped entirely under reduced motion and on the `minimal` tier.
- Must not block LCP: the loader is an overlay above already-rendered HTML, not a gate in front of it.
- No percentage counters that lie.

### 16.6 The motion catalogue

| Moment | Technique | Tier |
|---|---|---|
| Typography reveal | CSS clip/translate on line wrappers, `--stagger-base` | all |
| Project reveal in a grid | IntersectionObserver + CSS, staggered | all |
| Frame to hero transition | View Transitions `transition:name` | full, reduced |
| Hover preview on a frame | video play on pointer intent, CSS crossfade | full only, `(hover:hover) and (pointer:fine)` |
| Touch equivalent | Poster + visible play affordance; tap navigates | mobile |
| Scroll-scrubbed image sequence | GSAP ScrollTrigger `scrub` | full only; degrades to a static strip |
| Parallax on media | `transform: translate3d`, `--parallax-*` | full, reduced (halved) |
| Marquee / capability band | CSS `animation`, duplicated track | paused under reduced motion |
| Section entrance | CSS + IntersectionObserver | all |
| Header show/hide on scroll | Lenis direction + CSS class | all |

**Only `transform` and `opacity` are animated.** No animation of `width`, `height`, `top`,
`left`, `margin` or `filter` on scroll. `will-change` is applied immediately before an
animation and removed after — never left on.

### 16.7 Reduced motion — three tiers, not a switch

| Tier | Trigger | Behaviour |
|---|---|---|
| **full** | Default on a capable device | Everything in §16.6 |
| **reduced** | `prefers-reduced-motion: reduce` | No autoplay video (poster instead), no parallax, no scrub, no marquee, no loader. Lenis off. Transitions become instant or a 120 ms opacity fade. **Nothing becomes unreachable** |
| **minimal** | `saveData`, `deviceMemory <= 4`, `hardwareConcurrency <= 4`, or a failed frame-rate probe | As `reduced`, plus: no hover-preview video, GSAP never imported, smaller image ladder |

Tier is resolved once, exposed as `data-motion` on the root element, and every rule keys
off it — so motion behaviour is inspectable in devtools rather than hidden in JS.

### 16.8 Mobile and touch

- **No hover-dependent information anywhere.** This is the current site's bug (audit §9.8) and it does not return.
- Hover-preview video is desktop-only. Mobile shows the poster and the metadata, which are already complete.
- Scroll-scrubbed sequences degrade to static strips on touch.
- Momentum scrolling stays native-feeling; Lenis is tuned lighter on touch or disabled if it fights the platform.
- **Motion is tested on a real mid-range Android**, not only in a desktop emulator.

### 16.9 Lifecycle and cleanup

The failure mode for MPA + heavy motion is leaked observers and duplicate timelines after
navigation. Handled explicitly:

```
astro:before-swap   -> gsapContext.revert(); ScrollTrigger.killAll();
                       observers.disconnect(); videos.pause(); remove listeners
astro:after-swap    -> lenis.scrollTo(0, { immediate: true })
astro:page-load     -> re-create context, re-observe, ScrollTrigger.refresh()
```

- One GSAP `context` per page, reverted on swap — no orphan tweens.
- One RAF loop for the app's lifetime, driving both Lenis and ScrollTrigger.
- Every video element is paused and its source detached when it leaves the viewport.
- `ScrollTrigger.refresh()` on font load and on resize (debounced), because late fonts change layout.

### 16.10 Performance guardrails (verified in Phase 10)

- **60 fps** during scroll and transitions on a mid-range Android.
- **No long task over 50 ms** attributable to motion code.
- Motion must not regress **CLS below 0.05** or **INP below 200 ms**.
- Motion JS at most 4 KB gz on pages without choreography; at most 50 KB gz on pages with it.
- If an effect cannot hold 60 fps on the target device, **the effect is cut** — not the frame rate.

### 16.11 Amendment, 2026-09-03 — Review E, as built

§16.1–§16.10 were the plan. This is what the system actually is after Review E, and where
it departs from the plan and why. Full record: [`MOTION_REVIEW.md`](MOTION_REVIEW.md).

| Planned (§16) | As built | Why it changed |
|---|---|---|
| GSAP + ScrollTrigger, dynamically imported per route | **Not installed, not imported, not needed** | The claim that nothing here is a timeline was re-tested rather than inherited and it held. The ground is a transition on one attribute, the morph is two `view-transition-name`s, the reveals are one class. |
| Lenis global, one shared RAF for the document lifetime | **Desktop fine pointers only, dynamically imported, and the loop stops when the page is still** | `syncTouch` was already off, so on touch Lenis smoothed nothing while costing a permanent frame loop and 5.4 KB gz. A permanent RAF on an idle page is unjustifiable when the alternative is free. |
| "Baseline cost about 4 KB" | **10.6 KB gz blocking** (runtime 4.7 + ClientRouter 5.7 + tier 0.4), Lenis a further 5.4 conditionally | The 4 KB figure counted our own code and not `ClientRouter`, and put Lenis at 3 KB when it is 5.4. Corrected by measurement, not estimate. |
| Tokens named for length (`--dur-fast`, `--dur-slow`…) | **Named for role**, seven durations, three easings, four distances | A component should not have to decide which *length* a hover deserves. |
| `reduced` = transitions become instant or a 120 ms fade | **Travel goes to zero; the long durations collapse onto `--dur-ui`. `--dur-fast` and `--dur-ui` survive intact** | The code had zeroed everything, which makes an interface harder to follow, not easier. §16.7 was right and the implementation was not. |
| Tier resolved once in JS | **Resolved once in an inline pre-paint bootstrap**; CSS and both runtimes read `data-motion` | A deferred module resolves the tier *after* the first paint, which is how the loader ended up arriving on top of readable content. |
| Shared-element continuity via `transition:name` in the markup | **Named at the moment of intent, exactly one element per document** | Rendering the name into every card meant a `/portfolio/` navigation captured 20 named elements to pair 1, with 19 solo fades over 19 holes in the outgoing snapshot. |
| Header show/hide on scroll (§16.6) | **Not built and not wanted** | The header is the ink-and-scrim system from Review B. Hiding it would break the declared-theme contract for no gain. |
| Parallax on media (§16.6) | **Not built; tokens removed** | Never used, and the brief rules out constant parallax. |
| Scroll-scrubbed image sequence (§16.6) | **Not built** | No project publishes a sequence. `image-grid` in `scrub` mode renders as the composed strip. |
| `lenis.scrollTo(0)` on `astro:after-swap` (§16.4) | **Not done, deliberately** | Forcing 0 would fight the browser's own scroll restoration on Back. The scroll model is constructed at `astro:page-load`, after the browser has settled the position. |
| Anchor links route through Lenis with a header offset (§16.4) | **Built, and the offset is `scroll-padding-block-start`** | One declared number, read by native jumps, `:target`, keyboard focus travel and the scroll model alike. |

**New, not in the plan:**

- **A rAF-starvation failsafe on the scroll driver.** The throttle cleared its `queued`
  flag inside the animation frame, so a single undelivered callback latched the ground and
  header theme on stale values for the rest of the page's life. The first frame is now a
  probe with a timer fallback. Same doctrine as §16.9's IO refusal, one level down.
- **Zero layout reads per scroll frame.** The progress stripe read `scrollHeight` live.
- **Motion density drops on touch with no preference expressed** — one `(pointer: coarse)`
  token block.
- **Hover previews attach a source only after a 140 ms pointer dwell**, at most one runs,
  and keyboard focus starts nothing.
- **Decorative video stops when the tab is hidden.**
- **`min-block-size: 100svh` on the shell**, not `dvh`: `dvh` tracks collapsing browser
  chrome, so the shell's minimum height changed mid-scroll and re-measured every boundary.

**Guardrails still owed (§16.10):** 60 fps on a real mid-range Android, CLS and INP under
motion. Phase 10, on a real device. Not claimed.

---

## 17. PWA (Revision 2 — confirmed requirement)

Distinct from responsive design: this is installability, offline resilience and app-like
launch. **It is not an excuse to cache the portfolio.**

### 17.1 Scope

| Included | Excluded |
|---|---|
| Web App Manifest | Push notifications |
| Installability (Android/desktop; iOS add-to-home) | Background sync / periodic sync |
| Maskable + standard icons | Offline video playback |
| Theme and background colour from tokens | Any offline-first behaviour that silently serves stale content |
| Service worker with a conservative cache policy | Caching large media |
| Designed offline fallback page | Badging, share target, file handlers |
| Controlled update prompt | |

### 17.2 Manifest

`name: "Next Vision Films"` · `short_name: "NVF"` · `id: "/"` · `start_url: "/"` ·
`scope: "/"` · `display: "standalone"` · `orientation: "any"` · `lang: "pt-PT"` ·
`categories: ["entertainment","photo","business"]` ·
`theme_color` / `background_color` **generated from the colour tokens**, so a design change
updates them automatically · `shortcuts`: Portfólio, Contactos.

**Icons — BUILT, Phase 15.** 192, 512, a **maskable 512** and `apple-touch-icon` 180, plus
`favicon.ico` (48/32/16). All five are deterministic downscales of ONE preserved source and
none is hand-drawn: `scripts/build-icons.mjs`, `npm run icons:build`.

The owner request for a vector logo is **withdrawn, not satisfied-by-guess.**
`NextVisionFILMS.svg` was never inspected — `archive:source` fetches only media a page
references, and it is a library asset no page uses. Fetched, it is a genuine clean vector:
737×226, 17 paths, text outlined, no raster, and its five colours ARE the brand palette.
Preserved at `source-assets/brand/`.

It is nonetheless **not the icon source**, because it is a 3.25:1 wordmark and an icon is
square. The square *NVF* monogram is a different lockup, not a crop, so deriving one would
be recomposing the mark (CLAUDE.md §8). `NVF.png` — 2431², preserved beside it — already IS
that lockup and is what the live site downscales for its own icon slots. 2431 → 512 is 4.7:1;
the script FAILS rather than upscale, and asserts the maskable content's diagonal (402.2 px)
fits the 409.6 px safe circle rather than assuming padding is enough.

One deliberate change: an opaque **`#292929`** ground. The mark is light grey on
transparency and vanishes on the white a platform composites it onto — the live favicon has
that defect now. It is `--brand-ink`, already `theme_color`. 9.8:1.

`theme_color` / `background_color` are no longer placeholders — `validate:pwa` checks them
against `--brand-ink` / `--brand-cream`, and `BaseLayout` READS `theme_color` out of the
manifest rather than retyping a hex, so there is one authority for the install identity.

### 17.3 Service worker — **AMENDED, Phase 11**

~~`@vite-pwa/astro` (Workbox `generateSW`)~~. **Hand-written**, generated at build time by
the `nvf:service-worker` integration in `astro.config.mjs`, from the source in
`src/pwa/service-worker.js`. **The policy table below is unchanged; only the mechanism is.**

Why: `generateSW` builds its precache from globs over the build output, and that output
contains `public/__generated/` — roughly a hundred megabytes of mp4 renditions and webp
derivatives — against a **20 MB** budget. Reaching the right answer means maintaining a
denylist that has to stay correct as media is added, and a denylist that silently stops
matching is how a phone ends up holding the portfolio. An explicit generated list cannot
make that mistake, and it removes a build dependency from a site whose blocking JS budget
has been defended since Review E. Precache: **21 entries, 269 KB**.

| Asset class | Strategy | Cap |
|---|---|---|
| CSS, JS, fonts (hashed, immutable) | **CacheFirst** | 1 year |
| HTML documents | **NetworkFirst**, 3 s timeout, then cache, then offline page | 30 entries |
| Images (R2 posters, stills) | **StaleWhileRevalidate** | **60 entries, 30 days** |
| **Video (`.mp4`, `.webm`, `.mov`, any R2 `video/` path)** | **NetworkOnly — never cached** | — |
| YouTube / third-party | **NetworkOnly** | — |
| API routes (`/api/*`) | **NetworkOnly** | — |

**Storage budget: under 20 MB per device.** Enforced by entry caps and `purgeOnQuotaError`.
The video exclusion is a Workbox denylist on file extension *and* path prefix, so a future
R2 path cannot accidentally opt in.

### 17.4 Offline behaviour

A designed `/offline/` page in brand voice (this is **new copy**, so Humanizer applies).
Previously visited pages remain readable from cache. Video is never available offline, and
the UI says so rather than showing a broken player.

### 17.5 Updates

`registerType: 'prompt'`. **Never auto-reload** — an unrequested reload mid-scroll on a
cinematic site is the worst possible moment. A quiet, dismissible toast ("Nova versão
disponível") triggers `skipWaiting()` only on user action. Deploys are atomic, so a stale
client is never served a half-updated site.

### 17.6 Verification — **MEASURED, Phase 15**

`npm run validate:pwa` runs in `verify`, against the BUILD, and `npm run icons:check`
rebuilds the icons in memory and diffs them so a hand-edited icon fails the build. Both were
tested by breaking them — 11 deliberate defects, 11 caught: a lying `sizes`, a drifting
`theme_color`, a 404 icon, a removed maskable, a precached mp4, a precached poster, a second
`skipWaiting`, an unprecached offline shell, a stripped manifest link, an alpha channel on
the apple-touch icon, and a repainted icon.

Two of those defects were REAL and are fixed: the apple-touch icon was RGBA-but-opaque
(`flatten` leaves the channel; `removeAlpha` was needed), and the first `skipWaiting` count
read the worker's own header COMMENT as a call site — so the check now strips comments, the
same rule `validate:analytics` follows for prose.

Driven in a real browser against `dist/client`, not asserted from source:

- manifest served as `application/manifest+json`, all five assets 200, **rendered pixel
  dimensions equal to every declared `sizes`**
- **first install:** 21 entries, **271 KB** of the 20 MB budget, 0 video, 0 generated media
- **offline** (server killed): an uncached PT route renders the PT shell, an uncached EN
  route the EN shell with `lang="en-GB"`, and a route cached before the outage still renders
  its own content, not the shell — URL preserved in all three
- **update:** a new `BUILD_ID` installs and **WAITS**; the old worker keeps control and the
  old caches survive. Only the `nvf:activate-update` message activates it, and activation
  deletes all three stale caches.
- **video:** a preview `.mp4` fetches 200 and is **never cached**, at runtime, not only in
  the precache list

Not verified here, and deliberately: `pwa.ts` refuses to register on localhost, so the
worker was registered by hand for these tests. Real install prompts on Android/iOS hardware
and Lighthouse belong to staging (step 12).

---

## 18. Source preservation (Revision 2 — elevated to a risk)

**The owners expect the current WordPress site may disappear around the end of 2026.**
Everything it holds must be captured **before** the build depends on it.

### 18.1 What must be preserved, and where it stands

| Asset | Status | Action |
|---|---|---|
| Portfolio metadata (20 projects) | done — `docs/content/portfolio_items.json` | none |
| Exact page copy | done — `docs/content/extracted.json` | none |
| Legal copy | done — `docs/content/*.txt`, verbatim | none |
| Media URL inventory (77) | done — `docs/content/media_inventory.json` | none |
| WP media library metadata | done — `docs/content/media.json` | none |
| **Raw HTML of all 34 URLs** | **at risk — only in a temporary scratch folder, will be lost** | **Re-fetch and commit** |
| **WordPress media binaries** | **not downloaded** — 77 assets including 9 `.mov` | **Download and archive to R2** |
| Owner source media | done — `docs/Smash/` (20 files, 469 MB), inventoried | Archive to R2 |
| YouTube films (20 + showreels) | live only on YouTube | IDs recorded; masters are an owner request |
| SEO metadata | done — in `extracted.json` | none |
| Redirect map / routes | done — audit §1, §11 here | none |
| **Masters for 10 projects** | **do not exist locally** | **Owner requests M1 / M6** |

### 18.2 Action — Implementation Phase 0.5, before anything else

A `scripts/archive-source.mjs` that: re-fetches and commits the raw HTML of all 34 URLs;
downloads every one of the 77 media assets with checksums; writes a manifest mapping each
WordPress URL to its archived file and its future R2 key (which also generates the
`/wp-content/uploads/*` redirect table, §11.2); and records YouTube IDs, titles and
durations.

Binaries go to **R2 under `archive/wordpress/`**, never to git. The manifest is committed.

**This runs first.** Every later phase then works from the archive, and the project stops
depending on a site that may vanish.
