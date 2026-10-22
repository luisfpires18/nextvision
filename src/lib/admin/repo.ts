/**
 * Which repository the admin writes to, and with what — read from the Worker at request
 * time (docs/ADMIN_DASHBOARD_PLAN.md §3.1, decision A7).
 *
 * The three GITHUB_APP_* values are secrets on the prod Worker. Any one missing means
 * `null`, and `null` means the admin can show content but every publish answers "not
 * configured" — it never pretends to have published (CLAUDE.md §10 rule 14, applied here).
 *
 * Local development only: `GITHUB_API_URL` in `.dev.vars` points the admin at
 * `npm run mock:github`, a fake GitHub on this machine, and no credentials are sent.
 * `IS_DEV` is false in every build, so no deployed admin can be pointed anywhere else.
 */

import { IS_DEV, readEnv } from '../forms/env.ts';
import type { GitHubConfig } from './github.ts';

export const REPO = 'luisfpires18/nextvision';
/**
 * Decision A10: the owners publish straight to the live site. One Publicar commits every
 * draft to this branch, and that push IS the production deploy. `dev` is the developer's.
 */
export const PUBLISH_BRANCH = 'master';
/** The workflow that verifies and deploys the live site. */
export const DEPLOY_WORKFLOW = 'prod.yml';
export const GITHUB_API = 'https://api.github.com';

export function githubConfig(): GitHubConfig | null {
  const local = IS_DEV ? readEnv('GITHUB_API_URL') : undefined;
  if (local) {
    return { appId: 'local', installationId: 'local', privateKey: '', repo: REPO, branch: PUBLISH_BRANCH, apiBase: local, anonymous: true };
  }
  const appId = readEnv('GITHUB_APP_ID');
  const installationId = readEnv('GITHUB_APP_INSTALLATION_ID');
  const privateKey = readEnv('GITHUB_APP_PRIVATE_KEY');
  if (!appId || !installationId || !privateKey) return null;
  return { appId, installationId, privateKey, repo: REPO, branch: PUBLISH_BRANCH, apiBase: GITHUB_API };
}
