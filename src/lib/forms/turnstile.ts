/**
 * Cloudflare Turnstile — server-side verification.
 *
 * A widget on the page proves nothing. The token it produces is single-use and is only
 * evidence once Cloudflare has been asked about it, so this runs on EVERY submission and
 * there is no path through src/pages/api/contact.ts that skips it.
 *
 * ── What is sent, and what is not ────────────────────────────────────────────
 * The token, the secret, and the connecting IP. Nothing the reader typed ever reaches
 * Cloudflare's verification endpoint — not the message, not the address, not the name.
 *
 * ── Failing closed ───────────────────────────────────────────────────────────
 * A network error, a timeout or a malformed answer is a FAILURE, never a pass. The cost of
 * being wrong in that direction is one person retrying; the cost of the other direction is
 * an open relay.
 *
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

import { TURNSTILE_TEST, TURNSTILE_VERIFY_URL } from '../../config/forms.ts';
import { ENV_KEYS, IS_DEV, readEnv } from './env.ts';

export interface TurnstileResult {
  ok: boolean;
  /** Cloudflare's own error codes, or ours for the cases it never answers. */
  codes: string[];
}

/** How long we will wait for Cloudflare before treating the challenge as failed. */
const TIMEOUT_MS = 8_000;

/**
 * The secret this request verifies against.
 *
 * In development, with nothing configured, that is Cloudflare's OFFICIAL always-passes
 * test secret — public, documented, and paired with the test site key the widget renders
 * by default. It means a fresh checkout has a form that genuinely verifies rather than one
 * that skips the step and calls that "local mode".
 *
 * In a BUILD there is no fallback. An unset `TURNSTILE_SECRET_KEY` returns undefined, and
 * the caller turns that into a refusal — a deployed form that cannot verify must not
 * accept.
 */
export function turnstileSecret(): string | undefined {
  const configured = readEnv(ENV_KEYS.turnstileSecret);
  if (configured) return configured;
  return IS_DEV ? TURNSTILE_TEST.secretPass : undefined;
}

/**
 * Ask Cloudflare whether this token is good.
 *
 * `remoteIp` is CF-Connecting-IP when the Worker has one. It is passed because Cloudflare
 * uses it to score the challenge, and it is not stored, logged or delivered anywhere.
 */
export async function verifyTurnstile(
  token: string, secret: string, remoteIp?: string | null,
): Promise<TurnstileResult> {
  if (!token) return { ok: false, codes: ['missing-input-response'] };

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set('remoteip', remoteIp);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      signal: controller.signal,
    });

    if (!response.ok) return { ok: false, codes: [`http-${response.status}`] };

    const data: unknown = await response.json();
    if (!data || typeof data !== 'object') return { ok: false, codes: ['unparseable-response'] };

    const result = data as { success?: unknown; 'error-codes'?: unknown };
    const codes = Array.isArray(result['error-codes'])
      ? result['error-codes'].filter((c): c is string => typeof c === 'string')
      : [];

    return { ok: result.success === true, codes };
  } catch (error) {
    // Fails closed, and says which way it failed so the endpoint can answer 403 rather
    // than pretending the challenge was passed.
    return { ok: false, codes: [error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'network-error'] };
  } finally {
    clearTimeout(timer);
  }
}
