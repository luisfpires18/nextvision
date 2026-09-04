# Project page — Review D

**Date:** 2026-09-02 · **Route:** `/portfolio/leonor/` · **Status:** ✅ **APPROVED**
(approved on visual review; one refinement applied afterwards — §15)
**Direction:** Projection, entered from the Contact Sheet · **Produced with the `frontend-design` skill.**

> **One project is designed.** The other nineteen still render the Review C placeholder,
> and that is enforced by the content, not by a flag: the designed template is selected by
> a project *having blocks*. Rolling a project in is an act of authoring, never a side
> effect of deploying.

---

## 1. The representative project — `leonor`, "Words of our story"

Chosen on the criteria, then verified with `ffprobe` and a second-by-second scan rather
than from the inventory table.

| Criterion | leonor | helder-praia | nvf-vs-antiqvvm | nvf-vs-filmin-details |
|---|---|---|---|---|
| Source bitrate | **2 037 kbps** | 1 648 | 1 771 | 14 136 (1080p) |
| Embedded branding | **none** | viewfinder overlay | client end card | **FILMIN logo on every frame** |
| Caption-free frames | **many, across the whole film** | one run | few | few |
| Published copy | **the longest tagline of all 20** | 3 lines | 1 line | 1 line |
| Valid YouTube id | ✅ `0C-yySHAzCI` | ✅ | ✅ | ✅ |
| Compositional range | wide, portrait, close, figure-in-landscape | beach only | plating only | one face |

**leonor wins on every criterion that is not raw resolution**, and the one it loses —
filmin's 1080p — it loses to a file that carries another company's logo bug in the corner
of every frame. That is precisely the "embedded branding problem" the brief rules out.

It also demonstrates the most: a hero, a film, metadata, six stills, real editorial copy,
and both neighbours in the curated order (`helder-praia` before, `epitafio` after).

> **Correction to the record.** `HOMEPAGE_REVIEW.md` §4.1 called helder-praia "the
> highest-bitrate clean file we hold (1 779 kbps)". Measured directly, it is 1 648 kbps and
> leonor is 2 037. It does not change the Review B feature choice, but the claim was wrong
> and is corrected here.

---

## 2. Page structure

```
THE DARK ROOM      dark    one screen · title and metadata beneath it
  ↓
text               cream   the film's own words, the only prose it publishes
image-pair         cream   a wide and a close
image-grid         cream   three frames, in the order they occur
  ↓
full-width-image   dark    the closing frame, at scale
NEXT PROJECT       dark    Epitáfio, at the size of a film
                           (global footer)
```

**Four grounds, three changes.** The page leans further into dark than the homepage or the
portfolio — it opens dark and closes dark — but the middle is the light table, because
reading is reading.

**The ground is not in the data.** It follows the block's scale, by the same causal rule
the whole site runs on: a frame at scale means you are watching, so the ground goes dark;
words, or frames small and many, mean you are reading, so it stays cream. That keeps the
rhythm a property of the system rather than something an editor has to set correctly on
every project, and it is why no `ground` field was added to the schema.

---

## 3. The hero — the room, not the wall

The best source is 1280×720, and the crop that removes the film's own rounded viewfinder
corners leaves **1140px**. So 1140 is the ceiling, and the page is designed around that
number instead of around a viewport:

> **the film is projected inside the room, never stretched across it.**

Nothing is upscaled to pretend it is a master — and it is the more accurate metaphor
anyway. A cinema screen does not touch the walls. The dark around the screen is the room.

The title and metadata sit **under** the frame, never over the footage. Metadata is Space
Mono at 0.625rem: category, date, and a category colour dot that is always paired with the
written name.

Every framed box on the page is the film's own 1.9:1 — the pair, the strip, the plate.
**Nothing is cropped to fit a slot.** Sizes change; the shape does not. One film, many frames.

---

## 4. The primary film — the hero *is* the film

The first build had a hero loop and, below it, an `embedded-film` block. On screen they
were two near-identical boxes doing the same job. So they were merged:

**The screen arrives as a silent, caption-free 4.6 s loop and becomes the published film
the moment someone presses play.** One screen, one decision, no second player lower down.

- Façade first: **no iframe, no script, no cookie, no request** reaches YouTube until the
  press. Verified: 0 third-party requests on load, 1 iframe after.
- `youtube-nocookie.com`, `rel=0&playsinline=1&autoplay=1` — autoplay because *the press
  was the consent*.
- The screen is already 16:9, the shape the player will take, so mounting it shifts
  nothing. Verified: **641 px before, 641 px after.**
- The control is a real `<button>` labelled `Ver o filme`, with a visually hidden
  "Ver o filme: Words of our story" so it is never a bare "play".
