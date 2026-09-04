# SEO & i18n Rollout — Phase 11

**Completed:** 2026-09-03 · **Scope:** PT/EN architecture, English content, the SEO pass,
a designed 404 and the PWA offline shell.

The site now serves **73 pages**: 33 Portuguese routes, 31 English, the two error states
in each language, and the five internal `/__concepts/` prototypes. **52 URLs are in the
sitemap** — exactly the indexable set.

---

## 1. The PT/EN architecture

A page is a **component that takes a locale**, mounted twice by two thin route files.

```
src/components/pages/AboutPage.astro     the page
src/pages/sobre.astro                    <AboutPage locale="pt" />
src/pages/en/about.astro                 <AboutPage locale="en" />
```

That split is the whole of it, and it is chosen for one reason: two copies of a page are
two chances for the languages to drift into different designs of the same content. A
layout change lands in both, or in neither.

| | Portuguese | English |
|---|---|---|
| home | `/` | `/en/` |
| about | `/sobre/` | `/en/about/` |
| portfolio | `/portfolio/` | `/en/portfolio/` |
| services | `/servicos/` | `/en/services/` |
| contact | `/contactos/` | `/en/contact/` |
| thank-you | `/obrigado/` | `/en/thank-you/` |
| projects | `/portfolio/{slug}/` | `/en/portfolio/{slug}/` — **same slug** |
| archives | `/categoria-portfolio/{slug}/` | `/en/portfolio-category/{slug}/` |
| terms | `/termos-e-condicoes/` | — |
| privacy | `/politica-de-privacidade/` | — |

**`PAGE_LOCALES` in `src/i18n/routes.ts` is the single declaration of what exists.** The
built routes, the hreflang set, the sitemap, the language switch and the footer's legal
links all read it, so those five cannot disagree. `translatePath` returns `null` where no
counterpart was built, and every caller handles `null` rather than linking somewhere
wrong.

Project slugs stay locale-invariant. A slug is a proper noun and translating it would
double the URL surface and split link equity for nothing (`ARCHITECTURE.md` §10.1).

---

## 2. The translation rule

**The live site publishes no English.** `/en/homepage-english/` holds eighteen characters
and no content. So there was nothing to preserve and nothing to rewrite: writing English
here is *authoring*, and it is the only text on this site we own.

The rule every string followed:

1. **Fidelity to the Portuguese comes first.** No fact added, no claim strengthened, no
   sentence split or joined.
2. **The Portuguese is untouched**, and still verified word for word against
   `docs/source-archive/pages.json` on every build.
3. **A source typo is not a voice.** `/servicos/` sets a space before its full stop; the
   English does not reproduce it, because carrying a typo into a language it was never
   made in would be inventing a mistake rather than preserving one. Same for the missing
   space in `Produção &Direção Artística`.
4. **A proper noun is not translated.** A film's title is its title — `Epitáfio` is
   `Epitáfio` in English.

### What was translated, and what needed nothing

| | |
|---|---|
| Page prose | 51 strings, each holding its Portuguese, its source URL and its English on one object |
| Services | 4 titles, 4 descriptions, 4 excerpts |
| Categories | 5 names |
| Team | 2 roles |
| UI chrome | 45 keys, complete in both dictionaries |
| Project taglines | **2.** The other 18 projects publish English prose already |

That last row is the surprising one and it changed how the check works. Eighteen of the
twenty films carry English taglines on their Portuguese pages, because that is how they
were published. Those entries declare **`sourceLocale: en`**, which states the fact rather
than leaving it to be inferred — the difference between "already English" and "nobody
translated it yet" is now a declaration, and `npm run validate:data` reads it.

`sourceLocale` existed in the schema from Phase 0 and had never been load-bearing.

---

## 3. The legal pages are Portuguese only — a decision, not a gap

