/**
 * GET /admin/api/estado/ — the state of the newest production deploy (prod.yml on
 * master), or of one upload with `?carregamento=<id>`.
 *
 * The admin polls this after a publish, or after an upload is processed, until the deploy
 * of THAT commit has finished. It reports what GitHub reports and nothing else: nothing is
 * ever called published before it is.
 */
import type { APIRoute } from 'astro';
import { adminIdentity } from '../../lib/admin/guard.ts';
import { githubConfig, DEPLOY_WORKFLOW, PUBLISH_BRANCH } from '../../lib/admin/repo.ts';
import { branchHead, latestRun, readFile } from '../../lib/admin/github.ts';
import { answer } from '../../lib/admin/http.ts';
import { UPLOADS_PATH, type UploadsDoc } from '../../lib/admin/uploads.ts';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  if (!(await adminIdentity(request))) return answer(403, { error: 'Sem acesso.' });

  const cfg = githubConfig();
  if (!cfg) return answer(200, { configured: false });

  try {
    // An upload being processed (A4): its entry now, and — once ready — the commit whose
    // deploy will put it on the site.
    const upload = url.searchParams.get('carregamento');
    if (upload) {
      const doc = JSON.parse((await readFile(cfg, UPLOADS_PATH)).text) as UploadsDoc;
      const entry = doc.uploads.find((u) => u.id === upload);
      if (!entry) return answer(404, { configured: true, error: 'Pedido desconhecido.' });
      return answer(200, {
        configured: true,
        status: entry.status,
        error: entry.error ?? null,
        head: entry.status === 'ready' ? await branchHead(cfg, PUBLISH_BRANCH) : null,
      });
    }

    const run = await latestRun(cfg, DEPLOY_WORKFLOW);
    if (!run) return answer(200, { configured: true, state: 'none' });
    const state = run.status !== 'completed' ? 'building' : run.conclusion === 'success' ? 'ready' : 'failed';
    return answer(200, { configured: true, state, commit: run.headSha, url: run.url, at: run.createdAt });
  } catch {
    return answer(502, { configured: true, state: 'unknown' });
  }
};
