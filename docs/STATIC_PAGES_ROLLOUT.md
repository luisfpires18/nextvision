# Phase 10 — the remaining Portuguese pages

**Date:** 2026-09-03 (session 11) · **Status:** ✅ COMPLETE
**Scope:** `/sobre/` · `/servicos/` · `/contactos/` · `/obrigado/` ·
`/termos-e-condicoes/` · `/politica-de-privacidade/`

Every Portuguese route the live site serves is now a real production page. There is no
scaffolding left anywhere on this site: 38 built pages, 33 canonical routes, 0
placeholders, 0 horizontal overflow across 30 viewport/page combinations.

This is **propagation, not design**. The approved system — Contact Sheet editorial,
Projection for cinematic moments, the cream/dark duality, Barlow Condensed / Barlow /
Space Mono, the four-colour language, cut · dissolve · reveal · hold — is applied. No new
visual direction was explored and none was needed.

---

## 1. What each page is

| Route | Ground | Opens with | Carries |
|---|---|---|---|
| `/sobre/` | cream throughout, dark close | the company's own statement | origin story · two real portraits · the closing statement · the portfolio |
| `/servicos/` | cream, dark close | `Serviços` and the marked lead | the four services in full |
| `/contactos/` | **dark**, then cream | the page's own 1640px banner | phones, socials, and the form |
| `/obrigado/` | cream | `Obrigado` | the published message and one way onward |
| `/termos-e-condicoes/` | cream | `Termos e Condições` | eight lettered sections, anchored |
| `/politica-de-privacidade/` | cream | `política de privacidade` | ten sections, an index that finally resolves, the cookie table |

**`/contactos/` is the only static page that goes dark**, and the reason is the rule the
site already runs on: the ground follows the frame. It is the one page here with a
photograph wide enough to be a plate — 1640 × 644, and it is a real picture of the two
people whose company this is. Everywhere else the reader is reading, so the ground is
cream.

---

## 2. `/sobre/`

### Source

`docs/source-archive/pages.json` → `/sobre/`, and the two archived photographs.

### The hierarchy is not the live page's

`/sobre/` publishes `Sobre Nós` as its `<h1>` and `De uma ideia a um movimento.` as the
`<h2>` under it. Here the label is the eyebrow and **the statement is the `<h1>`**. Both
strings are published, neither is changed, and the reordering is exactly the presentation
change CLAUDE.md §2 allows. The `<title>` is untouched:
`Sobre - We are NVF - Produtora Audiovisual`.

### The people

Both archived portraits are used, at their own aspect ratios — 1.25 landscape and 0.74
portrait — and neither is cropped to match the other.

They are the same height anyway, because the **columns are the aspect ratios**:

```
equal height  ⟺  ratioₙ / ratioₘ = colₙ / colₘ        (decision A37)
grid-template-columns: minmax(0, 1.2515fr) minmax(0, 0.7392fr)
```

The track list is written by the page from the media manifest, never typed (decision
A75), so the relation holds at every width and for any number of people. A `1fr 1fr` grid
left the landscape frame 125 px short of the portrait and put a hole under its caption —
the exact failure the relation exists to prevent, and it was visible in review before it
was fixed.

**The pairing is the source's.** The live page places the 836 × 668 photograph beside
Francisco Cardoso's name and the 700 × 947 one beside Helder Afonso's. We reproduce that
relation and assert nothing beyond it. **Open question P1** below.

### The dark moment that was considered and cut

The live `/sobre/` runs `We-are-NVF-copia.mp4` as a background video, so the material for
a Projection band behind the closing statement exists. It was **checked frame by frame
rather than assumed**: the file carries a burned-in `We are NVF` wordmark on *every* frame
plus a burned-in caption strip across its lower third. Text over text. So the page has no
dark band, and the reason is a measurement rather than a preference.

### Two things the live page does that this one does not

