# Admin redesign plan

Status: **Phase 1 released** to the live admin (2026-11-07). **Phases 2 and 3 built** the same
day (docs/PROJECT_CONTEXT.md §39). Scope is the owners' admin at `/admin/` only. The public site does not change.

## 1. Why

The owners find the admin hard to use. It is a dark "edit bay" with three columns: the section
stripes, a long text list of items, and the open item with a preview. An owner could not find
"Novo projeto" (listed under 21 projects) or "Apagar projeto" (at the bottom of a long form). The
icon pass of 2026-11-07 helped, but the structure itself is the problem.

The user asked for:

- items shown as **cards in a grid**, with **filtering** and **pagination**;
- **Edit** and **Delete** in the **top-right corner of each card**;
- Edit opens a **modal**; Delete opens a **confirmation modal**;
- **Add** in the **top-right corner of the page**;
- a **light, clean** look;
- Add and Delete for **everything that is a list of items**: projects, team members, services,
  categories (decided 2026-11-07).

Deletion happens **on Publicar**, as every other change does today: the card shows "Vai ser
apagado" with Undo until then (decided 2026-11-07).

## 2. Guiding principles

Skills used: `impeccable` (shape, Operate mode) and `frontend-design`. `design-taste-frontend` is
installed, but it is written for marketing sites, so it is used only as a check against generic
output.

- **Operate mode.** The owners come to change something and leave. Familiar patterns win: cards,
  a toolbar, pagination, standard dialogs. Brand shows in precise details, not decoration.
- **One component vocabulary.** The same card, the same three icons (icons.ts: green plus, red
  bin, cream pencil) and the same dialog on every screen. If two screens differ, one is wrong.
- **Nothing about publishing changes.** Drafts, one Publicar, per-field freshness checks, upload
  ingest and the validators all stay. This is a new shell around the editors that already work.
- **CLAUDE.md still binds:** tokens only (§4), one `<h1>` per page, visible focus, 4.5:1 text,
  every action reachable by keyboard (§11), no invented copy (§2 and §8). New admin copy is
  interface wording, in Portuguese, plain and active ("Apagar", "Guardar", "Cancelar").

## 3. Information architecture