`/termos-e-condicoes/` and `/politica-de-privacidade/` have **no English version and will
not get one from us.** They are binding text; no owner-approved translation exists; and
machine-translating a contract or a GDPR notice would publish a legal claim nobody wrote
(CLAUDE.md §2, §8).

Handled honestly in four places rather than hidden:

- `PAGE_LOCALES` lists them as `['pt']`, so **no English route is built**.
- They emit **no `hreflang` alternates and no `x-default`** — the correct annotation for a
  page that exists in one language.
- The **language switch** shows the English control disabled, announced as
  *"This page exists in Portuguese only"* — not a dead link, not a hidden control.
- The **English footer and the consent checkbox** link to the Portuguese documents,
  carrying `lang="pt"`, `hreflang="pt-PT"` and a visible *(in Portuguese)* note. A site
  must be able to reach its own privacy policy; sending someone into a contract in
  another language without telling them is the failure worth avoiding.

Publishing English legal text later is **one array in one file**.

---

## 4. The language switch

Renders in the header and, by construction rather than by a second copy of the markup, in
the mobile menu — fixing audit §9.2, where the switcher is invisible below 768 px. Three
states:

| State | Rendering |
|---|---|
| current locale | `<span aria-current="true">`, not a link |
| counterpart exists | `<a>` to that exact page, with `hreflang` and `rel="alternate"` |
| no counterpart | `<span aria-disabled="true">`, announced with the reason |

The error states name their own counterparts, because their URLs cannot be translated: the
**404 offers the other locale's home** (the honest equivalent of "this address is nowhere,
here is somewhere"), and the offline shell offers the other locale's offline shell. The
404 previously said *"this page exists in Portuguese only"*, which is not true of a page
that does not exist in any language.

Keyboard and touch operable, never hover-only, 40 px tall in the mobile menu.

---

## 5. Reviewable copy diffs

Everything else is the published text unchanged. **Three things changed and need owner
approval** (CLAUDE.md §2.1 permits all three as reviewed proposals).

### D-11a · The homepage `<title>`

```diff
- Homepage - We are NVF - Produtora Audiovisual
+ Next Vision Films - We are NVF - Produtora Audiovisual
```

The company's name did not appear in the title of its own front page. `Homepage` described
nothing and competed with nothing. The preserved suffix is untouched.

### D-11b · `/obrigado/` becomes `noindex, follow`

A form's success state, which says so in its own first sentence. Nobody searching for a
film production company is served by landing on it. `follow`, because its one link into
the portfolio is still worth crawling. It leaves the sitemap with it.

### D-11c · Meta descriptions replace the Yoast excerpts

The live site publishes a real meta description on **one of thirty-four pages**. Everywhere
else Yoast emitted the top of the page with its punctuation removed and a `[…]` on the end:

```
Sobre Nós De uma ideia a um movimento.  A NVF nasceu entre câmaras, roadtrips,
 trilhos de montanha, amizades e um eterno contacto com o audiovisual. […]
```

Every page now carries a description that is a **selection of whole published sentences**,
in their published order, joined by a single space. Not one word is written or paraphrased
— the same rule the services excerpt already lives under (decision A44), applied to
metadata, and checked the same way: each Portuguese fragment declares the page it was
published on and `npm run validate:data` verifies the claim against the archive.

They run 83–153 characters. One example, and the pattern holds for all of them:

```diff
- Sobre Nós De uma ideia a um movimento.  A NVF nasceu entre câmaras… […]
+ De uma ideia a um movimento. A NVF nasceu entre câmaras, roadtrips,  trilhos de
+ montanha, amizades e um eterno contacto com o audiovisual.
```

**`/termos-e-condicoes/` deliberately publishes none.** Every sentence in that document is
a binding clause, including its first; selecting one would present a term of contract as a
summary of the page, and writing a neutral one would be authoring legal-adjacent copy. The
reason is declared in `PAGE_META.noDescriptionBecause` and `validate:seo` accepts the page
*because* it is — silence is never allowed to look like an oversight.

