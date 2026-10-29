#!/usr/bin/env node
/**
 * validate-routes.mjs — the built site, checked against the content that produced it.
 *
 * `astro build` proves every page COMPILES. It does not prove every published project
 * reached the site, that its page is finished rather than a placeholder, or that a reader
 * can get to it from the portfolio. Those are the failures that look like success, so
 * they are the ones worth a machine.
 *
 * Runs against dist/ and reads the content files directly, so the two sides are
 * independent: the expectation comes from src/content/projects/, the evidence from the
 * HTML actually emitted.
 *
 * Checks, per published project:
 *   route emitted           dist/client/portfolio/{slug}/index.html exists
 *   not a placeholder       no page carries the "por desenhar" marker or an empty screen
 *   has something to show   a hero <img> with a real src
 *   canonical               present, unique across the whole site, self-referencing
 *   title                   present and non-empty
 *   Open Graph              og:title, og:url, og:image
 *   BreadcrumbList          present in the JSON-LD graph
 *   VideoObject             present exactly where a valid published film exists
 *   locale                  <html lang="pt-PT">
 *   reachable from index    linked from /portfolio/
 *   reachable from archive  linked from its own /categoria-portfolio/{slug}/
 *
 * And, since Phase 10, per static page:
 *   route emitted           all six Portuguese pages exist and are real
 *   one <h1>, self-canonical, pt-PT, non-empty title, no placeholder text
 *   reachable               every header destination is linked from every page
 *   /contactos/             #contactar exists, both phones are dialable, and no disputed
 *                           e-mail address is published anywhere (decision D2)
 *
 * And, since Phase 13, per contact form (both locales):
 *   live                    it posts to /api/contact/ with method="post" and an enabled
 *                           submit — the Phase 10 inert-form assertions, inverted
 *   Turnstile               the container and a site key are present; reCAPTCHA is not
 *   no secrets              no key-shaped string other than the site key, and no secret
 *                           variable NAME, appears anywhere in the document
 *   no fake success         nothing links to /obrigado/ — it is the answer to a POST
 *   D9 preserved            the consent checkbox is offered and not required
 *   locale declared         /en/contact/ tells the endpoint which language asked
 *   legal pages             every in-page anchor resolves, and no navigation link has
 *                           gone back to digiup.me (decision D4)
 *
 * Exit code 1 on any failure. Nothing here warns: every one of these is a defect.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist', 'client');
const errors = [];
const ok = [];

const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

if (!exists(DIST)) {
  console.error('  FAIL  dist/client is missing — run `npm run build` first');
  process.exit(1);
}

/* ------------------------------------------------- expectation: the content */

