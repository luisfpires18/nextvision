/**
 * Page transitions — REVIEW E.
 *
 * ── The rule ─────────────────────────────────────────────────────────────────
 *
 *     EXACTLY ONE ELEMENT IS EVER NAMED, AND IT IS NAMED AT THE MOMENT OF INTENT.
 *
 * Review D shipped the frame→film morph by rendering `transition:name` into the HTML of
 * every card. That is the obvious way to do it and it is wrong at scale. Measured on the
 * built output: leaving `/portfolio/` for a project meant the browser captured TWENTY
 * separately-named elements, of which exactly one had a partner on the destination. The
 * other nineteen are not free and they are not invisible — each is lifted OUT of the
 * page's root snapshot, leaving nineteen holes in the outgoing page, and each then plays
 * its own solo fade at its own old position over the incoming one. Twenty-one snapshot
 * layers to move one photograph.
 *
 * So no `transition:name` is rendered anywhere. Every frame that COULD be a partner
 * carries `data-frame="{slug}"` instead — an ordinary attribute that does nothing — and
 * this module puts the single shared name on the two elements that are actually about to
 * become each other, one on each document, at the moment the navigation begins.
 *
 * The name is a constant (`nvf-frame`) rather than per-slug, because uniqueness across
 * projects was never the requirement: the requirement is that the OLD document and the
 * NEW document agree, and only one pair exists at a time. A constant is also what lets
 * `::view-transition-group(nvf-frame)` style the morph precisely without depending on
 * `view-transition-class`.
 *
 * ── Which pair, for each navigation ──────────────────────────────────────────
 *
 *   home     → project    the card you clicked   becomes the film
 *   portfolio→ project    the frame you clicked  becomes the film
 *   project  → project    the next film's still  becomes the next film
 *   project  → portfolio  the film you watched   becomes its frame on the sheet
 *   anything → anything    no pair. An ordinary dissolve, and that is correct —
 *                          not every navigation is a cinematic moment.
 *
 * The rule that produces all five: the pair is the project slug one of the two urls is
 * about — the DESTINATION's if this document has a frame for it, otherwise the ORIGIN's.
 *
 * That second clause is not a nicety, it is what makes Back work. Going forward from
 * Leonor to Epitáfio, the page you are leaving holds a frame for where you are going, so
 * the destination's slug wins. Coming back, the page you are leaving is Epitáfio and it
 * holds no frame for Leonor at all — only its own — so the ORIGIN's slug is the one both
 * documents have, and the still you were looking at folds back into the "next project"
 * frame you came from. Measured, not assumed: with only the first clause, Back through a
 * project pair formed no pair at all.
 *
 * The choice has to be made on the OLD document, because that is the one the browser has
 * already snapshotted by the time the new document exists.
 *
 * ── What it may never do ─────────────────────────────────────────────────────
 * Nothing here is required to navigate. Without the View Transitions API these are
 * ordinary links and this module writes a CSS property no engine reads. Under `reduced`
 * and `minimal` no pair is formed at all, so the swap is a plain cross-fade or a cut.
 */

import { readTier, tokenMs } from './tier.ts';

/** The shared name. One constant, two elements, one transition. */
const NAME = 'nvf-frame';

/** `/portfolio/{slug}/` — and nothing else. The index itself is not a project. */
function slugOf(url: URL): string | null {
  const m = /^\/portfolio\/([^/]+)\/?$/.exec(url.pathname);
  return m?.[1] ?? null;
}

function clearFrames(doc: Document): void {
  for (const el of doc.querySelectorAll<HTMLElement>('[data-frame]')) {
    el.style.removeProperty('view-transition-name');
  }
}

function nameFrame(doc: Document, slug: string): boolean {
  const el = doc.querySelector<HTMLElement>(`[data-frame="${CSS.escape(slug)}"]`);
  // A filtered-out card is still in the document but has no box, and an element with no
  // box cannot be captured — naming it would leave its partner animating alone.
  if (!el || el.closest('[hidden]')) return false;
  el.style.setProperty('view-transition-name', NAME);
  return true;
}

interface PreparationEvent extends Event { from: URL; to: URL }
interface SwapEvent extends Event { newDocument: Document }

/**
 * Wire the pairing to the router. Called once, from the shell, and never per page —
 * these listeners survive navigation because the document does.
 */
export function initTransitions(): void {
  let pending: string | null = null;
  let release = 0;

  const onPrepare = (event: Event) => {
    const e = event as PreparationEvent;
    window.clearTimeout(release);
    clearFrames(document);
    pending = null;
    // `reduced` and `minimal` navigate without choreography. A shared-element morph is
    // travel, and travel is the first thing both tiers remove.
    if (readTier() !== 'full') return;
    // Destination first, origin second. The first one this document can actually show
    // wins; if it can show neither, there is no pair and the swap is an ordinary
    // dissolve, which is the right answer for home → portfolio.
    for (const slug of [slugOf(e.to), slugOf(e.from)]) {
      if (slug && nameFrame(document, slug)) { pending = slug; break; }
    }
  };

  const onSwap = (event: Event) => {
    const e = event as SwapEvent;
    clearFrames(e.newDocument);
    if (pending) nameFrame(e.newDocument, pending);
  };

  const onLoaded = () => {
    if (!pending) return;
    pending = null;
    /* The name has to outlive the swap — it IS the animation — but it must not outlive
       the page. `view-transition-name` makes an element a containing block for fixed
       descendants and applies containment, which is not something to leave switched on
       across a whole reading session. There is no "transition finished" event to hang
       this on, so it is released one transition-length later, read from the token rather
       than typed here. */
    release = window.setTimeout(() => clearFrames(document), tokenMs('--dur-transition', 380) + 120);
  };

  document.addEventListener('astro:before-preparation', onPrepare);
  document.addEventListener('astro:before-swap', onSwap);
  document.addEventListener('astro:page-load', onLoaded);
}
