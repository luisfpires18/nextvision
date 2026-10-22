/**
 * The six remaining Portuguese pages — copy, with provenance.
 *
 * ── The rule ─────────────────────────────────────────────────────────────────
 * Every published string is VERBATIM from the live site, captured in Phase 0.5 and held in
 * docs/source-archive/pages.json. Nothing here is written, shortened, corrected or
 * translated (CLAUDE.md §2, §8), and `scripts/validate-data.mjs` proves it: each entry
 * declares the page it was published on, and the validator fails the build if the string
 * is not present in that page's archived text.
 *
 * Its oddities survive on purpose — the space before the full stop in the services lead,
 * the formal `a sua mensagem` on /obrigado/ where the rest of the site says `a tua`, the
 * `Contacto Directo` heading above a paragraph about the form. They are catalogued as
 * observations in docs/WEBSITE_AUDIT.md §9.24 and are the owners' to change, not ours.
 *
 * Since Phase A0 the strings themselves live in src/content/page-content/*.json, one file
 * per page, so they can be changed without touching code. This module composes them and
 * keeps the notes that explain them.
 *
 * ── What is NOT here ─────────────────────────────────────────────────────────
 * The four services and the two team members are content-collection entries
 * (src/content/services/, src/content/team/), because those are lists the owners will
 * add to. The two legal documents are content entries too, generated from the archive by
 * `npm run legal:build` and checked by `npm run validate:legal`. This file holds only the
 * page-level prose, which is the same shape as src/lib/homepage.ts and src/lib/portfolio.ts.
 */

import { HOME, type Provenanced } from './homepage.ts';
import { PAGE_CONTENT } from './page-content.ts';

const { about, services, contact, thanks } = PAGE_CONTENT;

/* ═════════════════════════════════════════════════════════════════ /sobre/ ══ */

/**
 * The hierarchy is NOT the live page's.
 *
 * `/sobre/` publishes `Sobre Nós` as its <h1> and `De uma ideia a um movimento.` as the
 * <h2> under it. On a page whose job is to say who this company is, the second line is
 * the one carrying the claim and the first is a label — so the label becomes the eyebrow
 * and the statement becomes the <h1>. Both strings are published, both are unchanged,
 * and the reordering is the presentation change CLAUDE.md §2 permits ("You may reorder
 * preserved content for presentation if meaning is not changed").
 *
 * The <title> is untouched: `Sobre - We are NVF - Produtora Audiovisual`.
 */
export const ABOUT = {
  eyebrow: HOME.aboutTitle,   // 'Sobre Nós'
  lead: HOME.aboutLead,       // 'De uma ideia a um movimento.'

  /** The origin story. Two published paragraphs, in their published order. */
  storyA: HOME.aboutBodyFull,
  storyB: about.copy.storyB,

  /**
   * The closing statement. One paragraph on the live page, separated into four by its own
   * double line breaks — which is how it is set here. Note `um bom produto de audiovisual`:
   * the homepage prints the same sentence with `um bom vídeo`. Both are reproduced as
   * published (audit §3.2).
   */
  closing: about.copy.closing,

  /** The page's own invitation to the work, and its own button label. */
  workLineA: about.copy.workLineA,
  workLineB: about.copy.workLineB,
  ctaPortfolio: about.copy.ctaPortfolio,

  /**
   * The live page's own og:description — a WordPress auto-excerpt, truncated mid-word
   * with an ellipsis. RETAINED AS THE RECORD OF WHAT THE SOURCE PUBLISHED and no longer
   * printed: Phase 11 gives every page a real description composed of whole published
   * sentences (src/lib/page-meta.ts). Nothing was rewritten to get there — the excerpt
   * was replaced by a SELECTION from the same page's own prose.
   */
  wordpressExcerpt: about.wordpressExcerpt,
} as const;

/* ══════════════════════════════════════════════════════════════ /servicos/ ══ */

/**
 * A run of the services lead, and whether the live page marks it.
 *
 * `en` mirrors `text` run for run, so the English lead carries the SAME emphasis in the
 * same three places. It is not a re-decoration of the sentence: the source decided which
 * phrases are marked, and the translation only decides what those phrases are in English.
 */
export interface LeadSegment { text: string; en: string; mark?: boolean | undefined }

/**
 * The services lead, in the live page's own emphasis.
 *
 * `/servicos/` sets three phrases — `transformar`, `ideias`, `visão autêntica` — on a
 * yellow ground with a `fundo_amarelo` span. That is published emphasis, not decoration
 * we invented, and it is the one place on this site where gold behaves exactly as the
 * token rules require: a SURFACE with ink on it, never text (7.56:1, ARCHITECTURE §5.2).
 *
 * The segments concatenate to `HOME.servicesLeadFull` character for character, and
 * `scripts/validate-data.mjs` asserts it — so the highlight can never drift into an edit.
 *
 * The source sets a space before its full stop and the English does not reproduce it: a
 * typo is not a voice (docs/SEO_I18N_ROLLOUT.md §2). Segments: services.json `lead`.
 */
export const SERVICES_LEAD: LeadSegment[] = services.lead;

