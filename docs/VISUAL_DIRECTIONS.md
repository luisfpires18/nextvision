# Visual Directions — Review A

**Date:** 2026-09-02 · **Status:** ✅ **APPROVED** — applied to the real homepage at `/`
(see [`HOMEPAGE_REVIEW.md`](HOMEPAGE_REVIEW.md))
**Prototypes:** `/__concepts/` · **Produced with the `frontend-design` skill.**

> ## ✅ APPROVED (owner, 2026-09-02)
>
> **Contact Sheet as the overall website system + Projection for immersive/cinematic
> moments.** Slate is not the primary direction. The three originals are kept for
> comparison and are not deleted.
>
> **Review B applies this to the real `/` route.** Where the two differ, the homepage is
> now the reference: the ground changes four times rather than seven, the header theme is
> declared per section rather than inherited, the frame affordance moved from the picture
> into the caption, and the stripe is down to three uses. Reasoning:
> [`HOMEPAGE_REVIEW.md`](HOMEPAGE_REVIEW.md).
>
> The refined combination lives at **[`/__concepts/nvf-direction/`](/__concepts/nvf-direction/)**
> and is documented in §11 below. **Final art direction remains subject to owner and
> Tatiana review** — typography, colour weighting and layout are all still provisional.

Three interpretations of **one** brand — not three unrelated websites. Built with real
preserved NVF content and media: 20 real projects, verbatim copy, no placeholder text,
nothing invented.

**Everything here is provisional.** Typography, colour weighting and layout are all
expected to change once Tatiana joins. The prototypes are built on shared tokens so that
changing them is an edit, not a rebuild.

| | Route |
|---|---|
| Index | [`/__concepts/`](/__concepts/) |
| **★ NVF Direction (refined — §11)** | [`/__concepts/nvf-direction/`](/__concepts/nvf-direction/) |
| A — Projection | [`/__concepts/projection/`](/__concepts/projection/) |
| B — Contact Sheet | [`/__concepts/contact-sheet/`](/__concepts/contact-sheet/) |
| C — Slate | [`/__concepts/slate/`](/__concepts/slate/) |

---

## 0. The one thing all three share

`colors.png` — the swatch file on the live `/sobre/` page — is not decoration. Decoded
pixel by pixel it is **four equal colour bands separated by black**: gold `#EFB025`,
rust `#D54B27`, oxblood `#982703`, teal `#3D7D70`.

That is a **colour reference strip** — the thing you shoot at the head of a roll so the
lab knows what the colours should be. It is already NVF's, it is already film, and the
striped wordmark comes from it.

**So the stripe is the system.** Each direction uses it at a different scale and pressure:

| | Stripe usage |
|---|---|
| Projection | A thin rule at section boundaries. Scarce, so it lands |
| Contact Sheet | A category band under every frame. Colour as information |
| Slate | Full-bleed fields. Colour as architecture |

It is also the loading animation in all three: the four bars wipe in, then leave.

**Why this matters.** The two most common AI-generated looks right now are (a) warm cream
+ high-contrast serif + terracotta accent and (b) near-black with one bright accent. NVF's
palette sits on (a); the entire cinematic reference set sits on (b). A four-colour
system that is genuinely theirs is what keeps this out of both.

---

## A — PROJECTION

> *The site is a dark room. The work is the light.*

### Core idea
Near-black ground. Footage is the only source of light. **Text never sits on the video** —
it sits on a **cream paper card** laid in front of it, like a programme note in a cinema.

### Why it suits NVF
It is what "film production company" means to most people, and it flatters the footage
above everything else. The paper card is the part that is theirs: the brand cream stops
being a background and becomes an *object*.

### Connection to the references
Promenade's lesson — fullscreen reel, one line, explicit unmute — plus Locomotive's
work-first ordering: project titles are the interface, and the still changes *behind* the
type rather than sitting in a card.

### Typography
Restrained. One typographic event per screen. Barlow Condensed 700 for the single large
moment, Space Mono for everything technical. Small, quiet, confident.

