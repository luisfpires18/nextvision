/**
 * test:admin — the admin's save path, proved against a fake GitHub.
 *
 * Two halves:
 *   - the edit rules (src/lib/admin/edit.ts): only offered fields, never locked ones, both
 *     languages, `owner:` provenance only when the Portuguese changes, no-op saves;
 *   - the GitHub client (src/lib/admin/github.ts): the App's JWT is really signed with
 *     its key, reads, one-commit saves, refusal when the file or the branch moved, and
 *     the build state of the save.
 *
 * No network, no account, no secret: the App key is generated here and thrown away.
 * Usage: npm run test:admin
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { generateKeyPairSync } from 'node:crypto';
import { SCREENS, pageFilePath } from '../src/lib/admin/fields.ts';
import { applyEdits, expandFields, fieldName, liveValue, serialise, EditError } from '../src/lib/admin/edit.ts';
import { readFile, commitFiles, latestRun, gitBlobSha, resetGitHubToken, GitHubError } from '../src/lib/admin/github.ts';
import { planUpload, appendUpload, safeName, kindOf, uploadKey, isUploadKey, UPLOADS_PATH } from '../src/lib/admin/uploads.ts';
import { applyProjectEdits, applyOrder, newProjectText, removalWrites, projectFilePath, REMOVED_PATH, portfolioSequence, projectData, projectValue, fieldsFor, roundTrips, slugFrom, youtubeId } from '../src/lib/admin/projects.ts';
import { ENTRY_TYPES, applyEntryEdits, entryData, entryFields, entryRoundTrips, entryRemovalWrites, newEntryFile } from '../src/lib/admin/entries.ts';
import { createMockGitHub, gitBlobSha as nodeBlobSha } from './lib/mock-github.mjs';

let failed = 0;
let passed = 0;
async function check(name, fn) {
  try { await fn(); passed += 1; console.log(`  ok    ${name}`); }
  catch (e) { failed += 1; console.log(`  FAIL  ${name}: ${e.message}`); }
}

const read = (f) => JSON.parse(fs.readFileSync(`src/content/page-content/${f}.json`, 'utf8'));
const docsFor = (screen) => Object.fromEntries([...new Set(SCREENS[screen].map((d) => d.file))].map((f) => [f, read(f)]));
const TODAY = '2026-10-22';

/* ── edit rules ─────────────────────────────────────────────────────────── */

{
  const docs = docsFor('home');
  const fields = expandFields(SCREENS.home, docs);
  const hero = fields.find((f) => f.key === 'copy.workBody'); // a published, archived string
  const copyright = fields.find((f) => f.key === 'copy.copyright');
  const video = fields.find((f) => f.key === 'heroVideo');

  await check('a changed Portuguese text becomes owner copy, dated', () => {
    const { docs: next, changed } = applyEdits(fields, docs, { [fieldName(hero, 'pt')]: 'Captamos o mundo' }, TODAY);
    assert.deepEqual(next.home.copy.workBody, { text: 'Captamos o mundo', from: `owner:${TODAY}`, en: docs.home.copy.workBody.en });
    assert.deepEqual(changed, [{ file: 'home', label: hero.label }]);
    assert.equal(docs.home.copy.workBody.from, '/', 'the original is not mutated');
  });
  await check('an English-only change keeps the archived source', () => {
    const { docs: next } = applyEdits(fields, docs, { [fieldName(hero, 'en')]: 'We capture emotions' }, TODAY);
    assert.equal(next.home.copy.workBody.from, '/');
    assert.equal(next.home.copy.workBody.en, 'We capture emotions');
  });
  await check('an empty Portuguese text is refused', () => {
    assert.throws(() => applyEdits(fields, docs, { [fieldName(hero, 'pt')]: '   ' }, TODAY), EditError);
  });
  await check('an empty English text is refused (no half-translated page)', () => {
    assert.throws(() => applyEdits(fields, docs, { [fieldName(hero, 'en')]: '' }, TODAY), /inglês/);
  });
  await check('a locked field is refused, not ignored', () => {
    assert.throws(() => applyEdits(fields, docs, { [fieldName(copyright, 'pt')]: 'x' }, TODAY), /não pode ser alterado/);
  });
  await check('a field the screen does not offer is refused', () => {
    assert.throws(() => applyEdits(fields, docs, { 'home:copy.workBodyB#pt': 'x' }, TODAY), /desconhecido/);
    assert.throws(() => applyEdits(fields, docs, { 'home:wordpressExcerpt': 'x' }, TODAY), /desconhecido/);
  });
  await check('the same value is no change', () => {
    const { changed } = applyEdits(fields, docs, { [fieldName(hero, 'pt')]: docs.home.copy.workBody.text, [fieldName(video)]: docs.home.heroVideo }, TODAY);
    assert.equal(changed.length, 0);
  });
  await check('a media field takes a key', () => {
    const { docs: next } = applyEdits(fields, docs, { [fieldName(video)]: 'projects/leonor/hero' }, TODAY);
    assert.equal(next.home.heroVideo, 'projects/leonor/hero');
  });
  await check('Windows line endings are stored as \\n', () => {
    const { docs: next } = applyEdits(fields, docs, { [fieldName(hero, 'pt')]: 'a\r\nb' }, TODAY);
    assert.equal(next.home.copy.workBody.text, 'a\nb');
  });
  await check('serialise matches the files on disk byte for byte', () => {
    assert.equal(serialise(read('home')), fs.readFileSync('src/content/page-content/home.json', 'utf8'));
  });
}

await check('per-field freshness reads the live value each draft name points at', () => {
  const docs = { home: read('home'), services: read('services') };
  assert.equal(liveValue(docs, 'home:copy.workBody#pt'), docs.home.copy.workBody.text);
  assert.equal(liveValue(docs, 'home:copy.workBody#en'), docs.home.copy.workBody.en);
  assert.equal(liveValue(docs, 'home:heroVideo'), docs.home.heroVideo);
  assert.equal(liveValue(docs, 'services:leadImage'), docs.services.leadImage);
  assert.equal(liveValue(docs, 'home:nope#pt'), undefined, 'an unknown field is never "fresh"');
});
await check('drafts from several pages and files apply in one go', () => {
  const docs = { home: read('home'), about: read('about'), services: read('services') };
  const other = read('contact').banner;
  const fields = [...expandFields(SCREENS.home, docs), ...expandFields(SCREENS.about, docs), ...expandFields(SCREENS.services, docs)];
  const { docs: next, changed } = applyEdits(fields, docs, {
    'home:copy.workBody#en': 'We capture feeling',
    'about:copy.storyB#en': 'x',
    'services:leadImage': other,
  }, TODAY);
  assert.deepEqual([...new Set(changed.map((c) => c.file))].sort(), ['about', 'home', 'services']);
  assert.equal(next.services.leadImage, other);
});