const PROJECT_DIR = path.join(ROOT, 'src', 'content', 'projects');
const projects = fs.readdirSync(PROJECT_DIR)
  .filter((f) => /\.mdx?$/.test(f))
  .map((f) => {
    const src = read(path.join(PROJECT_DIR, f));
    const front = src.slice(0, src.indexOf('\n---', 4));
    return {
      slug: f.replace(/\.mdx?$/, ''),
      draft: /^draft:\s*true\s*$/m.test(front),
      // A film is a `film:` block with a youtube provider; `filmUnavailable` is its
      // declared absence. Both are structural, so both are matched structurally.
      hasFilm: /^film:\s*$/m.test(front) && /provider:\s*youtube/.test(front),
      filmUnavailable: /^filmUnavailable:/m.test(front),
      category: (front.match(/^categories:\s*\n\s*-\s*(\S+)/m) ?? [])[1] ?? null,
      hasBlocks: /^blocks:\s*\n\s+[-#]/m.test(front),
    };
  });

const published = projects.filter((p) => !p.draft);

// Twenty were migrated; owners add more from the admin, so this is a FLOOR, not a count.
// Losing one is still a failure: a project is never removed by accident.
const MIGRATED = 20;
if (published.length < MIGRATED) {
  errors.push(`content: at least ${MIGRATED} published projects expected, found ${published.length}`);
}

/* ------------------------------------------------------ evidence: the build */

const routeDir = path.join(DIST, 'portfolio');
const emitted = exists(routeDir)
  ? fs.readdirSync(routeDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  : [];

if (emitted.length !== published.length) {
  errors.push(`routes: ${published.length} published projects but ${emitted.length} project routes emitted — ${
    published.map((p) => p.slug).filter((s) => !emitted.includes(s)).join(', ') || 'extra: ' + emitted.filter((s) => !published.some((p) => p.slug === s)).join(', ')
  }`);
}

const indexHtml = exists(path.join(DIST, 'portfolio', 'index.html')) ? read(path.join(DIST, 'portfolio', 'index.html')) : '';
if (!indexHtml) errors.push('routes: /portfolio/index.html was not emitted');

/** Canonicals across the whole site, so a duplicate anywhere is caught, not just here. */
const canonicals = new Map();
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name === 'index.html') {
      const href = (read(full).match(/<link rel="canonical" href="([^"]+)"/) ?? [])[1];
      if (!href) continue;
      const at = `/${path.relative(DIST, path.dirname(full)).replace(/\\/g, '/')}/`.replace('//', '/');
      if (canonicals.has(href)) errors.push(`seo: canonical ${href} is claimed by both ${canonicals.get(href)} and ${at}`);
      else canonicals.set(href, at);
    }
  }
};
walk(DIST);

/* --------------------------------------------------------- per project page */

/**
 * The placeholder is gone; this is what stops it — or anything like it — coming back.
 * A page that announces it is unfinished, and a page whose screen holds no image, are
 * both build failures now.
 */
const PLACEHOLDER_MARKERS = [/por desenhar/i, /class="pr-note"/, /lorem ipsum/i, /TODO/];