### Palette
Ground `#0B0B0B`, type in warm off-white, cream `#F0EAD6` as paper. The four brand
colours appear **almost nowhere**, then arrive as a stripe at boundaries. Scarcity gives
them force.

### Motion
Slow. Heavy in, quick settle (`--ease-shutter`). Lenis at `lerp: 0.075` — the most damped
of the three. Titles dim as siblings; the hovered one is the lit one.

### Portfolio behaviour
A list, not a grid. Large titles with a category dot and mono metadata; the still appears
behind the type on hover **or keyboard focus**.

### Mobile
Card stacks under the hero video. Title list becomes a single column with the still
suppressed — the metadata is already complete, so nothing is lost. Hamburger menu.

### Strengths
Most immediately "premium". Best showcase for good footage. Lowest visual noise.

### Risks
- **Closest to the genre default.** Under-designed, it becomes every other black film site.
- **It depends on footage we do not yet have.** 19 of 20 projects are `MASTER_REQUIRED`; a fullscreen hero cut from a 720p 1 Mbps file will not hold at 1440px. This direction is the most exposed to that gap.

---

## B — CONTACT SHEET

> *The film lab, not the cinema.*

### Core idea
The brand cream stays. The site is a **light table**: frames laid out in a regular grid,
annotated in the margin, scannable at a glance.

### Why it suits NVF
It is derived from the brand's own retro identity rather than from the genre, and it
solves a real business problem — NVF has 20 published projects plus six unpublished
pieces, and the current site makes you visit five separate archives to see them. A
contact sheet **rewards** a catalogue this size.

### Connection to the references
Locomotive's "All Work" — one index containing everything. Maria & Mayer's editorial
Portuguese register. Stink's use of monospace as the utility voice.

### The anti-cosplay rule
**No sprocket holes, no grain overlay, no fake tape.** The reference is carried by
*rhythm*, not costume: a tick scale down the left margin that is a genuine scroll-position
indicator, and grease-pencil annotation set in Space Mono. Function first.

### Typography
The most typographically visible of the three. Barlow Condensed uppercase for titles;
Space Mono doing real work — project, category, date, format. Metadata is content here,
not garnish.

### Palette
Cream ground, ink type, and the four brand colours as **category coding** — a band under
every frame that fills on hover/focus, always paired with the written label.

### Motion
Mechanical. `--ease-advance`: snap, not glide, like film advancing a frame. Lenis at
`lerp: 0.12` — lighter than Projection. Deliberately *unlike* the soft-parallax house style.

### Portfolio behaviour
All 20 projects in one filterable grid. Columns follow available width
(`auto-fill / minmax`), not hardcoded breakpoints. Filters are real buttons with
`aria-pressed`, and the grid is fully server-rendered, so it works with JS off.

### Mobile
Tick scale hidden below 768px. Grid collapses to one column. Hover previews are replaced
by the still plus visible metadata — nothing is hover-only. Annotation stacks.

### Strengths
- Lands on **neither** AI default.
- Most robust to a typography change: the structure carries the design, not the typeface.
- Scales as the catalogue grows.
- Highest information density without feeling corporate.

### Risks
Density can tip into clutter. Needs disciplined spacing and consistent poster quality.
Less immediately "cinematic" on first paint than Projection.

---

## C — SLATE

> *Production vernacular, taken graphically.*

### Core idea
Instead of drawing a clapperboard, take the colour bar to its conclusion: each section is
a **full-bleed colour field**, each category owns a colour, and the page reads as a
sequence of coloured chapters with the work punched out of them.

### Why it suits NVF
It is the boldest expression of an identity they already own, and the most memorable at a
glance. Running timecode in the header is technical rather than decorative.

### Connection to the references
Stink Studios' near-zero chrome and Basic's discipline, pushed toward the graphic end of
contemporary studio work.

