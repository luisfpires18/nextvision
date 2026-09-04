# Design References — Next Vision Films

**Date:** 2026-09-01
**Purpose:** extract reusable principles from the owners' reference sites, name the traps,
and put a small number of concrete visual directions in front of the owners for **Review A**.
**Produced with the `frontend-design` skill loaded.**

**This is not a layout document.** No final design is proposed here.

---

## 1. Inspiration vs. copying — the line we hold

We take **principles**: how attention is directed, how work is discovered, how motion
carries meaning, how restraint is used.

We do not take: layouts, component arrangements, colour schemes, cursor gimmicks,
signature effects, or copy voice. If a decision can be traced to one reference site's
distinctive execution, it is the wrong decision.

The test, applied to every choice: **would this look equally at home on a different
studio's site?** If yes, it is a default, not a design. NVF's identity has to come from
NVF's own material — the retro four-colour wordmark, the Portuguese informal voice, the
actual footage.

---

## 2. What the references actually run

Every site below was fetched and fingerprinted (2026-09-01). This is evidence for the
motion-stack decision in `ARCHITECTURE.md` §16, not guesswork.

| Site | HTML | Stack | Motion / scroll | Notes |
|---|---|---|---|---|
| **locomotive.ca** | 65 KB | no framework | **Locomotive Scroll**, canvas, video | They publish *"Why don't we use front-end frameworks"* — vanilla by conviction |
| **basicagency.com** | 180 KB | Next.js | custom cursor, video | |
| **stinkstudios.com** | 300 KB | Next.js | **GSAP** | Cookie consent gate on entry |
| thelinestudio.com | **1 614 KB** | Nuxt | **Lenis**, video | HTML weight is an anti-pattern |
| makemepulse.com | 124 KB | Nuxt | **GSAP**, **Three.js**, Lottie | WebGL-heavy |
| instrument.com | **3 423 KB** | Nuxt | GSAP, Three.js, **Barba**, Swiper, Lottie | 3.4 MB of HTML — extreme anti-pattern |
| hellomonday.com | 221 KB | — | **GSAP**, canvas, video | |
| cuberto.com | 150 KB | Webflow | **GSAP**, video | |
| tailormade.company | 855 KB | — | **GSAP**, video | |
| bruno-simon.com | 57 KB | — | **Three.js**, physics, canvas | A 3D toy; a portfolio-as-game |
| resn.co.nz | **4 KB** | — | — | Empty shell → fully client-rendered |
| activetheory.net | **6 KB** | — | — | Empty shell → fully client-rendered |
| hidden-agency.com | 20 KB | — | — | |
| dogstudio.co | 57 KB | WordPress | — | |
| studioacker.com | 181 KB | — | — | |
| wonderlandams.com | 65 KB | Nuxt | Swiper, canvas, video | |
| **promenade.pt** 🇵🇹 | 56 KB | WordPress | **GSAP** | Film production |
| **mariaemayer.com** 🇵🇹 | 74 KB | WordPress | **Lenis**, custom cursor, video | Film production |
| blueboypictures.com 🇵🇹 | 597 KB | React | **native View Transitions**, Swiper, Lottie | Film production |
| brocinema.com | 26 KB | — | video | Film production |
| fadofilmes.pt 🇵🇹 | 376 KB | Squarespace | **Barba** | Film production |
| osomeafuria.com 🇵🇹 | 54 KB | Next.js | — | Film production |
| ukbarfilmes.com 🇵🇹 | 52 KB | WordPress | Swiper, Lottie | Film production |
| fi.co | 183 KB | — | video | **See §7 — this looks like a mistaken reference** |

**Three conclusions fall straight out of this table:**

1. **GSAP is the industry default for this genre** — Stink, makemepulse, Instrument, Hello Monday, Cuberto, tailormade, and Promenade (a Portuguese film company).
2. **Smooth scroll means Lenis now.** Locomotive still runs their own library on their own site; The Line and Maria & Mayer — the closest genre match — use **Lenis**, the modern successor.
3. **WebGL appears only in the non-film references.** Not one film-production site in this list uses Three.js. For a production company, **the footage is the spectacle**; a WebGL layer competes with it and costs battery, bandwidth and accessibility. This is the single most important negative finding.

---

## 3. Deep read — the three primary references

### 3.1 locomotive.ca — *structure as confidence*

