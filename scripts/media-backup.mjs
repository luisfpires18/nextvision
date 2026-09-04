#!/usr/bin/env node
/**
 * media-backup.mjs — the PRIVATE source backup. A different bucket, on purpose.
 *
 * ── Why this is separate from media:sync ─────────────────────────────────────
 * `nvf-media` is the delivery bucket. Everything in it is intended to be fetched by a
 * browser and, once a public hostname exists, is world-readable. The masters are not that:
 * `source-archive/` is a byte-faithful copy of a WordPress site including its uploads, and
 * `docs/Smash/` is 469 MB of the owners' own footage. Putting either into the delivery
 * namespace would publish the originals of every film on the site.
 *
 * So they go to `nvf-source-archive`, which stays private, is never given a public URL,
 * and is never read by the site. Nothing in the site's code path can reach it.
 *
 * ── Why it is not run automatically ──────────────────────────────────────────
 * It is hundreds of megabytes and it costs money to store. It is also the ONLY off-machine
 * copy of material that currently exists once (CLAUDE.md §10, standing rule 4), which
 * makes running it a decision worth taking deliberately rather than as a side effect of a
 * build.
 *
 *   npm run media:backup                    describe the plan, change nothing
 *   npm run media:backup -- --execute       upload what is missing
 *   npm run media:backup -- --only smash    limit to one source set
 *
 * There is no `--delete`. A backup that can prune itself is not a backup.
 *
 * ── Two transports, the same pair media:sync uses ────────────────────────────
 * With R2 API keys it uses the S3 API, which can LIST, so the plan is read from the bucket
 * itself. Without them it falls back to `wrangler r2 object put` on the Cloudflare login
 * already present on the machine. That path cannot list, so the plan comes from
 * media/.backup-ledger.json and is labelled unverified — which matters more here than it
 * does for delivery, because a delivery filename contains a hash of its own bytes and an
 * archive key does not. A wrangler-transported backup is worth spot-checking by restore.
 */

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { ROOT, SMASH_CANDIDATES } from './media/recipe.mjs';
import { human, readJson, writeJson } from './media/lib.mjs';
import { r2Config, listObjects, putObject } from './media/r2.mjs';

const EXECUTE = process.argv.includes('--execute');
const ONLY = (() => { const i = process.argv.indexOf('--only'); return i >= 0 ? process.argv[i + 1] : null; })();
const log = (...a) => console.log(...a);

/** The private bucket. Never the delivery one, and never derived from R2_BUCKET. */
const BACKUP_BUCKET = process.env['R2_BACKUP_BUCKET'] || 'nvf-source-archive';
const LEDGER = path.join(ROOT, 'media', '.backup-ledger.json');

/** Archives are not fetched by a browser; there is nothing to cache. */
const NO_CACHE = 'private, max-age=0, no-store';

/**
 * Upload through the Cloudflare login when there are no S3 keys.
 *
 * Invoked as `node node_modules/wrangler/bin/wrangler.js`, NOT through `npx` with
 * `shell: true` — the shell re-splits arguments, and `--cache-control` carries a comma and
 * spaces, which a shelled call turns into three arguments that wrangler then rejects.
 */
const exec = promisify(execFile);
const WRANGLER = path.join(process.cwd(), 'node_modules', 'wrangler', 'bin', 'wrangler.js');

const wranglerPut = (bucket, key, file) =>
  exec(process.execPath, [
    WRANGLER, 'r2', 'object', 'put', bucket + '/' + key,
    '--file', file, '--remote', '--force',
    '--content-type', 'application/octet-stream', '--cache-control', NO_CACHE,
  ], { maxBuffer: 8 * 1024 * 1024 });

const smash = SMASH_CANDIDATES.find((c) => existsSync(c)) ?? null;

/** Each set keeps its own prefix, so the bucket says what a thing is and where it came from. */
const SETS = [
  { name: 'archive', root: path.join(ROOT, 'source-archive'), prefix: 'archive/wordpress' },
  ...(smash ? [{ name: 'smash', root: smash, prefix: 'archive/smash' }] : []),
];

async function walk(dir, base = dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(full, base));
    else out.push({ full, rel: path.relative(base, full).replace(/\\/g, '/'), size: (await fs.stat(full)).size });
  }
  return out;
}

async function main() {
  const cfg = { ...await r2Config(), bucket: BACKUP_BUCKET };
  const ledger = await readJson(LEDGER, { bucket: null, objects: {} });

  const plan = [];
  for (const set of SETS) {
    if (ONLY && set.name !== ONLY) continue;
    if (!existsSync(set.root)) { log(`  !! ${set.name}: ${set.root} is not on this machine`); continue; }
    for (const f of await walk(set.root)) {
      plan.push({ ...f, key: `${set.prefix}/${f.rel}`, set: set.name });
    }
  }

  let remote;
  if (cfg.credentials) remote = await listObjects(cfg);
  else remote = new Map(Object.entries(ledger.objects ?? {}));

  const todo = plan.filter((f) => remote.get(f.key) !== f.size);
  const already = plan.length - todo.length;
  const bytes = todo.reduce((n, f) => n + f.size, 0);

  log(`\nPRIVATE source backup → ${BACKUP_BUCKET}  (never public, never read by the site)\n`);
  for (const set of SETS) {
    const of = plan.filter((f) => f.set === set.name);
    if (of.length) log(`  ${set.name.padEnd(10)} ${String(of.length).padStart(5)} files  ${human(of.reduce((n, f) => n + f.size, 0))}  → ${set.prefix}/`);
  }
  log(`\n  upload   ${String(todo.length).padStart(5)}   ${human(bytes)}`);
  log(`  skip     ${String(already).padStart(5)}   already backed up at the same size`);

  if (!EXECUTE) {
    log('\nDRY RUN — nothing uploaded.');
    if (!cfg.credentials) {
      log(`\nNo S3 keys (${cfg.missing.join(', ')}). --execute falls back to`);
      log(`\`wrangler r2 object put\` against ${BACKUP_BUCKET}, one process per file: correct,`);
      log('but slow, and it cannot verify what the bucket already holds. For a verifiable');
      log('backup create an R2 API token (Object Read & Write) — docs/MEDIA_PIPELINE.md §6.');
    }
    log('\nThis writes hundreds of megabytes to paid storage. Re-run with --execute when you mean it.\n');
    return;
  }

  const viaWrangler = !cfg.credentials;
  if (viaWrangler) log(`\nNo S3 keys — uploading through wrangler to ${BACKUP_BUCKET}. This is slow.\n`);

  let done = 0;
  for (const f of todo) {
    if (viaWrangler) await wranglerPut(BACKUP_BUCKET, f.key, f.full);
    else await putObject(cfg, f.key, await fs.readFile(f.full), {
      contentType: 'application/octet-stream',
      cacheControl: NO_CACHE,
    });
    ledger.objects[f.key] = f.size;
    done += 1;
    if (done % 25 === 0 || done === todo.length) log(`  uploaded ${done}/${todo.length}`);
  }
  ledger.bucket = BACKUP_BUCKET;
  ledger.syncedAt = new Date().toISOString();
  await writeJson(LEDGER, ledger);
  log(`\ndone — ${todo.length} file(s), ${human(bytes)}.\n`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
