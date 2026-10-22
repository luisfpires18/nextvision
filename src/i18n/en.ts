/**
 * English UI strings — PHASE 11.
 *
 * UI CHROME ONLY, exactly like src/i18n/pt.ts: navigation labels, control text,
 * accessible names. Page CONTENT is translated where it lives — content collections for
 * projects, services, categories and people, and src/lib/*.ts for page prose, where each
 * English string sits beside the Portuguese one it translates.
 *
 * ── The rule these follow ────────────────────────────────────────────────────
 * A `[live]` Portuguese label is published copy and may not be edited (CLAUDE.md §2), but
 * its ENGLISH counterpart does not exist on the live site at all, so writing one is
 * authoring rather than rewriting. It is translated faithfully and at the same register:
 * `Ver Tudo` is title case and stays title case; `termos e condições` is lower case in
 * the published footer and stays lower case here.
 *
 * `astro check` proves this is exhaustive — Record<UIKey, string> has no optional keys —
 * and `npm run validate:data` fails the build on a partially filled dictionary, so the
 * mixed-language page this file used to prevent by being empty is now prevented by being
 * complete.
 */
import type { UIKey } from './pt.ts';

export const en: Record<UIKey, string> = {
  // --- navigation
  'nav.about': 'About',
  'nav.portfolio': 'Portfolio',
  'nav.services': 'Services',
  'nav.contact': 'Contact',
  'nav.home': 'Home',
  'nav.menu': 'Menu',
  'nav.open': 'Open menu',
  'nav.close': 'Close menu',
  'nav.skip': 'Skip to content',
  // Lower case, because the published Portuguese footer link is lower case.
  'nav.terms': 'terms and conditions',
  'nav.privacy': 'privacy policy',
  'nav.legal': 'Legal information',

  // --- language switch
  'lang.label': 'Language',
  'lang.switch': 'Change language',
  'lang.noTranslation': 'This page exists in Portuguese only',
  'lang.ptOnly': 'in Portuguese',

  // --- media controls
  'media.play': 'Play',
  'media.pause': 'Pause',
  'media.mute': 'Mute',
  'media.unmute': 'Unmute',
  'media.playFilm': 'Watch the film',
  'media.loading': 'Loading',

  // --- project browsing
  'project.viewProject': 'View project',
  // States a fact about the source and makes no claim about the work (decision D6).
  'project.noFilm': 'No published video',
  'project.scroll': 'Continue',
  'project.moreIn': 'More in',

  // --- generic UI
  'ui.close': 'Close',
  'ui.more': 'See more',
  'ui.back': 'Back',
  'ui.next': 'Next',
  'ui.previous': 'Previous',
  // Title case, matching the published `Ver Tudo`.
  'ui.all': 'View All',
  'ui.filter': 'Filter',
  'ui.clearFilter': 'Clear filters',

  // --- errors / empty states
  'error.404.title': 'Page not found',
  'error.offline.title': 'No connection',
  'error.404.body': 'The address you asked for does not exist on this site.',
  'error.404.code': 'Error 404',
  'error.404.address': 'Requested address',
  'error.offline.body': 'You are offline. Pages you have already visited stay readable; the films need a network.',
  'error.offline.retry': 'Try again',
  'error.offline.code': 'No network',

  // --- contact form
  // Authored in both languages rather than translated from one: the live site has no
  // error states to preserve, so neither string is a rendering of the other and the
  // English is allowed to be idiomatic English.
  'form.status': 'Form status',
  'form.sending': 'Sending…',
  'form.needsJs': 'This form needs JavaScript for the security check.',
  'form.error.missing-email': 'Enter your email.',
  'form.error.invalid-email': 'That email does not look valid.',
  'form.error.consent-required': 'Accept the Privacy Policy to continue.',
  'form.error.too-long': 'The message is too long.',
  'form.error.malformed': 'The form could not be read. Try again.',
  'form.error.captcha-missing': 'Complete the security check.',
  'form.error.captcha-failed': 'The security check failed. Try again.',
  'form.error.rejected': 'The message could not be sent.',
  'form.error.not-configured': 'Sending messages is not available yet.',
  'form.error.delivery-failed': 'We could not send the message right now. Try again later.',
  'form.error.network': 'No connection to the server. Try again.',

  // --- app update
  'pwa.updateAvailable': 'A new version is available',
  'pwa.update': 'Update',
  'pwa.dismiss': 'Dismiss',

  // --- design v2 (Tatiana)
  'rail.home': 'Homepage',
  'rail.about': 'About',
  'rail.commercial': 'Commercial',
  'rail.cinema': 'Cinema',
  'rail.bts': 'BTS',
  'rail.label': 'Sections',
  'rail.next': 'Next section',
  'ui.letsTalk': "Let's talk",
  'cinema.view': 'View',
  'cinema.shelf': 'Shelf',
  'cinema.list': 'List',
  'cinema.watch': 'See the project',
  'bts.social': 'Social',
  'intro.skip': 'Skip the opening',
};
