# Motion and interaction — Review E

**Date:** 2026-09-03 · **Scope:** every production route · **Status:** ⏳ **AWAITING OWNER VISUAL CONFIRMATION**
**Produced with the `frontend-design` skill.**

> This is the last design-system review before propagation. It adds no new design and no
> new effects. It takes the motion the site already had, finds where it disagreed with
> itself, and makes it one system with one authority per question.
>
> **Nothing here can be signed off from a screenshot.** The preview pane this project
> builds in does not run the rendering step at all — no animation frames, no scroll
> events — so timing, smoothness and every transition had to be verified by structure and
> measurement rather than by watching. §14 separates what is proven from what needs eyes,
> and §15 is the test list.

---

## 1. The principle

**The footage is the spectacle. The motion is the editing language around it.**

Every motion on this site is one of four verbs, and if a proposed motion is none of them
it does not get built:

| Verb | What it means here | Where |
|---|---|---|
| **Cut** | No time passes. A state simply is. | `minimal`, filter results, section boundaries |
| **Dissolve** | One ground becomes another. | cream ↔ dark, every ordinary route swap |
| **Reveal** | Content arrives as you reach it. | editorial rows, project blocks, hero foot |
| **Hold** | A deliberate beat before something begins. | the opening loader, the scroll cue |

There is no fifth verb. No parallax, no scrub, no split text, no per-image choreography,
no WebGL, no custom cursor, no scroll-jacking, and no GSAP — the claim that nothing here
is a timeline was re-tested this session rather than inherited, and it held: the ground is
a transition on one attribute, the morph is two `view-transition-name`s, the reveals are
one class.

The rule the whole system falls out of:

> **Motion answers a question the reader has already asked.** It never asks one.

A hover is answered in 120 ms. A ground change is a 760 ms dissolve because the reader
changed activity. A route swap is 380 ms because they asked for a different page. Nothing
animates because a section needed differentiating.

---

## 2. The tier contract — one authority

Before this session the answer to *how much motion does this reader want* existed in
**three** places that were free to disagree: a resolver in `site-motion.ts`, a second copy
in `concept-motion.ts`, and a `@media (prefers-reduced-motion)` block in CSS that did more
than either of them. That is exactly the failure the brief names — components
reinterpreting the same preference differently.

The policy now exists **once**, in a ~430-byte inline script that runs as the first thing
in `<head>`, before the first paint. It writes three attributes and nothing else:

```
data-motion="full|reduced|minimal"   the tier
class="js"                            so :root:not(.js) means "scripting is off"
data-loader="on"                      only when the opening hold has been earned
```

Everything downstream — CSS, the production runtime, the concept runtime, devtools —
**reads** those and never re-derives them. `src/lib/motion/tier.ts`.

### 2.1 Resolution

| Tier | Trigger |
|---|---|
| `reduced` | `prefers-reduced-motion: reduce` |
| `minimal` | `saveData`, `deviceMemory ≤ 4`, or `hardwareConcurrency ≤ 4` |
| `full` | everything else |

Running before paint is not a nicety. It is what allows the loader to be **armed** rather
than **revealed** (§3), and it means a low-memory device never paints one frame at the
wrong tier.

### 2.2 The contract

| | **full** | **reduced** | **minimal** |
|---|---|---|---|
| Opening hold | first document of a session | — | — |
| Smooth scroll | desktop fine pointers only | — | — |
| Reveal | fade + `--rise-reveal` travel | fade only, `--dur-ui` | none, content is simply there |
| Ground dissolve | `--dur-cinematic` 760 ms | `--dur-ui` 220 ms | cut |
| Header ink | `--dur-fast` 120 ms | `--dur-fast` 120 ms | cut |
| Route swap | dissolve, morph where a pair exists | dissolve, no morph | cut |
| Decorative video | plays | removed from the box tree | removed from the box tree |
| Hover preview | yes | — | — |
| Scroll cue | pulses until obeyed | — | — |

**`reduced` is not "everything is 0 ms".** `ARCHITECTURE.md` §16.7 always said reduced
motion should keep state changes legible; the CSS zeroed every duration, which makes an
interface *harder* to follow — a filter that changes with no settle at all reads as a page
reload. What goes to zero in `reduced` is **travel**: `--rise-*` and `--scale-media`. The
long durations collapse onto `--dur-ui`. `minimal` is a cut everywhere.

