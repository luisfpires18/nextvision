/**
 * Portuguese UI strings.
 *
 * UI CHROME ONLY — navigation labels, button text, aria-labels. Page CONTENT lives in
 * content collections. Nothing here may duplicate site copy.
 *
 * Strings marked `[live]` are taken verbatim from the current website (CLAUDE.md §2).
 * Strings marked `[new]` are genuinely new UI text we author, so the Humanizer rule
 * applies to them and not to the others (CLAUDE.md §3).
 */
export const pt = {
  // --- navigation [live: menu labels as published]
  'nav.about': 'Sobre',
  'nav.portfolio': 'Portfólio',
  'nav.services': 'Serviços',
  'nav.contact': 'Contactos',
  'nav.home': 'Início',
  'nav.menu': 'Menu',
  'nav.open': 'Abrir menu',
  'nav.close': 'Fechar menu',
  'nav.skip': 'Pular para o conteúdo', // [live] existing skip link
  'nav.terms': 'termos e condições', // [live] footer link, lowercase as published
  'nav.privacy': 'política de privacidade', // [live] footer link, lowercase as published
  'nav.legal': 'Informação legal', // [new] accessible name for the footer's legal menu

  // --- language switch [new]
  'lang.label': 'Idioma',
  'lang.switch': 'Mudar idioma',
  // Shown where the current page has no counterpart in the other language. The legal
  // documents are Portuguese only and no approved translation exists, so the switch says
  // so instead of linking to a page that does not exist (src/i18n/routes.ts PAGE_LOCALES).
  'lang.noTranslation': 'Esta página existe apenas em português',
  /** Suffix on a link that leads to a Portuguese-only document from an English page. */
  'lang.ptOnly': 'em português',

  // --- media controls [new]
  'media.play': 'Reproduzir',
  'media.pause': 'Pausa',
  'media.mute': 'Desligar som',
  'media.unmute': 'Ligar som',
  'media.playFilm': 'Ver o filme',
  'media.loading': 'A carregar',

  // --- project browsing [new]
  // A card is a link to the project, so the label names that destination. It replaced
  // "Abrir" when the preview overlay was retired in Review C.
  'project.viewProject': 'Ver projeto',
  // Shown where a project's published video reference is broken (decision D6). It states
  // a fact about the source, and makes no claim about the work.
  'project.noFilm': 'Sem vídeo publicado',
  'project.scroll': 'Continuar',
  // Related work. Completed with the category's own published name, so the line states
  // the only relationship the data supports — shared taxonomy — and claims nothing about
  // resemblance (src/lib/related.ts).
  'project.moreIn': 'Mais em',

  // --- generic UI [new]
  'ui.close': 'Fechar',
  'ui.more': 'Ver mais',
  'ui.back': 'Voltar',
  'ui.next': 'Seguinte',
  'ui.previous': 'Anterior',
  'ui.all': 'Ver Tudo', // [live] existing button label
  'ui.filter': 'Filtrar',
  'ui.clearFilter': 'Limpar filtros',

  // --- errors / empty states [new]
  'error.404.title': 'Página não encontrada',
  'error.offline.title': 'Sem ligação',
  // --- 404 and offline [new]
  // Authored UI text, not migrated copy, so the Humanizer rule applies here (CLAUDE.md §3).
  // Both stay to one factual line: a 404 that explains itself at length is a page about
  // itself, and an offline screen is read once, in a hurry, on a bad connection.
  'error.404.body': 'O endereço que pediste não existe neste site.',
  'error.404.code': 'Erro 404',
  // Names the one useful fact a 404 can offer: which address failed.
  'error.404.address': 'Endereço pedido',
  'error.offline.body': 'Estás sem ligação. As páginas que já visitaste continuam legíveis; os filmes precisam de rede.',
  'error.offline.retry': 'Tentar novamente',
  'error.offline.code': 'Sem rede',

  // --- contact form [new]
  // Authored UI text, not migrated copy: the live form has no error states at all, because
  // it never validated anything in the browser (audit §3.6). Every string here names ONE
  // outcome code from src/config/forms.ts, so the server sends a code and the page says it
  // in the reader's own language — the endpoint never composes a sentence.
  //
  // Register follows the site's own: informal, second person, one line. None of them
  // apologises, because a form that says sorry for a mistyped address is a form talking
  // about itself.
  'form.status': 'Estado do formulário',
  'form.sending': 'A enviar…',
  // The security check needs scripting to run at all, so the form says so up front rather
  // than letting someone write a message and discover it on submit.
  'form.needsJs': 'Este formulário precisa de JavaScript para a verificação de segurança.',
  'form.error.missing-email': 'Escreve o teu email.',
  'form.error.invalid-email': 'Esse email não parece válido.',
  'form.error.consent-required': 'Aceita a Política de Privacidade para continuar.',
  'form.error.too-long': 'A mensagem é demasiado longa.',
  'form.error.malformed': 'Não foi possível ler o formulário. Tenta outra vez.',
  'form.error.captcha-missing': 'Completa a verificação de segurança.',
  'form.error.captcha-failed': 'A verificação de segurança falhou. Tenta outra vez.',
  'form.error.rejected': 'Não foi possível enviar a mensagem.',
  // Configuration is missing on the server. It states the fact and promises nothing.
  'form.error.not-configured': 'O envio de mensagens ainda não está disponível.',
  'form.error.delivery-failed': 'Não conseguimos enviar a mensagem agora. Tenta mais tarde.',
  'form.error.network': 'Sem ligação ao servidor. Tenta outra vez.',

  // --- app update [new]
  // Shown once, quietly, when a new build is installed and waiting. It never reloads on
  // its own (src/lib/pwa.ts, ARCHITECTURE §17.5).
  'pwa.updateAvailable': 'Nova versão disponível',
  'pwa.update': 'Atualizar',
  'pwa.dismiss': 'Dispensar',
} as const;

export type UIKey = keyof typeof pt;
