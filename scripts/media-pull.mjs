#!/usr/bin/env node
/**
 * media-pull.mjs — restore media/dist/ from the R2 delivery bucket. READ ONLY.
 *
 *     npm run media:pull            fetch whatever the mirror is missing
 *     npm run media:pull -- --check report what is missing and exit; fetch nothing
 *
 * ── Why this exists ───────────────────────────────────────────────────────────
 *
 * `media/dist/` is the local delivery mirror: 384 content-addressed renditions that the
 * build copies into the site when PUBLIC_MEDIA_BASE_URL is unset. It is gitignored, and
 * `npm run media:build` reproduces it — but only from the SOURCES, and the sources
 * (docs/Smash/, source-archive/) are gitignored too and total 646 MB.
 *
 * So a clean checkout cannot build the mirror, and `npm run verify` fails: gate G of
 * validate-media.mjs requires every rendition to be present, unconditionally and
 * regardless of the delivery base. That was measured on a fresh worktree, not assumed —
 * 0 files in the mirror, 384 missing. It is the reason a fresh clone, and therefore CI,
 * could not build the site at all.
 *
 * The bucket already holds those exact bytes, so this fetches them instead.
 *
 * ── What it will not do ───────────────────────────────────────────────────────
 *
 * It never writes to R2, never deletes anything anywhere, and never touches the private
 * `nvf-source-archive`. The only remote operation is GET, and the only bucket it reads
 * is the DELIVERY one. Nothing here needs write credentials, so do not give it any.
 *
 * Every file is verified against the SHA-256 the manifest records before it is written,
 * which is what makes this a restore rather than a download: a rendition whose bytes
 * disagree with its own name is refused, not saved.
 */

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { ROOT } from './media/recipe.mjs';
import { MIRROR, MANIFEST_FILE } from './media/lib.mjs';
import { r2Config, getObject } from './media/r2.mjs';

const CHECK_ONLY = process.argv.includes('--check');
const CONCURRENCY = 8;
const log = (...a) => console.log(...a);

const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const human = (n) => (n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`);

async function main() {
  const manifest = JSON.parse(await fs.readFile(MANIFEST_FILE, 'utf8'));
  const wanted = [];
  for (const item of Object.values(manifest.items)) {
    for (const r of item.renditions) wanted.push(r);
  }

  // What the mirror already holds, and holds CORRECTLY. A file of the right name whose
  // bytes hash to something else is not a hit — it is a corrupt mirror, and re-fetching
  // is the repair.
  const missing = [];
  for (const r of wanted) {
    const file = path.join(MIRROR, r.path);
    try {
      const bytes = await fs.readFile(file);
      if (bytes.length === r.bytes && sha256(bytes) === r.sha256) continue;
    } catch { /* absent — fetch it */ }
    missing.push(r);
  }

  log(`\nMedia mirror  ${path.relative(ROOT, MIRROR)}`);
  log(`  renditions in the manifest  ${wanted.length}`);
  log(`  already present and correct ${wanted.length - missing.length}`);
  log(`  to fetch                    ${missing.length} (${human(missing.reduce((n, r) => n + r.bytes, 0))})`);

  if (missing.length === 0) {
    log('\n  mirror complete — nothing to do.\n');
    return;
  }
  if (CHECK_ONLY) {
    log('\n  --check: nothing fetched.\n');
    process.exitCode = 1;
    return;
  }

  const cfg = await r2Config();
  if (!cfg.credentials) {
    console.error(
      `\n  No R2 credentials (${cfg.missing.join(', ')}).\n\n` +
        '  The mirror can be obtained two ways, and this machine can do neither:\n' +
        '    1. `npm run media:build`  — needs the 646 MB of sources (docs/Smash/,\n' +
        '       source-archive/), which are gitignored and are not in a clean checkout.\n' +
        '    2. `npm run media:pull`   — needs READ-ONLY R2 keys for the delivery bucket.\n' +
        '       Cloudflare dashboard -> R2 -> API -> Create API token -> Object Read only.\n\n' +
        '  Set R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.\n',
    );
    process.exit(1);
  }

  log(`  bucket                      ${cfg.bucket} (read only)\n`);

  let done = 0;
  let bytes = 0;
  const queue = [...missing];
  const worker = async () => {
    for (;;) {
      const r = queue.shift();
      if (!r) return;
      const body = await getObject(cfg, r.path);
      // Verified BEFORE it is written. A restore that can write bytes it did not check
      // is a way to poison the mirror from the network.
      if (body.length !== r.bytes || sha256(body) !== r.sha256) {
        throw new Error(
          `${r.path}: bytes from R2 do not match the manifest ` +
            `(${body.length} B / ${sha256(body).slice(0, 8)} vs ${r.bytes} B / ${r.sha256.slice(0, 8)}).`,
        );
      }
      const file = path.join(MIRROR, r.path);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, body);
      done += 1;
      bytes += body.length;
      if (done % 50 === 0 || done === missing.length) log(`  ${done}/${missing.length}  ${human(bytes)}`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));

  log(`\n  restored ${done} renditions, ${human(bytes)}, every one hash-verified.\n`);
}

main().catch((error) => {
  console.error(`\n  media:pull failed — ${error.message}\n`);
  process.exit(1);
});