The five sections stay (they are the site's own map), plus Definições. Each section is **one page
with tabs**, one tab per kind of item, and each tab is a card grid.

| Section | Tabs (cards) | Add | Delete |
|---|---|---|---|
| Início | Página inicial (1) | — | — |
| Sobre | Página Sobre (1) · **Equipa** (2) | Equipa | Equipa |
| Comercial | Página Serviços (1) · **Serviços** (4) · Testemunhos (0, read-only) | Serviços | Serviços |
| Cinema | **Projetos** (21) · **Categorias** (5) · Página Portfólio (1) | Projetos, Categorias | Projetos, Categorias |
| Know more about us | Página (read-only) | — | — |
| Definições | Contactos e redes · Página Contactos · Página Obrigado · Menu (locked) · Páginas legais (locked) | — | — |

Pages and settings are single items, so they have Edit only. Locked items show a padlock and
open read-only. The carousel images and the videos stay **inside** the Página Serviços edit
modal, with the icon lists already built.

`/admin/` (overview) becomes a small dashboard. It shows one card per section with its item
count, how many drafts are waiting, and the last publish ("Site atualizado há 23 min").

## 4. Layout

```
┌──────────────┬──────────────────────────────────────────────────────────────┐
│ NVF          │ Cinema                                    [Publicar (3)] [+] │
│              │ Projetos 21 · Categorias 5 · Página Portfólio                │
│ ▌Início      ├──────────────────────────────────────────────────────────────┤
│ ▌Sobre       │ [Procurar…]  [Categoria ▾] [Ano ▾] [Estado ▾]  [Ordenar ▾]   │
│ ▌Comercial   ├──────────────────────────────────────────────────────────────┤
│ ▌Cinema  ◀   │ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│ ▌Know more   │ │ [img] ✎ 🗑 │ │ [img] ✎ 🗑 │ │ [img] ✎ 🗑 │ │ [img] ✎ 🗑 │  │
│              │ │ Title      │ │ Title      │ │ Title      │ │ Title      │  │
│ Definições   │ │ 2026·Ficção│ │ 2025·…     │ │ …          │ │ …          │  │
│              │ └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
│              │   … 3 rows of 4 = 12 per page …                              │
│              │                 ‹  1  2  ›   A mostrar 1–12 de 21            │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

- **Sidebar:** the sections, each with its brand-colour stripe. On a phone it becomes a top bar
  with a menu.
- **Page header:** the section title (the one `<h1>`), the tabs, **Publicar (n)** and the green
  **+** in the top-right corner. The + adds to the current tab, and its label says what it adds
  ("Novo projeto", "Novo membro da equipa"). It is absent on tabs that cannot add.
- **Toolbar** (per tab, only the filters that tab needs): search, filter dropdowns and sort.
  Filters and the page number live in the URL (`?q=&categoria=ficcao&p=2`), so reload, back and
  sharing a link all keep the view.
- **Grid:** `repeat(auto-fill, minmax(16rem, 1fr))`, giving 4 columns on desktop, 2 on a tablet
  and 1 on a phone.
- **Pagination:** 12 per page, with previous/next, page numbers and "A mostrar 1–12 de 21". It is
  hidden when everything fits on one page (every tab except Projetos today).

## 5. The card

```
┌──────────────────────────┐
│ [thumbnail 16:9]  [✎][🗑]│  ← top-right; pencil cream/ink, bin red
│                          │
├──────────────────────────┤
│ Agente Imobiliário sem…  │  title, 2 lines max
│ 2026 · Ficção            │  meta, per type
│ ● Alterações por publicar│  status chip, only when relevant
└──────────────────────────┘
```

- **Thumbnail:** project poster, team portrait, category's first project poster, or the page's
  lead image. A neutral tile with the item's initial when there is none. Images are lazy-loaded.
- **Meta, per type:** project = year · category; team = role; service = its order; category =
  "7 projetos"; page = "Página".
- **Status chips** (one at a time, most important first): **Vai ser apagado** (red, with
  Undo), **Novo, por publicar**, **Alterações por publicar** (yellow dot), **Escondido**
  (projects hidden from the site), **Bloqueado** (padlock).
- **Whole card is not a link.** Only the two corner buttons act, so a click on a picture never
  does something unexpected. Both are real `<button>`s with `aria-label` and a tooltip
  ("Editar «Leonor»", "Apagar «Leonor»"). Focus order: card title (a heading), Edit, Delete.
- **Pending delete:** the card dims, the chip reads "Vai ser apagado ao publicar", and the bin
  turns into an Undo button.

## 6. Modals

All three are native `<dialog>` elements, with a focus trap, Escape to close and focus returned
to the button that opened them.

**Edit modal.** It is large (up to 72rem wide, full screen on a phone). It has a header with the
item's title and a close button, the form, and, on screens at least 70rem wide, the live preview
beside it (the existing iframe). The footer reads **Guardar** (keeps the changes as drafts, then
closes) and **Cancelar** (drops this modal's changes). Escape with unsaved changes asks first.
The form inside is the **existing editor** for that item: `Editor.astro`, `ProjectEditor.astro`,
`EntryEditor.astro` or `OrderEditor.astro`, restyled but not rewritten.

- *How it opens:* the modal has its own URL (`/admin/cinema/projetos/leonor/`). That URL renders
  the grid **with the dialog already open**, and closing it goes back to the grid's URL. This
  keeps today's server-side reading from GitHub at open time (always fresh), works with
  back/forward and reload, and needs no fragment-loading layer.
- *Change from today:* edits stay in the modal until **Guardar**. Today every keystroke is a
  draft. Guardar writes the same drafts in the same format, so Publicar does not change.

**Delete modal.** It is small. "Apagar «Leonor»?", followed by one sentence on what happens ("Sai
do site quando carregar em Publicar. Até lá pode desfazer."), then **Apagar** (red) and
**Cancelar**. Projects keep their extra rule: deletion is refused while another project lists
this one as related, and the modal says which. Categories are refused while any project or the
Serviços carousel uses them, and the modal lists them. A team needs at least one person.

**Add modal.** It is the edit modal with an empty form. Projects reuse `NewProject.astro`, which
creates the project when its cover finishes processing. Team members, services and categories
get new "create" forms built from their existing field lists (`entries.ts`).

**Ordering** (portfolio order, team order, service order) is an **Ordenar** button in the
toolbar that opens the reorder list (`OrderEditor.astro`) in a modal, rather than a separate
"Ordem" item.

## 7. Look (light and clean)

Tokens are scoped to `.admin` in `admin.css`, and every value is a token from `tokens.*.css`.

- **Ground:** brand cream `#FFFAEC`. **Cards and dialogs:** a lighter mix of cream (a new token,
  for example `--a-card: color-mix(in srgb, var(--brand-cream) 40%, white)`) with a hairline
  border in an ink mix. No drop-shadow stacks; one soft elevation for dialogs only.
- **Text:** ink `#292929`; secondary text is an ink mix, checked at 4.5:1 on cream and on the card.
- **Section colour:** the sidebar stripe, the active tab underline and the page title rule only.
  Orange and yellow are never used for text (their contrast fails, per `tokens.colour.css`).
