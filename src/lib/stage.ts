/**
 * The stage on /servicos/: a large centre frame with two smaller ones behind it. A reader
 * brings another film forward with a side frame, the arrows, the arrow keys or a swipe.
 *
 * It is an enhancement on top of a row of real links. With scripting off, every frame is a
 * link in a native scroller (sections.css). With it, only the centre frame is a link you can
 * follow, and pressing a side frame moves it to the centre instead.
 *
 * A frame can be a still that plays a film (`.stage__film`, ServicesPage.astro). Pressing the
 * frame in front swaps in the privacy-enhanced player, as the façade under the stage does;
 * nothing reaches YouTube before that press. When the frame leaves the front the player is
 * removed, so a film never plays behind a frame the reader has moved away from.
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

  /* The play button of a frame whose player is mounted, kept so it can be put back. */
  const parked = new WeakMap<HTMLElement, HTMLElement>();

  const mount = (button: HTMLElement) => {
    const film = button.closest<HTMLElement>('.stage__film');
    const embed = film?.dataset['embed'];
    if (!film || !embed || film.querySelector('iframe')) return;
    const player = document.createElement('iframe');
    player.src = `${embed}&autoplay=1`;
    player.title = film.dataset['title'] ?? '';
    player.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    player.allowFullscreen = true;
    parked.set(film, button);
    button.remove();
    film.append(player);
    player.focus();
  };

  const unmount = (frame: HTMLElement) => {
    const film = frame.querySelector<HTMLElement>('.stage__film');
    const player = film?.querySelector('iframe');
    const button = film ? parked.get(film) : undefined;
    if (!film || !player || !button) return;
    player.remove();
    film.append(button);
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
      frame.querySelector('a, [data-stage-play]')?.setAttribute('tabindex', isCentre ? '0' : '-1');
      if (!isCentre) unmount(frame);
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

  /* A side frame's press never gets here (the capture handler above moves it to the front),
     so this is the frame in front. The press IS the consent, so the connection to YouTube
     opens on its first half (pointer down), never on hover. */
  on(root, 'pointerdown', ((event: PointerEvent) => {
    const embed = (event.target as Element).closest<HTMLElement>('[data-stage-play]')?.closest<HTMLElement>('.stage__film')?.dataset['embed'];
    if (!embed || document.head.querySelector('link[data-film-preconnect]')) return;
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = new URL(embed).origin;
    link.dataset['filmPreconnect'] = '';
    document.head.append(link);
  }) as EventListener);
  on(root, 'click', ((event: MouseEvent) => {
    const button = (event.target as Element).closest<HTMLElement>('[data-stage-play]');
    if (button) mount(button);
  }) as EventListener);

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