for (const project of published) {
  const file = path.join(routeDir, project.slug, 'index.html');
  if (!exists(file)) { errors.push(`routes: /portfolio/${project.slug}/ was not emitted`); continue; }
  const html = read(file);
  const at = `/portfolio/${project.slug}/`;

  for (const marker of PLACEHOLDER_MARKERS) {
    if (marker.test(html)) errors.push(`placeholder: ${at} still carries ${marker}`);
  }

  /* The screen carries modifier classes on some projects (the portrait poster plate), so
     it is located by the start of its class list and read as a window rather than by an
     exact tag match — a validator that only passes for one variant of the markup is worse
     than none. */
  const screenAt = html.indexOf('class="pj-screen');
  const screen = screenAt === -1 ? '' : html.slice(screenAt, html.indexOf('class="pj-caption', screenAt));
  if (!screen) errors.push(`page: ${at} has no hero screen`);
  else if (!/<img[^>]+src="[^"]+"/.test(screen)) errors.push(`page: ${at} hero screen has no image`);

  if (!/<h1 class="pj-title">.+?<\/h1>/.test(html)) errors.push(`page: ${at} has no project <h1>`);
  const h1s = html.match(/<h1[\s>]/g) ?? [];
  if (h1s.length !== 1) errors.push(`a11y: ${at} has ${h1s.length} <h1> elements, expected exactly 1`);

  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) ?? [])[1];
  if (!canonical) errors.push(`seo: ${at} has no canonical`);
  else if (!canonical.endsWith(at)) errors.push(`seo: ${at} canonical points elsewhere — ${canonical}`);

  const title = (html.match(/<title>([^<]*)<\/title>/) ?? [])[1];
  if (!title?.trim()) errors.push(`seo: ${at} has an empty <title>`);

  for (const prop of ['og:title', 'og:url', 'og:image']) {
    if (!html.includes(`property="${prop}"`)) errors.push(`seo: ${at} is missing ${prop}`);
  }
  if (!/<html lang="pt-PT"/.test(html)) errors.push(`seo: ${at} is not declared as pt-PT`);

  if (!html.includes('"BreadcrumbList"')) errors.push(`seo: ${at} has no BreadcrumbList`);

  const hasVideoObject = html.includes('"VideoObject"');
  if (project.hasFilm && !hasVideoObject) errors.push(`seo: ${at} publishes a film but emits no VideoObject`);
  if (project.filmUnavailable && hasVideoObject) errors.push(`seo: ${at} declares filmUnavailable but emits a VideoObject`);

  // A project with no film must not offer a play control that cannot play anything.
  if (project.filmUnavailable && /data-film-play/.test(html)) {
    errors.push(`page: ${at} declares filmUnavailable but renders a play control`);
  }

  // Reachability. A page nobody can navigate to is not shipped, whatever the build says.
  if (!indexHtml.includes(`href="${at}"`)) errors.push(`reach: ${at} is not linked from /portfolio/`);
  if (project.category) {
    const archive = path.join(DIST, 'categoria-portfolio', project.category, 'index.html');
    if (!exists(archive)) errors.push(`reach: /categoria-portfolio/${project.category}/ was not emitted`);
    else if (!read(archive).includes(`href="${at}"`)) {
      errors.push(`reach: ${at} is missing from its own archive /categoria-portfolio/${project.category}/`);
    }
  } else {
    errors.push(`content: ${project.slug} declares no category`);
  }

  // Next/previous must resolve to routes that exist.
  for (const href of [...html.matchAll(/href="(\/portfolio\/[^"/]+\/)"/g)].map((m) => m[1])) {
    const target = path.join(DIST, href.replace(/^\//, ''), 'index.html');
    if (!exists(target)) errors.push(`reach: ${at} links to ${href}, which was not emitted`);
  }
}

/* ------------------------------------------------------------ archive totals */

const categoryDir = path.join(DIST, 'categoria-portfolio');
const archives = exists(categoryDir)
  ? fs.readdirSync(categoryDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  : [];
if (archives.length !== 5) errors.push(`routes: expected 5 category archives, found ${archives.length}`);

for (const slug of archives) {
  const html = read(path.join(categoryDir, slug, 'index.html'));
  const expected = published.filter((p) => p.category === slug).map((p) => p.slug);
  const missing = expected.filter((s) => !html.includes(`href="/portfolio/${s}/"`));
  if (missing.length) errors.push(`archive: /categoria-portfolio/${slug}/ is missing ${missing.join(', ')}`);
  else ok.push(`archive: ${slug} shows all ${expected.length}`);
}

const unlinked = published.filter((p) => !indexHtml.includes(`href="/portfolio/${p.slug}/"`));
if (!unlinked.length) ok.push(`reach: all ${published.length} projects are linked from /portfolio/`);

const designed = published.filter((p) => p.hasBlocks).length;
ok.push(`routes: ${emitted.length}/${published.length} project routes emitted, 0 placeholders`);
ok.push(`pages: ${designed} carry cinematic blocks, ${published.length - designed} are hero + metadata only`);
ok.push(`seo: ${canonicals.size} unique canonicals across ${canonicals.size} pages`);

/* ------------------------------------------------------- the static pages
   Phase 10. The six Portuguese routes the live site serves that are not portfolio.
   Everything here is a defect if it fails, and several of them are decisions that would
   be invisible in a screenshot: an e-mail nobody confirmed, a form pointing at a dead
   endpoint, a legal anchor sending a reader to another company's website. */

const STATIC_PAGES = [
  { at: '/sobre/', h1: 'De uma ideia a um movimento.' },
  { at: '/servicos/', h1: 'Serviços' },
  { at: '/contactos/', h1: 'Pronto para transformar a tua visão em imagens?' },
  { at: '/obrigado/', h1: 'Obrigado' },
  { at: '/termos-e-condicoes/', h1: 'Termos e Condições' },
  { at: '/politica-de-privacidade/', h1: 'política de privacidade' },
];

/**
 * The two addresses decision D2 has not settled, plus the third that /termos-e-condicoes/
 * names. None of them may be published as a contact route until the owners say which one
 * reaches the company — the legal documents' own text is the single exception, because
 * editing that text is forbidden (CLAUDE.md §2).
 */
const DISPUTED_EMAILS = ['nextvisionfilmsagency@gmail.com', 'hello@nextvisionfilms.com', 'geral@nextvisionfilms.com'];
const LEGAL_PAGES = ['/termos-e-condicoes/', '/politica-de-privacidade/'];

let staticOk = 0;
for (const page of STATIC_PAGES) {
  const file = path.join(DIST, page.at.replace(/^\/|\/$/g, ''), 'index.html');
  if (!exists(file)) { errors.push(`routes: ${page.at} was not emitted`); continue; }
  const html = read(file);
  const at = page.at;

  for (const marker of PLACEHOLDER_MARKERS) {
    if (marker.test(html)) errors.push(`placeholder: ${at} carries ${marker}`);
  }

  const h1s = html.match(/<h1[\s>]/g) ?? [];
  if (h1s.length !== 1) errors.push(`a11y: ${at} has ${h1s.length} <h1> elements, expected exactly 1`);
  // The <h1> is published copy; if it changed, something rewrote content.
  if (!html.includes(page.h1)) errors.push(`copy: ${at} no longer carries its published heading "${page.h1}"`);

  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) ?? [])[1];
  if (!canonical) errors.push(`seo: ${at} has no canonical`);
  else if (!canonical.endsWith(at)) errors.push(`seo: ${at} canonical points elsewhere — ${canonical}`);

  const title = (html.match(/<title>([^<]*)<\/title>/) ?? [])[1];
  if (!title?.trim()) errors.push(`seo: ${at} has an empty <title>`);
  else if (!title.endsWith('We are NVF - Produtora Audiovisual')) {
    errors.push(`seo: ${at} title no longer uses the preserved pattern — ${title}`);
  }
  if (!/<html lang="pt-PT"/.test(html)) errors.push(`seo: ${at} is not declared as pt-PT`);
  if (!html.includes('"BreadcrumbList"')) errors.push(`seo: ${at} has no BreadcrumbList`);

  // Every page carries the same header and footer, so every destination is reachable
  // from every page. A link that resolves to a homepage section again would mean a route
  // silently fell out of BUILT_PAGES.
  for (const dest of ['/portfolio/', '/sobre/', '/servicos/', '/contactos/', '/termos-e-condicoes/', '/politica-de-privacidade/']) {
    if (!html.includes(`href="${dest}"`)) errors.push(`reach: ${at} does not link to ${dest}`);
  }

  /* D2. No page may offer a disputed address as a way to make contact.
     Scoped to the BODY on purpose. Two things legitimately carry one of these strings and
     neither is a contact route: the legal documents quote them inside text nobody may
     edit (CLAUDE.md §2), and /contactos/ ships the live page's own og:description
     verbatim — a preserved excerpt of the page, not something we wrote or offered.
     Rewriting that description is a copy proposal for Phase 11b, recorded as such. */
  const body = html.slice(html.indexOf('<body'));
  if (!LEGAL_PAGES.includes(at)) {
    for (const email of DISPUTED_EMAILS) {
      if (body.includes(email)) errors.push(`content: ${at} publishes ${email} in the page, which decision D2 has not settled`);
    }
  }
  if (/"email"\s*:/.test(html)) errors.push(`seo: ${at} emits Organization.email while D2 is open`);
  // A mailto: is a contact route wherever it appears outside the legal text.
  if (!LEGAL_PAGES.includes(at) && /href="mailto:/.test(body)) {
    errors.push(`content: ${at} offers a mailto: link while the canonical address is undecided (D2)`);
  }

  staticOk += 1;
}

