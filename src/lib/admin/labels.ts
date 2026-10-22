/**
 * Field names as an owner reads them. A field with no entry here shows its stored name,
 * which is honest about what it is rather than a guess at what it means.
 */
const LABELS: Record<string, string> = {
  title: 'Título', tagline: 'Frase', name: 'Nome', description: 'Descrição',
  categories: 'Categorias', tags: 'Etiquetas', collections: 'Coleções',
  featured: 'Destaque', homepageOrder: 'Ordem na página inicial', portfolioOrder: 'Ordem no portfólio',
  draft: 'Rascunho', hidden: 'Escondida', order: 'Ordem',
  date: 'Data', year: 'Ano', client: 'Cliente', roles: 'Funções', credits: 'Créditos', role: 'Função',
  film: 'Filme', provider: 'Plataforma', poster: 'Capa', heroStill: 'Imagem principal',
  heroVideo: 'Vídeo principal', previewVideo: 'Vídeo de pré-visualização',
  blocks: 'Blocos da página', related: 'Projetos relacionados', seo: 'SEO',
  portrait: 'Retrato', links: 'Ligações', label: 'Etiqueta', url: 'Endereço', platform: 'Plataforma',
  excerpt: 'Excerto', quote: 'Citação', attribution: 'Atribuição',
  email: 'Email', emailStatus: 'Estado do email', phones: 'Telefones', number: 'Número',
  socials: 'Redes sociais', copyright: 'Copyright', organisation: 'Empresa',
  copy: 'Textos', leadImage: 'Imagem', collage: 'Colagem', banner: 'Imagem de topo',
  frames: 'Imagens', lead: 'Texto de abertura', form: 'Formulário', labels: 'Campos',
  key: 'Ficheiro', alt: 'Texto alternativo', altStatus: 'Estado do texto alternativo', caption: 'Legenda',
  type: 'Tipo', body: 'Texto', width: 'Largura', mode: 'Modo', loop: 'Repetir', hasAudio: 'Tem som',
  entries: 'Entradas', closing: 'Fecho', items: 'Itens',
  wordpressExcerpt: 'Excerto antigo do WordPress (arquivo, não publicado)',
};

export const fieldLabel = (key: string): string => LABELS[key] ?? key;
