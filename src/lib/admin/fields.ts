/**
 * What an owner can change on each page, and where each value is stored.
 *
 * Organised by the page a value APPEARS on, not by the file that holds it: the About
 * page's title lives in home.json for historical reasons (Phase A0 kept the old shape),
 * and an owner should never need to know that. One screen may therefore save to two
 * files; the save is still one commit (github.ts `commitFiles`).
 *
 * What is NOT here is deliberate:
 *   - strings the current design does not render (home.json workLineA/B, workBodyB,
 *     ctaPortfolio, servicesLead, aboutBodyB; about.json closing, workLineA/B — the
 *     About closing block the owners removed on 2026-10-29; portfolio.json `more`;
 *     bts.json `frames`, whose grid the owners had taken off /bts/; services.json
 *     `lead` and `copy`, off the page since 2026-10-29) — editing them
 *     would change nothing anyone can see;
 *   - the WordPress excerpts, which are an archive record and not published.
 * And what is LOCKED says why, in the owners' words.
 *
 * Pure data, no imports, so the edit rules and their test can use it anywhere.
 */

export type PageFileName = 'home' | 'about' | 'services' | 'contact' | 'thanks' | 'portfolio' | 'bts';

export interface FieldDef {
  file: PageFileName;
  /**
   * Dotted path into the file. `*` expands to every item of a list that exists; a final
   * `+` is the slot one past the end of a list, which only an upload can fill (it appends).
   */
  path: string;
  label: string;
  /**
   * `film` is a YouTube id, entered as an id or an address. `line` is one plain string.
   * The three list kinds are a whole list in one field, added to, removed from and
   * reordered in the browser: `images` (image keys), `films` ({ id, title, poster }) and
   * `categories` (category slugs).
   */
  kind: 'text' | 'image' | 'video' | 'film' | 'line' | ListKind;
  note?: string;
  /** Shown but not editable, and why. */
  locked?: string;
  /**
   * A slot a file can be uploaded FOR, with no control of its own on the form: the list
   * field above it already edits the value. Never a draft.
   */
  uploadOnly?: true;
}

export type ListKind = 'images' | 'films' | 'categories';
export const LIST_KINDS: readonly string[] = ['images', 'films', 'categories'];
export const isListKind = (kind: string): kind is ListKind => LIST_KINDS.includes(kind);

const LOCK_LEAD = 'Este texto tem de coincidir letra a letra com as três palavras destacadas a amarelo. Para o mudar, fale com o programador: as duas partes mudam juntas.';
const LOCK_FORM = 'Os campos do formulário estão ligados ao envio das mensagens. Mudam-se com o programador.';

