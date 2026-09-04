/**
 * Service worker registration, and the update prompt — PHASE 11.
 *
 * Two rules from ARCHITECTURE §17.5, and they are the reason this file exists rather than
 * a one-line `navigator.serviceWorker.register()`:
 *
 *   1. NEVER auto-reload. A new build is installed and then waits. An unrequested reload
 *      part-way down a cinematic page is the worst moment this site has.
 *   2. The prompt is quiet and dismissible, and it is the ONLY route to `skipWaiting()`.
 *
 * Registration is deferred to `load` so the worker never competes with the first paint —
 * a service worker that slows down the first visit to make the second one faster has the
 * trade backwards on a site most people see once.
 */

const SW_URL = '/sw.js';
const ACTIVATE = 'nvf:activate-update';

interface UpdatePromptCopy {
  message: string;
  action: string;
  dismiss: string;
}

/**
 * The prompt's copy, read off the shell.
 *
 * It is rendered there by BaseLayout from the i18n dictionary, so this module holds no
 * strings and no language detection — the page already knows what language it is in, and
 * sniffing `document.lang` here would be a second authority on a question that already
 * has one (the same rule the motion tier follows).
 */
function copyFromShell(): UpdatePromptCopy | null {
  const shell = document.querySelector<HTMLElement>('[data-shell]');
  const message = shell?.dataset['pwaMessage'];
  const action = shell?.dataset['pwaAction'];
  const dismiss = shell?.dataset['pwaDismiss'];
  if (!message || !action || !dismiss) return null;
  return { message, action, dismiss };
}

/**
 * Register, and offer the update when one is waiting.
 *
 * Returns a teardown so the caller owns the listeners it created — the same rule every
 * other runtime on this site follows (Review E: nothing is wired to the document that
 * outlives the page unless it is wired exactly once).
 */
export function initPwa(): { destroy(): void } {
  const noop = { destroy() { /* nothing was started */ } };

  if (!('serviceWorker' in navigator)) return noop;
  // No copy means no way to ask, and a worker that installs a new version the reader
  // can never accept would strand them on it.
  const copy = copyFromShell();
  if (!copy) return noop;
  // A worker registered from a dev server would cache a build that does not exist.
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return noop;
  }

  let prompt: HTMLElement | null = null;
  let registration: ServiceWorkerRegistration | null = null;

  const offer = (worker: ServiceWorker) => {
    if (prompt) return;
    prompt = buildPrompt(copy, () => {
      // The one place `skipWaiting` is ever reached, and a click starts it.
      worker.postMessage(ACTIVATE);
      // The controller change is what actually swaps the page over, and it is the
      // browser's own signal that the new version is live.
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      }, { once: true });
      close();
    }, close);
    document.body.append(prompt);
  };

  function close(): void {
    prompt?.remove();
    prompt = null;
  }

  const onUpdateFound = () => {
    const installing = registration?.installing;
    if (!installing) return;
    installing.addEventListener('statechange', () => {
      // `waiting` plus an existing controller means: a NEW version is ready and an OLD
      // one is running. Without the controller check this fires on the very first
      // install, and the reader is asked to update to the page they just opened.
      if (installing.state === 'installed' && navigator.serviceWorker.controller) {
        offer(installing);
      }
    });
  };

  const start = () => {
    navigator.serviceWorker.register(SW_URL).then((reg) => {
      registration = reg;
      if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
      reg.addEventListener('updatefound', onUpdateFound);
    }).catch(() => {
      // A failed registration is not an error the reader can act on, and the site works
      // without a worker. Swallowed on purpose.
    });
  };

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });

  return {
    destroy() {
      close();
      registration?.removeEventListener('updatefound', onUpdateFound);
    },
  };
}

/**
 * The prompt.
 *
 * Built in script rather than shipped in every document, because it is shown on a
 * fraction of visits and an always-present hidden element is markup every reader pays
 * for. `role="status"` rather than `alert`: a new version is available, not urgent.
 */
function buildPrompt(
  copy: UpdatePromptCopy,
  onUpdate: () => void,
  onDismiss: () => void,
): HTMLElement {
  const el = document.createElement('div');
  el.className = 'pwa-update';
  el.setAttribute('role', 'status');

  const text = document.createElement('p');
  text.className = 'pwa-update__text';
  text.textContent = copy.message;

  const update = document.createElement('button');
  update.type = 'button';
  update.className = 'ctl pwa-update__action';
  const label = document.createElement('span');
  label.textContent = copy.action;
  update.append(label);
  update.addEventListener('click', onUpdate);

  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'pwa-update__dismiss';
  dismiss.setAttribute('aria-label', copy.dismiss);
  dismiss.textContent = '×';
  dismiss.addEventListener('click', onDismiss);

  el.append(text, update, dismiss);
  return el;
}