**This also settled a live defect.** `/contactos/` shipped its Yoast excerpt verbatim
through Phase 10, and that excerpt prints `nextvisionfilmsagency@gmail.com` — one of the
three addresses **decision D2** has not settled. No page publishes any of them now, in any
element.

### The English title suffix

`We are NVF - Audiovisual Production`. New, because the live site has no English pages: a
translation of the Portuguese suffix's own words. `Produtora Audiovisual` is what an
audiovisual production company is called in Portuguese, so this is the same claim and not
a bigger one.

---

## 6. The SEO pass

**Fixed technically, no copy involved:**

- `hreflang` on **every** page, reciprocal and machine-checked, with `x-default` always
  pointing at Portuguese. It was on 2 of 34 pages.
- Self-referencing `canonical` everywhere, including the five archives that had none.
- `og:image` on `/` and `/portfolio/`, which had none; `og:image:alt` everywhere, which
  the live site has nowhere.
- `og:description` on all 20 project pages, which had none.
- `og:site_name`, `og:locale` and the title suffix follow the locale.
- **`VideoObject` on 38 project pages** — every project with a real film. The live site
  has none, for a company whose product is film. Emitted only with a real thumbnail and
  upload date; a partial `VideoObject` is worse than none.
- `BreadcrumbList` on every page, `ItemList` on `/servicos/`, `CollectionPage` +
  `ItemList` on `/portfolio/`, `ContactPage` on `/contactos/`.
- **`/sobre/` og:image** is the page's own first photograph. The live one is `colors.png`,
  a 100×22 colour strip that every platform rejects on size (audit §3.2). *(Carried from
  Phase 10; the card now also describes what the photograph is.)*
- **The sitemap is exactly the indexable set.** One rule: a URL belongs in it if and only
  if it is indexable. Three gaps closed — the English archives and both thank-you pages
  were all eligible before.
- **`/blog` redirects to `/portfolio/`.** `routes.json` has held that line since Phase 0.5
  and nothing ever emitted it, so the link on the "Ver Tudo" button of **all twenty**
  project pages has 404ed through every build. `public/_redirects` is generated from the
  route map now (`npm run redirects:build`).

**Alt text — derived, never described.** We have not been told what is in these images, so
nothing invents a description. Two situations get text, assembled from facts the content
already holds:

- team portraits → *Retrato de {name}* / *Portrait of {name}*
- editorial project frames → *Fotograma 2 de 6 de {title}* / *Frame 2 of 6 from {title}*

Everywhere else `alt=""` stays, and that is a decision: the hero is followed by its own
`<h1>`, and every card sits inside a link that already announces "title, category, date".
Repeating that in an `alt` serves a screen-reader user worse, not better.

### Not resolved here — they are the owners'

**D2** (which of three e-mail addresses is canonical) · **D3** (the four category
descriptions that do not match their own headings) · **D5** (`/blog` → `/portfolio/` is
still marked `assumed`) · **D9** (is GDPR consent required?) · **D17** (form recipient) ·
**D18** (newsletter destination). Each is recorded where it bites, and none was quietly
decided to make a page look finished.

---

## 7. The 404 and the offline shell

One component serves both, because they are the same object: a page with nothing to show,
which exists to say what happened and offer a way out. Both open on the approved
`PageHead`; neither adds design vocabulary.

**The one new element is the slate** — an empty frame, which is what a 404 is on a site
whose whole vocabulary is frames. It carries the address that failed, written with
`textContent` and capped at 160 characters. **The offline page does not get one**: it has
no fact to put in a frame, and a frame holding a mood is decoration.

Neither apologises, jokes, or carries a marketing paragraph. Both `noindex`, both out of
the sitemap. The English 404 is moved to `/en/404.html` at build time, because that is the
path a static host looks for; if a host ignores per-directory 404s, the root one still
answers.

---

## 8. PWA — an amendment to ARCHITECTURE §17.3

