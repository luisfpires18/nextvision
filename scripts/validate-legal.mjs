#!/usr/bin/env node
/**
 * validate-legal.mjs — proof that the legal copy still says exactly what it said.
 *
 * The two legal pages are the only content on this site that may never be improved,
 * shortened, corrected or reworded (CLAUDE.md §2). Presentation, on the other hand, had
 * to change: the source ships `/termos-e-condicoes/` as one unbroken block with its
 * lettered sections hidden inside `<strong>`, and `/politica-de-privacidade/` with an
 * h1 → h4 jump and ten navigation links pointing at another company's website.
 *
 * So the check has to tell those two things apart. It does it in one move:
 *
 *      compare the two documents with ALL whitespace and ALL markup removed.
 *
 * Markup-only edits — a heading level, a paragraph split, an `id`, a list, a table, a
 * repointed anchor — vanish under that normalisation and pass. A changed, added or
 * deleted WORD survives it and fails. There is no threshold and no tolerance: the two
 * normalised strings are equal or the build stops.
 *
 * Two independent guarantees, because one of them is about a file nobody should touch:
 *
 *   1. ARCHIVE UNCHANGED.  docs/content/*.txt is the read-only canonical extract. Its
 *      SHA-256 is recorded in docs/content/legal-source.lock.json. If the archive itself
 *      is edited, the baseline every diff is measured against has moved, and that fails
 *      here rather than silently redefining "verbatim".
 *
 *   2. PRODUCTION MATCHES THE ARCHIVE.  normalise(title + rendered body) must equal
 *      normalise(archived text), character for character.
 *
 * Regenerate the production files with `npm run legal:build` — they are derived from
 * source-archive/wordpress/html/, never retyped.
 *
 * Exit code 1 on any failure. Nothing here warns.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(import.meta.dirname, '..');
const errors = [];
const ok = [];

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const sha256 = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

const DOCS = [
  {
    id: 'terms',
    archive: 'docs/content/termos-e-condicoes.txt',
    content: 'src/content/legal/termos-e-condicoes.md',
    /** The <h1>. It lives in frontmatter in production and in the body in the archive. */
    title: 'Termos e Condições',
  },
  {
    id: 'privacy',
    archive: 'docs/content/politica-de-privacidade.txt',
    content: 'src/content/legal/politica-de-privacidade.md',
    title: 'política de privacidade',
  },
];

const LOCK = 'docs/content/legal-source.lock.json';

/* ------------------------------------------------------------ normalisation */

/**
 * Everything a reader would hear, with nothing a browser would render.
 *
 * Order matters: links collapse to their labels before emphasis is stripped, and table
 * rules are dropped before pipes are, or a separator row would leave a run of dashes
 * that the archive has no reason to contain.
 */
