/**
 * The page runtime — REVIEW E.
 *
 * CSS animates. This decides WHEN, and cleans up after itself. No GSAP: nothing on this
 * site is a timeline. The ground swap is a transition on one attribute, the morph is two
 * `view-transition-name`s, the reveals are one class. 45 KB for that would be
 * indefensible, and Review E re-tested the claim rather than inheriting it.
 *
 * Four contracts this file must never break:
 *
 *   1. NOTHING HERE IS REQUIRED TO READ OR NAVIGATE. Scripting off: content is visible,
 *      every link works, video does not autoplay. That is the whole degradation.
 *
 *   2. THE TIER IS READ, NEVER DECIDED. `src/lib/motion/tier.ts` decided it before the
 *      first paint. No component re-derives a reader's preference for itself.
 *
 *   3. THE GROUND IS DRIVEN BY ONE SCROLL HANDLER, and that
 *      handler cannot be silenced. IntersectionObserver was rejected for it in Review B
 *      because IO is not guaranteed to fire. Review E found the same hole one level down,
 *      in the throttle itself: the handler set a `queued` flag, asked rAF for a frame,
 *      and cleared the flag only inside that frame. One undelivered frame callback —
 *      a throttled background tab, an embedded webview, a device under load — and the
 *      flag stays raised, every later scroll early-returns, and the ground is
 *      frozen on a stale value FOR THE REST OF THE PAGE'S LIFE. It now treats
 *      the first frame as a probe and falls back to a timer if that frame never lands.
 *
 *   4. NOTHING RUNS WHILE THE PAGE IS STILL. No frame loop, no decoding video, no
 *      buffering preview. Idle means idle.
 */

import { readTier, hasFinePointer } from './motion/tier.ts';
import { createScroll, type Scroll } from './motion/scroll.ts';

export type { MotionTier } from './motion/tier.ts';

interface Teardown { destroy(): void }

/**
 * How long a pointer must rest on a frame before its loop is worth a network request.
 * Sweeping across the portfolio's twenty frames now costs zero requests instead of
 * twenty; a reader who stops on one waits an eighth of a second they will not notice.
 */
const PREVIEW_DWELL = 140;

/** Grace given to the first animation frame before the scroll driver stops trusting rAF. */
const RAF_GRACE = 250;
/** Throttle used instead of rAF once rAF has been proven not to deliver. */
const TIMER_STEP = 100;

/** Past this many pixels the hero's scroll cue has been obeyed and stops signalling. */
const CUE_OBEYED = 40;

/**
 * Which encode of a clip this browser should fetch.
 *
 * Hero-class clips carry a VP9/WebM alongside the H.264, about a fifth smaller for the
 * same picture. It is chosen HERE rather than with <source> elements because these videos
 * are attached lazily by script — nothing is fetched until the tier, the viewport and the
 * reader's intent have all agreed — and a <source> list would start loading immediately.
 *
 * `canPlayType` returning "probably" is the only answer treated as yes; "maybe" is a
 * guess, and guessing wrong here costs a silent black frame instead of a hero.
 */
const prefersWebm = (): boolean => {
  const probe = document.createElement('video');
  return probe.canPlayType('video/webm; codecs="vp9"') === 'probably';
};

/** MP4 always exists; WebM is used only when it exists AND the browser is sure of it. */
const clipSource = (video: HTMLVideoElement, large: boolean): string | undefined => {
  const mp4 = (large ? video.dataset['srcLg'] : video.dataset['srcSm']) ?? video.dataset['srcLg'];
  if (!prefersWebm()) return mp4;
  const webm = (large ? video.dataset['srcWebmLg'] : video.dataset['srcWebmSm'])
    ?? video.dataset['srcWebmLg'];
  return webm ?? mp4;
};

