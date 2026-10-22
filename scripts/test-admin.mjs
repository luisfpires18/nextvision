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
import { applyEdits, expandFields, fieldName, serialise, EditError } from '../src/lib/admin/edit.ts';
import { readFile, commitFiles, latestRun, gitBlobSha, resetGitHubToken, GitHubError, branchHead, compare, openPullRequest, mergePullRequest } from '../src/lib/admin/github.ts';
import { assess, ADMIN_BOT as BOT_IN_SRC } from '../src/lib/admin/publish.ts';
import { createMockGitHub, gitBlobSha as nodeBlobSha, ADMIN_BOT } from './lib/mock-github.mjs';

assert.equal(BOT_IN_SRC, ADMIN_BOT, 'the fake GitHub names the App exactly as the publish rule expects');

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
  const hero = fields.find((f) => f.key === 'copy.heroLineA');
  const copyright = fields.find((f) => f.key === 'copy.copyright');
  const video = fields.find((f) => f.key === 'heroVideo');

  await check('a changed Portuguese text becomes owner copy, dated', () => {
    const { docs: next, changed } = applyEdits(fields, docs, { [fieldName(hero, 'pt')]: 'Captamos o mundo' }, TODAY);
    assert.deepEqual(next.home.copy.heroLineA, { text: 'Captamos o mundo', from: `owner:${TODAY}`, en: docs.home.copy.heroLineA.en });
    assert.deepEqual(changed, [{ file: 'home', label: hero.label }]);
    assert.equal(docs.home.copy.heroLineA.from, '/', 'the original is not mutated');
  });
  await check('an English-only change keeps the archived source', () => {
    const { docs: next } = applyEdits(fields, docs, { [fieldName(hero, 'en')]: 'We capture emotions' }, TODAY);
    assert.equal(next.home.copy.heroLineA.from, '/');
    assert.equal(next.home.copy.heroLineA.en, 'We capture emotions');
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
    const { changed } = applyEdits(fields, docs, { [fieldName(hero, 'pt')]: docs.home.copy.heroLineA.text, [fieldName(video)]: docs.home.heroVideo }, TODAY);
    assert.equal(changed.length, 0);
  });
  await check('a media field takes a key', () => {
    const { docs: next } = applyEdits(fields, docs, { [fieldName(video)]: 'projects/leonor/hero' }, TODAY);
    assert.equal(next.home.heroVideo, 'projects/leonor/hero');
  });
  await check('Windows line endings are stored as \\n', () => {
    const { docs: next } = applyEdits(fields, docs, { [fieldName(hero, 'pt')]: 'a\r\nb' }, TODAY);
    assert.equal(next.home.copy.heroLineA.text, 'a\nb');
  });
  await check('serialise matches the files on disk byte for byte', () => {
    assert.equal(serialise(read('home')), fs.readFileSync('src/content/page-content/home.json', 'utf8'));
  });
}

await check('lists expand to one field per item', () => {
  const about = expandFields(SCREENS.about, docsFor('about'));
  assert.equal(about.filter((f) => f.key.startsWith('copy.closing.')).length, read('about').copy.closing.length);
  const bts = expandFields(SCREENS.bts, docsFor('bts'));
  assert.deepEqual(bts.map((f) => f.key), read('bts').frames.map((_, i) => `frames.${i}`));
});

await check('every offered field exists in its file', () => {
  for (const [screen, defs] of Object.entries(SCREENS)) {
    const docs = docsFor(screen);
    for (const f of expandFields(defs, docs)) {
      const v = f.key.split('.').reduce((n, p) => n?.[p], docs[f.file]);
      assert.ok(v !== undefined, `${screen}: ${f.file}:${f.key}`);
    }
  }
});

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

/* ── publishing (A3) ────────────────────────────────────────────────────── */

const ownerCommit = (sha, subject, by = 'owner@example.com') =>
  ({ sha, author: ADMIN_BOT, message: `${subject}\n\nGuardado no admin por ${by}.`, date: '2026-10-22T16:00:00Z' });

