#!/usr/bin/env node
/**
 * build-legal.mjs — the two legal pages, derived from the archive rather than retyped.
 *
 * The legal copy is the one part of this site nobody may edit (CLAUDE.md §2), and the
 * surest way to break that rule is to transcribe 23 000 characters of Portuguese contract
 * and privacy law by hand. So it is not transcribed. This script reads the preserved
 * WordPress HTML in `source-archive/wordpress/html/`, walks the elements it actually
 * contains, and writes `src/content/legal/*.md`.
 *
 * WHAT IT MAY CHANGE — presentation only, and every one of these changes NO WORDS:
 *
 *   - `<h4>` becomes `<h2>`, because the pages jump h1 → h4 today (audit §8.9). CLAUDE.md
 *     §2.1 names correcting a heading level as a structural fix, not a copy change.
 *   - On `/termos-e-condicoes/` the lettered sections are `<p><strong>a) …</strong></p>`
 *     with no heading at all, and four of them share a paragraph with their own body
 *     text. Each becomes an `<h2>` carrying exactly the published characters.
 *   - Headings gain an `id`. On the privacy page the id is the SOURCE'S OWN fragment name
 *     — the one its `Navegação` list already points at on digiup.me — so the repointed
 *     links are traceable to what they replaced, typo included
 *     (`de-que-forma-usamos-informacacao`).
 *   - `<br />` inside a paragraph becomes a paragraph break. WordPress used a single
 *     paragraph with line breaks where the document has distinct clauses.
 *   - The ten `Navegação` links are repointed from `https://www.digiup.me/...#fragment`
 *     to `#fragment` on this page (decision D4, audit §9.4). The labels are untouched.
 *
 * WHAT IT MAY NOT CHANGE: a single word, in either direction. `scripts/validate-legal.mjs`
 * proves it, by comparing the generated Markdown against `docs/content/*.txt` with all
 * whitespace and all markup removed. Run it after this.
 *
 * Usage: node scripts/build-legal.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const HTML = (name) => path.join(ROOT, 'source-archive', 'wordpress', 'html', name);
const OUT = (name) => path.join(ROOT, 'src', 'content', 'legal', name);

/* ------------------------------------------------------------------ helpers */

const ENTITIES = {
  '&#8211;': '–', '&#8212;': '—', '&#8217;': '’', '&#8216;': '‘',
  '&#8220;': '“', '&#8221;': '”', '&#8230;': '…', '&#038;': '&',
  '&amp;': '&', '&nbsp;': ' ', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'",
};

const decode = (s) => s.replace(/&#?\w+;/g, (m) => ENTITIES[m] ?? m);

/** The document body: everything inside <main>, with the <h1> removed (it is the title). */
async function mainOf(file) {
  const raw = await fs.readFile(HTML(file), 'utf8');
  const start = raw.indexOf('<main');
  const end = raw.indexOf('</main>');
  if (start === -1 || end === -1) throw new Error(`no <main> in ${file}`);
  return raw.slice(start, end);
}

/** Top-level content elements, in document order. Elementor's wrapper divs are skipped. */
function elements(html) {
  const out = [];
  const re = /<(p|h1|h2|h3|h4|h5|ul|ol|table)\b([^>]*)>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = re.exec(html)) !== null) out.push({ tag: m[1], attrs: m[2], inner: m[3] });
  return out;
}

/**
 * Inline HTML to Markdown. Only the four inline constructs these two documents actually
 * use: bold, italic, links and underline. Anything else would be a silent structural
 * change and is left to fail loudly in the validator rather than guessed at here.
 */
function inline(html, { rewriteHref } = {}) {
  let s = html;
  s = s.replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, (_, href, text) => {
    const label = inline(text).trim();
    const target = rewriteHref ? rewriteHref(href) : href;
    return `[${label}](${target})`;
  });
  s = s.replace(/<\/?(?:strong|b)>/g, '**');
  s = s.replace(/<\/?(?:em|i)>/g, '*');
  s = s.replace(/<\/?u>/g, '');
  s = s.replace(/<[^>]+>/g, '');
  // `**` immediately followed by a space then closed leaves an empty emphasis run that
  // Markdown renders literally. The live copy has several ("<b>NVF </b>"), so the
  // trailing space is moved outside the emphasis. No character is added or removed.
  s = s.replace(/\*\*(\s*)([\s\S]*?)(\s*)\*\*/g, (whole, lead, body, trail) =>
    (body.trim() ? `${lead}**${body}**${trail}` : `${lead}${body}${trail}`));
  return decode(s);
}