**The service worker is hand-written, not `@vite-pwa/astro`.** The cache policy is
unchanged; only the mechanism is.

`generateSW` builds its precache from globs over the build output. This build output
contains `public/__generated/` — roughly a hundred megabytes of mp4 renditions and webp
derivatives — and **the storage budget for the whole site is twenty**. Getting Workbox to
the right answer means maintaining a denylist that has to stay correct as media is added,
and a denylist that silently stops matching is how a phone ends up holding the portfolio.

An explicit generated precache list cannot make that mistake. Nothing is cached at install
unless the build put it in the list, and **video is refused by the worker on top of that,
twice** — by file extension and by path prefix, because a future R2 layout could serve an
mp4 from a URL that does not end in one.

| Asset class | Strategy | Cap |
|---|---|---|
| hashed CSS/JS, fonts | CacheFirst | precached |
| documents | NetworkFirst, 3 s timeout → cache → offline shell | 30 entries |
| images | StaleWhileRevalidate | 60 entries, 30 days |
| **video** | **NetworkOnly — never cached** | — |
| `/api/*`, cross-origin | NetworkOnly | — |

**Precache: 21 entries, 269 KB.** The two offline shells, the manifest, six font faces and
the hashed CSS and JS — everything needed to *render* a page with no network.

`skipWaiting()` is reachable from exactly one place: a click on the update prompt. Nothing
auto-reloads (§17.5). The prompt's copy comes from the i18n dictionary and rides on the
shell, so the runtime carries no strings and never sniffs a language.

**Still blocked:** the manifest ships `"icons": []`. Installability needs a clean vector
logo, which is an owner request (`docs/PWA-ICONS-TODO.md`). `/favicon.ico` and
`/apple-touch-icon.png` 404 for the same reason.

---

## 9. Validation

`npm run verify` → `validate:data` → `validate:legal` → `check` → `redirects:build` →
`build` → `validate:routes` → `validate:seo`.

**`validate:data` gained i18n completeness.** Dictionaries key-for-key; every `v()`
reachable from an English route carrying a translation; services, categories and team
roles translated; projects checked against `sourceLocale`; and the marked services lead
still spelling its own sentence *in both languages*.

**`validate:seo` is new** and runs against `dist/`:

| Check | Result |
|---|---|
| locale pairing, both directions | 31 English routes paired |
| reciprocal `hreflang`, `x-default` direction | 62 annotations |
| self-referencing canonicals | 66 unique |
| unique titles and descriptions | 64 / 41 |
| no locale's chrome on the other's pages | 68 pages |
| internal links resolve | 926 links |
| sitemap == the indexable set | 52 URLs |
| project SEO and frame alt text | 40 pages, 38 `VideoObject` |

One refinement is worth recording, because the validator found it and it was **not** a
defect: ten projects publish the same tagline in both locales, so their descriptions are
legitimately identical. Duplicate metadata is a defect between *unrelated* pages and
correct between hreflang alternates — that is what the annotation is for — so the check
reads the emitted annotations and exempts a declared pair.

**All six new checks were tested by breaking them.**

Real-browser verification: both locales at desktop and 375 px, the switch visible and
40 px tall in the mobile menu, one `<h1>` per page, and **zero horizontal overflow across
nine routes** including both error states.

---

## 10. Open questions

| | |
|---|---|
| **Q1** | The three reviewable copy diffs in §5 — homepage title, `/obrigado/` noindex, and the meta descriptions. |
| **Q2** | The English title suffix `We are NVF - Audiovisual Production`. Ours, not the owners'. |
| **Q3** | Every English string is our translation and none has been reviewed by a native speaker or by the owners. |
| **Q4** | An English legal translation, if the owners want one. It is one array in `PAGE_LOCALES`. |
| **Q5** | `/blog → /portfolio/` is still **assumed** (D5). |
| ~~**Q6**~~ | ~~PWA icons remain blocked on a vector logo.~~ **Closed by Phase 15** — the site is installable. |
