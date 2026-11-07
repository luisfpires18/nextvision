/**
 * The admin's three action icons, one drawing each, shared by the server-rendered editors
 * and the rows the browser draws (admin-client.ts).
 *
 * The owners asked for the actions to read without words (2026-11-07): add is a green
 * plus, remove a red bin, edit a white pencil. The button carries the words for a screen
 * reader and a tooltip (`aria-label` and `title`); the drawing is `aria-hidden`. Colours
 * and size live in admin.css (`.ico`), never here.
 */

const draw = (d: string) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;

export const ICON = {
  add: draw('M12 5v14M5 12h14'),
  remove: draw('M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6'),
  edit: draw('M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4'),
  /** Read-only items (locked, or not editable yet): an eye, never the pencil. */
  view: draw('M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'),
  close: draw('M6 6l12 12M18 6L6 18'),
  search: draw('M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4'),
} as const;

export type IconName = keyof typeof ICON;
