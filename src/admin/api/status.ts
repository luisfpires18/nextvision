/**
 * GET /admin/api/estado/ — the state of the newest build: of the preview (`dev`) by
 * default, or of the live site with `?alvo=site`.
 *
 * The admin polls this after a save (preview) or a publish (live site) until the build of
 * THAT commit has finished. It reports what GitHub reports and nothing else: no build is
 * ever called ready before it is.
 */
import type { APIRoute } from 'astro';
import { adminIdentity } from '../../lib/admin/guard.ts';
import { githubConfig, BUILD_WORKFLOW, LIVE_BRANCH, LIVE_WORKFLOW, SAVE_BRANCH } from '../../lib/admin/repo.ts';
import { compare, latestRun } from '../../lib/admin/github.ts';
import { assess } from '../../lib/admin/publish.ts';

export const prerender = false;

const answer = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });

export const GET: APIRoute = async ({ request, url }) => {
  if (!(await adminIdentity(request))) return answer(403, { error: 'Sem acesso.' });

  const cfg = githubConfig();
  if (!cfg) return answer(200, { configured: false });

  const live = url.searchParams.get('alvo') === 'site';
  try {
    // Asked once per page load by the status bar: how much is saved but not yet live.
    if (url.searchParams.has('pendentes')) {
      const waiting = assess(await compare(cfg, LIVE_BRANCH, SAVE_BRANCH));
      return answer(200, { configured: true, pending: waiting.items.length, blocked: waiting.blocked.length > 0 });
    }
    const run = live
      ? await latestRun(cfg, LIVE_WORKFLOW, {}, LIVE_BRANCH)
      : await latestRun(cfg, BUILD_WORKFLOW);
    if (!run) return answer(200, { configured: true, state: 'none' });
    const state = run.status !== 'completed' ? 'building' : run.conclusion === 'success' ? 'ready' : 'failed';
    return answer(200, { configured: true, state, commit: run.headSha, url: run.url, at: run.createdAt });
  } catch {
    return answer(502, { configured: true, state: 'unknown' });
  }
};