export const SERVICES_PAGE = {
  title: HOME.servicesTitle,   // 'Serviços'

  /**
   * The page's closing invitation.
   *
   * On the live site these three lines sit above a form whose submit button reads
   * `Subscrever Newsletter` — a mismatch catalogued as decision D10 and audit §3.5. The
   * newsletter has no known destination (D18) and no endpoint — Phase 13 built the
   * CONTACT endpoint only, and this one waits on D18 — so the
   * lines are published as what they are — an invitation to make contact — and the
   * control goes to `/contactos/`. A control is rendered only when it controls something
   * (decision A41); a dead newsletter form under `Vamos Conversar!` would be the live
   * site's own confusion, reproduced.
   */
  closeLineA: services.copy.closeLineA,
  closeLineB: services.copy.closeLineB,
  closeBody: services.copy.closeBody,

  /** See the note on ABOUT.wordpressExcerpt. Retained, not published. */
  wordpressExcerpt: services.wordpressExcerpt,
} as const;

/* ═════════════════════════════════════════════════════════════ /contactos/ ══ */

export const CONTACT = {
  title: HOME.contactTitle,   // 'Contactos'
  lead: HOME.contactLead,     // 'Pronto para transformar a tua visão em imagens?'
  body: HOME.contactBody,
  phoneNote: HOME.phoneNote,  // '*custo para chamada móvel nacional.'

  /** The two published <h2> on the lower half of the page, in their published order. */
  formHeading: contact.copy.formHeading,
  directHeading: contact.copy.directHeading,
  directBody: contact.copy.directBody,

  /**
   * See the note on ABOUT.wordpressExcerpt. Retained, not published — and on this page
   * that also settles a real defect: the live excerpt prints
   * `nextvisionfilmsagency@gmail.com`, one of the three addresses decision D2 has not
   * settled. Phase 10 shipped it verbatim as preserved metadata; Phase 11 stops
   * publishing it, so no page offers a disputed address any more, in any element.
   */
  wordpressExcerpt: contact.wordpressExcerpt,

  /**
   * The anchor the live homepage CTA already targets: `/contactos#contactar`.
   *
   * Localised, because a fragment is part of the URL a reader sees and copies. The
   * Portuguese one is an EXISTING target and is frozen; the English one has no history.
   */
  formAnchor: { pt: 'contactar', en: 'contact' } as const,
} as const;

/**
 * The contact form, exactly as published.
 *
 * The live form is an Elementor Pro form posting to `admin-ajax.php`. Its FIELD
 * STRUCTURE is preserved here and nothing is added to it: four inputs, one consent
 * checkbox, one honeypot, one submit. No field was invented, none was made required that
 * was not, and none was dropped.
 *
 * Two things the live form gets wrong and this one does not, neither of which changes a
 * word: every field is announced by a real `<label>` rather than by a placeholder alone,
 * and `Política de Privacidade` in the consent label is a link to the page it names.
 *
 * `required` mirrors the live form exactly — only the email address is required, and the
 * GDPR consent checkbox is NOT (audit §9.16, decision D9). Making it required is an
 * owner decision about a legal obligation, so it stays open rather than being answered
 * here.
 */
export interface ContactField {
  /** The `name` a backend will read. Kept short and stable, not Elementor's field ids. */
  name: string;
  type: 'text' | 'email' | 'tel' | 'textarea';
  /** The live placeholder, used as both the label and the placeholder. */
  label: Provenanced;
  required: boolean;
  autocomplete: string;
}

export const CONTACT_FIELDS: ContactField[] = [
  { name: 'nome', type: 'text', label: contact.form.labels.nome, required: false, autocomplete: 'name' },
  { name: 'email', type: 'email', label: contact.form.labels.email, required: true, autocomplete: 'email' },
  { name: 'telefone', type: 'tel', label: contact.form.labels.telefone, required: false, autocomplete: 'tel' },
  { name: 'mensagem', type: 'textarea', label: contact.form.labels.mensagem, required: false, autocomplete: 'off' },
];

export const CONTACT_FORM_COPY = {
  /** The live consent label, unchanged. `Política de Privacidade` becomes a real link. */
  consent: contact.form.consent,
  /**
   * The words inside that label which link to /politica-de-privacidade/.
   *
   * Per locale, because the sentence around them is per locale and the link has to be a
   * literal run of that sentence — the phrase is not translated separately from the
   * sentence it sits in, or the split below would find nothing and the link would vanish.
   */
  consentLink: contact.form.consentLink,
  submit: contact.form.submit,
  /** The live form's hidden text input. Kept: a honeypot only works if it looks real. */
  honeypot: 'empresa',
} as const;

/* ══════════════════════════════════════════════════════════════ /obrigado/ ══ */

/**
 * The success page. It carries the published message and nothing else — it is a state,
 * not a destination, and there is no form pointing at it yet (Phase 10).
 *
 * `a sua mensagem` is formal where the rest of the site is informal (`a tua história`).
 * That inconsistency is the live site's and is preserved (decision D10, audit §3.7).
 */
export const THANKS = {
  title: thanks.copy.title,
  lineA: thanks.copy.lineA,
  lineB: thanks.copy.lineB,
  /** See the note on ABOUT.wordpressExcerpt. Retained, not published. */
  wordpressExcerpt: thanks.wordpressExcerpt,
} as const;

/* ════════════════════════════════════════════════════════════════ legal ══ */

/**
 * Both legal pages publish no meta description and no og:image on the live site. That
 * asymmetry is preserved rather than "fixed": writing one is copy, and copy proposals are
 * Phase 11b (CLAUDE.md §2.1).
 */
export const LEGAL_PAGES = {
  terms: { id: 'termos-e-condicoes' },
  privacy: { id: 'politica-de-privacidade' },
} as const;