await check('the site texts: a line, and a name in both languages', () => {
  const docs = { brand: read('brand') };
  const fields = expandFields(SCREENS.brand, docs);
  const tagline = fields.find((f) => f.key === 'tagline');
  const bts = fields.find((f) => f.key === 'menu.bts');
  const { docs: next, changed } = applyEdits(fields, docs, {
    [fieldName(tagline)]: '  Loving every frame, always ',
    [fieldName(bts, 'pt')]: 'Bastidores',
  }, TODAY);
  assert.equal(next.brand.tagline, 'Loving every frame, always');
  assert.deepEqual(next.brand.menu.bts, { pt: 'Bastidores', en: docs.brand.menu.bts.en });
  assert.equal(changed.length, 2);
  assert.throws(() => applyEdits(fields, docs, { [fieldName(bts, 'en')]: '' }, TODAY), /inglês/);
  assert.equal(liveValue(docs, 'brand:menu.bts#pt'), docs.brand.menu.bts.pt);
  assert.equal(applyEdits(fields, docs, { [fieldName(bts, 'pt')]: docs.brand.menu.bts.pt }, TODAY).changed.length, 0);
});

await check('the services lists: add, remove, reorder, and each item checked', () => {
  const docs = { services: read('services') };
  const fields = expandFields(SCREENS.services.filter((d) => d.file === 'services'), docs);
  const films = fields.find((f) => f.key === 'films');
  const collage = fields.find((f) => f.key === 'collage');
  const cats = fields.find((f) => f.key === 'categories');
  const id = 'dQw4w9WgXcQ';
  const poster = docs.services.collage[0];
  // Two films, the second given as an address: stored as ids, names trimmed.
  const two = JSON.stringify([...docs.services.films, { id: `https://youtu.be/${id}?t=3`, title: '  Outro  ', poster }]);
  const { docs: next, changed } = applyEdits(fields, docs, { [fieldName(films)]: two }, TODAY);
  assert.equal(next.services.films.length, docs.services.films.length + 1);
  assert.deepEqual(next.services.films.at(-1), { id, title: 'Outro', poster });
  assert.equal(changed.length, 1);
  // None at all is allowed; a bad address, a missing name or cover is not.
  assert.equal(applyEdits(fields, docs, { [fieldName(films)]: '[]' }, TODAY).docs.services.films.length, 0);
  assert.throws(() => applyEdits(fields, docs, { [fieldName(films)]: JSON.stringify([{ id: 'https://vimeo.com/1', title: 'x', poster }]) }, TODAY), /não reconheço/);
  assert.throws(() => applyEdits(fields, docs, { [fieldName(films)]: JSON.stringify([{ id, title: ' ', poster }]) }, TODAY), /falta o nome/);
  assert.throws(() => applyEdits(fields, docs, { [fieldName(films)]: JSON.stringify([{ id, title: 'x', poster: '' }]) }, TODAY), /capa/);
  assert.throws(() => applyEdits(fields, docs, { [fieldName(films)]: 'nada' }, TODAY), /inválido/);
  // The same list again is no change; liveValue is the form's own compact JSON.
  assert.equal(applyEdits(fields, docs, { [fieldName(films)]: JSON.stringify(docs.services.films) }, TODAY).changed.length, 0);
  assert.equal(liveValue(docs, fieldName(collage)), JSON.stringify(docs.services.collage));
  // Images: reorder and remove; an empty row is refused.
  const reversed = [...docs.services.collage].reverse().slice(0, 2);
  assert.deepEqual(applyEdits(fields, docs, { [fieldName(collage)]: JSON.stringify(reversed) }, TODAY).docs.services.collage, reversed);
  assert.throws(() => applyEdits(fields, docs, { [fieldName(collage)]: JSON.stringify(['']) }, TODAY), /escolha uma imagem/);
  // A frame that plays a film: the address becomes an id, an empty address is a plain image
  // again, a bad one is refused. (The page schema itself is exercised by the build.)
  const withFilm = JSON.stringify([poster, { image: poster, film: `https://youtu.be/${id}?t=3`, title: '  Showreel  ' }, { image: poster, film: '  ' }]);
  const framed = applyEdits(fields, docs, { [fieldName(collage)]: withFilm }, TODAY).docs.services;
  assert.deepEqual(framed.collage, [poster, { image: poster, film: id, title: 'Showreel' }, poster]);
  assert.deepEqual(applyEdits(fields, docs, { [fieldName(collage)]: JSON.stringify([{ image: poster, film: id }]) }, TODAY).docs.services.collage, [{ image: poster, film: id }]);
  assert.throws(() => applyEdits(fields, docs, { [fieldName(collage)]: JSON.stringify([{ image: poster, film: 'https://vimeo.com/1' }]) }, TODAY), /não reconheço/);
  assert.throws(() => applyEdits(fields, docs, { [fieldName(collage)]: JSON.stringify([{ image: '', film: id }]) }, TODAY), /escolha uma imagem/);
  // Categories: a set of slugs.
  assert.deepEqual(applyEdits(fields, docs, { [fieldName(cats)]: '["ficcao","ficcao"]' }, TODAY).docs.services.categories, ['ficcao']);
  assert.throws(() => applyEdits(fields, docs, { [fieldName(cats)]: '["../x"]' }, TODAY), /inválido/);
  // An upload slot is never a draft.
  const slot = fields.find((f) => f.key === 'collage.+');
  assert.ok(slot?.uploadOnly);
  assert.throws(() => applyEdits(fields, docs, { [fieldName(slot)]: poster }, TODAY), /desconhecido/);
});

await check('an upload can add a carousel image or replace a film cover, and nothing else on the list', () => {
  const docs = { services: read('services') };
  const fields = expandFields(SCREENS.services, { ...docs, home: read('home') });
  const req = (target) => ({ screen: 'services', target, source: 'uploads/2026-11-07/abcdefgh12/a.jpg', name: 'a.jpg' });
  assert.equal(planUpload(fields, req('services:collage.+'), 'abcdefgh12', 'x', 'y').target.path, 'collage.+');
  assert.equal(planUpload(fields, req('services:films.0.poster'), 'abcdefgh12', 'x', 'y').target.path, 'films.0.poster');
  assert.throws(() => planUpload(fields, req('services:collage'), 'abcdefgh12', 'x', 'y'), /não aceita/);
});