**No decorative video below `full`** — and it is removed from the box tree rather than
left paused behind a poster, because the still is the *designed* state there, not a
degradation.

**Nothing may leave content hidden.** Three independent locks: the reveal system is armed
only after the observer has proved it fires, a failsafe disarms it if it has not fired in
1.5 s, and the tier rules are written to beat the armed selectors on specificity so the
stylesheet is correct even if the runtime guard ever moves.

---

## 3. The loader

### The defect it had

The overlay was hidden by `:root:not(.js) .loader { display: none }` and revealed when the
deferred module added `.js`. On a fast connection that means: **the page renders, the
reader begins reading, and then a black rectangle drops over it.** A loader that arrives
after the content is not a loader.

### What it is now

Four bars in the company's own colour-reference order — gold, rust, oxblood, teal, the
`colors.png` strip — filling left to right on the dark ground, staggered by `--stagger`.
Kept, not replaced: it is already branded, already the site's own material, and the brief
asked for refinement.

**Armed before paint.** `data-loader="on"` is written by the head bootstrap; the CSS
default is `display: none`. Not armed means **not rendered** — no overlay, no bars, no
animation, no cost.

### Exactly when it appears

| Situation | Loader? | Why |
|---|---|---|
| First document of a session, `full` tier | **yes** | the one branded entry |
| Direct project URL (a shared link) | **yes** | it is still a first arrival |
| Any later page in the same session | no | `sessionStorage` |
| Client-side navigation | no | disarmed on the incoming document during the swap |
| Browser Back / Forward | no | `PerformanceNavigationTiming.type === 'back_forward'` |
| `reduced` or `minimal` | no | not armed |
| Scripting off | no | not armed |

### Timing

Leaves `--dur-ui` (220 ms) after `load`, or at `--dur-hold` (900 ms), whichever comes
first, then fades over `--dur-ui`. It masks real work and never outstays it.

**No percentage.** We do not know one, and a bar that invents progress is a lie the reader
can feel. The brief ruled it out; so does the material.

---

## 4. Smooth scroll — kept, and narrowed hard

Lenis stays. It is now the narrowest thing on the site rather than the widest, on three
measured grounds.

**1 · Desktop only.** `syncTouch` was already `false`, which means on a phone Lenis was
not smoothing anything — it was a permanent frame loop and 5.4 KB gz of parse work sitting
on top of the native momentum it had chosen not to touch. It is constructed only where
`(hover: hover) and (pointer: fine)` matches. Not a width query: a touch laptop at 1440px
must not get it, a mouse plugged into a tablet must.

**2 · Dynamically imported.** Because of (1) and the tier rule, most sessions never
construct it. A static import made every one of them download it anyway. Verified on the
built output: at 375px, **zero requests for the Lenis chunk**; at desktop, one.

**3 · The frame loop stops when the page is still.** The textbook Lenis loop is an
unconditional `requestAnimationFrame` for the life of the document — sixty wake-ups a
second on a page nobody is touching. It now coasts 30 frames past the last movement and
stops dead until real input (`wheel`, `pointerdown`, `keydown`, or a native `scroll`,
which is also what resynchronises it after sleeping). **Idle cost: zero frames.**

**Damping 0.09 → 0.12.** 0.09 keeps travelling after the fingers stop. *Smoother, not
slower* was the distinction asked for, and this is the one number in the system that
needs a human to confirm (§15).

Everything it must not do, and does not: no hijacked direction, no section snapping, no
disabled paging keys, no fight with the browser's scroll restoration. It damps the wheel.

**Anchors.** `scroll-padding-block-start: calc(var(--header-h) + var(--space-5))` is
declared once on `<html>`, and read by four things: the browser's own `#hash` jumps,
`:target`, keyboard focus travel, and — by reading that exact computed value — the scroll
model. One number, no drift. Before this a `#hash` landed with its first line underneath
the fixed header.

**`lenis.css` is deliberately not imported.** Its `.lenis.lenis-smooth iframe {
pointer-events: none }` rule would make the YouTube player's own controls dead while
smooth scroll is active, and the menu's scroll lock is `overflow` on the body — which has
to work on touch, where there is no Lenis at all.

---

## 5. Page transitions

Three tiers of transition, because **not every navigation is a cinematic moment**.

