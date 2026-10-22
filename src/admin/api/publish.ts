/**
 * POST /admin/api/publicar/ — release what the owners saved on `dev` to the live site.
 *
 * Publishing is the `dev → master` merge, done for them. It goes ahead only when ALL of
 * these hold, checked here on the server in this order, never trusted from the page:
 *
 *   1. `dev` is still exactly the commit the owner reviewed (the page sends it). A save
 *      made since — in another window, by another person — means they have not seen it.
 *   2. Everything waiting is owner content (publish.ts): saves by the admin's App, and
 *      page-content files only. Technical work waiting on `dev` is a refusal with the
 *      reason, because Publish would otherwise release it too (decision A3).
 *   3. The preview of exactly that commit built successfully. A failed or unfinished
 *      preview is not something to release.
 *   4. GitHub merges the release pull request only at that same commit.
 *
 * Then `prod.yml` builds and deploys the live site; the page follows that build.
 */
import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { adminIdentity } from '../../lib/admin/guard.ts';
import { githubConfig, BUILD_WORKFLOW, LIVE_BRANCH, SAVE_BRANCH } from '../../lib/admin/repo.ts';
import { branchHead, compare, latestRun, mergePullRequest, openPullRequest, GitHubError } from '../../lib/admin/github.ts';
import { assess } from '../../lib/admin/publish.ts';

export const prerender = false;

const answer = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });

export const POST: APIRoute = async ({ request }) => {
  // Read before any refusal: see the note in save.ts on wrangler's local proxy.
  const raw = await request.text().catch(() => '');
  if (raw.length > 4096) return answer(413, { error: 'Pedido inválido.' });

  const who = await adminIdentity(request);
  if (!who) return answer(403, { error: 'Sem acesso.' });
  if (request.headers.get('origin') !== new URL(request.url).origin) return answer(403, { error: 'Pedido recusado.' });
  if (!request.headers.get('content-type')?.startsWith('application/json')) return answer(415, { error: 'Pedido recusado.' });

  let reviewed: string;
  try { reviewed = z.object({ sha: z.string().regex(/^[0-9a-f]{40}$/) }).parse(JSON.parse(raw)).sha; }
  catch { return answer(400, { error: 'Pedido inválido.' }); }

  const cfg = githubConfig();
  if (!cfg) return answer(503, { error: 'Publicar ainda não está configurado neste servidor. Nada foi publicado.' });

  try {
    const head = await branchHead(cfg, SAVE_BRANCH);
    if (head !== reviewed) {
      return answer(409, { error: 'Foram guardadas alterações novas desde que abriu esta página. Recarregue para as ver antes de publicar; nada foi publicado.' });
    }

    const waiting = assess(await compare(cfg, LIVE_BRANCH, SAVE_BRANCH));
    if (waiting.blocked.length) {
      return answer(409, { error: `Não é possível publicar agora: ${waiting.blocked.join(' ')} Fale com o programador; nada foi publicado.` });
    }
    if (!waiting.items.length) return answer(200, { nothing: true });

    const run = await latestRun(cfg, BUILD_WORKFLOW);
    if (!run || run.headSha !== head || run.status !== 'completed') {
      return answer(409, { error: 'A pré-visualização destas alterações ainda não está pronta. Espere que fique pronta, confira-a, e publique depois.' });
    }
    if (run.conclusion !== 'success') {
      return answer(409, { error: 'A pré-visualização destas alterações falhou, por isso não podem ser publicadas. Fale com o programador.' });
    }

    const list = waiting.items.map((i) => `- ${i.page}: ${i.fields}${i.by ? ` (${i.by})` : ''}`).join('\n');
    const title = `Publicar: ${[...new Set(waiting.items.map((i) => i.page))].join(', ')}`;
    const pr = await openPullRequest(cfg, LIVE_BRANCH, SAVE_BRANCH, title,
      `Publicado no admin por ${who.email}.\n\n${list}\n\nSó conteúdo das páginas; verificado antes de juntar.`);
    const merged = await mergePullRequest(cfg, pr.number, head, `${title} (#${pr.number})`);

    return answer(200, { merged: merged.sha, pr: pr.url, items: waiting.items.length });
  } catch (error) {
    if (error instanceof GitHubError && error.status === 409) {
      return answer(409, { error: 'Foi guardada uma alteração no momento de publicar. Recarregue e volte a tentar; nada foi publicado.' });
    }
    if (error instanceof GitHubError && error.status === 405) {
      return answer(409, { error: 'O GitHub não consegue juntar estas alterações automaticamente. Fale com o programador; nada foi publicado.' });
    }
    const status = error instanceof GitHubError ? error.status : 0;
    return answer(502, { error: `O GitHub não respondeu como esperado${status ? ` (${status})` : ''}. Nada foi publicado.` });
  }
};