await check('owner saves only: publishable, described in the owners\' words, newest first', () => {
  const a = assess({
    commits: [ownerCommit('a', 'content(thanks): Título'), ownerCommit('b', 'content(home): Vídeo da página inicial')],
    files: ['src/content/page-content/thanks.json', 'src/content/page-content/home.json'],
  });
  assert.deepEqual(a.blocked, []);
  assert.deepEqual(a.items.map((i) => [i.page, i.fields, i.by]), [
    ['Página inicial', 'Vídeo da página inicial', 'owner@example.com'],
    ['Página Obrigado', 'Título', 'owner@example.com'],
  ]);
});
await check('a developer commit waiting blocks publishing', () => {
  const a = assess({
    commits: [ownerCommit('a', 'content(thanks): Título'), { sha: 'c', author: 'luisfpires18', message: 'feat: x', date: '' }],
    files: ['src/content/page-content/thanks.json', 'src/admin/Editor.astro'],
  });
  assert.equal(a.blocked.length, 1);
  assert.match(a.blocked[0], /alteração técnica/);
  assert.equal(a.items.length, 1, 'the owner save is still listed');
});
await check('a commit GitHub cannot attribute to anyone blocks publishing', () => {
  assert.equal(assess({ commits: [{ sha: 'c', author: null, message: 'x', date: '' }], files: ['src/content/page-content/home.json'] }).blocked.length, 1);
});
await check('an owner commit touching anything but page content blocks publishing', () => {
  const a = assess({ commits: [ownerCommit('a', 'content(home): x')], files: ['src/content/page-content/home.json', '.github/workflows/prod.yml'] });
  assert.equal(a.blocked.length, 1);
});
await check('nothing waiting is nothing to publish, and not blocked', () => {
  assert.deepEqual(assess({ commits: [], files: [] }), { items: [], blocked: [] });
});

await check('publish flow: compare, open PR, merge at the reviewed commit, live build follows', async () => {
  const { gh, cfg, opts, tick } = setup();
  const home = await readFile(cfg, pageFilePath('home'), opts);
  await commitFiles(cfg, [{ path: pageFilePath('home'), text: home.text.replace('Captamos', 'Gravamos') }], { [pageFilePath('home')]: home.sha }, 'content(home): Frase de abertura, 1.ª linha\n\nGuardado no admin por o@x.', opts);
  const head = await branchHead(cfg, 'dev', opts);
  const waiting = await compare(cfg, 'master', 'dev', opts);
  assert.equal(waiting.aheadBy, 1);
  assert.deepEqual(waiting.files, [pageFilePath('home')]);
  assert.deepEqual(assess(waiting).blocked, []);

  const pr = await openPullRequest(cfg, 'master', 'dev', 'Publicar: Página inicial', 'x', opts);
  const again = await openPullRequest(cfg, 'master', 'dev', 'Publicar: Página inicial', 'x', opts);
  assert.equal(again.number, pr.number, 'an open release PR is reused, not duplicated');
  const merged = await mergePullRequest(cfg, pr.number, head, 'Publicar: Página inicial', opts);
  assert.match(gh.file(pageFilePath('home'), 'master'), /Gravamos/);
  assert.equal(gh.head('master'), merged.sha);

  const live = await latestRun(cfg, 'prod.yml', opts, 'master');
  assert.equal(live.headSha, merged.sha);
  tick(2000);
  assert.equal((await latestRun(cfg, 'prod.yml', opts, 'master')).conclusion, 'success');
  assert.deepEqual((await compare(cfg, 'master', 'dev', opts)).commits, [], 'nothing left waiting');
});
await check('a save after review makes the merge refuse (409), and nothing reaches master', async () => {
  const { gh, cfg, opts } = setup();
  const home = await readFile(cfg, pageFilePath('home'), opts);
  await commitFiles(cfg, [{ path: pageFilePath('home'), text: `${home.text} ` }], { [pageFilePath('home')]: home.sha }, 'content(home): a', opts);
  const reviewed = await branchHead(cfg, 'dev', opts);
  const pr = await openPullRequest(cfg, 'master', 'dev', 't', 'x', opts);
  gh.pushElsewhere(pageFilePath('home'), 'newer', { author: ADMIN_BOT });
  const before = gh.head('master');
  await assert.rejects(mergePullRequest(cfg, pr.number, reviewed, 't', opts), (e) => e instanceof GitHubError && e.status === 409);
  assert.equal(gh.head('master'), before);
});
await check('a developer commit on dev shows up as blocking in a real comparison', async () => {
  const { gh, cfg, opts } = setup();
  gh.pushElsewhere('src/admin/Editor.astro', 'code');
  const a = assess(await compare(cfg, 'master', 'dev', opts));
  assert.equal(a.blocked.length, 1);
});

console.log(failed ? `\n${failed} failed, ${passed} passed` : `\nall ${passed} checks passed — saves are one commit or none, only what the screen offers, and only owner content is ever published`);
process.exit(failed ? 1 : 0);
