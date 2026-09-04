#!/usr/bin/env node
/**
 * validate-data.mjs — invariants that Astro's own build cannot check.
 *
 * Content collection schemas are enforced by `astro check` / `astro build`. This covers
 * the cross-file rules that would otherwise fail silently:
 *   - route map integrity
 *   - media manifest shape
 *   - media-source-map freshness and the MASTER_REQUIRED count
 *   - that every published string still exists in the archive it claims to come from
 *   - i18n completeness (and that no locale is half-translated)
 *   - that no secret or media binary is about to be committed
 *
 * Exit code 1 on any error. Warnings are informational and expected right now.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const errors = [];
const warnings = [];
const ok = [];

const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const exists = (p) => fs.existsSync(path.join(ROOT, p));
/** Visible text with every whitespace run collapsed, so markup line breaks cannot fail a
    comparison that is about WORDS. */
const flat = (s) => s.replace(/\s+/g, ' ').trim();

/* --------------------------------------------------------------- routes */
try {
  const r = read('src/data/routes.json');
  const paths = r.preserve.map((x) => x.path);

  const dupes = paths.filter((p, i) => paths.indexOf(p) !== i);
  if (dupes.length) errors.push(`routes: duplicate preserved paths: ${[...new Set(dupes)].join(', ')}`);

  const noSlash = paths.filter((p) => !p.endsWith('/'));
  if (noSlash.length) errors.push(`routes: missing trailing slash: ${noSlash.join(', ')}`);

  for (const red of r.redirects) {
    if (red.to.startsWith('/') && !red.to.endsWith('/') && !red.to.includes('.')) {
      errors.push(`routes: redirect target lacks a trailing slash: ${red.from} -> ${red.to}`);
    }
    if (paths.includes(red.from)) {
      errors.push(`routes: ${red.from} is both preserved and redirected`);
    }
  }

  if (r.preserve.filter((x) => x.kind === 'project').length !== 20) {
    errors.push(`routes: expected 20 project routes, found ${r.preserve.filter((x) => x.kind === 'project').length}`);
  }
  if (r.preserve.filter((x) => x.kind === 'category').length !== 5) {
    errors.push(`routes: expected 5 category routes, found ${r.preserve.filter((x) => x.kind === 'category').length}`);
  }

  const unmapped = r.uploads.filter((u) => u.status === 'failed');
  if (unmapped.length) errors.push(`routes: ${unmapped.length} uploads failed to archive`);

  ok.push(`routes: ${r.preserve.length} preserved, ${r.redirects.length} redirects, ${r.uploads.length} uploads mapped`);
} catch (e) {
  errors.push(`routes: ${e.message}`);
}

/* ------------------------------------------------------- media manifest
   SHAPE only. Since Phase 12 the manifest's real gate is `npm run validate:media`, which
   checks the things this file cannot: upscales, content-addressed names against their own
   bytes, mirror completeness, and the built HTML. What stays here is the outstanding
   AUTHORED-COPY debt, because that is a content question and this is the content validator. */
try {
  const m = read('src/data/media-manifest.json');
  if (!m.items || typeof m.items !== 'object') throw new Error('missing items map');

  for (const [key, item] of Object.entries(m.items)) {
    if (item.altStatus === 'todo') warnings.push(`media-manifest: ${key} still needs alt text`);
  }
  ok.push(`media-manifest: ${Object.keys(m.items).length} entries — see \`npm run validate:media\` for the full gate`);
} catch (e) {
  errors.push(`media-manifest: ${e.message}`);
}