| Navigation | Treatment |
|---|---|
| Home → Portfolio, and anything else | **dissolve** — root cross-fade, `--dur-transition` |
| Home / Portfolio → Project | **morph** — the frame becomes the film |
| Project → Next project | **morph** — the next film's still becomes the next film |
| Project → Portfolio | **morph**, reversed |
| Back / Forward | whatever the forward direction was, reversed |

`--dur-transition` is 380 ms, inside the ≤400 ms budget in `ARCHITECTURE.md` §16.3.

---

## 6. Portfolio frame → project film — the signature, fixed

### The defect

Review D shipped the morph by rendering `transition:name` into the HTML of every card.
That is the obvious way to do it and it is wrong at scale. Measured on the built output:

| Page | Named elements before | Pairs formed |
|---|---|---|
| `/portfolio/` → a project | **20** | 1 |
| `/` → a project | 8 | 1 |

An element with a `view-transition-name` is **lifted out of the page's root snapshot**. So
leaving the portfolio meant the outgoing page was captured with nineteen holes in it, and
nineteen orphaned frames then played their own solo fades at their own old positions over
the incoming page. **Twenty-one snapshot layers to move one photograph.**

### The rule that replaces it

> **Exactly one element is ever named, and it is named at the moment of intent.**

No `transition:name` is rendered anywhere. Candidates carry `data-frame="{slug}"`, an
ordinary attribute that does nothing. At `astro:before-preparation` the runtime puts a
single shared name — `nvf-frame` — on the one outgoing element, and at
`astro:before-swap` on its partner in the incoming document. It is released one transition
later, because `view-transition-name` makes an element a containing block and applies
containment, which is not something to leave switched on for a reading session.

A constant name rather than a per-slug one, because uniqueness across projects was never
the requirement — the requirement is that the two documents agree, and only one pair
exists at a time. It is also what lets `::view-transition-group(nvf-frame)` style the
morph without depending on `view-transition-class`.

### Which pair, and why Back needed a second clause

The pair is the project slug the **destination** is about — or, if the outgoing document
holds no frame for it, the slug the **origin** is about. The choice is made on the old
document because that is the one the browser has already snapshotted by the time the new
one exists.

That second clause is not a nicety. **It was found by testing.** Going forward from Leonor
to Epitáfio, the page you are leaving holds a frame for where you are going, so the
destination wins. Coming *back*, the page you are leaving is Epitáfio and holds no frame
for Leonor at all — only its own — so with the first clause alone, Back formed no pair.
With both, the still you were looking at folds back into the "next project" frame you came
from.

Measured after the fix (§14 has the transcript):

| Navigation | Old doc named | New doc named |
|---|---|---|
| `/portfolio/` → `leonor` | 1 of 20 | 1 of 2 |
| `leonor` → `epitafio` | 1 of 2 | 1 of 1 |
| Back: `epitafio` → `leonor` | 1 of 1 | 1 of 2 |
| Forward again | 1 of 2 | 1 of 1 |
| `leonor` → `/portfolio/` | 1 of 2 | 1 of 20 |
| `/portfolio/` → `/` | **0** | **0** |
| `/` → `leonor` | 1 of 8 | 1 of 2 |

The zero is as important as the ones: home → portfolio is an ordinary dissolve, which is
the correct answer.

### Safety

- **No View Transitions support:** these are ordinary links and the runtime writes a CSS
  property no engine reads. Astro's `animate` fallback still cross-fades.
- **`reduced` / `minimal`:** no pair is formed at all. `minimal` disables the transition
  pseudo-elements outright — it navigates, it does not perform.
- **A filtered-out card is never named.** It has no box, and naming it would leave its
  partner animating alone.
- **Direct URL, new tab, middle-click, Ctrl/Cmd-click:** no navigation event, so no name
  is ever written. Nothing to break.

---

## 7. Next project

Kept as it was designed in Review D — a real link, a real `<h2>`, the next film's still at
the scale of a film rather than a pagination footer — with two changes:

- It is now one half of the **same** morph pair as everything else, in both directions.
  Shared naming genuinely helps here: it is the moment the next film begins, and the still
  is literally the thing that becomes it.
- The hover scale moves onto `--scale-media` and from `--dur-cinematic` (1200 ms) to
  `--dur-reveal` (520 ms). A 1.2-second response to a pointer is not considered, it is
  late.