### Typography
Enormous Barlow Condensed uppercase, cropped by the field edge. Space Mono for the
timecode and indices. The most typographically committed direction.

### Palette
The **full** brand palette, at maximum pressure. Contrast is chosen per field, never
assumed — gold and cream both take ink; rust, oxblood and teal take white.

### Motion
Hard cuts. No crossfades anywhere. `--ease-cut`. The transition *is* the cut, which is
honest to editing and cheap to run. Lenis at `lerp: 0.14` — the lightest.

### Portfolio behaviour
Projects as alternating full-width bands, coloured by category, media flipping side to
side. A category index where colour is the navigation.

### Mobile
Bands stack; hero video becomes 3:4. Type stays large and cropped — it survives narrow
widths better than the other two because the fields do the framing.

### Strengths
Strongest identity. Most distinctive. Impossible to mistake for a template.

### Risks
- **Highest pastiche risk** — it can tip into costume.
- **Most constrains Tatiana.** The fields are sized around heavy condensed caps; a lighter or wider typeface would need the layout re-cut.
- The colour fields **compete with the footage**, which is the opposite of what a production company's site should do.

---

## Ranked recommendation

### 1st — **Contact Sheet**

Not because it is the safest, but because it is the only one that is *specifically* NVF
and defensible on all four of the project's actual constraints:

1. **It avoids both AI defaults.** Projection sits on the black-site default; a cream-and-terracotta treatment sits on the other. Contact Sheet's structure comes from the brand's own colour strip.
2. **It fits the media we actually have.** 19 of 20 projects are `MASTER_REQUIRED`. Contact Sheet is built on **stills**, with motion as an enhancement on the six projects that have usable clips. Projection is built on *fullscreen footage we cannot currently supply at quality*.
3. **It survives Tatiana.** The design lives in structure, rhythm and information hierarchy. Swap the typeface and it still works. Slate would need re-cutting.
4. **It solves the browsing problem the owners named.** They dislike how sections are organised today; this is the direction that makes 20+ projects genuinely scannable.

### 2nd — **Projection**

Genuinely premium and the most flattering to great footage. Second only because it is
closest to the genre default and because **it depends on masters that do not exist yet**.
If the owners supply 4K/ProRes masters (request M1), this becomes much stronger — and it
is the natural treatment for *individual project pages* regardless of which system wins.

### 3rd — **Slate**

The strongest identity and the most fun, and it should not be discarded. But it is the
riskiest, it constrains the typography decision most, and its colour fields compete with
the work. Best used as a **source of parts** rather than the whole system.

### The hybrid worth considering

These are not mutually exclusive. The strongest outcome may be:

- **Contact Sheet as the system** — homepage, portfolio index, navigation, metadata language.
- **Projection as the project page** — each film gets the dark room and the fullscreen treatment when you enter it.
- **Slate's category colour-coding** lifted into both, since it is the clearest expression of the brand's four colours.

That combination gives the signature moment named in `DESIGN_REFERENCES.md` §10 — *how a
project is entered, the moment a frame becomes a film* — a literal form: the light table
opens into the dark room.

---

## What owner feedback would resolve

Answering these unblocks Phase 1 proper.

| # | Question | Why it matters |
|---|---|---|
| **V1** | **Cream or dark as the primary ground?** | The single largest fork. Everything follows it |
| **V2** | Which direction — or the hybrid in §Ranked? | Determines what gets developed |
| **V3** | **How literal may the film vocabulary be?** Tick scales, timecode, colour bars — identity or costume? | Sets the ceiling on Slate and the floor on Contact Sheet |
| **V4** | Is the **stripe promoted to a system**? Today it exists only inside a raster logo | Affects all three |
| **V5** | Does the **category colour-coding** hold, and are those the right five categories? | Ties into taxonomy decision R5 |
| **V6** | Typography: keep Barlow / Barlow Condensed / Space Mono, or is Tatiana changing it? | Slate is most affected |
| **V7** | **Hero audio** — muted with a visible unmute (as prototyped), or silent? | Prototyped in Projection |
| **V8** | Motion intensity — too much, too little, right? Especially scroll damping | Three different settings are live to compare |
| **V9** | Do the six unpublished pieces and the 2026 showreel enter the portfolio? | Contact Sheet benefits most from a bigger catalogue |
| **V10** | **Masters (M1)** — this decides whether Projection is viable at all | 19 of 20 projects currently cannot carry a fullscreen hero |

