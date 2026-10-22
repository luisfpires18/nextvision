/**
 * The private source bucket, as the prod Worker sees it (binding `SOURCES`, wrangler.jsonc).
 *
 * Only what the admin uses is typed: multipart upload, a HEAD to confirm a finished
 * upload, and abort. `@cloudflare/workers-types` is not installed (src/env.d.ts says why).
 * Missing binding → `null`, and every upload answers "not configured" rather than failing
 * somewhere deeper.
 */

import { env } from 'cloudflare:workers';

export interface R2UploadedPart { partNumber: number; etag: string }
export interface R2MultipartUpload {
  readonly key: string;
  readonly uploadId: string;
  uploadPart(partNumber: number, value: ReadableStream | ArrayBuffer): Promise<R2UploadedPart>;
  complete(parts: R2UploadedPart[]): Promise<unknown>;
  abort(): Promise<void>;
}
export interface R2Bucket {
  createMultipartUpload(key: string, options?: { httpMetadata?: { contentType?: string } }): Promise<R2MultipartUpload>;
  resumeMultipartUpload(key: string, uploadId: string): R2MultipartUpload;
  head(key: string): Promise<{ size: number } | null>;
}

export function sourceBucket(): R2Bucket | null {
  try {
    const b = (env as Record<string, unknown>)['SOURCES'];
    return b && typeof b === 'object' ? (b as R2Bucket) : null;
  } catch {
    return null;
  }
}