---

## 8. Dark ↔ cream

The identity, and unchanged in behaviour — it was already right. Three refinements.

**It is a threshold, never a scroll-linked value.** The ground follows the section at the
viewport middle and changes when that section changes. The colour can therefore never be
seen chasing the reader down the page, which is the failure the brief names.

**`--ease-cinematic`, not the reveal curve.** The reveal curve spends 84% of its distance
in the first third — right for something arriving, wrong for a colour crossing, where it
read as a snap followed by a crawl.

**The header stays on its own probe.** Review B's geometry system is untouched: every
section declares what is behind the header, media declares itself with `data-header-zone`,
and the probe is the header's own text row with 48px of hysteresis so two rows of
photographs separated by their captions cannot strobe it. Ink crosses at `--dur-fast`
because a slow ink fade spends real time as a mid-grey that reads on neither ground; the
scrim can take `--dur-ui` because it only ever adds contrast.

**No IntersectionObserver was reintroduced.** It is still used only where a silent failure
is harmless — reveals, which are visible by default, and the feature loop, which falls
back to its still.

---

## 9. Homepage

| Moment | Treatment | Change this session |
|---|---|---|
| Hero film | poster → silent loop cross-fade, `--dur-reveal` | pauses when the tab is hidden |
| Company statement | two-step entrance on `--stagger`, armed with a failsafe | delays tokenised |
| Scroll cue | a hairline that lengthens, `--dur-pulse` | **stops once obeyed** (past 40px) |
| Selected work | one reveal per row item, `--rise-reveal` | travel tokenised |
| Frame hover | loop cross-fade + a category-coloured hairline | intent dwell (§10) |
| Cinematic feature | plays in view, pauses out of view | pauses when the tab is hidden |
| Services / About | reveal only | unchanged — correctly quiet |
| Contact close | the ground goes dark | unchanged |

**The closing cadence is the ground change.** The brief asked for a deliberate close; the
page already has one, and adding choreography on top of it would be the "differentiate
every section" failure the brief also rules out.

The cue change is the only new behaviour on this page, and it is a subtraction: a cue that
keeps signalling after it has been obeyed is noise.

---

## 10. Portfolio

Browsing is reading. It stays immediate.

**A filter click no longer navigates.** This was the real defect on this page, and it was
invisible because the destination was correct. `ClientRouter` registers a document click
handler in the bubble phase and its script is earlier in the document, so it ran first:
every filter click filtered the catalogue in place *and* made the router fetch and swap in
the server-rendered archive. The fastest interaction on the site was paying a network
round trip and a full DOM swap to show twenty cards that were already on screen — and,
once route transitions were tokenised, a dissolve on top. The handler moved to the capture
phase and stops the event there. Measured over twelve consecutive clicks: **router
navigations 12 → 0**, the twenty cards never leave the DOM, and the URL, the counts and
`aria-current` are right at every step.

**Filtering has no transition at all** — not a short one, none. Twenty cards leaving at
once is the worst possible case for an animated reflow, and a filter that plays an
animation before you can read the result is slower than one that does not. The
`display: contents` row dissolve means a filtered view can never leave a half-empty row,
so there is nothing to animate around. The `[data-busy]` dim the stylesheet declared was
never set by anything and is gone.

**Hover previews now load on intent.** Three rules:

| Rule | Behaviour |
|---|---|
| **Intent** | a source is attached only after the pointer has RESTED 140 ms |
| **One** | at most one preview runs; moving to another frame stops the last |
| **Rewind** | leaving pauses and resets to frame one, so a loop is never rejoined halfway |

Measured on the real page: a rapid sweep across every preview-capable frame attaches
**zero** sources (it was one per frame); resting on one attaches **one**.

**Keyboard focus deliberately starts nothing.** It previously called the same `play()` as
hover, so tabbing through the catalogue handed the reader a surprise video per card. Focus
now gets the visible outline and the written "ver projeto" cue — the same information the
loop carries. Nothing on this page is hover-only: the card is a link and the caption is
complete without it.

**A preview also stops when the tab is hidden.**

---

## 11. Project page