- It prints the `Consultar Portfólio` button **twice** in the same section. Once is enough.
- It repeats the closing block the homepage already carries. Here the closing runs once,
  on the page whose material it is — and the invitation heading comes *before* the prose
  it introduces rather than after it.

### The four-colour rule

`colors.png` is published twice on the live `/sobre/` and is the source of this site's
entire accent palette. It returns here as the rule **between the story and the people** —
so it does structural work as well as identity work, which is the only kind of ornament
this site allows. It is `aria-hidden`: the four colours carry nothing the page does not
also say in words.

---

## 3. `/servicos/`

### Four services, not five categories

`Ficção`, `Visual Storytelling`, `Casamentos`, `Corporativo` and `Moda & Identidade` are
portfolio **taxonomy**. `Produção de Vídeo`, `Publicidade & Branding`,
`Eventos & Experiências` and `Documentários & Storytelling` are the **services**. The live
site publishes both lists and they do not correspond (audit §3.5). Nothing on this page
mentions a category: merging the two would invent an offer the company does not make.

### The signature, and it is the source's own

The live page sets three phrases of its lead on a **yellow ground** — `transformar`,
`ideias`, `visão autêntica`. That published emphasis is reproduced, and it is the one
place on this site where gold behaves exactly as the token rules require: a **surface**
with ink on it at 7.56:1, never text (ARCHITECTURE §5.2). Nothing else on the page is
marked.

`scripts/validate-data.mjs` asserts that the marked segments still concatenate to the
published sentence character for character, so an emphasis can never quietly become an
edit.

### The lead image

`servicos3NextVision.jpg` is the page's own photograph and its own `og:image`. The
original is **624 px wide — the whole file** — so it takes a column and never the page.
Nothing is upscaled to fill a layout (decision A76).

### What is not here

The live page ends with a form whose heading reads `Vamos Conversar!` and whose submit
button reads `Subscrever Newsletter` (decision D10, audit §3.5). The newsletter has no
known destination (**D18**) and no endpoint — Phase 13 built the CONTACT endpoint only,
and this one waits on D18. So the published
invitation is rendered as what it says — an invitation to make contact — and the control
goes to `/contactos/`. **A control is rendered only when it controls something**
(decision A41); a dead newsletter form under `Vamos Conversar!` would be reproducing the
live site's own confusion.

No icon cards, no feature grid, no process diagram, no numbered method. The source
describes four services and no sequence.

---

## 4. `/contactos/`

### Published order, preserved

Live: title, lead, paragraph, the contact details, the cost note, `Formulário`,
`Contacto Directo`, its paragraph, the form. That order is kept.

`Contacto Directo` stays where the source puts it — introducing the form, which is what
its own paragraph says it does — and becomes an `<h3>` under `Formulário` rather than a
second `<h2>` beside it. A heading level is structure, not copy (CLAUDE.md §2.1).

**No heading was invented for the contact details.** They sit in the opening section,
under the paragraph that introduces them, exactly as they do on the live page.

### The email is missing on purpose — D2

| Where | Address |
|---|---|
| `/contactos/`, displayed | `nextvisionfilmsagency@gmail.com` |
| `/contactos/`, the `mailto:` on that same element | `hello@nextvisionfilms.com` |
| The live footer | `hello@nextvisionfilms.com` |
| **`/termos-e-condicoes/` §h — new evidence this session** | **`geral@nextvisionfilms.com`** |
| `/politica-de-privacidade/`, for data-subject requests | `hello@nextvisionfilms.com` |

**Three addresses**, and no way to tell which one is read. None is published as a contact
route, `Organization.email` is omitted from the structured data on every page, and
`npm run validate:routes` fails the build if any page outside the legal documents prints
one or offers a `mailto:`.

**The slot is reserved, not removed.** `ContactDetails.astro` renders the address the
moment `emailStatus` becomes `confirmed` in `src/content/settings/site.yml`. Answering D2
is **one word in one content file** — no component changes.

