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
import { readFile, commitFiles, listFiles, GitHubError } from '../../lib/admin/github.ts';
import { SCREENS, SCREEN_LABELS, pageFilePath, type PageFileName } from '../../lib/admin/fields.ts';
import { applyEdits, expandFields, liveValue, serialise, EditError, type Field } from '../../lib/admin/edit.ts';
import { PAGE_SCHEMAS } from '../../lib/page-content.ts';
import {
  ORDER_DRAFT, PROJECT_FILE, SLUG, applyOrder, applyProjectEdits, portfolioSequence, projectData, projectFilePath, projectValue, PROJECTS_DIR,
} from '../../lib/admin/projects.ts';
import { projectContext } from '../../lib/admin/project-context.ts';

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

  const cfg = githubConfig();
  if (!cfg) return answer(503, { error: 'Publicar ainda não está configurado neste servidor. Nada foi publicado.' });

  // Drafts for a project (`projeto/<slug>:path`) and for a page file, kept apart: the two
  // are stored differently, and land together in one commit.
  const projectDrafts = new Map<string, Record<string, { from: string; to: string }>>();
  const pageDrafts: typeof drafts = {};
  const orderDraft = drafts[ORDER_DRAFT];
  for (const [name, d] of Object.entries(drafts)) {
    const [file = '', field = ''] = name.split(':');
    if (name === ORDER_DRAFT) continue;
    if (file.startsWith(`${PROJECT_FILE}/`)) {
      const slug = file.slice(PROJECT_FILE.length + 1);
      if (!SLUG.test(slug)) return answer(400, { error: 'Pedido inválido.' });
      projectDrafts.set(slug, { ...projectDrafts.get(slug), [field]: d });
    } else pageDrafts[name] = d;
  }
  const pageEdits = Object.fromEntries(Object.entries(pageDrafts).map(([n, d]) => [n, d.to]));

  // The page files the drafts touch: the `file` part of every `file:path#lang` name.
  const files = [...new Set(Object.keys(pageEdits).map((n) => n.split(':')[0] as PageFileName))];
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

    const stale = [...new Set(Object.entries(pageDrafts)
      .filter(([name, d]) => liveValue(docs, name) !== d.from)
      .map(([name]) => fields.get(name.split('#')[0] ?? '')?.label ?? name))];

    // Projects: read each file once, check each draft against its live value, apply.
    // The portfolio order touches every project, so with an order draft all are read.
    const projects = new Map<string, { text: string; sha: string; original: string }>();
    const load = async (slug: string) => {
      const known = projects.get(slug);
      if (known) return known;
      const file = await readFile(cfg, projectFilePath(slug)).catch((e: unknown) => {
        if (e instanceof GitHubError && e.status === 404) throw new EditError('Este projeto já não existe.');
        throw e;
      });
      const entry = { ...file, original: file.text };
      projects.set(slug, entry);
      return entry;
    };
    const projectChanged: string[] = [];
    const ctx = await projectContext();
    for (const [slug, pd] of projectDrafts) {
      const file = await load(slug);
      const data = projectData(file.text);
      const name = `Projeto «${projectValue(data, 'title.pt')}»`;
      for (const [field, d] of Object.entries(pd)) {
        const [p = '', lang] = field.split('#');
        if (projectValue(data, p, lang) !== d.from) stale.push(`${name} — ${field}`);
      }
      if (stale.length) continue;
      const applied = applyProjectEdits(file.text, Object.fromEntries(Object.entries(pd).map(([f, d]) => [f, d.to])), ctx);
      file.text = applied.text;
      projectChanged.push(...applied.changed.map((c) => `${name} — ${c}`));
    }
    if (orderDraft && !stale.length) {
      const slugs = (await listFiles(cfg, PROJECTS_DIR)).filter((p) => p.endsWith('.mdx')).map((p) => p.slice(PROJECTS_DIR.length + 1, -'.mdx'.length));
      for (const slug of slugs) await load(slug);
      const all = slugs.map((slug) => ({ slug, text: projects.get(slug)!.original }));
      if (portfolioSequence(all).join(',') !== orderDraft.from) stale.push('Ordem do portfólio');
      else {
        const moved = applyOrder(slugs.map((slug) => ({ slug, text: projects.get(slug)!.text })), orderDraft.to);
        for (const m of moved) projects.get(m.slug)!.text = m.text;
        if (moved.length) projectChanged.push('Ordem do portfólio — Ordem');
      }
    }
    const projectWrites: { path: string; text: string }[] = [];
    for (const [slug, f] of projects) {
      if (f.text === f.original) continue;
      projectWrites.push({ path: projectFilePath(slug), text: f.text });
      current[projectFilePath(slug)] = f.sha;
    }

    if (stale.length) {
      return answer(409, {
        error: `Estes campos foram alterados por outra publicação entretanto: ${stale.join(', ')}. Abra a página, veja o valor atual e volte a editar. Nada foi publicado.`,
        stale,
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const { docs: next, changed } = applyEdits([...fields.values()], docs, pageEdits, today);
    if (!changed.length && !projectWrites.length) return answer(200, { nothing: true });

    const touched = [...new Set(changed.map((c) => c.file))];
    for (const file of touched) {
      const ok = PAGE_SCHEMAS[file].safeParse(next[file]);
      if (!ok.success) return answer(422, { error: `Estas alterações deixariam uma página inválida: ${z.prettifyError(ok.error)}` });
    }

    const labels = [...changed.map((c) => c.label), ...projectChanged];
    const pages = [...new Set(labels.map((l) => l.split(' — ')[0]))];
    const message = `content: ${pages.join(', ')}\n\n${labels.map((l) => `- ${l}`).join('\n')}\n\nPublicado no admin por ${g.who.email}.`;
    const writes = [...touched.map((file) => ({ path: pageFilePath(file), text: serialise(next[file]) })), ...projectWrites];
    const { commit } = await commitFiles(
      cfg,
      writes,
      Object.fromEntries(writes.map((w) => [w.path, current[w.path]!])),
      message,
    );
    return answer(200, { commit, changed: labels });
  } catch (error) {
    if (error instanceof EditError) return answer(422, { error: error.message });
    if (error instanceof GitHubError && error.status === 409) {
      return answer(409, { error: 'Outra publicação aconteceu ao mesmo tempo. Volte a carregar em Publicar; os seus rascunhos ficam guardados.' });
    }
    const status = error instanceof GitHubError ? error.status : 0;
    return answer(502, { error: `O GitHub não respondeu como esperado${status ? ` (${status})` : ''}. Nada foi publicado; os rascunhos ficam guardados.` });
  }
};