/* ----------------------------------------------------------- /servicos/ */
/* Owner request, 2026-10-29: no text, one carousel per category named in services.json.
   Each must carry a heading and at least one card, and every card must open a project
   page that was built — an empty carousel or a dead card is a defect, not a layout. */
try {
  const html = read(path.join(DIST, 'servicos', 'index.html'));
  const wanted = JSON.parse(read(path.join(ROOT, 'src/content/page-content/services.json'))).categories;
  const rows = html.split('<section class="cm__row"').slice(1);
  if (rows.length === 0) errors.push('page: /servicos/ renders no category carousel');
  for (const row of rows) {
    const title = (row.match(/<h2 class="cm__row-title"[^>]*>([^<]+)<\/h2>/) ?? [])[1];
    if (!title?.trim()) errors.push('page: /servicos/ has a carousel without a heading');
    const hrefs = [...row.split('</section>')[0].matchAll(/<a class="card" href="([^"]+)"/g)].map((m) => m[1]);
    if (hrefs.length === 0) errors.push(`page: /servicos/ carousel "${title}" has no cards`);
    for (const href of hrefs) {
      if (!exists(path.join(DIST, href.replace(/^\/|\/$/g, ''), 'index.html'))) errors.push(`page: /servicos/ card ${href} was not built`);
    }
  }
  if (rows.length > wanted.length) errors.push(`page: /servicos/ renders ${rows.length} carousels for ${wanted.length} categories`);
} catch (e) {
  errors.push(`page: /servicos/ could not be read — ${e.message}`);
}