/* ----------------------------------------------------- media source map */
try {
  const s = read('src/data/media-source-map.json');
  if (s.projects.length !== 20) errors.push(`media-source-map: expected 20 projects, found ${s.projects.length}`);

  const unreviewed = s.smashInventory.filter((x) => x.match.basis?.startsWith('Not reviewed'));
  if (unreviewed.length) {
    errors.push(`media-source-map: ${unreviewed.length} Smash file(s) unreviewed: ${unreviewed.map((x) => x.file).join(', ')}. Re-run npm run media:map and add a reviewed match.`);
  }

  const noBasis = s.projects.flatMap((p) => p.smash.filter((x) => !x.basis).map(() => p.slug));
  if (noBasis.length) errors.push(`media-source-map: matches without a documented basis: ${noBasis.join(', ')}`);

  warnings.push(`media-source-map: ${s.counts.masterRequired}/20 projects are MASTER_REQUIRED (owner request M1)`);
  warnings.push(`media-source-map: ${s.counts.previewUnknown}/20 projects have no hover-preview source`);
  ok.push(`media-source-map: ${s.counts.projects} projects, ${s.counts.withYouTube} with a valid YouTube id`);
} catch (e) {
  errors.push(`media-source-map: ${e.message}`);
}

/* ------------------------------------------------------- published copy
   CLAUDE.md 2 forbids inventing, rewriting, shortening or summarising published copy.
   Every string this site prints as content therefore declares WHERE IT WAS PUBLISHED —
   `v('...', '/sobre/')` — and this checks the claim against the Phase 0.5 archive rather
   than trusting it. A word added, changed or deleted fails the build.

   Comparison is whitespace-insensitive on BOTH sides, exactly as scripts/validate-legal.mjs
   compares the legal documents, and for the same reason: the archive's text extractor
   inserts a space at every inline-element boundary, so `Na <strong>NVF</strong>,` comes
   back as "Na NVF , ". That is an artefact of the capture, not something the live page
   shows. Stripping whitespace removes the artefact and keeps the check: no word can be
   added, changed, translated or "tightened" without failing here.

   Two strings are not page prose and are checked against the right part of the archive:
   a form field's label is matched against that page's archived FORM, and a string
   published on every project page declares `/portfolio/{slug}/` and is matched against
   any of them. */
try {
  const archive = read('docs/source-archive/pages.json');
  const squash = (t) => (t ?? '').replace(/\s+/g, '').normalize('NFC');

  const byPath = new Map(archive.pages.map((p) => [p.path, p]));
  /** Everything a page publishes as words: its visible text, plus its forms' own labels. */
  const corpus = (page) => squash([
    page.text ?? '',
    ...(page.forms ?? []).flatMap((f) => [
      ...(f.fields ?? []).map((x) => `${x.placeholder ?? ''} ${x.value ?? ''}`),
      ...(f.labels ?? []),
    ]),
    ...(page.elementorWidgets ?? []).length ? [] : [],
  ].join(' '));

  const cache = new Map();
  const textOf = (path) => {
    if (!cache.has(path)) {
      const page = byPath.get(path);
      cache.set(path, page ? corpus(page) : null);
    }
    return cache.get(path);
  };

  /** `/portfolio/{slug}/` means "published on every project page". Any one proves it. */
  const patternPages = (pattern) => {
    const re = new RegExp(`^${pattern.replace(/\{[^}]+\}/g, '[^/]+')}$`);
    return archive.pages.filter((p) => re.test(p.path));
  };

  const SOURCES = [
    'src/lib/homepage.ts', 'src/lib/portfolio.ts', 'src/lib/static-pages.ts',
    // Phase 11. Meta descriptions are SELECTIONS of published sentences, so they are
    // checked against the archive exactly like the copy they are selected from — that is
    // the whole mechanism that stops a description drifting into authorship.
    'src/lib/page-meta.ts',
  ];
  let checked = 0;
  const perFile = new Map();

  for (const file of SOURCES) {
    perFile.set(file, 0);
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    // v('text', '/from/') — and since Phase 11, optionally v('text', '/from/', 'english').
    // Only the first two arguments are checked here: the third is an authored translation
    // with no archive to check it against, and it is checked for COMPLETENESS instead,
    // in the i18n section below. The match therefore stops at a comma or a closing paren.
    // Portuguese copy carries no straight apostrophes, so a single-quoted literal is
    // unambiguous here.
    const re = /\bv\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'([^']*)'\s*[,)]/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const raw = m[1].replace(/\\'/g, "'");
      const from = m[2];
      // The copyright line is the one string with a substitution in it, and it is checked
      // separately below against the exact published wording.
      if (raw.includes('{year}')) continue;
      const needle = squash(raw);

      let found;
      if (from.includes('{')) {
        const pages = patternPages(from);
        if (!pages.length) { errors.push(`copy: unknown source pattern — ${file} -> ${from}`); continue; }
        found = pages.some((p) => corpus(p).includes(needle));
      } else {
        const haystack = textOf(from);
        if (haystack === null) { errors.push(`copy: unknown source page — ${file} -> ${from}`); continue; }
        found = haystack.includes(needle);
      }

      if (!found) {
        errors.push(`copy: ${file} claims this was published on ${from}, and it was not:\n        "${raw.slice(0, 120)}${raw.length > 120 ? '...' : ''}"`);
      }
      checked += 1;
      perFile.set(file, perFile.get(file) + 1);
    }
  }

  /* No magic total. What matters is that the scan still SEES each file: a renamed helper,
     a moved literal or a refactor to template strings would silently reduce this check to
     nothing, and a validator that passes because it found nothing is worse than none. */
  const blind = [...perFile].filter(([, n]) => n === 0).map(([f]) => f);
  if (blind.length) errors.push(`copy: found no provenanced strings in ${blind.join(', ')} — has the v() helper been renamed or the copy moved?`);
  else ok.push(`copy: ${checked} published strings across ${SOURCES.length} files verified against the archive, word for word`);

  const home = fs.readFileSync(path.join(ROOT, 'src/lib/homepage.ts'), 'utf8');
  if (!home.includes('copyright {year} \u00a9 todos os direitos reservados')) {
    errors.push('copy: the copyright template no longer matches the published wording');
  }
} catch (e) {
  errors.push(`copy: ${e.message}`);
}

