/**
 * POST /admin/api/guardar/ — save one page's changes as one commit on `dev`.
 *
 * The checks, in order:
 *   1. size         64 KB is far more than any page's text. 413. (Then the body is read;
 *                   see the note in the handler for why it is read before refusing.)
 *   2. identity     the Access token, verified (guard.ts). 403.
 *   3. origin       a request from the admin page itself carries this origin; a cross-site
 *                   forgery does not. Plus JSON only, which no plain HTML form can send. 403/415.
 *   4. configured   the GitHub App secrets exist. 503 — never a pretend save.
 *   5. freshness    the files on `dev` are the ones the form was opened on. 409.
 *   6. the rules    edit.ts: only offered fields, both languages, provenance. 422.
 *   7. the schema   the same zod schema the build uses. 422.
 *   8. the commit   one commit or nothing (github.ts). 409 if `dev` moved meanwhile.
 *
 * Nothing the owner typed is logged.
 */
import type { APIRoute } from 'astro';
import { adminIdentity } from '../../lib/admin/guard.ts';
import { githubConfig } from '../../lib/admin/repo.ts';
import { readFile, commitFiles, gitBlobSha, GitHubError } from '../../lib/admin/github.ts';
import { SCREENS, pageFilePath, type PageFileName } from '../../lib/admin/fields.ts';
import { applyEdits, expandFields, serialise, EditError } from '../../lib/admin/edit.ts';
import { PAGE_SCHEMAS } from '../../lib/page-content.ts';
import { z } from 'astro/zod';

export const prerender = false;

const MAX_BYTES = 64 * 1024;

const answer = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });

const Body = z.object({
  screen: z.string(),
  shas: z.record(z.string(), z.string()),
  edits: z.record(z.string(), z.string()),
});

export const POST: APIRoute = async ({ request }) => {
  /**
   * The body is READ before any refusal, as /api/contact/ does. Measured: a POST refused
   * with its body unread (or cancelled) makes wrangler's local proxy drop the connection
   * on the next one ("Error inside ProxyWorker: Network connection lost"), so the
   * preview stops answering. The Worker itself answered correctly; the edge has no such
   * proxy. Reading first is safe: Access stops anyone unauthenticated at the edge before
   * this runs, and the platform caps a request body anyway.
   */
  const raw = await request.text().catch(() => '');
  if (new TextEncoder().encode(raw).byteLength > MAX_BYTES) return answer(413, { error: 'Alterações demasiado grandes.' });

  const who = await adminIdentity(request);
  if (!who) return answer(403, { error: 'Sem acesso.' });

  if (request.headers.get('origin') !== new URL(request.url).origin) return answer(403, { error: 'Pedido recusado.' });
  if (!request.headers.get('content-type')?.startsWith('application/json')) return answer(415, { error: 'Pedido recusado.' });

  let body: z.infer<typeof Body>;
  try { body = Body.parse(JSON.parse(raw)); } catch { return answer(400, { error: 'Pedido inválido.' }); }

  const defs = SCREENS[body.screen as PageFileName];
  if (!defs) return answer(404, { error: 'Página desconhecida.' });

  const cfg = githubConfig();
  if (!cfg) return answer(503, { error: 'Guardar ainda não está configurado neste servidor. Nada foi guardado.' });

  try {
    const files = [...new Set(defs.map((d) => d.file))];
    const docs: Partial<Record<PageFileName, unknown>> = {};
    const shas: Record<string, string> = {};
    for (const file of files) {
      const { text, sha } = await readFile(cfg, pageFilePath(file));
      if (body.shas[file] !== sha) {
        return answer(409, { error: 'Esta página foi alterada entretanto (noutra janela ou por outra pessoa). Recarregue para ver a versão atual; nada foi guardado.' });
      }
      docs[file] = JSON.parse(text);
      shas[pageFilePath(file)] = sha;
    }

    const today = new Date().toISOString().slice(0, 10);
    const { docs: next, changed } = applyEdits(expandFields(defs, docs), docs, body.edits, today);
    if (!changed.length) return answer(200, { nothing: true });

    const touched = [...new Set(changed.map((c) => c.file))];
    for (const file of touched) {
      const ok = PAGE_SCHEMAS[file].safeParse(next[file]);
      if (!ok.success) {
        return answer(422, { error: `Estas alterações deixariam a página inválida: ${z.prettifyError(ok.error)}` });
      }
    }

    const message = `content(${body.screen}): ${changed.map((c) => c.label).join(', ')}\n\nGuardado no admin por ${who.email}.`;
    const written = touched.map((file) => ({ file, path: pageFilePath(file), text: serialise(next[file]) }));
    const { commit, url } = await commitFiles(
      cfg,
      written,
      Object.fromEntries(written.map((w) => [w.path, shas[w.path]!])),
      message,
    );
    // The editor's new starting point: untouched files keep their SHA, written ones get the new one.
    const fresh = { ...body.shas };
    for (const w of written) fresh[w.file] = await gitBlobSha(w.text);
    return answer(200, { commit, url, changed: changed.map((c) => c.label), shas: fresh });
  } catch (error) {
    if (error instanceof EditError) return answer(422, { error: error.message });
    if (error instanceof GitHubError && error.status === 409) {
      return answer(409, { error: 'Outra alteração foi guardada ao mesmo tempo. Recarregue e volte a tentar; nada foi guardado.' });
    }
    const status = error instanceof GitHubError ? error.status : 0;
    return answer(502, { error: `O GitHub não respondeu como esperado${status ? ` (${status})` : ''}. Nada foi guardado.` });
  }
};
