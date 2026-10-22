/**
 * GET /admin/api/estado/ — the state of the newest build of `dev`, i.e. of the preview.
 *
 * The admin polls this after a save until the build of THAT commit has finished, then
 * says the preview is ready (or that it failed, with the link to why). It reports what
 * GitHub reports and nothing else: no build is ever called ready before it is.
 */
import type { APIRoute } from 'astro';
import { adminIdentity } from '../../lib/admin/guard.ts';
import { githubConfig, BUILD_WORKFLOW } from '../../lib/admin/repo.ts';
import { latestRun } from '../../lib/admin/github.ts';

export const prerender = false;

const answer = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });

export const GET: APIRoute = async ({ request }) => {
  if (!(await adminIdentity(request))) return answer(403, { error: 'Sem acesso.' });

  const cfg = githubConfig();
  if (!cfg) return answer(200, { configured: false });

  try {
    const run = await latestRun(cfg, BUILD_WORKFLOW);
    if (!run) return answer(200, { configured: true, state: 'none' });
    const state = run.status !== 'completed' ? 'building' : run.conclusion === 'success' ? 'ready' : 'failed';
    return answer(200, { configured: true, state, commit: run.headSha, url: run.url, at: run.createdAt });
  } catch {
    return answer(502, { configured: true, state: 'unknown' });
  }
};