await check('every offered field exists in its file', () => {
  for (const [screen, defs] of Object.entries(SCREENS)) {
    const docs = docsFor(screen);
    for (const f of expandFields(defs, docs)) {
      if (f.key.endsWith('.+')) continue; // one past the end of a list, by definition empty
      const v = f.key.split('.').reduce((n, p) => n?.[p], docs[f.file]);
      assert.ok(v !== undefined, `${screen}: ${f.file}:${f.key}`);
    }
  }
});

/* ── projects (MDX front matter) ────────────────────────────────────────── */

{
  // Frozen copies (scripts/fixtures/projects): the owners delete real projects from the admin,
  // and a test that names one breaks every later deploy. The real files are only checked for
  // round-tripping, below.
  const dir = 'scripts/fixtures/projects';
  const leonor = fs.readFileSync(`${dir}/leonor.mdx`, 'utf8');
  const ctx = {
    categories: new Set(fs.readdirSync('src/content/categories').map((f) => f.replace(/\.yml$/, ''))),
    mediaKind: (k) => (k.endsWith('/hero') ? 'video' : k.startsWith('projects/') ? 'image' : null),
  };
  const differing = (a, b) => { const y = b.split('\n'); return a.split('\n').filter((l, i) => l !== y[i]).length; };

  await check('every project file survives a read and a write byte for byte', () => {
    const bad = fs.readdirSync('src/content/projects').filter((f) => !roundTrips(fs.readFileSync(`src/content/projects/${f}`, 'utf8')));
    assert.deepEqual(bad, []);
  });
  await check('a project video can be marked the full film, and trailer is the default', () => {
    const { text } = applyProjectEdits(leonor, { filmKind: 'film' }, ctx);
    assert.equal(projectData(text).filmKind, 'film');
    assert.equal(projectData(applyProjectEdits(text, { filmKind: 'trailer' }, ctx).text).filmKind, undefined);
    assert.throws(() => applyProjectEdits(leonor, { filmKind: 'nope' }, ctx), /O vídeo é/);
    assert.equal(applyProjectEdits(leonor, { filmKind: 'trailer' }, ctx).changed.length, 0);
  });
  await check('IMDb and trailer links are optional, take an address, and refuse anything else', () => {
    const { text } = applyProjectEdits(leonor, { imdb: 'www.imdb.com/title/tt0000001/', trailer: 'https://youtu.be/dQw4w9WgXcQ' }, ctx);
    assert.equal(projectData(text).imdb, 'https://www.imdb.com/title/tt0000001/');
    assert.equal(projectData(text).trailer, 'dQw4w9WgXcQ');
    assert.throws(() => applyProjectEdits(leonor, { imdb: 'https://example.com/x' }, ctx), /IMDb/);
    assert.throws(() => applyProjectEdits(leonor, { trailer: 'nope' }, ctx), /Trailer/);
    const cleared = projectData(applyProjectEdits(text, { imdb: '', trailer: '' }, ctx).text);
    assert.equal(cleared.imdb, undefined);
    assert.equal(cleared.trailer, undefined);
  });
  await check('a title change touches only that line, keeping its quotes and every comment', () => {
    const { text, changed } = applyProjectEdits(leonor, { 'title.pt': 'Words' }, ctx);
    assert.deepEqual(changed, ['Título']);
    assert.equal(differing(leonor, text), 1);
    assert.match(text, /\n {2}pt: "Words"\n/);
  });
  await check('a tagline keeps its block style; English is optional only for English prose', () => {
    const { text } = applyProjectEdits(leonor, { 'tagline#pt': 'Uma\nDuas' }, ctx);
    assert.match(text, /tagline:\n {2}pt: \|-\n {4}Uma\n {4}Duas\n/);
    const pt = leonor.replace(/^sourceLocale: en$/m, 'sourceLocale: pt');
    assert.throws(() => applyProjectEdits(pt, { 'tagline#pt': 'Uma' }, ctx), /inglês/);
  });
  await check('a YouTube address becomes its id; anything else is refused', () => {
    assert.equal(youtubeId('https://www.youtube.com/watch?v=0C-yySHAzCI&t=3'), '0C-yySHAzCI');
    assert.equal(youtubeId('https://youtu.be/0C-yySHAzCI'), '0C-yySHAzCI');
    const { text } = applyProjectEdits(leonor, { 'film.id': 'https://youtu.be/AAAAAAAAAAA' }, ctx);
    assert.equal(projectValue(projectData(text), 'film.id'), 'AAAAAAAAAAA');
    assert.throws(() => applyProjectEdits(leonor, { 'film.id': 'https://vimeo.com/1' }, ctx), /YouTube/);
  });
  await check('year, category and visibility are checked and stored as their types', () => {
    const data = projectData(applyProjectEdits(leonor, { year: '2024', categories: 'ficcao', draft: 'true' }, ctx).text);
    assert.equal(data.year, 2024);
    assert.deepEqual(data.categories, ['ficcao']);
    assert.equal(data.draft, true);
    assert.throws(() => applyProjectEdits(leonor, { year: '24' }, ctx), /Ano/);
    assert.throws(() => applyProjectEdits(leonor, { categories: 'nada' }, ctx), /Categoria/);
  });
  await check('a new opening video brings its own poster as the still', () => {
    const data = projectData(applyProjectEdits(leonor, { heroVideo: 'projects/the-end/hero' }, ctx).text);
    assert.equal(data.heroStill.key, 'projects/the-end/hero/poster');
    assert.throws(() => applyProjectEdits(leonor, { heroVideo: 'projects/the-end/poster' }, ctx), /vídeo/);
    assert.throws(() => applyProjectEdits(leonor, { 'poster.key': 'projects/the-end/hero' }, ctx), /imagem/);
  });
  await check('an opening video can be taken off, its own still with it; the cover cannot', () => {
    const { text, changed } = applyProjectEdits(leonor, { heroVideo: '' }, ctx);
    const data = projectData(text);
    assert.deepEqual(changed, ['Vídeo de abertura']);
    assert.equal(data.heroVideo, undefined);
    assert.equal(data.heroStill, undefined);
    assert.equal(data.poster.key, projectData(leonor).poster.key, 'the cover stays');
    assert.ok(roundTrips(text));
    assert.throws(() => applyProjectEdits(leonor, { 'poster.key': '' }, ctx), /imagem/);
    const noFilm = leonor.replace(/^film:\n(?: {2}.*\n)+/m, '').replace(/^previewVideo: .*\n/m, '');
    assert.equal(projectData(noFilm).film, undefined);
    assert.throws(() => applyProjectEdits(noFilm, { heroVideo: '' }, ctx), /não pode sair/);
  });
  await check('unknown or unoffered fields are refused; no change writes nothing', () => {
    assert.throws(() => applyProjectEdits(leonor, { date: '2020-01-01' }, ctx), /desconhecido/);
    assert.throws(() => applyProjectEdits(leonor, { 'title.pt#en': 'x' }, ctx), /desconhecido/);
    const same = applyProjectEdits(leonor, { year: '2025' }, ctx);
    assert.equal(same.text, leonor);
    assert.deepEqual(same.changed, []);
  });
  const all = fs.readdirSync(dir).map((f) => ({ slug: f.replace(/\.mdx$/, ''), text: fs.readFileSync(`${dir}/${f}`, 'utf8') }));
  await check('the portfolio order reads as the site sorts it', () => {
    const seq = portfolioSequence(all);
    assert.equal(seq.length, all.length);
    assert.ok(seq.indexOf('helder-praia') < seq.indexOf('leonor'), 'portfolioOrder 1 before 2');
  });
  await check('a new order renumbers only the projects that move, one line each', () => {
    const seq = portfolioSequence(all);
    // From a list numbered 1…n (a project new from the admin starts before 1).
    const numbered = applyOrder(all, seq.join(','));
    const base = all.map((a) => numbered.find((m) => m.slug === a.slug) ?? a);
    assert.deepEqual(applyOrder(base, seq.join(',')), []);
    const swapped = [seq[1], seq[0], ...seq.slice(2)];
    const moved = applyOrder(base, swapped.join(','));
    assert.deepEqual(moved.map((m) => m.slug).sort(), [seq[0], seq[1]].sort());
    for (const m of moved) assert.equal(differing(base.find((a) => a.slug === m.slug).text, m.text), 1);
    assert.deepEqual(portfolioSequence(base.map((a) => moved.find((m) => m.slug === a.slug) ?? a)), swapped);
  });
  await check('an order that misses, repeats or invents a project is refused', () => {
    const seq = portfolioSequence(all);
    assert.throws(() => applyOrder(all, seq.slice(1).join(',')), /ordem/);
    assert.throws(() => applyOrder(all, [seq[0], ...seq.slice(0, -1)].join(',')), /ordem/);
    assert.throws(() => applyOrder(all, [...seq.slice(1), 'nao-existe'].join(',')), /ordem/);
  });
  const fresh = { title: 'Dormência 48h', sourceLocale: 'pt', taglinePt: 'Uma frase', taglineEn: 'One line', year: '2026', category: 'ficcao', film: 'https://youtu.be/0C-yySHAzCI', hidden: false };
  await check('a new project is a complete file, first in the portfolio, with its cover', () => {
    assert.equal(slugFrom(fresh.title), 'dormencia-48h');
    const text = newProjectText(fresh, 'owner/abc12345/image', 0, '2026-10-22', ctx);
    assert.ok(roundTrips(text));
    const d = projectData(text);
    assert.deepEqual(
      [d.title, d.tagline, d.year, d.categories, d.film.id, d.poster.key, d.portfolioOrder, d.draft, d.date],
      [{ pt: 'Dormência 48h' }, { pt: 'Uma frase', en: 'One line' }, 2026, ['ficcao'], '0C-yySHAzCI', 'owner/abc12345/image', 0, false, '2026-10-22'],
    );
  });
  await check('a new project is refused without a film, a title, or its English', () => {
    assert.throws(() => newProjectText({ ...fresh, film: 'nada' }, 'k', 0, '2026-10-22', ctx), /YouTube/);
    assert.throws(() => newProjectText({ ...fresh, title: '  ' }, 'k', 0, '2026-10-22', ctx), /Título/);
    assert.throws(() => newProjectText({ ...fresh, taglineEn: '' }, 'k', 0, '2026-10-22', ctx), /inglês/);
    assert.ok(newProjectText({ ...fresh, taglineEn: '', sourceLocale: 'en' }, 'k', 0, '2026-10-22', ctx));
  });
  await check('an upload for a project field names the project, and only its media fields take one', () => {
    const fields = [{ file: 'projeto/leonor', key: 'poster.key', kind: 'image', label: 'Projeto «Words» — Capa' }];
    const entry = planUpload(fields, { screen: 'projeto', target: 'projeto/leonor:poster.key', source: 'uploads/2026-10-22/abcdefgh12/capa.jpg', name: 'capa.jpg' }, 'abcdefgh12', 'x', '2026-10-22T10:00:00Z');
    assert.deepEqual(entry.target, { screen: 'projeto', file: 'projeto/leonor', path: 'poster.key', label: 'Projeto «Words» — Capa' });
    assert.equal(entry.key, 'owner/abcdefgh12/image');
    assert.throws(() => planUpload(fields, { screen: 'projeto', target: 'projeto/leonor:title.pt', source: 'uploads/2026-10-22/abcdefgh12/capa.jpg', name: 'capa.jpg' }, 'abcdefgh12', 'x', 'y'), /não aceita/);
  });
  const view = (text) => JSON.parse(projectValue(projectData(text), 'blocks'));
  await check('blocks: the view lists every block, and an unchanged view writes nothing', () => {
    const v = view(leonor);
    assert.deepEqual(v.map((b) => b.type), ['text', 'image-pair', 'image-grid', 'full-width-image']);
    assert.deepEqual(applyProjectEdits(leonor, { blocks: JSON.stringify(v) }, ctx).changed, []);
  });
  await check('blocks: a moved block keeps its comments and its images keep their alt state', () => {
    const v = view(leonor);
    const { text, changed } = applyProjectEdits(leonor, { blocks: JSON.stringify([v[1], v[0], v[2], v[3]]) }, ctx);
    assert.deepEqual(changed, ['Blocos da página']);
    assert.deepEqual(view(text).map((b) => b.type), ['image-pair', 'text', 'image-grid', 'full-width-image']);
    assert.match(text, /# Six frames of the film, in the order they occur in it/);
    assert.equal(projectData(text).blocks[0].media[0].altStatus, 'todo');
    assert.doesNotMatch(text, /^[ \t]+$/m, 'no whitespace-only lines');
  });
  await check('blocks: add a gallery and a YouTube film, remove a block', () => {
    const v = view(leonor);
    const next = [...v.slice(1), { type: 'image-grid', media: ['projects/leonor/still-01', 'projects/leonor/still-02'], mode: 'stack' },
      { type: 'embedded-film', film: 'https://youtu.be/0C-yySHAzCI', poster: 'projects/leonor/poster' }];
    const d = projectData(applyProjectEdits(leonor, { blocks: JSON.stringify(next) }, ctx).text);
    assert.equal(d.blocks.length, 5);
    assert.deepEqual(d.blocks[3], { type: 'image-grid', mode: 'stack', media: [{ key: 'projects/leonor/still-01', altStatus: 'todo' }, { key: 'projects/leonor/still-02', altStatus: 'todo' }] });
    assert.deepEqual(d.blocks[4].film, { provider: 'youtube', id: '0C-yySHAzCI' });
  });
  await check('blocks: refused when a gallery is too small, a film has no link, an image is a video, or English is missing', () => {
    const one = (b) => () => applyProjectEdits(leonor, { blocks: JSON.stringify([b]) }, ctx);
    assert.throws(one({ type: 'image-grid', media: ['projects/leonor/still-01'], mode: 'strip' }), /entre 2 e 12/);
    assert.throws(one({ type: 'embedded-film', film: '', poster: 'projects/leonor/poster' }), /YouTube/);
    assert.throws(one({ type: 'full-width-image', media: ['projects/the-end/hero'] }), /imagens da lista/);
    assert.throws(one({ type: 'text', pt: '', en: '', width: 'narrow' }), /vazio/);
    const pt = leonor.replace(/^sourceLocale: en$/m, 'sourceLocale: pt');
    assert.throws(() => applyProjectEdits(pt, { blocks: JSON.stringify([{ type: 'text', pt: 'Olá', en: '', width: 'narrow' }]) }, ctx), /inglês/);
    assert.throws(() => applyProjectEdits(leonor, { blocks: '[{"type":"fixed","kind":"quote","ref":0}]' }, ctx), /mudaram/);
  });
  await check('blocks: a page can be left with none', () => {
    const text = applyProjectEdits(leonor, { blocks: '[]' }, ctx).text;
    assert.deepEqual(projectData(text).blocks, []);
    assert.ok(roundTrips(text));
  });
  await check('the film field is offered only for a YouTube film', () => {
    assert.ok(fieldsFor({ film: { provider: 'youtube' } }).some((f) => f.kind === 'film'));
    assert.ok(!fieldsFor({}).some((f) => f.kind === 'film'));
  });
}

/* ── services, team, categories, contacts ───────────────────────────────── */

{
  const ectx = { mediaKind: (k) => (k.startsWith('team/') || k.startsWith('projects/') ? 'image' : null) };
  const files = (t) => fs.readdirSync(t.dir).filter((f) => t.prefix !== 'definicoes' || f === 'site.yml');
  const read = (t, f) => fs.readFileSync(`${t.dir}/${f}`, 'utf8');
  const differing = (a, b) => { const y = b.split('\n'); return a.split('\n').filter((l, i) => l !== y[i]).length; };

  await check('every service, team, category and settings file round-trips byte for byte', () => {
    const bad = Object.values(ENTRY_TYPES).flatMap((t) => files(t).filter((f) => !entryRoundTrips(t, read(t, f))).map((f) => `${t.prefix}/${f}`));
    assert.deepEqual(bad, []);
  });
  await check('a service text changes only its own lines, both languages required', () => {
    const t = ENTRY_TYPES.servico;
    const text = read(t, 'producao-de-video.md');
    const { text: next, changed } = applyEntryEdits(t, text, { 'title#pt': 'Vídeo', 'title#en': 'Video' }, ectx);
    assert.deepEqual(changed, ['Nome']);
    assert.equal(differing(text, next), 2);
    assert.throws(() => applyEntryEdits(t, text, { 'title#en': '' }, ectx), /inglês/);
  });
  await check('a service excerpt must stay a selection from its description (decision A44)', () => {
    const t = ENTRY_TYPES.servico;
    const text = read(t, 'producao-de-video.md');
    assert.throws(() => applyEntryEdits(t, text, { 'description#pt': 'Outra descrição.' }, ectx), /dentro da descrição/);
    const d = entryData(t, text);
    const both = applyEntryEdits(t, text, { 'description#pt': `${d.description.pt} Mais.`, 'excerpt#pt': 'Mais.' }, ectx);
    assert.equal(entryData(t, both.text).excerpt.pt, 'Mais.');
  });
  await check('contacts: phones and networks are lists to add to and remove from; each row is checked', () => {
    const t = ENTRY_TYPES.definicoes;
    const text = read(t, 'site.yml');
    const d = entryData(t, text);
    const fields = entryFields(t, d).map((f) => f.path);
    assert.ok(fields.includes('phones') && fields.includes('socials'));
    // Change the first number, drop the second, add a third: one list, in the order given.
    const phones = [{ label: 'Principal', number: '+351 912 345 678' }, { label: 'Estúdio', number: '+351 210 000 000' }];
    const { text: next } = applyEntryEdits(t, text, { phones: JSON.stringify(phones) }, ectx);
    assert.deepEqual(entryData(t, next).phones, [{ label: 'Principal', number: '+351912345678' }, { label: 'Estúdio', number: '+351210000000' }]);
    assert.deepEqual(entryData(t, next).socials, d.socials, 'the other list is untouched');
    assert.throws(() => applyEntryEdits(t, text, { phones: JSON.stringify([{ label: 'x', number: 'ligue-me' }]) }, ectx), /algarismos/);
    assert.throws(() => applyEntryEdits(t, text, { phones: JSON.stringify([{ label: '', number: '+351912345678' }]) }, ectx), /falta o nome/);
    assert.throws(() => applyEntryEdits(t, text, { socials: JSON.stringify([{ platform: 'youtube', label: 'YouTube', url: 'youtube.com/x' }]) }, ectx), /https/);
    assert.throws(() => applyEntryEdits(t, text, { socials: JSON.stringify([{ platform: 'myspace', label: 'x', url: 'https://x.pt/' }]) }, ectx), /rede da lista/);
    assert.equal(applyEntryEdits(t, text, { socials: JSON.stringify(d.socials) }, ectx).changed.length, 0, 'the same list is no change');
    assert.equal(entryData(t, applyEntryEdits(t, text, { socials: '[]' }, ectx).text).socials.length, 0);
    assert.throws(() => applyEntryEdits(t, text, { email: 'a@b.pt' }, ectx), /não pode ser alterado/);
  });
  await check('an entry the owners change is dated as theirs (decision A2)', () => {
    const t = ENTRY_TYPES.equipa;
    const { text } = applyEntryEdits(t, read(t, 'helder-afonso.md'), { 'role#pt': 'Produção & Direção Artística' }, { ...ectx, today: '2026-10-22' });
    assert.match(text, /^ownerEdited: 2026-10-22$/m);
    const s = ENTRY_TYPES.definicoes;
    assert.equal(entryData(s, applyEntryEdits(s, read(s, 'site.yml'), { phones: JSON.stringify([{ label: 'Principal', number: '+351911111111' }]) }, { ...ectx, today: '2026-10-22' }).text).ownerEdited, '2026-10-22');
  });
  await check('a team portrait takes an image; unknown fields are refused', () => {
    const t = ENTRY_TYPES.equipa;
    const text = read(t, 'helder-afonso.md');
    assert.throws(() => applyEntryEdits(t, text, { 'portrait.key': 'owner/x/hero' }, ectx), /imagem/);
    assert.throws(() => applyEntryEdits(t, text, { order: '1' }, ectx), /desconhecido/);
    const links = [{ label: 'Instagram', url: 'https://www.instagram.com/outro/', platform: 'instagram' }, { label: 'Vimeo', url: 'https://vimeo.com/helder', platform: 'vimeo' }];
    const { text: next, changed } = applyEntryEdits(t, text, { links: JSON.stringify(links) }, ectx);
    assert.deepEqual(changed, ['Ligações']);
    assert.deepEqual(entryData(t, next).links, links);
  });
}

/* ── the GitHub client ──────────────────────────────────────────────────── */

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const files = Object.fromEntries(['home', 'about'].map((f) => [pageFilePath(f), fs.readFileSync(`src/content/page-content/${f}.json`, 'utf8')]));
const API = 'https://mock.github';

function setup(extra = {}) {
  resetGitHubToken();
  let clock = Date.UTC(2026, 9, 22, 12);
  const gh = createMockGitHub({ repo: 'luisfpires18/nextvision', branch: 'dev', files, appId: '42', publicKey, buildMs: 1000, now: () => clock, ...extra });
  const cfg = { appId: '42', installationId: '7', privateKey: PEM, repo: 'luisfpires18/nextvision', branch: 'dev', apiBase: API };
  const opts = { fetcher: (url, init) => gh.handle(url, init), now: clock };
  return { gh, cfg, opts, tick: (ms) => { clock += ms; opts.now = clock; } };
}

/* ── adding and removing entries (redesign phase 2) ─────────────────────── */

{
  const ectx = { mediaKind: (k) => (k.startsWith('projects/') ? 'image' : null), today: TODAY };
  const all = (t) => fs.readdirSync(t.dir).filter((f) => f.endsWith(t.ext)).map((f) => ({ id: f.slice(0, -t.ext.length), text: fs.readFileSync(`${t.dir}/${f}`, 'utf8') }));
  const removal = (over = {}) => ({ projects: [], carouselCategories: [], removedCategoriesText: '{"removed":[]}', today: TODAY, ...over });

  await check('a new team member is a valid file, after the others, and dated as the owners\'', () => {
    const t = ENTRY_TYPES.equipa;
    const made = newEntryFile(t, JSON.stringify({ name: 'Zé Teste Admin', rolePt: 'Produtora', roleEn: 'Producer', portrait: 'projects/leonor/poster' }), all(t), ectx);
    assert.equal(made.id, 'ze-teste-admin');
    assert.equal(made.path, 'src/content/team/ze-teste-admin.md');
    const d = entryData(t, made.text);
    assert.deepEqual(d.role, { pt: 'Produtora', en: 'Producer' });
    assert.equal(d.portrait.key, 'projects/leonor/poster');
    assert.equal(d.ownerEdited, TODAY);
    assert.ok(d.order > Math.max(...all(t).map((f) => entryData(t, f.text).order ?? 0)));
  });

  await check('a new entry is refused without its English, a portrait from the list, or a free address', () => {
    const t = ENTRY_TYPES.equipa;
    assert.throws(() => newEntryFile(t, JSON.stringify({ name: 'Ana', rolePt: 'Produtora', roleEn: '', portrait: 'projects/x/poster' }), all(t), ectx), /inglês/);
    assert.throws(() => newEntryFile(t, JSON.stringify({ name: 'Ana', rolePt: 'P', roleEn: 'P', portrait: 'owner/zz/hero' }), all(t), ectx), /imagem da lista/);
    const taken = entryData(t, all(t)[0].text).name;
    assert.throws(() => newEntryFile(t, JSON.stringify({ name: taken, rolePt: 'P', roleEn: 'P', portrait: 'projects/x/poster' }), all(t), ectx), /Já existe/);
    assert.throws(() => newEntryFile(ENTRY_TYPES.definicoes, '{}', [], ectx), /não se acrescenta/);
    assert.throws(() => newEntryFile(t, 'nada', all(t), ectx), /inválido/);
  });

  await check('a new service and a new category are valid files with both languages', () => {
    const s = newEntryFile(ENTRY_TYPES.servico, JSON.stringify({ namePt: 'Serviço Teste Admin', nameEn: 'Admin Test Service', descriptionPt: 'Fazemos fotografia.', descriptionEn: 'We do photography.' }), all(ENTRY_TYPES.servico), ectx);
    assert.equal(s.path, 'src/content/services/servico-teste-admin.md');
    assert.deepEqual(entryData(ENTRY_TYPES.servico, s.text).title, { pt: 'Serviço Teste Admin', en: 'Admin Test Service' });
    const c = newEntryFile(ENTRY_TYPES.categoria, JSON.stringify({ namePt: 'Categoria Teste Admin', nameEn: 'Admin Test Category' }), all(ENTRY_TYPES.categoria), ectx);
    assert.equal(c.path, 'src/content/categories/categoria-teste-admin.yml');
    const cd = entryData(ENTRY_TYPES.categoria, c.text);
    assert.equal(cd.internalId, 'cat-categoria-teste-admin');
    assert.equal(cd.hidden, false);
    assert.deepEqual(cd.previousSlugs, []);
  });

  await check('removing an entry needs its name, and deletes only its file', () => {
    const t = ENTRY_TYPES.servico;
    const files = all(t);
    const name = entryData(t, files[0].text).title.pt;
    assert.throws(() => entryRemovalWrites(t, files[0].id, 'outro nome', removal({ existing: files })), /confirme o nome/);
    assert.deepEqual(entryRemovalWrites(t, files[0].id, name, removal({ existing: files })), [{ path: `${t.dir}/${files[0].id}.md`, remove: true }]);
    assert.throws(() => entryRemovalWrites(ENTRY_TYPES.definicoes, 'site', 'x', removal({ existing: [] })), /não se apaga/);
  });

  await check('the last person of the team cannot be removed', () => {
    const t = ENTRY_TYPES.equipa;
    const one = all(t).slice(0, 1);
    assert.throws(() => entryRemovalWrites(t, one[0].id, entryData(t, one[0].text).name, removal({ existing: one })), /última pessoa/);
  });

  await check('a category in use by a project or by the carousel cannot be removed, and a removal is recorded', () => {
    const t = ENTRY_TYPES.categoria;
    const files = all(t);
    const f = files.find((x) => x.id === 'ficcao');
    const name = entryData(t, f.text).name.pt;
    assert.throws(() => entryRemovalWrites(t, 'ficcao', name, removal({ existing: files, projects: [{ title: 'Epitáfio', categories: ['ficcao'] }] })), /Epitáfio/);
    assert.throws(() => entryRemovalWrites(t, 'ficcao', name, removal({ existing: files, carouselCategories: ['ficcao'] })), /carrossel/);
    const writes = entryRemovalWrites(t, 'ficcao', name, removal({ existing: files }));
    assert.deepEqual(writes[0], { path: 'src/content/categories/ficcao.yml', remove: true });
    assert.deepEqual(JSON.parse(writes[1].text).removed, [{ slug: 'ficcao', name, at: TODAY }]);
  });
}


await check('the App JWT is signed with the App key and accepted', async () => {
  const { gh, cfg, opts } = setup();
  await readFile(cfg, pageFilePath('home'), opts);
  assert.equal(gh.tokens.minted, 1);
});
await check('a JWT signed with another key is refused', async () => {
  const other = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  const { cfg, opts } = setup();
  await assert.rejects(readFile({ ...cfg, privateKey: other }, pageFilePath('home'), opts), (e) => e instanceof GitHubError && e.status === 401);
});
await check('the installation token is reused, not re-minted per call', async () => {
  const { gh, cfg, opts } = setup();
  await readFile(cfg, pageFilePath('home'), opts);
  await readFile(cfg, pageFilePath('about'), opts);
  assert.equal(gh.tokens.minted, 1);
});
await check('readFile returns the text and git\'s own blob SHA', async () => {
  const { cfg, opts } = setup();
  const { text, sha } = await readFile(cfg, pageFilePath('home'), opts);
  assert.equal(text, files[pageFilePath('home')]);
  assert.equal(sha, nodeBlobSha(text));
  assert.equal(await gitBlobSha(text), sha, 'the Worker computes the same SHA git does');
});
await check('two files save as ONE commit on dev', async () => {
  const { gh, cfg, opts } = setup();
  const before = gh.head();
  const home = await readFile(cfg, pageFilePath('home'), opts);
  const about = await readFile(cfg, pageFilePath('about'), opts);
  const out = await commitFiles(cfg, [
    { path: pageFilePath('home'), text: home.text.replace('Captamos', 'Gravamos') },
    { path: pageFilePath('about'), text: about.text.replace('De uma ideia', 'De uma visão') },
  ], { [pageFilePath('home')]: home.sha, [pageFilePath('about')]: about.sha }, 'content(about): test', opts);
  assert.equal(gh.head(), out.commit);
  assert.notEqual(before, out.commit);
  assert.match(gh.file(pageFilePath('home')), /Gravamos/);
  assert.match(gh.file(pageFilePath('about')), /De uma visão/);
  assert.equal(gh.runs.length, 1, 'one push, one build');
});
await check('a save from a stale file is refused and writes nothing', async () => {
  const { gh, cfg, opts } = setup();
  const home = await readFile(cfg, pageFilePath('home'), opts);
  gh.pushElsewhere(pageFilePath('home'), home.text.replace('Captamos', 'Outro'));
  const head = gh.head();
  await assert.rejects(
    commitFiles(cfg, [{ path: pageFilePath('home'), text: 'x' }], { [pageFilePath('home')]: home.sha }, 'm', opts),
    (e) => e instanceof GitHubError && e.status === 409,
  );
  assert.equal(gh.head(), head);
  assert.match(gh.file(pageFilePath('home')), /Outro/);
});
await check('a save racing another push is refused by the fast-forward check', async () => {
  const { gh, cfg, opts } = setup();
  const about = await readFile(cfg, pageFilePath('about'), opts);
  // Someone pushes a DIFFERENT file between our freshness check and our ref update.
  const fetcher = async (url, init) => {
    if ((init?.method ?? 'GET') === 'PATCH') gh.pushElsewhere(pageFilePath('home'), 'race');
    return gh.handle(url, init);
  };
  await assert.rejects(
    commitFiles(cfg, [{ path: pageFilePath('about'), text: 'x' }], { [pageFilePath('about')]: about.sha }, 'm', { ...opts, fetcher }),
    (e) => e instanceof GitHubError && e.status === 409,
  );
  assert.equal(gh.file(pageFilePath('home')), 'race', 'the other push survives');
});
await check('the build of a save is followed from queued to completed', async () => {
  const { cfg, opts, tick } = setup();
  const home = await readFile(cfg, pageFilePath('home'), opts);
  const { commit } = await commitFiles(cfg, [{ path: pageFilePath('home'), text: `${home.text} ` }], { [pageFilePath('home')]: home.sha }, 'm', opts);
  assert.equal((await latestRun(cfg, 'dev.yml', opts)).status, 'queued');
  tick(500);
  assert.equal((await latestRun(cfg, 'dev.yml', opts)).status, 'in_progress');
  tick(1000);
  const done = await latestRun(cfg, 'dev.yml', opts);
  assert.equal(done.status, 'completed');
  assert.equal(done.conclusion, 'success');
  assert.equal(done.headSha, commit);
});

/* ── removing a project ─────────────────────────────────────────────────── */

{
  const dir = 'scripts/fixtures/projects';
  const all = fs.readdirSync(dir).map((f) => ({ slug: f.replace(/\.mdx$/, ''), text: fs.readFileSync(`${dir}/${f}`, 'utf8') }));
  // A fixed starting list, for the same reason as the fixtures: the real one grows with every removal.
  const removedText = '{\n  "removed": []\n}\n';
  const leonorTitle = projectValue(projectData(all.find((p) => p.slug === 'leonor').text), 'title.pt');

  await check('removing a project needs its current title confirmed', () => {
    assert.throws(() => removalWrites(all, new Map([['leonor', '']]), removedText, TODAY), /confirme/);
    assert.throws(() => removalWrites(all, new Map([['leonor', 'Outro']]), removedText, TODAY), /confirme/);
    assert.throws(() => removalWrites(all, new Map([['nao-existe', 'x']]), removedText, TODAY), /já não existe/);
  });
  await check('a project another one lists as related cannot be removed', () => {
    // Any OTHER project will do: the owners delete projects, so none is named here.
    const other = all.find((p) => p.slug !== 'leonor' && /^related: \[\]$/m.test(p.text));
    assert.ok(other, 'the fixture needs a second project with an empty `related`');
    const linked = all.map((p) => (p.slug === other.slug ? { ...p, text: p.text.replace(/^related: \[\]$/m, 'related:\n  - leonor') } : p));
    assert.throws(() => removalWrites(linked, new Map([['leonor', leonorTitle]]), removedText, TODAY), /relacionado/);
  });
  await check('removing a project is ONE commit: its file deleted, the removal recorded, nothing else', async () => {
    const start = { ...files, [REMOVED_PATH]: removedText, ...Object.fromEntries(all.map((p) => [projectFilePath(p.slug), p.text])) };
    const { gh, cfg, opts } = setup({ files: start });
    const writes = removalWrites(all, new Map([['leonor', leonorTitle]]), (await readFile(cfg, REMOVED_PATH, opts)).text, TODAY);
    assert.deepEqual(writes.map((w) => w.path).sort(), [REMOVED_PATH, projectFilePath('leonor')].sort(), 'only the project and the removal list');
    const expected = {};
    for (const w of writes) expected[w.path] = (await readFile(cfg, w.path, opts)).sha;
    await commitFiles(cfg, writes, expected, 'content: Projeto', opts);
    assert.equal(gh.runs.length, 1, 'one push, one build');
    assert.equal(gh.file(projectFilePath('leonor')), undefined, 'the file is gone');
    // The list already holds every removal the owners have made; this one is added to it.
    assert.deepEqual(JSON.parse(gh.file(REMOVED_PATH)).removed, [{ slug: 'leonor', title: leonorTitle, at: TODAY }]);
    const touched = Object.keys(start).filter((p) => gh.file(p) !== start[p]).sort();
    assert.deepEqual(touched, [REMOVED_PATH, projectFilePath('leonor')].sort(), 'no other file changed');
  });
  await check('a removal from a stale project file is refused and deletes nothing', async () => {
    const start = { ...files, [REMOVED_PATH]: removedText, [projectFilePath('leonor')]: all.find((p) => p.slug === 'leonor').text };
    const { gh, cfg, opts } = setup({ files: start });
    const before = await readFile(cfg, projectFilePath('leonor'), opts);
    gh.pushElsewhere(projectFilePath('leonor'), `${before.text}\n`);
    await assert.rejects(
      commitFiles(cfg, [{ path: projectFilePath('leonor'), remove: true }], { [projectFilePath('leonor')]: before.sha }, 'm', opts),
      (e) => e instanceof GitHubError && e.status === 409,
    );
    assert.ok(gh.file(projectFilePath('leonor')), 'still there');
  });
}

/* ── new media from the owners (A4) ─────────────────────────────────────── */

{
  const homeFields = expandFields(SCREENS.home, docsFor('home'));
  const servicesFields = expandFields(SCREENS.services, docsFor('services'));
  const src = 'uploads/2026-10-22/abc12345/clip.mp4';
  const film = { screen: 'home', target: 'home:heroVideo', source: src, name: 'Clip Final.MOV', start: 10, end: 18, posterAt: 12 };
  const plan = (fields, req) => planUpload(fields, req, 'abc12345', 'o@x', '2026-10-22T18:00:00Z');

  await check('a film for the homepage becomes a pending owner/<id>/hero entry with its window', () => {
    const e = plan(homeFields, film);
    assert.equal(e.key, 'owner/abc12345/hero');
    assert.equal(e.kind, 'video');
    assert.deepEqual([e.start, e.duration, e.posterAt, e.status], [10, 8, 12, 'pending']);
    assert.deepEqual(e.target, { screen: 'home', file: 'home', path: 'heroVideo', label: 'Vídeo da página inicial' });
  });
  await check('a still for an image field becomes owner/<id>/image, with no window', () => {
    const e = plan(servicesFields, { screen: 'services', target: 'services:leadImage', source: src.replace('clip.mp4', 'f.jpg'), name: 'frame.JPG' });
    assert.equal(e.key, 'owner/abc12345/image');
    assert.equal(e.start, undefined);
  });
  await check('the wrong kind for the field is refused, in words', () => {
    assert.throws(() => plan(homeFields, { ...film, name: 'photo.jpg' }), /precisa de um vídeo/);
    assert.throws(() => plan(servicesFields, { screen: 'services', target: 'services:leadImage', source: src, name: 'clip.mp4' }), /precisa de uma imagem/);
  });
  await check('a text field, an unknown field and a locked field take no file', () => {
    assert.throws(() => plan(homeFields, { ...film, target: 'home:copy.heroLineA' }), /não aceita ficheiros/);
    assert.throws(() => plan(homeFields, { ...film, target: 'home:nope' }), /não aceita ficheiros/);
  });
  await check('the window must be 2-30 s, marked, and hold its cover', () => {
    assert.throws(() => plan(homeFields, { ...film, end: 11 }), /pelo menos 2/);
    assert.throws(() => plan(homeFields, { ...film, end: 45 }), /no máximo 30/);
    assert.throws(() => plan(homeFields, { ...film, posterAt: 20 }), /dentro do excerto/);
    assert.throws(() => plan(homeFields, { ...film, start: undefined }), /Marque/);
    assert.throws(() => plan(homeFields, { ...film, start: -1 }), /Marque/);
  });
  await check('a source outside uploads/ (or one that walks) is refused', () => {
    for (const bad of ['archive/smash/x.mp4', 'uploads/../archive/x.mp4', 'uploads/2026-10-22/abc12345/../../x', '']) {
      assert.throws(() => plan(homeFields, { ...film, source: bad }), /não foi encontrado/, bad);
    }
  });
  await check('an unsupported file type is refused', () => {
    assert.throws(() => plan(homeFields, { ...film, name: 'clip.avi' }), /não é aceite/);
  });
  await check('file names are made safe and keys are recognised', () => {
    assert.equal(safeName('../../Vídeo Final (2).MOV'), 'Video-Final-2-.MOV');
    assert.equal(kindOf('a.Mp4'), 'video');
    assert.equal(kindOf('a.tiff'), 'image');
    assert.equal(kindOf('a.exe'), null);
    assert.ok(isUploadKey(uploadKey('2026-10-22', 'abc12345', 'Vídeo Final.mov')));
  });
  await check('the same request id twice is refused', () => {
    const e = plan(homeFields, film);
    const doc = appendUpload({ uploads: [] }, e);
    assert.throws(() => appendUpload(doc, e), /já foi feito/);
  });
  // The SHAPE, not the contents: once the owners upload, the list is not empty (this check
  // asserted `[]` until the first real upload, and failed every dev build after it).
  await check('the uploads file on disk is the shape the code expects', () => {
    const doc = JSON.parse(fs.readFileSync(UPLOADS_PATH, 'utf8'));
    assert.ok(Array.isArray(doc.uploads));
    for (const u of doc.uploads) {
      assert.ok(isUploadKey(u.source), `source ${u.source}`);
      assert.ok(['pending', 'ready', 'failed'].includes(u.status), u.id);
      assert.ok(u.key.startsWith(`owner/${u.id}/`), u.id);
    }
  });
}

console.log(failed ? `\n${failed} failed, ${passed} passed` : `\nall ${passed} checks passed — saves are one commit or none, only what the screen offers, and drafts from every page publish as one commit`);
process.exit(failed ? 1 : 0);
