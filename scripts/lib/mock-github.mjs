/**
 * A fake GitHub with exactly the endpoints the admin calls, in memory.
 *
 * Used two ways:
 *   - by scripts/test-admin.mjs, in-process, as the `fetcher` the GitHub client takes;
 *   - by `npm run mock:github`, as a local server that `astro dev` can be pointed at with
 *     GITHUB_API_URL in .dev.vars, so the whole save-and-publish flow can be clicked
 *     through locally without touching the real repository.
 *
 * It models what the admin depends on and nothing more: blob SHAs computed the way git
 * computes them (so the editor's freshness checks are real), fast-forward-only ref
 * updates (so a race is a 422, as on GitHub), who made each commit (the publish rule
 * reads it), comparisons, pull requests merged only at the reviewed SHA, and one build
 * run per push that goes queued → in_progress → completed.
 */

import { createHash, randomBytes, verify as rsaVerify } from 'node:crypto';

export const ADMIN_BOT = 'nvf-admin-luisfpires18[bot]';
const PERSON = 'luisfpires18';

export const gitBlobSha = (text) => {
  const body = Buffer.from(text, 'utf8');
  return createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${body.length}\0`), body])).digest('hex');
};

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const id = () => randomBytes(20).toString('hex');

/**
 * @param {{ repo: string, branch: string, live?: string, files: Record<string, string>, appId?: string,
 *           publicKey?: import('node:crypto').KeyObject, buildMs?: number, now?: () => number }} opts
 */
export function createMockGitHub({ repo, branch, live = 'master', files, appId, publicKey, buildMs = 4000, now = Date.now }) {
  const trees = new Map();
  const commits = new Map();
  const refs = new Map();
  const runs = [];
  const pulls = [];
  const tokens = { minted: 0 };
  let order = 0;

  const addCommit = (tree, parents, message, author) => {
    const sha = id();
    commits.set(sha, { tree, parents, message, author, n: order++, date: new Date(now()).toISOString() });
    return sha;
  };

  const rootTree = id();
  trees.set(rootTree, new Map(Object.entries(files)));
  const root = addCommit(rootTree, [], 'initial', PERSON);
  refs.set(branch, root);
  refs.set(live, root);

  const treeOf = (sha) => trees.get(commits.get(sha).tree);
  const treeAt = (ref) => {
    const sha = refs.get(ref) ?? (commits.has(ref) ? ref : null);
    return sha ? treeOf(sha) : null;
  };
  const ancestors = (sha) => {
    const seen = new Set();
    const stack = [sha];
    while (stack.length) {
      const s = stack.pop();
      if (seen.has(s)) continue;
      seen.add(s);
      stack.push(...commits.get(s).parents);
    }
    return seen;
  };
  const push = (name, sha) => {
    refs.set(name, sha);
    runs.push({ n: runs.length + 1, branch: name, head: sha, at: now(), conclusion: 'success' });
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
    if (method === 'GET' && (m = rest.match(/^\/git\/trees\/(.+)$/))) {
      const ref = decodeURIComponent(m[1]);
      const tree = trees.get(ref) ?? treeAt(ref);
      if (!tree) return json(404, { message: 'Not Found' });
      return json(200, { tree: [...tree].map(([p, text]) => ({ path: p, type: 'blob', sha: gitBlobSha(text) })), truncated: false });
    }
    if (method === 'POST' && rest === '/git/trees') {
      const base = trees.get(body.base_tree);
      if (!base) return json(422, { message: 'base_tree not found' });
      const next = new Map(base);
      for (const entry of body.tree) { if (entry.sha === null) next.delete(entry.path); else next.set(entry.path, entry.content); }
      const sha = id();
      trees.set(sha, next);
      return json(201, { sha });
    }
    if (method === 'POST' && rest === '/git/commits') {
      if (!trees.has(body.tree)) return json(422, { message: 'tree not found' });
      const sha = addCommit(body.tree, body.parents, body.message, ADMIN_BOT);
      return json(201, { sha, html_url: `https://github.com/${repo}/commit/${sha}` });
    }
    if (method === 'PATCH' && (m = rest.match(/^\/git\/refs\/heads\/(.+)$/))) {
      const name = decodeURIComponent(m[1]);
      const c = commits.get(body.sha);
      if (!c) return json(422, { message: 'commit not found' });
      if (!body.force && !c.parents.includes(refs.get(name))) return json(422, { message: 'Update is not a fast forward' });
      push(name, body.sha);
      return json(200, { object: { sha: body.sha } });
    }
    if (method === 'GET' && (m = rest.match(/^\/compare\/(.+)\.\.\.(.+)$/))) {
      const base = refs.get(decodeURIComponent(m[1]));
      const head = refs.get(decodeURIComponent(m[2]));
      if (!base || !head) return json(404, { message: 'Not Found' });
      const inBase = ancestors(base);
      const ahead = [...ancestors(head)].filter((s) => !inBase.has(s)).sort((a, b) => commits.get(a).n - commits.get(b).n);
      // Merge base: the newest commit both histories share.
      const shared = [...ancestors(head)].filter((s) => inBase.has(s)).sort((a, b) => commits.get(b).n - commits.get(a).n)[0];
      const from = treeOf(shared);
      const to = treeOf(head);
      const changed = [...new Set([...from.keys(), ...to.keys()])].filter((p) => from.get(p) !== to.get(p));
      return json(200, {
        ahead_by: ahead.length,
        commits: ahead.map((s) => ({ sha: s, author: { login: commits.get(s).author }, commit: { message: commits.get(s).message, author: { date: commits.get(s).date } } })),
        files: changed.map((filename) => ({ filename })),
      });
    }
    if (method === 'GET' && rest === '/pulls') {
      const head = u.searchParams.get('head')?.split(':')[1];
      const base = u.searchParams.get('base');
      return json(200, pulls.filter((p) => p.state === 'open' && p.head === head && p.base === base)
        .map((p) => ({ number: p.number, html_url: `https://github.com/${repo}/pull/${p.number}` })));
    }
    if (method === 'POST' && rest === '/pulls') {
      const pr = { number: pulls.length + 100, head: body.head, base: body.base, title: body.title, state: 'open' };
      pulls.push(pr);
      return json(201, { number: pr.number, html_url: `https://github.com/${repo}/pull/${pr.number}` });
    }
    if (method === 'PUT' && (m = rest.match(/^\/pulls\/(\d+)\/merge$/))) {
      const pr = pulls.find((p) => p.number === Number(m[1]) && p.state === 'open');
      if (!pr) return json(405, { message: 'Pull Request is not mergeable' });
      if (refs.get(pr.head) !== body.sha) return json(409, { message: 'Head branch was modified. Review and try the merge again.' });
      const merge = addCommit(commits.get(body.sha).tree, [refs.get(pr.base), body.sha], body.commit_title ?? `Merge pull request #${pr.number}`, ADMIN_BOT);
      push(pr.base, merge);
      pr.state = 'closed';
      return json(200, { sha: merge, merged: true });
    }
    if (method === 'GET' && (m = rest.match(/^\/actions\/workflows\/[^/]+\/runs$/))) {
      const on = u.searchParams.get('branch');
      const latest = runs.filter((r) => !on || r.branch === on).at(-1);
      return json(200, { workflow_runs: latest ? [runView(latest)] : [] });
    }
    return json(404, { message: `mock: ${method} ${rest} not modelled` });
  }

  return {
    handle,
    tokens,
    head: (name = branch) => refs.get(name),
    file: (path, name = branch) => treeAt(name)?.get(path),
    message: (name = branch) => commits.get(refs.get(name)).message,
    /** Simulate a commit by someone else (by default the developer, not the admin). */
    pushElsewhere(path, text, { on = branch, author = PERSON } = {}) {
      const tree = new Map(treeAt(on));
      tree.set(path, text);
      const t = id(); trees.set(t, tree);
      push(on, addCommit(t, [refs.get(on)], 'elsewhere', author));
    },
    runs,
    pulls,
  };
}