/** A paragraph's <br /> runs become paragraph breaks. */
const paragraphs = (innerHtml, opts) =>
  innerHtml
    .split(/<br\s*\/?>/i)
    .map((part) => inline(part, opts).replace(/\s+/g, ' ').trim())
    .filter(Boolean);

const listItems = (innerHtml, opts) =>
  [...innerHtml.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)]
    .map((m) => inline(m[1], opts).replace(/\s+/g, ' ').trim())
    .filter(Boolean);

function markdownTable(innerHtml) {
  const rows = [...innerHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map((m) =>
    [...m[1].matchAll(/<(th|td)\b[^>]*>([\s\S]*?)<\/\1>/g)]
      .map((c) => inline(c[2]).replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim()));
  if (!rows.length) return [];
  const [head, ...body] = rows;
  return [
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...body.map((r) => `| ${r.join(' | ')} |`),
  ];
}

const heading = (id, text) => `<h2 id="${id}">${text}</h2>`;

const frontmatter = (data) =>
  ['---', ...Object.entries(data).map(([k, v]) => `${k}: ${v}`), '---'].join('\n');

/* ══════════════════════════════════════════════════ termos-e-condicoes ══ */

/**
 * The lettered sections, in published order. `text` is the exact published run — the
 * letter, the closing bracket and the title — and `id` is the anchor it gets.
 * Nothing here is a label we wrote: every string is matched against the archive below,
 * and an unmatched one aborts the build.
 */
const TERMS_SECTIONS = [
  { id: 'pressupostos-da-proposta', text: 'a) Pressupostos da Proposta' },
  { id: 'processo-de-adjudicacao', text: 'b) Processo de Adjudicação' },
  { id: 'inicio-dos-trabalhos', text: 'c) Início dos Trabalhos' },
  { id: 'etapas-de-desenvolvimento', text: 'd) Etapas de Desenvolvimento' },
  { id: 'revisoes-e-alteracoes', text: 'e) Revisões e Alterações' },
  { id: 'autorizacao-de-uso-de-imagem', text: 'f) Autorização de Uso de Imagem' },
  { id: 'clausula-de-confidencialidade', text: 'g) Cláusula de Confidencialidade' },
  { id: 'contactos', text: 'h) Contactos' },
];

async function buildTerms() {
  const els = elements(await mainOf('termos-e-condicoes.html')).filter((e) => e.tag !== 'h1');
  const lines = [];
  const seen = new Set();

  for (const el of els) {
    if (el.tag !== 'p') throw new Error(`termos: unexpected <${el.tag}>`);
    const parts = paragraphs(el.inner);
    if (!parts.length) continue;

    // A lettered section opens either its own paragraph or the paragraph it shares with
    // its first clause. Both forms exist in the source; both become heading + prose.
    const first = parts[0].replace(/\*\*/g, '').trim();
    const section = TERMS_SECTIONS.find((s) => s.text === first);
    if (section) {
      seen.add(section.id);
      lines.push('', heading(section.id, section.text), '');
      for (const p of parts.slice(1)) lines.push(p, '');
      continue;
    }
    for (const p of parts) lines.push(p, '');
  }

  const missing = TERMS_SECTIONS.filter((s) => !seen.has(s.id));
  if (missing.length) throw new Error(`termos: sections not found in the archive: ${missing.map((s) => s.text).join(', ')}`);

  const body = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  const md = `${frontmatter({
    pageId: 'terms',
    title: '\n  pt: "Termos e Condições"',
    sourceUrl: '"https://www.nextvisionfilms.com/termos-e-condicoes/"',
    capturedAt: '"2026-09-01"',
    seo: '\n  noindex: false',
  })}\n\n${body}\n`;

  await fs.writeFile(OUT('termos-e-condicoes.md'), md);
  return md.length;
}

/* ═══════════════════════════════════════════ politica-de-privacidade ══ */

/**
 * The privacy page's own `Navegação` fragments, in published order. These are the exact
 * fragment names its ten links already carry — they simply point at digiup.me today
 * (audit §9.4, decision D4). Keeping the names is what makes the repointing auditable:
 * the only thing that changed is the origin.
 */
const PRIVACY_IDS = [
  'acerca-politica-privacidade',
  'informacao-recolhida-acerca-de-si',
  'de-que-forma-usamos-informacacao',
  'marketing',
  'correcao-da-sua-informacao',
  'cookies',
  'outros-sites',
  'seguranca',
  'alteracoes-comunicado-privacidade',
  'contatos',
];

async function buildPrivacy() {
  const els = elements(await mainOf('politica-de-privacidade.html')).filter((e) => e.tag !== 'h1');
  const lines = [];

  /** digiup.me/politica-de-privacidade/#x  →  #x. Every other href is untouched. */
  const rewriteHref = (href) => {
    const m = /^https?:\/\/(?:www\.)?digiup\.me\/politica-de-privacidade\/(#.+)$/.exec(href);
    return m ? m[1] : href;
  };

  let headingIndex = 0;
  let navFound = false;

  for (const el of els) {
    if (el.tag === 'h4' || el.tag === 'h2' || el.tag === 'h3') {
      const id = PRIVACY_IDS[headingIndex];
      if (!id) throw new Error(`privacidade: more headings than known fragments (${headingIndex + 1})`);
      lines.push('', heading(id, inline(el.inner).replace(/\s+/g, ' ').trim()), '');
      headingIndex += 1;
      continue;
    }

    if (el.tag === 'ul') {
      for (const item of listItems(el.inner, { rewriteHref })) lines.push(`- ${item}`);
      lines.push('');
      continue;
    }

    if (el.tag === 'table') {
      lines.push('', ...markdownTable(el.inner), '');
      continue;
    }

    if (el.tag !== 'p') throw new Error(`privacidade: unexpected <${el.tag}>`);

    // The Navegação block is one paragraph of ten <a> separated by <br />. It becomes a
    // real list of in-page links — the same labels, now resolving on this site.
    const isNav = el.inner.includes('digiup.me/politica-de-privacidade/#');
    if (isNav) {
      navFound = true;
      const items = paragraphs(el.inner, { rewriteHref });
      if (items.length !== PRIVACY_IDS.length) {
        throw new Error(`privacidade: expected ${PRIVACY_IDS.length} Navegação links, found ${items.length}`);
      }
      for (const item of items) lines.push(`- ${item}`);
      lines.push('');
      continue;
    }

    for (const p of paragraphs(el.inner, { rewriteHref })) lines.push(p, '');
  }

  if (!navFound) throw new Error('privacidade: the Navegação block was not found');
  if (headingIndex !== PRIVACY_IDS.length) {
    throw new Error(`privacidade: expected ${PRIVACY_IDS.length} sections, found ${headingIndex}`);
  }

  const body = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  const md = `${frontmatter({
    pageId: 'privacy',
    title: '\n  pt: "política de privacidade"',
    sourceUrl: '"https://www.nextvisionfilms.com/politica-de-privacidade/"',
    capturedAt: '"2026-09-01"',
    seo: '\n  noindex: false',
  })}\n\n${body}\n`;

  await fs.writeFile(OUT('politica-de-privacidade.md'), md);
  return md.length;
}

/* ------------------------------------------------------------------- main */

await fs.mkdir(path.join(ROOT, 'src', 'content', 'legal'), { recursive: true });
const t = await buildTerms();
const p = await buildPrivacy();
console.log(`  src/content/legal/termos-e-condicoes.md      ${t} chars`);
console.log(`  src/content/legal/politica-de-privacidade.md ${p} chars`);
console.log('\nRun `npm run validate:legal` to prove no word changed.');