Observed: a black loading state with a **text-scramble** animation resolving into the
wordmark, then a homepage that opens on **featured work immediately** — five named
projects set in very large type, each a full row, with "Read more about this project" as
the only affordance. The agency's own manifesto comes *after* the work. Navigation is a
menu (Work / Agency / Careers / Let's talk), not a permanent bar. The footer is dense and
editorial — real address, telephone, newsletter, social, plus culture and articles.

**Principles worth taking**

- **Work first, words second.** The site's argument is the work; the copy is a footnote to it. NVF's current homepage does the opposite — two paragraphs of positioning before any project appears.
- **Project titles as the primary typographic event.** No card chrome, no thumbnails-in-boxes. The title *is* the interface.
- **A menu, not a nav bar.** Frees the viewport for full-bleed media.
- **A footer that behaves like a colophon** — a real place, real contacts.

**Not taking:** the emoji-studded voice, the store, the text-scramble loader as-is (§6).

### 3.2 basicagency.com — *restraint plus one device*

Next.js, video-led, with a **custom cursor** as the single signature interaction. Very
little decoration otherwise.

**Principles worth taking**

- **Spend boldness once.** One memorable interaction, everything around it disciplined.
- Video used as texture behind type, not as a boxed "hero video widget".

**Not taking:** the custom cursor itself. It is desktop-only, it is the most-copied device
in this genre, and it would read as borrowed rather than authored (§6).

### 3.3 stinkstudios.com — *near-zero chrome, GSAP-driven*

Black ground, mono type, a genuine cookie-consent gate before content. Extremely spare.

**Principles worth taking**

- **Monospace as the utility voice** for labels and metadata — which maps exactly onto NVF's supplied Space Mono and onto film-production vernacular (slates, timecode, EDLs).
- **Consent handled honestly and early** — relevant, since NVF must fix exactly this (audit §9.17).

**Caution:** a full-screen consent gate before any content is a bounce risk and hurts LCP.
Prefer a non-blocking banner.

---

## 4. The film-production references — the closest genre match

These matter more than the agency sites, because they solve NVF's actual problem.

### promenade.pt 🇵🇹
Homepage = **one fullscreen film, one line of positioning, and an `UNMUTE` control.**
Total visible copy: *"The new wave of next gen filmmakers."* Nothing else.

This is the purest expression of the pattern: **the reel is the homepage.** And `UNMUTE`
is the correct audio affordance — muted autoplay with an explicit, visible opt-in to
sound. Never the reverse.

### mariaemayer.com 🇵🇹
A **marquee of capability words** (`Film Production — Lisbon — Cinema — TV — Publicidade —
Documentário — Ficção`), then **numbered sections**: `01 / Últimos Projetos`,
`02 / Quem Somos`. Lenis smooth scroll, custom cursor.

The marquee is smart: it states positioning, place and services in one glanceable band
without a paragraph. Directly transferable in spirit to NVF, whose services and categories
are currently buried in two mismatched taxonomies.

**Caution on the numbering.** `01 / 02 / 03` is one of the most over-used devices in this
genre. It earns its place only when the content genuinely is an ordered index. On NVF it
would have to encode something real — a reading order, or a production sequence — or it is
decoration.

### blueboypictures.com 🇵🇹
Uses **native View Transitions**. Evidence that the platform API is viable in production
for exactly this kind of site.

### fadofilmes.pt / osomeafuria.com / ukbarfilmes.com / brocinema.com 🇵🇹
Between them: Barba page transitions, a Next.js films index, and — in brocinema's case —
a 26 KB page that is essentially video and nothing else. The Portuguese film sector's
house style is **spare, dark, film-forward, low-chrome**.

---

## 5. Extracted principles, by axis

| Axis | Principle to adopt for NVF | Evidence |
|---|---|---|
| **Visual hierarchy** | Work before words. The first meaningful thing is footage or a project title, never a positioning paragraph | Locomotive, Promenade, Stink |
| **Navigation philosophy** | Menu overlay rather than a permanent bar; free the viewport for media. Persistent access to *Work* and *Contact* only | Locomotive, Basic |
| **Typography** | Two voices: a heavy condensed display for titles, monospace for metadata. Type does the work that cards do elsewhere | Stink, Maria&Mayer |
| **Hero behaviour** | Fullscreen muted loop + one line + an explicit unmute. No boxed "video widget" | **Promenade** |
| **Project discovery** | One index containing everything, with filtering — not five separate archives you must visit in turn | Locomotive "All Work" |
| **Project-page storytelling** | Alternating full-bleed media and narrow text; credits as a formal block at the end | Film-sector norm |
| **Use of video** | Video as ground and texture, not as an inset element | Promenade, Basic, Hello Monday |
| **Hover behaviour** | Hover reveals the moving image; it must never be the *only* route to information | Locomotive, Cuberto |
| **Cursor interaction** | A small contextual affordance at most (e.g. a "play/scrub" hint over a frame). **Never** a bespoke cursor replacing the system one | Basic, Maria&Mayer — as a caution |
| **Transitions** | Continuity, not curtains: the clicked frame becomes the next page's hero | blueboypictures (View Transitions) |
| **Loaders** | A short branded hold that covers real asset loading and never exceeds it | Locomotive |
| **Scroll behaviour** | Lightly damped smooth scroll, sub-1 s settle. Never scroll-jacking or hijacked direction | Lenis on The Line, Maria&Mayer |
| **Negative space** | Generous and *consistent* — one section rhythm, not the current 63–224 px drift | Stink, Promenade |
| **Editorial layout** | Asymmetry with a reason: media weight left/right against a stable text column | Locomotive |
| **Motion rhythm** | Few, deliberate moves with a shared easing and duration family. Cinematic = considered pacing, not more animation | All strong references |
| **Mobile adaptation** | Every hover behaviour has a non-hover equivalent; heavy effects are removed, not merely scaled down | — |

---

## 6. Anti-patterns — impressive, but wrong for NVF

Ranked by how likely they are to be requested.

| Pattern | Seen in | Why it is wrong here |
|---|---|---|
| **WebGL / Three.js scenes** | makemepulse, Instrument, bruno-simon | Large runtime, GPU and battery cost, poor on mid-range Android, hard to make accessible, and **it competes with the footage**. No film-production reference uses it. Excluded |
| **Client-rendered shell** (4–6 KB HTML) | resn, activetheory | SEO is an explicit requirement. A shell that renders nothing without JS forfeits it. Excluded |
| **Multi-megabyte HTML** | instrument (3.4 MB), thelinestudio (1.6 MB) | Directly against the performance mandate. Hard budget in `ARCHITECTURE.md` |
| **Bespoke cursor replacing the system cursor** | basic, mariaemayer, cuberto | Desktop-only, invisible on touch, an a11y and pointer-precision problem, and the single most copied device in this genre. At most a small contextual hint that never carries unique information |
| **Scroll-jacking / forced horizontal navigation** | common in the genre | Breaks find-in-page, keyboard paging, screen readers and trackpad expectations. Excluded |
| **Long text-scramble / percentage loaders** | locomotive | Acceptable **only** if it masks genuine loading, is capped (~1.2 s), is skipped on repeat visits, and is bypassed under reduced motion. Never an artificial delay |
| **Heavy full-screen page-transition curtains** | Barba-driven sites | Anything over ~400 ms reads as slow. Must never delay LCP on a cold entry |
| **Autoplaying audio** | — | Never. Muted autoplay with a visible unmute, as Promenade does |
| **Infinite marquees** | mariaemayer | Cheap in CSS and effective, but must pause under reduced motion and must not be the only place information appears |
| **`01 / 02 / 03` section numbering** | mariaemayer and much of the genre | Only if the content is genuinely a sequence. Otherwise it is decoration wearing the costume of structure |
| **Blocking cookie gate before content** | stinkstudios | Bounce risk and an LCP penalty. Non-blocking banner instead |
| **Hover-only information** | Locomotive, Cuberto | Already NVF's bug today (audit §9.8). Every hover reveal needs a touch and keyboard equivalent |

---

## 7. Reference flagged for the owner

**`fi.co`** resolves to the **Founder Institute**, a startup accelerator — not a design or
production studio. Either the URL is a typo or it was included for a specific reason we
cannot see. **Please confirm** before we read anything from it. It is excluded from the
analysis above.

`lapa.ninja` (a Webflow-template gallery) and the Readymag examples were listed as
resources rather than references; they are treated as mood input, not as principle sources.
**The Readymag examples have not been supplied to this workspace** — if they matter, please
share them before Review A.

---

## 8. Three possible visual directions for Review A

Deliberately distinct — not three shades of one idea. Each keeps the brand's own four
colours (`#EFB025` gold, `#D54B27` rust, `#982703` oxblood, `#3D7D70` teal, sampled from
the owners' `colors.png`) and each is compatible with a later typography change by Tatiana.

> **A trap named up front.** The two most common AI-generated looks right now are
> (a) warm cream + high-contrast serif + terracotta accent, and (b) near-black with one
> bright accent. NVF's existing palette sits on top of (a); the entire cinematic reference
> set sits on top of (b). **Neither pole is safe by default.** What keeps NVF out of both is
> the thing neither default has: a **four-colour retro system** that is genuinely theirs,
> and the striped wordmark it comes from.

### Direction 1 — **Projection**

*The site is a dark room. The work is the light.*

- **Ground:** near-black. Cream stops being the background and becomes **paper** — overlaid editorial panels carrying text, like a programme note in a cinema.
- **Colour:** the four brand colours appear almost nowhere, then arrive as a full stripe at section boundaries and on the project index. Scarcity gives them force.
- **Type:** small, quiet, condensed. One typographic event per screen.
- **Motion:** slow dissolves, held frames, a projector-shutter cadence on transitions.
- **Hero:** fullscreen reel, one line, explicit unmute (Promenade's lesson).
- **Risk:** closest to the genre default (b). Survives only if the cream-paper panels and the stripe are executed with real conviction. **Highest chance of looking like everyone else if under-designed.**

### Direction 2 — **Contact Sheet**

*The film lab, not the cinema.*

- **Ground:** the brand cream stays. The site is organised like a photographic contact sheet / archive.
- **Structure:** dense grids of 16:9 frames, sprocket-hole rhythm in the margins, mono metadata under every frame, a colour band per category taken from the wordmark stripe.
- **Type:** condensed caps for titles, Space Mono doing genuine work — dates, durations, categories, roles.
- **Motion:** precise and mechanical, like film advancing frame to frame. Snappy, not floaty. Deliberately *unlike* the soft-parallax house style.
- **Hero:** a single frame that expands, rather than a fullscreen reel.
- **Risk:** density must not become clutter. Rewards a large catalogue — and NVF's 20 projects plus six unpublished pieces is enough.
- **Why it is the most defensible:** it is derived from the brand's actual retro identity and lands on **neither** AI default.

### Direction 3 — **Slate**

*Production vernacular, taken literally.*

- **Ground:** high-contrast, split — ink and cream in hard-edged fields.
- **Structure:** the clapperboard as an organising grid. Running timecode as a live interface element. The four brand colours used as **department colour-coding** — ficção, moda, corporativo, casamentos, storytelling.
- **Type:** heavy Barlow Condensed caps, stencil-like, at scale. Space Mono everywhere information is technical.
- **Motion:** hard cuts, snap transitions, a slate-clap moment on page entry.
- **Risk:** highest. Bold and unmistakably film-industry, but it can tip into pastiche, and it constrains a future typography change more than the others.

**Recommendation for Review A:** develop **Direction 2** as the primary and **Direction 1**
as the counter-proposal. Direction 3 is worth one board as a provocation — it is where the
strongest identity lives if the owners want to be brave, and it is the one Tatiana's
involvement could most improve.

---

## 9. What Review A must settle

1. **Ground: dark or cream?** This is the single largest fork and everything else follows it.
2. **Direction: 1, 2, 3, or a hybrid** — and which one Tatiana develops.
3. **How literal may the film vocabulary be?** Sprocket holes and timecode: identity, or costume?
4. **Is the wordmark stripe promoted to a system?** Today it exists only inside a raster logo.
5. **Does typography stay Barlow / Barlow Condensed / Space Mono, or is it open?** Architecture assumes it is changeable either way.
6. **Do the six unpublished pieces and the 2026 showreel enter the portfolio?** (`SMASH_MEDIA_INVENTORY.md` §6.)
7. **Is a vector logo available?** `NextVisionFILMS.svg` exists in the WordPress library but is unused, and the header currently ships a 417×130 PNG.
8. **Confirm or drop `fi.co`; supply the Readymag examples** (§7).

---

## 10. Standing rule for all design work on this project

From the `frontend-design` skill, and binding here:

> Spend boldness in one place. Let the signature element be the one memorable thing, keep
> everything around it quiet and disciplined, and cut any decoration that does not serve
> the brief.

For NVF the signature will be **how a project is entered** — the moment a frame becomes a
film. Everything else stays quiet. Any second candidate for "the memorable thing" is a
candidate for deletion.
