# Homepage — Review B

**Date:** 2026-09-02 · **Route:** `/` · **Status:** ✅ **APPROVED**
(direction approved on the visual review; four targeted fixes applied afterwards — §15)
**Direction:** the approved Contact Sheet editorial system + Projection cinematic mode
**Produced with the `frontend-design` skill.**

> This is the real Portuguese homepage route, not another concept page.
>
> **Review B is closed.** The direction was approved on visual review, and the four fixes
> the review asked for are applied and verified (§15). The homepage is still not
> propagated anywhere else — that is Phase 9, after Reviews C, D and E.

---

## 1. What changed from Review A

Five pieces of feedback drove this build.

| # | Feedback | What was done |
|---|---|---|
| 1 | Navigation is hard to read over some media | A **declared** header theme system — §5 |
| 2 | The ground switches too often | **Three changes** before the close, not seven — §2 |
| 3 | The homepage is not the whole portfolio | **8 curated projects**, chosen and argued — §4 |
| 4 | `We are NVF` is not necessarily the hero | Three showreels compared frame by frame — §3 |
| 5 | Distinguish designed space from grid voids | Rows are **complete by construction** — §7 |

Four more came from the real-browser visual review that approved the direction. They are
recorded in §15.

---

## 2. Structure and the cream/dark rhythm

```
A  HERO              dark     full-bleed film · restrained branding · statement at caption weight
                     ─────────────────────────────────────────────── change 1
B  WORK, part 1      cream    published intro copy, then four frames in two rows
                     ─────────────────────────────────────────────── change 2
C  CINEMATIC FEATURE dark     one project at scale — the Projection moment
                     ─────────────────────────────────────────────── change 3
D  WORK, part 2      cream    three frames + the route to the full portfolio
E  SERVICES          cream    the four real services, as an index
F  ABOUT             cream    three published lines and the two real names
                     ─────────────────────────────────────────────── change 4
G  CLOSE + FOOTER    dark     contact route, real phone numbers, socials
```

**Four grounds, four changes.** Review A had seven. The dark ground now means one of two
things and nothing else: *the film is the whole screen* (hero, feature) or *the page has
finished* (close). Editorial browsing is always cream. That is what makes the Projection
moments feel like moments.

Sections B, D, E and F are separate `<section>` elements on the same cream ground, so the
reader sees one continuous editorial run, not four.

---

## 3. Hero source — compared, chosen, still provisional

Three candidates were extracted frame by frame from the owners' own media
(`Smash/`, read-only) before choosing.

| Candidate | Duration | Resolution / bitrate | What the frames actually show | Verdict |
|---|---|---|---|---|
| `We are NVF.mp4` | 20.1 s | 720p · 1 376 k | An animated **“We are NVF” wordmark burned into almost every frame**, a burned-in colour-block strip along the lower third, and a five-second black **“Coming soon”** tail | **Rejected.** Its own type would collide with ours, and a fifth of the loop is a dead card |
| `NVF showreel 2026.mp4` | 55.2 s | 720p · 1 237 k | A motion-graphics promo: full-bleed yellow fields, large serif lettering, `NEXT VISION FILMS`, `REAL PEOPLE, REAL MOMENTS`, a URL. Almost no clean footage | **Rejected as a hero.** It is a finished piece of communication, not material to build on — and its yellow/serif identity is a different design language from this one (see Q1) |
| `NVF Showreel.mp4` | 189.1 s | 720p · 1 130 k | Title cards and windowed/letterboxed montage for most of its length — **except 71–86 s**, which is a sustained run of clean, full-frame, caption-free golden-hour footage | **Chosen** |

**In use:** `NVF Showreel.mp4` @ **71 s + 15 s**, silent, two renditions (1280w 1.60 MB,
720w 0.59 MB). Full frame at that timecode — confirmed with `cropdetect`.

**Why this passage.** It is the only run in the material we hold that satisfies all five
tests at once: it opens on a wide, legible frame; the framing is full-bleed with no
letterbox; there is no burned-in text anywhere in it; the exposure holds the header and the
statement (measured, §5); and it loops without a visible cut.

> **PROVISIONAL.** This is a prototype derivative of a 720p web export. At 1920 px it is
> visibly soft. The hero is only as good as the master, and 19 of 20 projects are still
> `MASTER_REQUIRED` — this stays open until the owners answer **N7 / M7** and supply
> masters (**M1**).

