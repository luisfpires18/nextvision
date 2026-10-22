/**
 * The admin API's shared door: one answer shape, one set of checks.
 *
 * `guardJson` reads the body BEFORE any refusal (see save.ts: refusing a POST with its
 * body unread broke wrangler's local proxy on the next request), then checks identity,
 * origin (the CSRF control) and JSON. Endpoints that stream a body (upload parts) use
 * `guardStream`, which checks the same things without reading it.
 */

import { adminIdentity } from './guard.ts';
import type { AccessIdentity } from './access.ts';

export const answer = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });

type Guarded<T> = { ok: true; who: AccessIdentity; value: T } | { ok: false; response: Response };

export async function guardJson(request: Request, maxBytes: number): Promise<Guarded<unknown>> {
  const raw = await request.text().catch(() => '');
  if (new TextEncoder().encode(raw).byteLength > maxBytes) return { ok: false, response: answer(413, { error: 'Pedido demasiado grande.' }) };
  const who = await adminIdentity(request);
  if (!who) return { ok: false, response: answer(403, { error: 'Sem acesso.' }) };
  if (request.headers.get('origin') !== new URL(request.url).origin) return { ok: false, response: answer(403, { error: 'Pedido recusado.' }) };
  if (!request.headers.get('content-type')?.startsWith('application/json')) return { ok: false, response: answer(415, { error: 'Pedido recusado.' }) };
  try { return { ok: true, who, value: JSON.parse(raw) as unknown }; }
  catch { return { ok: false, response: answer(400, { error: 'Pedido inválido.' }) }; }
}

/** Same checks, body left unread for streaming. On refusal the body is drained first. */
export async function guardStream(request: Request): Promise<{ ok: true; who: AccessIdentity } | { ok: false; response: Response }> {
  const refuse = async (status: number, error: string) => {
    await request.arrayBuffer().catch(() => undefined);
    return { ok: false as const, response: answer(status, { error }) };
  };
  const who = await adminIdentity(request);
  if (!who) return refuse(403, 'Sem acesso.');
  if (request.headers.get('origin') !== new URL(request.url).origin) return refuse(403, 'Pedido recusado.');
  return { ok: true, who };
}
