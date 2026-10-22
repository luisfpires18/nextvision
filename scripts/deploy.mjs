#!/usr/bin/env node
/**
 * scripts/deploy.mjs — the ONE way this project reaches Cloudflare.
 *
 *     node scripts/deploy.mjs dev
 *     node scripts/deploy.mjs prod
 *
 * (The targets were `staging` / `production` until 2026-10-22; the measurements below were
 * taken under those names and hold unchanged for `dev` / `prod`.)
 *
 * ── Why this script exists at all ─────────────────────────────────────────────
 *
 * `@astrojs/cloudflare` deploys through a REDIRECTED wrangler configuration: the build
 * writes `dist/server/wrangler.json` and `.wrangler/deploy/config.json` points wrangler
 * at it. That generated file is RESOLVED FOR ONE ENVIRONMENT — it carries a single
 * `name` and no `env` block at all. The environment is therefore chosen at BUILD time,
 * by the `CLOUDFLARE_ENV` variable, and `wrangler deploy --env <x>` is only a guard
 * that the two agree.
 *
 * That guard has a hole, and it was measured, not assumed:
 *
 *     npm run build                          -> resolved name "next-vision-films"
 *     wrangler deploy --dry-run --env production   -> EXIT 0. No error. No warning.
 *
 * A build with no CLOUDFLARE_ENV resolves to the TOP-LEVEL name, which is the staging
 * Worker — so a production deploy off a default build silently overwrites STAGING.
 * (The reverse mismatch does error: a production-resolved build refuses `--env staging`
 * with "This does not match the target environment". Only the unset case is silent.)
 *
 * So this script does three things wrangler will not do for us:
 *
 *   1. sets CLOUDFLARE_ENV for the build, so the artefact is resolved for the target;
 *   2. reads the built `dist/server/wrangler.json` back and asserts its resolved `name`
 *      is the name `wrangler.jsonc` declares for that environment — the artefact is
 *      checked, not the intention;
 *   3. only then runs `wrangler deploy --env <target>`.
 *
 * The Worker names are NOT declared here. They are read out of wrangler.jsonc, which is
 * their one declaration; adding a copy would be adding something free to drift.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('../', import.meta.url);
const USER_CONFIG = new URL('wrangler.jsonc', ROOT);
const BUILT_CONFIG = new URL('dist/server/wrangler.json', ROOT);

const die = (message) => {
  console.error(`\n  deploy: ${message}\n`);
  process.exit(1);
};

/**
 * Strip line and block comments from JSONC without touching string literals.
 * wrangler.jsonc is heavily commented and several comments contain "//" inside URLs,
 * so a naive regex would eat half the file.
 */
const BACKSLASH = String.fromCharCode(92);

function stripJsonc(source) {
  let out = '';
  let inString = false;
  let inLine = false;
  let inBlock = false;
  for (let i = 0; i < source.length; i += 1) {
    const c = source[i];
    const next = source[i + 1];
    if (inLine) {
      if (c === '\n') { inLine = false; out += c; }
      continue;
    }
    if (inBlock) {
      if (c === '*' && next === '/') { inBlock = false; i += 1; }
      continue;
    }
    if (inString) {
      out += c;
      if (c === BACKSLASH) { out += source[i + 1] ?? ''; i += 1; continue; }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; out += c; continue; }
    if (c === '/' && next === '/') { inLine = true; i += 1; continue; }
    if (c === '/' && next === '*') { inBlock = true; i += 1; continue; }
    out += c;
  }
  return out;
}

const target = process.argv[2];
const alreadyBuilt = process.argv.includes('--built');
const dryRun = process.argv.includes('--dry-run');

const user = JSON.parse(stripJsonc(readFileSync(fileURLToPath(USER_CONFIG), 'utf8')));
const environments = Object.keys(user.env ?? {});

if (!target || !environments.includes(target)) {
  die(
    `unknown target ${target ? `"${target}"` : '(none given)'}.\n` +
      `  Usage: node scripts/deploy.mjs <${environments.join('|')}> [--built] [--dry-run]\n` +
      `  Environments are declared in wrangler.jsonc.`,
  );
}

const expectedName = user.env[target].name;
if (!expectedName) {
  die(`wrangler.jsonc env.${target} declares no explicit "name".\n` +
      `  Without one wrangler appends the environment to the top-level name, which would\n` +
      `  rename a Worker that already exists. Every environment names itself here.`);
}

console.log(`\n  deploy target: ${target}  ->  Worker "${expectedName}"\n`);

const run = (command, args, extraEnv = {}) => {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...extraEnv },
    cwd: fileURLToPath(ROOT),
  });
  if (result.status !== 0) die(`\`${command} ${args.join(' ')}\` failed (exit ${result.status}).`);
};

// 1. Build (inside verify unless it was already run) with the environment selected.
//    CLOUDFLARE_ENV is what actually decides the deployment target. --env does not.
if (alreadyBuilt) {
  // CI already ran `npm run verify` with CLOUDFLARE_ENV set. Nothing is trusted about
  // that: step 2 below reads the artefact back and refuses it if it was built for the
  // other environment, or for none.
  console.log('  --built: reusing the existing dist/, not rebuilding.');
} else {
  run('npm', ['run', 'verify'], { CLOUDFLARE_ENV: target });
}

// 2. Check the ARTEFACT, not the intention.
let built;
try {
  built = JSON.parse(readFileSync(fileURLToPath(BUILT_CONFIG), 'utf8'));
} catch (error) {
  die(`could not read the generated ${BUILT_CONFIG.pathname} (${String(error)}).`);
}

if (built.name !== expectedName) {
  die(
    `the build resolved to Worker "${built.name}", but ${target} is "${expectedName}".\n` +
      `  This is the silent-overwrite case: a build with no CLOUDFLARE_ENV resolves to the\n` +
      `  top-level name and wrangler accepts --env for it without complaint.\n` +
      `  Refusing to deploy.`,
  );
}
if (!(built.definedEnvironments ?? []).includes(target)) {
  die(`the generated config does not list "${target}" in definedEnvironments.`);
}

console.log(`\n  artefact check: dist/server/wrangler.json resolves to "${built.name}" ✓\n`);

// 3. Deploy. --env is redundant given the above, and kept because it is a second lock:
//    wrangler errors if it disagrees with the environment the build was made for.
run('npx', ['wrangler', 'deploy', '--env', target, ...(dryRun ? ['--dry-run'] : [])]);