Two things are published and unambiguous, and both are now usable: the **phone numbers**
are `tel:` links (the live page prints them as plain text inside an `<h3>`), and the three
**social destinations** are links.

### `#contactar`

The live homepage CTA targets `/contactos#contactar`. That anchor exists here, on the form
section, and lands correctly under the fixed header.

---

## 5. The contact form

> **Phase 10 built the markup and left it inert. PHASE 13 turned it on.** The endpoint,
> Turnstile and the delivery seam are recorded in `ARCHITECTURE.md` §7; what follows is
> the FORM — what Phase 10 preserved, and the three things Phase 13 added to it.

### What is preserved — unchanged by Phase 13

The **field structure of the live Elementor form, exactly**:

| Field | Type | Required | Notes |
|---|---|---|---|
| `nome` | text | no | label `Nome` |
| `email` | email | **yes** | label `Email` — the only required field, as published |
| `telefone` | tel | no | label `Telefone` |
| `mensagem` | textarea | no | label `Mensagem` |
| `consentimento` | checkbox | **no** | `Declaro que li e que aceito a Política de Privacidade.` |
| `empresa` | text, off-screen | no | the honeypot the live form already has |
| submit | button | — | `Enviar` |

Nothing was added, nothing dropped, and nothing was made required that was not. **The
server enforces exactly this**, not a stricter version of it: `email` alone is a valid
submission, and `npm run test:forms` asserts that as a case of its own.

### What is fixed, with no word changed

- Every field has a real `<label>` carrying the published word. The live form labels
  fields with a **placeholder alone**, so a screen reader reaches four unnamed inputs and
  a reader who starts typing loses the label. The placeholder is dropped, because the
  label now prints that word — the published string still appears exactly once.
- `Política de Privacidade` in the consent label is a **link to the page it names**.
- 24 px checkbox (WCAG 2.2 target size), 44 px controls, visible focus on both grounds.

### D9 is still open, and is enforced rather than remembered

Should the GDPR consent checkbox be **required**? The live form does not require it, the
architecture recommends requiring it, and making a legal obligation stricter than the one
the owners published is theirs to decide.

So the published answer stands, in ONE place — `CONSENT_REQUIRED` in
`src/config/forms.ts`. It drives the `required` attribute in the markup and the check in
the endpoint at the same time, so the two can never disagree, and
`npm run validate:routes` fails the build if the rendered checkbox ever carries `required`
while the flag says otherwise. Answering D9 is one boolean.

### PHASE 13 — three additions to the markup, and nothing else

1. **A hidden `locale`.** The SERVER decides which thank-you page an accepted submission
   lands on; this only tells it which language asked. Choosing the destination in the
   browser is how a form ends up redirecting to a success page it has no evidence for.
2. **The Turnstile container.** Mounted by the page's own script with an explicit render
   rather than by the auto-scanning `cf-turnstile` class — the script re-runs on every
   `ClientRouter` swap, and an auto-scanner would mount a second widget into the same
   container each time. It writes the hidden `cf-turnstile-response` input the endpoint
   verifies with Cloudflare on every submission. The site key is **public by definition**;
   the secret never leaves the Worker, and `validate:routes` fails the build if any
   key-shaped string other than the declared site key appears in either document.
3. **One polite live region and one `<noscript>` line.** The server returns an outcome
   CODE; the page says it in its own language from a table serialised into the document.
   Fourteen strings per locale, authored (the live site has no error states to preserve).

The submit control is now **enabled at rest** and disabled only for the duration of a
request — the browser's own way of saying "already sent".

### `/obrigado/` is the answer to a POST, not a link

Nothing in either contact document links to the thank-you page, the client script has no
optimistic redirect, and the only `location.assign` in it runs when the endpoint has
answered `accepted`. **`npm run validate:routes` fails the build if a link to `/obrigado/`
ever appears on the page** — a frontend that can reach the success page on its own is a
frontend that can fake a delivery, and that is the most expensive defect this form could
ship. An unconfigured provider produces a 503 and a visible failure, never a thank-you.