- **Actions:** green + (add), red bin (delete), cream pencil with an ink drawing on a hairline
  border (edit), so it is visible on a cream card. Primary button (Guardar, Publicar) is ink on
  yellow, as today.
- **Type:** Barlow for everything in the interface. Barlow Condensed only for the section title
  and the dialog title. No monospace labels.
- **Motion:** 150–250 ms dialog fade and scale using the motion tokens, honouring
  `data-motion`. Nothing else moves.

## 8. Server and data work

| Change | Where | Notes |
|---|---|---|
| Create an entry (team, service, category) | `src/lib/admin/entries.ts`, `src/admin/api/publish.ts` | Draft `equipa/novo-<tempid>:criar` holding the JSON; publish writes the new file. The id comes from the name through `slug.ts`, and a taken id is refused. |
| Delete an entry | same | Draft `<prefix>/<id>:apagar` holding the confirmed name, mirroring the project removal (`projects.ts` `removalWrites`). |
| Reference guards | `entries.ts` | A category used by a project or by `services.json` `categories` can't be deleted; at least one team member must remain. The refusal names what blocks it. |
| Team portrait on create | `uploads.ts`, `media-ingest.mjs` | Pick an existing image, or upload one. An upload creates the member when it finishes processing, like a new project's cover. |
| Card data | `src/lib/admin/content.ts` | Each item gains `thumb`, `meta`, `status` and `can: { edit, delete }`; one function decides them. |
| Tests | `scripts/test-admin.mjs` | Create and delete per type, each guard, id collisions, and a stale draft. |

Two consequences to confirm with the owners when this ships:

- **Services are not shown on the site** (removed from `/servicos/` on 2026-10-29), so adding
  or deleting one changes nothing visible until they come back. The text stays in the archive
  either way (CLAUDE.md §2).
- **A third team member** works on `/sobre/`, because the team columns are derived from however
  many portraits exist. A very wide or tall portrait still shapes its column.

## 9. Files

- **New:** `src/admin/AdminShell.astro` (sidebar, header, Publicar), `CardGrid.astro` (toolbar,
  grid, pagination), `ItemCard.astro`, `Modal.astro`, `ConfirmDelete.astro`, `EntryCreate.astro`,
  and client modules `src/admin/client/grid.ts` (filter, sort, paginate, URL state) and
  `client/modal.ts` (open, close, Guardar/Cancelar, unsaved-changes check).
- **Restructured:** `AdminRoute.astro` (route → section page + optional open dialog),
  `admin-client.ts` (split per concern; the draft store and Publicar logic move unchanged),
  `admin.css` (rewritten for the light theme).
- **Kept as they are, inside the dialog:** `Editor.astro`, `ProjectEditor.astro`,
  `EntryEditor.astro`, `NewProject.astro`, `OrderEditor.astro`, `ListEditor.astro`,
  `BlocksEditor.astro`, `UploadPanel.astro`, `icons.ts`.

## 10. Phases

Each phase ships to `dev`, the owners try it, then it goes to production.

1. **Shell, cards and the edit modal.** Light theme, sidebar, tabs, grid with filters and
   pagination, edit modal reusing the editors, Guardar/Cancelar. Delete is still the existing
   project removal, now behind the confirm modal. (Largest phase.)
2. **Add and delete for team, services and categories.** Server work, guards, tests, create
   forms.
3. **Overview dashboard, phone layout, finish.** Overview cards, mobile pass, an `impeccable
   audit` and `polish` pass, docs (`ADMIN_DASHBOARD_PLAN.md` status, `PROJECT_CONTEXT.md`).

## 11. Verification

- `npm run test:admin` with the new checks, and the full `verify` chain on an LF copy (Windows
  checkout; see CLAUDE.md §10.1). CI runs `verify` on Linux on every push.
- In `astro dev` against `npm run mock:github`, run the whole owner flow: filter to Ficção,
  move to page 2, reload (the view is kept), edit a project and Guardar (the card shows
  "Alterações por publicar"), Cancelar (nothing changes), delete then Undo, delete then
  Publicar (the mock removes the file), add a team member with a portrait, try to delete a
  category in use (refused, naming the projects), Publicar, then check the mock's files.
- Keyboard only: every card action, the dialogs (focus trap, Escape, focus return) and
  pagination. Check at 1440 px, 768 px and 375 px.
- Screenshots of each section for the owners before the first deploy.

## 12. Open questions for the owners

- Should Testemunhos (0 today) get Add, so they can start using it? It is not shown on the site
  either.
- Should the "Know more about us" page get anything editable? It has no editable fields now.
