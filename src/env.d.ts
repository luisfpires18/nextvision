/**
 * Ambient declarations this project needs and its dependencies do not supply.
 *
 * `cloudflare:workers` is a workerd built-in, resolved by the Cloudflare Vite plugin at
 * build and by the runtime at request time. Its types ship in `@cloudflare/workers-types`,
 * which is a devDependency of @astrojs/cloudflare rather than of this project, so it is
 * not installed here — and installing a whole ambient Workers type package for ONE export
 * would also pull Workers' global overrides across a codebase that is mostly DOM.
 *
 * So the one thing used is declared, and only that thing. If a second export from this
 * module is ever needed, adding it here is deliberate rather than incidental.
 *
 * Why the module is used at all: `Astro.locals.runtime.env` was REMOVED in
 * @astrojs/cloudflare 14 and throws on access. See src/lib/forms/env.ts.
 */
declare module 'cloudflare:workers' {
  /** The Worker's bindings, vars and secrets for the current request. */
  export const env: Record<string, unknown>;
}