| Moment | Treatment |
|---|---|
| Entry from the portfolio | the morph (§6) |
| The screen | silent loop cross-fades over the poster; press mounts YouTube, still zero contact before |
| Blocks | one reveal per **block**, never per still |
| Ground rhythm | dark → cream → dark, derived from block scale |
| Closing plate | **gained a reveal** — it was the only block arriving without one |
| Next project | the morph, reversed on Back |

The page is cinematic because of its composition and its film. Animating each frame of the
3 : 4 : 5 strip independently would be exactly the motion-demo failure the brief rules
out; the strip arrives as one gesture because it is one gesture.

---

## 12. Mobile

Treated separately, and the differences are deliberate.

| | Desktop | Touch |
|---|---|---|
| Smooth scroll | Lenis | **native** — not fetched, not constructed |
| Hover preview | yes | never — the still and caption are complete |
| Reveal travel | `1.25rem` | **`0.75rem`** |
| Ground dissolve | `760 ms` | **`560 ms`** |
| Shell minimum height | `100svh` | `100svh` |
| Filters | a wrapped row | one snap-scrolling line |

**Motion density drops on touch even with no preference expressed**, which the brief
invited. It is one `@media (pointer: coarse)` block in the token file — travel that reads
as considered on a 27" display reads as lag at arm's length.

**The viewport-height jump is fixed.** The shell was `min-block-size: 100dvh`. `dvh`
tracks the browser chrome as it collapses, so the shell's own minimum height changed
*during* a scroll — firing resize, re-measuring every section boundary, and able to shunt
the page under the reader's thumb. `svh` is the smallest guaranteed viewport: it never
moves.

**Nothing delays a tap.** No `touch-action` interception, no click handler in the
navigation path, no smoothing to fight. The menu is a class toggle plus an `overflow` lock
on the body — which is also why the lock is body overflow rather than Lenis's own stop:
it has to work where there is no Lenis.

**No horizontal overflow at 375px** — verified by walking every element in the document
and comparing its rect against the viewport (§14).

---

## 13. Performance

### Bytes, measured on the built output (gzip)

| | Before Review E | After | |
|---|---|---|---|
| Runtime (`BaseLayout` chunk) | 3 338 | 4 787 | +1 449 |
| Tier module (shared chunk) | — | 385 | +385 |
| `ClientRouter` | 5 676 | 5 676 | — |
| Lenis | **5 417, static** | **5 515, dynamic** | moved |
| **Blocking JS, every page** | **14 431** | **10 858** | **−3 573 (−24.8%)** |
| Desktop total once Lenis lands | 14 431 | 16 373 | +1 942, off the critical path |
| Production CSS | 5 692 | 5 424 | −268 |
| Inline tier bootstrap | — | 578 B raw, per document | new |

Read it this way: **a phone, a reduced-motion reader and a low-memory device are 3.5 KB
lighter and never fetch Lenis at all.** A desktop reader loads 3.5 KB less before first
paint and picks up the scroll model afterwards, off the critical path. The runtime grew
by 1.4 KB, and that is what the transition module, the scroll module and three failsafes
cost.

### Work while idle

| | Before | After |
|---|---|---|
| Animation-frame loops at rest | **1, permanent** (Lenis, 60/s, forever, on every device) | **0** |
| Layout reads per scroll frame | 1 (`scrollHeight`, then 4 transform writes) | **0** |
| Decoding video in a hidden tab | all of it | **none** |
| Video requests from a 20-frame pointer sweep | up to 20 | **0** |
| Concurrent playing previews | unbounded | **1** |

### Listeners

Instrumented `addEventListener`/`removeEventListener` and ran **ten client-side
navigations** (five portfolio ↔ project round trips). Net live listeners from the runtime:

```
SPAN:pointerenter   6  →  6      (constant across all ten)
SPAN:pointerleave   6  →  6
document:click      1            (anchor handler)
window:popstate     1            (portfolio filter)
window:scroll / window:resize    net 0 — added and removed in balance
```

**No leak.** The `mouseenter`/`mouseleave` growth in the raw trace is `ClientRouter`'s own
prefetch, attached to links in documents that are then discarded.

### Guardrails not yet measured

Frame rate on a mid-range Android, INP and CLS under motion (`ARCHITECTURE.md` §16.10) are
Phase 10 work and need a real device. They are not claimed here.

---

## 14. Verification

### ✅ VERIFIED PROGRAMMATICALLY