### The cost of choosing a challenge, stated plainly

With scripting off the form still has a real `action` and `method` and still posts — and
**it will be refused**, because Turnstile cannot issue a token without scripting. The
`<noscript>` line says so before anyone types, rather than letting them write a message and
discover it on submit. ARCHITECTURE §7.2 amends the "works without JavaScript" claim there
rather than dropping it quietly here.

---

## 6. The legal pages

### The text is not transcribed — it is derived

23 000 characters of Portuguese contract and privacy law are the one part of this site
nobody may edit, and the surest way to break that rule is to retype them. So they are not
retyped. `scripts/build-legal.mjs` reads the preserved WordPress HTML in
`source-archive/wordpress/html/`, walks the elements it actually contains, and writes
`src/content/legal/*.md`. Run it with `npm run legal:build`.

### What presentation changed, and it changed no words

| Change | Why it is structure, not copy |
|---|---|
| `<h4>` → `<h2>` | The pages jump `h1 → h4` today (audit §8.9). CLAUDE.md §2.1 names correcting a heading level as a structural fix |
| `<p><strong>a) …</strong></p>` → `<h2>` | On `/termos-e-condicoes/` the eight lettered sections exist only as bold runs, four of them sharing a paragraph with their own body text. The page is one unbroken block today |
| `<br />` → paragraph break | WordPress used one paragraph with line breaks where the document has distinct clauses |
| Headings gained an `id` | Nothing is added to the text; the sections became linkable |
| The ten `Navegação` links repointed | See below |

`/termos-e-condicoes/` gets **anchored headings and no visible index**: the page does not
publish one, and adding a visible index would mean writing a label the source does not
have.

### The migration fix — D4

The live `/politica-de-privacidade/` publishes its own `Navegação` index: ten links, the
reader's only way into a 15 000-character document. **All ten point at
`https://www.digiup.me/politica-de-privacidade/`** — another company's policy (audit §9.4).

They now resolve in-page, with the **same ten labels and the same ten fragment names** the
source already used, so the only thing that changed is the origin:

| Label | Fragment (the source's own) |
|---|---|
| Acerca desta Política de Privacidade | `#acerca-politica-privacidade` |
| Que informação recolhemos acerca de si? | `#informacao-recolhida-acerca-de-si` |
| De que forma usamos a informação sobre si? | `#de-que-forma-usamos-informacacao` ¹ |
| Marketing | `#marketing` |
| Acesso e correção da sua informação | `#correcao-da-sua-informacao` |
| Cookies | `#cookies` |
| Outros websites | `#outros-sites` |
| Segurança | `#seguranca` |
| Alterações a este comunicado de privacidade | `#alteracoes-comunicado-privacidade` |
| Contactos | `#contatos` |

¹ The typo is the source's. Keeping the fragment names exactly is what makes the
repointing traceable to what it replaced.

**Only the navigation mechanics changed.** Every word of the policy is untouched —
including the paragraph naming *Digiruptiva – Digital Agency, Lda.* as the data controller
and `hello@digiup.me` as its contact, which is a statement about who processes the data
and not a broken link.

### Reading

One column at `--w-text` (68 ch), ruled section headings, the cookie table scrolling inside
its own box, oxblood links with a real underline, list markers in the brand accent, and a
`@media print` block that drops the interface and prints link destinations. **No reveal,
no ground change, no smooth-scroll flourish inside the document.** A reader looking for
clause f) is not here for a performance.

One defect found and fixed while testing the anchors: the legal stylesheet declared its
own `scroll-margin-block-start` on top of the site's `scroll-padding-block-start`. The two
are **additive**, so an anchored clause landed 160 px down instead of 76. The site declares
that offset once, on `<html>`; the second declaration is gone. One authority per question.

---

## 7. The legal integrity mechanism