---

## Engineering notes

Shared, not triplicated: one token layer, one CSS architecture (`concepts/base.css`),
one motion runtime (`lib/concept-motion.ts`). Each direction overrides **presentation
only** — no direction redefines layout primitives or invents a z-index.

| | |
|---|---|
| Fonts | System stacks in the prototypes. The Barlow/Space Mono WOFF2 pipeline is Phase 1 — deliberately not built before the typeface is confirmed |
| Libraries added | **Lenis 1.3.26 only** (~3 KB). No GSAP: none of the three needs timeline choreography CSS cannot do |
| JS shipped | **44 KB uncompressed total**, including Lenis |
| CSS shipped | **24 KB uncompressed total** |
| Prototype media | 2.42 MB generated — 20 posters (624 KB) + 7 silent loops (1.75 MB), from `scripts/build-concept-media.mjs`. Disposable, gitignored |
| Reduced motion | Verified: 0 hidden elements, 0 transforms under `reduced`; all preview video disabled under `minimal` |
| No-JS | Content renders and navigates. Filters degrade to showing everything |
| Accessibility | One `<h1>` per page, visible focus, `aria-pressed` on filters, keyboard parity for every hover reveal, no horizontal overflow at 375px or 1440px |

**One fragility this exposed and fixed.** The reveal system originally hid content by
default and revealed it via IntersectionObserver. In the preview environment IO never
fires — so the page stayed blank. The default is now inverted: content is visible unless
JS has both armed the system *and* proven the observer fires, with a 1.5 s failsafe that
disarms it. **Motion can never leave content permanently hidden.** That contract carries
into production.

**Not verified here:** scroll feel, transition timing and hover previews could not be
observed in the preview pane (no IntersectionObserver, throttled transitions). They need
a real browser, ideally on a real phone, before Review A is signed off.

---

# 11. NVF DIRECTION — the refined proposal

**Route:** [`/__concepts/nvf-direction/`](/__concepts/nvf-direction/) · working name **"Frame"**
Contact Sheet's editorial system with Projection as a **mode inside it**, not a second website.

## 11.1 The organising idea

A contact sheet is many small frames. A projection is one frame filling the room.

**This is the same frame at different scales — and the ground colour follows the frame:**

```
frame large, one of them    →  ground goes dark    (you are watching)
frames small, many of them  →  ground is cream     (you are reading)
```

That makes the cream/dark duality **causal rather than decorative**, which is precisely
what stops it reading as two things stitched together. The transition *is* the identity.

The page moves EDITORIAL → CINEMATIC → EDITORIAL → IMMERSIVE by changing the scale of
the frame, and the ground follows automatically.

## 11.2 What changed from Contact Sheet

| Feedback | Change |
|---|---|
| "must not become an overly literal archive" | **The tick scale, grease-pencil annotation block and 1px-gutter sheet are gone.** No archive furniture survives |
| "not a rigid grid from top to bottom" | A **12-column editorial grid with a deliberate repeating proportion pattern** — 7/5, then 4/4/4, then a full-width 21:9. Order you can feel; never masonry |
| "sometimes break out of the grid" | Two **featured bands break full width** and take the ground dark |
| "cream palette works well" | Kept as the editorial ground |
| chunky filter buttons | **Quiet text filters**; only the active one carries the stripe |

## 11.3 What was imported from Projection

| Kept | Dropped |
|---|---|
| Fullscreen footage as the opening statement | **The large cream text card over the video** — the owners found it too heavy |
| Dark-room ground for cinematic moments | Making the *whole* site dark |
| Sound as an explicit opt-in | Every section following the same fullscreen formula |
| Immersive viewing for a single project | — |

