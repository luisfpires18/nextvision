/**
 * The contact submission: parsed, normalised, validated.
 *
 * Pure. No network, no environment, no Astro. That is what makes it testable and what
 * keeps the endpoint short enough to read in one screen — the endpoint decides POLICY
 * (origin, captcha, delivery), this file decides SHAPE.
 *
 * ── The rules, and where they come from ──────────────────────────────────────
 * Only `email` is required, because only `email` is required on the live form (audit
 * §3.6). Consent is optional while decision D9 is open, and `CONSENT_REQUIRED` is the one
 * switch that changes that. Nothing here invents a requirement the published form did not
 * have.
 *
 * ── Normalisation is deliberately conservative ───────────────────────────────
 * Trim, collapse the control characters that break a mail header, cap the length. That is
 * all. We do not title-case a name, we do not reformat a phone number into a shape we
 * guessed at, and we do not strip characters out of a message someone wrote — a contact
 * form that silently edits what it was given is worse than one that refuses it.
 */

import { z } from 'astro/zod';
import { DEFAULT_LOCALE, type Locale } from '../../config/i18n.ts';
import {
  CONSENT_REQUIRED, FIELD, LIMITS, TURNSTILE_FIELD, isLocale, type Outcome,
} from '../../config/forms.ts';

/* ═══════════════════════════════════════════════════════════ normalisation ══ */

/**
 * Everything a mail header cannot carry, removed before anything else looks at the value.
 *
 * CR and LF are the injection vector — a newline inside a subject or a reply-to is how a
 * form becomes a relay — so they go first, everywhere, including in the message body,
 * where they are re-introduced only by the delivery adapter that knows how to escape
 * them. Other C0 controls and the Unicode line separators go with them because nothing
 * legitimate types them into a form.
 */
const CONTROL = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u2028\u2029]/g;

/** One field, made safe and bounded. Multi-line input keeps its newlines. */
const clean = (value: unknown, max: number, multiline = false): string => {
  if (typeof value !== 'string') return '';
  const stripped = multiline
    ? value.replace(/\r\n?/g, '\n').replace(CONTROL, '')
    : value.replace(/[\r\n]+/g, ' ').replace(CONTROL, '');
  // Collapse runs of blank lines rather than rejecting them; trim the ends.
  return (multiline ? stripped.replace(/\n{3,}/g, '\n\n') : stripped.replace(/\s{2,}/g, ' ')).trim().slice(0, max);
};

/**
 * A checkbox is present or absent, and browsers disagree about what "on" is. Anything
 * truthy that a `<input type="checkbox" value="1">` can produce counts; nothing else does.
 */
const isChecked = (value: unknown): boolean =>
  value === '1' || value === 'on' || value === 'true' || value === true;

/* ═════════════════════════════════════════════════════════════════ schema ══ */

/**
 * zod v4 through Astro's own copy, so the version always matches the runtime
 * (CLAUDE.md §10.1 — `z` from `astro:content` is deprecated, and string formats moved to
 * the top level).
 *
 * The schema runs on ALREADY-NORMALISED values, so it never has to think about trimming,
 * and its only job is to say yes or no.
 */
const schema = z.object({
  name: z.string().max(LIMITS.name),
  email: z.email().max(LIMITS.email),
  phone: z.string().max(LIMITS.phone),
  message: z.string().max(LIMITS.message),
  /* Consent is SHAPE-checked here and POLICY-checked below. Putting `D9 is open` into the
     schema as a conditional refinement would make the schema's type depend on a flag, and
     the flag is exactly the thing most likely to be flipped by someone who is not reading
     this file. */
  consent: z.boolean(),
});

export interface ContactSubmission {
  name: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
  /** Which language the reader was reading. Decides the success destination only. */
  locale: Locale;
  /** Cloudflare's token. Verified by the endpoint, never stored, never delivered. */
  token: string;
  /** True when the hidden field was filled — i.e. not by a person. */
  trapped: boolean;
}

export type ParseResult =
  | { ok: true; submission: ContactSubmission }
  | { ok: false; outcome: Outcome; field?: string };

/**
 * Turn a submitted body into a submission, or into the reason it is not one.
 *
 * Accepts anything key/value shaped, so the same function serves a urlencoded form POST,
 * a `FormData` fetch and a JSON test call without three code paths that can disagree.
 */
export function parseContact(input: Record<string, unknown>): ParseResult {
  // The trap is read FIRST and reported on its own, because a filled honeypot must not be
  // able to reach validation at all — a bot should not be able to learn the field rules
  // by filling the trap and reading which error comes back.
  const trapped = clean(input[FIELD.honeypot], 64).length > 0;

  const candidate = {
    name: clean(input[FIELD.name], LIMITS.name),
    email: clean(input[FIELD.email], LIMITS.email).toLowerCase(),
    phone: clean(input[FIELD.phone], LIMITS.phone),
    message: clean(input[FIELD.message], LIMITS.message, true),
    consent: isChecked(input[FIELD.consent]),
  };

  const declaredLocale = input[FIELD.locale];
  const locale: Locale = isLocale(declaredLocale) ? declaredLocale : DEFAULT_LOCALE;
  const token = clean(input[TURNSTILE_FIELD], LIMITS.token);

  if (trapped) {
    return { ok: true, submission: { ...candidate, locale, token, trapped: true } };
  }

  // An empty required field and a malformed one are different failures to a reader, so
  // they are different outcomes on the wire.
  if (!candidate.email) return { ok: false, outcome: 'missing-email', field: FIELD.email };

  const parsed = schema.safeParse(candidate);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path[0];
    if (path === 'email') return { ok: false, outcome: 'invalid-email', field: FIELD.email };
    return { ok: false, outcome: 'malformed', ...(typeof path === 'string' ? { field: path } : {}) };
  }

  // Decision D9, and the ONE place it is enforced. While it is open the published form's
  // own answer stands: the box is offered and not demanded.
  if (CONSENT_REQUIRED && !parsed.data.consent) {
    return { ok: false, outcome: 'consent-required', field: FIELD.consent };
  }

  return { ok: true, submission: { ...parsed.data, locale, token, trapped: false } };
}

/**
 * Read a request body into plain key/value pairs, without ever holding more than the cap.
 *
 * The size check is on the TEXT, not on `Content-Length`, because a header is a claim and
 * the body is the fact. `Content-Length` is still checked first by the endpoint, so a
 * declared-oversized body is refused before a byte of it is read.
 */
export async function readBody(
  request: Request, maxBytes: number,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; outcome: Outcome }> {
  const type = request.headers.get('content-type') ?? '';

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return { ok: false, outcome: 'malformed' };
  }

  // Byte length, not character count — a message of emoji is four times its own length.
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    return { ok: false, outcome: 'too-long' };
  }

  if (type.includes('application/json')) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { ok: false, outcome: 'malformed' };
      }
      return { ok: true, data: parsed as Record<string, unknown> };
    } catch {
      return { ok: false, outcome: 'malformed' };
    }
  }

  if (type.includes('application/x-www-form-urlencoded') || type === '') {
    try {
      const params = new URLSearchParams(raw);
      const data: Record<string, unknown> = {};
      for (const [key, value] of params) data[key] = value;
      return { ok: true, data };
    } catch {
      return { ok: false, outcome: 'malformed' };
    }
  }

  /* `multipart/form-data` is deliberately NOT accepted. Nothing here has a file input, the
     form's enctype is the urlencoded default, and our own script posts URLSearchParams —
     so a multipart body is either a mistake or a probe, and parsing one would mean
     carrying a parser for a shape this endpoint has no use for. */
  return { ok: false, outcome: 'malformed' };
}
