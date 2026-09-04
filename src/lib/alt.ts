/**
 * Alternative text, DERIVED from content the site already holds — PHASE 11.
 *
 * ── The rule ─────────────────────────────────────────────────────────────────
 * Alt text is a description of an image, and we have not been told what is in these
 * images. So nothing here describes one. Every string this file produces is assembled
 * from facts already in the content model — a person's name, a film's title, its position
 * in a set — and nothing else. No adjective, no atmosphere, no "cinematic shot of…".
 * That is the same rule that stops the project pages inventing prose (CLAUDE.md §8).
 *
 * ── The other half of the rule, which matters just as much ───────────────────
 * An image whose meaning is already carried by adjacent text must have EMPTY alt, not a
 * restatement of that text. A screen reader that hears the film's title from the `alt`
 * and then hears it again from the `<h1>` two elements later is worse served than one
 * that hears it once.
 *
 * So this file is used in exactly two situations, and `alt=""` remains correct everywhere
 * else — which is most places on this site, because most images here sit inside a link or
 * under a heading that names them:
 *
 *   named-subject images   a portrait of a person the page names in a heading BELOW it,
 *                          where the picture is the subject rather than decoration
 *   orphan frames          the editorial stills on a project page, which sit in figures
 *                          with no caption and no adjacent text of their own
 *
 * Empty alt on the hero screen, on every project card and on the next-project frame is
 * therefore a decision, not an omission: the card's own `<a>` already announces "title,
 * category, date", and the hero's `<h1>` is the next thing read.
 */

import { DEFAULT_LOCALE, type Locale } from '../config/i18n.ts';

/**
 * A still taken from a film, identified by the film and by its position in the set.
 *
 * The index is included because these arrive in groups of two to six: without it a
 * screen-reader user hears the same six words six times and cannot tell the frames apart
 * or refer to one of them. It is a fact about the page, not a claim about the picture.
 */
export function frameAlt(title: string, index: number, total: number, locale: Locale = DEFAULT_LOCALE): string {
  if (total <= 1) {
    return locale === 'en' ? `Frame from ${title}` : `Fotograma de ${title}`;
  }
  return locale === 'en'
    ? `Frame ${index + 1} of ${total} from ${title}`
    : `Fotograma ${index + 1} de ${total} de ${title}`;
}

/** A photograph of a named person. The name is the only fact the content carries. */
export function portraitAlt(name: string, locale: Locale = DEFAULT_LOCALE): string {
  return locale === 'en' ? `Portrait of ${name}` : `Retrato de ${name}`;
}