- `allowFullscreen` is set; fullscreen is the player's own.
- On press the loop is paused and removed, so nothing decodes behind the film.

**Audio:** the loop is encoded `-an`. It cannot make a sound, so no sound control is
rendered — the same rule as the homepage. Sound arrives with the film, on purpose.

---

## 5. Blocks used — four, and only where the data is real

| Block | Used | Why |
|---|---|---|
| `text` | ✅ | The project's tagline — the only prose it publishes |
| `image-pair` | ✅ `weight: left` | A wide establishing frame and a close one |
| `image-grid` | ✅ `mode: strip` | Three frames, in film order. Widths ascend 3 : 4 : 5 on a shared baseline — §15 |
| `full-width-image` | ✅ | The closing frame, alone on dark |
| `embedded-film` | ❌ | The film **is** the hero here. The block stays in the set for projects whose film is not the entry |
| `full-width-video` | ❌ | No second piece of footage exists for this project |
| `credits` | ❌ | **No project on the live site publishes credits.** Inventing them is forbidden, and transcribing them out of a low-resolution poster risks getting names wrong — which is worse than omitting the field |
| `quote` | ❌ | No project publishes a quote |
| `spacer` | ❌ | The layout did not need one |

Five of nine unused, deliberately. Adding a block to demonstrate it is exactly what the
brief rules out, and an invented credit is a lie about someone's work.

---

## 6. Schema — no change needed, and that is the finding

Review D was meant to test whether the block model is sufficient. **It is.** Nothing was
added, and no page-builder escape hatch was needed:

- Media captions already exist on every `mediaRef`.
- The ground is derived, not stored (§2).
- The hero is `heroStill` + `heroVideo` fields, separate from `blocks` — so the entry point
  is not just another block.
- `image-grid`'s `scrub` mode degrades to `strip`, as designed.

One documentation drift worth recording: `ARCHITECTURE.md` §4.6 lists the block set under
older names (`fullscreen-media`, `media-pair`, `image-sequence`, `video-embed`,
`pull-quote`, `metadata`). The **implementation** is the nine types in
`src/content.config.ts`, and the cap of nine is intact. The doc's table should be
reconciled to the implemented names in Phase 9.

The only schema change this session is unrelated to blocks and came from Review C:
`filmUnavailable`, for the one project whose published video reference is broken.

---

## 7. Portfolio → project transition

> **⚠ Superseded in mechanism by Review E (2026-09-03), not in intent.**
> The transition described below is what the reader sees, and it is unchanged. How it is
> wired is not: rendering `transition:name` into every card meant leaving `/portfolio/`
> captured **twenty** named elements to pair one, each lifted out of the outgoing page's
> root snapshot to play its own solo fade. Frames now carry a plain `data-frame` attribute
> and the runtime names exactly one pair, on both documents, at the moment of intent.
> [`MOTION_REVIEW.md`](MOTION_REVIEW.md) §6.


The Review A signature — *editorial frame becomes cinematic project* — now runs on real
pages, with **no library and no new dependency**.

Astro's `ClientRouter` was already in the layout, so the mechanism is a shared-element
morph: the card's frame and the project's screen carry the same `transition:name`.

```
portfolio card   .frame       transition:name="frame-leonor"
project hero     .pj-screen   transition:name="frame-leonor"
```

- **Every project pairs**, including the nineteen placeholders — their still carries the
  name too, so the morph works before those pages are designed.
- The homepage cards and the featured frame carry it as well, so home → project morphs.
- The project page's *next* frame carries the next project's name, so project → project
  morphs onward.
- **Progressive by construction.** It is an ordinary link with an ordinary `href`. Without
  the View Transitions API it is an ordinary navigation; the names are inert CSS.

**Verified:** names are emitted, match across pages, and are unique per page (20 on the
portfolio, 2 on the project); a transition starts on click; the navigation lands correctly;
Back and Forward work.

**Not verified: the animation itself.** In this preview environment `ready` rejects with
`InvalidStateError` and the animation phase is skipped. That is the environment, not the
markup — stripping every shared name still produces the same rejection, so the abort has
nothing to do with the pairing. It is the same limitation that has blocked motion review
since Review B: this pane runs no `requestAnimationFrame` and advances no CSS transitions.
**The morph must be judged in a real browser** (Q1).

---

## 8. Next / previous

Not a pagination footer. The next project gets a 16:9 frame at full container width, its
title at display size, and its category and date — the scale of a film, because that is
what it is. Order is the curated `portfolioOrder`, so "next" means what the owners decided.

Beneath it, quiet mono links: `Anterior — The endless "WAVES"` and `Ver Tudo`. The route
back to `/portfolio/` is always present, and `Portfólio` stays the active item in the
global navigation on every project page.