`npm run validate:legal` — wired into `npm run verify`, so it runs on every build.

The check has to tell "the presentation changed" apart from "the wording changed". It does
it in one move:

> **compare the two documents with all whitespace and all markup removed.**

A heading level, a paragraph split, an `id`, a list, a table, a repointed anchor — all
vanish under that normalisation and pass. A changed, added or deleted **word** survives it
and fails. There is no threshold and no tolerance.

Two independent guarantees:

1. **The archive is unchanged.** `docs/content/*.txt` is the read-only canonical extract.
   Its SHA-256 is recorded in `docs/content/legal-source.lock.json` (`npm run legal:lock`).
   If the baseline itself moves, that fails here rather than silently redefining
   "verbatim".
2. **Production matches the archive.** `normalise(title + body)` must equal
   `normalise(archived text)`, character for character. 5 967 and 13 232 normalised
   characters compared.

Plus: every in-page privacy anchor resolves to a section that exists, and no navigation
link has gone back to digiup.me.

### It was tested by breaking it

| Test | Result |
|---|---|
| One word added to the production privacy text | **FAIL**, quoting both sides at the exact divergence |
| Heading level changed, a paragraph split, attributes added, a Markdown list rewritten as raw HTML | **PASS** — markup only |
| One character changed in the read-only archive | **FAIL**, naming the file and both checksums |
| One `Navegação` link sent back to digiup.me | **FAIL**, twice — the anchor count and the off-site link |

### The rest of the content, too

`npm run validate:data` gained a general version of the same idea. Every string this site
prints as content declares **where it was published** — `v('…', '/sobre/')` — and the
validator checks that claim against the Phase 0.5 archive rather than trusting it.
**37 strings across three files**, verified word for word, including the form's own field
labels (matched against the archived form) and the string published on every project page
(matched against any of them).

It reports the count per file and fails if any file yields **none** — because a validator
that passes because it found nothing is worse than no validator. There is no magic total.

---

## 8. `/obrigado/`

The published message, one way onward, nothing else. It is a state, not a destination, and
elaborating a success screen is designing for a moment nobody looks at for two seconds.

**PHASE 13 wired it, and only the server may reach it.** The contact endpoint answers
`303 -> /obrigado/` — or `/en/thank-you/` — when, and only when, a delivery provider has
reported that the message went. Nothing on the contact page links here, and
`npm run validate:routes` fails the build if anything ever does: the page still makes no
claim of its own, it is now only shown to people for whom the claim is true.

`a sua mensagem` is formal where the rest of the site is informal (`a tua história`). That
is the live site's own inconsistency (decision D10, audit §3.7) and it is preserved.

Left **indexable, as published**. A thank-you page in the index is a wart rather than a
broken state, and changing `robots` on an already-indexed URL is an SEO decision for the
SEO phase, not a side effect of building the page.

---

## 9. Media used

All four images are the pages' **own published photographs**, taken from the Phase 0.5
WordPress archive. Nothing is sourced by resemblance and nothing is borrowed from the
portfolio. Built by `npm run review:media` (step 6/6), every ladder capped at the
original's width so none of them is upscaled.

| Key | Source | Natural | Widths | Total |
|---|---|---|---|---|
| `team/francisco-cardoso/portrait` | `2025/08/WhatsApp-Image-2025-08-07-…jpg` | 836 × 668 | 420, 836 | 37 KB |
| `team/helder-afonso/portrait` | `2025/02/Helder-Afonso-1-scaled-…jpeg` | 700 × 947 | 350, 700 | 41 KB |
| `pages/servicos/lead` | `2025/02/servicos3NextVision.jpg` | 624 × 416 | 312, 624 | 19 KB |
| `pages/contactos/banner` | `2025/04/banner-contactos-2-…jpg` | 1640 × 644 | 820, 1200, 1640 | 110 KB |

