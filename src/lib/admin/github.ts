/**
 * The admin's hands on the repository: read a file on `dev`, commit a file to `dev`, and
 * read the state of the build that commit started (docs/ADMIN_DASHBOARD_PLAN.md §4).
 *
 * It authenticates as the GitHub App "nvf-admin-luisfpires18", installed on this one
 * repository with contents:write, pull_requests:write and actions:read and nothing else.
 * The App signs a 10-minute JWT with its private key (WebCrypto, no dependency), trades
 * it for an installation token that lasts an hour, and reuses that token until shortly
 * before it expires. Nothing long-lived ever leaves the Worker's secrets.
 *
 * Pure apart from `fetch`, which is injectable, so `npm run test:admin` drives it against
 * a fake GitHub with its own keys.
 */

export interface GitHubConfig {
  appId: string;
  installationId: string;
  /** PKCS#8 PEM (`-----BEGIN PRIVATE KEY-----`). */
  privateKey: string;
  /** `owner/name`. */
  repo: string;
  /** The branch saves go to. Always `dev`: publishing is a separate, deliberate step. */
  branch: string;
  apiBase: string;
  /** Local development against a fake GitHub only: send no credentials at all. */
  anonymous?: boolean;
}

export class GitHubError extends Error {
  readonly status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;
interface Opts { fetcher?: Fetcher; now?: number }

let cached: { key: string; token: string; expires: number } | null = null;

const b64url = (bytes: Uint8Array): string => {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const utf8 = new TextEncoder();

/**
 * Git's own name for a file's content: SHA-1 of `blob <bytes>\0<content>`. It is what the
 * contents API reports as `sha`, so after a save the editor can carry on from the files it
 * just wrote without reading them back.
 */
export async function gitBlobSha(text: string): Promise<string> {
  const body = utf8.encode(text);
  const head = utf8.encode(`blob ${body.byteLength}\0`);
  const all = new Uint8Array(head.byteLength + body.byteLength);
  all.set(head);
  all.set(body, head.byteLength);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-1', all));
  return [...digest].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Base64 (with GitHub's line breaks) to UTF-8 text. */
export function fromBase64(b64: string): string {
  const bin = atob(b64.replace(/\s+/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

async function appJwt(cfg: GitHubConfig, now: number): Promise<string> {
  const der = Uint8Array.from(atob(cfg.privateKey.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const t = Math.floor(now / 1000);
  // iat is backdated 60 s, as GitHub recommends for clock drift; exp stays under its 10 min cap.
  const unsigned = `${b64url(utf8.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))}.${b64url(utf8.encode(JSON.stringify({ iat: t - 60, exp: t + 540, iss: cfg.appId })))}`;
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, utf8.encode(unsigned)));
  return `${unsigned}.${b64url(sig)}`;
}

const HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'nvf-admin',
};

async function token(cfg: GitHubConfig, fetcher: Fetcher, now: number): Promise<string | null> {
  if (cfg.anonymous) return null;
  const key = `${cfg.apiBase}|${cfg.appId}|${cfg.installationId}`;
  // Reused until five minutes before it expires, so a save never starts on a dying token.
  if (cached && cached.key === key && cached.expires - now > 5 * 60_000) return cached.token;

  const res = await fetcher(`${cfg.apiBase}/app/installations/${cfg.installationId}/access_tokens`, {
    method: 'POST',
    headers: { ...HEADERS, Authorization: `Bearer ${await appJwt(cfg, now)}` },
  });
  if (!res.ok) throw new GitHubError(res.status, `GitHub refused the App login (${res.status})`);
  const body = (await res.json()) as { token?: string; expires_at?: string };
  if (!body.token) throw new GitHubError(502, 'GitHub returned no installation token');
  cached = { key, token: body.token, expires: body.expires_at ? Date.parse(body.expires_at) : now + 3_600_000 };
  return body.token;
}

async function call(cfg: GitHubConfig, path: string, init: RequestInit, { fetcher = fetch, now = Date.now() }: Opts) {
  const t = await token(cfg, fetcher, now);
  return fetcher(`${cfg.apiBase}${path}`, {
    ...init,
    headers: { ...HEADERS, ...(t ? { Authorization: `Bearer ${t}` } : {}), ...(init.headers ?? {}) },
  });
}

const contentsPath = (cfg: GitHubConfig, file: string) =>
  `/repos/${cfg.repo}/contents/${file.split('/').map(encodeURIComponent).join('/')}`;

/** The file as it is on the save branch now, and the blob SHA a save must name. */
export async function readFile(cfg: GitHubConfig, file: string, opts: Opts = {}): Promise<{ text: string; sha: string }> {
  const res = await call(cfg, `${contentsPath(cfg, file)}?ref=${encodeURIComponent(cfg.branch)}`, {}, opts);
  if (!res.ok) throw new GitHubError(res.status, `could not read ${file} (${res.status})`);
  const body = (await res.json()) as { content?: string; sha?: string; encoding?: string };
  if (body.encoding !== 'base64' || typeof body.content !== 'string' || !body.sha) {
    throw new GitHubError(502, `unexpected answer reading ${file}`);
  }
  return { text: fromBase64(body.content), sha: body.sha };
}

async function json<T>(res: Response, what: string): Promise<T> {
  if (!res.ok) throw new GitHubError(res.status, `${what} (${res.status})`);
  return (await res.json()) as T;
}

/**
 * Commit one or more files to the save branch as ONE commit, or not at all.
 *
 * `expected` maps each path to the blob SHA the editor opened. Every one is checked
 * against the branch head before anything is written, and the branch is then moved with a
 * fast-forward-only update, so a save that raced another one is refused (409) instead of
 * overwriting it. A screen that touches two files can never land half-saved. A file given
 * as `remove` is deleted in the same commit, checked against its SHA the same way.
 */
/** Every file in a tree (a commit's, or a branch's), path → blob SHA. */
async function treeBlobs(cfg: GitHubConfig, tree: string, opts: Opts): Promise<Map<string, string>> {
  const body = await json<{ tree: { path: string; type: string; sha: string }[]; truncated?: boolean }>(
    await call(cfg, `/repos/${cfg.repo}/git/trees/${encodeURIComponent(tree)}?recursive=1`, {}, opts), 'could not list the files');
  if (body.truncated) throw new GitHubError(502, 'the file list came back truncated');
  return new Map(body.tree.filter((e) => e.type === 'blob').map((e) => [e.path, e.sha]));
}

/** The paths under `dir/` on the save branch now, sorted. */
export async function listFiles(cfg: GitHubConfig, dir: string, opts: Opts = {}): Promise<string[]> {
  const blobs = await treeBlobs(cfg, cfg.branch, opts);
  return [...blobs.keys()].filter((p) => p.startsWith(`${dir}/`) && !p.slice(dir.length + 1).includes('/')).sort();
}

export async function commitFiles(
  cfg: GitHubConfig,
  files: ({ path: string; text: string } | { path: string; remove: true })[],
  expected: Record<string, string>,
  message: string,
  opts: Opts = {},
): Promise<{ commit: string; url: string }> {
  const repo = `/repos/${cfg.repo}`;
  const ref = await json<{ object: { sha: string } }>(
    await call(cfg, `${repo}/git/ref/heads/${encodeURIComponent(cfg.branch)}`, {}, opts), 'could not read the branch');
  const head = ref.object.sha;

  const parent = await json<{ tree: { sha: string } }>(
    await call(cfg, `${repo}/git/commits/${head}`, {}, opts), 'could not read the head commit');
  // One tree listing checks every file, so a commit of twenty files costs one call, not
  // twenty (a Worker has a budget of subrequests per request).
  const blobs = await treeBlobs(cfg, parent.tree.sha, opts);
  for (const f of files) {
    if (blobs.get(f.path) !== expected[f.path]) throw new GitHubError(409, `${f.path} changed since it was opened`);
  }

  const post = (path: string, body: unknown) =>
    call(cfg, `${repo}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, opts);

  const tree = await json<{ sha: string }>(await post('/git/trees', {
    base_tree: parent.tree.sha,
    // `sha: null` is how the trees API deletes a path.
    tree: files.map((f) => ({ path: f.path, mode: '100644', type: 'blob', ...('remove' in f ? { sha: null } : { content: f.text }) })),
  }), 'could not build the commit');
  const commit = await json<{ sha: string; html_url?: string }>(
    await post('/git/commits', { message, tree: tree.sha, parents: [head] }), 'could not create the commit');

  const moved = await call(cfg, `${repo}/git/refs/heads/${encodeURIComponent(cfg.branch)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sha: commit.sha, force: false }),
  }, opts);
  if (moved.status === 422 || moved.status === 409) throw new GitHubError(409, `${cfg.branch} moved while saving`);
  if (!moved.ok) throw new GitHubError(moved.status, `could not move ${cfg.branch} (${moved.status})`);

  return { commit: commit.sha, url: commit.html_url ?? `https://github.com/${cfg.repo}/commit/${commit.sha}` };
}

export interface BuildRun {
  status: 'queued' | 'in_progress' | 'completed' | string;
  conclusion: 'success' | 'failure' | 'cancelled' | string | null;
  headSha: string;
  url: string;
  createdAt: string;
}

/** The newest run of a workflow on a branch (the save branch unless told otherwise). */
export async function latestRun(cfg: GitHubConfig, workflow: string, opts: Opts = {}, branch = cfg.branch): Promise<BuildRun | null> {
  const res = await call(
    cfg,
    `/repos/${cfg.repo}/actions/workflows/${encodeURIComponent(workflow)}/runs?branch=${encodeURIComponent(branch)}&per_page=1`,
    {}, opts,
  );
  if (!res.ok) throw new GitHubError(res.status, `could not read the build status (${res.status})`);
  const body = (await res.json()) as { workflow_runs?: { status: string; conclusion: string | null; head_sha: string; html_url: string; created_at: string }[] };
  const run = body.workflow_runs?.[0];
  return run ? { status: run.status, conclusion: run.conclusion, headSha: run.head_sha, url: run.html_url, createdAt: run.created_at } : null;
}

/** The commit a branch points at now. */
export async function branchHead(cfg: GitHubConfig, branch: string, opts: Opts = {}): Promise<string> {
  const ref = await json<{ object: { sha: string } }>(
    await call(cfg, `/repos/${cfg.repo}/git/ref/heads/${encodeURIComponent(branch)}`, {}, opts), `could not read ${branch}`);
  return ref.object.sha;
}

/** Test seam: forget the cached installation token. */
export const resetGitHubToken = (): void => { cached = null; };
