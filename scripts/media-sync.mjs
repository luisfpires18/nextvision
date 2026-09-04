#!/usr/bin/env node
/**
 * media-sync.mjs — put the local bucket mirror into R2.
 *
 * DRY RUN BY DEFAULT. Nothing is uploaded and nothing is deleted unless you say so.
 *
 *   npm run media:sync                 describe the plan, change nothing
 *   npm run media:sync -- --execute    upload what is missing
 *   npm run media:sync -- --execute --delete   ALSO remove orphaned remote objects
 *
 * Because every rendition's filename contains eight hex characters of its own SHA-256,
 * "already uploaded" is decidable from the key alone: a name that matches is bytes that
 * match. So the sync is a set difference, an update is an upload of a NEW key, and a CDN
 * purge is never needed. The only thing worth re-uploading is an object whose remote size
 * disagrees with the local one, which means a previous upload was truncated.
 *
 * `--delete` exists because those old keys accumulate; it is never implied, never the
 * default, and it only ever removes objects that the current manifest does not reference.
 *
 * TWO TRANSPORTS. With R2 API keys (.env) it uses the S3 API, which can LIST — so the plan
 * is read from the bucket itself. Without them it falls back to `wrangler r2 object put`,
 * which works off the Cloudflare login already on the machine but cannot list; there the
 * plan is read from media/.remote-ledger.json and is labelled as unverified, because it is.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { MIRROR, LEDGER_FILE, MANIFEST_FILE, CACHE_IMMUTABLE, CONTENT_TYPES, listMirror, readJson, writeJson, human, mirrorPath } from './media/lib.mjs';
import { r2Config, listObjects, putObject, deleteObject } from './media/r2.mjs';

const exec = promisify(execFile);
const EXECUTE = process.argv.includes('--execute');
const DELETE = process.argv.includes('--delete');
const log = (...a) => console.log(...a);

/** The DELIVERY bucket. The private source backup is a different one (media:backup). */
const DELIVERY_BUCKET = process.env['R2_BUCKET'] || 'nvf-media';

/**
 * Upload through the Cloudflare login when there are no S3 keys. Slower; no listing.
 *
 * Invoked as `node node_modules/wrangler/bin/wrangler.js`, NOT through `npx` with
 * `shell: true`. The shell re-splits arguments, and `--cache-control` carries spaces and a
 * comma — a shelled call turned `public, max-age=…, immutable` into three arguments and
 * wrangler rejected the last two.
 */
const WRANGLER = path.join(process.cwd(), 'node_modules', 'wrangler', 'bin', 'wrangler.js');

const wrangler = (args) =>
  exec(process.execPath, [WRANGLER, ...args], { maxBuffer: 8 * 1024 * 1024 });

async function wranglerPut(bucket, objPath, file, contentType) {
  await wrangler([
    'r2', 'object', 'put', `${bucket}/${objPath}`,
    '--file', file, '--remote', '--force',
    '--content-type', contentType, '--cache-control', CACHE_IMMUTABLE,
  ]);
}

async function wranglerDelete(bucket, objPath) {
  await wrangler(['r2', 'object', 'delete', `${bucket}/${objPath}`, '--remote']);
}

const contentTypeOf = (objPath) => CONTENT_TYPES[objPath.slice(objPath.lastIndexOf('.') + 1)] ?? 'application/octet-stream';