All four ship `alt=""`, as the live site does. **Alt text is authored copy** and is
owner-reviewed in the copy phase; it is recorded as a gap (`altStatus: 'todo'`), never
written here.

`colors.png` is **not** shipped as an image. The four-colour language it defines is
already the site's own stripe, and it appears on `/sobre/` as a rule rather than as a
100 × 22 PNG.

---

## 10. Content moved out of the homepage, and content left out of these pages

The homepage shows a **selection**. These pages are where the rest of the published copy
finally lives.

| Copy | Homepage | Here |
|---|---|---|
| The About origin story (`A NVF nasceu entre câmaras…`) | not shown | `/sobre/`, in full |
| The rest of `Não somos apenas videógrafos…` | first sentence only | `/sobre/`, in full |
| The About closing statement, four lines | not shown | `/sobre/` |
| The services lead | first sentence | `/servicos/`, in full, with the published emphasis |
| The four service descriptions | one sentence each | `/servicos/`, in full |
| The team's roles and social links | names and roles only | `/sobre/`, with portraits and links |
| The `/contactos/` paragraph and phone note | shown | `/contactos/`, with the phones dialable |
| `Formulário` / `Contacto Directo` and the form | not shown | `/contactos/` |
| Both legal documents | footer links only | their own pages, verbatim |

**Deliberately still not shown anywhere:** the four testimonials (D11) and the newsletter
block (D18). Both are on the live site; both are open owner questions, and neither has a
destination.

---

## 11. Shared components — what changed for everyone

| Change | Effect |
|---|---|
| `BUILT_PAGES` now lists every route | Header and footer links resolve to real pages. No navigation item falls back to a homepage section any more |
| The footer renders the two legal links | They were declared in `navigation.yml` from the start and held back until the pages existed |
| Services and the team moved into content collections | `/`, `/sobre/` and `/servicos/` read one source, so they cannot disagree about what the company offers or who works there. The homepage's rendered output is **byte-identical** apart from the four link changes above |
| The homepage excerpt rule moved into the schema | `excerpt` must be a literal substring of `description`, enforced by `astro check` and `astro build` rather than by a text scan (decision A44, now structural) |
| `ContactClose`'s CTA | goes to `/contactos/` instead of `#contacto` |

### One real defect found in the shared header, and fixed

**The open mobile menu covered its own close button.** The full-screen overlay is a child
of the header and painted above it, so on a phone the menu could be dismissed only by
navigating away — Escape works, but a phone has no Escape key. The header's brand and
toggle are now raised above the overlay they summon (`--z-menu-controls`), which also
keeps the brand visible so the menu reads as a panel under the header rather than as a
different screen. Verified by hit-testing the toggle's own centre while the menu is open.

This was pre-existing, from Review B, and would have shipped.

---

## 12. Verification

```
astro check            0 errors, 0 warnings (68 files)
astro build            38 pages
validate:data          10 ok, 4 warnings, 0 errors
validate:legal          5 ok, 0 errors
validate:routes        10 ok, 0 errors
```

**Measured in a real browser** at 375 / 768 / 1024 / 1440 / 1920:

- **0 horizontal overflow** across 30 page × width combinations.
- Exactly **one `<h1>` per page**, no heading-level gaps on any of the six.
- Titles verbatim, self-referencing canonicals, `pt-PT`, `BreadcrumbList` on all six.
- All **ten privacy anchors** resolve in-page and land under the header at 76 px.
- **Both phone numbers dialable**, 44 px targets; 23 focusable elements on `/contactos/`,
  all reachable, focus ring resolving per ground (oxblood 6.64:1 on cream, gold 10.16:1 on
  dark).
- The form (Phase 10, when it was inert): 4 labelled fields, `email` required and nothing
  else, consent **not** required, honeypot off-screen and out of the tab order, no
  `admin-ajax`. `requestSubmit()` after **six router navigations** produced no submit event
  and no navigation. **PHASE 13 re-verified all of it live**: the same fields and the same
  requiredness, now posting to `/api/contact/` with Turnstile mounted, both locales
  submitting through the real form in a real browser, and every refusal path exercised
  against the running endpoint (`npm run test:forms`, ARCHITECTURE §7.5).
