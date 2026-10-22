/**
 * test:access — the admin's Access token check, driven with its own keys.
 *
 * Signs real RS256 tokens with a throwaway key, serves that key as the team's JWKS
 * through an injected fetch, and asserts that exactly one shape of token gets in. Every
 * other case must be refused: that is what "fails closed" means, and this is where it is
 * proved rather than claimed. No network, no account, no secret.
 *
 * Usage: npm run test:access
 */

import assert from 'node:assert/strict';
import { verifyAccessJwt, resetAccessKeys } from '../src/lib/admin/access.ts';

const TEAM = 'example-team.cloudflareaccess.com';
const AUD = 'a'.repeat(64);
const CONFIG = { teamDomain: TEAM, aud: AUD };
const NOW = Date.UTC(2026, 9, 22, 12);
const t = NOW / 1000;

const b64url = (data) => Buffer.from(data).toString('base64url');
const keypair = async () => crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true, ['sign', 'verify'],
);

const good = await keypair();
const rogue = await keypair();
const jwk = { ...(await crypto.subtle.exportKey('jwk', good.publicKey)), kid: 'k1' };

let certFetches = 0;
const fetcher = async (url) => {
  certFetches += 1;
  assert.equal(url, `https://${TEAM}/cdn-cgi/access/certs`);
  return new Response(JSON.stringify({ keys: [jwk] }), { status: 200 });
};
const down = async () => new Response('', { status: 503 });

async function sign(claims, { key = good.privateKey, header = { alg: 'RS256', kid: 'k1', typ: 'JWT' } } = {}) {
  const head = b64url(JSON.stringify(header));
  const body = b64url(JSON.stringify(claims));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${head}.${body}`));
  return `${head}.${body}.${b64url(new Uint8Array(sig))}`;
}

const valid = { aud: [AUD], iss: `https://${TEAM}`, email: 'owner@example.com', iat: t - 10, nbf: t - 10, exp: t + 3600 };
const check = (token, opts = {}) => verifyAccessJwt(token, opts.config ?? CONFIG, { fetcher: opts.fetcher ?? fetcher, now: NOW });

const cases = [
  ['a valid token is accepted', await sign(valid), { email: 'owner@example.com' }],
  ['aud as a bare string is accepted', await sign({ ...valid, aud: AUD }), { email: 'owner@example.com' }],
  ['no token', null, null],
  ['empty token', '', null],
  ['garbage', 'not.a.jwt', null],
  ['four segments', `${await sign(valid)}.x`, null],
  ['wrong audience', await sign({ ...valid, aud: ['b'.repeat(64)] }), null],
  ['wrong issuer', await sign({ ...valid, iss: 'https://evil.cloudflareaccess.com' }), null],
  ['expired', await sign({ ...valid, exp: t - 120 }), null],
  ['not yet valid', await sign({ ...valid, nbf: t + 600 }), null],
  ['no exp', await sign({ ...valid, exp: undefined }), null],
  ['no email', await sign({ ...valid, email: '' }), null],
  ['signed by another key', await sign(valid, { key: rogue.privateKey }), null],
  ['unknown kid', await sign(valid, { header: { alg: 'RS256', kid: 'nope' } }), null],
  ['alg none', `${b64url(JSON.stringify({ alg: 'none', kid: 'k1' }))}.${b64url(JSON.stringify(valid))}.`, null],
  ['alg HS256', await sign(valid, { header: { alg: 'HS256', kid: 'k1' } }), null],
  ['tampered payload', (await sign(valid)).replace(/^([^.]+)\.[^.]+/, (_, h) => `${h}.${b64url(JSON.stringify({ ...valid, email: 'attacker@example.com' }))}`), null],
];

let failed = 0;
for (const [name, token, expected] of cases) {
  resetAccessKeys();
  const got = await check(token);
  try { assert.deepEqual(got, expected); console.log(`  ok    ${name}`); }
  catch { failed += 1; console.log(`  FAIL  ${name}: got ${JSON.stringify(got)}`); }
}

// Configuration and infrastructure failures: refused, never thrown, never waved through.
const token = await sign(valid);
for (const [name, opts] of [
  ['AUD unset', { config: { teamDomain: TEAM, aud: '' } }],
  ['team domain unset', { config: { teamDomain: '', aud: AUD } }],
  ['key endpoint down', { fetcher: down }],
  ['key endpoint throws', { fetcher: async () => { throw new Error('offline'); } }],
]) {
  resetAccessKeys();
  const got = await check(token, opts);
  if (got === null) console.log(`  ok    ${name} -> refused`);
  else { failed += 1; console.log(`  FAIL  ${name}: got ${JSON.stringify(got)}`); }
}

// Keys are cached: a second valid request does not refetch them.
resetAccessKeys();
certFetches = 0;
await check(token);
await check(token);
if (certFetches === 1) console.log('  ok    signing keys fetched once and cached');
else { failed += 1; console.log(`  FAIL  expected 1 key fetch, saw ${certFetches}`); }

console.log(failed ? `\n${failed} failed` : `\nall ${cases.length + 5} checks passed — the admin token check fails closed`);
process.exit(failed ? 1 : 0);