The next frame is 16:9 rather than 21:9 on purpose: the next project's still is its own
composition, and a wider crop would cut a sixth of it away for effect.

---

## 9. Mobile

Art-directed, not stacked:

- **The screen leaves the gutter and runs edge to edge** (375 px, not 337), so the page
  opens *on* the film rather than on a card of it. The room becomes the frame.
- It stays 16:9 so pressing play still shifts nothing.
- The mobile rendition of the loop loads (98 KB, not 206).
- The pair and the strip collapse to one column; every frame keeps the film's 1.9:1.
- The next-project frame becomes 4:5 — a portrait invitation rather than a letterbox strip.
- The lyric keeps a readable measure; the title stays at the clamp's lower bound.
- No hover dependency anywhere on this page.

Verified at 375, 768, 1440 and 1920: **no horizontal overflow at any width.**

---

## 10. Media limitations — where owner media would change the result

| Limit | Effect |
|---|---|
| Source is 1280×720 at 2 037 kbps | The screen is capped at 1140 px. On a 1920 display the film occupies 59% of the width — a design decision made *because* of the limit, but a master would let the room be larger |
| The six stills are **frames pulled from the film** | They are NVF's own work from the piece they belong to, and nothing is sourced from elsewhere — but real production stills would be sharper and would show moments the film does not hold |
| The film carries burned-in subtitles | Every timecode used was chosen to avoid them; a clean grade would remove the constraint |
| `masterRequired: true` | Still true for this project, as for 19 of 20 (request **M1**) |
| No credits published anywhere | The `credits` block cannot be demonstrated at all until the owners supply them (**Q3**) |

---

## 11. Performance

| `/portfolio/leonor/` | Over the wire |
|---|---|
| Document | **3.0 KB** gz |
| CSS (3 files) | **6.9 KB** gz |
| JS — ClientRouter + site runtime + Lenis | **14.2 KB** gz |
| Fonts — six subsetted faces | **83.3 KB** |
| **Code + fonts** | **≈104 KB** |
| Hero poster (eager, the LCP) | **16.5 KB** |
| Hero loop — desktop / mobile | **206 KB / 98 KB** |
| **The cinematic opening, complete** | **≈327 KB desktop, ≈219 KB mobile** |

Below the fold and lazy: **171 KB** of stills on desktop, **90 KB** on mobile.

**YouTube: 0 bytes, 0 requests, 0 cookies until the play control is pressed.** No other
third-party contact exists on the page at all. Every image ships `width`/`height` and every
frame reserves its box with `aspect-ratio` — including the player's box, so the film
mounting causes no shift.

---

## 12. Verification

```
astro check     0 errors, 0 warnings (48 files)
astro build     32 pages, 0 errors
validate:data   8 ok, 4 warnings, 0 errors
```

| Checked | Result |
|---|---|
| Widths | 375 · 768 · 1440 · 1920 — no horizontal overflow at any |
| Façade | 0 iframes and 0 third-party requests before the press; 1 `youtube-nocookie` iframe after |
| Layout shift on play | **none** — 641 px before, 641 px after |
| Transition | names emitted, matched across pages, unique per page; transition starts; navigation and history correct |
| Back / forward | returns to `/portfolio/` with all 20 cards; forward returns to the project |
| Direct URL load | correct, with or without client-side routing |
| Motion tiers | `reduced` and `minimal` both remove the loop; the poster is the designed state |
| Header | `Portfólio` stays current on project pages; 8 declared media zones; ink over the room is the dark-ground pairing |
| Keyboard | one tab stop per destination, visible focus, the play control is a real button |
| SEO | canonical, verbatim title pattern, `og:image`, `og:type=video.other`, `BreadcrumbList` (portfolio → project), `VideoObject` where a film and still both exist |
| Regression | `/` and `/portfolio/` byte-identical in layout — same rows, same counts, same payload |

### Three defects found and fixed while building

1. **The hero image had another image's `srcset`.** `src` was the hero poster while
   `srcset` came from the card still, so the browser would have loaded the wrong picture at
   most widths. Each image now derives both from its own key.
2. **The next-project frame collapsed to 0×0 on mobile.** It was a `<span>`, and an inline
   box ignores `aspect-ratio`. Every framed box on the page is now explicitly `display: block`.
3. **Two renditions were upscales.** The hero clip was being encoded at 1280 and the stills
   at 1400 from a 1140 px crop. Both are capped at the source width now — on a page whose
   entire argument is honesty about resolution, shipping an upscale would have been the
   worst possible detail to get wrong.

---

## 13. Open questions for Review E