- Header contrast on `/contactos/` measured through the scroll: `dark` → `media` as the
  banner passes behind the header's text row → `cream` in the form section.
- Mobile menu opens, marks the current page, locks the body, moves focus, **and closes from
  its own button**.
- `full` / `reduced` / `minimal`: **0 elements left hidden** on any tier; travel goes to
  zero and long durations collapse.
- Router navigation and Back/Forward across `/sobre/` → `/servicos/` → `/portfolio/`:
  correct path, title and `aria-current` in both history directions.

**No regression.** The built HTML of `/`, `/portfolio/`, three project pages and a category
archive differs from the pre-session build in exactly four ways, all intended: three
navigation `href`s, the contact CTA, the new footer legal nav, and hashed CSS filenames.

### Payload

| Page | HTML | gzipped |
|---|---|---|
| `/obrigado/` | 5.1 KB | 1.9 KB |
| `/servicos/` | 9.3 KB | 2.9 KB |
| `/contactos/` | 9.2 KB | 3.1 KB |
| `/sobre/` | 9.7 KB | 3.2 KB |
| `/termos-e-condicoes/` | 15.3 KB | 5.6 KB |
| `/politica-de-privacidade/` | 26.3 KB | 9.1 KB |

**Blocking JS is unchanged at 10 858 B gz** (runtime 4 797 + ClientRouter 5 676 + tier 385)
— identical to Review E. Phase 10 adds one 175-byte inline module, on one page. New CSS:
`pages.css` 1 712 B gz, `legal.css` folded into the page bundles.

---

## 13. SEO status

Preserved, not improved. Nothing here is copy optimisation.

| Page | `<title>` | meta description | `og:description` | `og:image` |
|---|---|---|---|---|
| `/sobre/` | verbatim | none, as published | verbatim | **changed — see below** |
| `/servicos/` | verbatim | none | verbatim | the page's own, from the archive |
| `/contactos/` | verbatim | none | verbatim | the page's own, from the archive |
| `/obrigado/` | verbatim | none | verbatim | none, as published |
| `/termos-e-condicoes/` | verbatim | none | none, as published | none |
| `/politica-de-privacidade/` | verbatim (**lower case**, as published) | none | none | none |

Added on every page: a self-referencing canonical, `og:locale`, `hreflang` for the active
locale, and a `BreadcrumbList`. `/servicos/` also emits an `ItemList` of the four real
services — no `Service` nodes with invented `areaServed`, `provider` or price fields.
`/contactos/` emits `ContactPage`. `Organization.email` is omitted everywhere (D2).

### One technical fix, recorded for SEO review

**`/sobre/`'s `og:image` was `colors.png` — 100 × 22.** The audit flags it as unusable as a
social preview (§3.2) and every platform rejects it on size. It is replaced by the page's
own first photograph, so the card shows what the page shows. This is a broken technical
state, not a copy change — but it is listed here so the SEO phase reviews it rather than
inheriting it.

### Flagged for the SEO phase, not changed now

- **`/obrigado/` is indexable.** Preserved as published; a success page normally is not.
- **`/contactos/`'s `og:description` contains `nextvisionfilmsagency@gmail.com`**, because
  the archived description is a machine-generated excerpt of the page. It is preserved
  verbatim, which means a disputed address is in the social card. Rewriting it is a copy
  proposal; resolving D2 removes the question.
- **No meta description on any of the six.** The live site publishes none. Writing them is
  a reviewed copy proposal.

---

## 14. Unresolved content questions

Nothing below was answered by implication. Each is recorded where the code that depends on
it can be found.

