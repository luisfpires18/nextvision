#!/usr/bin/env node
/**
 * media-ingest.mjs — process what the owners uploaded in the admin (phase A4).
 *
 * Run by .github/workflows/media-ingest.yml when `src/data/media-uploads.json` changes on
 * `dev`. For every entry still `pending`:
 *
 *   1. download its original from the PRIVATE bucket (`nvf-source-archive`, read only)
 *      into media/incoming/<id>/ — never committed, gitignored with all of media/;
 *   2. check it can do the job (a film long enough for its window; big enough to fill
 *      the slot without upscaling — the site never upscales, MEDIA_PIPELINE.md §3);
 *   3. encode it with `media-build --only <key>`, which merges into the manifest;
 *   4. point the requested field at the new key — a page field, a project's field, or,
 *      for a new project, write the project itself (its cover now exists);
 *   5. mark the entry `ready` — or `failed`, with the reason in the owners' words, which
 *      the admin shows next to the field. A failure changes no field.
 *
 * It writes files and reports; the workflow uploads the renditions (add-only) and commits.
 * Nothing here deletes anything, anywhere.
 *
 * Writes `changed=true|false` and `summary=…` to $GITHUB_OUTPUT when run in Actions.
 */

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { ROOT } from './media/recipe.mjs';
import { INCOMING, MANIFEST_FILE, probeFull, readJson } from './media/lib.mjs';
import { r2Config, getObject } from './media/r2.mjs';
import { PROJECT_FILE, PROJECTS_DIR, applyProjectEdits, newProjectText, projectData } from '../src/lib/admin/projects.ts';

const UPLOADS = path.join(ROOT, 'src', 'data', 'media-uploads.json');
const SOURCE_BUCKET = 'nvf-source-archive';
/** The narrowest a delivered film or still may start from without being upscaled to fill. */
const MIN_WIDTH = { video: 1280, image: 1140 };

const log = (...a) => console.log(...a);
const json = (doc) => `${JSON.stringify(doc, null, 2)}\n`;

/** The private bucket, with the read-only source key (never the delivery key). */
async function sourceBucket() {
  const base = await r2Config();
  const accessKeyId = process.env['R2_SOURCE_ACCESS_KEY_ID'] ?? '';
  const secretAccessKey = process.env['R2_SOURCE_SECRET_ACCESS_KEY'] ?? '';
  if (!base.accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2_ACCOUNT_ID, R2_SOURCE_ACCESS_KEY_ID and R2_SOURCE_SECRET_ACCESS_KEY are required');
  }
  return { ...base, bucket: SOURCE_BUCKET, missing: [], credentials: { accessKeyId, secretAccessKey } };
}

function setAt(doc, dotted, value) {
  const parts = dotted.split('.');
  const last = parts.pop();
  let node = doc;
  for (const p of parts) node = node?.[p];
  if (node === null || typeof node !== 'object' || !(last in node)) throw new Error(`no field ${dotted}`);
  node[last] = value;
}

async function ingest(u, cfg) {
  const dest = path.join(INCOMING, u.id, path.basename(u.source));
  await fs.mkdir(path.dirname(dest), { recursive: true });
  log(`\n${u.key}  ←  ${u.name}`);

  // Already here from an earlier, interrupted run (or placed by hand to test): reuse it.
  if (!existsSync(dest)) await fs.writeFile(dest, await getObject(cfg(), u.source, { signal: AbortSignal.timeout(20 * 60_000) }));

  let info;
  try { info = await probeFull(dest); } catch { throw new Error('O ficheiro não pôde ser lido. Está completo e é um vídeo ou uma imagem?'); }
  const v = (info.streams ?? []).find((s) => s.codec_type === 'video');
  if (!v?.width) throw new Error('O ficheiro não tem imagem que se possa usar.');
  const width = Number(v.width);
  log(`  ${width}x${v.height}${info.format?.duration ? `, ${Number(info.format.duration).toFixed(1)} s` : ''}`);

  if (width < MIN_WIDTH[u.kind]) {
    throw new Error(`O ficheiro tem ${width} px de largura; este lugar precisa de pelo menos ${MIN_WIDTH[u.kind]} px para não perder qualidade. Use uma versão maior.`);
  }
  if (u.kind === 'video') {
    const total = Number(info.format?.duration ?? 0);
    if (total && u.start + u.duration > total + 0.05) {
      throw new Error(`O excerto vai até ${(u.start + u.duration).toFixed(1)} s, mas o vídeo só tem ${total.toFixed(1)} s.`);
    }
  }

  const build = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'media-build.mjs'), '--only', u.key], { stdio: 'inherit' });
  if (build.status !== 0) throw new Error('O processamento do ficheiro falhou. Fale com o programador.');

  const manifest = await readJson(MANIFEST_FILE, { items: {} });
  if (!manifest.items[u.key] || (u.kind === 'video' && !manifest.items[`${u.key}/poster`])) {
    throw new Error('O processamento terminou sem produzir o ficheiro. Fale com o programador.');
  }

  if (u.target.file.startsWith(`${PROJECT_FILE}/`)) {
    await attachToProject(u, manifest);
    return;
  }
  const page = path.join(ROOT, 'src', 'content', 'page-content', `${u.target.file}.json`);
  const doc = JSON.parse(await fs.readFile(page, 'utf8'));
  setAt(doc, u.target.path, u.key);
  await fs.writeFile(page, json(doc));
}

