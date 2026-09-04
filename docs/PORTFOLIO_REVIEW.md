# Portfolio & Navigation — Review C

> **⚠ Correction applied 2026-09-03 (Review E).** Two of the five archives documented
> below were rendering their masthead and **no project cards**: `Corporativo` and
> `Moda & Identidade` each hold one project, and the row cursor advanced for rows that
> could not fill, so the `overflow` clause always sliced from past the end of the list.
> Fixed, with a build-time guard that fails if any project does not reach the page.
> Counts are now 5 / 1 / 5 / 1 / 8 across the archives and 20 on the index.
> Filtering also no longer triggers a router navigation — `MOTION_REVIEW.md` §10.

**Date:** 2026-09-02 · **Routes:** `/portfolio/` · `/categoria-portfolio/{slug}/` · `/portfolio/{slug}/`
**Status:** built, **awaiting owner approval**
**Direction:** the approved Contact Sheet editorial system · **Produced with the `frontend-design` skill.**

> Project pages are **not** designed here. `/portfolio/{slug}/` exists as declared
> scaffolding so that nothing links into a void; Review D designs it.

---

## 1. The problem this page solves

On WordPress, `/portfolio/` is not a list of work. It is five category cards, each with a
`Saber Mais` button — so **seeing all twenty projects means visiting five separate
archives**. Yoast also lists an unreachable page id 36 for this URL while the CPT archive
actually serves it (audit §1.1). That is the organisation the owners said they dislike.

`/portfolio/` now has one meaning: **the complete catalogue, curated, on one page.**

---

## 2. Taxonomy — three options, and the evidence

The published assignments are preserved exactly; what changed is which of them is the
*primary browsing language*. The counts decide it:

| Category | Projects |
|---|---|
| Visual Storytelling | **8** |
| Ficção | **5** |
| Casamentos | **5** |
| Corporativo | **1** |
| Moda & Identidade | **1** |

### A — the existing five as the primary IA

**Rejected.** Two of the five filters return a single project. A browsing structure whose
primary control resolves to one result 40% of the time is not a structure; it is a list
with extra steps. It also inherits the descriptions problem: four of the five published
category descriptions describe a different category from their own heading (audit §9.3,
decision D3), so the labels cannot even be explained on the page.

### B — a simplified creative taxonomy

`ARCHITECTURE.md` §4.5a Proposal B: `Narrativa` · `Marcas` · `Pessoas`. It is derivable
from the existing assignments with no invention —

```
Narrativa ← Ficção + Visual Storytelling   13
Marcas    ← Corporativo + Moda & Identidade 2
Pessoas   ← Casamentos                      5
```

**Rejected, for now.** The mapping is arithmetically safe but editorially not: it makes
13 of 20 projects one bucket, which is *less* discriminating than what exists, and folding
`Visual Storytelling` — which holds music videos and lifestyle pieces — into `Narrativa`
asserts something about the work that the source data does not support. Grouping is a
claim, and this is the owners' claim to make.

### C — work-first ✅ **RECOMMENDED AND BUILT**

`Ver Tudo` is the page. The five published categories become a secondary filter over it,
with counts. Nothing is regrouped, nothing is renamed, nothing is invented.

It wins on the evidence rather than by preference:

1. **It fixes the actual complaint.** One page, twenty projects, no archive-hopping.
2. **The lopsided counts stop being a defect.** A one-project category is a perfectly good
   filter; it is only a bad top-level section.
3. **It costs nothing to change later.** Categories are data with `previousSlugs`; if the
   owners adopt Proposal B, the filter row re-renders from the content files and the old
   slugs redirect. Review C does not close the taxonomy question — it stops the taxonomy
   from blocking the browsing.

**Category descriptions are deliberately not shown**, in any option, until D3 is answered.

---

## 3. Page structure

```
MASTHEAD    h1 "Portfólio" · one published line · filters with counts
INDEX       20 projects, one composed sequence, cream throughout
              A  two frames 7fr/5fr        rows 1, 3, 7
              B  three frames, equal       rows 2, 5, 6, 9
              C  one frame, FULL-BLEED     rows 4 and 8 — the plates
CLOSE       the shared contact section, compact
```

**The portfolio never goes dark.** That is a system rule, not an omission: on this site
dark means *watching* and light means *reading*, and browsing twenty projects is reading.
Keeping the index entirely on the cream ground is what leaves Projection scarce enough to
still mean something on the homepage and on a project page. The two plates are the
cinematic moment here, and they earn it by breaking the container rather than the palette.

---

## 4. How all twenty are presented