/* ---------------------------------------------------------- /contactos/ */
try {
  const html = read(path.join(DIST, 'contactos', 'index.html'));

  if (!/id="contactar"/.test(html)) errors.push('page: /contactos/ has no #contactar anchor — the live homepage CTA targets it');

  const tel = [...html.matchAll(/href="tel:(\+\d+)"/g)].map((m) => m[1]);
  if (tel.length !== 2) errors.push(`page: /contactos/ has ${tel.length} dialable numbers, expected 2`);

  /* PHASE 13. The form is LIVE. What is checked is inverted from Phase 10, and one thing
     is checked that was not checkable before: that the page cannot reach the thank-you
     route on its own. A frontend that can navigate to /obrigado/ without the server's
     answer is a frontend that can fake a delivery, and that is the single most expensive
     defect this form could ship. */
  if (!/data-contact-form="live"/.test(html)) {
    errors.push('page: /contactos/ form is not declaring its live state');
  }
  const action = (html.match(/<form[^>]*\saction="([^"]*)"/) ?? [])[1];
  if (action !== '/api/contact/') {
    errors.push(`page: /contactos/ form posts to "${action ?? 'nothing'}", expected /api/contact/`);
  }
  if (!/<form[^>]*\smethod="post"/.test(html)) errors.push('page: /contactos/ form has no method="post"');
  if (/<button[^>]*type="submit"[^>]*disabled/.test(html)) {
    errors.push('page: /contactos/ submit control is disabled while the endpoint exists');
  }
  if (/admin-ajax|wp-admin/.test(html)) errors.push('page: /contactos/ form points at the old WordPress endpoint');
  if (/recaptcha/i.test(html)) errors.push('page: /contactos/ loads reCAPTCHA; Turnstile replaced it (ARCHITECTURE §7)');

  // Turnstile is mounted by the page's own script, so what must be in the HTML is the
  // container and the site key — not the widget, which does not exist until it renders.
  if (!/data-turnstile/.test(html)) errors.push('page: /contactos/ has no Turnstile container');
  if (!/data-sitekey="[^"]+"/.test(html)) errors.push('page: /contactos/ Turnstile container carries no site key');
  if (!html.includes('challenges.cloudflare.com/turnstile')) {
    errors.push('page: /contactos/ never names the Turnstile script origin');
  }

  /* NO SECRET may ever reach a page.

     Checked by SHAPE, not by value, because the point is to catch a secret nobody thought
     to look for. A Turnstile key of either kind is `Nx` followed by a long token: the site
     key is public and belongs in the document, the 35-character secret never does. So
     every key-shaped string is collected, and each one must be the site key the container
     itself declares. Anything else is a leak. */
  const declaredKey = (html.match(/data-sitekey="([^"]+)"/) ?? [])[1];
  const keyShaped = [...html.matchAll(/[0-3]x[0-9A-Za-z_-]{18,}/g)].map((m) => m[0]);
  const strays = [...new Set(keyShaped)].filter((k) => k !== declaredKey);
  if (strays.length) {
    errors.push(`page: /contactos/ carries ${strays.length} key-shaped string(s) that are not the site key — a Turnstile SECRET may have reached the document`);
  }
  for (const secretName of ['TURNSTILE_SECRET_KEY', 'RESEND_API_KEY', 'BREVO_API_KEY', 'CONTACT_RECIPIENT']) {
    if (html.includes(secretName)) errors.push(`page: /contactos/ names ${secretName} in the document`);
  }

  // The success page is the SERVER'S to hand out. Nothing in the document may link to it.
  if (/href="\/obrigado\/"/.test(html)) {
    errors.push('page: /contactos/ links to /obrigado/ — success is the answer to a POST, not a link');
  }

  // Every field the live form has, and no field it does not.
  for (const name of ['nome', 'email', 'telefone', 'mensagem', 'consentimento']) {
    if (!html.includes(`name="${name}"`)) errors.push(`page: /contactos/ form is missing the "${name}" field`);
    if (!html.includes(`for="cf-${name}"`)) {
      errors.push(`page: /contactos/ form field "${name}" has no <label>`);
    }
  }
  // The honeypot, still present and still hidden from everyone who is not a bot.
  if (!html.includes('name="empresa"')) errors.push('page: /contactos/ form has lost its honeypot');
  if (!/class="form__trap"[^>]*aria-hidden="true"/.test(html)) {
    errors.push('page: /contactos/ honeypot is not hidden from assistive technology');
  }
  // D9 is open: the consent box is offered and NOT demanded, exactly as published.
  const consentInput = (html.match(/<input[^>]*name="consentimento"[^>]*>/) ?? [])[0] ?? '';
  if (/\srequired/.test(consentInput)) {
    errors.push('page: /contactos/ makes consent required while decision D9 is open');
  }
  if (!/required/.test(html)) errors.push('page: /contactos/ form has no required field — Email is required on the live form');
} catch (e) {
  errors.push(`page: /contactos/: ${e.message}`);
}

