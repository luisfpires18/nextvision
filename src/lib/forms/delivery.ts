/**
 * Where an accepted contact message goes — the seam, and the reason there is one.
 *
 * **DECISION D17 IS OPEN.** Neither the provider nor the recipient has been chosen, and
 * D2 has not settled which of three addresses even reaches the company. So this file
 * deliberately does NOT contain an address, and the endpoint deliberately does not have a
 * default one to fall back to. Inventing a recipient would mean sending a stranger's phone
 * number to a mailbox nobody confirmed is read (CLAUDE.md §8).
 *
 * What exists instead is the boundary: one interface, four adapters behind it, and one
 * resolver that picks between them from configuration. Answering D17 is setting two or
 * three environment variables. No component, no route and no validator changes.
 *
 * ── The four adapters ────────────────────────────────────────────────────────
 *   unconfigured    nothing is set. Refuses, loudly, with 503. Never pretends.
 *   dev-sink        `astro dev` only. Records that a submission was ACCEPTED AND NOT SENT,
 *                   with no field contents and no secrets, and says so in the words
 *                   "NOT DELIVERED" so it cannot be mistaken for production behaviour.
 *   resend          one HTTPS POST. https://resend.com — needs an account, a verified
 *                   sending domain and an API key.
 *   brevo           one HTTPS POST. https://brevo.com — the same three things, hosted in
 *                   the EU, which suits a Portuguese data controller.
 *
 * Adding a fifth is a `Provider` object and one line in `ADAPTERS`. Cloudflare's own
 * Email Routing `send_email` binding is the option with the least infrastructure of all —
 * no third party, no API key — and it is NOT here because it requires the zone to be on
 * Cloudflare with Email Routing enabled, which is decision D20 and a later phase.
 * docs/ARCHITECTURE.md §7 records that evaluation.
 *
 * ── What is never done here ──────────────────────────────────────────────────
 * No submission is stored. No message content is logged, in any adapter, in any mode. The
 * message exists for the duration of one request and then does not.
 */

import { ENV_KEYS, IS_DEV, readEnv } from './env.ts';
import type { ContactSubmission } from './contact.ts';

/* ══════════════════════════════════════════════════════════════ the seam ══ */

/** What a provider is handed. A submission, minus the things only the endpoint cares about. */
export interface DeliverableMessage {
  name: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
  locale: string;
  /** When the Worker accepted it. ISO 8601, UTC. */
  receivedAt: string;
}

export type DeliveryFailure = 'not-configured' | 'provider-error';

export interface DeliveryResult {
  ok: boolean;
  /** Which adapter answered. Safe to log and safe to return. */
  provider: string;
  reason?: DeliveryFailure;
  /** Provider diagnostics for the server log ONLY. Never contains submitted content. */
  detail?: string;
}

export interface Provider {
  id: string;
  /** True when this adapter has everything it needs to actually send. */
  ready(): boolean;
  deliver(message: DeliverableMessage): Promise<DeliveryResult>;
}

/** Strip a submission down to what is delivered. The token and the trap never travel. */
export const toMessage = (submission: ContactSubmission): DeliverableMessage => ({
  name: submission.name,
  email: submission.email,
  phone: submission.phone,
  message: submission.message,
  consent: submission.consent,
  locale: submission.locale,
  receivedAt: new Date().toISOString(),
});

/* ═══════════════════════════════════════════════════════ the message body ══ */

/**
 * The e-mail an adapter sends.
 *
 * Plain text, one field per line, in the order the form presents them. No HTML: an
 * enquiry is read, not rendered, and an HTML body is one more thing that can carry
 * something a form field should not.
 *
 * The subject names the site and the sender's own name if they gave one. It is UI text we
 * author, not site copy, so it is written here rather than pulled from the content layer.
 */
export function render(message: DeliverableMessage): { subject: string; text: string } {
  const who = message.name || message.email;
  const subject = `Next Vision Films — contacto de ${who}`;

  const lines = [
    `Nome:      ${message.name || '—'}`,
    `Email:     ${message.email}`,
    `Telefone:  ${message.phone || '—'}`,
    `Idioma:    ${message.locale}`,
    `Consentiu: ${message.consent ? 'sim' : 'não'}`,
    `Recebido:  ${message.receivedAt}`,
    '',
    'Mensagem:',
    message.message || '—',
  ];

  return { subject, text: lines.join('\n') };
}

/* ═════════════════════════════════════════════════════════════ adapters ══ */

/** Nothing is configured. The only honest answer is that this did not send. */
const unconfigured: Provider = {
  id: 'unconfigured',
  ready: () => false,
  deliver: async () => ({
    ok: false,
    provider: 'unconfigured',
    reason: 'not-configured',
    detail: 'no delivery provider is configured — decision D17 is open',
  }),
};