**No sound control is rendered.** Every prototype loop is encoded with `-an`, and a control
that controls nothing is worse than no control. The markup and the strings exist; the
control appears the moment a hero with audio does (decision N8 / R13).

---

## 4. The eight curated projects

Chosen against four criteria, in this order: **available media quality**, **category
range**, **compositional diversity**, **tonal range**. Every one is a real published
project. Nothing here is ranked, and no project is described as best, award-winning or
featured *by merit* — the one that is enlarged is enlarged because it is the only clean
footage we hold at that scale.

| # | Project | Category | Media state | Why it is on the page |
|---|---|---|---|---|
| 1 | **Yves Saint Laurent** (`helder-museu`) | Moda & Identidade | still | The only fashion project. A baroque interior with a figure laid across a table — the most editorial composition in the catalogue, and the widest tonal departure from the beach work |
| 2 | **Words of our story** (`leonor`) | Visual Storytelling | still + loop | The cleanest, brightest footage NVF holds locally: no letterbox, no burned-in line in the chosen window. Carries the longest published tagline, which the viewer needs |
| 3 | **Lost Lines Trailer** | Ficção | still | The only cool-toned frame in the set — a green macro. Placed as the tall lead of the second row precisely because the rest of the page is warm |
| 4 | **Antiqvvm** (`nvf-vs-antiqvvm`) | Corporativo | still + loop | The only corporate project, and the only craft/product register: overhead plating at close range. Proves the range beyond people and landscape |
| 5 | **The endless “WAVES”** (`helder-praia`) | Visual Storytelling | **feature** — loop | §4.1 |
| 6 | **Epitáfio** | Ficção | still | Low-key portrait, near-black. The only frame that reads as drama rather than lifestyle, and it is the pilot content entry that proved the schema |
| 7 | **Marta&Charles** | Casamentos | still | Weddings are five of twenty projects and would dominate on thumbnails alone. One is on the page, and it is the one with a specifically Portuguese frame — a kiss against azulejos |
| 8 | **Don’t Let It Fool You** (`ana-e-filipe-metro`) | Visual Storytelling | still | The only urban interior. Night, a metro carriage, foreground blur — visually unlike everything else here |

**Coverage:** all five published categories. **Weddings: 1 of 8.** Four registers —
interior, portrait, landscape, still-life. Three projects carry motion; five are stills,
which is honest about the material.

### 4.1 The cinematic feature

**`The endless “WAVES”`.** Chosen on media quality, not on merit: at 1 648 kbps it is
among the highest-bitrate clean files we hold (**corrected in Review D** — the figure here
originally read 1 779 kbps and claimed the top spot; measured directly, `leonor` is higher
at 2 037 kbps), it carries no client branding, and 25–31 s is its only
run free of both burned-in captions and the film's own viewfinder overlay. The crop removes
that overlay and the rounded corners, so nothing on screen can be mistaken for our
interface. Its published tagline is long and good, which the Projection register needs.

### 4.2 Two projects deliberately left off

- **`nvf-vs-filmin-details`** is the only 1080p / 14 Mbps file in the archive and was the
  obvious hero-quality candidate. It is a **client advert with a permanent FILMIN logo bug
  in the top-left of every frame** and a green-screen client card at the end. Putting it on
  the homepage would put another company's mark on NVF's front page. It stays in the
  portfolio.
- **`Dormência 48h`**'s published poster is a **designed film poster** — title lettering
  plus a full credits block — not a frame from the film. On a contact sheet of frames it
  reads as a different kind of object, and the credit type is illegible at grid size
  (**Q4**).

### 4.3 How to re-curate

`homepageOrder` in the project's content file. The layout is keyed by **position**, not by
slug, so changing the numbers reflows the page and touches no code.

---

## 5. Header contrast

Solved in two passes. The first pass was not enough, and the reason is worth recording.

### 5.1 What the first pass got wrong

Sections declared the theme: *this section is cream, so the header takes dark ink.* That
is true of a section's **ground** and false of its **content** — a cream editorial section
is full of project photographs, and when one of those passes behind the header the section
still says "cream" while the ink is sitting on an image.

Measured, the stills are far brighter than the hero: their top bands average up to
**Y′ = 213** and peak at **249**, where the hero band peaks at 179. The header was
rendering `#292929` at **2.64:1** over them.