export function initSite(): Teardown {
  const root = document.documentElement;
  // The bootstrap sets this before paint; this is belt-and-braces for a document that
  // somehow reached the runtime without it.
  root.classList.add('js');

  const tier = readTier();
  const cleanups: Array<() => void> = [];
  const on = (t: EventTarget, type: string, fn: EventListener, o?: AddEventListenerOptions) => {
    t.addEventListener(type, fn, o);
    cleanups.push(() => t.removeEventListener(type, fn, o));
  };

  /* ───────────────────────────────────────────────────────────────── loader
     Armed BEFORE PAINT by the bootstrap, which is the whole fix. Previously the overlay
     was hidden by a `:root:not(.js)` rule and revealed when the deferred module added
     `.js` — so on a fast connection the reader watched the page render and then had a
     black rectangle drop over it. A loader that arrives after the content is not a
     loader.

     It masks real work and never outstays it: it leaves a beat after `load`, or at the
     cap, whichever comes first. There is no percentage, because we do not know one. */
  /* `[data-loader-overlay]` selects the OVERLAY. `[data-loader]` selected <html>.

     The root carries the STATE flag — `<html data-loader="on">`, written by the bootstrap
     — and the overlay used to carry an attribute of the same name. `querySelector` walks
     document order, so it returned the ROOT every time the loader was armed, and
     `loader.hidden = true` put the `hidden` attribute on <html>. The UA stylesheet turns
     that into `display: none` on the whole document: a blank page, with no author rule
     anywhere to explain it, on the FIRST visit of every session and only then.

     The two are named differently now so the selector cannot be ambiguous again.
     scripts/validate-routes.mjs asserts it against the built HTML. */
  const loader = document.querySelector<HTMLElement>('[data-loader-overlay]');
  if (loader && root.dataset['loader'] === 'on' && loader.dataset['variant'] === 'intro') {
    /* DESIGN V2 — the homepage opening (decision C5). It is a sequence, not a mask for
       loading, so it leaves when its last step (the wipe) ends — and never later than the
       sum of its own tokens, in case an animation event never arrives. A click or any key
       skips it outright: an opening the reader cannot dismiss is a gate. */
    const hide = () => { loader.hidden = true; };
    const steps = ['--dur-intro-fill', '--dur-intro-drop', '--dur-intro-hello', '--dur-intro-hold',
      '--dur-intro-stand', '--dur-intro-travel', '--dur-intro-wipe'];
    const cap = window.setTimeout(hide, steps.reduce((sum, name) => sum + ms(name, 0), 0) + ms('--dur-ui', 220));
    on(loader, 'animationend', ((e: AnimationEvent) => { if (e.animationName === 'nvf-wipe') hide(); }) as EventListener);
    on(window, 'pointerdown', hide, { once: true });
    on(window, 'keydown', hide, { once: true });
    cleanups.push(() => window.clearTimeout(cap));
  } else if (loader && root.dataset['loader'] === 'on') {
    const hide = () => { loader.hidden = true; };
    const cap = window.setTimeout(hide, ms('--dur-hold', 900));
    const settle = () => window.setTimeout(hide, ms('--dur-ui', 220));
    if (document.readyState === 'complete') settle();
    else on(window, 'load', settle as EventListener, { once: true });
    cleanups.push(() => window.clearTimeout(cap));
  } else if (loader) {
    loader.hidden = true;
  }

  /* ────────────────────────────────────────────────────────── smooth scroll
     Desktop, `full` tier, dynamically imported, and it stops its own frame loop when the
     page is still. Every one of those is a Review E decision — see motion/scroll.ts. */
  let scroll: Scroll | null = null;
  let scrollDead = false;
  void createScroll(tier).then((s) => {
    if (!s) return;
    if (scrollDead) { s.destroy(); return; }
    scroll = s;
    s.onScroll(schedule);
  });
  cleanups.push(() => { scrollDead = true; scroll?.destroy(); scroll = null; });

  /* ────────────────────────────────────────────────────────────── ground
     The section at the viewport MIDDLE decides the shell's ground — what you are looking
     at. (Design v2 removed the fixed header, and with it the per-frame header-overlap
     test over every `[data-header-zone]` box, the progress stripe and the section nav;
     the performance audit of 2026-10-29 found all three still running on every frame.) */
  const shell = document.querySelector<HTMLElement>('[data-shell]');
  // Scoped to <main>: the shell itself carries data-ground as its CURRENT state, and
  // including it here would put a written value back into the list being read.
  const sections = [...document.querySelectorAll<HTMLElement>('main [data-ground]')];
  const hero = document.querySelector<HTMLElement>('[data-hero]');

  /**
   * Geometry is MEASURED, not read from offsetTop: offsetTop is relative to the nearest
   * positioned ancestor, and one `position: relative` added later would silently shift
   * every boundary.
   *
   * Everything a scroll frame needs is cached in document space, so a scroll frame does
   * ZERO layout reads (`innerHeight` is not one, so it is read live). The cache is
   * refreshed whenever the page can have moved: load, web fonts settling, and any change
   * to the body's size — which a resize that moves anything is.
   */
  let tops: number[] = [];

  const measure = () => {
    const y = window.scrollY;
    tops = sections.map((s) => s.getBoundingClientRect().top + y);
  };

  const at = (y: number): HTMLElement | null => {
    let current: HTMLElement | null = sections[0] ?? null;
    for (let i = 0; i < sections.length; i += 1) {
      if ((tops[i] ?? 0) <= y) current = sections[i]!; else break;
    }
    return current;
  };

  let queued = false;
  let rafProven = false;
  let rafGiven = false;

  const paint = () => {
    queued = false;
    const y = window.scrollY;

    if (hero && y > CUE_OBEYED && hero.dataset['scrolled'] !== 'true') hero.dataset['scrolled'] = 'true';

    if (sections.length) {
      const mid = at(y + window.innerHeight / 2);
      const next = mid?.dataset['ground'] ?? 'cream';
      if (shell && shell.dataset['ground'] !== next) shell.dataset['ground'] = next;

    }
  };

  /* The throttle, and its failsafe.

     rAF is the right throttle — it is the frame the paint will land in. But the flag that
     makes it a throttle is cleared INSIDE the callback, so a callback that never arrives
     latches the flag raised and every subsequent scroll returns early. The failure is not
     a dropped frame; it is the driver never running again.

     So the first frame is a probe. If it lands, nothing changes and rAF stays the
     throttle. If it has not landed inside the grace window, this document stops trusting
     rAF for good and runs on a timer — coarser by a frame or two, and always correct. */
  const schedule = () => {
    if (queued) return;
    queued = true;
    if (rafGiven) { window.setTimeout(paint, TIMER_STEP); return; }
    requestAnimationFrame(() => { rafProven = true; paint(); });
    if (!rafProven) {
      const probe = window.setTimeout(() => {
        if (rafProven || !queued) return;
        rafGiven = true;
        paint();
      }, RAF_GRACE);
      cleanups.push(() => window.clearTimeout(probe));
    }
  };

  const remeasure = () => { measure(); schedule(); };
  on(window, 'scroll', schedule, { passive: true });
  on(window, 'load', remeasure);
  measure();
  // Late web fonts change every heading's height, which moves every boundary.
  document.fonts?.ready.then(remeasure).catch(() => { /* unsupported */ });
  // Anything else that changes the document's size — a resize, a lazy image without a
  // reserved box, a font swap, an orientation change — invalidates the cache too.
  // Coalesced, because a page of lazy images can otherwise fire this dozens of times in
  // a row and each call measures every section.
  if ('ResizeObserver' in window) {
    let pendingMeasure = 0;
    const ro = new ResizeObserver(() => {
      if (pendingMeasure) return;
      pendingMeasure = window.setTimeout(() => { pendingMeasure = 0; remeasure(); }, TIMER_STEP);
    });
    ro.observe(document.body);
    cleanups.push(() => { window.clearTimeout(pendingMeasure); ro.disconnect(); });
  }
  paint();

  /* ──────────────────────────────────────────────────────────────── reveals
     Content is visible by default. The hidden state is armed only after the observer has
     proved it fires; a failsafe disarms it otherwise. Under `reduced` and `minimal` the
     system is never armed at all, so there is nothing to fail. */
  const revealTargets = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (tier === 'full' && revealTargets.length && 'IntersectionObserver' in window) {
    root.classList.add('reveal-armed');
    let fired = false;
    const io = new IntersectionObserver((entries) => {
      fired = true;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        el.dataset['inview'] = '';
        el.addEventListener('transitionend', () => el.classList.add('is-settled'), { once: true });
        io.unobserve(el);
      }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    revealTargets.forEach((el) => io.observe(el));

    const failsafe = window.setTimeout(() => {
      if (fired) return;
      root.classList.remove('reveal-armed');
      io.disconnect();
    }, 1500);
    cleanups.push(() => {
      window.clearTimeout(failsafe);
      io.disconnect();
      root.classList.remove('reveal-armed');
    });
  }

  /* ─────────────────────────────────────────────────────── ambient video
     Every decorative loop on the site registers here, so there is one place that knows
     what is decoding and one rule for stopping it. A hidden tab stops all of it: an
     autoplaying loop nobody can see is pure battery. */
  const ambient = new Set<HTMLVideoElement>();
  const onVisibility = () => {
    if (document.hidden) { for (const v of ambient) v.pause(); stopPreview(); }
    else for (const v of ambient) { if (v.isConnected && v.src) void v.play().catch(() => { /* refused */ }); }
  };
  on(document, 'visibilitychange', onVisibility);

  /* ─────────────────────────────────────────────────────────── hero film
     The rendition is chosen here rather than by <source media>, because the right
     variable is device pixels and connection, not CSS width. Below `full` nothing is
     fetched at all and the poster stands in — the designed state, not a degradation
     (ARCHITECTURE.md §16.7). */
  const heroVideo = hero?.querySelector<HTMLVideoElement>('video');

  if (hero && heroVideo && tier === 'full') {
    const dpr = window.devicePixelRatio || 1;
    const wantLarge = window.innerWidth * dpr > 900;
    const src = clipSource(heroVideo, wantLarge);
    if (src) {
      heroVideo.src = src;
      heroVideo.muted = true;
      ambient.add(heroVideo);
      const start = () => {
        const media = heroVideo.closest<HTMLElement>('[data-media]');
        if (media) media.dataset['playing'] = 'true';
      };
      heroVideo.addEventListener('playing', start, { once: true });
      heroVideo.play().catch(() => { /* engine refused; the poster remains */ });
      cleanups.push(() => {
        ambient.delete(heroVideo);
        heroVideo.pause(); heroVideo.removeAttribute('src'); heroVideo.load();
      });
    }
  }
  /* ──────────────────────────── editorial preview loops — on intent only
     Three rules, and all three exist because of what the portfolio does at twenty
     frames:

       INTENT      a source is attached only after the pointer has RESTED. Sweeping the
                   sheet costs nothing; before, it started twenty downloads.
       ONE         at most one preview is ever running. Moving from frame to frame stops
                   the last one, so a reader cannot leave a trail of decoding video.
       REWIND      leaving resets to the first frame, so a loop is never rejoined
                   halfway through on the next hover.

     Keyboard focus deliberately does NOT start a film. A reader tabbing through twenty
     cards should not be handed twenty surprise videos; focus gets the outline and the
     written cue, which is the same information. Nothing here is hover-only —
     the card is a link and the caption is complete without it. */
  let preview: HTMLElement | null = null;
  let dwell = 0;
  const stopPreview = () => {
    if (!preview) return;
    const v = preview.querySelector('video');
    preview.dataset['playing'] = 'false';
    if (v) { ambient.delete(v); v.pause(); v.currentTime = 0; }
    preview = null;
  };

  if (tier === 'full' && hasFinePointer()) {
    for (const frame of document.querySelectorAll<HTMLElement>('[data-preview]')) {
      const video = frame.querySelector('video');
      if (!video) continue;
      const play = () => {
        stopPreview();
        preview = frame;
        if (!video.src && video.dataset['src']) video.src = video.dataset['src'];
        ambient.add(video);
        video.play().then(() => { frame.dataset['playing'] = 'true'; }).catch(() => { /* autoplay refused */ });
      };
      on(frame, 'pointerenter', () => {
        window.clearTimeout(dwell);
        dwell = window.setTimeout(play, PREVIEW_DWELL);
      });
      on(frame, 'pointerleave', () => {
        window.clearTimeout(dwell);
        if (preview === frame) stopPreview();
      });
      cleanups.push(() => { video.pause(); video.removeAttribute('src'); video.load(); });
    }
    cleanups.push(() => { window.clearTimeout(dwell); stopPreview(); });
  }

  /* ────────────────────────────────────────────────────── the film façade
     Nothing has reached YouTube up to this point: no iframe, no script, no cookie, no
     request. The button swaps in the privacy-enhanced player, autoplaying because the
     press WAS the consent, and the poster box was already 16:9 so nothing shifts. */
  const film = document.querySelector<HTMLElement>('[data-film]');
  const filmPlay = film?.querySelector<HTMLButtonElement>('[data-film-play]');
  if (film && filmPlay) {
    const mount = () => {
      const embed = film.dataset['embed'];
      if (!embed || film.querySelector('iframe')) return;
      const frame = document.createElement('iframe');
      frame.src = `${embed}&autoplay=1`;
      frame.title = film.dataset['title'] ?? '';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.allowFullscreen = true;
      frame.loading = 'lazy';
      // The silent loop has done its job; stop it decoding behind the player.
      const loop = film.querySelector('video');
      if (loop) { ambient.delete(loop); loop.pause(); loop.remove(); }
      film.querySelector('img')?.remove();
      film.append(frame);
      filmPlay.remove();
      frame.focus();
    };
    on(filmPlay, 'click', mount);
  }

  return { destroy() { for (const fn of cleanups) fn(); cleanups.length = 0; } };
}

/** Local shorthand for a motion token, so no duration is written twice. */
function ms(name: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (raw.endsWith('ms')) return Number.parseFloat(raw) || fallback;
  if (raw.endsWith('s')) return (Number.parseFloat(raw) || 0) * 1000;
  return fallback;
}