export const SCREENS: Record<PageFileName, FieldDef[]> = {
  home: [
    { file: 'home', path: 'heroVideo', label: 'Vídeo da página inicial', kind: 'video', note: 'O filme de fundo. A imagem de capa vem com ele.' },
    { file: 'home', path: 'copy.heroLineA', label: 'Frase de abertura, 1.ª linha', kind: 'text' },
    { file: 'home', path: 'copy.heroLineB', label: 'Frase de abertura, 2.ª linha', kind: 'text' },
    { file: 'home', path: 'copy.workBody', label: 'Frase para pesquisa no Google', kind: 'text', note: 'Não aparece na página: é a descrição que o Google mostra para a página inicial e o portfólio.' },
    { file: 'home', path: 'copy.copyright', label: 'Copyright', kind: 'text', locked: 'O ano é posto automaticamente. O resto do texto é fixo.' },
  ],
  about: [
    { file: 'home', path: 'copy.aboutTitle', label: 'Etiqueta por cima do título', kind: 'text' },
    { file: 'home', path: 'copy.aboutLead', label: 'Título da página', kind: 'text', note: 'Também é usado na descrição para pesquisa.' },
    { file: 'home', path: 'copy.aboutBodyFull', label: 'História, 1.º parágrafo', kind: 'text' },
    { file: 'about', path: 'copy.storyB', label: 'História, 2.º parágrafo', kind: 'text' },
  ],
  services: [
    { file: 'home', path: 'copy.servicesTitle', label: 'Título da página', kind: 'text' },
    { file: 'services', path: 'collage', label: 'Imagens do carrossel', kind: 'images', note: 'As imagens com que o carrossel abre, por ordem. A segunda aparece à frente. Depois delas vêm os projetos das categorias abaixo.' },
    { file: 'services', path: 'collage.+', label: 'Nova imagem do carrossel', kind: 'image', uploadOnly: true },
    { file: 'services', path: 'categories', label: 'Projetos no carrossel', kind: 'categories', note: 'Os projetos destas categorias entram no carrossel depois das imagens, pela ordem do portfólio.' },
    { file: 'services', path: 'films', label: 'Vídeos do YouTube', kind: 'films', note: 'Os vídeos por baixo do carrossel, de cima para baixo. Pode não haver nenhum.' },
    { file: 'services', path: 'films.*.poster', label: 'Capa do vídeo', kind: 'image', uploadOnly: true },
    { file: 'services', path: 'leadImage', label: 'Imagem de partilha', kind: 'image', note: 'Não aparece na página: é a imagem mostrada quando a página é partilhada.' },
    { file: 'home', path: 'copy.servicesLeadFull', label: 'Frase para pesquisa no Google', kind: 'text', locked: LOCK_LEAD, note: 'Não aparece na página: é a descrição que o Google mostra para esta página.' },
  ],
  contact: [
    { file: 'contact', path: 'banner', label: 'Imagem de topo', kind: 'image' },
    { file: 'home', path: 'copy.contactTitle', label: 'Título', kind: 'text' },
    { file: 'home', path: 'copy.contactLead', label: 'Pergunta de abertura', kind: 'text', note: 'Também aparece no fim de outras páginas.' },
    { file: 'home', path: 'copy.contactBody', label: 'Texto de contacto', kind: 'text', note: 'Também aparece no fim de outras páginas.' },
    { file: 'home', path: 'copy.ctaContact', label: 'Botão de contacto', kind: 'text', note: 'Também aparece no fim de outras páginas.' },
    { file: 'home', path: 'copy.phoneNote', label: 'Nota sobre o custo da chamada', kind: 'text' },
    { file: 'contact', path: 'copy.formHeading', label: 'Título do formulário', kind: 'text' },
    { file: 'contact', path: 'copy.directHeading', label: 'Título do contacto direto', kind: 'text' },
    { file: 'contact', path: 'copy.directBody', label: 'Texto do contacto direto', kind: 'text' },
    { file: 'contact', path: 'form.consent', label: 'Frase de consentimento', kind: 'text', locked: LOCK_FORM },
  ],
  thanks: [
    { file: 'thanks', path: 'copy.title', label: 'Título', kind: 'text' },
    { file: 'thanks', path: 'copy.lineA', label: 'Mensagem, 1.ª linha', kind: 'text' },
    { file: 'thanks', path: 'copy.lineB', label: 'Mensagem, 2.ª linha', kind: 'text' },
    { file: 'about', path: 'copy.ctaPortfolio', label: 'Botão do portfólio', kind: 'text' },
  ],
  portfolio: [
    { file: 'portfolio', path: 'copy.title', label: 'Título', kind: 'text', note: 'Não aparece na página: é o título para leitores de ecrã e para a pesquisa.' },
    { file: 'portfolio', path: 'copy.lead', label: 'Frase', kind: 'text', note: 'Não aparece na página: é usada na descrição para pesquisa.' },
    { file: 'portfolio', path: 'copy.all', label: 'Filtro «todos»', kind: 'text' },
  ],
  bts: [],
};

/** Each screen's name, as the admin's navigation shows it. */
export const SCREEN_LABELS: Record<PageFileName, string> = {
  home: 'Página inicial',
  about: 'Página Sobre',
  services: 'Página Serviços',
  contact: 'Página Contactos',
  thanks: 'Página Obrigado',
  portfolio: 'Página Portfólio',
  bts: 'Página Know more about us',
};

/** Every repository path a screen may write. */
export const pageFilePath = (file: PageFileName): string => `src/content/page-content/${file}.json`;
