/**
 * Cinema — DESIGN V2. Two small enhancements on /portfolio/, neither required.
 *
 *   VIEW     shelf or list. Without JavaScript both are on the page, one after the other,
 *            and every project is a link in each. With it, one shows at a time; the choice
 *            is `?view=list` in the URL (replaceState, not a new history entry), so it is
 *            shareable and survives a reload, and the category filter's own routes are
 *            untouched.
 *   POSTER   pointing at or focusing a spine stands that film up in the poster slot. It
 *            is a preview, never a navigation: pressing the spine follows its link.
 */

interface Teardown { destroy(): void }

/** The view a URL asks for. The ONE reading of `?view=`, shared with the router hook. */
const viewOf = (url: URL): 'list' | 'shelf' => (url.searchParams.get('view') === 'list' ? 'list' : 'shelf');

/**
 * Sets the view on an INCOMING document, before the router swaps it in. The server sends
 * `data-view="both"` (the no-script state), and `initCinema` runs only at page-load, so
 * without this the view-transition snapshot showed the shelf AND the list, which then
 * collapsed after the slide.
 */
export function presetCinemaView(doc: Document, url: URL): void {
  const root = doc.querySelector<HTMLElement>('[data-cinema]');
  if (root) root.dataset['view'] = viewOf(url);
}

export function initCinema(): Teardown {
  const root = document.querySelector<HTMLElement>('[data-cinema]');
  if (!root) return { destroy() { /* not this page */ } };
  const cleanups: Array<() => void> = [];
  const on = (t: EventTarget, type: string, fn: EventListener) => {
    t.addEventListener(type, fn);
    cleanups.push(() => t.removeEventListener(type, fn));
  };

  /* ── view ── */
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-view-set]')];
  const setView = (view: string, write: boolean) => {
    root.dataset['view'] = view;
    for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset['viewSet'] === view));
    if (!write) return;
    const url = new URL(location.href);
    if (view === 'list') url.searchParams.set('view', 'list'); else url.searchParams.delete('view');
    history.replaceState(history.state, '', url);
  };
  setView(viewOf(new URL(location.href)), false);
  for (const b of buttons) on(b, 'click', () => setView(b.dataset['viewSet'] ?? 'shelf', true));

  /* ── poster ── */
  const img = root.querySelector<HTMLImageElement>('[data-poster-img]');
  const avif = root.querySelector<HTMLSourceElement>('[data-poster-avif]');
  const title = root.querySelector<HTMLElement>('[data-poster-title]');
  const meta = root.querySelector<HTMLElement>('[data-poster-meta]');
  const links = [...root.querySelectorAll<HTMLAnchorElement>('[data-poster-link]')];
  const spines = [...root.querySelectorAll<HTMLAnchorElement>('[data-spine]')];
  const stand = (spine: HTMLAnchorElement) => {
    for (const s of spines) s.toggleAttribute('aria-current', s === spine);
    if (img && spine.dataset['src']) {
      img.src = spine.dataset['src'];
      if (spine.dataset['srcset']) img.srcset = spine.dataset['srcset'];
      // The <source> outranks the <img> in AVIF browsers, so it must follow the spine too.
      if (avif) avif.srcset = spine.dataset['avifset'] ?? spine.dataset['srcset'] ?? '';
    }
    if (title) title.textContent = spine.dataset['title'] ?? '';
    if (meta) meta.textContent = spine.dataset['meta'] ?? '';
    for (const l of links) {
      l.href = spine.href;
      if (l.hasAttribute('aria-label')) l.setAttribute('aria-label', spine.dataset['title'] ?? '');
    }
  };
  for (const s of spines) {
    on(s, 'pointerenter', () => stand(s));
    on(s, 'focus', () => stand(s));
  }

  return { destroy() { for (const fn of cleanups) fn(); cleanups.length = 0; } };
}