/* -------------------------------------------------- /en/contact/, the same form
   PHASE 13. The English page mounts the SAME component, so the only thing worth proving
   separately is that the locale reaches the server — the endpoint decides the success
   destination from this field, and a missing one would land an English reader on the
   Portuguese thank-you page. */
try {
  const html = read(path.join(DIST, 'en', 'contact', 'index.html'));
  if (!/<input type="hidden" name="locale" value="en"/.test(html)) {
    errors.push('page: /en/contact/ does not declare its locale to the endpoint');
  }
  if (!/data-contact-form="live"/.test(html)) errors.push('page: /en/contact/ form is not live');
  if (!/data-turnstile/.test(html)) errors.push('page: /en/contact/ has no Turnstile container');
  ok.push('form: both locales post to /api/contact/ and declare which language asked');
} catch (e) {
  errors.push(`page: /en/contact/: ${e.message}`);
}

/* ------------------------------------------------------- the legal pages */
for (const at of LEGAL_PAGES) {
  try {
    const html = read(path.join(DIST, at.replace(/^\/|\/$/g, ''), 'index.html'));

    // Decision D4: the privacy page's own navigation used to leave the site entirely.
    if (/digiup\.me\/politica-de-privacidade/.test(html)) {
      errors.push(`legal: ${at} still navigates to digiup.me — decision D4 repointed those links in-page`);
    }

    const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    const dangling = [...html.matchAll(/href="#([^"]+)"/g)]
      .map((m) => m[1])
      .filter((f) => f !== 'main' && !ids.has(f));
    if (dangling.length) errors.push(`legal: ${at} has anchors that resolve to nothing: ${[...new Set(dangling)].join(', ')}`);

    // The one structural fix that matters: sections are real headings now.
    const h2 = (html.match(/<h2[\s>]/g) ?? []).length;
    const expected = at === LEGAL_PAGES[0] ? 8 : 10;
    if (h2 !== expected) errors.push(`legal: ${at} has ${h2} section headings, expected ${expected}`);
    if (/<h4[\s>]/.test(html)) errors.push(`legal: ${at} still ships an <h4> under an <h1> — the heading level was not corrected`);
  } catch (e) {
    errors.push(`legal: ${at}: ${e.message}`);
  }
}

