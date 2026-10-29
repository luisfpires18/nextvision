# Route Migration Map

**Generated:** 2026-09-02 · **Data:** [`src/data/routes.json`](../src/data/routes.json) · **Built by:** `scripts/build-route-map.mjs`

Every URL the WordPress site serves, and what happens to it. This file explains the map;
the JSON is the source the build and the cutover check consume.

---

## 1. Conventions

```
trailingSlash          always            (matches WordPress today)
defaultLocale          pt                unprefixed
en                     /en/…             prefixed
project slugs          locale-invariant  /portfolio/epitafio/ and /en/portfolio/epitafio/
page slugs             localised         /sobre/ ↔ /en/about/
```

Project slugs are proper nouns and stable identifiers. Translating them would double the
URL surface and split link equity for no gain. Page slugs are ordinary words and carry
SEO weight, so they are localised.

---

## 2. Preserved exactly — 33 routes

| Kind | Count | Notes |
|---|---|---|
| PT pages | 8 | `/` `/sobre/` `/portfolio/` `/servicos/` `/contactos/` `/obrigado/` `/termos-e-condicoes/` `/politica-de-privacidade/` |
| Project pages | 20 | `/portfolio/{slug}/` — **including the awkward ones.** `nvf-vs-antiqvvm`, `nvf-vs-filmin-details`, `ana-e-filipe-metro` are **not** tidied up |
| Category archives | 5 | `/categoria-portfolio/{slug}/` — in **no** sitemap today, and with no canonical and no `<h1>` (audit §9.18) |

`/portfolio/` is worth calling out: on WordPress it is served by the **portfolio CPT
archive**, not by page id 36. Yoast lists page 36 in `page-sitemap.xml`, but that page is
unreachable. The new site serves one real page at that URL.

**Category slugs stay even if the names change.** Decision R5 may rename
`Corporativo` → `Marcas`, etc. The taxonomy carries `previousSlugs`, so a rename
auto-generates its redirect and the indexed URL keeps resolving.

---

## 3. Redirects — 6

| From | To | Status | Confidence |
|---|---|---|---|
| `/blog` | `/portfolio/` | 301 | **assumed** — decision D5 |
| `/en/homepage-english/` | `/en/` | 301 | decided — and `/en/` is a real page as of Phase 11 |
| `/sitemap_index.xml` | `/sitemap-index.xml` | 301 | decided |
| `/page-sitemap.xml` | `/sitemap-index.xml` | 301 | decided |
| `/portfolio-sitemap.xml` | `/sitemap-index.xml` | 301 | decided |
| `/wp-sitemap.xml` | `/sitemap-index.xml` | 301 | decided |

`/blog` is a 404 today, linked from the "Ver Tudo" button on **all 20** project pages.
`/portfolio/` is the obvious target but is marked `assumed` until the owner confirms.

Plus a blanket rule: any path without a trailing slash redirects to the trailing-slash
form, matching WordPress.

~~While `/en/` has no content it redirects to `/`.~~ **EN shipped (Phase 11): `/en/` is a
real page and that line is retired.** `scripts/build-redirects.mjs` filters it out rather
than editing this map, because the map describes what the LIVE site does.

**These are emitted now.** `public/_redirects` is generated from `src/data/routes.json` by
`npm run redirects:build`, which runs inside `npm run verify`. Until Phase 11 nothing
emitted them at all, so `/blog` — linked from the "Ver Tudo" button on all twenty project
pages — 404ed in every build. Two groups are still deliberately not emitted: the
`/wp-content/uploads/*` map needs R2, and the 410 patterns need a Worker, since
`_redirects` speaks only in 3xx. The generated file says both.

**Projects removed in the admin** (2026-10-29) are redirected from data, not from this
map: `src/data/removed-projects.json`, written by the same commit that deletes the
project, makes `build-redirects.mjs` emit `/portfolio/<slug>/ → /portfolio/` and
`/en/portfolio/<slug>/ → /en/portfolio/`, 301. A slug that has a project file again is
skipped, so a new project with the same title is not hidden behind a redirect.

---

## 4. Uploads — 77 mapped

`/wp-content/uploads/{path}` must keep resolving: external sites hotlink these, and
social platforms have cached `og:image` URLs pointing at them.

| Status | Count | Handling |
|---|---|---|
| `archived` | **39** | Original upload, downloaded with SHA-256. Redirects to its future R2 key under `archive/wordpress/…` |
| `derivative-not-archived` | **38** | WordPress-generated size variant (`name-1024x576.png`). Redirects to the archived original; `derivedFrom` records which |