| Check | Result |
|---|---|
| `astro check` | **0 errors, 0 warnings**, 50 files (1 pre-existing hint in `ConceptLayout`) |
| `astro build` | **32 pages**, 0 errors |
| `validate:data` | **8 ok, 4 warnings, 0 errors** (all four pre-existing owner items) |
| `view-transition-name` in built HTML | **0 occurrences across all 32 pages** |
| `data-frame` counts | `/` 8 · `/portfolio/` 20 · `leonor` 2 · `epitafio` 1 |
| Pair formed per navigation | **exactly 1 on each document**, all 7 navigations in §6 |
| Home → portfolio | **0 pairs** — ordinary dissolve, as designed |
| Back / Forward | pair forms in both directions; URL, title and scroll all correct |
| Loader on the incoming document during a swap | `data-loader` cleared, element `hidden` |
| Loader on a fresh session, direct project URL | armed, `sessionStorage` flag set |
| Tier tokens, all three tiers | resolve exactly as the §2.2 table states |
| Legacy token names on production pages | `--dur-base`, `--dur-slow`, `--ease-out`, `--ease-in-out`, `--parallax-*`, `--stagger-tight`, `--ease-cut` — **all unset** |
| Raw durations / easings in production CSS | **0**, by grep |
| Lenis fetched at 375px | **0 requests** |
| Lenis fetched at desktop | 1 request, 18.7 KB raw |
| `pointer: coarse` token overrides | `--rise-reveal: 0.75rem`, `--dur-cinematic: 560ms` |
| `scroll-padding-block-start` | `76px` at 375px (header 52 + 24) |
| Horizontal overflow at 375px | **none** — every element walked |
| Preview intent: rapid sweep | **0 sources attached** |
| Preview intent: resting | **1 source attached** |
| Listener leak over 10 navigations | **none** (§13) |
| Router navigations over 12 filter clicks | **0** (was 12) |
| Cards rendered per category archive | **5 / 1 / 5 / 1 / 8**, 20 on the index — every project reaches a page |
| Console errors, all three routes | **none** |
| Horizontal overflow at 1920 / 768 / 375 | **none** on any of the three routes |
| Mobile menu at 375px | opens, locks the body, moves focus into the menu, Escape closes and clears the lock |
| Reveal/hero failsafes under a starved renderer | both disarmed, **all content visible** |

That last row is worth stating plainly: this project's preview pane does not run the
rendering step at all — `requestAnimationFrame` never fires and `scroll` events are never
dispatched. That made it an accidental but excellent test of the failsafes, and they held:
every reveal disarmed, the hero statement stayed visible, and nothing was lost behind an
animation that never ran.

### ⚠ REQUIRES USER VISUAL CONFIRMATION

Everything about *how it feels*, and specifically:

- the scroll damping at `lerp: 0.12`
- the loader's length and whether the bars read as branded rather than as a delay
- the ground dissolve at 760 ms with the symmetric curve
- the frame → film morph, in both directions
- reveal timing and whether the rows arrive too early or too late
- the hover-preview 140 ms dwell — long enough to prevent sweeps, short enough to feel
  instant when you mean it
- header ink over the film, under fast scrolling
- everything on a real phone

§15 is the list.

### Three defects found and fixed while building

**1 · Back through a project pair formed no morph.** The first naming rule used the
destination's slug only, and the outgoing placeholder page holds a frame for itself but
none for where Back is going. Found by driving the real navigation and reading the named
elements on both documents, not by inspection. §6 has the corrected rule.

**2 · A filter click filtered AND navigated.** §10. Twelve router navigations for twelve
clicks that needed none.

**3 · Two category archives shipped a heading and no work.** Out of scope for a motion
review and fixed anyway, because it was found by walking the archives during navigation
testing and because two published projects were unreachable from their own category page.
`/categoria-portfolio/corporativo/` and `/categoria-portfolio/moda-identidade/` each hold
one project and each rendered **zero cards**. The cursor that slices the curated order
across the composed rows advanced for every row whether or not that row rendered, so by
the end it had run to the full capacity of the sequence and `overflow` — the clause whose
whole job is to catch what the rows could not place — always sliced from past the end. It
stayed hidden because 20, 5 and 8 all land exactly on a prefix sum of the row sizes
(2, 5, 7, 8, 11, 14, 16, 17, 20); 1 does not. The build now fails if any project does not
reach the page. Verified: **5 / 1 / 5 / 1 / 8** across the five archives, 20 on the index.

