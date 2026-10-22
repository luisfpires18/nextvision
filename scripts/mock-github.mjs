/**
 * npm run mock:github — a fake GitHub on http://127.0.0.1:8790 for clicking through the
 * admin's save flow under `astro dev`, without touching the real repository.
 *
 *   1. echo GITHUB_API_URL=http://127.0.0.1:8790 >> .dev.vars   (gitignored)
 *   2. npm run mock:github
 *   3. npm run dev, then open /admin/
 *
 * It starts from the page-content files in this working tree. Saves live in memory and
 * vanish when it stops; nothing is written to disk and nothing leaves the machine.
 * `GITHUB_API_URL` is honoured only by `astro dev` (IS_DEV), never by a build.
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createMockGitHub } from './lib/mock-github.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIR = 'src/content/page-content';
const files = Object.fromEntries(fs.readdirSync(path.join(ROOT, DIR))
  .filter((f) => f.endsWith('.json'))
  .map((f) => [`${DIR}/${f}`, fs.readFileSync(path.join(ROOT, DIR, f), 'utf8')]));

const gh = createMockGitHub({ repo: 'luisfpires18/nextvision', branch: 'dev', files, buildMs: 12_000 });
const PORT = Number(process.env.PORT ?? 8790);

http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = chunks.length ? Buffer.concat(chunks).toString() : undefined;
  const answer = await gh.handle(`http://127.0.0.1:${PORT}${req.url}`, { method: req.method, headers: req.headers, body });
  if (req.method !== 'GET') console.log(`${req.method} ${req.url} -> ${answer.status}${req.method === 'PATCH' ? `  "${gh.message().split('\n')[0]}"` : ''}`);
  res.writeHead(answer.status, { 'Content-Type': 'application/json' });
  res.end(await answer.text());
}).listen(PORT, '127.0.0.1', () => console.log(`mock GitHub on http://127.0.0.1:${PORT} — ${Object.keys(files).length} files, branch dev`));