A sweep of every scroll position on the page put a number on it: the section-only rule was
wrong across **2 376 px of scroll — 45% of the page**, in five ranges, every one of them
inside the project grid. Exactly what the visual review reported.

### 5.2 What it does now

**Media declares itself.** Anything that can pass behind the header and is not a flat
ground carries `data-header-zone` — the hero media, every project frame, the feature
frame. The resolver tests those rectangles against the header's own text row.

**One probe, at the text row.** Every piece of header text sits on one line, so one probe
answers it for all of them. Probing the text row rather than a point higher up is also
what stops the theme flipping before the header has crossed into the new ground: the ink
changes when the boundary passes the letters, not before.

```
media behind the text row              → light ink + backdrop
else, the section behind the text row  → cream (dark ink) or dark (light ink)
menu open, or viewer open              → dark
```

**Hysteresis, so it cannot strobe.** Two rows of photographs are separated by ~96 px of
captions. Without a dwell the header would flip dark→light→dark on the way past, and a
cross-fade caught halfway is a mid-grey that reads on neither ground. Once the header is
in its film state it holds until the text row has been clear for a header's height. The
whole work grid is therefore one continuous state instead of four. Theme changes across
the page: **12 → 9**.

**The ink crosses fast, the backdrop follows.** Ink transitions in 180 ms so it spends
almost no time in between; the scrim takes 320 ms, because a scrim can only ever add
contrast.

**Cached geometry, so fast scrolling cannot fall behind.** Section and zone bands are
measured into document space and re-measured on resize, on load, when web fonts settle,
and through a `ResizeObserver` on the body — anything that can change the document's
height. A scroll frame does no layout reads at all.

### 5.3 The numbers

| Behind the header text | Ink | Backdrop | Measured |
|---|---|---|---|
| Editorial ground | ink `#292929` | **none** | **12.09:1** |
| Cinematic ground | cream `#f0ead6` | **none** | **16.25:1** |
| Media — brightest still pixel on the page (249) | cream | scrim | **5.76:1** |
| Media — over the cream ground (the mixed-crossing case) | cream | scrim | **6.27:1** |

The scrim now holds **0.64 alpha at the text row** rather than 0.42, and it is still a
grade rather than a bar: no edge, no border, nothing left by the bottom of it. The alpha
is set against the brightest pixel that actually appears behind the header on this page,
not against white — nothing on this page is white.

**Verified by sweeping every scroll position at 2 px steps against a strict truth test**
(*is media actually behind the letters?*): **0 px** where the header resolves to anything
but the media state while a photograph is behind its text. The old rule: 2 376 px.

## 6. Copy — every string, and where it came from

Nothing was written, shortened, corrected or translated. Source oddities are preserved
deliberately: the double space in `roadtrips,  trilhos`, the space before the full stop in
the services lead, the `&Direção` spacing in a team role.

| On the homepage | Verbatim from |
|---|---|
| `Captamos emoções` / `Contamos Histórias` | `/` (two `<h2>`s) |
| `Fica a Conhecer o` / `Nosso Trabalho` | `/` |
| `O vídeo não é apenas imagem em movimento…` · `Cada projeto que fazemos…` | `/` |
| `Consultar Portfólio` | `/` (button) |
| `Queremos ouvir a tua história…` · `Vamos Criar Juntos?` | `/` |
| `copyright {year} © todos os direitos reservados` | `/` (footer) — only the year is substituted |
| `Serviços` + the first sentence of the lead + the four service names + one published sentence each | `/servicos/` |
| `Sobre Nós` · `De uma ideia a um movimento.` · one supporting line · both team names and roles | `/sobre/` |
| `Pronto para transformar a tua visão em imagens?` · the two phone numbers · `*custo para chamada móvel nacional.` | `/contactos/` |
| Every project title, tagline, category and date | that project's own page |

**Two placements need owner approval**, because moving existing copy to a new position is a
design decision even when the words are untouched:

1. `Captamos emoções / Contamos Histórias` becomes the page's **single `<h1>`**. The live
   homepage sets these words as two `<h2>`s and has **no `<h1>` at all**. Adding the
   heading changes no words and fixes audit §8.9.
2. `Pronto para transformar a tua visão em imagens?` is lifted from `/contactos/` to head
   the homepage's closing section — where the paragraph beneath it already lives.