function normalise(text) {
  let s = text;
  s = s.replace(/<[^>]+>/g, '');                       // html tags, ids included
  s = s.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1');     // [label](href) -> label
  s = s.replace(/^\s*\|[\s:|-]+\|\s*$/gm, '');         // markdown table rules
  s = s.replace(/^\s{0,3}[-*+]\s+/gm, '');             // list markers
  s = s.replace(/^\s{0,3}#{1,6}\s+/gm, '');            // atx headings
  s = s.replace(/\|/g, '');                            // table cell separators
  s = s.replace(/\*/g, '');                            // bold / italic runs
  s = s.replace(/[\s ​]+/g, '');             // ALL whitespace
  return s.normalize('NFC');
}

/** The archive files carry a provenance header above a `---` rule. */
const archiveBody = (raw) => {
  const at = raw.indexOf('\n---\n');
  if (at === -1) throw new Error('archive extract has no --- separator');
  return raw.slice(at + 5);
};

/** Everything after the frontmatter block of a content entry. */
const contentBody = (raw) => {
  if (!raw.startsWith('---')) return raw;
  const at = raw.indexOf('\n---', 3);
  if (at === -1) throw new Error('content entry has no closing frontmatter rule');
  return raw.slice(at + 4);
};

/* ---------------------------------------------------- 1. archive unchanged */

let lock = null;
try {
  lock = JSON.parse(read(LOCK));
} catch {
  errors.push(`legal: ${LOCK} is missing or unreadable — regenerate it with \`npm run legal:lock\``);
}

for (const doc of DOCS) {
  let raw;
  try {
    raw = read(doc.archive);
  } catch {
    errors.push(`legal: the canonical archive ${doc.archive} is missing`);
    continue;
  }

  const digest = sha256(raw);
  const recorded = lock?.files?.[doc.archive];
  if (!lock) continue;
  if (!recorded) {
    errors.push(`legal: ${doc.archive} is not recorded in ${LOCK}`);
  } else if (recorded !== digest) {
    errors.push(
      `legal: THE ARCHIVE HAS BEEN EDITED — ${doc.archive}\n`
      + `        recorded ${recorded}\n        actual   ${digest}\n`
      + '        docs/content/ is read-only source material (CLAUDE.md §2). Restore it,\n'
      + '        or — only if the live site genuinely changed — re-archive and re-lock,\n'
      + '        and say so in docs/STATIC_PAGES_ROLLOUT.md.',
    );
  } else {
    ok.push(`legal: ${doc.archive} matches its recorded checksum`);
  }
}

/* ------------------------------------------ 2. production matches the archive */

for (const doc of DOCS) {
  let archived;
  let produced;
  try {
    archived = normalise(archiveBody(read(doc.archive)));
  } catch (e) {
    errors.push(`legal: ${doc.archive}: ${e.message}`);
    continue;
  }
  try {
    produced = normalise(doc.title + contentBody(read(doc.content)));
  } catch (e) {
    errors.push(`legal: ${doc.content}: ${e.message}`);
    continue;
  }

  if (produced === archived) {
    ok.push(`legal: ${doc.content} is word-for-word the archived original (${archived.length} chars compared)`);
    continue;
  }

  // Locate the first divergence and quote both sides, so a failure is actionable rather
  // than merely alarming.
  let i = 0;
  while (i < produced.length && i < archived.length && produced[i] === archived[i]) i += 1;
  const window = 90;
  errors.push(
    `legal: ${doc.content} DIFFERS FROM ${doc.archive} at normalised character ${i}\n`
    + `        archive:    …${archived.slice(Math.max(0, i - 30), i + window)}…\n`
    + `        production: …${produced.slice(Math.max(0, i - 30), i + window)}…\n`
    + `        lengths: archive ${archived.length}, production ${produced.length}\n`
    + '        Legal copy may never be edited (CLAUDE.md §2). Regenerate with\n'
    + '        `npm run legal:build`, which derives both files from the archive.',
  );
}

/* --------------------------------------- 3. the in-page navigation resolves */

/**
 * Decision D4, audit §9.4: the privacy page's ten `Navegação` links pointed at
 * digiup.me. They now point at this document's own sections — which is only true for as
 * long as every fragment has a heading to land on.
 */
try {
  const md = read(DOCS[1].content);
  /* Both link forms, because the body is Markdown with HTML headings in it and a section
     could legitimately be authored either way. A check that only understands one syntax
     reports a false failure the first time someone uses the other. */
  const fragments = [
    ...[...md.matchAll(/\]\(#([^)]+)\)/g)].map((m) => m[1]),
    ...[...md.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]),
  ];
  const ids = new Set([...md.matchAll(/<[a-z][a-z0-9]*[^>]*\sid="([^"]+)"/gi)].map((m) => m[1]));
  const dangling = fragments.filter((f) => !ids.has(f));
  if (dangling.length) errors.push(`legal: privacy anchors resolve to nothing: ${dangling.join(', ')}`);
  else if (fragments.length !== 10) errors.push(`legal: expected 10 in-page privacy anchors, found ${fragments.length}`);
  else ok.push(`legal: all ${fragments.length} privacy anchors resolve to a section on this page`);

  const offsite = [...md.matchAll(/\]\((https?:\/\/[^)]*digiup\.me[^)]*)\)/g)].map((m) => m[1]);
  if (offsite.length) errors.push(`legal: ${offsite.length} navigation link(s) still point at digiup.me`);
} catch (e) {
  errors.push(`legal: ${e.message}`);
}

/* ---------------------------------------------------------------- report */

for (const o of ok) console.log(`  ok    ${o}`);
for (const e of errors) console.error(`  FAIL  ${e}`);
console.log(`\n${ok.length} ok, ${errors.length} errors`);
process.exit(errors.length ? 1 : 0);
