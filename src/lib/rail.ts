/**
 * The rail's stripes, with no browser link bubble.
 *
 * A browser shows the address of any element with an `href` in its own status bubble on
 * hover, and no page can style or hide that. The owners asked for it gone from the menu, so
 * once scripting is running a stripe no longer has an `href`: the address moves to
 * `data-rail-href` and these listeners navigate.
 *
 * The built HTML keeps real links on purpose. With scripting off, for a crawler, and in
 * every validator that reads the output, a stripe is an ordinary link (decision C3).
 *
 * Removing `href` removes what the browser gave for free, so this file gives it back: the
 * link role, a place in the tab order, Enter, and opening a new tab with a modifier key or
 * the middle button. A right-click no longer offers "open in new tab"; no script can restore
 * that.
 */

import { navigate } from 'astro:transitions/client';

const HREF_ATTR = 'data-rail-href';

/** Run on the live document, and on each incoming one before it is swapped in. */
export function stripRailLinks(doc: Document): void {
  for (const stripe of doc.querySelectorAll<HTMLElement>('.rail__stripe[href]')) {
    stripe.setAttribute(HREF_ATTR, stripe.getAttribute('href') ?? '');
    stripe.removeAttribute('href');
    stripe.setAttribute('role', 'link');
    stripe.setAttribute('tabindex', '0');
  }
}

/** The stripe an event belongs to, and where it leads. */
const destinationOf = (event: Event): { stripe: HTMLElement; href: string } | null => {
  const stripe = (event.target as Element | null)?.closest?.<HTMLElement>(`[${HREF_ATTR}]`);
  const href = stripe?.getAttribute(HREF_ATTR);
  return stripe && href ? { stripe, href } : null;
};

const inNewTab = (href: string) => window.open(href, '_blank', 'noopener');

const follow = (event: MouseEvent | KeyboardEvent) => {
  const hit = destinationOf(event);
  if (!hit) return;
  event.preventDefault();
  if (event.metaKey || event.ctrlKey || event.shiftKey) inNewTab(hit.href);
  else void navigate(hit.href, { sourceElement: hit.stripe });
};

/** Wired once, to the document, because the router outlives every page. */
export function initRail(): void {
  document.addEventListener('click', follow);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') follow(event);
  });
  document.addEventListener('auxclick', (event) => {
    if (event.button !== 1) return;
    const hit = destinationOf(event);
    if (!hit) return;
    event.preventDefault();
    inNewTab(hit.href);
  });
}