| # | Question | Where it bites |
|---|---|---|
| **D2** | **Canonical email — three candidates now**, `nextvisionfilmsagency@gmail.com`, `hello@nextvisionfilms.com`, `geral@nextvisionfilms.com` | `/contactos/` has no email, `Organization.email` is omitted site-wide, and the footer still has none. `site.yml` → `emailStatus: confirmed` turns it all on |
| **D3** | Corrected portfolio category descriptions | Still unused anywhere (four of five describe the wrong category) |
| **D4** | Privacy anchors | **Answered as a migration fix**, mechanics only. If the owners want them to keep pointing at digiup.me, one line of `build-legal.mjs` reverts it |
| **D9** | Should the GDPR consent checkbox be **required**? | **Still open.** The form mirrors the live site exactly: it is **not** required, in the markup and in the endpoint at once. A legal obligation is the owners' to state; `CONSENT_REQUIRED` in `src/config/forms.ts` is the one boolean that changes it |
| **D10** | Copy inconsistencies — `a sua mensagem` on `/obrigado/`, `Produção &Direção Artística`, `Vamos Conversar!` above a newsletter button | All preserved and all now visible on real pages |
| **D11** | The four testimonials | Not shown anywhere |
| **D17** | Email provider and recipient | **Blocks DELIVERY only.** The endpoint, validation, Turnstile and the provider seam are built (Phase 13). Unanswered, a submission is refused with `503 not-configured` and is never reported as sent |
| **D18** | Newsletter destination | Why `/servicos/` ends with an invitation instead of a form |
| **P1** | **New.** Which portrait is Francisco and which is Helder? | We reproduce the live page's own pairing and assert nothing more. `src/content/team/*.md` |
| **P2** | **New.** `/servicos/`'s only photograph is a 624 px stock-looking crowd shot. Is there a real NVF frame for this page? | It is used at its own size and never stretched |
| **P3** | **New.** Alt text for the four page images | All ship `alt=""` as published; `altStatus: 'todo'` |

---

## 15. Files

**New**

```
src/pages/sobre.astro                     src/components/site/PageHead.astro
src/pages/servicos.astro                  src/components/site/ContactDetails.astro
src/pages/contactos.astro                 src/components/site/ContactForm.astro
src/pages/obrigado.astro                  src/components/legal/LegalDocument.astro
src/pages/termos-e-condicoes.astro        src/lib/static-pages.ts
src/pages/politica-de-privacidade.astro   src/styles/pages.css
                                          src/styles/legal.css
src/content/legal/termos-e-condicoes.md         (generated)
src/content/legal/politica-de-privacidade.md    (generated)
src/content/services/*.md                  ×4
src/content/team/*.md                      ×2
docs/content/legal-source.lock.json
scripts/build-legal.mjs · scripts/lock-legal.mjs · scripts/validate-legal.mjs
```

**Changed**

```
src/lib/nav.ts                 every route is built
src/lib/homepage.ts            SERVICES and TEAM moved to collections
src/pages/index.astro          reads them from the collections
src/components/site/Footer.astro   the two legal links
src/content.config.ts          services gained `excerpt` + the substring refinement
src/config/site.ts             CONTACT_FORM
src/i18n/pt.ts                 two new aria-labels
src/styles/site.css            the mobile-menu control fix
src/styles/tokens.space.css    --z-menu-controls
src/styles/tokens.colour.css   --print-paper / --print-ink
scripts/build-review-media.mjs step 6/6, the four page images
scripts/validate-data.mjs      archive-verified copy provenance
scripts/validate-routes.mjs    the six static pages
package.json                   legal:build · legal:lock · validate:legal, all in verify
```

---

## 16. What Phase 10 did not do

English · the contact and newsletter endpoints · Turnstile · newsletter integration · SEO
copy proposals · R2 · analytics · Cloudflare · DNS · a GitHub remote. A designed 404 and
the offline page shell were listed under Phase 9b in the plan and are **not** in this
session's scope; they carry no preserved content and are recorded as outstanding.