A contact sheet is a **regular** grid — that regularity is the point. The hierarchy comes
from breaking it rarely, not from giving every frame a different size.

Row heights match exactly within a row, by the same relation the homepage uses:

```
equal height   ⟺   ratioₙ / ratioₘ  =  colₙ / colₘ
```

so no row can leave a hole, at any width, with no measurement and no JavaScript.

**Slots are assigned from the media, not from decoration.** Every project's still was
measured and placed where its own composition survives:

| Slot | Ratio | Gets |
|---|---|---|
| A1 | 1.778 | sources at 1.78–1.82 — essentially no crop |
| A2 | 1.270 | the **tallest** sources, including the one portrait asset |
| B | 1.5 | the mid-range |
| C plate | 2.4 | the two widest compositions in the catalogue |

Two consequences worth naming:

- **`Dormência 48h` sits in the one tall slot** because its published asset is a *film
  poster* — title lettering and a full credits block — not a frame. Any crop damages it;
  the tallest slot damages it least (**Q3**).
- **`Madrugada – Prince Mark`'s published asset is a black title card.** It is in a small
  slot for the same reason (**Q3**).

Curated order lives in `portfolioOrder` in the content files, so re-ordering the page is a
data edit. The order was arranged so the five weddings never sit adjacent and the six
projects that carry a preview loop are spread down the page.

**The sequence holds exactly twenty.** If a twenty-first project is added without a row to
put it in, the build throws with a message telling you to add a row — work cannot silently
fall off the end.

---

## 5. Filtering

**The filters are real links to real pages.** `Ver Tudo` → `/portfolio/`; each category →
its own preserved `/categoria-portfolio/{slug}/`. That is not a fallback bolted on for
no-JS: it is the design.

| With JavaScript | Without |
|---|---|
| The click is intercepted, the catalogue already in the document is filtered instantly, and the route is pushed into history | The link navigates to a page that renders exactly the same view |

- **Instant, and never animated.** A filter that plays an animation before you can read the
  result is slower than one that does not. The only motion is a short opacity settle.
- **No reflow risk.** `Todos` is the composed sequence; a filter drops to a plain
  three-across contact sheet. `display: contents` dissolves the rows so the surviving cards
  flow into one grid — a filtered view can never leave a half-empty row.
- **Back and Forward work**, because the URL is the state and nothing else stores it.
- **Announced**: a visually hidden live region reports `Ficção: 5` on change.
- **Keyboard**: they are links, so they already are.
- **In-place filtering only where the whole catalogue is present** — `/portfolio/`. On a
  category archive the other projects are not in the document, so the links navigate. That
  is correct behaviour, not a degradation.

---

## 6. URL strategy — and why not query parameters

| | |
|---|---|
| **Canonical index** | `/portfolio/` — self-canonical, in the sitemap, all 20 projects linked in the served HTML |
| **Filtered views** | `/categoria-portfolio/{slug}/` — the five URLs WordPress already publishes |
| **Query parameters** | **not used** |

Query parameters would have meant inventing a second address for a view that already has
one, then canonicalising it away. Using the preserved URLs instead means the filter control
is crawlable, the legacy URLs stop being vestigial, and there is no parameter surface for a
crawler to multiply.

The five archives are **`noindex, follow` and excluded from the sitemap**. Each is a subset
of `/portfolio/`, so it should not compete with it — but each returns 200, keeps its
inbound links alive, and now has the `<h1>` and the canonical it has never had
(audit §9.18). That is strictly better than their current state and creates no duplication.

---

## 7. Legacy URL treatment

| URL | Before | Now |
|---|---|---|
| `/portfolio/` | CPT archive of five category cards; sitemap points at an unreachable page 36 | One canonical page: the whole catalogue |
| `/categoria-portfolio/{slug}/` ×5 | 200, no `<h1>`, no canonical, in no sitemap | 200, own `<h1>`, canonical, `noindex, follow`, still out of the sitemap |
| `/portfolio/{slug}/` ×20 | 20 project pages | All 20 emitted — **including `dont-let-it-fool-you`** (§8) |
| `/blog` | 404, linked from all 20 project pages as `Ver Tudo` | Redirect to `/portfolio/` is recorded in `routes.json` (decision **D5**); redirects ship in Phase 11 |

Sitemap now: `/`, `/portfolio/`, and the 20 project pages. 22 URLs, no archives, no
concepts.

---

## 8. The project with no film

