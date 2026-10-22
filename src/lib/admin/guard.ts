/**
 * Who is this admin request from — or nobody.
 *
 * On the prod Worker: the Access token, verified against the configured team and AUD
 * (access.ts). Unset configuration is a refusal, so a Worker without the two variables
 * serves an admin that lets no one in.
 *
 * In `astro dev` on localhost only, there is no Access in front of the server, so the
 * check is skipped and the identity says so. `IS_DEV` is false in every build, so this
 * branch does not exist in anything deployed — the same line the contact form's dev sink
 * relies on (src/lib/forms/env.ts).
 */

import { ENV_KEYS, IS_DEV, readEnv } from '../forms/env.ts';
import { verifyAccessJwt, type AccessIdentity } from './access.ts';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export async function adminIdentity(request: Request): Promise<AccessIdentity | null> {
  if (IS_DEV) {
    return LOCAL_HOSTS.has(new URL(request.url).hostname) ? { email: 'desenvolvimento local' } : null;
  }
  return verifyAccessJwt(request.headers.get('cf-access-jwt-assertion'), {
    teamDomain: readEnv(ENV_KEYS.accessTeamDomain) ?? '',
    aud: readEnv(ENV_KEYS.accessAud) ?? '',
  });
}

/** Where Access ends the session. Same origin, handled by Access itself. */
export const LOGOUT_PATH = '/cdn-cgi/access/logout';