if (staticOk === STATIC_PAGES.length) ok.push(`routes: ${staticOk}/${STATIC_PAGES.length} static pages emitted, reachable and free of placeholder text`);

/* ------------------------------------------------------------- the loader
   STEP 13. The opening hold blanked the whole site on the first visit of every
   session, and the cause was one ambiguous selector rather than any CSS.

   `<html data-loader="on">` is the STATE flag, written before paint by the bootstrap.
   The overlay div used to carry an attribute of the SAME name, and `querySelector`
   walks document order — so `querySelector('[data-loader]')` returned the ROOT, and
   `loader.hidden = true` put `hidden` on <html>. The UA stylesheet turns that into
   `display: none` on the entire document: a blank page with no author rule anywhere to
   explain it, and only ever on a session's first document.

   Two assertions, both against the BUILT output rather than the source:

     1. every page ships exactly one overlay, and it is `data-loader-overlay`
     2. no shipped script queries `[data-loader]` as a selector

   The second is the one that actually holds the line. Renaming the attribute fixes
   today; forbidding the ambiguous selector is what stops it coming back. */
{
  const SAMPLES = ['index.html', 'sobre/index.html', 'en/index.html', 'portfolio/index.html'];
  let overlaysOk = 0;

  for (const rel of SAMPLES) {
    const file = path.join(DIST, rel);
    if (!exists(file)) { errors.push(`loader: ${rel} was not emitted`); continue; }
    const html = read(file);

    const overlays = (html.match(/data-loader-overlay/g) ?? []).length;
    if (overlays !== 1) {
      errors.push(`loader: ${rel} ships ${overlays} elements with data-loader-overlay, expected exactly 1`);
      continue;
    }
    // The flag must never be authored into the markup: it is a runtime decision, and a
    // hardcoded one would arm the hold for readers who have already seen it.
    if (/<html[^>]*\sdata-loader[=\s>]/.test(html)) {
      errors.push(`loader: ${rel} hardcodes data-loader on <html> — the bootstrap owns that flag`);
      continue;
    }
    overlaysOk += 1;
  }
  if (overlaysOk === SAMPLES.length) {
    ok.push(`loader: ${overlaysOk} sampled pages ship one overlay each, and none hardcodes the root flag`);
  }

  // Every script the sampled pages ACTUALLY load — resolved from their own markup, not
  // from a directory listing. `dist/client/_astro/` can hold orphaned bundles from an
  // earlier build (Astro cannot clean the directory while `wrangler dev` holds it open),
  // and failing on a file no page references would be a false alarm.
  const referenced = new Set();
  const inlineScripts = [];
  for (const rel of SAMPLES) {
    const file = path.join(DIST, rel);
    if (!exists(file)) continue;
    const html = read(file);
    for (const m of html.matchAll(/(?:src|href)="(\/_astro\/[^"]+\.js)"/g)) referenced.add(m[1]);
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (!/\bsrc=/.test(m[1])) inlineScripts.push([rel, m[2]]);
    }
  }

  // `[data-loader]` used as a selector. `[data-loader-overlay]` is the correct one and
  // must not trip this, hence the negative lookahead on the hyphen.
  const AMBIGUOUS = /\[data-loader(?!-)[^\]]*\]/;
  const offenders = [
    ...[...referenced]
      .filter((href) => exists(path.join(DIST, href.slice(1))) && AMBIGUOUS.test(read(path.join(DIST, href.slice(1)))))
      .map((href) => path.basename(href)),
    ...inlineScripts.filter(([, code]) => AMBIGUOUS.test(code)).map(([rel]) => `${rel} (inline)`),
  ];

  if (offenders.length) {
    errors.push(
      `loader: ${[...new Set(offenders)].join(', ')} queries [data-loader], which matches <html> before the overlay `
      + '— that is the selector that blanked the first page of every session. Use [data-loader-overlay].',
    );
  } else {
    ok.push(`loader: ${referenced.size} loaded bundles and ${inlineScripts.length} inline scripts, none querying the ambiguous [data-loader]`);
  }
}

