/**
 * Request-time configuration, read from exactly one place.
 *
 * ── The Astro 7 / adapter fact that this file exists to record ───────────────
 * **`Astro.locals.runtime.env` NO LONGER EXISTS.** @astrojs/cloudflare 14 removed it and
 * throws on access — `Astro.locals.runtime.env has been removed in Astro v6. Use
 * 'import { env } from "cloudflare:workers"' instead.` Found by running the endpoint, not
 * by reading about it: every submission was a 500 until this file changed. The Worker's
 * bindings and secrets now come from the `cloudflare:workers` module, at request time,
 * and that is the only supported way to read them.
 *
 * `@cloudflare/workers-types` is NOT installed — it is a devDependency of the adapter and
 * is not hoisted — so the module is declared in src/env.d.ts with the one export this
 * project uses. A whole ambient type package for one binding would also drag Workers'
 * global overrides across a codebase that is mostly DOM.
 *
 * ── Why not `import.meta.env` ────────────────────────────────────────────────
 * Vite inlines it at BUILD time. A secret read that way would be baked into the bundle —
 * and into the client bundle if the module were ever imported from a component, which is
 * the exact failure this file exists to make impossible. Only `PUBLIC_`-prefixed values
 * are read from `import.meta.env`, and they live in src/config/forms.ts, not here.
 *
 * ── Local development ────────────────────────────────────────────────────────
 * `.dev.vars` in the project root is wrangler's own local secrets file and is already
 * gitignored. Anything in it appears here. `process.env` is consulted after it, for the
 * test runner and for a plain `astro dev` shell.
 *
 * NOTHING HERE IS LOGGED and nothing here is returned to a caller. `describeEnv()` is the
 * only function that reports on configuration, and it reports PRESENCE, never value.
 */

import { env as workerEnv } from 'cloudflare:workers';

/** Every name this project expects to find in the environment. One list, no strays. */
export const ENV_KEYS = {
  turnstileSecret: 'TURNSTILE_SECRET_KEY',
  /** Which delivery adapter to use. Unset means "decide from what is configured". */
  provider: 'CONTACT_PROVIDER',
  /** Where an accepted message goes. Decision D17 — UNKNOWN, and never guessed. */
  recipient: 'CONTACT_RECIPIENT',
  /** The From: address. Must be on a domain the provider has verified. */
  sender: 'CONTACT_SENDER',
  resendKey: 'RESEND_API_KEY',
  brevoKey: 'BREVO_API_KEY',
} as const;

/**
 * Resolve one value: the Worker's environment first, then the shell's.
 *
 * Both reads are guarded. `cloudflare:workers` throws if it is touched outside a request
 * context, and a configuration read must never be the thing that turns a working endpoint
 * into a 500 — an unreadable variable is an ABSENT variable, and absent already has a
 * defined, safe meaning everywhere it is used.
 */
export function readEnv(key: string): string | undefined {
  try {
    const value = (workerEnv as Record<string, unknown>)[key];
    if (typeof value === 'string' && value !== '') return value;
  } catch { /* not in a Worker context; fall through */ }

  try {
    const value = process.env[key];
    if (typeof value === 'string' && value !== '') return value;
  } catch { /* no process; fall through */ }

  return undefined;
}

/**
 * Whether this process is a development surface.
 *
 * Used for exactly one decision — may the endpoint fall back to the dev sink — so it is
 * deliberately strict. `import.meta.env.DEV` is true in `astro dev` and false in every
 * build, including a preview build, which is the line we want: a built artefact never
 * pretends to deliver.
 */
export const IS_DEV: boolean = import.meta.env.DEV === true;

/** Presence only. Safe to log, safe to return, never contains a secret. */
export function describeEnv(): Record<string, boolean> {
  return {
    turnstileSecret: readEnv(ENV_KEYS.turnstileSecret) !== undefined,
    recipient: readEnv(ENV_KEYS.recipient) !== undefined,
    sender: readEnv(ENV_KEYS.sender) !== undefined,
    resendKey: readEnv(ENV_KEYS.resendKey) !== undefined,
    brevoKey: readEnv(ENV_KEYS.brevoKey) !== undefined,
  };
}
