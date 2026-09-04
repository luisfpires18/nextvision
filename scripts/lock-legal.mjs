#!/usr/bin/env node
/**
 * lock-legal.mjs — record the checksum of the read-only legal archive.
 *
 * `docs/content/*.txt` is the verbatim extract every later diff is measured against
 * (CLAUDE.md §2). This writes its SHA-256 into docs/content/legal-source.lock.json so
 * that `npm run validate:legal` can tell "the production page changed" apart from
 * "the baseline itself moved".
 *
 * Run it ONLY when the live site's legal text has genuinely changed and the archive has
 * been re-captured — never to make a failing check pass.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(import.meta.dirname, '..');
const FILES = [
  'docs/content/termos-e-condicoes.txt',
  'docs/content/politica-de-privacidade.txt',
];

const files = {};
for (const rel of FILES) {
  const raw = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  files[rel] = crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
  console.log(`  ${rel}  ${files[rel]}`);
}

const out = {
  note: 'SHA-256 of the read-only legal archive. Verified by scripts/validate-legal.mjs. '
    + 'Re-lock ONLY after a genuine re-capture of the live site — never to silence a failure.',
  lockedAt: new Date().toISOString().slice(0, 10),
  algorithm: 'sha256',
  encoding: 'utf8',
  files,
};

const dest = path.join(ROOT, 'docs/content/legal-source.lock.json');
fs.writeFileSync(dest, `${JSON.stringify(out, null, 2)}\n`);
console.log(`\nwrote docs/content/legal-source.lock.json`);