async function main() {
  const manifest = await readJson(MANIFEST_FILE, { items: {} });
  const mirror = await listMirror();
  const mirrorSet = new Set(mirror);

  /** What the SITE references. An object in the mirror that the manifest dropped is not uploaded. */
  const referenced = new Map();
  for (const item of Object.values(manifest.items)) {
    for (const r of item.renditions ?? []) referenced.set(r.path, r.bytes);
  }

  const missingLocally = [...referenced.keys()].filter((p) => !mirrorSet.has(p));
  if (missingLocally.length) {
    log(`\n!! ${missingLocally.length} manifest rendition(s) are not in the mirror. Run \`npm run media:build\` first.`);
    for (const p of missingLocally.slice(0, 5)) log(`     ${p}`);
    process.exitCode = 1;
    return;
  }

  const cfg = { ...await r2Config(), bucket: DELIVERY_BUCKET };
  const ledger = await readJson(LEDGER_FILE, { bucket: null, objects: {} });

  /* ── what is already there ─────────────────────────────────────────────── */
  let remote;
  let remoteSource;
  if (cfg.credentials) {
    remote = await listObjects(cfg);
    remoteSource = `${cfg.bucket} (listed over the S3 API)`;
  } else {
    // No R2 API token on this machine. The ledger is what we last uploaded; it is
    // advisory, and it is labelled as such rather than presented as the bucket's truth.
    remote = new Map(Object.entries(ledger.objects ?? {}));
    remoteSource = ledger.bucket
      ? `local ledger for ${ledger.bucket} — NOT verified against the bucket`
      : `nothing known yet (no S3 keys, no ledger) — uploads would go to ${DELIVERY_BUCKET} through wrangler`;
  }

  /* ── the plan ──────────────────────────────────────────────────────────── */
  const uploads = [];
  const replacements = [];
  const skipped = [];
  for (const [objPath, bytes] of referenced) {
    if (!remote.has(objPath)) uploads.push(objPath);
    else if (remote.get(objPath) !== bytes) replacements.push(objPath);
    else skipped.push(objPath);
  }
  const orphans = [...remote.keys()].filter((k) => !referenced.has(k));

  const sum = (list) => list.reduce((n, p) => n + (referenced.get(p) ?? 0), 0);

  log(`\nmirror   ${path.relative(process.cwd(), MIRROR)}  —  ${mirror.length} files`);
  log(`manifest ${Object.keys(manifest.items).length} assets, ${referenced.size} renditions`);
  log(`remote   ${remoteSource}\n`);
  log(`  upload    ${String(uploads.length).padStart(5)}   ${human(sum(uploads))}`);
  log(`  replace   ${String(replacements.length).padStart(5)}   ${human(sum(replacements))}   (remote size disagrees — truncated upload)`);
  log(`  skip      ${String(skipped.length).padStart(5)}   identical, content-addressed`);
  log(`  orphaned  ${String(orphans.length).padStart(5)}   remote objects the manifest no longer references`);

  if (!EXECUTE) {
    log('\nDRY RUN — nothing uploaded, nothing deleted.');
    if (!cfg.credentials) {
      log(`\nNo S3 keys (${cfg.missing.join(', ')}). --execute would fall back to`);
      log(`\`wrangler r2 object put\` against ${cfg.bucket}, one process per file: correct,`);
      log('but slow, and it cannot verify what is already in the bucket. For a real sync');
      log('create an R2 API token (Object Read & Write) — docs/MEDIA_PIPELINE.md §6.');
    }
    log('\nRe-run with --execute to upload. Deletion additionally requires --delete.\n');
    if (orphans.length && !DELETE) {
      log(`${orphans.length} orphan(s) would be LEFT IN PLACE. That is the default and it is safe.`);
      for (const k of orphans.slice(0, 10)) log(`     ${k}`);
      if (orphans.length > 10) log(`     … and ${orphans.length - 10} more`);
      log('');
    }
    return;
  }

  /* ── do it ─────────────────────────────────────────────────────────────── */
  const viaWrangler = !cfg.credentials;
  if (viaWrangler) log(`\nNo S3 keys — uploading through wrangler to ${cfg.bucket}. This is slow.\n`);

  const todo = [...uploads, ...replacements];
  let done = 0;
  for (const objPath of todo) {
    const file = mirrorPath(objPath);
    const bytes = (await fs.stat(file)).size;
    if (viaWrangler) {
      await wranglerPut(cfg.bucket, objPath, file, contentTypeOf(objPath));
    } else {
      await putObject(cfg, objPath, await fs.readFile(file), {
        contentType: contentTypeOf(objPath),
        // Every name is content-addressed, so a year and `immutable` are correct and no
        // future derivative update will ever require a purge.
        cacheControl: CACHE_IMMUTABLE,
      });
    }
    ledger.objects[objPath] = bytes;
    done += 1;
    if (done % 25 === 0 || done === todo.length) log(`  uploaded ${done}/${todo.length}`);
  }

  if (DELETE) {
    for (const key of orphans) {
      if (viaWrangler) await wranglerDelete(cfg.bucket, key);
      else await deleteObject(cfg, key);
      delete ledger.objects[key];
    }
    log(`  deleted ${orphans.length} orphaned object(s)`);
  }

  ledger.bucket = cfg.bucket;
  ledger.syncedAt = new Date().toISOString();
  await writeJson(LEDGER_FILE, ledger);

  log(`\ndone — ${todo.length} uploaded, ${skipped.length} unchanged, `
    + `${DELETE ? orphans.length : 0} deleted, ${DELETE ? 0 : orphans.length} orphan(s) left in place.\n`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
