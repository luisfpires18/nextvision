/**
 * Smooth scroll — REVIEW E.
 *
 * Lenis stays, but it is now the narrowest thing on the site rather than the widest.
 * Three decisions, all of them measured rather than assumed:
 *
 * 1. DESKTOP ONLY. `syncTouch` was already off, so on a phone Lenis was not smoothing
 *    anything — it was a permanent frame loop and 5.4 KB gz of parse work sitting on top
 *    of native momentum it had chosen not to touch. Touch devices now get the platform's
 *    own scroll, which is the thing they are best at.
 *
 * 2. DYNAMICALLY IMPORTED. Because of (1) and the tier rule, most sessions never
 *    construct it — a phone, a reduced-motion reader, a low-memory device. A static
 *    import made every one of them download it anyway. It is now fetched only on the
 *    devices that will actually run it.
 *
 * 3. THE FRAME LOOP STOPS WHEN THE PAGE IS STILL. The textbook Lenis loop is an
 *    unconditional `requestAnimationFrame` for the lifetime of the document: 60 wake-ups
 *    a second forever, on a page nobody is touching. Here the loop runs while Lenis has
 *    something to animate, coasts for half a second after it settles, and then stops
 *    dead until the next real input. Idle cost: zero frames.
 *
 * What it must never do: hijack direction, snap sections, disable paging keys, or fight
 * the browser's own scroll restoration. It damps the wheel. That is all.
 */

import type LenisType from 'lenis';
import { hasFinePointer, type MotionTier } from './tier.ts';

export interface Scroll {
  /** Suspend scrolling — the mobile menu, and nothing else so far. */
  stop(): void;
  start(): void;
  /** Subscribe to Lenis's own scroll event; it does not always emit a native one. */
  onScroll(fn: () => void): void;
  /** Smooth-scroll to an element, honouring the page's scroll padding. */
  to(target: Element): void;
  destroy(): void;
}

/**
 * Damping.
 *
 * 0.09 was the concept value and it settles in roughly half a second — heavy enough that
 * a short flick keeps travelling after the fingers stop. 0.12 keeps the damping legible
 * while cutting the tail: the page feels smoother, not slower, which is the whole
 * distinction the owners asked for. Tunable in one place; nothing else references it.
 */
export const LERP = 0.12;

/**
 * Frames of stillness before the loop gives up the frame budget. ~0.5 s at 60 Hz, which
 * is longer than the gap between wheel notches in a normal scroll gesture, so a slow
 * scroller never trips it mid-motion.
 */
const IDLE_FRAMES = 30;

/**
 * Create the scroll model, or don't.
 *
 * Returns `null` — not a no-op object — wherever smooth scroll is the wrong answer, so
 * the caller can see that native scrolling is in charge rather than guessing.
 */
export async function createScroll(tier: MotionTier): Promise<Scroll | null> {
  if (tier !== 'full') return null;
  if (!hasFinePointer()) return null;

  let Lenis: typeof LenisType;
  try {
    ({ default: Lenis } = await import('lenis'));
  } catch {
    // A blocked or failed chunk must cost nothing: the page still scrolls natively.
    return null;
  }

  const lenis = new Lenis({
    lerp: LERP,
    wheelMultiplier: 1,
    // Never take over touch. Kept explicit even though this path is fine-pointer only,
    // because a hybrid device can report both.
    syncTouch: false,
  });

  let raf = 0;
  let idle = 0;
  let dead = false;

  const loop = (t: number) => {
    lenis.raf(t);
    idle = lenis.isScrolling ? 0 : idle + 1;
    if (idle > IDLE_FRAMES) { raf = 0; return; }
    raf = requestAnimationFrame(loop);
  };

  /** Restart the loop on real input. Cheap: a single integer test when already awake. */
  const wake = () => {
    if (dead) return;
    idle = 0;
    if (!raf) raf = requestAnimationFrame(loop);
  };

  const inputs: Array<[string, AddEventListenerOptions | undefined]> = [
    ['wheel', { passive: true }],
    ['pointerdown', { passive: true }],
    ['keydown', { passive: true }],
    // Native scroll covers everything the listeners above cannot see — a scrollbar drag,
    // a programmatic scrollTo, an anchor jump — and is what resynchronises Lenis's own
    // position after the loop has been asleep.
    ['scroll', { passive: true }],
  ];
  for (const [type, opts] of inputs) window.addEventListener(type, wake, opts);

  wake();

  /**
   * The header offset for anchor scrolling, taken from the page's own scroll padding so
   * that Lenis and the browser's native `:target` behaviour agree by construction rather
   * than by two numbers that have to be kept in step.
   */
  const scrollPadding = (): number => {
    const raw = getComputedStyle(document.documentElement).scrollPaddingBlockStart;
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  };

  return {
    stop() { lenis.stop(); },
    start() { lenis.start(); wake(); },
    onScroll(fn) { lenis.on('scroll', fn); },
    to(target) { lenis.scrollTo(target as HTMLElement, { offset: -scrollPadding() }); wake(); },
    destroy() {
      dead = true;
      for (const [type, opts] of inputs) window.removeEventListener(type, wake, opts);
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      lenis.destroy();
    },
  };
}