**Authored UI strings** (new, and marked `[new]` in `src/i18n/pt.ts`): `Abrir`,
`Ver projeto`, `Continuar`, `Fechar`, `Menu`. Everything else is the site's own.

**No email address is printed anywhere.** The live `/contactos/` displays
`nextvisionfilmsagency@gmail.com` and links `hello@nextvisionfilms.com` on the same
element. Until **D2** is answered, the close carries a `Contactos` route instead of a guess,
and `Organization.email` is omitted from the structured data.

---

## 7. Composition — why there are no accidental voids

Frames in a row are **exactly the same height at every viewport width**, because their
aspect ratios are chosen against their column widths:

```
equal height   ⟺   ratioₙ / ratioₘ  =  colₙ / colₘ
```

With `7fr 5fr` and one gap, both tracks scale from the same remainder, so the relation holds
exactly — no subgrid, no measurement, no JavaScript.

| Row | Columns | Ratios | Effect |
|---|---|---|---|
| 1 | `7fr 5fr` | 1.778 / 1.270 | Landscape lead |
| 2 | `5fr 7fr` | 0.833 / 1.166 | Portrait lead — the tallest row on the page |
| 3 | `4fr 4fr 4fr` | 1 / 1 / 1 | Three squares — the most contact-sheet moment |

Two consequences: a row **cannot** leave a hole, and a row is only rendered if it can be
filled completely. Rows 1–2 take four projects, row 3 takes three, and the feature takes
one — eight, with nothing left over.

The empty space that remains is deliberate: the intro's right column, the margin beside the
About team block, and the sticky services lead. Each is a column of a two-column spread with
a known job, not a gap the grid produced.

At two columns (≥34 rem) the ratios flatten to one per row so the heights still match, and
the three-up row widens its last frame across both columns. At one column each frame takes
a ratio chosen for its own picture.

---

## 8. Sections in detail

**Services** — an index, not five cards. The published lead sits sticky on the left; the
four real services are a ruled list on the right, name in condensed display and **one
published sentence each**. Both the lead and the descriptions are *selections*, never
rewrites: the shown lead is the first published sentence of the full one, and each
description shows the single published sentence that describes the service. The build
fails if any of them stops being a literal substring of its own source (§15).

> The five portfolio categories are **not** used here. Taxonomy and services are different
> lists, and turning one into the other would invent an offer the company does not publish.

**About** — the published heading, **one** supporting sentence, and the two real names with
their real roles. The origin story is kept in the data for the About page and is
deliberately not on the homepage.

**Portfolio interaction** — every frame is a real `<a>` to the project route. JavaScript
intercepts a plain left-click and opens the frame into the dark room; a modified click, a
middle-click or no JavaScript at all follows the link. The viewer is a **transition, not a
lightbox**: its bar always carries an action that leaves it. Project pages are Review D, so
that action is currently `Ver o filme` → the film on YouTube. When project routes ship, one
constant (`PROJECT_PAGES_BUILT`) sends it to `/portfolio/{slug}/` and relabels it
`Ver projeto`, everywhere at once.

The frame's affordance (`Abrir`) is in the **caption**, not on the photograph — always
present for touch and keyboard, always legible against a known ground, and it leaves seven
photographs unobscured by seven identical chips.

**Navigation** — `Portfólio · Sobre · Serviços · Contactos`, emitted **once** and restyled
by CSS (the live site emits it twice, giving 20 tab stops for 4 destinations). Those four
pages do not exist yet, so each link resolves to its section on this page and switches to
the real route automatically when the page ships (`src/lib/nav.ts`). **The language switch
does not render**: it appears only when a second locale has content, which is the rule that
stops us shipping the empty English site the current one has.

---

## 9. Motion

| Moment | Treatment |
|---|---|
| Loader | Four stripe bars wipe, then lift. Capped at 1.1 s, skipped for the rest of the session, skipped entirely below the `full` tier |
| Hero entry | The film plays immediately; the statement and metadata rise once, staggered 120/260 ms. **Armed and disarmed** — if the frame callback never arrives the entrance is skipped rather than leaving the statement invisible |
| Scroll | Lenis at `lerp: 0.09`, `full` tier only, never on touch |
| Ground change | 600 ms cross-fade of background and colour |
| Header theme | Ink and backdrop cross-fade over the same 600 ms |
| Scroll progress | The four brand colours fill in sequence |
| Editorial reveals | Fade and rise, fail-safe: visible unless JS has armed the system *and* proved the observer fires |
| Feature loop | Plays when it enters the viewport, pauses when it leaves. Never hover-gated |
| Frame → viewer | Scale 0.94 → 1 with a fade. `transform` and `opacity` only |