Projection is now a **mode**: the hero, the two featured bands, the footer, and the
project viewer. Everything else is editorial.

## 11.4 Hero — the work first

The owners were explicit: the giant `CAPTAMOS EMOÇÕES / CONTAMOS HISTÓRIAS` was too
dominant, and NVF is a film production company.

- **Full-bleed film**, near-black, no card over it.
- **Branding restrained** — wordmark at 0.95rem, nav at 0.875rem, PT/EN as small mono.
- **The same real copy, at caption weight** (~1rem, Barlow 500, bottom-left). The words the old site shouted now support the footage instead of competing with it. Nothing was rewritten.
- Mono line: `Produtora audiovisual · Portugal · 20 projetos` — all facts drawn from preserved content.
- Gradient only in the lower third; the footage stays the brightest thing on screen.
- **Sound is opt-in** and reports its state.

## 11.5 The signature interaction — the frame opens

Clicking or tapping any frame:

1. the ground goes dark,
2. a fixed viewer fades up and the frame **scales from 0.94 into place** — it opens rather than cutting,
3. the still is replaced by the silent loop when one exists,
4. title, tagline and metadata sit under it in the Projection register.

Escape closes it, focus returns to the frame that opened it, and the ground returns to
whatever the page was on. **Click/tap, never hover** — identical on touch and desktop.

## 11.6 Colour stripe — four uses, and only four

| # | Where |
|---|---|
| 1 | The loader |
| 2 | **Scroll progress** — four segments filling in sequence, which is what a leader strip is actually for |
| 3 | The **active** nav item |
| 4 | The **active** filter |

It appears nowhere else — no section dividers, no footer bar, no per-card band. Restraint
is what keeps it a mark rather than a gimmick.

## 11.7 Typography — the real families, provisionally

Now running the owner-supplied fonts, subsetted by `scripts/build-fonts.mjs`:

| Face | Role | WOFF2 |
|---|---|---|
| Barlow Condensed 700 | Display: section heads, featured and viewer titles | 14.3 KB |
| Barlow Condensed 500 | Secondary display, mobile menu | 14.3 KB |
| Barlow 400 | Body | 15.1 KB |
| Barlow 500 | Hero caption, nav | 15.0 KB |
| Barlow 600 | UI emphasis | 15.3 KB |
| Space Mono 400 | Metadata only | 9.3 KB |

**83.3 KB total.** Subset verified to contain every Portuguese diacritic
(a-acute through c-cedilla and their capitals, plus the masculine/feminine ordinals) and
the typographic punctuation the copy uses. Source TTFs untouched.

Deliberately **not** everything condensed and **not** everything uppercase: display type
is condensed and sentence-case, body is Barlow, and **uppercase is reserved for
metadata**. Weights are the real `usWeightClass` values read from the binaries.

## 11.8 Motion

| Moment | Treatment |
|---|---|
| Loader | Four stripe bars wipe, then lift. Capped, session-skipped, bypassed under reduced motion |
| Hero | Film plays immediately; no entrance animation competing with it |
| Ground change | 600 ms cross-fade of background and colour. Smooth, not theatrical |
| Editorial reveals | Restrained fade-and-rise, fail-safe (visible if the observer never fires) |
| Project interaction | The most expressive moment — scale 0.94 to 1 with a fade |
| Scroll | Lenis at `lerp: 0.09`, between Projection's 0.075 and Contact Sheet's 0.12 |

**No GSAP.** Nothing here needs timeline choreography: the ground swap is a CSS
transition on an attribute, and the viewer is `transform` + `opacity` on one element.
Adding 45 KB for that would be indefensible.

**One engineering decision worth recording.** The ground swap was originally driven by
IntersectionObserver. It is now driven by the single rAF-throttled scroll handler that
the progress stripe needs anyway — because if IO silently fails (background tabs, some
embedded webviews, privacy modes) the ground would pin to dark and **the cream editorial
half of the design would never appear at all**. The identity cannot depend on an observer
that might not run.

