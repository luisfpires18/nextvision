/**
 * Cloudflare Access — verifying who is asking, on every admin request.
 *
 * Access sits in front of `/admin` on the prod Worker and only lets an allowlisted email
 * through (docs/ADMIN_DASHBOARD_PLAN.md §3.1). This is the second lock: the Worker
 * checks the signed token Access attaches, so a misconfigured or deleted Access policy
 * gives an admin that refuses everyone, never one that is open.
 *
 * FAILS CLOSED. Unset configuration, a missing token, an unreachable key endpoint, a bad
 * signature, the wrong audience or issuer, an expired token: every one of them returns
 * `null`, and `null` is a refusal. Nothing here throws to a caller.
 *
 * Pure and dependency-free (WebCrypto only), with `fetch` and the clock injectable, so
 * `npm run test:access` can drive it with its own keys and no network.
 */

export interface AccessConfig {
  /** `<team>.cloudflareaccess.com` — the token's issuer and the key endpoint's host. */
  teamDomain: string;
  /** The Access application's AUD tag. A token for any other application is refused. */
  aud: string;
}

export interface AccessIdentity { email: string }

type Fetcher = (url: string) => Promise<Response>;

/** Clock skew tolerated on `exp` and `nbf`, in seconds. */
const SKEW_S = 60;
/** How long the signing keys are trusted before they are fetched again. */
const KEYS_TTL_MS = 10 * 60_000;
/** An unknown `kid` forces a refetch (key rotation), but at most this often. */
const FORCED_REFETCH_MS = 60_000;

let cache: { team: string; at: number; keys: Map<string, CryptoKey> } | null = null;

function bytes(b64url: string): Uint8Array<ArrayBuffer> {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

const decode = (part: string): Record<string, unknown> =>
  JSON.parse(new TextDecoder().decode(bytes(part))) as Record<string, unknown>;

async function signingKeys(team: string, fetcher: Fetcher, force: boolean, now: number) {
  const fresh = cache && cache.team === team;
  if (fresh && !force && now - cache!.at < KEYS_TTL_MS) return cache!.keys;
  if (fresh && force && now - cache!.at < FORCED_REFETCH_MS) return cache!.keys;

  const res = await fetcher(`https://${team}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`access certs: ${res.status}`);
  const body = (await res.json()) as { keys?: (JsonWebKey & { kid?: string })[] };

  const keys = new Map<string, CryptoKey>();
  for (const jwk of body.keys ?? []) {
    if (jwk.kty !== 'RSA' || !jwk.kid) continue;
    keys.set(jwk.kid, await crypto.subtle.importKey(
      'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'],
    ));
  }
  cache = { team, at: now, keys };
  return keys;
}

export async function verifyAccessJwt(
  token: string | null | undefined,
  config: AccessConfig,
  { fetcher = fetch, now = Date.now() }: { fetcher?: Fetcher; now?: number } = {},
): Promise<AccessIdentity | null> {
  try {
    if (!token || !config.teamDomain || !config.aud) return null;
    const [head, payload, signature, extra] = token.split('.');
    if (!head || !payload || !signature || extra !== undefined) return null;

    // RS256 only. `none`, HS256 and anything else are refused before any key is touched.
    const header = decode(head);
    if (header['alg'] !== 'RS256' || typeof header['kid'] !== 'string') return null;
    const kid = header['kid'];

    let key = (await signingKeys(config.teamDomain, fetcher, false, now)).get(kid);
    key ??= (await signingKeys(config.teamDomain, fetcher, true, now)).get(kid);
    if (!key) return null;

    const signed = new TextEncoder().encode(`${head}.${payload}`);
    if (!(await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, bytes(signature), signed))) return null;

    const claims = decode(payload);
    const t = now / 1000;
    const aud = Array.isArray(claims['aud']) ? claims['aud'] : [claims['aud']];
    if (!aud.includes(config.aud)) return null;
    if (claims['iss'] !== `https://${config.teamDomain}`) return null;
    if (typeof claims['exp'] !== 'number' || claims['exp'] < t - SKEW_S) return null;
    if (typeof claims['nbf'] === 'number' && claims['nbf'] > t + SKEW_S) return null;
    if (typeof claims['email'] !== 'string' || claims['email'] === '') return null;

    return { email: claims['email'] };
  } catch {
    return null;
  }
}

/** Test seam: forget the cached signing keys. */
export const resetAccessKeys = (): void => { cache = null; };