`dont-let-it-fool-you` has no watchable source. The live page's video widget stores
`https://studio.youtube.com/video/e6aK4vEn420/edit` — a YouTube **Studio edit** URL, not a
video URL, and that id is already published at `/portfolio/ana-e-filipe-metro/`
(decision **D6**).

The schema requires every project to be watchable, and that guardrail was not loosened to
make a count work. A new field was added instead:

```ts
filmUnavailable: z.string().min(1).optional()
```

A project may have no film **only if it says why**. Forgetting a film still fails the
build; declaring a broken source is a conscious act that names the open decision. The card
shows `Sem vídeo publicado` — a statement about the source, making no claim about the work
— and offers no film link.

**Nothing was guessed.** Using the id from the edit URL would have silently resolved D6 by
declaring the two entries duplicates, which is the owners' call.

---

## 9. Project cards

One card is **one link** to the project's own route: frame, title and metadata inside a
single `<a>`. One tab stop per project, an accessible name that already reads
"title, category, date", and no JavaScript-only clickable region.

Metadata is title · category · date, from the published page. No client (the source data
does not carry one), no technical fields, no counts on the card.

**The click-to-open overlay from Review B is retired.** It existed only because project
routes did not, and it was always documented as a transition rather than a destination.
Now that `/portfolio/{slug}/` resolves, a tap goes to the project — Review C's rule, and
one fewer step between someone and the work. This is the one change Review C makes to the
approved homepage; it is behavioural only, and the homepage is otherwise pixel-identical
(§13).

**Hover preview** — desktop pointers only (`hover: hover and pointer: fine`), source
attached on `pointerenter`, never fetched on load, never registered at all on touch.
Six of twenty projects have a loop, from HIGH-confidence Smash matches only. The other
fourteen are intentionally static: a still that never moves is a designed state, not a
missing feature.

---

## 10. Navigation

Reviewed, not redesigned. What changed, and only because Review C required it:

- **`portfolio` joined `BUILT_PAGES`**, so every `Portfólio` link across the site now
  points at the real route instead of the homepage's `#trabalho` section. The homepage's
  `Consultar Portfólio` CTA follows automatically.
- **Page-level active state.** A link to a route that exists is `aria-current="page"` when
  you are on it *or inside it* — a project page marks `Portfólio` as current. The
  scroll-driven section state now only touches links that point at a section, so it can no
  longer blank a page-level marker.

Unchanged and re-verified on both pages: fixed header · the declared media/cream/dark
contrast system · the four-colour stripe on the current item · the full-screen mobile menu
with `aria-expanded`, focus move, Escape, focus return and scroll lock · 44px+ targets.

**No mega-menu.** Four destinations do not need one.

### Language switch — recommendation: keep it hidden

The switcher renders only when a second locale has content, and English has none. A
disabled or "coming soon" control would advertise something that does not exist and invite
a click that goes nowhere — which is the exact failure the current site ships (audit §9.1).
The component and the routes are built; enabling `en` in `ENABLED_LOCALES` renders it.

---

## 11. Mobile

- **Filters are one horizontally scrolling line** (865 px of content in a 375 px viewport),
  edge-to-edge so the last one is never clipped mid-word, with scroll snapping. Not a
  dropdown: a dropdown hides the categories and their counts, which are the orientation.
- **48 px filter targets**, cards are full-width links.
- Every frame drops to a uniform 3:2 — asymmetric desktop compositions are not forced into
  a single column, they are replaced.
- The written `Ver projeto` cue is hidden below the widest layout so a caption never takes
  a second line; the card is the link regardless.
- **No hover assets are fetched on touch at all** — verified: 0 of 6 loops requested.
- Stills are served from a real srcset (560 / 960 / 1400), so a phone never downloads the
  1400 px file.
- No horizontal overflow at 375, 768, 1440 or 1920.

---

## 12. Performance

Measured on the built output.

| `/portfolio/` first load | Over the wire |
|---|---|
| Document, including the page's own inlined CSS | **5.1 KB** |
| Shared CSS (2 files) | **5.3 KB** |
| JS — ClientRouter + site runtime + Lenis | **13.7 KB** |
| Fonts — six subsetted faces | **83.3 KB** |
| **Code + fonts** | **107 KB** |
| Above-the-fold stills (2) | **41 KB** |
| **First screen total** | **≈148 KB** |

Then, as you scroll: **393 KB** of lazy stills on desktop, **195 KB** on mobile (the srcset
picks the 560 px file). Hover loops total 1.41 MB but are fetched one at a time, on intent,
on desktop only — **zero video bytes on first load, and zero ever on touch.**

