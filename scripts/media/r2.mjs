/**
 * r2.mjs — the S3-compatible client for R2, with no dependencies.
 *
 * Wrangler can put and delete an R2 object but cannot LIST one, and a sync that cannot
 * list is a sync that cannot tell you what it is about to do. So the primary path is the
 * S3 API (CLAUDE.md §6), signed here with SigV4 and about a hundred lines of crypto,
 * rather than pulling a 20 MB AWS SDK into a static site's toolchain.
 *
 * SECURITY: credentials are read from the environment or from .env, are never written to
 * a manifest, a ledger, a log line or an error message, and never reach the browser. The
 * site itself uses no credentials at all — it emits plain HTTPS URLs.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

import { ROOT } from './recipe.mjs';

const REGION = 'auto';
const SERVICE = 's3';

/* ═══════════════════════════════════════════════════════════ configuration ══ */

/** Minimal .env reader. Never logged, never echoed. */
async function dotenv() {
  const out = {};
  try {
    const text = await fs.readFile(path.join(ROOT, '.env'), 'utf8');
    for (const line of text.split('\n')) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* no .env is a normal state */ }
  return out;
}

/**
 * What we have, and what is missing. Returns `null` for `credentials` rather than
 * throwing, so a dry run can still describe the plan on a machine with no keys.
 */
export async function r2Config() {
  const env = { ...await dotenv(), ...process.env };
  const accountId = env['R2_ACCOUNT_ID'] || env['CLOUDFLARE_ACCOUNT_ID'] || '';
  const bucket = env['R2_BUCKET'] || '';
  const accessKeyId = env['R2_ACCESS_KEY_ID'] || '';
  const secretAccessKey = env['R2_SECRET_ACCESS_KEY'] || '';
  const missing = [
    !accountId && 'R2_ACCOUNT_ID',
    !bucket && 'R2_BUCKET',
    !accessKeyId && 'R2_ACCESS_KEY_ID',
    !secretAccessKey && 'R2_SECRET_ACCESS_KEY',
  ].filter(Boolean);

  return {
    accountId,
    bucket,
    missing,
    endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '',
    credentials: missing.length ? null : { accessKeyId, secretAccessKey },
  };
}

/* ═════════════════════════════════════════════════════════════════── sigv4 ══ */

const sha256Hex = (data) => crypto.createHash('sha256').update(data).digest('hex');
const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest();

/** Each path segment encoded, the separators left alone — S3's canonical URI rule. */
const canonicalUri = (key) =>
  `/${key.split('/').map((s) => encodeURIComponent(s)).join('/')}`;

function sign({ method, host, uri, query, headers, payloadHash, credentials }) {
  const now = new Date();
  const amzDate = `${now.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`;
  const date = amzDate.slice(0, 8);
  const scope = `${date}/${REGION}/${SERVICE}/aws4_request`;

  /** Lower-cased on the way in, so signing and sending can never disagree. */
  const all = {};
  for (const [k, v] of Object.entries(headers)) all[k.toLowerCase()] = String(v).trim();
  all['host'] = host;
  all['x-amz-content-sha256'] = payloadHash;
  all['x-amz-date'] = amzDate;

  const names = Object.keys(all).sort();
  const canonicalHeaders = names.map((n) => `${n}:${all[n]}\n`).join('');
  const signedHeaders = names.join(';');

  const canonicalRequest = [
    method, uri, query, canonicalHeaders, signedHeaders, payloadHash,
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256', amzDate, scope, sha256Hex(canonicalRequest),
  ].join('\n');

  let key = hmac(`AWS4${credentials.secretAccessKey}`, date);
  key = hmac(key, REGION);
  key = hmac(key, SERVICE);
  key = hmac(key, 'aws4_request');
  const signature = crypto.createHmac('sha256', key).update(stringToSign).digest('hex');

  return {
    ...all,
    Authorization: `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${scope}, `
      + `SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

async function request(cfg, { method, key = '', query = '', body = null, headers = {} }) {
  const host = new URL(cfg.endpoint).host;
  const uri = key ? `/${cfg.bucket}${canonicalUri(key)}` : `/${cfg.bucket}`;
  const payloadHash = sha256Hex(body ?? '');
  const signed = sign({
    method, host, uri, query, headers, payloadHash, credentials: cfg.credentials,
  });
  const url = `${cfg.endpoint}${uri}${query ? `?${query}` : ''}`;
  const response = await fetch(url, { method, headers: signed, body: body ?? undefined });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    // The URL and status only. Never the headers — they carry the signature.
    throw new Error(`R2 ${method} ${uri} → ${response.status}. ${text.slice(0, 300)}`);
  }
  return response;
}

/* ══════════════════════════════════════════════════════════════ operations ══ */

/** Every object key in the bucket, paged. */
export async function listObjects(cfg, prefix = '') {
  const keys = new Map();
  let token = null;
  do {
    const params = new URLSearchParams({ 'list-type': '2', 'max-keys': '1000' });
    if (prefix) params.set('prefix', prefix);
    if (token) params.set('continuation-token', token);
    // S3 requires the canonical query string sorted by key.
    const query = [...params.entries()].sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');

    const xml = await (await request(cfg, { method: 'GET', query })).text();
    for (const m of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const key = /<Key>([\s\S]*?)<\/Key>/.exec(m[1])?.[1];
      const size = Number(/<Size>(\d+)<\/Size>/.exec(m[1])?.[1] ?? 0);
      if (key) keys.set(decodeXml(key), size);
    }
    token = /<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/.exec(xml)?.[1] ?? null;
    if (token) token = decodeXml(token);
  } while (token);
  return keys;
}

const decodeXml = (s) => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/**
 * One object's bytes. READ ONLY — this module's only non-mutating single-key operation,
 * and the one CI uses: a clean checkout has no media sources, so `media:build` cannot
 * reproduce the mirror there and it has to be fetched from the bucket that already holds
 * it byte for byte.
 */
export async function getObject(cfg, key) {
  const response = await request(cfg, { method: 'GET', key });
  return Buffer.from(await response.arrayBuffer());
}

export async function putObject(cfg, key, body, { contentType, cacheControl }) {
  await request(cfg, {
    method: 'PUT',
    key,
    body,
    headers: {
      'content-type': contentType,
      'cache-control': cacheControl,
      'content-length': String(body.length),
    },
  });
}

export async function deleteObject(cfg, key) {
  await request(cfg, { method: 'DELETE', key });
}
