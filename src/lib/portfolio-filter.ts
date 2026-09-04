/**
 * Portfolio filtering — an enhancement on top of five real pages.
 *
 * With JavaScript off, every filter is a link to a route that exists and renders the
 * right work. With JavaScript on, the same link filters the catalogue already in the
 * document and pushes that route into history, so the URL stays shareable, Back and
 * Forward behave, and a reload lands on the real page.
 *
 * Only runs where the whole catalogue is present — `/portfolio/`. On one of the
 * `/categoria-portfolio/…` archives the other projects are not in the DOM, so the links
 * navigate, which is the correct behaviour rather than a fallback.
 *
 * ── Review E: the click has to be taken before the router sees it ────────────
 * This listener used to sit in the bubble phase, and `ClientRouter`'s own document click
 * handler is also in the bubble phase and is registered FIRST, because its script is
 * earlier in the document. So both ran: the catalogue filtered itself in place, and the
 * router simultaneously fetched and swapped in the server-rendered category archive.
 * The reader landed somewhere correct, having paid a network round trip and a full DOM
 * swap to look at twenty cards that were already on the screen — and, once page
 * transitions were tokenised, a route dissolve on top.
 *
 * Filtering is supposed to be the fastest thing on the site. So the handler is now in the
 * CAPTURE phase and stops the event there: nothing downstream, router included, ever sees
 * a filter click. Everything else about the contract is unchanged — it is still a real
 * link to a real route, it still pushes that route into history, and a modified click is
 * still the browser's.
 */

import { FILTER_ALL } from './portfolio.ts';

interface Teardown { destroy(): void }

/** Which filter a path represents. The route IS the state; nothing else stores it. */
function filterFromPath(pathname: string): string {
  const m = /\/categoria-portfolio\/([^/]+)\/?$/.exec(pathname);
  return m?.[1] ?? FILTER_ALL;
}

export function initPortfolio(): Teardown {
  const index = document.querySelector<HTMLElement>('[data-portfolio]');
  if (!index || !index.hasAttribute('data-portfolio-enhance')) return { destroy() { /* nothing */ } };

  const cards = [...index.querySelectorAll<HTMLElement>('[data-category]')];
  const status = index.querySelector<HTMLElement>('[data-portfolio-status]');
  const links = [...document.querySelectorAll<HTMLAnchorElement>('.pf-filter')];
  const cleanups: Array<() => void> = [];

  const apply = (filter: string, announce: boolean) => {
    let shown = 0;
    for (const card of cards) {
      const match = filter === FILTER_ALL || card.dataset['category'] === filter;
      card.hidden = !match;
      if (match) shown += 1;
    }

    if (filter === FILTER_ALL) index.removeAttribute('data-filter');
    else index.setAttribute('data-filter', filter);

    let label = '';
    for (const a of links) {
      const current = a.dataset['filter'] === filter;
      if (current) {
        a.setAttribute('aria-current', 'page');
        label = a.querySelector('.pf-filter__name')?.textContent?.trim() ?? '';
      } else {
        a.removeAttribute('aria-current');
      }
    }

    // Screen readers get the result of the action, not the action itself.
    if (announce && status) status.textContent = `${label}: ${shown}`;
  };

  const onClick = (event: MouseEvent) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('.pf-filter');
    if (!link) return;
    // Modified and middle clicks belong to the browser: these are real links.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

    event.preventDefault();
    // Taken here, so ClientRouter's own bubble-phase handler never runs for this click.
    event.stopPropagation();
    const filter = link.dataset['filter'] ?? FILTER_ALL;
    apply(filter, true);
    // The pushed URL is the route that would have rendered this view, so a reload,
    // a share or a bookmark all land somewhere real.
    history.pushState({ filter }, '', link.href);
  };

  const onPop = () => apply(filterFromPath(location.pathname), false);

  document.addEventListener('click', onClick, true);
  window.addEventListener('popstate', onPop);
  cleanups.push(() => {
    document.removeEventListener('click', onClick, true);
    window.removeEventListener('popstate', onPop);
  });

  // The server already rendered the right state; sync in case we arrived through history.
  apply(filterFromPath(location.pathname), false);

  return { destroy() { for (const fn of cleanups) fn(); cleanups.length = 0; } };
}