**No GSAP.** Nothing here needs timeline choreography: the ground swap is a CSS transition
on an attribute, the viewer is two properties on one element, the header theme is a
custom-property swap. 45 KB for that would be indefensible. **Lenis stays** — 18.7 KB, and
it is what makes the long editorial scroll feel deliberate.

**Tiers** (`ARCHITECTURE.md` §16.7), verified by inspection:

| Tier | Durations | Autoplay video | Lenis | Loader |
|---|---|---|---|---|
| `full` | 320 / 600 ms | yes | yes | yes |
| `reduced` | 0 ms | **no — poster only** | no | no |
| `minimal` | 0 ms | **no — element removed** | no | no |

The stripe keeps **three** uses on this page — loader, scroll progress, current nav item.
The filter state returns on the portfolio page. It appears nowhere else.

---

## 10. Mobile

Built at 375 px first, not scaled down.

- **Hero** stays 100 svh; the statement is ~17 px and never becomes a giant unusable word.
- **Ratios differ from desktop** — each frame takes a ratio chosen for its own picture
  rather than for a row it is no longer in.
- **Navigation** is a full-screen dark overlay: `aria-expanded` toggles, the label swaps
  `Menu` ⇄ `Fechar`, focus moves to the first link, Escape closes and returns focus to the
  toggle, body scroll locks, and the header forces its dark theme underneath.
- **Tap targets** — nav links 56 px, controls ≥ 44 px, the caption affordance stays inline
  so it never wraps onto a line of its own.
- **Bandwidth** — the hero loads the 720w rendition (0.59 MB, not 1.60), the feature loads
  its own 720w rendition, and hover loops are never fetched on touch at all.
- **Nothing is hover-only.** The loop plays in the viewer on tap.
- Zero horizontal overflow at 375, 768, 1440 and 1920.

---

## 11. Payload

Measured on the built output.

| First load, desktop | Raw | Over the wire |
|---|---|---|
| Document | 21.7 KB | 5.0 KB |
| CSS (global + page) | 23.6 KB | 5.4 KB |
| JS (ClientRouter + page runtime + Lenis) | 42.7 KB | 13.8 KB |
| Fonts — six subsetted WOFF2 | 85.3 KB | 85.3 KB |
| Hero poster | 15.0 KB | 15.0 KB |
| **Before the film** | **188 KB** | **≈124 KB** |
| Hero film, desktop rendition | 1.60 MB | |
| Hero film, mobile rendition | 0.59 MB | |

Below the fold and lazy: eight stills, **399 KB total**. Fetched on intent only: the feature
loop (0.70 MB desktop / 0.31 MB mobile, when it scrolls into view) and two hover loops
(0.52 MB, desktop pointer only). **Zero third-party requests** — no font CDN, no analytics,
no YouTube contact until a link is followed. Every image and video ships explicit
`width`/`height` and every frame reserves its box with `aspect-ratio`, so there is no
layout shift.

JS + CSS is **66 KB raw / 19 KB compressed**, against the plan's 100 KB budget.

---

## 12. Verification

```
astro check       0 errors, 0 warnings          (38 files)
astro build       6 pages, 0 errors
validate:data     0 errors
```

| Checked | Result |
|---|---|
| Horizontal overflow | none at 375 / 768 / 1440 / 1920 |
| Row heights | exact match in every row at every width |
| Header contrast | 12.09 · 16.25 · 8.16 (worst frame) |
| Secondary text | **5.30:1** on cream, **8.60:1** on dark — the 62% alpha inherited from Review A measured 3.98:1 and was raised to 72% |
| Focus ring | oxblood 6.64:1 on cream, gold 10.16:1 on dark — it follows the ground, or it disappears |
| Headings | exactly one `<h1>`, no gaps, no empty headings |
| Landmarks | one header / nav / main / footer |
| Keyboard | 24 tab stops in reading order; viewer opens, traps, Escape closes, focus returns |
| Media | 9 of 9 images decode; no broken keys |
| Concept-only components | **none** — `/` shares no component or stylesheet with `/__concepts/*`, and the concept switcher does not appear |
| Runtime errors | none |

