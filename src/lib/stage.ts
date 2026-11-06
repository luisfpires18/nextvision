/**
 * The stage on /servicos/: a large centre frame with two smaller ones behind it. A reader
 * brings another film forward with a side frame, the arrows, the arrow keys or a swipe.
 *
 * It is an enhancement on top of a row of real links. With scripting off, every frame is a
 * link in a native scroller (sections.css). With it, only the centre frame is a link you can
 * follow, and pressing a side frame moves it to the centre instead.
 *
 * The slots are attributes and CSS does the moving, so duration and easing stay tokens and
 * the motion tiers apply without this file knowing they exist. No autoplay: nothing moves
 * unless the reader asks, so there is nothing to pause.
 */

interface Teardown { destroy(): void }

export type StageSlot = 'centre' | 'right' | 'left' | 'back';

/** Where frame `i` stands when frame `centre` is forward. Also used by the server render. */
export function slotOf(i: number, centre: number, count: number): StageSlot {
  const distance = (i - centre + count) % count;
  if (distance === 0) return 'centre';
  if (distance === 1) return 'right';
  if (distance === count - 1) return 'left';
  return 'back';
}

/** How far a finger travels before it counts as a swipe rather than a tap. */
const SWIPE = 40;

export function initStage(): Teardown {
  const root = document.querySelector<HTMLElement>('[data-stage]');
  if (!root) return { destroy() { /* not this page */ } };

  const frames = [...root.querySelectorAll<HTMLElement>('[data-slot]')];
  const status = root.querySelector<HTMLElement>('[data-stage-status]');
  const count = frames.length;
  let centre = Math.max(0, frames.findIndex((f) => f.dataset['slot'] === 'centre'));
  let swiped = false;

  const cleanups: Array<() => void> = [];
  const on = (t: EventTarget, type: string, fn: EventListener, o?: AddEventListenerOptions) => {
    t.addEventListener(type, fn, o);
    cleanups.push(() => t.removeEventListener(type, fn, o));
  };

  const paint = (announce: boolean) => {
    frames.forEach((frame, i) => {
      const slot = slotOf(i, centre, count);
      frame.dataset['slot'] = slot;
      const isCentre = slot === 'centre';
      // The arrows are the keyboard and screen-reader route to the other films, so only
      // the frame in front is in the tab order and the accessibility tree.
      if (isCentre) frame.removeAttribute('aria-hidden');
      else frame.setAttribute('aria-hidden', 'true');
      frame.querySelector('a')?.setAttribute('tabindex', isCentre ? '0' : '-1');
    });
    if (announce && status) status.textContent = frames[centre]?.dataset['title'] ?? '';
  };

  const go = (index: number) => {
    centre = (index + count) % count;
    paint(true);
  };

  /* Taken in the capture phase, before the router sees it. A side frame's click moves the
     frame and must not also navigate. A modified click stays the browser's, so a side frame
     can still open in a new tab. */
  on(root, 'click', ((event: MouseEvent) => {
    const frame = (event.target as Element).closest<HTMLElement>('[data-slot]');
    if (!frame) return;
    if (swiped) {
      swiped = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (frame.dataset['slot'] === 'centre') return;
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    event.stopPropagation();
    go(frames.indexOf(frame));
  }) as EventListener, { capture: true });

  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-stage-step]')) {
    on(button, 'click', () => go(centre + Number(button.dataset['stageStep'])));
  }

  on(root, 'keydown', ((event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') go(centre + 1);
    else if (event.key === 'ArrowLeft') go(centre - 1);
  }) as EventListener);

  /* Touch only. `touch-action: pan-y` on the stage leaves vertical scrolling to the page. */
  let startX = 0;
  let startY = 0;
  on(root, 'pointerdown', ((event: PointerEvent) => {
    if (event.pointerType === 'mouse') return;
    startX = event.clientX;
    startY = event.clientY;
    swiped = false;
  }) as EventListener);
  on(root, 'pointerup', ((event: PointerEvent) => {
    if (event.pointerType === 'mouse') return;
    const dx = event.clientX - startX;
    if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(event.clientY - startY)) return;
    swiped = true;
    go(centre + (dx < 0 ? 1 : -1));
  }) as EventListener);

  paint(false);
  return { destroy() { for (const fn of cleanups) fn(); cleanups.length = 0; } };
}