/* --------------------------------------------- the services lead, unbroken
   /servicos/ marks three phrases of its lead on a yellow ground, and the page renders
   the lead as segments so it can reproduce that emphasis. The segments must still
   concatenate to the published sentence: an emphasis that quietly became an edit is
   exactly the failure the marking makes easy. */
try {
  const src = fs.readFileSync(path.join(ROOT, 'src/lib/static-pages.ts'), 'utf8');
  const from = src.indexOf('export const SERVICES_LEAD');
  const block = src.slice(from, src.indexOf('];', from));
  const joined = [...block.matchAll(/text:\s*'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1]).join('');

  const home = fs.readFileSync(path.join(ROOT, 'src/lib/homepage.ts'), 'utf8');
  // The FIELD, not the first mention of its name — which is in the comment above it.
  const at = home.indexOf('servicesLeadFull:');
  const open = home.indexOf("'", at);
  const full = home.slice(open + 1, home.indexOf("',", open + 1));

  if (!joined) errors.push('copy: SERVICES_LEAD has no segments');
  else if (joined !== full) {
    errors.push(`copy: the marked services lead no longer matches the published one\n        segments:  ${joined}\n        published: ${full}`);
  } else ok.push('copy: the three marked phrases on /servicos/ still spell the published lead exactly');
} catch (e) {
  errors.push(`copy: services lead: ${e.message}`);
}

/* ------------------------------------------------- services & team entries
   Both lists are published on more than one page — the homepage shows an excerpt of each
   service and /servicos/ shows all four in full; the homepage names the two people and
   /sobre/ gives them portraits and links. They live in content collections so the pages
   cannot disagree, and these are the invariants a missing file would otherwise break
   quietly. The excerpt-is-a-substring rule is enforced by the SCHEMA itself
   (src/content.config.ts), which is stricter than anything this file could do. */
try {
  const services = fs.readdirSync(path.join(ROOT, 'src/content/services')).filter((f) => /\.mdx?$/.test(f));
  if (services.length !== 4) errors.push(`content: expected 4 services, found ${services.length}`);

  const team = fs.readdirSync(path.join(ROOT, 'src/content/team')).filter((f) => /\.mdx?$/.test(f));
  if (team.length !== 2) errors.push(`content: expected 2 team members, found ${team.length}`);

  /* The two people and their roles are canonical and are the sort of thing a well-meaning
     edit "corrects" — `Produ\u00e7\u00e3o &Dire\u00e7\u00e3o Art\u00edstica` is missing a space in the source and stays
     missing it (audit 9.24). Checked here rather than trusted. */
  const ROLES = [
    ['francisco-cardoso', 'Francisco Cardoso', 'Dire\u00e7\u00e3o Criativa & Vide\u00f3grafo'],
    ['helder-afonso', 'Helder Afonso', 'Produ\u00e7\u00e3o &Dire\u00e7\u00e3o Art\u00edstica'],
  ];
  for (const [file, name, role] of ROLES) {
    const src = fs.readFileSync(path.join(ROOT, 'src/content/team', `${file}.md`), 'utf8');
    if (!src.includes(`"${name}"`)) errors.push(`content: ${file}.md no longer names "${name}"`);
    if (!src.includes(role)) errors.push(`content: ${file}.md role differs from the published one — expected "${role}"`);
  }
  if (services.length === 4 && team.length === 2) {
    ok.push('content: 4 services, 2 team members, both roles verbatim as published');
  }
} catch (e) {
  errors.push(`content: ${e.message}`);
}

/* ------------------------------------------------------------------ i18n
   PHASE 11. English is ENABLED, so "half-translated" stopped being a theoretical risk and
   became the thing that would actually ship. The checks below cover the three places a
   translation can live:

     src/i18n/*.ts     UI chrome — must be key-for-key identical in both dictionaries
     src/lib/*.ts      page prose — every v() reachable from an English route needs its
                       third argument
     src/content/**    collection entries — services, categories, people, projects

   The project rule is the interesting one. A film's TITLE is a proper noun and is never
   translated; its PROSE is, unless the entry declares `sourceLocale: en`, which means the
   published Portuguese page already prints English. That declaration is what separates
   "already English" from "nobody translated it yet"; without it this check would either
   demand a translation of English or accept the absence of any. */
try {
  const ptSrc = fs.readFileSync(path.join(ROOT, 'src/i18n/pt.ts'), 'utf8');
  const ptKeys = [...ptSrc.matchAll(/^\s{2}'([^']+)':/gm)].map((m) => m[1]);
  const enSrc = fs.readFileSync(path.join(ROOT, 'src/i18n/en.ts'), 'utf8');
  const enKeys = [...enSrc.matchAll(/^\s{2}'([^']+)':/gm)].map((m) => m[1]);

  const nav = fs.readFileSync(path.join(ROOT, 'src/content/settings/navigation.yml'), 'utf8');
  const navKeys = [...nav.matchAll(/labelKey:\s*(\S+)/g)].map((m) => m[1]);
  const missingNav = navKeys.filter((k) => !ptKeys.includes(k));
  if (missingNav.length) errors.push(`i18n: navigation.yml references unknown key(s): ${missingNav.join(', ')}`);

  // English is enabled, so the dictionary must be COMPLETE, not merely non-empty.
  const untranslated = ptKeys.filter((k) => !enKeys.includes(k));
  const orphaned = enKeys.filter((k) => !ptKeys.includes(k));
  if (untranslated.length) {
    errors.push(`i18n: ${untranslated.length} UI key(s) have no English: ${untranslated.join(', ')}`);
  }
  if (orphaned.length) {
    errors.push(`i18n: en.ts declares key(s) pt.ts does not: ${orphaned.join(', ')}`);
  }
  if (!untranslated.length && !orphaned.length) {
    ok.push(`i18n: ${ptKeys.length} UI keys complete in both locales, ${navKeys.length} nav references resolve`);
  }
} catch (e) {
  errors.push(`i18n: ${e.message}`);
}

/* ----------------------------------------------- page prose, both locales */
try {
  const FILES = [
    'src/lib/homepage.ts', 'src/lib/portfolio.ts',
    'src/lib/static-pages.ts', 'src/lib/page-meta.ts',
  ];
  /* The same shape as the provenance scan above, except this one looks at what comes
     AFTER the source path: a comma means an English translation follows, a closing paren
     means none does. */
  const re = /\bv\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'([^']*)'\s*([,)])/g;

  let translated = 0;
  const missing = [];
  for (const file of FILES) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    let m;
    while ((m = re.exec(src)) !== null) {
      if (m[3] === ',') translated += 1;
      else missing.push(`${file}: "${m[1].slice(0, 60)}"`);
    }
  }
  if (missing.length) {
    errors.push(`i18n: ${missing.length} published string(s) reachable from an English route have no translation:\n        ${missing.join('\n        ')}`);
  } else {
    ok.push(`i18n: ${translated} page strings carry an authored English translation`);
  }
} catch (e) {
  errors.push(`i18n: page prose: ${e.message}`);
}