**Three real defects were found and fixed during this session**, worth recording because
each would have shipped:

1. **The menu toggle did nothing.** `astro:page-load` fires on the *first* load as well as
   after client-side navigation, so `initSite()` ran twice and registered two click
   handlers — which opened and immediately closed the menu. Both layouts now tear down
   before every start. **The same bug was live in `ConceptLayout` and is fixed there too.**
2. **The hero statement could be hidden permanently.** The entrance was gated on a nested
   `requestAnimationFrame`. Where rAF never delivers a second frame, the statement stayed
   at `opacity: 0`. It is now armed and disarmed the same way the reveals are.
3. **The `reduced` tier still autoplayed video**, against `ARCHITECTURE.md` §16.7. Hero,
   feature and viewer loops are now `full`-tier only, and the elements are removed from the
   box tree below it.

Also fixed: the section list included the shell element itself (a written value being read
back); the tablet column-span rule out-specified its desktop override, leaving one frame
double-width at 1440; and the media seam preferred an unprovisioned R2 key over the
prototype file, rendering one still as a dead URL.

**Not verifiable in this environment.** The preview pane does not run
`requestAnimationFrame`, does not fire `IntersectionObserver`, and does not advance CSS
transitions — confirmed directly (`rafRuns: false`). Geometry, contrast, focus, keyboard,
DOM state and payload were all measured; **scroll feel, the ground cross-fade, the loader,
hover previews and the viewer's opening animation must be judged in a real browser**, ideally
on a phone. Phase 5's requirement of a real mid-range Android pass still stands.

---

## 13. Open questions for Review C

| # | Question | Why it matters |
|---|---|---|
| **Q1** | `NVF showreel 2026` uses a **yellow-and-serif visual identity** that is nothing like this site's. Is that a brand direction in progress? If so, this design should be reconciled with it before Tatiana starts | It may make the whole palette question moot |
| **Q2** | Is the ground rhythm right at **four changes**, or should the dark feature go too? | The single largest remaining structural choice |
| **Q3** | Is the curated **eight** the right eight — and is one wedding too few for a company where weddings are a quarter of the catalogue? | §4 |
| **Q4** | `Dormência 48h` publishes a designed poster rather than a frame. Are there frames from it, and should posters and frames ever mix in one grid? | Affects the portfolio page far more than this one |
| **Q5** | Two copy placements need approval: the hero statement as the `<h1>`, and the `/contactos/` heading used to open the homepage close | §6 |
| **Q6** | The affordance says `Abrir` because tapping a frame opens a preview. When project pages exist it becomes `Ver projeto`. Should tapping instead go **straight** to the project page, with no viewer? | Changes the signature interaction |
| **Q7** | **D2 — the canonical email.** Until it is answered no address appears anywhere on the site | Blocks the contact page as well as this one |
| **Q8** | **N7 / M7 / M1 — the hero master.** Which showreel is current, and can masters be supplied? | The hero's ceiling is set by the media, not the design |
| **Q9** | Should the homepage carry the **testimonials** and the **newsletter** block the live homepage has? Both were left out to keep text density low (D11 is also open on testimonials) | §2 |
| **Q10** | Typography: does Barlow / Barlow Condensed / Space Mono hold at this scale, with the display step capped at 3.25 rem? | N6 |

---

## 14. Where things live

| | |
|---|---|
| Route | `src/pages/index.astro` |
| Shell, head, chrome | `src/layouts/BaseLayout.astro` · `src/components/site/` |
| Composition + copy | `src/lib/homepage.ts` |
| Content ↔ layout bridge | `src/lib/curated.ts` |
| Motion runtime | `src/lib/site-motion.ts` |
| Styles | `src/styles/site.css` + `tokens.*.css` |
| Route gating | `src/lib/nav.ts` |
| Curated projects | `src/content/projects/*.mdx` (`homepageOrder`) |
| Prototype media | `scripts/build-homepage-media.mjs` → `public/__generated/home/` (gitignored), described by `src/data/homepage-media.json` (committed) |

Regenerate the media with `npm run home:media`. Phase 3 deletes
`src/data/homepage-media.json`, `media-sync.mjs` writes the same keys into
`media-manifest.json` with `storage: 'r2'`, and **nothing that renders has to change**.