## 11.9 Mobile (375 px)

- Nav collapses to a full-screen dark overlay; burger with `aria-expanded`, Escape closes.
- Hero caption stays ~16 px — readable, never a giant unusable word.
- Grid becomes one column; the proportion pattern is a desktop-only enhancement.
- **Featured interaction is tap** — verified opening the viewer via click with no pointer hover.
- Video is `preload="none"`; sources attach on intent only. Under `minimal` no preview video loads at all.
- Zero horizontal overflow.

## 11.10 Verified

| | |
|---|---|
| `astro check` | 0 errors |
| Build | 6 pages |
| `validate:data` | 0 errors |
| Overflow | none at 1440 px or 375 px |
| Contrast, cream ground | ink 12.09 AAA · dim 4.60 AA · oxblood accent 6.64 AA |
| Contrast, dark ground | cream 16.25 AAA · dim 6.71 AA · gold focus 10.16 AAA |
| Keyboard | Viewer opens/closes, focus returns to the trigger, Escape works |
| Reduced / minimal | Transitions off; preview video disabled under `minimal` |

**Not verifiable in this environment.** The preview pane does not run
`requestAnimationFrame`, does not fire `IntersectionObserver`, and does not advance CSS
transitions — confirmed directly (`rafRuns: false`). With transitions disabled the ground
swap resolves correctly to `rgb(12,12,12)` and `rgb(240,234,214)`, so the mechanism is
sound, but **scroll feel, the ground cross-fade, the loader and hover previews must be
judged in a real browser** — ideally on a phone.

## 11.11 Self-critique

Checked against the traps named in `DESIGN_REFERENCES.md` §6:

| Trap | Status |
|---|---|
| Generic AI look (a) cream + serif + terracotta | Avoided — condensed grotesque, four-colour system, no serif |
| Generic AI look (b) black + one bright accent | Avoided — the dark ground is a *mode*, not the whole site |
| Film-production cliché (fullscreen video everywhere) | Only the hero and two featured bands; the rest is editorial |
| Archive/retro cosplay | All archive furniture removed |
| Design-agency excess | No custom cursor, no WebGL, no scroll-jacking, no marquee |
| Excessive motion | Six moments in total; each has a reduced-motion form |
| Excessive typography | One display moment per section; uppercase confined to metadata |
| Stripe as gimmick | Four uses, all functional |

**Where it is still weak, honestly:** the two featured bands currently use the only two
projects with decent local footage. With 19 of 20 projects `MASTER_REQUIRED`, a real build
would either repeat the same films or fall back to stills. **This direction's ceiling is
set by the master media (request M1), not by the design.**

## 11.12 Questions for the owners

| # | Question |
|---|---|
| **N1** | Is the hero right now — film dominant, statement at caption weight? Or should the words go entirely and leave only the film? |
| **N2** | Is the cream/dark switching frequency right? Currently 7 changes down the page |
| **N3** | Is the grid's proportion rhythm (7/5, 4/4/4, full-width) the right amount of variation, or should featured moments be rarer? |
| **N4** | Does the viewer feel like *entering a project*, or should clicking navigate to a real page instead of an overlay? |
| **N5** | Stripe at four uses — still too many, or is it now too subtle? |
| **N6** | Barlow / Barlow Condensed / Space Mono in place: does this hold, or does Tatiana want to explore? |
| **N7** | Which film should open the site? **Answered provisionally in Review B**: neither. `We are NVF` carries a burned-in wordmark on almost every frame and a black "Coming soon" tail; the 2026 reel is wall-to-wall motion graphics. The hero is a 15 s clean run from `NVF Showreel` (71–86 s). Still needs a master (M1) and confirmation of which reel is current (M7) |
| **N8** | Sound on the hero — keep the opt-in control, or silent? |
