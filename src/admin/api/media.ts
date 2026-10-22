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
import { readFile, commitFiles, listFiles, GitHubError } from '../../lib/admin/github.ts';
import { SCREENS, pageFilePath, type PageFileName } from '../../lib/admin/fields.ts';
import { expandFields, EditError } from '../../lib/admin/edit.ts';
import { appendUpload, planUpload, UPLOADS_PATH, type UploadField, type UploadsDoc } from '../../lib/admin/uploads.ts';
import {
  PROJECT_FILE, PROJECTS_DIR, SLUG, fieldsFor, newProjectText, projectData, projectDraftFile, projectFilePath, projectValue, slugFrom,
} from '../../lib/admin/projects.ts';
import { projectContext } from '../../lib/admin/project-context.ts';
import { ENTRY_ID, entryData, entryDraftFile, entryFields, entryFilePath, entryTypeOf } from '../../lib/admin/entries.ts';
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
  /** Only with `screen: 'novo-projeto'`: the project the uploaded cover is for. */
  project: z.object({
    title: z.string().max(200),
    sourceLocale: z.enum(['pt', 'en']),
    taglinePt: z.string().max(2000),
    taglineEn: z.string().max(2000),
    year: z.string().max(10),
    category: z.string().max(60),
    film: z.string().max(300),
    hidden: z.boolean(),
  }).optional(),
});

/** Where an upload may go, besides the page screens: a project's media, or a new project's cover. */
const NEW_PROJECT = 'novo-projeto';

export const POST: APIRoute = async ({ request }) => {
  const g = await guardJson(request, 16 * 1024);
  if (!g.ok) return g.response;
  const parsed = Body.safeParse(g.value);
  if (!parsed.success) return answer(400, { error: 'Pedido inválido.' });
  const req = parsed.data;

  const defs = SCREENS[req.screen as PageFileName];
  const entryType = entryTypeOf(req.screen);
  if (!defs && !entryType && req.screen !== PROJECT_FILE && req.screen !== NEW_PROJECT) return answer(404, { error: 'Página desconhecida.' });
  const cfg = githubConfig();
  const bucket = sourceBucket();
  if (!cfg || !bucket) return answer(503, { error: 'Carregar ficheiros ainda não está configurado neste servidor.' });

  try {
    const id = req.source.split('/')[2] ?? '';
    const by = g.who.email;
    const at = new Date().toISOString();
    let fields: UploadField[];
    let create: { slug: string; project: NonNullable<typeof req.project> } | undefined;

    if (defs) {
      const docs: Partial<Record<PageFileName, unknown>> = {};
      for (const file of new Set(defs.map((d) => d.file))) docs[file] = JSON.parse((await readFile(cfg, pageFilePath(file))).text);
      fields = expandFields(defs, docs);
    } else if (entryType) {
      // `equipa/<id>:portrait.key` — an entry's own image fields.
      const id = (req.target.split(':')[0] ?? '').slice(entryType.prefix.length + 1);
      if (!ENTRY_ID.test(id)) return answer(400, { error: 'Pedido inválido.' });
      const data = entryData(entryType, (await readFile(cfg, entryFilePath(entryType, id))).text);
      fields = entryFields(entryType, data).filter((f) => f.kind === 'image' && !f.locked)
        .map((f) => ({ file: entryDraftFile(entryType, id), key: f.path, kind: 'image', label: `${entryType.noun} «${entryType.name(data)}» — ${f.label}` }));
    } else if (req.screen === PROJECT_FILE) {
      // `projeto/<slug>:poster.key` — the project's own media fields.
      const slug = (req.target.split(':')[0] ?? '').slice(PROJECT_FILE.length + 1);
      if (!SLUG.test(slug)) return answer(400, { error: 'Pedido inválido.' });
      const data = projectData((await readFile(cfg, projectFilePath(slug))).text);
      const title = projectValue(data, 'title.pt');
      fields = fieldsFor(data).filter((f) => f.kind === 'image' || f.kind === 'video')
        .map((f) => ({ file: projectDraftFile(slug), key: f.path, kind: f.kind, label: `Projeto «${title}» — ${f.label}` }));
    } else {
      // A new project: checked in full NOW, written by the ingest once its cover exists.
      if (!req.project) return answer(400, { error: 'Pedido inválido.' });
      const slug = slugFrom(req.project.title);
      if (!SLUG.test(slug)) return answer(422, { error: '«Título»: use pelo menos uma letra ou algarismo.' });
      const taken = (await listFiles(cfg, PROJECTS_DIR)).includes(projectFilePath(slug));
      if (taken) return answer(422, { error: `Já existe um projeto com o endereço /portfolio/${slug}/. Escolha outro título.` });
      newProjectText(req.project, `owner/${id}/image`, 0, at.slice(0, 10), await projectContext());
      create = { slug, project: req.project };
      fields = [{ file: projectDraftFile(slug), key: 'poster.key', kind: 'image', label: `Novo projeto «${req.project.title.trim()}» — Capa` }];
      req.target = `${projectDraftFile(slug)}:poster.key`;
    }

    const entry = planUpload(fields, req, id, by, at);
    if (create) entry.create = create;
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