/* ------------------------------- the marked services lead, in both languages
   The Portuguese check above proves the three highlights still spell the published
   sentence. The English lead has no archive to be checked against, so what is checked is
   the RELATIONSHIP: its segments must still spell its own full string. A highlight that
   quietly became an edit in one language and not the other is exactly what this catches. */
try {
  const sp = fs.readFileSync(path.join(ROOT, 'src/lib/static-pages.ts'), 'utf8');
  const from = sp.indexOf('export const SERVICES_LEAD');
  const block = sp.slice(from, sp.indexOf('];', from));
  const joined = [...block.matchAll(/en:\s*'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1]).join('');

  const home = fs.readFileSync(path.join(ROOT, 'src/lib/homepage.ts'), 'utf8');
  const at = home.indexOf('servicesLeadFull:');
  const call = home.slice(at, home.indexOf('),', at) + 1);
  const args = [...call.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1]);
  const full = args[2];

  if (!joined) errors.push('copy: SERVICES_LEAD has no English segments');
  else if (!full) errors.push('copy: servicesLeadFull has no English translation to check against');
  else if (joined !== full) {
    errors.push(`copy: the English services lead segments do not spell the English lead\n        segments:  ${joined}\n        full:      ${full}`);
  } else {
    ok.push('copy: the three marked phrases spell the published lead in both languages');
  }
} catch (e) {
  errors.push(`copy: english services lead: ${e.message}`);
}

/* ------------------------------------------- content entries, both locales */
try {
  /* A localised field is `field:` on its own line followed by indented `pt:` / `en:`
     children, possibly with comments between them. This reads that shape rather than
     parsing YAML, for the same reason every other check here does: the point is to fail
     on a missing translation, not to reimplement a parser. */
  const declares = (src, field) => new RegExp(`^${field}:\\s*$`, 'm').test(src);
  const hasEnglish = (src, field) => {
    const start = new RegExp(`^${field}:\\s*$`, 'm').exec(src);
    if (!start) return false;
    const after = src.slice(start.index + start[0].length + 1);
    const lines = after.split('\n');
    for (const line of lines) {
      // The block ends at the first line that is not indented and not blank.
      if (line.trim() !== '' && !/^\s/.test(line)) break;
      if (/^\s+en:/.test(line)) return true;
    }
    return false;
  };

  const scan = (dir, ext, fields) => {
    const results = [];
    for (const file of fs.readdirSync(path.join(ROOT, dir)).filter((f) => ext.test(f))) {
      const src = fs.readFileSync(path.join(ROOT, dir, file), 'utf8');
      for (const field of fields) {
        if (declares(src, field) && !hasEnglish(src, field)) results.push(`${dir}/${file}: ${field}`);
      }
    }
    return results;
  };

  const gaps = [
    ...scan('src/content/services', /\.mdx?$/, ['title', 'description', 'excerpt']),
    ...scan('src/content/categories', /\.ya?ml$/, ['name']),
    ...scan('src/content/team', /\.mdx?$/, ['role']),
  ];
  if (gaps.length) {
    errors.push(`i18n: content entries with no English:\n        ${gaps.join('\n        ')}`);
  } else {
    ok.push('i18n: services, categories and team roles are translated');
  }

  /* Projects. Titles are proper nouns and are exempt by rule (src/content.config.ts);
     prose is not, unless the entry declares its published prose is already English. */
  const projectDir = path.join(ROOT, 'src/content/projects');
  const projectGaps = [];
  let alreadyEnglish = 0;
  for (const file of fs.readdirSync(projectDir).filter((f) => /\.mdx?$/.test(f))) {
    const src = fs.readFileSync(path.join(projectDir, file), 'utf8');
    const front = src.slice(0, src.indexOf('\n---', 4));
    if (/^sourceLocale:\s*en\s*$/m.test(front)) { alreadyEnglish += 1; continue; }
    if (declares(front, 'tagline') && !hasEnglish(front, 'tagline')) {
      projectGaps.push(`${file}: tagline`);
    }
    /* Prose inside a block: `body:` or `text:` at block-child indentation. Each needs an
       `en:` beneath it, and comparing the two counts catches a missing one without
       walking the whole structure. */
    const prose = [...front.matchAll(/^\s{4}(?:body|text):\s*$/gm)].length;
    const proseEnglish = [...front.matchAll(/^\s{6}en:/gm)].length;
    if (prose > proseEnglish) projectGaps.push(`${file}: ${prose - proseEnglish} block(s) of prose`);
  }
  if (projectGaps.length) {
    errors.push(`i18n: projects with untranslated Portuguese prose (declare sourceLocale: en if it is already English):\n        ${projectGaps.join('\n        ')}`);
  } else {
    ok.push(`i18n: projects translated — ${alreadyEnglish}/20 publish English prose already`);
  }
} catch (e) {
  errors.push(`i18n: content entries: ${e.message}`);
}

/* ------------------------------------------------------- archive present */
for (const f of ['docs/source-archive/pages.json', 'docs/source-archive/media-archive.json', 'docs/source-archive/endpoints.json']) {
  if (!exists(f)) errors.push(`archive: ${f} missing — run npm run archive:source`);
}
try {
  const a = read('docs/source-archive/archive-summary.json');
  if (a.pages.failed > 0) errors.push(`archive: ${a.pages.failed} page(s) failed to capture`);
  if (a.media !== 'skipped' && a.media.failed > 0) errors.push(`archive: ${a.media.failed} media file(s) failed`);
  ok.push(`archive: ${a.pages.ok}/${a.pages.requested} pages, ${a.media === 'skipped' ? 'media skipped' : `${a.media.downloaded} media files (${a.media.totalMB} MB)`}`);
} catch (e) {
  errors.push(`archive: ${e.message}`);
}

/* ------------------------------------------------ git hygiene (hard rule) */
try {
  const staged = execFileSync('git', ['add', '-A', '--dry-run'], { cwd: ROOT, encoding: 'utf8' });
  const bad = staged.split('\n')
    .map((l) => l.replace(/^add\s+'?|'?$/g, '').trim())
    .filter(Boolean)
    .filter((f) => /\.(mp4|mov|webm|avi|mkv|psd)$/i.test(f)
      || f.startsWith('source-archive/')
      || f.startsWith('docs/Smash/')
      || /^\.env$|\/\.env$/.test(f)
      || /\.(pem|key|p12)$/i.test(f));
  if (bad.length) errors.push(`git: these would be committed and must not be:\n    ${bad.slice(0, 20).join('\n    ')}`);
  else ok.push('git: no media binaries, archive files or secrets would be committed');
} catch {
  warnings.push('git: could not run the staging check (not a git repo?)');
}

/* ---------------------------------------------------------------- report */
for (const o of ok) console.log(`  ok    ${o}`);
for (const w of warnings) console.log(`  warn  ${w}`);
for (const e of errors) console.error(`  FAIL  ${e}`);

console.log(`\n${ok.length} ok, ${warnings.length} warnings, ${errors.length} errors`);
process.exit(errors.length ? 1 : 0);
