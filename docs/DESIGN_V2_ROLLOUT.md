# Design v2 rollout: Tatiana's identity (2026-10-22)

The site now wears Tatiana's design v2: the storyboard `teste- NVF.ai` (94 artboards) and
the screen recording `nextvision_entry.mp4`, which she sent after the meeting on the
22nd. The user approved a standalone prototype before any of it was built here. The plan,
the rule conflicts (C1–C8) and the decisions on them are recorded outside the repository,
in `next_vision_info/review/PLAN_design_v2_tatiana.md`.

**Content was not touched.** Every word on every page is still the live site's published
copy, verified by `validate:data`. Where the storyboard proposes new copy, it is listed in
§5 as an owner proposal and not published.

## 1. What changed

| Area | Before (Review B) | Now (design v2) |
|---|---|---|
| Menu | Top header with four links and a mobile menu | **Rail:** five stripes on the right edge, one per section in logo order. On a phone it is a bottom bar of five labelled tabs |
| Page frame | None | **Spine:** the section's tab on the left (language switch, "Let's talk" reel, section name, next-section arrow). On a phone it is a bar across the top |
| Sections | Portfolio / About / Services / Contact | Homepage `/` · About `/sobre/` · Commercial `/servicos/` · Cinema `/portfolio/` · **BTS `/bts/` (new)** |
| Navigation motion | Dissolve | **Slide:** the new page enters from the rail and the old one dims (`full` tier only). Back reverses it; contact drops in from the top |
| Rail hover | — | **Lights-down:** the page desaturates and darkens behind the rail |
| Opening | Four-colour bar, at most 900 ms | **Homepage:** fill → drop → HELLO → stand → travel → wipe. **Other pages:** the fill only |
| Homepage | Hero, work rows, feature, services, about, close | The film full-bleed, "We are NVF", the published statement, the cycling logo |
| About | Editorial cream page | Poster-size wordmark, story and close in two columns, LOVING EVERY FRAME, founders on a blue panel that slides in, a reel rolling with the scroll |
| Commercial | Ruled services list | Colour NVF, three-frame collage, each service set like "VIDEO PRODUCTION", a reel that rolls in and becomes LET'S TALK |
| Cinema | Composed contact sheet | **Shelf** (a VHS spine per project, one stood up as a poster) and **list** (thumbnail rows with a category-coloured rule), switched with `?view=list` |
| Contact | Form | The same form with numbered fields and stripe-coloured rules |
| Footer | One metaline | Black panel: NVF mark, the five sections plus contact as full-size links, then the legal links and socials as before |
| Palette | Sampled from `colors.png` | **The brand guide's p. 10:** green `#124A43`, blue `#2B3990`, red `#D52B27`, orange `#F36E21`, yellow `#F9C914`, cream `#FFFAEC` |
| Type | Barlow Condensed 500/700 | Barlow Condensed **300** (labels) and **900** (display) added; 8 faces, 110.8 KB |
| Cursor | System | Asterisk (the storyboard star — owners, 2026-10-29), red on cream, yellow on dark; a small arrow over the rail (mockup pp. 28–39). Native CSS, fine pointers only |

## 2. How the rule conflicts were resolved