The mapping is **derived from the preservation archive**, not hand-maintained — re-running
`build-route-map.mjs` after any media change keeps it correct.

Unmapped `/wp-content/uploads/*` paths return **410 Gone**, not 404: an honest signal that
the resource existed and will not return.

---

## 5. Gone — 6 patterns → 410

`/wp-json/*` · `/wp-admin/*` · `/wp-includes/*` · `/xmlrpc.php` · `/feed/` · `/comments/feed/`

410 rather than 404 because these definitively will not come back. The feeds carry no
posts and no comments, so nothing of value is lost.

---

## 6. Known problem routes — 5

Recorded so cutover verification does not mistake a **pre-existing** bug for a migration
regression.

| Route | Problem | Audit | Decision |
|---|---|---|---|
| `/portfolio/` | Sitemap lists page id 36; the URL serves the CPT archive. Page 36 unreachable | §1.1 | — |
| `/portfolio/dont-let-it-fool-you/` | Video source is a `studio.youtube.com` **edit URL** for `e6aK4vEn420`, already published at `/portfolio/ana-e-filipe-metro/` | §9.7 | **D6** |
| `/politica-de-privacidade/` | The in-page `Navegação` anchors resolved to **digiup.me** | §9.4 | **D4 — FIXED as migration mechanics, 2026-09-03.** See §9 |
| `/contactos/` | Displayed email ≠ `mailto:` target — and `/termos-e-condicoes/` names a **third** address, `geral@nextvisionfilms.com` | §9.5 | **D2, still open.** No page publishes any of the three |
| `/politica-de-privacidade` | Linked without a trailing slash from the newsletter consent label | §1.6 | — |

---

## 7. Locale mapping

**Both columns are built as of Phase 11**, except the two legal documents, which are
Portuguese only — no approved English translation exists and machine-translating binding
text is not an option (`SEO_I18N_ROLLOUT.md` §3). The English category archives live at
`/en/portfolio-category/{slug}/`; like the Portuguese ones they are noindex and out of the
sitemap.

| id | PT | EN |
|---|---|---|
| home | `/` | `/en/` |
| about | `/sobre/` | `/en/about/` |
| portfolio | `/portfolio/` | `/en/portfolio/` |
| services | `/servicos/` | `/en/services/` |
| contact | `/contactos/` | `/en/contact/` |
| thank-you | `/obrigado/` | `/en/thank-you/` |
| terms | `/termos-e-condicoes/` | `/en/terms-and-conditions/` |
| privacy | `/politica-de-privacidade/` | `/en/privacy-policy/` |

**EN slugs are proposed, not final** — they are ordinary translations of the PT slugs and
have no SEO history to protect. They change freely until EN content is approved (R10).
**No EN route is emitted until that locale has real content**, so an empty English page is
never reachable — the exact failure the current site has.

---

## 8. The privacy-policy navigation — repointed 2026-09-03

The live `/politica-de-privacidade/` publishes its own `Navegação` index: ten links, and
the reader's only way into a 15 000-character document. **All ten pointed at
`https://www.digiup.me/politica-de-privacidade/`** — another company's policy (audit
§9.4, decision D4).

They now resolve **in-page**, and the fix is deliberately the smallest one that works:

| Kept | Changed |
|---|---|
| The ten labels, verbatim | The origin — `https://www.digiup.me/politica-de-privacidade/#x` → `#x` |
| The ten fragment names, exactly — including the source's own typo in `#de-que-forma-usamos-informacacao` | Nothing else |
| Every word of the policy, including the paragraph naming *Digiruptiva – Digital Agency, Lda.* as the data controller and `hello@digiup.me` as its contact | — |

Keeping the fragment names is what makes the change traceable to what it replaced. This is
**navigation mechanics only**; it does not answer D4's underlying question about whose
policy this document is. If the owners want the links to keep pointing at digiup.me, one
line of `scripts/build-legal.mjs` reverts it.

`npm run validate:legal` and `npm run validate:routes` both fail the build if any of the
ten stops resolving, or if a digiup.me navigation link ever returns.

---

## 9. Use at cutover

1. `scripts/verify-routes.mjs` (Phase 11) asserts every `preserve` entry returns 200 and every `redirect` lands where this map says.
2. The crawl diff (Phase 16) compares the live site against staging using this list.
3. Redirects are generated from this JSON, so the map and the behaviour cannot drift apart.
