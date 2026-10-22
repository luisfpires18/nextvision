/**
 * POST /admin/api/publicar/ — publish every draft, from every page, in one go (A10).
 *
 * The page keeps drafts in the browser while the owner edits; this receives all of them
 * at once and writes them as ONE commit to `master`. That push is the production deploy
 * (prod.yml), so one Publicar = one commit = one deploy.
 *
 * In order, refusing before anything is written:
 *   1. identity, origin, JSON (http.ts);
 *   2. configured: the GitHub App secrets exist — 503, never a pretend publish;
 *   3. freshness, PER FIELD: each draft carries the value the field had when the owner
 *      started editing it. If someone else published a different value for that same
 *      field since, it is a refusal naming the field, never an overwrite (409). Other
 *      fields of the same page changing meanwhile do not matter, so drafts can wait days;
 *   4. the rules (edit.ts): only fields the admin offers, never locked ones, both
 *      languages, `owner:` provenance when the Portuguese changes (422);
 *   5. the build's own schema for every file written (422);
 *   6. one commit or none (github.ts `commitFiles`, fast-forward only).
 * Nothing the owner typed is logged.
 */
import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { answer, guardJson } from '../../lib/admin/http.ts';
import { githubConfig } from '../../lib/admin/repo.ts';
import { readFile, commitFiles, GitHubError } from '../../lib/admin/github.ts';
import { SCREENS, SCREEN_LABELS, pageFilePath, type PageFileName } from '../../lib/admin/fields.ts';
import { applyEdits, expandFields, liveValue, serialise, EditError, type Field } from '../../lib/admin/edit.ts';
import { PAGE_SCHEMAS } from '../../lib/page-content.ts';

export const prerender = false;

/** Each draft: the field's value when editing began (`from`) and the new one (`to`). */
const Body = z.object({
  edits: z.record(z.string(), z.object({ from: z.string(), to: z.string() })),
});

export const POST: APIRoute = async ({ request }) => {
  const g = await guardJson(request, 256 * 1024);
  if (!g.ok) return g.response;
  const parsed = Body.safeParse(g.value);
  if (!parsed.success) return answer(400, { error: 'Pedido inválido.' });
  const drafts = parsed.data.edits;
  if (!Object.keys(drafts).length) return answer(200, { nothing: true });
  const edits = Object.fromEntries(Object.entries(drafts).map(([n, d]) => [n, d.to]));

  const cfg = githubConfig();
  if (!cfg) return answer(503, { error: 'Publicar ainda não está configurado neste servidor. Nada foi publicado.' });

  // The files the drafts touch: the `file` part of every `file:path#lang` name.
  const files = [...new Set(Object.keys(edits).map((n) => n.split(':')[0] as PageFileName))];
  if (files.some((f) => !(f in PAGE_SCHEMAS))) return answer(400, { error: 'Pedido inválido.' });

  try {
    const docs: Partial<Record<PageFileName, unknown>> = {};
    const current: Record<string, string> = {};
    for (const file of files) {
      const { text, sha } = await readFile(cfg, pageFilePath(file));
      docs[file] = JSON.parse(text);
      current[pageFilePath(file)] = sha;
    }

    // Every field any screen offers, once each; the owner-facing name carries its page.
    const fields = new Map<string, Field>();
    for (const [screen, defs] of Object.entries(SCREENS) as [PageFileName, (typeof SCREENS)[PageFileName]][]) {
      for (const f of expandFields(defs.filter((d) => files.includes(d.file)), docs)) {
        const id = `${f.file}:${f.key}`;
        if (!fields.has(id)) fields.set(id, { ...f, label: `${SCREEN_LABELS[screen]} — ${f.label}` });
      }
    }

    const stale = [...new Set(Object.entries(drafts)
      .filter(([name, d]) => liveValue(docs, name) !== d.from)
      .map(([name]) => fields.get(name.split('#')[0] ?? '')?.label ?? name))];
    if (stale.length) {
      return answer(409, {
        error: `Estes campos foram alterados por outra publicação entretanto: ${stale.join(', ')}. Abra a página, veja o valor atual e volte a editar. Nada foi publicado.`,
        stale,
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const { docs: next, changed } = applyEdits([...fields.values()], docs, edits, today);
    if (!changed.length) return answer(200, { nothing: true });

    const touched = [...new Set(changed.map((c) => c.file))];
    for (const file of touched) {
      const ok = PAGE_SCHEMAS[file].safeParse(next[file]);
      if (!ok.success) return answer(422, { error: `Estas alterações deixariam uma página inválida: ${z.prettifyError(ok.error)}` });
    }

    const pages = [...new Set(changed.map((c) => c.label.split(' — ')[0]))];
    const message = `content: ${pages.join(', ')}\n\n${changed.map((c) => `- ${c.label}`).join('\n')}\n\nPublicado no admin por ${g.who.email}.`;
    const { commit } = await commitFiles(
      cfg,
      touched.map((file) => ({ path: pageFilePath(file), text: serialise(next[file]) })),
      Object.fromEntries(touched.map((file) => [pageFilePath(file), current[pageFilePath(file)]!])),
      message,
    );
    return answer(200, { commit, changed: changed.map((c) => c.label) });
  } catch (error) {
    if (error instanceof EditError) return answer(422, { error: error.message });
    if (error instanceof GitHubError && error.status === 409) {
      return answer(409, { error: 'Outra publicação aconteceu ao mesmo tempo. Volte a carregar em Publicar; os seus rascunhos ficam guardados.' });
    }
    const status = error instanceof GitHubError ? error.status : 0;
    return answer(502, { error: `O GitHub não respondeu como esperado${status ? ` (${status})` : ''}. Nada foi publicado; os rascunhos ficam guardados.` });
  }
};