---

## 15. The real-browser test list

Please run these in a normal browser. Where a row says what to watch for, that is the
thing I could not see.

### A · First arrival

1. Open a **new private window** → `http://localhost:4321/`.
   The four-colour bars should fill and the overlay leave within about a second.
   **Watch for:** the loader must be there *before* the page, never dropping over content
   that was already readable.
2. Navigate to `/portfolio/` in the same session. **No loader.**
3. Reload `/portfolio/`. **No loader.**
4. New private window → straight to `/portfolio/leonor/`. **Loader appears** — a shared
   link is still a first arrival.

### B · Scroll feel — the one number that needs you

5. Scroll the homepage slowly with a wheel, then with a trackpad.
   **Is it smoother or merely slower?** If it drags, say so and `LERP` in
   `src/lib/motion/scroll.ts` comes down; if it feels unsmoothed, it goes up.
6. Flick hard and stop. It should settle in well under a second with no long tail.
7. Page Up / Page Down / Space / Home / End, and drag the scrollbar. All must work
   normally.
8. Scroll fast through the whole homepage. **Watch for:** the header ink must never sit
   grey over a photograph, and must not strobe between the two rows of stills.

### C · The ground

9. Scroll the homepage slowly across each ground change (hero → work, work → feature,
   feature → services, services → contact). The colour should cross as a dissolve.
   **Watch for:** it must not appear to follow the scroll, and there must be no flicker at
   the boundary.

### D · The signature

10. `/portfolio/` → click the **Leonor** frame. The frame should become the film.
11. On Leonor, click **next project**. The still should become the next page.
12. Press **Back**. The morph should reverse.
13. Press **Forward**.
14. From Leonor, click **"Ver todos"** → the film should fold back into its frame on the
    sheet.
15. `/` → `/portfolio/` via the header. **This one should just dissolve** — confirm it does
    *not* try to be cinematic.
16. Middle-click and Ctrl/Cmd-click a project card: a new tab, no transition, nothing
    stuck on the page you stayed on.

### E · Portfolio

17. Sweep the pointer quickly across all twenty frames. **Nothing should start playing**,
    and the network panel should show no video requests.
18. Rest on one frame. The loop should start after a beat and cross-fade in.
19. Move straight to the next frame. The first must stop.
20. Tab through the cards with the keyboard. **No video may start**; the outline and the
    cue are the whole feedback.
21. Click through the five filters several times in a row. Results should be **instant**
    with no page flash at all — the network panel should show no document requests.
22. Then press Back and Forward through those filter states. The URL and the work shown
    must match at every step. This path *does* re-fetch the archive (§18.7); confirm it
    still feels acceptable.
23. Open `/categoria-portfolio/corporativo/` and `/categoria-portfolio/moda-identidade/`
    directly. Each should show its single project as a full-bleed plate, not an empty page.

### F · Tiers

22. Enable **Reduce Motion** in the OS and reload. No loader, no smooth scroll, no
    autoplay video, no travel — but filters, the header ink and the ground should still
    *change* legibly rather than snapping.
23. Devtools → set `<html data-motion="minimal">` and interact. Everything should cut.
24. Disable JavaScript and load all three routes. **Everything must be readable and every
    link must work.**

### G · Mobile — please use a real phone if you can

25. At 375px: open the menu. It must respond instantly, lock the page behind it, close on
    Escape and on any link.
26. Scroll hard. **Watch for:** no lag on the first touch, no jump as the browser chrome
    collapses, and no sideways movement anywhere.
27. Tap a project card. It should go straight to the project — never to a preview.
28. Rotate the device on the portfolio and on a project page.

### H · History and entry

29. Reload mid-page on all three routes; the scroll position should be restored sensibly.
30. Open `/portfolio/leonor/#main` — the heading must not sit under the header.
31. Long session: Home → Portfolio → project → next → Back ×4 → Forward ×4. Nothing should
    accumulate, slow down, or lose its header theme.

---

## 16. Final tokens

