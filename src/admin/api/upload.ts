/**
 * POST /admin/api/carregar/ — start, finish or abandon an owner's upload (phase A4).
 *
 * The browser sends the file in parts (`/admin/api/carregar/parte/`); this endpoint opens
 * the multipart upload, completes it, or aborts it. Everything lands in the PRIVATE source
 * bucket under `uploads/<date>/<id>/<name>`: the key is made here from a server-side id,
 * never taken from the page, and every later call must present a key of that shape.
 *
 *   { acao: 'iniciar',  name, size }                 → { key, uploadId, partBytes }
 *   { acao: 'concluir', key, uploadId, parts: [...] } → { key, size }
 *   { acao: 'abortar',  key, uploadId }              → { ok }
 */
import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { answer, guardJson } from '../../lib/admin/http.ts';
import { sourceBucket } from '../../lib/admin/sources.ts';
import { isUploadKey, kindOf, uploadKey, MAX_UPLOAD_BYTES, PART_BYTES } from '../../lib/admin/uploads.ts';

export const prerender = false;

const Body = z.discriminatedUnion('acao', [
  z.object({ acao: z.literal('iniciar'), name: z.string().min(1).max(200), size: z.number().int().positive() }),
  z.object({
    acao: z.literal('concluir'),
    key: z.string(),
    uploadId: z.string().min(1),
    parts: z.array(z.object({ partNumber: z.number().int().min(1).max(10000), etag: z.string().min(1) })).min(1).max(10000),
  }),
  z.object({ acao: z.literal('abortar'), key: z.string(), uploadId: z.string().min(1) }),
]);

const CONTENT_TYPE: Record<string, string> = {
  mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', tif: 'image/tiff', tiff: 'image/tiff',
};

export const POST: APIRoute = async ({ request }) => {
  const g = await guardJson(request, 1024 * 1024);
  if (!g.ok) return g.response;
  const parsed = Body.safeParse(g.value);
  if (!parsed.success) return answer(400, { error: 'Pedido inválido.' });
  const body = parsed.data;

  const bucket = sourceBucket();
  if (!bucket) return answer(503, { error: 'Carregar ficheiros ainda não está configurado neste servidor.' });

  try {
    if (body.acao === 'iniciar') {
      if (!kindOf(body.name)) {
        return answer(422, { error: 'Este tipo de ficheiro não é aceite. Use MP4, MOV ou WebM para vídeo, e JPG, PNG, WebP ou TIFF para imagem.' });
      }
      if (body.size > MAX_UPLOAD_BYTES) return answer(413, { error: 'O ficheiro tem mais de 2 GB. Exporte uma versão mais pequena.' });
      const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
      const key = uploadKey(new Date().toISOString().slice(0, 10), id, body.name);
      const ext = body.name.split('.').pop()?.toLowerCase() ?? '';
      const ct = CONTENT_TYPE[ext];
      const mpu = await bucket.createMultipartUpload(key, ct ? { httpMetadata: { contentType: ct } } : {});
      return answer(200, { key, uploadId: mpu.uploadId, partBytes: PART_BYTES });
    }

    if (!isUploadKey(body.key)) return answer(400, { error: 'Pedido inválido.' });
    const mpu = bucket.resumeMultipartUpload(body.key, body.uploadId);

    if (body.acao === 'abortar') {
      await mpu.abort();
      return answer(200, { ok: true });
    }

    await mpu.complete(body.parts.toSorted((a, b) => a.partNumber - b.partNumber));
    const head = await bucket.head(body.key);
    if (!head) return answer(502, { error: 'O ficheiro não ficou guardado. Volte a carregá-lo.' });
    if (head.size > MAX_UPLOAD_BYTES) return answer(413, { error: 'O ficheiro tem mais de 2 GB.' });
    return answer(200, { key: body.key, size: head.size });
  } catch {
    return answer(502, { error: 'O armazenamento não respondeu como esperado. Volte a tentar.' });
  }
};