/**
 * A project's field, or a NEW project whose cover this is: the file is written only now,
 * with the cover in the manifest, so the site never points at a picture that is not there.
 */
async function attachToProject(u, manifest) {
  const dir = path.join(ROOT, PROJECTS_DIR);
  const categories = new Set((await fs.readdir(path.join(ROOT, 'src', 'content', 'categories'))).map((f) => f.replace(/\.ya?ml$/, '')));
  const ctx = {
    categories,
    mediaKind: (key) => {
      const item = manifest.items[key];
      if (item?.kind === 'video') return manifest.items[`${key}/poster`] ? 'video' : null;
      return item?.kind === 'image' ? 'image' : null;
    },
  };
  if (u.create) {
    const file = path.join(dir, `${u.create.slug}.mdx`);
    if (existsSync(file)) throw new Error(`Já existe um projeto em /portfolio/${u.create.slug}/. Escolha outro título.`);
    // First in the portfolio: one before the current first.
    const orders = await Promise.all((await fs.readdir(dir)).filter((f) => f.endsWith('.mdx'))
      .map(async (f) => projectData(await fs.readFile(path.join(dir, f), 'utf8'))['portfolioOrder']));
    const first = Math.min(1, ...orders.filter((n) => typeof n === 'number'));
    await fs.writeFile(file, newProjectText(u.create.project, u.key, first - 1, u.at.slice(0, 10), ctx));
    return;
  }
  const file = path.join(dir, `${u.target.file.slice(PROJECT_FILE.length + 1)}.mdx`);
  if (!existsSync(file)) throw new Error('Este projeto já não existe.');
  const { text } = applyProjectEdits(await fs.readFile(file, 'utf8'), { [u.target.path]: u.key }, ctx);
  await fs.writeFile(file, text);
}

async function main() {
  const doc = JSON.parse(await fs.readFile(UPLOADS, 'utf8'));
  const pending = doc.uploads.filter((u) => u.status === 'pending');
  const out = [];

  if (pending.length) {
    // The bucket is only needed for a source not already on disk.
    let bucket = null;
    const cfg = () => { if (!bucket) throw new Error('source bucket not configured'); return bucket; };
    if (pending.some((u) => !existsSync(path.join(INCOMING, u.id, path.basename(u.source))))) bucket = await sourceBucket();
    for (const u of pending) {
      try {
        await ingest(u, cfg);
        u.status = 'ready';
        delete u.error;
        out.push(`${u.target.label}: pronto`);
        log(`  ready`);
      } catch (e) {
        u.status = 'failed';
        u.error = e instanceof Error ? e.message : String(e);
        out.push(`${u.target.label}: falhou`);
        log(`  FAILED: ${u.error}`);
      }
    }
    await fs.writeFile(UPLOADS, json(doc));
  } else {
    log('nothing pending');
  }

  const ready = pending.filter((u) => u.status === 'ready');
  const screens = [...new Set(pending.map((u) => u.target.screen))].join(',');
  const summary = pending.length
    ? `content(${screens}): ${pending.map((u) => `${u.target.label} (novo ficheiro${u.status === 'failed' ? ', falhou' : ''})`).join(', ')}`
    : '';
  if (process.env['GITHUB_OUTPUT']) {
    await fs.appendFile(process.env['GITHUB_OUTPUT'],
      `changed=${pending.length > 0}\nready=${ready.length > 0}\nsummary=${summary}\n`);
  }
  log(`\n${out.join('\n') || 'nothing to do'}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