| ID | Resolution | Where |
|---|---|---|
| C1 cursor | Native `cursor: url()` gated on `(hover: hover) and (pointer: fine)`, with no script. CLAUDE.md §11 amended to allow exactly this | `tokens.colour.css`, `chrome.css` |
| C2 grey-out | Two **sibling** fixed layers: a `mix-blend-mode: saturation` grey and a dark shade, faded by opacity. They must be siblings, because a blend mode inside an opacity-faded parent only blends with that parent's own group. Pure CSS (`:has(.rail:hover)`) | `chrome.css` |
| C3 navigation | Real pages. The slide is a `::view-transition` rule on the existing ClientRouter. The rail is its own named group, so it holds still | `chrome.css` |
| C4 contrast | Each section carries `--sec` / `--sec-ink`: cinema and contact take ink, the rest cream. Yellow is never text on cream | `tokens.colour.css` |
| C5 opening | Armed by the existing bootstrap (first document of a session, `full` tier). The long version is homepage-only. Click or any key skips it, and it is capped at the sum of its own tokens | `chrome.css`, `site-motion.ts` |
| C6 scroll reel | `animation-timeline: scroll(root)` / `view()` under `@supports`, `full` tier only. Without support the reel rests and the team panel is in place | `sections.css` |
| C7 font | American Typewriter is never used. The guide and the storyboard set it only on stray glyphs (20 spaces, a handful of letters) | — |
| C8 wordmark | The logo PDF rendered at 300–600 dpi with Ghostscript. Single-colour marks are **alpha masks** painted in `currentColor`; colour marks have the white keyed out. Still an interim until a vector exporter is available | `public/brand/`, `src/lib/brand.ts` |

## 3. A pre-existing defect found while building this

`data-motion` disappeared after the first client-side navigation. Astro's swap replaces
`<html>`'s attributes with the incoming document's. The served HTML has no tier, because the
bootstrap only runs on a full load. Every rule keyed on `:root[data-motion='full']` therefore
stopped applying from the second page on. This was found by reading `outerHTML` after a rail
click, when the slide played as Astro's default crossfade. Fixed in BaseLayout's
`astro:before-swap`: the tier is carried onto the incoming document's root. The slide was
then confirmed with `document.getAnimations()`: `nvf-slide-in` / `nvf-recede`, 900 ms each.

### 3.1 Found on a phone after the first deploy

- **The opening never played on a phone.** The `minimal` tier caught every device with ≤4 GB
  or ≤4 cores, which is most phones, and the opening was armed only at `full`. The tier now
  takes ≤2 / ≤2, and the opening is armed at every tier except `reduced`.
- **The PWA update prompt was hidden.** It sat under the phone's bottom rail, so an installed
  app could never be offered its new build.
- **A double top band** on the portfolio and project heads.
- **The hero's three lockups showed at once**, because they come from a child component and
  the page's scoped selectors matched nothing.
- **The sticky reels covered copy** on a phone.

## 4. What did not change, on purpose

- **Every route, canonical, hreflang pair, redirect and the sitemap.** BTS adds two URLs
  (54 in the sitemap).
- **Every published string, including the H1s that `validate:routes` asserts.** The
  homepage's `<h1>` is still the published statement; "We are NVF" is display type above
  it, taken from the live `<title>`.
- **The contact form's contract.** The storyboard's "Company/brand" field is NOT added,
  because the honeypot is already named `empresa`; adding it is a contract change (§5).
- **The founders' e-mails and phones from the storyboard are not published.** D2 is open,
  `validate:routes` forbids `mailto:` outside the legal text, and publishing a personal
  phone number needs both founders' agreement.
- **Category archives** keep their routes and filtering, and are now set as the Cinema list.

## 5. Waiting on the owners or Tatiana

Mirrored in `docs/BLOCKED_TODOS.md`.

- **New copy proposed in the storyboard:** the About lead and paragraphs ("A Next Vision
  Films é uma produtora audiovisual criada por dois parceiros…"), and the contact-sheet
  heading (which contains "SCREME", "WOHOLE" and "ALREDY").
- **Founders' roles:** "Co-Founder & Creative director" / "Co-Founder & Producer" differ
  from the live roles.
- **Assets:** the VHS spine artwork (the spines are drawn from titles until it arrives),
  the NOWHERE poster and project, Need to Talk, Agente Imobiliário, the About team-photo
  carousel, and a vector export of the logos.
- **Mobile:** not designed in the storyboard. The bottom-bar / top-bar adaptation here is
  ours, for Tatiana to confirm.
- **Contact "Company/brand" field:** needs the honeypot renamed first, then a contract change
  on both sides.
- **The dark state's text colour (C2 caveat):** the overlay darkens text along with
  everything else, where the storyboard turns it cream. A colour transition would need a
  §11 amendment.
