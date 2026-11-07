# Admin coverage: every page against the admin

Audited 2026-11-07 after owner feedback ("no comercial não corresponde /admin e site normal").
For each page: what a visitor sees, and where the owners change it in the admin. Keep this
current whenever a page starts showing something new.

Legend: **Editable** · **Fixed (why)** · **Not on the site**.

## Início (`/`)

| On the page | In the admin |
|---|---|
| Opening film | Editable: Início › Página inicial › Vídeo da página inicial (pick or upload) |
| Logo cycling N → NVF → NEXT VISION FILMS | Fixed: the brand mark (design) |
| "Loving every frame" | Editable: Definições › Textos do site › Frase da marca (**new**) |
| "HELLO" in the opening animation | Editable: Definições › Textos do site › Palavra da abertura (**new**) |
| Description Google shows | Editable: Início › Página inicial › Frase para pesquisa no Google |
| "Frase de abertura" (2 lines) | Not on the site since 2026-11-06: **removed from the admin** |

## Sobre (`/sobre/`)

| On the page | In the admin |
|---|---|
| Label, title, two story paragraphs | Editable: Sobre › Páginas › Página Sobre |
| "Loving every frame" | Editable: Textos do site (**new**) |
| Each person: portrait, name, role | Editable: Sobre › Equipa (+ to add, bin to delete) |
| Each person's links | Editable: add, remove, reorder, network (**new**; before, only the address) |
| LET'S TALK reel | Editable: Textos do site › Bobine (**new**) |
| Side label "About" | Editable: Textos do site › Nome da secção Sobre (**new**) |

## Comercial (`/servicos/`)

| On the page | In the admin |
|---|---|
| Title | Editable: Comercial › Páginas › Página Serviços |
| Carousel opening images, in order | Editable: Comercial › Carrossel, one card each (**new layout**) |
| Projects that follow in the carousel | Editable: the categories (Carrossel › Escolher categorias); each project in Cinema |
| YouTube videos under the carousel | Editable: Comercial › Vídeos, one card each (**new layout**) |
| LET'S TALK reel | Editable: Textos do site (**new**) |
| Share image, Google description | Editable: Página Serviços (the Google text stays locked: it must match the marked words) |
| The four services, the testimonials | Not on the site since 2026-10-29: **no longer offered in Comercial** |

## Cinema (`/portfolio/`, a project, a category)

| On the page | In the admin |
|---|---|
| "Loving every frame" | Editable: Textos do site (**new**) |
| Every project: cover, title, line, year, category, film, trailer, IMDb, hidden, opening clip, page blocks | Editable: Cinema › Projetos (+ to add, bin to delete) |
| Portfolio order | Editable: Cinema › Projetos › Mudar a ordem |
| Category names and pages | Editable: Cinema › Categorias (+ to add, bin to delete) |
| "Mais em …" related projects | Fixed: chosen automatically from the category (src/lib/related.ts) |
| Buttons and labels (Ver trailer, Voltar…) | Fixed: interface text, in both languages, in src/i18n |

## Know more about us (`/bts/`)

| On the page | In the admin |
|---|---|
| Title | Editable: Textos do site › Nome da secção Know more about us (**new**) |
| Social links | Editable: Definições › Contactos e redes sociais (**new**: add, remove, reorder) |

## Contactos (`/contactos/`) and Obrigado (`/obrigado/`)

| On the page | In the admin |
|---|---|
| Top image, title, question, text, button, headings | Editable: Definições › Página Contactos |
| Phone numbers and the call-cost note | Editable: numbers in Contactos e redes sociais (**new**: add, remove, reorder); note in Página Contactos |
| Social links | Editable: Contactos e redes sociais (**new**: add, remove, reorder) |
| E-mail | Fixed (decision D2): three candidate addresses; the owners must choose one |
| Form labels and the consent sentence | Fixed: tied to how messages are sent |
| Thank-you page title, message, button | Editable: Definições › Página Obrigado |

## On every page

| On the page | In the admin |
|---|---|
| Section names in the menu, footer and page sides | Editable: Textos do site, both languages (**new**; before, locked) |
| Section colours and the logo stripes | Fixed: design |
| Copyright line | Fixed: the year is automatic, the words are the original |
| Privacy policy, Terms | Fixed: legal text, checked word for word (CLAUDE.md §10, rule 10) |
