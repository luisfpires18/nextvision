# Website Audit — nextvisionfilms.com

**Audited:** 2026-09-01
**Target:** https://www.nextvisionfilms.com
**Method:** full HTML fetch of all 34 discoverable URLs, WordPress REST API, Yoast
sitemaps, live DOM/CSS inspection and rendering in a real browser at desktop (1440×900)
and mobile (375×812) viewports, network timing, and header analysis.

> **Content rule:** every quoted string in this document is reproduced verbatim from the
> live site, including its original spelling, casing, accents and punctuation. Nothing
> has been corrected, shortened or rewritten. Where a value could not be determined it is
> marked `UNKNOWN`.

---

## Table of contents

1. [Site structure & routes](#1-site-structure--routes)
2. [Navigation, header & footer](#2-navigation-header--footer)
3. [Page-by-page content](#3-page-by-page-content)
4. [Portfolio catalogue](#4-portfolio-catalogue)
5. [Media inventory](#5-media-inventory)
6. [Current design system](#6-current-design-system)
7. [Interaction & behaviour](#7-interaction--behaviour)
8. [Technical audit](#8-technical-audit)
9. [Problems found](#9-problems-found)
10. [Modernization opportunities](#10-modernization-opportunities-recommendations-only)
11. [Not inspected / UNKNOWN](#11-not-inspected--unknown)

---

## 1. Site structure & routes

Primary language: **Portuguese (pt-PT)**. A second Polylang language (`en`) is
registered but effectively unpopulated (see §9.1).

### 1.1 Pages (WordPress `page` post type — 9 total, confirmed via REST `X-WP-Total: 9`)

| # | Route | WP ID | Title (verbatim) | Last modified | In nav? |
|---|---|---|---|---|---|
| 1 | `/` | 7 | `Homepage` | 2025-05-28 | logo |
| 2 | `/sobre/` | 33 | `Sobre` | 2025-08-07 | yes |
| 3 | `/portfolio/` | 36 | `Portfólio` | 2025-02-07 | yes † |
| 4 | `/servicos/` | 39 | `Serviços` | 2025-08-20 | yes |
| 5 | `/contactos/` | 43 | `Contactos` | 2026-02-24 | yes |
| 6 | `/obrigado/` | 2234 | `Obrigado` | 2026-02-24 | no (form success) |
| 7 | `/termos-e-condicoes/` | 275 | `Termos e Condições` | 2025-04-09 | footer |
| 8 | `/politica-de-privacidade/` | 277 | `política de privacidade` | 2025-04-09 | footer |
| 9 | `/en/homepage-english/` | 1512 | `Homepage – English` | 2025-02-12 | lang switcher |

† **`/portfolio/` does not serve page ID 36.** It resolves to the `portfolio` custom
post-type *archive* (body class `post-type-archive-portfolio`, Elementor template 1062).
Page 36 is shadowed by the CPT slug and is unreachable, yet Yoast still lists it in
`page-sitemap.xml`.

### 1.2 Portfolio items (`portfolio` CPT — 20 items)

All under `/portfolio/{slug}/`. Full detail in [§4](#4-portfolio-catalogue).

`paradox-of-affection`, `the-end`, `leonor`, `helder-praia`, `ana-reels`, `nazaryi`,
`ana-e-filipe-metro`, `danieladuarte`, `susanarafael`, `martacharles`, `carolinapedro`,
`ananuno`, `nvf-vs-antiqvvm`, `lost-lines-trailer`, `epitafio`, `dormencia-48h`,
`dont-let-it-fool-you`, `helder-museu`, `nvf-vs-filmin-details`, `madrugada-prince-mark`

### 1.3 Portfolio category archives (`categoria_portfolio` taxonomy — 5 terms)

**Not listed in any sitemap.** Discovered via "Saber Mais" links on `/portfolio/`.

| Route | Term ID | Title | Items |
|---|---|---|---|
| `/categoria-portfolio/ficcao/` | 44 | `Ficção` | 5 |
| `/categoria-portfolio/moda-identidade/` | 26 | `Moda & Identidade` | 1 |
| `/categoria-portfolio/visual-storytelling/` | 11 | `Visual Storytelling` | 8 |
| `/categoria-portfolio/corporativo/` | 28 | `Corporativo` | 1 |
| `/categoria-portfolio/casamentos/` | 45 | `Casamentos` | 5 |

### 1.4 Other discovered endpoints

| URL | Status | Note |
|---|---|---|
| `/robots.txt` | 200 | Yoast block, `Disallow:` (empty = allow all) |
| `/sitemap_index.xml` | 200 | 2 child sitemaps: `page-sitemap.xml`, `portfolio-sitemap.xml` |
| `/wp-sitemap.xml` | 200 | WP core sitemap also exposed (duplicate of Yoast) |
| `/feed/` | 200 | RSS feed exposed |
| `/comments/feed/` | 200 | Comments feed exposed |
| `/wp-json/` | 200 | REST API open and readable |
| `/en/` | 200 | redirects to `/en/homepage-english/` |
| `/?s=…` | 200 | WP search works, but no search UI anywhere on the site |
| `/blog` | **404** | Linked from the "Ver Tudo" button on all 20 portfolio pages |
| `/wp-login.php` | 404 | Login URL hidden/renamed — good practice |
| `/xmlrpc.php` | connection aborted | Appears blocked |

### 1.5 Page hierarchy

```
/                                   Homepage
├── /sobre/                         About (team)
├── /portfolio/                     Portfolio CPT archive (category landing)
│   ├── /categoria-portfolio/ficcao/
│   ├── /categoria-portfolio/moda-identidade/
│   ├── /categoria-portfolio/visual-storytelling/
│   ├── /categoria-portfolio/corporativo/
│   ├── /categoria-portfolio/casamentos/
│   └── /portfolio/{slug}/          × 20 project pages
├── /servicos/                      Services
├── /contactos/                     Contact (form + direct details)
│   └── /obrigado/                  Form success page
├── /termos-e-condicoes/            Legal
├── /politica-de-privacidade/       Legal
└── /en/homepage-english/           English homepage (EMPTY — see §9.1)
```

### 1.6 Internal link map (unique targets)

`#content` (skip link) · `/` · `/sobre/` · `/portfolio/` · `/servicos/` · `/contactos/` ·
`/contactos#contactar` · `/politica-de-privacidade` and `/politica-de-privacidade/` ·
`/termos-e-condicoes/` · `/en/homepage-english/` · `/categoria-portfolio/{5 terms}/` ·
`/portfolio/{20 slugs}/` · `/blog` (broken)

Note two spellings of the privacy link — `/politica-de-privacidade` (no trailing slash,
in the newsletter consent label) and `/politica-de-privacidade/` (footer). The first
triggers a redirect.

### 1.7 External links

| URL | Where |
|---|---|
| `https://www.youtube.com/@NextVision_Films` | footer, all 34 pages |
| `https://www.instagram.com/nextvisionfilms_/` | footer, all 34 pages |
| `https://wa.me/351929130631` | footer, all 34 pages |
| `https://www.digiup.me` | footer "powered by", all 34 pages |
| `https://www.instagram.com/francisco_acardoso/` | `/sobre/` |
| `https://www.linkedin.com/in/franciscocardoso95/` | `/sobre/` |
| `https://www.instagram.com/_helderafonso_/` | `/sobre/` |
| `https://www.digiup.me/politica-de-privacidade/#…` × 10 | `/politica-de-privacidade/` — see §9.4 |
| `http://www.aboutcookies.org/` | `/politica-de-privacidade/` (plain HTTP) |
| `http://www.allaboutcookies.org/` | `/politica-de-privacidade/` (plain HTTP) |
| `https://developers.google.com/analytics/devguides/collection/analyticsjs/cookie-usage` | `/politica-de-privacidade/` |

---

## 2. Navigation, header & footer

### 2.1 Header

Elementor template **ID 18**. Sticky on **all** breakpoints (`sticky: top`,
`sticky_on: [widescreen, desktop, laptop, tablet, mobile]`, offset 0). Rendered as
`position: fixed` with a JS-computed pixel width.

- **Left:** logo image `Vintage_Colorful_Retro_Vibes_Typographic-e1744196498986.png`
  (417×130) linking to `/`. Wordmark reads "Next Vision **FILMS**" over a retro
  multi-colour stripe block. `alt=""` (empty).
- **Right (desktop ≥768px):** horizontal menu — `Sobre` · `Portfólio` · `Serviços` ·
  `Contactos`, then a globe icon language switcher.
- **Right (<768px):** hamburger toggle, rust-orange rounded square. The language
  switcher is **not rendered** (see §9.2).

Menu labels, verbatim: `Sobre`, `Portfólio`, `Serviços`, `Contactos`.

Language switcher is a hardcoded HTML/CSS shortcode (not the Polylang widget): a globe
`<img>` button revealing a `:hover` dropdown containing a single link labelled ` en`
(note the leading space) pointing to `/en/homepage-english/`. Hover-only — no keyboard
or touch affordance.

### 2.2 Footer

Elementor template **ID 50**. Identical on all 34 pages. Has a **full-bleed background
video**: `/wp-content/uploads/2025/02/helder_museu.mov` (12.33 MB QuickTime, autoplay,
loop, muted, playsinline).

Footer copy, verbatim, in order:

```
Get in Touch
hello@nextvisionfilms.com
copyright 2025 © todos os direitos reservados
termos e condições
política de privacidade
powered by
```

Then social icon links (no visible text, no `aria-label`): YouTube, Instagram, WhatsApp.
Then the digiUP logo (`digiUP_nvf-300x178.png`) linking to `https://www.digiup.me`.

The legal link pair is rendered **twice** in the DOM (desktop + mobile variants of the
same nav widget), so it appears duplicated in the text extraction.

---

## 3. Page-by-page content

### 3.1 Homepage `/`

- **`<title>`:** `Homepage - We are NVF - Produtora Audiovisual`
- **canonical:** `https://www.nextvisionfilms.com/`
- **og:image:** *none*
- **`<h1>`: none** — every heading on the page is an `<h2>`.

**Section 1 — Hero (y≈124–754px @1440):** full-width background video
`We-are-NVF-copia.mp4` (5.68 MB, 1920×1080, 0:16, autoplay/loop/muted/playsinline). The
words "We are NVF" are burned into the video, not HTML text. The same video element is
duplicated across **three nested containers**.

**Section 2 — Intro + CTA**

```
Captamos emoções
Contamos Histórias

Queremos ouvir a tua história e ajudá-la a ganhar vida. Tens um projeto em mente? Precisas de um vídeo autêntico para a tua marca ou negócio? Fala connosco e juntos criaremos algo memorável. Envia-nos uma mensagem e responderemos rapidamente.

Vamos Criar Juntos?
```

`Vamos Criar Juntos?` is a button → `/contactos#contactar`.

**Section 3 — Work intro**

```
Fica a Conhecer o
Nosso Trabalho

O vídeo não é apenas imagem em movimento — é emoção, identidade e impacto! Na NVF, transformamos momentos em narrativas visuais que fazem sentido, que criam ligação e que ficam na memória.

Cada projeto que fazemos tem uma energia própria, porque acreditamos que um bom vídeo não se impõe, sente-se.

Seja para marcas, criadores ou aventureiros, o nosso compromisso é trazer autenticidade, dinamismo e um olhar cinematográfico que eleva cada história.
```

`Consultar Portfólio` is a button → `/portfolio/`.

**Section 4 — Showreel:** YouTube embed, video ID `NVy4UY_xscM`, iframe title
`NVF Showreel`, privacy-enhanced mode, controls on, no autoplay.

**Section 5 — Portfolio grid:** Elementor Loop Grid, template 1202, 4 most-recent items,
2 columns desktop / 2 tablet / 1 mobile, 44px row gap. Items shown:
`Lost Lines Trailer`, `Epitáfio`, `Dormência 48h`, `Don't let it fool you`.

**Section 6 — Testimonials**

```
O que Dizem
Sobre Nós
```

Four testimonials, verbatim (attribution lines included):

> "A equipa NVF é criatividade pura! Desde o primeiro contacto até à entrega final, cada momento com esta equipa foi marcado por profissionalismo, paixão e um talento fora do comum. Eles não apenas entendem a visão do cliente — eles elevam-na a um nível que ultrapassa todas as expectativas. A atenção aos detalhes, a capacidade de contar histórias com alma e uma abordagem sempre inovadora fazem da NVF uma referência no mundo - impessoal e sem chama - da produção de vídeo. É impossível não ficar contagiado com a energia e o entusiasmo com que trabalham. Cada projeto é tratado como único, com uma dedicação que faz toda a diferença no resultado final. Trabalhar com a NVF é mais do que contratar um serviço — é fazer parte de uma jornada criativa inspiradora. Recomendo de olhos fechados!"
> — Marco Ferreira, digiUP

> "Esta malta é incrível. Trabalhar com eles é uma experiência sem pressão, onde as coisas aconteceram de forma natural. Eles têm uma visão única e conseguem captar a energia de cada momento com uma leveza incrível. A vibe durante o trabalho foi sempre boa, e o resultado final refletiu isso. Adorei a experiência e o resultado. Recomendo!"
> — Ruben, Ator

> "A NVF transforma cada projeto num espaço de liberdade criativa. O Francisco tem uma abordagem criativa que te faz sentir parte do processo desde o primeiro segundo e o Helder, com a sua energia e visão, ajuda a transformar qualquer ideia numa realidade. A forma como nos conectámos e conseguimos criar algo tão genuíno foi surreal. É raro encontrar uma equipa tão unida e tão focada, e o resultado fala por si. Senti-me completamente à vontade e em casa. Estou ansiosa para o próximo projeto!"
> — Inês, Atriz

> "Trabalhar com a NVF tem sido uma verdadeira jornada criativa. Cada projeto com o Francisco e o Helder — desde os reels até aos videoclipes — é sempre uma oportunidade para explorar novas possibilidades e criar algo único. A forma como a equipa se entrega ao processo e a conexão natural que conseguimos em cada gravação faz com que todo o trabalho se torne leve e instigante. Eles sabem exatamente como captar a minha essência e fazer de cada momento algo memorável. Estou ansiosa pelo que vem a seguir!"
> — Ana Lamas, Atriz

No testimonial avatars. Attribution is stored in Elementor's `title` field, not `name`.

**Section 7 — Newsletter**

```
Subscreve a nossa
Newsletter

Declaro que aceito a Política de Privacidade.
Subscrever Newsletter
```

Form fields: `email` (placeholder `@ Email`, **required**), consent checkbox
(**required**), one unlabelled text field (honeypot), 4 hidden Elementor fields.

---

### 3.2 About `/sobre/`

- **`<title>`:** `Sobre - We are NVF - Produtora Audiovisual`
- **og:image:** `/wp-content/uploads/2025/02/colors.png` (100×22 — a colour-swatch strip,
  unsuitable as a social preview image)

```
Sobre Nós

De uma ideia a um movimento.

A NVF nasceu entre câmaras, roadtrips,  trilhos de montanha, amizades e um eterno contacto com o audiovisual. Criámos este projeto porque acreditamos que o vídeo tem poder — o poder de emocionar, de inspirar e de transformar!
Não somos apenas videógrafos, somos contadores de histórias visuais. Gostamos de projetos que têm alma, de marcas que querem fazer a diferença e de pessoas que vivem o que fazem. Desde ficção a moda e identidade, queremos que cada frame tenha um propósito, que cada imagem conte algo mais do que aquilo que se vê.
```

*(The double space in "roadtrips,  trilhos" is present in the source.)*

**Team**

| Name (verbatim, line break as rendered) | Role (verbatim) | Photo | Social |
|---|---|---|---|
| `Francisco`<br>`Cardoso` | `Direção Criativa & Videógrafo` | `WhatsApp-Image-2025-08-07-at-18.16.31_99256236.jpg` (836×668) | `Instagram` → instagram.com/francisco_acardoso/ · LinkedIn icon → linkedin.com/in/franciscocardoso95/ |
| `Helder `<br>`Afonso` | `Produção &Direção Artística` | `Helder-Afonso-1-scaled-700x1000-1-e1745226778827.jpeg` (700×947) | `Instagram` → instagram.com/_helderafonso_/ |

Note: Francisco has a LinkedIn icon, Helder does not — asymmetric.
Note: `Produção &Direção Artística` has no space after `&` in the source.

**Closing section** repeats the homepage "Fica a Conhecer o / Nosso Trabalho" block with
one word changed — here it reads `um bom produto de audiovisual não se impõe, sente-se`
where the homepage reads `um bom vídeo não se impõe, sente-se`. Both are reproduced as-is.

Three background videos on this page (all with empty resolved sources at inspection time
other than the shared footer video).

---

### 3.3 Portfolio `/portfolio/`

- **`<title>`:** `Portfólio - We are NVF - Produtora Audiovisual`
- **og:image:** *none*
- Elementor archive template 1062. This page is a **category landing page**, not a
  project grid — it lists the five categories, each with a `Saber Mais` button.

```
Portfólio

Na NVF, transformamos ideias em imagens.
```

| Heading (verbatim) | Level | Description (verbatim) | Button |
|---|---|---|---|
| `Ficção` | h2 | `Criamos curtas e longas-metragens com foco na narrativa, emoção e estética, dando vida a histórias que envolvem, provocam e deixam marca no espectador.` | `Saber Mais` → `/categoria-portfolio/ficcao/` |
| `Moda & Identidade` | **h3** | `Produzimos conteúdos publicitários impactantes para televisão, cinema e plataformas digitais, com mensagens claras, emocionais e eficazes.` | `Saber Mais` → `/categoria-portfolio/moda-identidade/` |
| `Visual Storytelling` | h2 | `Contamos histórias reais com sensibilidade e rigor, explorando temas humanos e sociais através de uma abordagem cinematográfica.` | `Saber Mais` → `/categoria-portfolio/visual-storytelling/` |
| `Corporativo` | h2 | `Valorizamos marcas e estilos de vida com conteúdos visuais autênticos e elegantes, desde editoriais a campanhas e redes sociais.` | `Saber Mais` → `/categoria-portfolio/corporativo/` |
| `Casamentos` | h2 | `Produzimos vídeos institucionais que comunicam identidade, missão e valores de forma clara, profissional e com impacto visual.` | `Saber Mais` → `/categoria-portfolio/casamentos/` |

⚠ The descriptions appear shifted relative to their headings — see §9.3. **Reproduced
exactly as published; not corrected.**

---

### 3.4 Category archives `/categoria-portfolio/{term}/`

Elementor archive template 1349. Each renders a single `<h2>` with the term name (no
`<h1>`, no canonical tag) and a Loop Grid of that term's items using template 1202
(2 cols desktop/tablet, 1 col mobile, 44px gap). No pagination, no search, no
description text.

---

### 3.5 Services `/servicos/`

- **`<title>`:** `Serviços - We are NVF - Produtora Audiovisual`
- **og:image:** `/wp-content/uploads/2025/02/servicos3NextVision.jpg`

```
Serviços

O vídeo certo tem o poder de transformar um projeto, uma marca ou uma experiência. Por isso, damos vida a ideias com um toque cinematográfico e uma visão autêntica.

Produção de Vídeo
Criamos vídeos que contam histórias, captam emoções e deixam marca. Do conceito à pós-produção, cada detalhe é pensado para um resultado final impactante.

Publicidade & Branding
O teu negócio tem algo a dizer? Nós ajudamos a comunicar. Criamos conteúdos visuais que destacam marcas e criam conexão com o público.

Eventos & Experiências
Porque há momentos que merecem ser lembrados para sempre. Filmamos eventos culturais, desportivos, empresariais ou sociais, sempre com um olhar artístico.

Documentários & Storytelling
Cada história tem uma verdade, e nós queremos capturá-la. Do conceito à edição final, trazemos um toque cinematográfico a documentários e projetos de storytelling.

Dá vida à tua ideia
Vamos Conversar!
Diz-nos como te podemos contactar, nós tratamos do resto.

Declaro que aceito a Política de Privacidade.
Subscrever Newsletter
```

Note: the four service names here (`Produção de Vídeo`, `Publicidade & Branding`,
`Eventos & Experiências`, `Documentários & Storytelling`) do **not** match the five
portfolio categories (`Ficção`, `Moda & Identidade`, `Visual Storytelling`,
`Corporativo`, `Casamentos`). Two separate taxonomies of the same business.

Note: the CTA at the bottom is labelled `Vamos Conversar!` but the submit button reads
`Subscrever Newsletter` — it is the newsletter form, not a contact form.

---

### 3.6 Contact `/contactos/`

- **`<title>`:** `Contactos - We are NVF - Produtora Audiovisual`
- **og:image:** `/wp-content/uploads/2025/04/banner-contactos-2-e1744213581116.jpg` (1640×644)
- Anchor target `#contactar` is linked from the homepage CTA.

```
Contactos

Pronto para transformar a tua visão em imagens?

Queremos ouvir a tua história e ajudá-la a ganhar vida. Tens um projeto em mente? Precisas de um vídeo autêntico para a tua marca ou negócio? Fala connosco e juntos criaremos algo memorável. Envia-nos uma mensagem e responderemos rapidamente.

nextvisionfilmsagency@gmail.com
(+351) 932 797 025
(+351) 929 130 631
*custo para chamada móvel nacional.

Formulário
Contacto Directo
Se preferires contata-nos diretamente através do nosso formulário. Prometemos ser breves a responder!

Declaro que li e que aceito a Política de Privacidade.
Enviar
```

**Contact details found on the site**

| Type | Value | Where |
|---|---|---|
| Email (displayed) | `nextvisionfilmsagency@gmail.com` | `/contactos/` heading |
| Email (`mailto:` target of that same element) | `hello@nextvisionfilms.com` | `/contactos/` — **mismatch, see §9.5** |
| Email (footer) | `hello@nextvisionfilms.com` | footer, all pages |
| Phone | `(+351) 932 797 025` | `/contactos/` |
| Phone | `(+351) 929 130 631` | `/contactos/` |
| WhatsApp | `https://wa.me/351929130631` | footer, all pages |
| Instagram | `https://www.instagram.com/nextvisionfilms_/` | footer |
| YouTube | `https://www.youtube.com/@NextVision_Films` | footer |
| Postal address | UNKNOWN — none published |
| VAT / NIF / company registration | UNKNOWN — none published |

**Contact form** (Elementor Pro Form, `name="Formulário de Contacto"`, POST to
`/wp-admin/admin-ajax.php`):

| Field | Type | Placeholder | Required |
|---|---|---|---|
| `form_fields[name]` | text | `Nome` | no |
| `form_fields[email]` | email | `Email` | **yes** |
| `form_fields[field_e7fea80]` | tel | `Telefone` | no |
| `form_fields[message]` | textarea | `Mensagem` | no |
| `form_fields[field_08cf5ce]` | checkbox | label `Declaro que li e que aceito a Política de Privacidade.` | **no** ⚠ |
| `form_fields[field_8476364]` | text | *(none — honeypot)* | no |

Submit label: `Enviar`. Protected by reCAPTCHA v3. Success destination is
`/obrigado/` (server-side redirect config, not visible in markup).

---

### 3.7 Thank-you `/obrigado/`

```
Obrigado

Obrigado! Recebemos a sua mensagem com sucesso.
Entraremos em contacto brevemente.
```

Note: uses formal address (`a sua mensagem`) whereas the rest of the site uses informal
(`a tua história`). Reproduced as-is.

---

### 3.8 English homepage `/en/homepage-english/`

- **`<title>`:** `Homepage - English - We are NVF - Produtora Audiovisual`
- **hreflang:** `en` → itself, `pt` → `/`
- **Entire page body content:** `Homepage – English` (the `<h1>`). Nothing else.

The page has **no Elementor content** (no `elementor-page-1512` body class). Only the
shared header and footer render. See §9.1.

---

### 3.9 Legal pages

| Page | `<h1>` | Length | Structure |
|---|---|---|---|
| `/termos-e-condicoes/` | `Termos e Condições` | ~7,000 chars | Single unbroken block, internal lettered sub-points `a)`, `b)`… run inline with no headings |
| `/politica-de-privacidade/` | `política de privacidade` | ~15,470 chars | Intro + a `Navegação` list + 10 `<h4>` sections |

Privacy policy `<h4>` sections, verbatim:
`ACERCA DESTA POLÍTICA DE PRIVACIDADE` · `QUE INFORMAÇÃO RECOLHEMOS ACERCA DE SI?` ·
`DE QUE FORMA USAMOS A INFORMAÇÃO SOBRE SI?` · `MARKETING` ·
`ACESSO E CORREÇÃO DA SUA INFORMAÇÃO` · `COOKIES` · `OUTROS WEBSITES` · `SEGURANÇA` ·
`ALTERAÇÕES A ESTE COMUNICADO DE PRIVACIDADE` · `CONTACTOS`

Opening line of the privacy policy, verbatim:
`(Artigos 8º, 13º, 14º e 21º do Regulamento Geral de Proteção de Dados – RGPD)`

**Full verbatim text of both pages is stored in `docs/content/termos-e-condicoes.txt`
and `docs/content/politica-de-privacidade.txt`.** Those files are the canonical copy for
migration.

---

## 4. Portfolio catalogue

20 items. `Título` = the `<h1>` on the item page (often different from the URL slug).
Date and category come from an Elementor Post Info widget.

| # | Slug | Título (verbatim `<h1>`) | Date (verbatim) | Category | YouTube | Poster image |
|---|---|---|---|---|---|---|
| 1 | `ana-e-filipe-metro` | `Don't Let It Fool You` | `11 Fevereiro '25` | Visual Storytelling | `e6aK4vEn420` | `2025/02/metro.png` |
| 2 | `ana-reels` | `The Lie we tell ourselves` | `11 Fevereiro '25` | Visual Storytelling | `o9X1s3ge_IE` | `2025/02/ana.png` |
| 3 | `ananuno` | `Ana&Nuno` | `23 Maio '25` | Casamentos | `DSUXz5VeXiY` | `2025/05/ana-e-nuno-1.png` |
| 4 | `carolinapedro` | `Carolina&Pedro` | `23 Maio '25` | Casamentos | `BDJAOp6Eh3E` | `2025/05/carolina-e-pedro-1.png` |
| 5 | `danieladuarte` | `Daniela&Duarte` | `23 Maio '25` | Casamentos | `GJpdoynz2QA` | `2025/05/Daniela-e-duarte.png` |
| 6 | `dont-let-it-fool-you` | `Don't let it fool you` | `23 Maio '25` | Ficção | ⚠ `studio.youtube.com/video/e6aK4vEn420/edit` | `2025/05/ana-e-filipeee.png` |
| 7 | `dormencia-48h` | `Dormência 48h` | `23 Maio '25` | Ficção | `4Xur7raVaqU` | `2025/05/WhatsApp-Image-2025-05-26-at-10.16.54.jpeg` |
| 8 | `epitafio` | `Epitáfio` | `23 Maio '25` | Ficção | `RIvUTLvdwX8` | `2025/05/Epitafio.png` |
| 9 | `helder-museu` | `Yves Saint Laurent` | `11 Fevereiro '25` | Moda & Identidade | `dFehZUbaGWU` | `2025/02/museuuu.png` |
| 10 | `helder-praia` | `The endless "WAVES"` | `11 Fevereiro '25` | Visual Storytelling | `O7g2AM9lAo0` | `2025/02/ffffffffff.png` |
| 11 | `leonor` | `Words of our story` | `11 Fevereiro '25` | Visual Storytelling | `0C-yySHAzCI` | `2025/02/Capture.png` |
| 12 | `lost-lines-trailer` | `Lost Lines Trailer` | `23 Maio '25` | Ficção | `JIKvD9Y74oU` ⚠ stored without scheme | `2025/05/lost-lines.png` |
| 13 | `madrugada-prince-mark` | `Madrugada – Prince Mark` | `7 Agosto '25` | Visual Storytelling | `gbXbnpttShw` | `2025/08/prince-mark.png` |
| 14 | `martacharles` | `Marta&Charles` | `23 Maio '25` | Casamentos | `DT3wUv-vPe4` | `2025/05/Marta-e-charles.png` |
| 15 | `nazaryi` | `Unfinished` | `7 Fevereiro '25` | Visual Storytelling | `sBVD2TxbM-w` | `2025/02/nazary.png` |
| 16 | `nvf-vs-antiqvvm` | `Antiqvvm` | `12 Abril '25` | Corporativo | `seuAOrDs3oo` | `2025/04/Antiqvvm-imagem.png` |
| 17 | `nvf-vs-filmin-details` | `Filmin` | `3 Abril '25` | Visual Storytelling | `8HjA-SOs7Ws` | `2025/04/Filmin_1.1.1.jpg` |
| 18 | `paradox-of-affection` | `I Feel Lost` | `11 Fevereiro '25` | Visual Storytelling | `HHB93FuKNrg` | `2025/02/nath.png` |
| 19 | `susanarafael` | `Susana&Rafael` | `23 Maio '25` | Casamentos | `h8aaihpcLGU` | `2025/05/Susana-e-rafael.png` |
| 20 | `the-end` | `The End` | `11 Fevereiro '25` | Ficção | `_3cbRqvPKsk` | `2025/02/image_2025-02-21_161051815.png` |

### 4.1 Project taglines (verbatim, where present)

| Slug | Tagline |
|---|---|
| `ana-e-filipe-metro` | `Love is never as it seems` |
| `ana-reels` | `I'll be happier in another place, doing something different, loving someone new. That's the lie we tell ourselves…` |
| `dont-let-it-fool-you` | `We are NVF 🌏` |
| `helder-museu` | `You start to look around and think – where'd it all go? The moments you couldn't hold onto… Fading` |
| `helder-praia` | `One day you wake up, and its not just another morning, its a moment. When you realize the pages of your life have turned, and you're no longer who you used to be. The moments you couldn't hold onto… Fading` |
| `leonor` | `It's like I'm reading a book, and it's a book I deeply love, but I'm reading it slowly now. I can still feel you and the words of our story. This is who I am now. And I need you to let me go. As much as I want to I can't live in your book anymore.` |
| `madrugada-prince-mark` | `Madrugada – Prince Mark Videoclip` |
| `nazaryi` | `As memories play on repeat, silence answers the messages that words could never heal.` |
| `nvf-vs-antiqvvm` | `Onde o "Sensorial" se pode ver.` |
| `nvf-vs-filmin-details` | `Onde o cinema ganha vida` |
| `paradox-of-affection` | `We search for something, but in the end, it's the journey that leaves us forgotten in places we never meant to be.` |
| `the-end` | `"THE END" sometimes is just a start.` |
| `ananuno`, `carolinapedro`, `danieladuarte`, `dormencia-48h`, `epitafio`, `lost-lines-trailer`, `martacharles`, `susanarafael` | *(no tagline)* |

### 4.2 Single-item page template (Elementor 1066)

Layout, top to bottom:
1. Breadcrumb-style label `Portfólio`
2. Post Info: date · category link
3. `<h1>` project title
4. Tagline (if present)
5. YouTube video widget with a poster overlay image and a play control
6. `Mais trabalhos` / `Que poderás gostar` + `Ver Tudo` button → **`/blog` (404)**
7. Related grid — **always the 2 newest items**, not genuinely related
8. Newsletter block (`Subscreve a nossa` / `Newsletter`), from container template 886
9. Footer

### 4.3 Hover-preview video coverage

Portfolio cards use a custom `video-portfolio` shortcode: a muted `<video>` with a poster
image and inline `onmouseover="this.play()"` / `onmouseout="this.pause(); this.load();"`.

| State | Count | Items |
|---|---|---|
| Working `.mov`/`.mp4` source | **9** | `the-end`, `helder-museu`, `nvf-vs-filmin-details`, `leonor`, `helder-praia`, `ana-reels`, `ana-e-filipe-metro`, `paradox-of-affection`, `nazaryi` |
| **Empty `<source src="">`** | **10** | all 5 `Casamentos` items (`carolinapedro`, `danieladuarte`, `susanarafael`, `ananuno`, `martacharles`) plus `lost-lines-trailer`, `epitafio`, `dormencia-48h`, `dont-let-it-fool-you`, `madrugada-prince-mark` |
| **Invalid source** | **1** | `nvf-vs-antiqvvm` — `<source src="https://youtu.be/seuAOrDs3oo" type="video/mp4">`, which a `<video>` element cannot play |

---

## 5. Media inventory

**77 distinct upload URLs** are referenced across the 34 pages. The WordPress media
library reports `X-WP-Total: 93` attachments, of which 64 are publicly readable via REST.
Full machine-readable lists: `docs/content/media_inventory.json` and
`docs/content/media.json`.

### 5.1 Video — self-hosted (11 files, ~153 MB total)

| File | Type | Size | Duration | Used as |
|---|---|---|---|---|
| `2025/02/helder_museu.mov` | QuickTime | **12.33 MB** | 0:06 | **Footer background on all 34 pages** + `helder-museu` card |
| `2025/03/We-are-NVF-copia.mp4` | MP4 1920×1080 | 5.68 MB | 0:16 | Homepage + `/portfolio/` hero (3 duplicated elements on the homepage) |
| `2025/03/vcompress_210.mov` | QuickTime | **46.11 MB** | 3:09 | **Orphan** — in library, not referenced by any page |
| `2025/02/helder_praia.mov` | QuickTime | 11.68 MB | 0:05 | `helder-praia` card |
| `2025/02/ana_e_filipe_metro.mov` | QuickTime | 11.77 MB | 0:05 | `ana-e-filipe-metro` card |
| `2025/02/the_end.mov` | QuickTime | 11.36 MB | 0:05 | `the-end` card |
| `2025/02/paradox_of_affection.mov` | QuickTime | 11.40 MB | 0:05 | `paradox-of-affection` card |
| `2025/02/ana_reels.mov` | QuickTime | 11.05 MB | 0:05 | `ana-reels` card |
| `2025/02/leonor.mov` | QuickTime | 10.40 MB | 0:04 | `leonor` card |
| `2025/02/nazaryi.mov` | QuickTime | 10.17 MB | 0:04 | `nazaryi` card |
| `2025/04/FILM-IN-video-2-sem-nvf-v2.mp4` | MP4 | UNKNOWN | UNKNOWN | `nvf-vs-filmin-details` card |
| `2025/02/videoplayback.mp4` | MP4 | 1.00 MB | 0:20 | **Orphan** — in library, not referenced |

9 of 11 are **`.mov` (QuickTime)** — a container Safari plays but Chrome and Firefox
support inconsistently, with no MP4/WebM fallback anywhere.

### 5.2 Video — external (YouTube)

- 20 portfolio videos (IDs in [§4](#4-portfolio-catalogue)), all privacy-enhanced
  (`youtube-nocookie` mode enabled via `yt_privacy: yes`)
- 1 homepage showreel: `NVy4UY_xscM`, iframe title `NVF Showreel`
- Channel: `https://www.youtube.com/@NextVision_Films`

### 5.3 Logo & brand assets

| File | Dimensions | Use |
|---|---|---|
| `2025/02/Vintage_Colorful_Retro_Vibes_Typographic-e1744196498986.png` | 417×130 | **Primary logo**, header on all pages + Yoast schema `Organization.logo` |
| `2025/02/NextVisionFILMS.svg` | vector | Alternate logo — **not referenced by any page** |
| `2025/02/NextVisionFILMS.png` | 3071×945 | Alternate logo, unused |
| `2025/02/NextVisionFILMS-scaled.jpg` | 2560×788 | Alternate logo, unused |
| `2025/02/NVF.png` | 2431×2431 | Source for favicons |
| `2025/02/cropped-NVF-32x32.png` / `-192x192` / `-180x180` / `-270x270` | — | Favicon, apple-touch-icon, msapplication tile |
| `2025/02/nextVision-removebg-preview.png` | 697×244 | Unused |
| `2025/02/colors.png` | 100×22 | Brand colour swatch strip; used as `/sobre/` og:image |
| `2025/02/Group-140.png` | 1362×378 | UNKNOWN use |

### 5.4 Photography

| File | Dimensions | Use |
|---|---|---|
| `2025/08/WhatsApp-Image-2025-08-07-at-18.16.31_99256236.jpg` | 836×668 | Francisco Cardoso portrait |
| `2025/02/Helder-Afonso-1-scaled-700x1000-1-e1745226778827.jpeg` | 700×947 | Helder Afonso portrait |
| `2025/04/banner-contactos-2-e1744213581116.jpg` | 1640×644 | Contact page banner / og:image |
| `2025/02/servicosNextVision-scaled.jpg` | 2560×1707 | Services |
| `2025/02/servicos3NextVision.jpg` | 624×416 | Services / og:image |
| `2025/02/servicos4NextVision.jpg` | 414×624 | Services |
| `2025/02/FormContactoNextVision.jpg` | 2032×1355 | Contact |
| `2025/02/HelderAfonsoImg.png` | 243×243 | Older portrait, unused |
| `2025/02/overlay.png` | 670×378 | Overlay texture |

### 5.5 Portfolio poster / thumbnail images

20 posters, one per project — listed in the [§4 table](#4-portfolio-catalogue). WordPress
generates a `-1024x…` variant of each; the full-size original is what the `<video poster>`
attribute points to.

Filenames are largely non-descriptive (`ffffffffff.png`, `Capture.png`, `nath.png`,
`museuuu.png`, `image_2025-02-21_161051815.png`, `WhatsApp-Image-2025-05-26-at-10.16.54.jpeg`).

### 5.6 Icons (SVG, 23 in library)

Referenced: `2025/04/grommet-icons-language.svg` (language globe, the only SVG actually
linked in page markup).

Present in the library but not referenced in markup — icons appear to be rendered through
Elementor's icon widget instead: `lets-icons-e-mail_black.svg`, `el-phone-alt.svg`,
`el_phone-alt.svg`, `el-phone.svg`, `phoneIcon.svg`, `phone-circle.svg`,
`molumen_phone_icon.svg`, `emailIcon.svg`, `arroba-svgrepo-com.svg`,
`instagram-circle.svg`, `youtube-with-circle.svg`, `iconoir-youtube.svg`,
`iconoir-youtube-1.svg`, `linkedin_svg_icon.svg` (+ `-1`, `-2`),
`quote-testimonials.svg`, `flow-arrow-fill.svg`, `icons-language.svg`,
`5a452601546ddca7e1fcbc87.svg`, `digiUP_Branco_final.svg`.

Multiple near-duplicate icons (3 LinkedIn, 3 YouTube, 6 phone, 3 email, 2 language)
indicate accumulated cruft.

### 5.7 Fonts (currently hosted)

| File | Family |
|---|---|
| `2025/02/Minya-TTF.ttf` | `Minya` — display/headings |
| `2025/02/Minya-Italic-TTF.ttf` | `Minya` italic |

Loaded from Google Fonts: `Roboto Slab` (all weights + italics), `Roboto` (all weights +
italics), `Cabin` (all weights + italics) — three full-family requests, of which only
`Cabin` is actually applied to rendered text.

---

## 6. Current design system

### 6.1 Colour palette

| Token | Hex | RGB | Role |
|---|---|---|---|
| Cream | `#F0EAD6` | 240,234,214 | Global page background |
| Amber | `#EFB025` | 239,176,37 | Elementor `--e-global-color-primary`; default button fill; pagination |
| Rust | `#D54B27` | 213,75,39 | `--e-global-color-secondary`; button hover; CTA buttons; mobile hamburger |
| Near-black | `#1E1E1E` | 30,30,30 | `--e-global-color-accent`; headings and body text |
| Grey | `#6B6B6B` | 107,107,107 | `--e-global-color-text` (kit default) |
| Dark | `#2A2A2A` | 42,42,42 | Language dropdown panel |
| Text grey | `#333333` | 51,51,51 | Hello Elementor theme default body colour |
| White | `#FFFFFF` | — | Button labels, footer text |
| Black | `#000000` | — | Video letterbox areas |
| Peach | `#FFBC7D` | — | Elementor page-transition colour (configured, transition itself not enabled) |
| Link pink | `#CC3366` | 204,51,102 | Hello Elementor default `<a>` colour — leaks through on unstyled links |
| Hero yellow | `#FFFF00` (approx.) | — | Burned into the hero video, not CSS |

The logo stripe block carries an additional retro palette (teal, dark red, orange, gold)
that exists only inside the raster logo.

### 6.2 Typography (current — to be replaced, see CLAUDE.md §4)

| Family | Source | Applied to |
|---|---|---|
| `Minya` | Self-hosted TTF | All headings, buttons, `.video-title`, pagination |
| `Cabin` | Google Fonts | Body text, navigation |
| `Roboto` | Google Fonts | Kit `text`/`accent` tokens — **loaded, effectively unused** |
| `Roboto Slab` | Google Fonts | Kit `secondary` token — **loaded, effectively unused** |
| system stack | — | Skip link, footer text, unstyled buttons |

Observed rendered sizes: `14, 16, 18, 19, 21, 22, 30, 32, 36, 46, 50px`. No fluid scale,
no `clamp()`, no rem-based rhythm — every value is a hardcoded px override per element.

Sample computed values (1440px viewport, homepage):

| Element | Family | Size | Weight | Line-height |
|---|---|---|---|---|
| Section heading `Captamos emoções` | Minya | 36px | 400 | 43.2px (1.2) |
| Body paragraph | Cabin | 19px | 400 | 29px (1.53) |
| Nav link | Cabin | 21px | 400 | 20px (0.95 — tighter than the glyph box) |
| Button `Vamos Criar Juntos?` | Minya | 16px | 400 | 16px |
| Card title `.video-title` | Minya | 46px desktop / 30px mobile | 400 | — |

`letter-spacing` is `normal` everywhere. `text-transform` is `uppercase` only inside the
language dropdown.

### 6.3 Layout & spacing

- Container max-width **1140px** (`--container-max-width`), reduced to 1024px below the
  tablet breakpoint.
- Elementor container default padding is set to **0 on all sides**; every gutter is a
  per-element override.
- `--widgets-spacing: 0px`, `.elementor-widget:not(:last-child) { margin-block-end: 0 }` —
  all vertical rhythm is manual.
- **`p { margin: 0 !important; }`** is applied globally from the kit's custom CSS,
  removing paragraph spacing site-wide.
- Measured homepage section offsets @1440×900 (document height 5277px):
  hero 124–754 · intro 908–1265 · work intro 1489–1808 · showreel 1931–2572 ·
  grid 2635–3442 · testimonials 3666–4186 · newsletter 4410–4799 · footer 4799–5186.
  Inter-section gaps run 63–224px, with no consistent step.

### 6.4 Grid behaviour

Elementor Loop Grid (template 1202) is used on the homepage, the portfolio archive and
all category archives with identical settings:

```json
{"template_id":1202,"columns":2,"columns_tablet":"2","columns_mobile":"1",
 "row_gap":{"unit":"px","size":44},"_skin":"post"}
```

### 6.5 Media ratios & presentation

| Element | Desktop | Mobile (<768px) | Notes |
|---|---|---|---|
| Portfolio card (`.video-container`) | fixed **376px** height, 100% width | fixed **250px** height | `border-radius: 12px`, `object-fit: cover` — a **fixed pixel height, not an aspect ratio**, so the crop changes with viewport width |
| Homepage card (`.video-container-home`) | fixed **440px** height | — | same treatment |
| Hero video | full-width container, 630px tall @1440 | ~440px | `object-fit: cover` on the background-video layer |
| YouTube embeds | 16:9 | 16:9 | poster overlay + play button |
| Card title overlay | Minya 46px, white, centred, `opacity: 0 → 1` on hover | Minya 30px | homepage variant is always `opacity: 1` |

### 6.6 Responsive breakpoints

Elementor's configured breakpoint set: `xs: 0, sm: 480, md: 768, lg: 1025, xl: 1440,
xxl: 1600`.

Only two are actually emitted in the generated CSS:

- `@media (max-width: 1024px)` — tablet: container 1024px
- `@media (max-width: 767px)` — mobile: single-column grid, card heights 376→250px,
  card title 46→30px, hamburger menu

There is no intermediate large-desktop treatment: the 1140px container is the widest
layout at any viewport above 1140px.

### 6.7 Header & footer behaviour

- **Header:** fixed to the top at every breakpoint, `sticky_effects_offset: 0` so the
  "stuck" state applies from scroll position 0. Width is set in JS
  (`width: 1424.8px` at a 1440px viewport) rather than by CSS, so it does not
  self-correct on resize until the handler re-runs.
- **Footer:** identical on all 34 pages, with the autoplaying `.mov` background.

### 6.8 Desktop vs mobile

| | Desktop (≥768px) | Mobile (<768px) |
|---|---|---|
| Nav | horizontal, 4 links + globe icon | hamburger → dropdown, 4 links |
| Language switcher | globe with hover dropdown | **absent** |
| Portfolio grid | 2 columns | 1 column |
| Card height | 376px (440px home) | 250px |
| Card title | reveals on hover | permanently hidden (no hover on touch) except the homepage variant |
| Hero | 630px tall | ~440px tall, black until the video decodes |

---

## 7. Interaction & behaviour

| Behaviour | Implementation | Detail |
|---|---|---|
| Sticky header | Elementor Pro Sticky (`jquery.sticky.min.js`) | fixed at all breakpoints from scroll 0 |
| Mobile menu | Elementor nav-menu dropdown + `ecs-mobile-menu.min.js` | `aria-expanded` toggles correctly |
| Desktop submenus | SmartMenus 1.2.1 | loaded, but the menu is flat — no submenus exist |
| Language switcher | custom shortcode, CSS `:hover` only | no click/focus/touch path |
| Card hover preview | inline `onmouseover="this.play()"` / `onmouseout="this.pause(); this.load()"` | 9 of 20 cards have no source; 1 has an unplayable source |
| Card title reveal | `.video-container:hover .video-title { opacity: 1 }`, `transition: opacity 0.3s ease-in-out` | hover-only — unreachable on touch |
| Button/element hover | `elementor-animation-grow` (4 elements on the homepage) | CSS `transform` scale |
| Testimonials carousel | Swiper 8.4.5 via Elementor Testimonial Carousel | `autoplay: 5000ms`, `speed: 500ms`, `loop: yes`, `pause_on_hover: yes`, `pause_on_interaction: yes`, bullet pagination, `space_between: 10px` at every breakpoint |
| Carousel pagination position | custom CSS `margin-left: -42vw` | a viewport-unit offset hack; alignment drifts with window width |
| Background video | Elementor background-video (`background_play_on_mobile: yes`, `background_privacy_mode: yes`) | autoplay, loop, muted, playsinline, **no poster** |
| YouTube playback | Elementor Video widget, privacy-enhanced, poster overlay + play button | `enablejsapi=1`, `rel=0`, `controls=1` |
| Scroll behaviour | `scroll-behavior: smooth` set globally | affects anchor jumps such as `/contactos#contactar` |
| Lazy loading | **none** — 0 of 5 homepage images carry `loading="lazy"`; the showreel iframe is not deferred | |
| Entrance animations | none configured (`data-settings` contains no `animation` keys) | |
| Page transitions | Elementor page-transition colour is set (`#FFBC7D`) but the feature is not enabled | |
| Colour scheme toggle | Ele Custom Skin colour-scheme script ships on every page | `systemAuto: false`, `darkLogoUrl: ""` — inert, no toggle exists |
| Reduced motion | a `prefers-reduced-motion` query exists in Elementor's own CSS | the autoplaying background videos are **not** gated by it |
| Search | WordPress search responds at `/?s=` | no search UI is exposed anywhere |
| Pagination | archive CSS for `.page-numbers` exists in the kit | no archive currently paginates |

---

## 8. Technical audit

### 8.1 Platform

| Layer | Detected | Confidence |
|---|---|---|
| CMS | **WordPress** | certain — `wp-content`, `wp-json`, `wp-includes` |
| Page builder | **Elementor 4.2.4 + Elementor Pro 4.2.2** | certain — asset paths and version query strings |
| Theme | **Hello Elementor 3.3.0** + child theme `hello-theme-child-master` v1.0.1 | certain |
| Child theme CSS | **empty** — default boilerplate only; all custom CSS lives in the Elementor Kit's Custom CSS field | certain |
| Global kit | `elementor-kit-6` | certain |
| Multilingual | **Polylang** (`pll_language` cookie, `pll/v1` REST namespace) | certain |
| SEO | **Yoast SEO 28.3** | certain |
| Analytics | **Google Site Kit** | certain |
| Extra Elementor addon | **Ele Custom Skin (ECS) 4.3.11** — colour-scheme, container-layout, mobile-menu, editorial-text modules | certain |
| Migration plugin | **All-in-One WP Migration** (`ai1wm/v1` REST namespace) | certain |
| Admin utility | **Admin Site Enhancements** (`asenha-external-permalinks` script) | certain |
| Forms | **Elementor Pro Forms** (POST → `/wp-admin/admin-ajax.php`) | certain |
| Form provider hook | Site Kit ships a **WPForms** events provider script | present, but no WPForms markup found — likely a leftover |
| Elementor AI | `elementor-ai/v1` REST namespace registered | certain |

### 8.2 Hosting & infrastructure

| Item | Value |
|---|---|
| Web server | `nginx` (version not disclosed) |
| Origin IP | `62.233.41.61` |
| Reverse DNS | `hosting235.serverhs.org` — shared hosting |
| Authoritative nameservers | `ns1.digiupcloud.pt`, `ns2.digiupcloud.pt` — **DNS is managed by digiUP**, the agency credited in the footer |
| MX | `a1.spambusters.email` (10), `n1.spambusters.email` (20), `a2.spambusters.email` (30) |
| CDN | **none detected** — no `cf-ray`, `x-cache`, `age` or equivalent headers |
| WAF | present at host level — `X-WAF-Profile: base`, `X-WAF-Score: 0`, `X-WAF-Action: allow` |
| Compression | **Brotli** (`content-encoding: br`) on HTML, CSS and JS |
| TLS/HSTS | `Strict-Transport-Security: max-age=31536000; includeSubDomains` |
| Security headers | `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy` for private-state tokens |
| Missing security headers | no `Content-Security-Policy`, no `X-Frame-Options`/`frame-ancestors` |
| HTML caching | **none** — no `Cache-Control`, `Expires` or `ETag` on HTML responses |
| Static caching | `Cache-Control: max-age=2592000` (30 days) + `ETag` + `Accept-Ranges: bytes` |
| Cookie on every HTML response | `Set-Cookie: pll_language=pt; Max-Age=31536000; Secure; SameSite=Lax` — blocks naive edge caching |

**Measured server response** (3 cache-busted runs, from Portugal):

```
run1  dns=0.031s connect=0.043s tls=0.070s ttfb=0.618s total=0.642s size=90166B
run2  dns=0.006s connect=0.019s tls=0.044s ttfb=0.533s total=0.569s size=90166B
run3  dns=0.006s connect=0.018s tls=0.044s ttfb=0.536s total=0.570s size=90166B
```

TTFB ≈ **530–620 ms** with no page caching — consistent with uncached PHP on shared hosting.

### 8.3 Generated markup

Homepage: **90,166 bytes** of HTML uncompressed (17.5 KB over the wire with Brotli).

- `<div>`-heavy Elementor container nesting; the hero is 4 containers deep with the same
  `<video>` element repeated in three of them.
- Elementor per-element configuration is serialised into HTML-escaped JSON in
  `data-settings` attributes.
- Navigation is emitted twice per nav-menu widget (desktop `<nav>` + dropdown `<nav>`),
  producing **6 `<nav>` landmarks and 20 nav links** on the homepage for 4 destinations.
- Landmarks: 1 `<header>`, 1 `<main>`, 1 `<footer>`, 6 `<nav>`.

### 8.4 JavaScript libraries loaded (homepage)

`jQuery 3.7.1` · `jquery-migrate 3.4.1` · `jQuery UI core 1.14.2` · `imagesLoaded 5.0.0` ·
`Swiper 8.4.5` · `SmartMenus 1.2.1` · `jquery.sticky` · Elementor
`webpack.runtime` + `frontend-modules` + `frontend` · Elementor Pro
`webpack-pro.runtime` + `frontend` + `elements-handlers` · `hello-frontend` · ECS
`color-switcher`, `slider`, `mobile-menu` · WP `hooks` + `i18n` · Google `gtag` ·
Site Kit event providers (`content-events`, `wpforms`) · Google reCAPTCHA
(`api.js?render=explicit`).

**89 requests** on the homepage: 30 stylesheets, 38 scripts, 12 video/media, 3 images,
2 iframes, 2 fetches.

### 8.5 CSS approach

Elementor's generated per-page/per-kit CSS files plus one stylesheet per widget type.
The homepage links **30 separate stylesheets**.

All bespoke styling lives in the Elementor Kit Custom CSS field
(`/wp-content/uploads/elementor/css/post-6.css`). That block contains:

- a large commented-out region terminated by a **stray orphan `*/`**
- an **extra unmatched `}`** after the search-box rules
- `p { margin: 0 !important; }` applied globally
- a **third `@font-face` for `Minya` with an empty `src: ;`** — invalid declaration
- `margin-left: -42vw` for the carousel pagination
- fixed pixel heights (`376px`, `440px`, `250px`) instead of aspect ratios
- ID-scoped rules such as `input#search-23360b9` that break if Elementor regenerates IDs

The child theme's `style.css` is **623 bytes of default boilerplate with no rules** — so
none of this custom CSS is under version control or reviewable outside the WP admin.

### 8.6 Analytics & third parties

| Service | Identifier | Notes |
|---|---|---|
| Google Tag / GA4 | `GT-NF7D37J8` | via `googletagmanager.com/gtag/js` |
| Google Ads | `AW-17960555673` | conversion tag |
| Google Site Kit | — | plugin-managed tag injection + event providers |
| Google reCAPTCHA v3 | site key `6LfwYh8rAAAAACYiT-C55qx9kCK-De96uJYM2aXg` | loads on **every** page, not only pages with forms; renders a persistent badge |
| Google Fonts | `fonts.googleapis.com` | 3 full families |
| YouTube | `youtube-nocookie` (privacy mode) | 20 project embeds + 1 showreel |

**There is no cookie consent banner anywhere on the site**, while GA4, Google Ads and
reCAPTCHA all load unconditionally on first paint. The privacy policy has a `COOKIES`
section. This is an owner/legal decision, not something to change unilaterally.

### 8.7 SEO metadata

- Yoast SEO 28.3 with JSON-LD `@graph`: `WebPage`, `BreadcrumbList`, `WebSite`
  (incl. `SearchAction`), `Organization` (name `We are NVF - Produtora Audiovisual`,
  logo 417×130).
- `robots`: `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`
- Canonicals present on all pages **except the 5 category archives**.
- `hreflang` present only on `/` and `/en/homepage-english/`. Absent from every other
  page including all 20 portfolio items.
- **`og:image` missing** on `/` and `/portfolio/`.
- **`og:description` missing** on all 20 portfolio pages.
- `og:description` on other pages is Yoast's auto-generated excerpt, truncated with
  `[&hellip;]`.
- Two sitemaps are exposed: Yoast's `sitemap_index.xml` and WP core's `wp-sitemap.xml`.
- Category archives are in **neither** sitemap.
- `/portfolio/` appears in `page-sitemap.xml` as page 36, which is not what that URL serves.

### 8.8 Performance

| Metric | Value |
|---|---|
| Homepage requests | **89** |
| Stylesheets | 30 |
| Scripts | 38 |
| Homepage HTML | 90 KB raw / 17.5 KB Brotli |
| Hero video transferred | **2.72 MB** (5.68 MB file, range-served) |
| Footer video on every page | **12.33 MB** `.mov` |
| Server TTFB | 530–620 ms uncached |
| Images with `loading="lazy"` | **0 of 5** |
| Modern image formats (WebP/AVIF) | **none** — all PNG/JPEG |
| Largest raster image | `download-1.png`, 1152×2048, **2.84 MB** |
| Oversized-for-use images | `digiUP_nvf.png` 4217×2501 served into a 300×178 slot; `NVF.png` 2431×2431; `NextVisionFILMS.png` 3071×945 |
| Render-blocking third parties | Google Fonts (3 families), reCAPTCHA, gtag |
| YouTube iframe | loaded eagerly on the homepage, not façade-loaded |

### 8.9 Accessibility

Measured on the homepage unless noted.

| Finding | Detail |
|---|---|
| **No `<h1>`** | homepage and all 5 category archives (6 of 34 pages) |
| Flat heading structure | homepage is 10 × `<h2>`, no hierarchy |
| Heading level skip | `/portfolio/` uses `<h3>` for `Moda & Identidade` among four sibling `<h2>`s |
| Images without `alt` | 3 of 5 on the homepage (logo ×2, digiUP logo) |
| Links without accessible name | 6 on the homepage: logo ×2, YouTube, Instagram, WhatsApp, digiUP |
| Buttons without accessible name | 2 on the homepage |
| Inputs without a programmatic label | newsletter email input relies on the `@ Email` placeholder alone |
| Duplicate nav landmarks | 6 `<nav>`, 20 links for 4 destinations — repeated tab stops |
| Hover-only content | card titles and the language dropdown have no keyboard or touch path |
| Autoplaying video | 4 on the homepage; not gated behind `prefers-reduced-motion` |
| `<track>` captions | absent on all 8 `<video>` elements (all decorative and muted) |
| Skip link | **present** (`Pular para o conteúdo` → `#content`) ✓ |
| `lang` attribute | `pt-PT` ✓ |
| Mobile menu ARIA | `aria-expanded` toggles correctly ✓ |

**Colour contrast (WCAG 2.1)**

| Foreground / Background | Ratio | Verdict |
|---|---|---|
| `#FFFFFF` on `#EFB025` (amber — the kit's **default button** fill) | **1.93** | ✗ fails at any size |
| `#EFB025` on `#F0EAD6` (pagination arrows on cream) | **1.60** | ✗ fails at any size |
| `#CC3366` on `#F0EAD6` (leaked default link colour) | 4.12 | ✗ fails AA normal text |
| `#FFFFFF` on `#D54B27` (rust CTA buttons) | 4.32 | ✗ fails AA normal text; passes for large text |
| `#6B6B6B` on `#F0EAD6` (kit text token) | 4.43 | ✗ marginally fails AA normal text |
| `#1E1E1E` on `#F0EAD6` (body text) | 13.85 | ✓ AAA |
| `#333333` on `#F0EAD6` | 10.50 | ✓ AAA |
| `#1E1E1E` on `#EFB025` | 8.66 | ✓ AAA |
| `#FFFFFF` on `#2A2A2A` | 14.35 | ✓ AAA |
| `#EFB025` on `#2A2A2A` | 7.45 | ✓ AAA |

---

## 9. Problems found

Catalogued for the owners. **None have been corrected** — the live site remains the
source of truth (CLAUDE.md §2). Each needs an explicit decision before the rebuild.

### 9.1 The English site is an empty stub — HIGH

`/en/homepage-english/` contains only the heading `Homepage – English`. No body content,
no Elementor layout. Polylang is installed and a language switcher is exposed in the
header, so visitors who click `en` reach a blank page. No other page has an English
translation.

### 9.2 The language switcher is invisible on mobile — HIGH

The globe control computes to a 0×0 rect below 768px and the mobile dropdown menu
contains no language link. The English version is unreachable from a phone.

### 9.3 Portfolio category descriptions appear shifted — HIGH

On `/portfolio/`, four of the five descriptions do not describe their heading:

| Heading | Published description describes |
|---|---|
| `Ficção` | fiction ✓ |
| `Moda & Identidade` | advertising for TV/cinema/digital |
| `Visual Storytelling` | documentary — "histórias reais… temas humanos e sociais" |
| `Corporativo` | fashion/lifestyle — "editoriais a campanhas e redes sociais" |
| `Casamentos` | corporate — "vídeos institucionais… identidade, missão e valores" |

The `Casamentos` description in particular tells a prospective wedding client about
institutional video. Needs owner-supplied corrected copy.

### 9.4 The privacy policy's navigation links point to digiUP — HIGH

All ten in-page `Navegação` anchors on `/politica-de-privacidade/` resolve to
`https://www.digiup.me/politica-de-privacidade/#…` rather than to the anchors on NVF's
own page. The policy sends readers to the agency's site.

### 9.5 Contact email displayed ≠ email linked — HIGH

On `/contactos/` the visible heading reads `nextvisionfilmsagency@gmail.com` while the
`mailto:` on the same element targets `hello@nextvisionfilms.com`. The footer uses
`hello@nextvisionfilms.com`. Owners must confirm which address is canonical.

### 9.6 `Ver Tudo` is a 404 on all 20 portfolio pages — HIGH

The button under `Mais trabalhos / Que poderás gostar` links to `/blog`, which does not
exist. It should presumably reach `/portfolio/`.

### 9.7 `dont-let-it-fool-you` embeds a YouTube Studio edit URL — HIGH

Its video source is `https://studio.youtube.com/video/e6aK4vEn420/edit` — an authenticated
creator-only URL. The ID `e6aK4vEn420` is the same video already published at
`ana-e-filipe-metro`, whose `<h1>` is `Don't Let It Fool You`. Two portfolio entries carry
near-identical titles in different categories and point at the same video.

### 9.8 Half the hover previews have no video source — HIGH

**10 of 20** cards render `<source src="" type="video/mp4">`: all 5 `Casamentos` items
plus `lost-lines-trailer`, `epitafio`, `dormencia-48h`, `dont-let-it-fool-you` and
`madrugada-prince-mark`. The hover handler runs and does nothing. `nvf-vs-antiqvvm` is
worse: its `<source>` is a `https://youtu.be/…` page URL, which a `<video>` element cannot
decode. Only **9 of 20** previews actually work.

### 9.9 A 12 MB QuickTime video autoplays in the footer of every page — HIGH

`helder_museu.mov` (12.33 MB, 6 seconds) loads on all 34 pages purely as footer
decoration. `.mov` is not a reliably supported browser container and there is no MP4 or
WebM fallback and no poster frame.

### 9.10 The hero video element is duplicated three times — MEDIUM

Three nested containers on the homepage each hold the same `We-are-NVF-copia.mp4`. The
browser decodes the same 1920×1080 stream up to three times.

### 9.11 Background videos have no poster — MEDIUM

Both hero and footer videos render as solid black until the first frame decodes. On
mobile this is the first thing a visitor sees.

### 9.12 The Elementor Kit's custom CSS is malformed — MEDIUM

`post-6.css` contains an orphan `*/`, an unmatched `}`, and a third `@font-face` for
`Minya` with an empty `src: ;`. Rules after the stray brace are at risk of being dropped
by the parser.

### 9.13 All custom CSS lives in the WP admin, not in the child theme — MEDIUM

`hello-theme-child-master/style.css` is empty boilerplate. Every bespoke rule sits in the
Elementor Kit field: no version control, no diffs, no review, and it is lost if the kit is
reset.

### 9.14 The portfolio grid uses fixed pixel heights — MEDIUM

`376px` / `440px` / `250px` with `object-fit: cover` instead of an aspect ratio, so the
crop of every thumbnail changes as the viewport widens.

### 9.15 The carousel pagination is positioned with `-42vw` — MEDIUM

`margin-left: -42vw` on the Swiper bullets. Alignment drifts continuously with window
width and is arbitrary at any size other than the one it was eyeballed at.

### 9.16 The GDPR consent checkbox is optional on the contact form — MEDIUM

`form_fields[field_08cf5ce]` on `/contactos/` is **not** `required`, though its label
reads `Declaro que li e que aceito a Política de Privacidade.` The equivalent checkbox on
the homepage newsletter form **is** required. Legal question for the owners.

### 9.17 No cookie consent mechanism — MEDIUM

GA4 (`GT-NF7D37J8`), Google Ads (`AW-17960555673`) and reCAPTCHA v3 all load on first
paint, before any consent, with no banner or preference centre. Owner/legal decision.

### 9.18 SEO metadata gaps — MEDIUM

No `og:image` on `/` or `/portfolio/`. No `og:description` on any of the 20 portfolio
pages. No canonical on any of the 5 category archives. `hreflang` only on 2 of 34 pages.
`/sobre/`'s `og:image` is a 100×22 colour swatch. Category archives are in no sitemap.
`/portfolio/` is listed in the sitemap as a page that URL does not serve.

### 9.19 Three Google Font families load, one is used — MEDIUM

`Roboto` and `Roboto Slab` are requested with every weight and italic and are not applied
to any rendered text. Only `Cabin` is used.

### 9.20 89 requests / 30 stylesheets / 38 scripts on the homepage — MEDIUM

Includes jQuery + jQuery Migrate + jQuery UI, SmartMenus for a menu with no submenus, an
inert colour-scheme switcher, and a Site Kit WPForms events provider for a plugin whose
markup is not present.

### 9.21 No lazy loading and no modern image formats — MEDIUM

0 of 5 homepage images use `loading="lazy"`. The showreel iframe loads eagerly. Every
image is PNG or JPEG; no WebP or AVIF. `digiUP_nvf.png` is 4217×2501 for a 300×178 slot.

### 9.22 The site is not cached at the edge — MEDIUM

No CDN. No `Cache-Control` on HTML. Polylang sets a cookie on every HTML response, which
defeats naive edge caching. TTFB 530–620 ms from Portugal; worse for distant visitors.

### 9.23 Accessibility failures — MEDIUM

Missing `<h1>` on 6 pages, three failing contrast pairs (worst 1.60:1), 6 unnamed links,
3 unlabelled images, hover-only content with no keyboard or touch path, and 20 duplicated
nav tab stops. Full detail in §8.9.

### 9.24 Copy inconsistencies (observations only — DO NOT change) — LOW

- Formal vs informal address: `/obrigado/` uses `a sua mensagem`; everywhere else uses
  `tua`/`te`.
- `/sobre/` reads `um bom produto de audiovisual não se impõe, sente-se`; `/` reads
  `um bom vídeo não se impõe, sente-se`.
- `Produção &Direção Artística` — no space after `&`.
- `roadtrips,  trilhos` — double space.
- `Se preferires contata-nos diretamente` — the site's own wording.
- The services page CTA reads `Vamos Conversar!` above a `Subscrever Newsletter` button.
- Page title casing is inconsistent: `Termos e Condições` vs `política de privacidade`.
- The four service names on `/servicos/` do not correspond to the five portfolio
  categories.
- The `Marco Ferreira, digiUP` testimonial is from the agency that built and hosts the
  site.

### 9.25 Orphan media in the library — LOW

`vcompress_210.mov` (46.11 MB, 3:09) and `videoplayback.mp4` (1.00 MB) are in the media
library and referenced by no page. Multiple near-duplicate SVG icons (3 LinkedIn,
3 YouTube, 6 phone, 3 email, 2 language) and unused logo variants including the only
vector logo, `NextVisionFILMS.svg`.

### 9.26 Poster/thumbnail filenames are non-descriptive — LOW

`ffffffffff.png`, `Capture.png`, `nath.png`, `museuuu.png`,
`image_2025-02-21_161051815.png`, `WhatsApp-Image-2025-05-26-at-10.16.54.jpeg`. Migration
to R2 is the natural point to introduce a naming convention.

### 9.27 Public surface that is probably unintended — LOW

`/feed/`, `/comments/feed/` and the full WordPress REST API are open and readable. WP
core's `wp-sitemap.xml` is exposed alongside Yoast's. `/wp-login.php` returning 404 and
`xmlrpc.php` being blocked are, by contrast, good hardening.

---

## 10. Modernization opportunities (recommendations only)

**Not approved. Not implemented. Listed for discussion.** Every item preserves the
existing content and the NVF identity.

### 10.1 Media presentation

1. Transcode the 9 `.mov` files to **H.264 MP4 + WebM/AV1**, keeping the visual result
   identical. Roughly 150 MB → an estimated 10–20 MB across the set.
2. Give every background and preview video a **poster frame** so nothing renders as a
   black box while decoding.
3. Serve the footer video **only where it earns its place**, or replace it with its own
   poster still. A 12 MB decorative loop on 34 pages is the single largest win available.
4. Render the hero video **once**, with responsive sources per breakpoint rather than
   three duplicated elements.
5. Convert posters and photography to **WebP/AVIF** with correctly sized variants, served
   from R2 through an image-transform layer.
6. Replace fixed card heights with **`aspect-ratio`**, so a thumbnail crops predictably at
   every width.
7. Use a **YouTube façade** (poster + play button that mounts the iframe on click) instead
   of eager embeds — the site already has poster images for exactly this.

### 10.2 Typography

8. Self-host **Barlow / Barlow Condensed / Space Mono** as `woff2` subsets with
   `font-display: swap`, dropping all Google Fonts requests.
9. Ship only the weights actually used, once the supplied files are inspected.
10. Introduce a **fluid type scale** (`clamp()`, rem-based) instead of ~10 hardcoded px
    sizes with per-element overrides.
11. Fix the navigation's `line-height: 20px` on `font-size: 21px`, which clips descenders.

### 10.3 Spacing & layout

12. Define a **spacing scale** as design tokens and apply it, replacing per-element
    Elementor overrides and the current 63–224px inter-section drift.
13. Remove the global `p { margin: 0 !important; }` and set paragraph rhythm properly.
14. Add a **wide-desktop tier** above 1140px — a video production portfolio benefits
    visibly from more room at 1440px+.
15. Rebuild the grid on CSS Grid with `minmax()` so column counts follow available width
    rather than three fixed breakpoint values.

### 10.4 Navigation & project browsing

16. Make the **language switcher reachable on mobile** and operable by keyboard and touch,
    not `:hover` alone.
17. Point `Ver Tudo` at `/portfolio/`.
18. Consider a **combined portfolio index** — all 20 projects with category filtering —
    alongside the current category landing page. Today, seeing everything requires
    visiting five separate archives.
19. Make "related work" actually related (same category, excluding the current item)
    instead of always the two newest.
20. Add **prev/next project navigation** on item pages.
21. Expose the existing WordPress-equivalent **search**, or drop the vestigial search CSS.

### 10.5 Interaction

22. Replace inline `onmouseover`/`onmouseout` handlers with event listeners plus a
    **touch/focus path**, so card previews and titles work on phones and keyboards.
23. Honour **`prefers-reduced-motion`**: pause autoplaying video and the carousel.
24. Reposition the carousel pagination with flow layout instead of `-42vw`.
25. Add restrained scroll-reveal transitions consistent with the existing 0.3–0.4s easing,
    rather than the current all-or-nothing (no entrance animation, hover-only reveals).

### 10.6 Accessibility

26. One `<h1>` per page and a real heading hierarchy; fix the stray `<h3>` on `/portfolio/`.
27. Accessible names for the logo, the three social links and the digiUP link.
28. Visible `<label>`s (or `aria-label`) on every form field.
29. Resolve the three failing contrast pairs — darken the amber, or pair it with `#1E1E1E`
    rather than white, keeping the palette itself intact.
30. Emit navigation **once** and drive both layouts from CSS, removing 16 duplicate tab
    stops.
31. Visible focus states throughout.

### 10.7 Performance & delivery

32. Static or edge-rendered output on **Cloudflare**, removing the 530–620 ms uncached PHP
    TTFB.
33. Cut the 30-stylesheet / 38-script Elementor payload; the site needs no jQuery, no
    jQuery UI, no SmartMenus and no imagesLoaded.
34. Native `loading="lazy"` on below-the-fold images plus `fetchpriority="high"` on the
    hero.
35. Load reCAPTCHA only on pages that actually have a form.
36. Preload the two or three fonts that appear above the fold.
37. Target measurable Core Web Vitals (LCP < 2.5 s, CLS < 0.1, INP < 200 ms) and record
    before/after.

### 10.8 SEO & metadata

38. Per-page `og:image` and `og:description`, including all 20 portfolio items — the
    posters already exist.
39. Canonicals on category archives; category archives into the sitemap.
40. Structured data: `VideoObject` per project, `Organization`, `BreadcrumbList`.
41. One sitemap, not two.
42. `hreflang` on every page — once the English content question (§9.1) is settled.

### 10.9 Maintainability & owner workflow

43. Model portfolio items as **structured content** (MDX/JSON/CMS entries) with typed
    fields — title, date, category, YouTube ID, poster, preview video, tagline — so adding
    a project is one entry plus assets, never a layout edit.
44. Keep media in **R2** behind a stable URL scheme (`/projects/{slug}/poster.webp`,
    `/projects/{slug}/preview.mp4`) so files can be swapped without touching code.
45. Introduce a **descriptive asset naming convention** at migration time (§9.26).
46. Put every design token — the cream/amber/rust palette, spacing, type scale — in one
    place, so a future restyle is a token change.
47. Leave a clean seam for a lightweight CMS (Cloudflare-friendly, git-backed or headless)
    without needing a rewrite.
48. Keep all custom CSS **in the repository**, never in an admin field (§9.13).
49. Component-ise the repeated blocks — header, footer, newsletter, project card, related
    grid — which are currently duplicated Elementor templates.

### 10.10 Content & internationalisation (owner decisions first)

50. Decide the fate of the English version: translate properly, or remove the switcher.
51. Obtain corrected category descriptions (§9.3).
52. Confirm the canonical contact email (§9.5).
53. Repoint the privacy-policy anchors at NVF's own page (§9.4).
54. Decide on cookie consent (§9.17) and on whether the contact consent checkbox should be
    required (§9.16).

---

## 11. Not inspected / UNKNOWN

- **WordPress admin** — no credentials. Plugin list, theme settings, Elementor template
  internals, form submission destinations (recipient address, autoresponder,
  integrations) and Polylang configuration are all inferred from public output only.
- **WordPress core version** — not disclosed in the markup.
- **nginx version, PHP version, database** — not disclosed.
- **Hosting provider name** — reverse DNS resolves to `hosting235.serverhs.org`; the
  underlying provider is UNKNOWN. DNS is managed by digiUP (`*.digiupcloud.pt`).
- **Domain registrar and ownership** — UNKNOWN. Relevant, because moving to Cloudflare
  requires a nameserver change away from digiUP's servers.
- **Who receives contact form submissions** — UNKNOWN.
- **Newsletter destination** — the form posts to `admin-ajax.php`; whether it feeds
  Mailchimp, Brevo, a WP table or nothing at all is UNKNOWN.
- **Form submission not tested** — sending a live message to the owners' inbox would be an
  outward-facing action, so no form was submitted.
- **Google Analytics / Search Console data** — no access. Real traffic, top pages, device
  split and Core Web Vitals field data are UNKNOWN.
- **Whether `/obrigado/` is actually the configured redirect** — inferred from the page's
  content and modification date, not confirmed in the form settings.
- **29 media library attachments** (93 total minus 64 REST-readable) — not enumerable
  anonymously.
- **Exact size and duration of `FILM-IN-video-2-sem-nvf-v2.mp4`** — the file is referenced
  in markup but absent from the REST media response.
- **`Group-140.png` (1362×378)** — present in the library, use UNKNOWN.
- **Real-device testing** — all responsive observations come from browser viewport
  emulation at 1440×900 and 375×812, not physical hardware.
- **Field performance** — all timings are lab measurements from a single location in
  Portugal.
- **Print styles, RSS rendering, 404 page design** — not audited.
- **Historical versions** — no archive comparison was made.

---

## Appendix — data files

| File | Contents |
|---|---|
| `docs/content/termos-e-condicoes.txt` | Verbatim full text of the Terms page |
| `docs/content/politica-de-privacidade.txt` | Verbatim full text of the Privacy Policy page |
| `docs/content/portfolio_items.json` | Structured record of all 20 portfolio items |
| `docs/content/media_inventory.json` | All 77 upload URLs referenced across the site |
| `docs/content/media.json` | WordPress REST media library dump (64 readable attachments) |
| `docs/content/extracted.json` | Per-page extraction: headings, text, links, images, videos, forms, widgets, meta |
