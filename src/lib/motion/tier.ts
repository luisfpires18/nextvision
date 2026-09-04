/**
 * The motion tier — ONE source of truth.
 *
 * REVIEW E. Before this, the tier was decided in two places that disagreed: a
 * `resolveTier()` in the production runtime, a second copy in the concept runtime, and a
 * `@media (prefers-reduced-motion)` block in CSS that did MORE than either of them. Three
 * authorities for one question is how a component ends up reinterpreting a reader's
 * preference for itself.
 *
 * Now: the policy exists exactly once, in `MOTION_BOOTSTRAP`, and it runs INLINE IN THE
 * HEAD — before the first paint, before any stylesheet has been applied to a box. Every
 * other piece of the system reads the answer off `<html data-motion>` and never
 * re-derives it. CSS keys off the same attribute. Devtools shows it.
 *
 *   full     the intended experience
 *   reduced  the reader asked for less: no travel, no autoplay, but state changes stay
 *            legible. Not "everything is 0ms" — an interface with no settle at all is
 *            harder to follow, not easier.
 *   minimal  saveData, ≤4 GB of memory or ≤4 cores: a cut everywhere.
 *
 * The bootstrap also decides, in the same pass, whether the opening hold is allowed to
 * appear at all — because that has to be known before the loader can paint, and a loader
 * that arrives AFTER the page is readable is worse than no loader (docs/MOTION_REVIEW.md
 * §3).
 */

export type MotionTier = 'full' | 'reduced' | 'minimal';

/** sessionStorage key. One opening hold per session, not per page. */
export const SEEN_KEY = 'nvf-seen';

/**
 * The inline head script, verbatim. Kept small enough to be free (~430 bytes) and
 * defensive enough that a locked-down privacy mode cannot stop the page rendering:
 * every storage and API touch is inside a try.
 *
 * It writes three things and nothing else:
 *   data-motion    the tier, for CSS and for the runtime to read back
 *   class="js"     so `:root:not(.js)` means "scripting is off", not "scripts are late"
 *   data-loader    "on" only when the opening hold has been earned
 */
export const MOTION_BOOTSTRAP = `(function(){var r=document.documentElement,n=navigator,t="full";try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)t="reduced";else if(n.connection&&n.connection.saveData)t="minimal";else if((n.deviceMemory||8)<=4)t="minimal";else if((n.hardwareConcurrency||8)<=4)t="minimal";}catch(e){}r.dataset.motion=t;r.classList.add("js");try{var p=performance.getEntriesByType("navigation")[0];if(t==="full"&&sessionStorage.getItem("${SEEN_KEY}")!=="1"&&(!p||p.type!=="back_forward")){r.dataset.loader="on";sessionStorage.setItem("${SEEN_KEY}","1");}}catch(e){}})();`;

/**
 * Read the tier the bootstrap decided.
 *
 * This is a READ, deliberately — the policy is not repeated here. The fallback exists
 * only for a document that never ran the bootstrap at all, and it answers the one
 * question that matters in that case: has the reader asked for less motion?
 */
export function readTier(): MotionTier {
  if (typeof document === 'undefined') return 'full';
  const declared = document.documentElement.dataset['motion'];
  if (declared === 'full' || declared === 'reduced' || declared === 'minimal') return declared;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full';
}

/**
 * Whether this device is one a pointer hovers over.
 *
 * The site's two desktop-only behaviours — smooth scroll and hover previews — both hang
 * off this and nothing else. It is not a width query: a touch laptop at 1440px must not
 * get hover previews, and a mouse plugged into a tablet must.
 */
export function hasFinePointer(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/**
 * A motion token's value, in milliseconds.
 *
 * Used where JavaScript has to wait exactly as long as CSS does — clearing a
 * view-transition name after the transition it belongs to, for instance. Reading the
 * token keeps `tokens.motion.css` the only place any duration is written down, including
 * for the code that is not CSS. One computed-style read per call, never in a loop and
 * never during a scroll frame.
 */
export function tokenMs(name: string, fallback: number): number {
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (raw.endsWith('ms')) return Number.parseFloat(raw) || 0;
    if (raw.endsWith('s')) return (Number.parseFloat(raw) || 0) * 1000;
  } catch { /* no computed style available */ }
  return fallback;
}