Portfolio CSS is inlined into the portfolio routes only; the homepage does not carry it.
Every image ships `width`/`height` and every frame reserves its box with `aspect-ratio`, so
there is no layout shift. **No third-party requests on any route.**

---

## 13. Verification

```
astro check     0 errors, 0 warnings (44 files)
astro build     32 pages, 0 errors
validate:data   8 ok, 4 warnings, 0 errors
```

| Checked | Result |
|---|---|
| Row heights | exact match in every row at 375 / 768 / 1440 / 1920 |
| Horizontal overflow | none at any width |
| Filtering | 20 → 5, URL pushes to the archive route, Back restores, `aria-current` moves, live region announces |
| Filtered layout | all frames equal — needed a fix, §14 |
| Category routes | 5 pages, own `<h1>`, `noindex, follow`, correct subsets |
| Project routes | 20 pages, canonical, `VideoObject` where a film and still exist |
| Header contrast | 20 media zones, **0 px** wrong across 4 758 px of scroll, 1 theme transition |
| Keyboard | 36 tab stops, one per project, reading order |
| Motion tiers | `reduced` and `minimal` both remove preview video from the box tree |
| Hover previews | 0 loaded on page load; exactly 1 on `pointerenter`; 0 on touch |
| Sitemap | 22 URLs — index + 20 projects; no archives, no concepts |
| **Homepage regression** | rows, hero, sections, payload unchanged; 7 cards and the feature now link to real project routes |

### 14. Three defects found and fixed while building

1. **Filtered frames did not equalise.** The card carries its ratios as *inline* custom
   properties, and an inline value always beats a stylesheet rule — so the filtered view's
   uniform ratio never applied. The frame now reads its ratio through an indirection
   (`--ar-use`), which is what lets a context override it.
2. **The live region announced `: 5`.** The label lookup took the first `<span>` in the
   filter, which is the category colour dot. It reads the named element now.
3. **`helder-praia` had a hover loop built but never attached** — it was in the "already
   migrated" set, so the migration script left its media fields alone. Six of six loops are
   wired now.

---

## 15. Open questions for Review D

| # | Question | Why it matters |
|---|---|---|
| **Q1** | **Is work-first with the existing five as filters right**, or do you want the `Narrativa / Marcas / Pessoas` regrouping (§2 B)? Regrouping is a claim about the work and it is yours to make | Decides R5 |
| **Q2** | **D3 — the category descriptions.** Four of five describe the wrong category. Until corrected copy exists the filters carry names and counts only | Blocks category landing copy |
| **Q3** | **`Dormência 48h` and `Madrugada – Prince Mark` publish a poster and a title card, not frames.** Can you supply stills? Both are placed to minimise the damage, but neither reads as a frame on a contact sheet | Affects two of twenty cards |
| **Q4** | **D6 — `dont-let-it-fool-you`.** Duplicate of `ana-e-filipe-metro`, or a missing film? It currently shows `Sem vídeo publicado` | The only project without a film |
| **Q5** | **Only 6 of 20 have a hover loop.** Should we cut loops for more projects from the material we hold, or is a mostly-static index correct? | Request M1 again |
| **Q6** | **Two plates in twenty** — the right frequency, and are `Yves Saint Laurent` and `Antiqvvm` the right two? | The only hierarchy break on the page |
| **Q7** | **D5 — `/blog` → `/portfolio/`.** Still marked *assumed*. It is linked from all 20 project pages as `Ver Tudo` | Blocks the redirect map |
| **Q8** | **Retiring the click-to-open overlay** — confirm. A card now navigates straight to the project (§9) | Changes homepage behaviour |
| **Q9** | Should the portfolio carry **collections** ("Showreel 2026", a festival selection) as a second axis later? The model supports it; nothing uses it yet | Decision R8 |

---

## 16. Where things live

| | |
|---|---|
| Index route | `src/pages/portfolio/index.astro` |
| Legacy archives | `src/pages/categoria-portfolio/[slug].astro` |
| Project scaffolding | `src/pages/portfolio/[slug].astro` — **Review D replaces this** |
| Composition + copy | `src/lib/portfolio.ts` |
| Index component | `src/components/portfolio/PortfolioIndex.astro` |
| Card | `src/components/site/ProjectCard.astro` — shared with the homepage |
| Filter runtime | `src/lib/portfolio-filter.ts` |
| Styles | `src/styles/portfolio.css` |
| Order | `portfolioOrder` in `src/content/projects/*.mdx` |
| Media | `scripts/build-review-media.mjs` → `src/data/review-media.json` (`npm run review:media`) |
