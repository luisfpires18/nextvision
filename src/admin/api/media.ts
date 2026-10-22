/**
 * POST /admin/api/media/ — ask for an uploaded file to be processed into a field (A4).
 *
 * Checks the request against the screen's fields (uploads.ts `planUpload`: the right
 * kind, an unlocked field, a 2–30 s window holding its cover), confirms the upload really
 * is in the private bucket, then appends ONE entry to `src/data/media-uploads.json` on
 * `dev` as one App commit. That commit starts `media-ingest.yml`, which encodes the file,
 * attaches it to the field, and marks the entry ready or failed.
 */
import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { answer, guardJson } from '../../lib/admin/http.ts';
import { githubConfig } from '../../lib/admin/repo.ts';
import { readFile, commitFiles, GitHubError } from '../../lib/admin/github.ts';
import { SCREENS, pageFilePath, type PageFileName } from '../../lib/admin/fields.ts';
import { expandFields, EditError } from '../../lib/admin/edit.ts';
import { appendUpload, planUpload, UPLOADS_PATH, type UploadsDoc } from '../../lib/admin/uploads.ts';
import { sourceBucket } from '../../lib/admin/sources.ts';

export const prerender = false;

const Body = z.object({
  screen: z.string(),
  target: z.string().max(100),
  source: z.string().max(300),
  name: z.string().min(1).max(200),
  start: z.number().optional(),
  end: z.number().optional(),
  posterAt: z.number().optional(),
  note: z.string().max(300).optional(),
});

export const POST: APIRoute = async ({ request }) => {
  const g = await guardJson(request, 16 * 1024);
  if (!g.ok) return g.response;
  const parsed = Body.safeParse(g.value);
  if (!parsed.success) return answer(400, { error: 'Pedido inválido.' });
  const req = parsed.data;

  const defs = SCREENS[req.screen as PageFileName];
  if (!defs) return answer(404, { error: 'Página desconhecida.' });
  const cfg = githubConfig();
  const bucket = sourceBucket();
  if (!cfg || !bucket) return answer(503, { error: 'Carregar ficheiros ainda não está configurado neste servidor.' });

  try {
    const docs: Partial<Record<PageFileName, unknown>> = {};
    for (const file of new Set(defs.map((d) => d.file))) docs[file] = JSON.parse((await readFile(cfg, pageFilePath(file))).text);

    const id = req.source.split('/')[2] ?? '';
    const entry = planUpload(expandFields(defs, docs), { ...req, screen: req.screen as PageFileName }, id, g.who.email, new Date().toISOString());
    if (!(await bucket.head(entry.source))) {
      return answer(422, { error: 'O ficheiro carregado não foi encontrado. Volte a carregá-lo.' });
    }

    const current = await readFile(cfg, UPLOADS_PATH);
    const next = appendUpload(JSON.parse(current.text) as UploadsDoc, entry);
    const { commit } = await commitFiles(
      cfg,
      [{ path: UPLOADS_PATH, text: `${JSON.stringify(next, null, 2)}\n` }],
      { [UPLOADS_PATH]: current.sha },
      `content(${req.screen}): ${entry.target.label} (novo ficheiro pedido)\n\nGuardado no admin por ${g.who.email}.`,
    );
    return answer(200, { id: entry.id, commit });
  } catch (error) {
    if (error instanceof EditError) return answer(422, { error: error.message });
    if (error instanceof GitHubError && error.status === 409) {
      return answer(409, { error: 'Outra alteração foi guardada ao mesmo tempo. Volte a carregar em «Processar»; o ficheiro já está guardado.' });
    }
    const status = error instanceof GitHubError ? error.status : 0;
    return answer(502, { error: `O GitHub não respondeu como esperado${status ? ` (${status})` : ''}. O ficheiro está guardado; volte a tentar.` });
  }
};