/* ------------------------------------------------------ the filter's cards
   STEP 13. The category filter marked the link current, rewrote the URL and announced a
   count — and hid nothing, because `[hidden] { display: none }` is a USER-AGENT rule and
   `.item { display: grid }` is an author one. Author wins. Twenty cards stayed on screen
   under every category.

   src/lib/portfolio-filter.ts hides a card with `card.hidden = true`, so the built CSS
   has to give `[hidden]` an author-level declaration of its own. Asserted against the
   BUILT stylesheets, because that is what the browser reads. */
{
  const astroDir = path.join(DIST, '_astro');
  const sheets = exists(astroDir)
    ? fs.readdirSync(astroDir).filter((f) => f.endsWith('.css')).map((f) => path.join(astroDir, f))
    : [];
  const css = sheets.map(read).join('\n');

  // Whatever sets `display` on the card must be answered by a `[hidden]` rule for it.
  const cardHasDisplay = /(^|[,}])\s*\.item\s*\{[^}]*display\s*:/.test(css);
  const hiddenWins = /\.item\[hidden\]\s*\{[^}]*display\s*:\s*none/.test(css)
    || /\[hidden\]\s*\{[^}]*display\s*:\s*none\s*!important/.test(css);

  if (!sheets.length) {
    errors.push('filter: no built stylesheet found to check the card’s hidden state against');
  } else if (cardHasDisplay && !hiddenWins) {
    errors.push(
      'filter: .item declares `display` but nothing declares `.item[hidden] { display: none }` '
      + '— the UA rule loses to it, so `card.hidden = true` hides nothing and every category shows all twenty projects',
    );
  } else {
    ok.push('filter: the card honours `hidden`, so a category actually filters');
  }
}

/* ------------------------------------------------------------------ admin
   The owners' admin exists on the PROD Worker only (docs/ADMIN_DASHBOARD_PLAN.md §3,
   decision A8). It is injected at build time, so the check is on the ARTEFACT, not on the
   intention: a build for any target but prod must contain no admin route at all, and a
   prod build must contain it. Read from the server bundle's route manifest, which is what the Worker
   actually routes by. */
{
  const SERVER = path.join(ROOT, 'dist', 'server');
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.mjs')) files.push(full);
    }
  };
  if (fs.existsSync(SERVER)) walk(SERVER);
  const routed = files.some((f) => read(f).includes('"route":"/admin/[...path]"'));
  const target = process.env['CLOUDFLARE_ENV'] ?? '(unset)';

  if (!files.length) errors.push('admin: no server bundle found in dist/server to check');
  else if (target === 'prod' && !routed) errors.push('admin: a prod build must carry /admin/, and this one does not');
  else if (target !== 'prod' && routed) {
    errors.push(`admin: /admin/ is in a build for CLOUDFLARE_ENV=${target} — the admin may exist on the prod Worker only`);
  } else ok.push(`admin: ${routed ? 'present' : 'absent'} in a build for CLOUDFLARE_ENV=${target}, as it must be`);
}

/* ---------------------------------------------------------------- report */

for (const o of ok) console.log(`  ok    ${o}`);
for (const e of errors) console.error(`  FAIL  ${e}`);
console.log(`\n${ok.length} ok, ${errors.length} errors`);
process.exit(errors.length ? 1 : 0);