```
DURATION                                  EASING
--dur-instant       0ms   cut             --ease-ui         cubic-bezier(.2,0,0,1)
--dur-fast        120ms   touch           --ease-reveal     cubic-bezier(.16,1,.3,1)
--dur-ui          220ms   settle          --ease-cinematic  cubic-bezier(.65,0,.35,1)
--dur-reveal      520ms   reveal
--dur-transition  380ms   route           DISTANCE · SCALE · RHYTHM
--dur-cinematic   760ms   dissolve        --rise-reveal     1.25rem
--dur-hold        900ms   the cap         --rise-hero       0.75rem
--dur-pulse      2600ms   the one loop    --scale-media     1.02
                                          --stagger         90ms
```

Seven durations, three easings, four distances. `src/styles/tokens.motion.css` is the only
file any of them appears in.

---

## 17. Cleanup performed

| Removed | Why |
|---|---|
| `.viewer` block, 55 lines of `site.css` | Review C retired the overlay when project routes became real |
| `--parallax-subtle`, `--parallax-base` | zero uses; there is no parallax and there will not be |
| `--stagger-tight`, `--ease-cut`, `--ease-cut-hold` | zero uses |
| `--dur-instant: 80ms` | an "instant" that took 80 ms |
| `--reveal-delay` | read as if reveals were staggered; nothing has ever set it |
| `.stripe4` | declared once, worn never |
| `.pf-index[data-busy]` | a dim state nothing ever entered |
| `resolveTier()` in `concept-motion.ts` | the second copy of the tier policy |
| `@media (prefers-reduced-motion)` blocks in `site.css`, `portfolio.css`, `project.css` | the third authority; now one `data-motion` contract, with the media query kept only as the no-JS floor |
| `focusin` / `focusout` preview playback | keyboard focus must not autoplay video |
| `.progress i` transition | it fought its own per-frame updates |
| `<slot name="overlay">` | nothing filled it |
| Concept easings in the production token file | moved to `concepts/base.css`, where they are used |

**The concept routes themselves are untouched** and stay as reference material, as the
brief requires. What changed for them is that they now read the same tier the live site
reads instead of deciding for themselves.

---

## 18. Known limitations

1. **No real-device measurement.** 60 fps on a mid-range Android, INP and CLS under motion
   are `ARCHITECTURE.md` §16.10 guardrails and belong to Phase 10. Not claimed here.
2. **`lerp: 0.12` is a judgement, not a measurement.** It needs a human wheel.
3. **Only two of twenty projects have a hover-preview source** (decision D7). The intent
   dwell is verified on six preview-capable frames across the portfolio, not on twenty.
4. **The `minimal` tier is heuristic.** `deviceMemory` and `hardwareConcurrency` are
   coarse and absent in some browsers, where the default is `full`. `ARCHITECTURE.md`
   §16.7 mentioned a frame-rate probe; it is not built, because a probe that has to run
   before it can decide is itself the thing it is trying to avoid.
5. **The morph is only as good as the two stills.** Where a card's poster and a project's
   hero poster are different crops, the pair will cross-fade rather than glide. That is a
   media question (M1), not a motion one.
6. **Firefox has no View Transitions in the versions we target.** It gets Astro's
   `animate` fallback — a cross-fade, no morph. Navigation is never affected.
7. **Back out of a filtered view re-fetches the archive.** The filter click itself is now
   entirely local, but `popstate` is not ours to intercept — `ClientRouter` listens for it
   too and was registered first — so pressing Back from a filtered catalogue loads the
   server-rendered category page. The content and the URL are right and it is exactly what
   a reload would give; it costs a round trip. Left as is: the forward interaction is the
   one that had to be instant.
8. **The tier bootstrap is inline and render-blocking**, by choice. 578 bytes buys a first
   paint that is already at the right tier; a CSP that forbade inline scripts would need a
   hash added rather than the script moved.

---

## 19. Where things live

| Concern | File |
|---|---|
| Every duration, easing, distance, stagger, and all three tiers | `src/styles/tokens.motion.css` |
| The tier policy and the inline bootstrap | `src/lib/motion/tier.ts` |
| Smooth scroll | `src/lib/motion/scroll.ts` |
| Transition pairing | `src/lib/motion/transitions.ts` |
| Loader, ground, header, reveals, previews, video, menu, façade | `src/lib/site-motion.ts` |
| Transition and tier CSS | `src/styles/site.css` (bottom) |
| Filtering | `src/lib/portfolio-filter.ts` |
| The prototypes' own vocabulary | `src/styles/concepts/base.css` |