| # | Question | Why it matters |
|---|---|---|
| **Q1** | **The morph must be judged in a real browser.** Everything about it is verified except the animation, which this environment cannot run | It is the signature interaction |
| **Q2** | **Is the hero right as one screen that becomes the film**, or do you want a separate atmospheric hero above a player further down? | The largest structural choice on the page |
| **Q3** | **Credits.** No project publishes any. `Dormência 48h`'s poster carries a full credits block as an *image* — should we transcribe it, with you checking every name? | The `credits` block is undemonstrated until then |
| **Q4** | **Stills.** The six here are frames from the film. Do production stills exist? | §10 |
| **Q5** | **The 1140 px ceiling.** Designing around the source resolution is deliberate and honest. If masters arrive (M1), should the room grow — or is the projected screen the design regardless? | Decides whether this survives better media |
| **Q6** | **Is `leonor` the right project to judge the system on**, or would you rather see it on a wedding or on `Antiqvvm` before it propagates? | Rollout confidence |
| **Q7** | **Rollout.** Nineteen projects still show the placeholder. Each needs blocks authored and stills chosen — roughly the work done here, per project. Do you want all 20, or the strongest few first? | Scope of Phase 9 |
| **Q8** | Should a project page carry **related work** beyond next/previous? The live pages have a "Que poderás gostar" pair | Adds a section; not built |

---

## 14. Where things live

| | |
|---|---|
| Route (both templates) | `src/pages/portfolio/[slug].astro` |
| Blocks | `src/components/project/ProjectBlocks.astro` |
| Façade | `src/components/project/FilmFacade.astro` (for projects whose film is not the hero) |
| Next / previous | `src/components/project/NextProject.astro` |
| Styles | `src/styles/project.css` |
| Content | `src/content/projects/leonor.mdx` — the `blocks` array selects the designed template |
| Media | `scripts/build-review-media.mjs` → `npm run review:media` |

---

## 15. Review D — the final refinement

The visual review approved the page with one fault: **the cream image-grid section was
under-filled.** Three equal stills, each far smaller than the pair above them and a quarter
of the plate below, with a full section break on either side. Deliberate negative space had
tipped into an empty composition.

### 15.1 The cause was a browser default, not a design choice

`<figure>` still carried the UA default `margin: 1em 40px`. **Eighty pixels came off the
width of every framed image on the page** — and across a three-frame strip, 240 px. The
grid was rendering at 284 px per frame where the layout intended 364.

`figure { margin: 0 }` was missing from the global reset. Everything on the page was
smaller than designed, the strip worst of all because it pays the tax three times.

| At 1440 | Before | After |
|---|---|---|
| Strip frames | 284 · 284 · 284 | **319 · 425 · 531** |
| Pair frames | 571 / 385 | **651 / 465** |
| Plate | 1243 | **1323** |
| Mobile frames (375) | 257 | **337** |

### 15.2 The strip is composed, not repeated

Three equal thumbnails were never the intent. The widths ascend **3 : 4 : 5** and the
frames sit on a **shared baseline**, so the strip opens from left to right and hands the
reader to the full-width plate that follows.

Every frame still keeps the film's own 1.9:1 — the sizes carry the hierarchy, and nothing
is cropped to make a shape. Each width asks for its own `sizes`, so no frame downloads a
rendition meant for a different one.

The strip is also the one editorial block that **leaves the film's 1140 px column**, which
is the moment the page widens:

```
text 520  →  pair 1140  →  strip 1323  →  plate 1323
```

That width contrast is the asymmetry. Making all three the same size *inside the same
column* was what left the composition flat.

### 15.3 The seam is a breath, not a break

Two consecutive blocks of frames are one passage of looking, so they are separated by
`--space-7` rather than a full section break. Prose-to-pictures keeps the full break,
because that is a change of activity, and a ground change keeps more still.

**Pair → grid: 96 px → 48 px**, at every width. On a phone the frames are shorter than the
seam was, so the same gap read as a hole there too.

### 15.4 Result

| | Desktop 1440 | Mobile 375 |
|---|---|---|
| Strip | 319×168 · 425×224 · **531×280**, shared baseline | 3 × **337×177**, single column |
| Pair | 651×343 / 465×245 | 2 × 337×177 |
| Pair → grid | **48 px** | **48 px** |
| Horizontal overflow | none | none |

Mobile keeps the composition it already had — full-width frames stacked, which was the
stronger arrangement — and simply gains the 31% of width the browser default was taking.
The 3 : 4 : 5 ratio applies from 48 rem up only.

**No regression:** `/` and `/portfolio/` contain no `<figure>` at all, and their row
geometry is unchanged.

```
astro check     0 errors, 0 warnings (48 files)
astro build     32 pages, 0 errors
validate:data   8 ok, 4 warnings, 0 errors
```

**Review D is complete.**