/**
 * The development sink. `astro dev` only, and it says what it is.
 *
 * It records that a submission passed every check and was NOT sent, plus the LENGTHS of
 * the fields so that a developer can see the request differed from the last one. It does
 * not print a name, an address, a phone number or a message — the privacy rule does not
 * have a local exemption, and a terminal is a log.
 */
const devSink: Provider = {
  id: 'dev-sink',
  ready: () => IS_DEV,
  deliver: async (message) => {
    console.info(
      '[contact] DEV SINK — accepted, NOT DELIVERED.',
      JSON.stringify({
        receivedAt: message.receivedAt,
        locale: message.locale,
        consent: message.consent,
        lengths: {
          name: message.name.length,
          email: message.email.length,
          phone: message.phone.length,
          message: message.message.length,
        },
      }),
    );
    return { ok: true, provider: 'dev-sink', detail: 'not delivered — development sink' };
  },
};

/** Shared by both HTTP providers: one POST, a bounded wait, no content in the error. */
async function post(
  url: string, headers: Record<string, string>, body: unknown, provider: string,
): Promise<DeliveryResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (response.ok) return { ok: true, provider };
    // The status, never the response body: a provider error can echo the payload back.
    return { ok: false, provider, reason: 'provider-error', detail: `http ${response.status}` };
  } catch (error) {
    const why = error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'network error';
    return { ok: false, provider, reason: 'provider-error', detail: why };
  } finally {
    clearTimeout(timer);
  }
}

/** https://resend.com/docs/api-reference/emails/send-email */
const resend: Provider = {
  id: 'resend',
  ready: () => Boolean(
    readEnv(ENV_KEYS.resendKey) && readEnv(ENV_KEYS.recipient) && readEnv(ENV_KEYS.sender),
  ),
  deliver: async (message) => {
    const key = readEnv(ENV_KEYS.resendKey);
    const to = readEnv(ENV_KEYS.recipient);
    const from = readEnv(ENV_KEYS.sender);
    if (!key || !to || !from) {
      return { ok: false, provider: 'resend', reason: 'not-configured' };
    }
    const { subject, text } = render(message);
    return post('https://api.resend.com/emails', { authorization: `Bearer ${key}` }, {
      from, to: [to], subject, text,
      // So that hitting Reply answers the person who wrote in, rather than the Worker.
      reply_to: message.email,
    }, 'resend');
  },
};

/** https://developers.brevo.com/reference/sendtransacemail */
const brevo: Provider = {
  id: 'brevo',
  ready: () => Boolean(
    readEnv(ENV_KEYS.brevoKey) && readEnv(ENV_KEYS.recipient) && readEnv(ENV_KEYS.sender),
  ),
  deliver: async (message) => {
    const key = readEnv(ENV_KEYS.brevoKey);
    const to = readEnv(ENV_KEYS.recipient);
    const from = readEnv(ENV_KEYS.sender);
    if (!key || !to || !from) {
      return { ok: false, provider: 'brevo', reason: 'not-configured' };
    }
    const { subject, text } = render(message);
    return post('https://api.brevo.com/v3/smtp/email', { 'api-key': key }, {
      sender: { email: from, name: 'Next Vision Films' },
      to: [{ email: to }],
      replyTo: { email: message.email, ...(message.name ? { name: message.name } : {}) },
      subject,
      textContent: text,
    }, 'brevo');
  },
};

const ADAPTERS: Provider[] = [resend, brevo];

/* ═════════════════════════════════════════════════════════════ resolution ══ */

/**
 * Choose the adapter for this request.
 *
 * 1. `CONTACT_PROVIDER` names one explicitly. If it names one that is not ready, the
 *    answer is `unconfigured` rather than a silent fall-through to something else — an
 *    operator who named a provider meant that provider.
 * 2. Otherwise the first adapter whose credentials are all present.
 * 3. Otherwise the dev sink, in `astro dev` only.
 * 4. Otherwise `unconfigured`, which is a 503 and not a success.
 *
 * There is no step that guesses a recipient and no step where a build without
 * configuration quietly starts behaving like one with it.
 */
export function resolveProvider(): Provider {
  const named = readEnv(ENV_KEYS.provider);
  if (named) {
    if (named === devSink.id) return devSink.ready() ? devSink : unconfigured;
    const match = ADAPTERS.find((p) => p.id === named);
    return match?.ready() ? match : unconfigured;
  }

  const ready = ADAPTERS.find((p) => p.ready());
  if (ready) return ready;

  return devSink.ready() ? devSink : unconfigured;
}

/** Names only — for the endpoint's diagnostics and the local test runner. */
export const PROVIDER_IDS: string[] = [...ADAPTERS.map((p) => p.id), devSink.id, unconfigured.id];
