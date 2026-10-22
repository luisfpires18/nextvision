/**
 * A fake GitHub with exactly the endpoints the admin calls, in memory.
 *
 * Used two ways:
 *   - by scripts/test-admin.mjs, in-process, as the `fetcher` the GitHub client takes;
 *   - by `npm run mock:github`, as a local server that `astro dev` can be pointed at with
 *     GITHUB_API_URL in .dev.vars, so the whole save flow can be clicked through locally
 *     without touching the real repository.
 *
 * It models what the admin depends on and nothing more: blob SHAs computed the way git
 * computes them (so the editor's freshness checks are real), fast-forward-only ref
 * updates (so a race is a 422, as on GitHub), and one build run per push that goes
 * queued → in_progress → completed.
 */

import { createHash, randomBytes, verify as rsaVerify } from 'node:crypto';

export const gitBlobSha = (text) => {
  const body = Buffer.from(text, 'utf8');
  return createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${body.length}\0`), body])).digest('hex');
};

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const id = () => randomBytes(20).toString('hex');

/**
 * @param {{ repo: string, branch: string, files: Record<string, string>, appId?: string,
 *           publicKey?: import('node:crypto').KeyObject, buildMs?: number, now?: () => number }} opts
 */
export function createMockGitHub({ repo, branch, files, appId, publicKey, buildMs = 4000, now = Date.now }) {
  const trees = new Map();
  const commits = new Map();
  const refs = new Map();
  const runs = [];
  const tokens = { minted: 0 };

  const rootTree = id();
  trees.set(rootTree, new Map(Object.entries(files)));
  const root = id();
  commits.set(root, { tree: rootTree, parents: [], message: 'initial' });
  refs.set(branch, root);

  const treeAt = (ref) => {
    const sha = refs.get(ref) ?? (commits.has(ref) ? ref : null);
    return sha ? trees.get(commits.get(sha).tree) : null;
  };

  const runView = (r) => {
    const age = now() - r.at;
    const status = age < buildMs / 4 ? 'queued' : age < buildMs ? 'in_progress' : 'completed';
    return {
      status,
      conclusion: status === 'completed' ? r.conclusion : null,
      head_sha: r.head,
      html_url: `https://github.com/${repo}/actions/runs/${r.n}`,
      created_at: new Date(r.at).toISOString(),
    };
  };

  function checkJwt(header) {
    if (!publicKey) return true;
    const jwt = (header ?? '').replace(/^Bearer /, '');
    const [h, p, s] = jwt.split('.');
    if (!h || !p || !s) return false;
    if (!rsaVerify('RSA-SHA256', Buffer.from(`${h}.${p}`), publicKey, Buffer.from(s, 'base64url'))) return false;
    const claims = JSON.parse(Buffer.from(p, 'base64url').toString());
    const t = Math.floor(now() / 1000);
    return claims.iss === appId && claims.exp > t && claims.iat <= t;
  }

  async function handle(url, init = {}) {
    const u = new URL(url);
    const method = (init.method ?? 'GET').toUpperCase();
    const body = init.body ? JSON.parse(init.body) : null;
    const path = u.pathname;
    const repoBase = `/repos/${repo}`;

    let m;
    if (method === 'POST' && (m = path.match(/^\/app\/installations\/[^/]+\/access_tokens$/))) {
      if (!checkJwt(init.headers?.Authorization)) return json(401, { message: 'Bad credentials' });
      tokens.minted += 1;
      return json(201, { token: `mock-${tokens.minted}`, expires_at: new Date(now() + 3_600_000).toISOString() });
    }
    if (!path.startsWith(repoBase)) return json(404, { message: 'Not Found' });
    const rest = path.slice(repoBase.length);

    if (method === 'GET' && (m = rest.match(/^\/contents\/(.+)$/))) {
      const file = decodeURIComponent(m[1]);
      const tree = treeAt(u.searchParams.get('ref') ?? branch);
      const text = tree?.get(file);
      if (text === undefined) return json(404, { message: 'Not Found' });
      return json(200, { encoding: 'base64', content: Buffer.from(text).toString('base64').replace(/.{60}/g, '$&\n'), sha: gitBlobSha(text) });
    }
    if (method === 'GET' && (m = rest.match(/^\/git\/ref\/heads\/(.+)$/))) {
      const sha = refs.get(decodeURIComponent(m[1]));
      return sha ? json(200, { object: { sha } }) : json(404, { message: 'Not Found' });
    }
    if (method === 'GET' && (m = rest.match(/^\/git\/commits\/([0-9a-f]+)$/))) {
      const c = commits.get(m[1]);
      return c ? json(200, { sha: m[1], tree: { sha: c.tree } }) : json(404, { message: 'Not Found' });
    }
    if (method === 'POST' && rest === '/git/trees') {
      const base = trees.get(body.base_tree);
      if (!base) return json(422, { message: 'base_tree not found' });
      const next = new Map(base);
      for (const entry of body.tree) next.set(entry.path, entry.content);
      const sha = id();
      trees.set(sha, next);
      return json(201, { sha });
    }
    if (method === 'POST' && rest === '/git/commits') {
      if (!trees.has(body.tree)) return json(422, { message: 'tree not found' });
      const sha = id();
      commits.set(sha, { tree: body.tree, parents: body.parents, message: body.message });
      return json(201, { sha, html_url: `https://github.com/${repo}/commit/${sha}` });
    }
    if (method === 'PATCH' && (m = rest.match(/^\/git\/refs\/heads\/(.+)$/))) {
      const name = decodeURIComponent(m[1]);
      const c = commits.get(body.sha);
      if (!c) return json(422, { message: 'commit not found' });
      if (!body.force && !c.parents.includes(refs.get(name))) return json(422, { message: 'Update is not a fast forward' });
      refs.set(name, body.sha);
      runs.push({ n: runs.length + 1, head: body.sha, at: now(), conclusion: 'success' });
      return json(200, { object: { sha: body.sha } });
    }
    if (method === 'GET' && (m = rest.match(/^\/actions\/workflows\/[^/]+\/runs$/))) {
      const latest = runs[runs.length - 1];
      return json(200, { workflow_runs: latest ? [runView(latest)] : [] });
    }
    return json(404, { message: `mock: ${method} ${rest} not modelled` });
  }

  return {
    handle,
    tokens,
    head: () => refs.get(branch),
    file: (path) => treeAt(branch)?.get(path),
    message: () => commits.get(refs.get(branch)).message,
    /** Simulate someone else pushing to the branch. */
    pushElsewhere(path, text) {
      const tree = new Map(treeAt(branch));
      tree.set(path, text);
      const t = id(); trees.set(t, tree);
      const c = id(); commits.set(c, { tree: t, parents: [refs.get(branch)], message: 'elsewhere' });
      refs.set(branch, c);
    },
    runs,
  };
}
