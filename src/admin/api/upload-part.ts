/**
 * PUT /admin/api/carregar/parte/?key=…&uploadId=…&n=… — one part of an owner's upload.
 *
 * The body is streamed straight into R2, never buffered: a part is 20 MB and a Worker has
 * 128 MB. The key must be an `uploads/` key (uploads.ts), so a part can only ever be
 * written where `iniciar` said it would go.
 */
import type { APIRoute } from 'astro';
import { answer, guardStream } from '../../lib/admin/http.ts';
import { sourceBucket } from '../../lib/admin/sources.ts';
import { isUploadKey, PART_BYTES } from '../../lib/admin/uploads.ts';

export const prerender = false;

export const PUT: APIRoute = async ({ request, url }) => {
  const g = await guardStream(request);
  if (!g.ok) return g.response;

  const key = url.searchParams.get('key') ?? '';
  const uploadId = url.searchParams.get('uploadId') ?? '';
  const n = Number(url.searchParams.get('n'));
  const length = Number(request.headers.get('content-length') ?? NaN);
  const refuse = async (status: number, error: string) => {
    await request.arrayBuffer().catch(() => undefined);
    return answer(status, { error });
  };
  if (!isUploadKey(key) || !uploadId || !Number.isInteger(n) || n < 1 || n > 10000) return refuse(400, 'Pedido inválido.');
  if (!Number.isFinite(length) || length < 1 || length > PART_BYTES) return refuse(413, 'Parte com tamanho inválido.');
  if (!request.body) return answer(400, { error: 'Parte vazia.' });

  const bucket = sourceBucket();
  if (!bucket) return refuse(503, 'Carregar ficheiros ainda não está configurado neste servidor.');

  try {
    const part = await bucket.resumeMultipartUpload(key, uploadId).uploadPart(n, request.body);
    return answer(200, { partNumber: part.partNumber, etag: part.etag });
  } catch {
    return answer(502, { error: 'Uma parte do ficheiro não foi guardada. Volte a tentar.' });
  }
};
