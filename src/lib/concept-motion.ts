/**
 * Shared motion runtime for the Review A concepts.
 *
 * Deliberately small: CSS does the animating, this only decides WHEN and cleans up
 * after itself. It is the same tiering and lifecycle contract the production system
 * will use (docs/ARCHITECTURE.md §16.7, §16.9), proven at prototype scale.
 *
 * Nothing here is required for the page to be readable. With JS off, content is
 * visible, navigation works and video simply does not autoplay.
 */

import Lenis from 'lenis';

/**
 * REVIEW E: the tier is no longer decided here.
 *
 * This file used to carry its own copy of the resolver — the same policy, written
 * twice, free to drift. The concepts now read the answer the production bootstrap
 * wrote, exactly as the production runtime does. One policy, one attribute, four
 * prototype pages and a live site that agree by construction.
 */
import { readTier, type MotionTier } from './motion/tier.ts';

export type { MotionTier };

/** @deprecated Read the tier; do not re-derive it. Kept as the concepts' entry point. */
export const resolveTier = readTier;

interface ScrollOptions { lerp?: number; wheelMultiplier?: number }

/** Everything created by init(), so a page swap can tear it all down. */
interface Teardown { destroy(): void }

export function initConcept(opts: ScrollOptions = {}): Teardown {
  const root = document.documentElement;
  root.classList.remove('no-js');

  const tier = readTier();
  root.dataset['motion'] = tier;

  const cleanups: Array<() => void> = [];

  /* ---------------------------------------------------------------- loader */
  // `[data-loader-overlay]`, never `[data-loader]` — the root carries the state flag.
  const loader = document.querySelector<HTMLElement>('[data-loader-overlay]');
  if (loader) {
    const seen = sessionStorage.getItem('nvf-concept-seen') === '1';
    if (tier !== 'full' || seen) {
      loader.hidden = true;
    } else {
      // Capped hold. It masks real work and never outstays it (§16.5).
      const hide = () => { loader.hidden = true; sessionStorage.setItem('nvf-concept-seen', '1'); };
      const timer = window.setTimeout(hide, 1200);
      const onReady = () => { window.setTimeout(hide, 420); };
      if (document.readyState === 'complete') onReady();
      else window.addEventListener('load', onReady, { once: true });
      cleanups.push(() => window.clearTimeout(timer));
    }
  }

  /* ------------------------------------------------------- scroll (Lenis) */
  let lenis: Lenis | null = null;
  let raf = 0;
  if (tier === 'full') {
    lenis = new Lenis({
      lerp: opts.lerp ?? 0.1,
      wheelMultiplier: opts.wheelMultiplier ?? 1,
      // Never take over touch: mobile keeps its native momentum.
      syncTouch: false,
    });
    const loop = (t: number) => { lenis?.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    // Exposed so a concept can subscribe to Lenis's own scroll event. Lenis does not
    // always emit a native `scroll`, and anything tracking scroll position needs a
    // signal that fires in both cases.
    (window as unknown as { __nvfLenis?: Lenis }).__nvfLenis = lenis;
    cleanups.push(() => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
      lenis = null;
      delete (window as unknown as { __nvfLenis?: Lenis }).__nvfLenis;
    });
  }

  /* --------------------------------------------------------------- reveals
     Fail-safe by construction: the hidden state is applied only while
     <html class="reveal-armed">. If the observer never reports — unsupported,
     throttled in a background tab, blocked in an embedded webview — the class is
     removed and every element is simply visible. Motion is an enhancement; the page
     is never held hostage to it. */
  const revealTargets = document.querySelectorAll<HTMLElement>('[data-reveal], .c-lines');
  if (tier === 'full' && revealTargets.length && 'IntersectionObserver' in window) {
    root.classList.add('reveal-armed');
    let fired = false;

    const io = new IntersectionObserver((entries) => {
      fired = true;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        el.dataset['inview'] = '';
        // Drop will-change once the transition finishes, so we never leave dozens of
        // promoted layers alive.
        el.addEventListener('transitionend', () => el.classList.add('is-settled'), { once: true });
        io.unobserve(el);
      }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
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

  /* -------------------------------------------------- hover preview video
     Desktop pointer only. Touch and keyboard get the still plus a visible cue —
     information is never hover-only (audit §9.8 is the bug we refuse to repeat). */
  const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (tier === 'full' && fineHover) {
    const frames = document.querySelectorAll<HTMLElement>('[data-preview]');
    for (const frame of frames) {
      const video = frame.querySelector('video');
      if (!video) continue;

      const play = () => {
        // Attach the source only on intent, so nothing downloads on page load.
        if (!video.src && video.dataset['src']) video.src = video.dataset['src'];
        video.play().then(() => { frame.dataset['playing'] = 'true'; }).catch(() => { /* autoplay refused */ });
      };
      const stop = () => { frame.dataset['playing'] = 'false'; video.pause(); };

      frame.addEventListener('pointerenter', play);
      frame.addEventListener('pointerleave', stop);
      frame.addEventListener('focusin', play);
      frame.addEventListener('focusout', stop);
      cleanups.push(() => {
        frame.removeEventListener('pointerenter', play);
        frame.removeEventListener('pointerleave', stop);
        frame.removeEventListener('focusin', play);
        frame.removeEventListener('focusout', stop);
        video.pause();
        video.removeAttribute('src');
        video.load();
      });
    }
  }

  /* --------------------------------------------------- ambient hero video
     `autoplay muted playsinline` is not always honoured, so ask explicitly and fail
     quietly. Under `minimal` the video is never started at all — the poster stands in,
     which is a designed state, not a fallback. */
  if (tier !== 'minimal') {
    for (const v of document.querySelectorAll<HTMLVideoElement>('video[autoplay]')) {
      v.muted = true;
      v.play().catch(() => { /* engine refused; the poster remains */ });
      cleanups.push(() => v.pause());
    }
  } else {
    for (const v of document.querySelectorAll<HTMLVideoElement>('video[autoplay]')) {
      v.removeAttribute('autoplay');
      v.pause();
    }
  }

  /* ----------------------------------------------------------- mobile menu */
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const nav = document.querySelector<HTMLElement>('[data-menu]');
  if (toggle && nav) {
    const onClick = () => {
      const open = nav.dataset['open'] === 'true';
      nav.dataset['open'] = String(!open);
      toggle.setAttribute('aria-expanded', String(!open));
      document.body.style.overflow = open ? '' : 'hidden';
      if (open) lenis?.start(); else lenis?.stop();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && nav.dataset['open'] === 'true') onClick();
    };
    toggle.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    cleanups.push(() => {
      toggle.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    });
  }

  return { destroy() { for (const fn of cleanups) fn(); cleanups.length = 0; } };
}