---

## 15. Review B — the final refinement pass

Four fixes asked for on the visual review that approved the direction. Nothing else
changed: same projects, same hero, same feature, same palette, same typography, same
stripe restraint, same grid rhythm.

### 15.1 Header contrast — rebuilt, and proved

Recorded in full in §5. Short version: sections cannot describe what is behind a header,
because a cream section is full of photographs. Media now declares itself, the probe is
the header's own text row, and hysteresis stops it strobing between rows of frames.

**2 376 px of scroll → 0 px.** Swept every scroll position at 2 px steps.

### 15.2 The void before Services — cause and correction

Not padding in general. The cause was specific and measurable: **two adjacent sections
each paid a full `--section-pad` at a seam where the ground does not change** — 118.4 px
bottom plus 118.4 px top for one boundary — and the portfolio CTA added a further 64 px
margin above itself. 345 px between the last frame and the Services eyebrow.

The rule now: **where the ground changes, both sides pay — that break is the composed
moment and it is untouched. Where the ground does not change, the seam is paid once.**

| Boundary | Before | After |
|---|---|---|
| Last work frame → Services eyebrow | 345 px | **172 px** |
| Portfolio CTA → Services eyebrow | 237 px | **96 px** |
| Services → Sobre | 237 px | **96 px** |
| Sobre → Contacto (**ground changes**) | 173 px | **173 px** — unchanged |

Section padding itself was not reduced, so nothing else on the page became cramped. Page
height fell from 6 675 px to 6 140 px.

### 15.3 Services copy — reduced by selection

**184 words → 58.** The lead shows its first published sentence; each service shows the
one published sentence that describes it. The second sentence of each description is kept
in the data for the Services page.

| Service | Shown on the homepage |
|---|---|
| Produção de Vídeo | *Criamos vídeos que contam histórias, captam emoções e deixam marca.* |
| Publicidade & Branding | *Criamos conteúdos visuais que destacam marcas e criam conexão com o público.* |
| Eventos & Experiências | *Filmamos eventos culturais, desportivos, empresariais ou sociais, sempre com um olhar artístico.* |
| Documentários & Storytelling | *Cada história tem uma verdade, e nós queremos capturá-la.* |

**Enforced, not promised.** `scripts/validate-data.mjs` fails the build if any excerpt
stops being a literal substring of its own published description, or if the shown lead
stops being a literal substring of the full lead. Copy on this page can be selected; it
cannot be edited.

### 15.4 About copy — reduced by selection

**~55 words → 15.** Kept: `De uma ideia a um movimento.`, the one supporting sentence
(*Não somos apenas videógrafos, somos contadores de histórias visuais.*), and both names
with their published roles. The origin paragraph is retained in the data, unrendered,
for the About page.

### 15.5 Copyright year

`copyright {year} © todos os direitos reservados`. The year comes from the build; every
other character is the published string, and the validator checks the template still
matches it. The archived original is unchanged, as always.

### 15.6 Verification of this pass

```
astro check       0 errors, 0 warnings (38 files)
astro build       6 pages, 0 errors
validate:data     9 ok, 4 warnings, 0 errors
```

| Checked | Result |
|---|---|
| Header theme, every scroll position (2 px steps, 5 240 px) | **0 px** wrong; 9 transitions, none of them a strobe |
| Header contrast | 12.09 · 16.25 · **5.76** (brightest still) · **6.27** (mixed crossing) |
| Void before Services | 345 px → 172 px; ground-change breaks unchanged |
| Services / About copy | 184 → 58 words · 55 → 15 words; every string a verbatim selection |
| Copyright | renders the build year |
| Mobile 375 px | no overflow; the shorter Services and About tighten the scroll noticeably |
| Reduced / minimal tiers | 0 ms, no autoplay video, elements removed from the box tree |
| Viewer, menu, focus return, `inert` | unchanged and working |
| Console | no errors |
| `ResizeObserver` | no feedback loop (0 spurious ticks) |

**Still not verifiable here.** The preview pane runs no `requestAnimationFrame`, so the
header resolver was proved by sweeping its geometry exhaustively rather than by watching
it scroll. That is a stronger test of correctness than eyeballing — it covers every
position, including ones a fast scroll would skip — but the *feel* of the 180 ms ink
crossing still wants a real browser.
