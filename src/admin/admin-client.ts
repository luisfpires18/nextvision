import { ICON, type IconName } from './icons.ts';
import { slugFrom } from '../lib/admin/slug.ts';

interface BuildState { configured: boolean; state?: 'building' | 'ready' | 'failed' | 'none' | 'unknown'; commit?: string; url?: string; at?: string }

const POLL_MS = 8000;
const POLL_FOR_MS = 15 * 60_000;

async function buildState(): Promise<BuildState | null> {
  try {
    const res = await fetch('/admin/api/estado/', { headers: { Accept: 'application/json' }, cache: 'no-store' });
    return res.ok ? ((await res.json()) as BuildState) : null;
  } catch { return null; }
}

/** An icon-only action button: the words go to aria-label and the tooltip (icons.ts). */
const iconButton = (name: IconName, label: string): HTMLButtonElement => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `ico ico--${name}`;
  b.innerHTML = ICON[name];
  b.setAttribute('aria-label', label);
  b.title = label;
  return b;
};

const ago = (iso?: string) => {
  if (!iso) return '';
  const min = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  return min < 1 ? 'agora mesmo' : min < 60 ? `há ${min} min` : `há ${Math.round(min / 60)} h`;
};

/* ── the status bar: the live site's last deploy, on every admin page ────── */

const bar = document.querySelector<HTMLElement>('[data-build]');

function showBuild(s: BuildState | null) {
  if (!bar) return;
  if (!s) { bar.textContent = 'Estado do site indisponível.'; return; }
  if (!s.configured) { bar.textContent = 'Publicar ainda não está configurado.'; return; }
  bar.textContent = s.state === 'building' ? 'A publicar no site… '
    : s.state === 'ready' ? `Site atualizado ${ago(s.at)}.`
    : s.state === 'failed' ? 'A última publicação falhou; o site continua como estava. '
    : 'Site: sem informação.';
  if (s.url && (s.state === 'building' || s.state === 'failed')) {
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'detalhes';
    bar.append(a);
  }
}

void buildState().then(showBuild);

/**
 * Follow the production deploy of `commit` until it is live, failed, or taking too long.
 * A newer deploy (prod.yml cancels older ones) contains this commit too, so any deploy
 * started after `since` counts.
 */
async function followLive(commit: string, since: number, say: (t: string, tone?: 'ok' | 'error') => void) {
  const until = Date.now() + POLL_FOR_MS;
  while (Date.now() < until) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    const s = await buildState();
    showBuild(s);
    const covers = s?.commit === commit || (s?.at !== undefined && Date.parse(s.at) >= since - 5000);
    if (!s?.configured || !covers) continue;
    if (s.state === 'ready') {
      say('Publicado. O site já mostra as alterações.', 'ok');
      const frame = document.querySelector<HTMLIFrameElement>('.admin-viewer iframe');
      if (frame) frame.src = frame.src;
      return;
    }
    if (s.state === 'failed') {
      say('A publicação falhou e o site continua como estava. Fale com o programador.', 'error');
      return;
    }
  }
  say('A publicação está a demorar mais do que o normal. Volte a verificar daqui a pouco.');
}

/* ── drafts: every change, on every page, kept in this browser until Publicar ── */

interface Draft { from: string; to: string; label: string }
const DRAFTS_KEY = 'nvf-admin-drafts';

/** Browser storage can be missing or refused (private mode); drafts then live in memory only. */
let memory: Record<string, Draft> = {};
const loadDrafts = (): Record<string, Draft> => {
  try { return JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? '{}') as Record<string, Draft>; } catch { return memory; }
};
const storeDrafts = (d: Record<string, Draft>) => {
  memory = d;
  try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(d)); } catch { /* memory only */ }
};

const countBadge = document.querySelector<HTMLElement>('[data-draft-count]');
function showCount() {
  const n = Object.keys(loadDrafts()).length;
  if (countBadge) countBadge.textContent = n ? `(${n})` : '';
}

const form = document.querySelector<HTMLFormElement>('[data-editor]');
type Control = HTMLTextAreaElement | HTMLSelectElement | HTMLInputElement;
const controls = form ? [...form.querySelectorAll<Control>('[data-original]')] : [];
const formSay = (text: string, tone?: 'ok' | 'error') => {
  const m = form?.querySelector<HTMLElement>('[data-message]');
  if (!m) return;
  m.textContent = text;
  if (tone) m.dataset['tone'] = tone; else delete m.dataset['tone'];
};

function syncThumb(select: HTMLSelectElement) {
  const img = form?.querySelector<HTMLImageElement>(`[data-preview-for="${select.id}"]`);
  const thumb = select.selectedOptions[0]?.dataset['thumb'];
  if (!img) return;
  img.hidden = !thumb;
  if (thumb) img.src = thumb;
}

function markDirty() {
  if (!form) return;
  for (const fs of form.querySelectorAll<HTMLElement>('[data-field]')) {
    const changed = [...fs.querySelectorAll<Control>('[data-original]')]
      .some((c) => c.value !== c.dataset['original']);
    if (changed) fs.dataset['dirty'] = ''; else delete fs.dataset['dirty'];
  }
}

if (form) {
  // Put this page's drafts back. A draft whose field was changed by someone else's publish
  // since it was started is dropped and named, rather than silently overwriting theirs.
  const drafts = loadDrafts();
  const dropped: string[] = [];
  for (const c of controls) {
    const d = drafts[c.name];
    if (!d) continue;
    if (d.from === c.dataset['original']) {
      c.value = d.to;
      if (c instanceof HTMLSelectElement) syncThumb(c);
    } else {
      if (d.to !== c.dataset['original']) dropped.push(d.label);
      delete drafts[c.name];
    }
  }
  storeDrafts(drafts);
  markDirty();
  if (dropped.length) {
    formSay(`Alguém publicou outro valor entretanto, por isso estes rascunhos foram descartados: ${dropped.join(', ')}.`, 'error');
  }

  const onChange = (e: Event) => {
    const c = e.target;
    if (!(c instanceof HTMLTextAreaElement || c instanceof HTMLSelectElement || c instanceof HTMLInputElement) || c.dataset['original'] === undefined) return;
    if (c instanceof HTMLSelectElement) syncThumb(c);
    const all = loadDrafts();
    if (c.value === c.dataset['original']) delete all[c.name];
    else all[c.name] = { from: c.dataset['original']!, to: c.value, label: c.dataset['label'] ?? c.name };
    storeDrafts(all);
    markDirty();
    showCount();
  };
  form.addEventListener('input', onChange);
  form.addEventListener('change', onChange);
}
showCount();

/* ── removing a project: a draft like any other, confirmed by name ───────── */

const removeInput = form?.querySelector<HTMLInputElement>('[data-remove-input]');
if (form && removeInput) {
  const go = form.querySelector<HTMLButtonElement>('[data-remove-go]')!;
  const pending = form.querySelector<HTMLElement>('[data-remove-pending]')!;
  const title = go.dataset['title'] ?? '';
  const show = () => { go.hidden = Boolean(removeInput.value); pending.hidden = !removeInput.value; };
  const set = (value: string) => {
    removeInput.value = value;
    removeInput.dispatchEvent(new Event('input', { bubbles: true }));
    show();
  };
  go.addEventListener('click', () => {
    if (!window.confirm(`Apagar o projeto «${title}»?\n\nSai do site quando carregar em Publicar. Até lá pode desfazer.`)) return;
    set(title);
    formSay(`«${title}» vai ser apagado ao publicar.`, 'ok');
  });
  form.querySelector('[data-remove-undo]')!.addEventListener('click', () => { set(''); formSay(''); });
  form.querySelector('[data-remove-top]')?.addEventListener('click', () => {
    if (!removeInput.value) go.click();
    form.querySelector('[data-remove]')?.scrollIntoView({ block: 'center' });
  });
  show();
}

/* ── one Publicar, for every draft ───────────────────────────────────────── */

const dialog = document.querySelector<HTMLDialogElement>('[data-publish-dialog]');
if (dialog) {
  const list = dialog.querySelector<HTMLElement>('[data-publish-list]')!;
  const go = dialog.querySelector<HTMLButtonElement>('[data-publish-go]')!;
  const close = dialog.querySelector<HTMLButtonElement>('[data-publish-close]')!;
  const discard = dialog.querySelector<HTMLButtonElement>('[data-publish-discard]')!;
  const out = dialog.querySelector<HTMLElement>('[data-publish-message]')!;
  const say = (text: string, tone?: 'ok' | 'error') => {
    out.textContent = text;
    if (tone) out.dataset['tone'] = tone; else delete out.dataset['tone'];
  };
  const short = (v: string) => (v.length > 90 ? `${v.slice(0, 90)}…` : v) || '(vazio)';

  /** The drafts, grouped by the page they belong to, as "field: before → after". */
  function render() {
    const drafts = Object.entries(loadDrafts());
    list.replaceChildren();
    if (!drafts.length) {
      const p = document.createElement('p');
      p.textContent = 'Não há alterações por publicar.';
      list.append(p);
    }
    const byPage = new Map<string, [string, Draft][]>();
    for (const [n, d] of drafts) {
      const page = d.label.split(' — ')[0] ?? '';
      byPage.set(page, [...(byPage.get(page) ?? []), [n, d]]);
    }
    for (const [page, items] of byPage) {
      const h = document.createElement('h3');
      h.textContent = page;
      const ul = document.createElement('ul');
      ul.className = 'pub-list';
      for (const [n, d] of items) {
        const li = document.createElement('li');
        const name = document.createElement('span');
        name.className = 'pub-page';
        name.textContent = d.label.split(' — ').slice(1).join(' — ');
        const change = document.createElement('span');
        change.className = 'pub-fields';
        change.textContent = d.label.endsWith('— Ordem') ? 'nova ordem'
          : d.label.endsWith('— Blocos da página') ? 'blocos alterados'
          : d.label.endsWith('— Apagar projeto') ? 'o projeto sai do site'
          : `${short(d.from)} → ${short(d.to)}`;
        // One draft undone, the rest kept.
        const undo = document.createElement('button');
        undo.type = 'button';
        undo.className = 'pub-cancel';
        undo.textContent = 'Desfazer';
        undo.setAttribute('aria-label', `Desfazer: ${d.label}`);
        undo.addEventListener('click', () => {
          if (!window.confirm(`Desfazer esta alteração?\n\n${d.label}`)) return;
          const all = loadDrafts();
          delete all[n];
          storeDrafts(all);
          // The editor on screen still shows the draft: start it again from the live value.
          if (controls.some((c) => c.name === n)) { location.reload(); return; }
          showCount();
          render();
        });
        li.append(name, change, undo);
        ul.append(li);
      }
      list.append(h, ul);
    }
    go.disabled = !drafts.length;
    discard.hidden = !drafts.length;
  }

  document.querySelector('[data-publish-open]')?.addEventListener('click', () => {
    render();
    say('');
    dialog.showModal();
  });
  close.addEventListener('click', () => dialog.close());
  discard.addEventListener('click', () => {
    if (!window.confirm('Descartar todas as alterações por publicar? Não é possível desfazer.')) return;
    storeDrafts({});
    location.reload();
  });

  go.addEventListener('click', async () => {
    const drafts = loadDrafts();
    if (!Object.keys(drafts).length) return;
    go.disabled = true;
    say('A publicar…');
    let res: Response | null = null;
    let body: { error?: string; nothing?: boolean; commit?: string } = {};
    try {
      res = await fetch('/admin/api/publicar/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ edits: Object.fromEntries(Object.entries(drafts).map(([n, d]) => [n, { from: d.from, to: d.to }])) }),
      });
      body = await res.json();
    } catch { /* network */ }

    if (!res || !res.ok) {
      go.disabled = false;
      say(body.error ?? 'Não foi possível publicar (sem ligação?). Nada foi publicado; os rascunhos ficam guardados.', 'error');
      return;
    }
    // Published: the drafts are now the live values.
    storeDrafts({});
    for (const c of controls) c.dataset['original'] = c.value;
    markDirty();
    showCount();
    render();
    if (body.nothing) { say('Nada mudou: não havia nada para publicar.'); return; }
    say('Enviado. A atualizar nextvisionfilms.com (normalmente 2 a 3 minutos)…', 'ok');
    if (body.commit) void followLive(body.commit, Date.now(), say);
  });
}

/* ── new media: upload for a field (A4) ─────────────────────────────────── */

const MAX_UPLOAD = 2 * 1024 ** 3;
const VIDEO_NAME = /\.(mp4|mov|m4v|webm)$/i;
const IMAGE_NAME = /\.(jpe?g|png|webp|tiff?)$/i;
let uploading = 0;
window.addEventListener('beforeunload', (e) => { if (uploading) e.preventDefault(); });

for (const panel of document.querySelectorAll<HTMLDetailsElement>('[data-upload]')) {
  const kind = panel.dataset['kind'] as 'video' | 'image';
  const min = Number(panel.dataset['min']);
  const max = Number(panel.dataset['max']);
  const input = panel.querySelector<HTMLInputElement>('[data-upload-file]')!;
  const go = panel.querySelector<HTMLButtonElement>('[data-upload-go]')!;
  const bar = panel.querySelector<HTMLProgressElement>('[data-upload-progress]')!;
  const out = panel.querySelector<HTMLElement>('[data-upload-message]')!;
  const windowBox = panel.querySelector<HTMLElement>('[data-window]');
  const video = panel.querySelector<HTMLVideoElement>('[data-upload-video]');
  const time = (which: string) => panel.querySelector<HTMLInputElement>(`[data-time="${which}"]`);
  const say = (text: string, tone?: 'ok' | 'error') => {
    out.textContent = text;
    if (tone) out.dataset['tone'] = tone; else delete out.dataset['tone'];
  };
  let file: File | null = null;
  let duration = Number.NaN;

  /** The same rules the server applies (uploads.ts), so the owner hears them before uploading. */
  const problem = (): string | null => {
    if (!file) return 'Escolha um ficheiro.';
    if (file.size > MAX_UPLOAD) return 'O ficheiro tem mais de 2 GB. Exporte uma versão mais pequena.';
    if (!(kind === 'video' ? VIDEO_NAME : IMAGE_NAME).test(file.name)) {
      return kind === 'video' ? 'Este lugar precisa de um vídeo (MP4, MOV ou WebM).' : 'Este lugar precisa de uma imagem (JPG, PNG, WebP ou TIFF).';
    }
    if (kind === 'image') return null;
    const [s, e, p] = ['start', 'end', 'poster'].map((w) => Number(time(w)?.value === '' ? Number.NaN : time(w)?.value));
    if ([s, e, p].some((n) => !Number.isFinite(n))) return 'Marque o início, o fim e a capa do excerto.';
    if (e! - s! < min) return `O excerto tem de ter pelo menos ${min} segundos.`;
    if (e! - s! > max) return `O excerto pode ter no máximo ${max} segundos.`;
    if (p! < s! || p! > e!) return 'A capa tem de ser um momento dentro do excerto.';
    if (Number.isFinite(duration) && e! > duration + 0.05) return `O vídeo só tem ${duration.toFixed(1)} segundos.`;
    return null;
  };
  const check = () => {
    const p = problem();
    go.disabled = Boolean(p) || uploading > 0;
    if (!uploading) say(p ?? (kind === 'video' ? `Excerto de ${(Number(time('end')!.value) - Number(time('start')!.value)).toFixed(1)} s pronto a carregar.` : 'Pronto a carregar.'));
  };

  input.addEventListener('change', () => {
    file = input.files?.[0] ?? null;
    duration = Number.NaN;
    if (video && windowBox && file) {
      windowBox.hidden = false;
      video.src = URL.createObjectURL(file);
      for (const w of ['start', 'end', 'poster']) time(w)!.value = '';
    }
    check();
  });
  video?.addEventListener('loadedmetadata', () => {
    duration = video.duration;
    if (time('start')!.value === '') {
      time('start')!.value = '0';
      time('end')!.value = Math.min(8, duration).toFixed(1);
      time('poster')!.value = '1';
    }
    check();
  });
  video?.addEventListener('error', () => {
    panel.querySelector<HTMLElement>('[data-video-note]')!.textContent =
      'O navegador não consegue mostrar este vídeo (acontece com alguns MOV). Escreva os tempos em segundos: o ficheiro é processado na mesma.';
  });
  panel.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-mark]');
    if (!b || !video) return;
    time(b.dataset['mark']!)!.value = video.currentTime.toFixed(1);
    check();
  });
  panel.addEventListener('input', check);

  go.addEventListener('click', async () => {
    if (problem() || !file) return;
    uploading += 1;
    go.disabled = true;
    bar.hidden = false;
    bar.value = 0;
    const f = file;
    try {
      say('A carregar…');
      const key = await uploadToBucket(f, (pct) => { bar.value = pct; say(`A carregar… ${pct}%`); });
      const request: Record<string, unknown> = { screen: (panel.closest('[data-editor]') as HTMLElement).dataset['screen'], target: panel.dataset['target'], source: key, name: f.name };
      if (kind === 'video') {
        request['start'] = Number(time('start')!.value);
        request['end'] = Number(time('end')!.value);
        request['posterAt'] = Number(time('poster')!.value);
        const note = panel.querySelector<HTMLInputElement>('[data-upload-note]')!.value.trim();
        if (note) request['note'] = note;
      }
      const { id } = (await post('/admin/api/media/', request)) as { id: string };
      uploading -= 1;
      bar.hidden = true;
      say(kind === 'video'
        ? 'Recebido. A processar o vídeo (3 a 8 minutos); depois vai para o site sozinho. Pode continuar a trabalhar ou fechar esta página.'
        : 'Recebido. A processar a imagem (2 a 4 minutos); depois vai para o site sozinho.', 'ok');
      void followUpload(id, say);
    } catch (e) {
      uploading = Math.max(0, uploading - 1);
      bar.hidden = true;
      say(e instanceof Error ? e.message : 'Não foi possível carregar.', 'error');
      check();
    }
  });
}

async function post(url: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(String(data['error'] ?? 'Falhou.'));
  return data;
}

/**
 * A file into the private bucket, in parts, each retried; returns its object key. A
 * failure aborts the multipart upload so no half file is left behind.
 */
async function uploadToBucket(f: File, progress: (pct: number) => void): Promise<string> {
  type Started = { key: string; uploadId: string; partBytes: number };
  const { key, uploadId, partBytes } = (await post('/admin/api/carregar/', { acao: 'iniciar', name: f.name, size: f.size })) as unknown as Started;
  try {
    const parts: { partNumber: number; etag: string }[] = [];
    const count = Math.max(1, Math.ceil(f.size / partBytes));
    for (let n = 1; n <= count; n++) {
      const blob = f.slice((n - 1) * partBytes, n * partBytes);
      let done: { partNumber: number; etag: string } | null = null;
      for (let attempt = 1; attempt <= 3 && !done; attempt++) {
        const res = await fetch(`/admin/api/carregar/parte/?key=${encodeURIComponent(key)}&uploadId=${encodeURIComponent(uploadId)}&n=${n}`, { method: 'PUT', body: blob }).catch(() => null);
        if (res?.ok) done = (await res.json()) as { partNumber: number; etag: string };
        else if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 2000));
      }
      if (!done) throw new Error('A ligação falhou durante o carregamento. Volte a tentar.');
      parts.push(done);
      progress(Math.round((n / count) * 100));
    }
    await post('/admin/api/carregar/', { acao: 'concluir', key, uploadId, parts });
    return key;
  } catch (e) {
    void post('/admin/api/carregar/', { acao: 'abortar', key, uploadId }).catch(() => undefined);
    throw e;
  }
}

/**
 * Processing (media-ingest.yml), then the production deploy of the commit that attached it
 * (A10: an upload goes live by itself; a refused file never deploys at all).
 */
async function followUpload(id: string, say: (t: string, tone?: 'ok' | 'error') => void) {
  const until = Date.now() + 40 * 60_000;
  while (Date.now() < until) {
    await new Promise((r) => setTimeout(r, 10_000));
    let s: { status?: string; error?: string | null; head?: string | null } = {};
    try { s = await (await fetch(`/admin/api/estado/?carregamento=${encodeURIComponent(id)}`, { cache: 'no-store' })).json(); } catch { continue; }
    if (s.status === 'failed') { say(`Não foi possível usar o ficheiro: ${s.error ?? 'erro desconhecido.'}`, 'error'); return; }
    if (s.status !== 'ready' || !s.head) continue;
    say('Processado. A publicar no site (normalmente 2 a 3 minutos)…', 'ok');
    await followLive(s.head, Date.now(), say);
    return;
  }
  say('O processamento está a demorar mais do que o normal. Volte a esta página mais tarde.');
}

/* ── failed-upload notes: closed with ×, remembered in this browser ───────── */

const DISMISSED_KEY = 'nvf-admin-dismissed';
const dismissed = (): string[] => { try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]') as string[]; } catch { return []; } };
for (const note of document.querySelectorAll<HTMLElement>('[data-request]')) {
  if (dismissed().includes(note.dataset['request']!)) note.remove();
}
document.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-dismiss]');
  if (!b) return;
  try { localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed(), b.dataset['dismiss']!].slice(-50))); } catch { /* closes for this visit only */ }
  b.closest('[data-request]')?.remove();
});

/* ── the portfolio order: drag, or the arrows ───────────────────────────── */

const orderInput = document.querySelector<HTMLInputElement>('[data-order]');
const orderList = document.querySelector<HTMLOListElement>('[data-order-list]');
if (orderInput && orderList) {
  const rows = () => [...orderList.querySelectorAll<HTMLLIElement>('li[data-slug]')];
  // A restored draft holds an order the list does not show yet.
  const bySlug = new Map(rows().map((li) => [li.dataset['slug']!, li]));
  for (const slug of orderInput.value.split(',')) {
    const li = bySlug.get(slug);
    if (li) orderList.append(li);
  }
  const commit = () => {
    orderInput.value = rows().map((li) => li.dataset['slug']).join(',');
    orderInput.dispatchEvent(new Event('input', { bubbles: true }));
  };

  orderList.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-move]');
    const li = b?.closest('li');
    if (!b || !li) return;
    const up = b.dataset['move'] === '-1';
    const other = up ? li.previousElementSibling : li.nextElementSibling;
    if (!other) return;
    if (up) other.before(li); else other.after(li);
    b.focus();
    commit();
  });

  let dragging: HTMLLIElement | null = null;
  orderList.addEventListener('dragstart', (e) => {
    dragging = (e.target as HTMLElement).closest('li');
    if (!dragging) return;
    dragging.dataset['dragging'] = '';
    e.dataTransfer?.setData('text/plain', dragging.dataset['slug'] ?? '');
  });
  orderList.addEventListener('dragover', (e) => {
    if (!dragging) return;
    e.preventDefault();
    const over = (e.target as HTMLElement).closest('li');
    if (!over || over === dragging) return;
    const box = over.getBoundingClientRect();
    if (e.clientY > box.top + box.height / 2) over.after(dragging); else over.before(dragging);
  });
  orderList.addEventListener('drop', (e) => e.preventDefault());
  orderList.addEventListener('dragend', () => {
    if (!dragging) return;
    delete dragging.dataset['dragging'];
    dragging = null;
    commit();
  });
}

/* ── a new project: its facts and its cover, in one go ──────────────────── */

const creator = document.querySelector<HTMLFormElement>('[data-new-project]');
if (creator) {
  const field = (n: string) => creator.elements.namedItem(n) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  const preview = creator.querySelector<HTMLElement>('[data-slug-preview]')!;
  const go = creator.querySelector<HTMLButtonElement>('[data-create]')!;
  const bar = creator.querySelector<HTMLProgressElement>('[data-create-progress]')!;
  const out = creator.querySelector<HTMLElement>('[data-create-message]')!;
  const say = (text: string, tone?: 'ok' | 'error') => {
    out.textContent = text;
    if (tone) out.dataset['tone'] = tone; else delete out.dataset['tone'];
  };
  field('title').addEventListener('input', () => {
    const slug = slugFrom(field('title').value);
    preview.textContent = slug ? `Endereço da página: nextvisionfilms.com/portfolio/${slug}/` : 'O endereço da página aparece aqui.';
  });

  /** The same rules the server applies, so they are heard before the upload. */
  const problem = (cover: File | undefined): string | null => {
    if (!slugFrom(field('title').value)) return 'Escreva o título.';
    if (!field('film').value.trim()) return 'Cole o endereço do filme no YouTube.';
    if (!/^\d{4}$/.test(field('year').value.trim())) return 'Escreva o ano com quatro algarismos.';
    const pt = field('taglinePt').value.trim();
    const en = field('taglineEn').value.trim();
    if (en && !pt) return 'A frase precisa do texto em português.';
    if (pt && !en && field('sourceLocale').value === 'pt') return 'Falta a frase em inglês (ou escolha «Já está em inglês»).';
    if (!cover) return 'Escolha a imagem da capa.';
    if (!IMAGE_NAME.test(cover.name)) return 'A capa tem de ser uma imagem (JPG, PNG, WebP ou TIFF).';
    if (cover.size > MAX_UPLOAD) return 'A imagem tem mais de 2 GB.';
    return null;
  };

  go.addEventListener('click', async () => {
    const cover = (field('cover') as HTMLInputElement).files?.[0];
    const p = problem(cover);
    if (p || !cover) { say(p ?? 'Escolha a imagem da capa.', 'error'); return; }
    go.disabled = true;
    uploading += 1;
    bar.hidden = false;
    try {
      say('A carregar a capa…');
      const key = await uploadToBucket(cover, (pct) => { bar.value = pct; say(`A carregar a capa… ${pct}%`); });
      const { id } = (await post('/admin/api/media/', {
        screen: 'novo-projeto', target: '', source: key, name: cover.name,
        project: {
          title: field('title').value.trim(),
          sourceLocale: field('sourceLocale').value,
          taglinePt: field('taglinePt').value,
          taglineEn: field('taglineEn').value,
          year: field('year').value.trim(),
          category: field('category').value,
          film: field('film').value.trim(),
          hidden: field('hidden').value === 'true',
        },
      })) as { id: string };
      say('Recebido. A preparar a capa (2 a 4 minutos); depois o projeto é criado e vai para o site sozinho. Pode fechar esta página.', 'ok');
      void followUpload(id, say);
    } catch (e) {
      go.disabled = false;
      say(e instanceof Error ? e.message : 'Não foi possível criar o projeto.', 'error');
    } finally {
      uploading = Math.max(0, uploading - 1);
      bar.hidden = true;
    }
  });
}

/* ── a project page's blocks: add, remove, reorder, edit ─────────────────── */

type BlockView =
  | { type: 'text'; pt: string; en: string; width: 'narrow' | 'wide' }
  | { type: 'full-width-image'; media: string[] }
  | { type: 'image-pair'; media: string[]; weight: 'left' | 'right' | 'equal' }
  | { type: 'image-grid'; media: string[]; mode: 'strip' | 'stack' | 'scrub' }
  | { type: 'embedded-film'; film: string; poster: string }
  | { type: 'fixed'; kind: string; ref: number };

const blocksInput = document.querySelector<HTMLInputElement>('[data-blocks]');
const blockList = document.querySelector<HTMLOListElement>('[data-block-list]');
if (blocksInput && blockList) {
  const images = JSON.parse(document.querySelector('[data-block-images]')?.textContent ?? '[]') as
    { group: string; items: { key: string; label: string; thumb: string }[] }[];
  const thumbOf = new Map(images.flatMap((g) => g.items.map((i) => [i.key, i.thumb] as const)));
  // A new block starts on this project's own cover, not on whatever sorts first.
  const firstImage = blocksInput.dataset['defaultImage'] || (images[0]?.items[0]?.key ?? '');
  let blocks: BlockView[] = [];
  try { blocks = JSON.parse(blocksInput.value) as BlockView[]; } catch { blocks = []; }

  const NAMES: Record<string, string> = {
    text: 'Texto', 'full-width-image': 'Imagem', 'image-pair': 'Duas imagens', 'image-grid': 'Galeria', 'embedded-film': 'Filme',
  };
  const FIXED: Record<string, string> = {
    quote: 'Citação', credits: 'Créditos', spacer: 'Espaço', 'full-width-video': 'Vídeo', 'embedded-film': 'Filme',
  };

  const commit = () => {
    blocksInput.value = JSON.stringify(blocks);
    blocksInput.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const el = <T extends HTMLElement = HTMLElement>(tag: string, props: Record<string, unknown> = {}, ...kids: (Node | string)[]): T => {
    const e = Object.assign(document.createElement(tag), props) as T;
    e.append(...kids);
    return e;
  };
  const labelled = (text: string, control: HTMLElement) =>
    el('label', { className: 'ed-media__pick' }, el('span', { className: 'f-lang', textContent: text }), control);
  const choice = (value: string, options: [string, string][], on: (v: string) => void) => {
    const s = el<HTMLSelectElement>('select');
    for (const [v, t] of options) s.append(el('option', { value: v, textContent: t, selected: v === value }));
    s.addEventListener('change', () => { on(s.value); commit(); });
    return s;
  };
  /** An image picker with its thumbnail; the current key is always an option. */
  const picker = (key: string, on: (k: string) => void, removable?: () => void) => {
    const img = el<HTMLImageElement>('img', { src: thumbOf.get(key) ?? '', alt: '', width: 96, height: 54 });
    const s = el<HTMLSelectElement>('select');
    s.setAttribute('aria-label', 'Imagem');
    if (!thumbOf.has(key)) s.append(el('option', { value: key, textContent: key ? `${key} (atual)` : '(escolha)', selected: true }));
    for (const g of images) {
      const og = el('optgroup', { label: g.group });
      for (const i of g.items) og.append(el('option', { value: i.key, textContent: i.label, selected: i.key === key }));
      s.append(og);
    }
    s.addEventListener('change', () => { img.src = thumbOf.get(s.value) ?? ''; on(s.value); commit(); });
    const row = el('div', { className: 'ed-blockimg' }, img, s);
    if (removable) {
      const x = iconButton('remove', 'Tirar esta imagem');
      x.addEventListener('click', () => { removable(); commit(); render(); });
      row.append(x);
    }
    return row;
  };

  const body = (b: BlockView): HTMLElement => {
    const box = el('div', { className: 'ed-blockbody' });
    switch (b.type) {
      case 'text': {
        const area = (lang: 'pt' | 'en') => {
          const t = el<HTMLTextAreaElement>('textarea', { value: b[lang], rows: Math.min(8, Math.ceil(b[lang].length / 60) + 2), lang: lang === 'pt' ? 'pt-PT' : 'en' });
          t.addEventListener('input', () => { b[lang] = t.value; commit(); });
          return el('label', {}, el('span', { className: 'f-lang', textContent: lang === 'pt' ? 'Português' : 'Inglês' }), t);
        };
        box.append(
          el('div', { className: 'ed-pair' }, area('pt'), area('en')),
          labelled('Largura', choice(b.width, [['narrow', 'Estreita'], ['wide', 'Larga']], (v) => { b.width = v as 'narrow' | 'wide'; })),
        );
        break;
      }
      case 'full-width-image':
        box.append(picker(b.media[0] ?? '', (k) => { b.media = [k]; }));
        break;
      case 'image-pair':
        b.media.forEach((k, i) => box.append(picker(k, (v) => { b.media[i] = v; })));
        box.append(labelled('Disposição', choice(b.weight, [['left', 'Maior à esquerda'], ['right', 'Maior à direita'], ['equal', 'Iguais']],
          (v) => { b.weight = v as 'left' | 'right' | 'equal'; })));
        break;
      case 'image-grid': {
        b.media.forEach((k, i) => box.append(picker(k, (v) => { b.media[i] = v; }, b.media.length > 2 ? () => { b.media.splice(i, 1); } : undefined)));
        if (b.media.length < 12) {
          const more = iconButton('add', 'Acrescentar imagem à galeria');
          more.addEventListener('click', () => { b.media.push(firstImage); commit(); render(); });
          box.append(more);
        }
        box.append(labelled('Disposição', choice(b.mode, [['strip', 'Em faixa'], ['stack', 'Empilhadas'], ['scrub', 'A passar com o scroll']],
          (v) => { b.mode = v as 'strip' | 'stack' | 'scrub'; })));
        break;
      }
      case 'embedded-film': {
        const url = el<HTMLInputElement>('input', { type: 'text', value: b.film, placeholder: 'https://www.youtube.com/watch?v=…', spellcheck: false });
        url.addEventListener('input', () => { b.film = url.value; commit(); });
        box.append(labelled('Filme no YouTube', url), el('p', { className: 'f-lang', textContent: 'Capa do filme' }), picker(b.poster, (k) => { b.poster = k; }));
        break;
      }
      case 'fixed':
        box.append(el('p', { className: 'ed-note', textContent: 'Este bloco só se pode mover ou apagar aqui. Para o alterar, fale com o programador.' }));
        break;
    }
    return box;
  };

  const render = () => {
    blockList.replaceChildren();
    if (!blocks.length) blockList.append(el('li', { className: 'ed-note', textContent: 'Esta página ainda não tem blocos.' }));
    blocks.forEach((b, i) => {
      const name = b.type === 'fixed' ? FIXED[b.kind] ?? b.kind : NAMES[b.type] ?? b.type;
      const move = (d: -1 | 1, sign: string, what: string) => {
        const btn = el('button', { type: 'button', textContent: sign, disabled: !blocks[i + d] });
        btn.setAttribute('aria-label', `${what} o bloco ${i + 1}`);
        btn.addEventListener('click', () => {
          [blocks[i], blocks[i + d]] = [blocks[i + d]!, blocks[i]!];
          commit();
          render();
          blockList.querySelector<HTMLButtonElement>(`[aria-label="${what} o bloco ${i + 1 + d}"]`)?.focus();
        });
        return btn;
      };
      const del = iconButton('remove', `Apagar o bloco ${i + 1}`);
      del.addEventListener('click', () => {
        if (!window.confirm(`Apagar o bloco ${i + 1} (${name})?`)) return;
        blocks.splice(i, 1);
        commit();
        render();
      });
      blockList.append(el('li', { className: 'ed-block' },
        el('div', { className: 'ed-blockhead' }, el('strong', { textContent: `${i + 1}. ${name}` }),
          el('span', { className: 'ed-order__moves' }, move(-1, '↑', 'Subir'), move(1, '↓', 'Descer'), del)),
        body(b)));
    });
  };

  const addMenu = document.querySelector<HTMLDetailsElement>('.ed-addmenu');
  addMenu?.addEventListener('click', (e) => {
    const type = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-add]')?.dataset['add'];
    if (!type) return;
    const fresh: Record<string, BlockView> = {
      text: { type: 'text', pt: '', en: '', width: 'narrow' },
      'full-width-image': { type: 'full-width-image', media: [firstImage] },
      'image-pair': { type: 'image-pair', media: [firstImage, firstImage], weight: 'equal' },
      'image-grid': { type: 'image-grid', media: [firstImage, firstImage, firstImage], mode: 'strip' },
      'embedded-film': { type: 'embedded-film', film: '', poster: firstImage },
    };
    const add = fresh[type];
    if (!add) return;
    if (addMenu) addMenu.open = false;
    blocks.push(structuredClone(add));
    commit();
    render();
    blockList.lastElementChild?.scrollIntoView({ block: 'nearest' });
  });
  render();
}

/* ── a page's lists: the carousel's images, the videos, the categories ───── */

/*
 * Each list is ONE hidden field holding it as JSON (ListEditor.astro), read here AFTER the
 * drafts were put back above, so a list reopens as the owner left it. Every change writes
 * the field and fires `input`, which makes it a draft like any typed value.
 */
type FilmRow = { id: string; title: string; poster: string };
for (const input of document.querySelectorAll<HTMLInputElement>('[data-list]')) {
  const kind = input.dataset['list'];
  const box = input.parentElement!;
  const commit = (value: unknown[]) => {
    input.value = JSON.stringify(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };
  let items: unknown[] = [];
  try { items = JSON.parse(input.value) as unknown[]; } catch { items = []; }

  if (kind === 'categories') {
    const checks = [...box.querySelectorAll<HTMLInputElement>('[data-list-checks] input[type="checkbox"]')];
    for (const c of checks) c.checked = (items as string[]).includes(c.value);
    box.querySelector('[data-list-checks]')?.addEventListener('change', (e) => {
      e.stopPropagation(); // the checkbox itself is not a draft; the hidden field is
      commit(checks.filter((c) => c.checked).map((c) => c.value));
    });
    continue;
  }

  const rows = box.querySelector<HTMLOListElement>('[data-list-rows]')!;
  const images = JSON.parse(box.querySelector('[data-list-images]')?.textContent ?? '[]') as
    { group: string; items: { key: string; label: string; thumb: string }[] }[];
  const thumbOf = new Map(images.flatMap((g) => g.items.map((i) => [i.key, i.thumb] as const)));
  const firstImage = images[0]?.items[0]?.key ?? '';
  const noun = kind === 'films' ? 'vídeo' : 'imagem';
  const save = () => commit(items);

  const el = <T extends HTMLElement = HTMLElement>(tag: string, props: Record<string, unknown> = {}, ...kids: (Node | string)[]): T => {
    const e = Object.assign(document.createElement(tag), props) as T;
    e.append(...kids);
    return e;
  };
  /** An image picker with its thumbnail; the current key is always an option. */
  const picker = (key: string, on: (k: string) => void, name: string) => {
    const img = el<HTMLImageElement>('img', { src: thumbOf.get(key) ?? '', alt: '', width: 96, height: 54 });
    const s = el<HTMLSelectElement>('select');
    s.setAttribute('aria-label', name);
    if (!thumbOf.has(key)) s.append(el('option', { value: key, textContent: key ? `${key} (atual)` : '(escolha)', selected: true }));
    for (const g of images) {
      const og = el('optgroup', { label: g.group });
      for (const i of g.items) og.append(el('option', { value: i.key, textContent: i.label, selected: i.key === key }));
      s.append(og);
    }
    s.addEventListener('change', (e) => { e.stopPropagation(); img.src = thumbOf.get(s.value) ?? ''; on(s.value); save(); });
    return el('div', { className: 'ed-blockimg' }, img, s);
  };
  const text = (label: string, value: string, on: (v: string) => void, placeholder?: string) => {
    const t = el<HTMLInputElement>('input', { type: 'text', value, spellcheck: false, autocomplete: 'off' });
    if (placeholder) t.placeholder = placeholder;
    t.addEventListener('input', (e) => { e.stopPropagation(); on(t.value); save(); });
    return el('label', { className: 'ed-media__pick' }, el('span', { className: 'f-lang', textContent: label }), t);
  };

  const render = () => {
    rows.replaceChildren();
    if (!items.length) rows.append(el('li', { className: 'ed-note', textContent: kind === 'films' ? 'Não há vídeos. A página fica só com o carrossel.' : 'Não há imagens. O carrossel mostra só os projetos das categorias.' }));
    items.forEach((item, i) => {
      const n = i + 1;
      const move = (d: -1 | 1, sign: string, what: string) => {
        const btn = el<HTMLButtonElement>('button', { type: 'button', textContent: sign, disabled: !items[i + d] });
        btn.setAttribute('aria-label', `${what} ${noun} ${n}`);
        btn.addEventListener('click', () => {
          [items[i], items[i + d]] = [items[i + d], items[i]];
          save();
          render();
          rows.querySelector<HTMLButtonElement>(`[aria-label="${what} ${noun} ${n + d}"]`)?.focus();
        });
        return btn;
      };
      const del = iconButton('remove', `Apagar ${noun} ${n}`);
      del.addEventListener('click', () => {
        if (!window.confirm(`Apagar ${kind === 'films' ? 'o vídeo' : 'a imagem'} ${n}?`)) return;
        items.splice(i, 1);
        save();
        render();
      });
      const body = el('div', { className: 'ed-blockbody' });
      if (kind === 'films') {
        const f = item as FilmRow;
        body.append(
          text('Endereço no YouTube', f.id, (v) => { f.id = v; }, 'https://www.youtube.com/watch?v=…'),
          text('Nome do vídeo (para leitores de ecrã)', f.title, (v) => { f.title = v; }),
          el('p', { className: 'f-lang', textContent: 'Capa do vídeo' }),
          picker(f.poster, (k) => { f.poster = k; }, `Capa do vídeo ${n}`),
        );
      } else {
        body.append(picker(item as string, (k) => { items[i] = k; }, `Imagem ${n}`));
      }
      rows.append(el('li', { className: 'ed-block' },
        el('div', { className: 'ed-blockhead' }, el('strong', { textContent: `${kind === 'films' ? 'Vídeo' : 'Imagem'} ${n}` }),
          el('span', { className: 'ed-order__moves' }, move(-1, '↑', 'Subir'), move(1, '↓', 'Descer'), del)),
        body));
    });
  };

  box.querySelector('[data-list-add]')?.addEventListener('click', () => {
    items.push(kind === 'films' ? { id: '', title: '', poster: firstImage } satisfies FilmRow : firstImage);
    save();
    render();
    rows.lastElementChild?.scrollIntoView({ block: 'nearest' });
    rows.lastElementChild?.querySelector<HTMLElement>('input, select')?.focus();
  });
  render();
}

/* ── the section page: cards, filters, pagination (ADMIN_REDESIGN_PLAN.md §4–§5) ── */

/*
 * Every card of the tab is in the page; filtering and turning a page only hide and show
 * them, so nothing is asked of the server. The view lives in the URL (?q=&categoria=&p=2)
 * and in this tab's session, so reloading, going back, or closing an edit modal all land
 * on the same view.
 */
const PAGE_SIZE = 12;
const VIEW_KEY = 'nvf-admin-view';
const grid = document.querySelector<HTMLElement>('[data-grid]');
const saveView = (search: string) => {
  try { sessionStorage.setItem(VIEW_KEY, JSON.stringify({ path: location.pathname, search })); } catch { /* fine */ }
};

/** Whether a card has drafts waiting, and whether one of them deletes it. */
const cardState = (card: HTMLElement): 'delete' | 'changed' | null => {
  const keys = JSON.parse(card.dataset['draftKeys'] ?? '[]') as string[];
  const names = Object.keys(loadDrafts());
  const slug = card.dataset['slug'];
  if (slug && names.includes(`projeto/${slug}:apagar`)) return 'delete';
  return names.some((n) => keys.some((k) => n.startsWith(k))) ? 'changed' : null;
};

/* A thumbnail that fails to load (a missing rendition, no network) gives way to the card's
   initial rather than showing the browser's broken-image mark. */
for (const img of document.querySelectorAll<HTMLImageElement>('.ad-card__media img')) {
  const drop = () => img.remove();
  if (img.complete && img.naturalWidth === 0) drop(); else img.addEventListener('error', drop, { once: true });
}

function paintCards() {
  for (const card of document.querySelectorAll<HTMLElement>('[data-card]')) {
    const state = cardState(card);
    const chip = card.querySelector<HTMLElement>('[data-card-status]');
    if (chip) {
      chip.hidden = !state;
      chip.dataset['tone'] = state ?? '';
      chip.textContent = state === 'delete' ? 'Vai ser apagado ao publicar' : state === 'changed' ? 'Alterações por publicar' : '';
    }
    card.toggleAttribute('data-deleting', state === 'delete');
    card.dataset['state'] = state ?? '';
    const del = card.querySelector<HTMLElement>('[data-card-delete]');
    const undo = card.querySelector<HTMLElement>('[data-card-undo]');
    if (del) del.hidden = state === 'delete';
    if (undo) undo.hidden = state !== 'delete';
  }
}

if (grid) {
  const list = grid.querySelector<HTMLElement>('[data-cards]');
  const cards = list ? [...list.querySelectorAll<HTMLElement>('[data-card]')] : [];
  const filters = [...grid.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-filter]')];
  const pages = grid.querySelector<HTMLElement>('[data-pages]')!;
  const none = grid.querySelector<HTMLElement>('[data-no-results]')!;
  const params = new URLSearchParams(location.search);
  for (const c of filters) c.value = params.get(c.name) ?? '';
  let page = Math.max(1, Number(params.get('p')) || 1);

  const value = (name: string) => filters.find((c) => c.name === name)?.value ?? '';
  const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-PT');

  const apply = (pushUrl: boolean) => {
    paintCards();
    const q = fold(value('q').trim());
    const cat = value('categoria');
    const year = value('ano');
    const estado = value('estado');
    const order = value('ordem');
    const shown = cards.filter((card) => {
      if (q && !fold(card.dataset['title'] ?? '').includes(q)) return false;
      if (cat && !(card.dataset['categories'] ?? '').split(' ').includes(cat)) return false;
      if (year && card.dataset['year'] !== year) return false;
      const hidden = card.hasAttribute('data-hidden');
      if (estado === 'site' && hidden) return false;
      if (estado === 'escondido' && !hidden) return false;
      if (estado === 'alterado' && card.dataset['state'] !== 'changed') return false;
      if (estado === 'apagar' && card.dataset['state'] !== 'delete') return false;
      return true;
    });
    const byIndex = (a: HTMLElement, b: HTMLElement) => Number(a.dataset['index']) - Number(b.dataset['index']);
    const sorted = [...shown].sort((a, b) => order === 'nome'
      ? (a.dataset['name'] ?? '').localeCompare(b.dataset['name'] ?? '', 'pt')
      : order === 'recentes'
        ? Number(b.dataset['year']) - Number(a.dataset['year']) || byIndex(a, b)
        : byIndex(a, b));
    const total = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    page = Math.min(page, total);
    const visible = new Set(sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
    for (const card of cards) card.hidden = !visible.has(card);
    if (list) for (const card of sorted) list.append(card); // DOM order is the reading order
    none.hidden = !cards.length || sorted.length > 0;

    pages.replaceChildren();
    pages.hidden = sorted.length <= PAGE_SIZE;
    if (!pages.hidden) {
      const button = (label: string, to: number, opts: { current?: boolean; disabled?: boolean; name?: string } = {}) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.disabled = Boolean(opts.disabled);
        if (opts.name) b.setAttribute('aria-label', opts.name);
        if (opts.current) b.setAttribute('aria-current', 'page');
        b.addEventListener('click', () => { page = to; apply(true); grid.scrollIntoView({ block: 'start' }); });
        return b;
      };
      pages.append(button('‹', page - 1, { disabled: page === 1, name: 'Página anterior' }));
      for (let n = 1; n <= total; n++) pages.append(button(String(n), n, { current: n === page, name: `Página ${n}` }));
      pages.append(button('›', page + 1, { disabled: page === total, name: 'Página seguinte' }));
      const count = document.createElement('p');
      count.textContent = `A mostrar ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, sorted.length)} de ${sorted.length}`;
      pages.append(count);
    }

    const next = new URLSearchParams(location.search);
    for (const c of filters) { if (c.value) next.set(c.name, c.value); else next.delete(c.name); }
    if (page > 1) next.set('p', String(page)); else next.delete('p');
    const search = next.toString() ? `?${next}` : '';
    if (pushUrl && search !== location.search) history.replaceState(null, '', `${location.pathname}${search}`);
    if (!document.querySelector('[data-edit-dialog]')) saveView(search);
  };

  for (const c of filters) {
    c.addEventListener(c instanceof HTMLSelectElement ? 'change' : 'input', () => { page = 1; apply(true); });
  }
  grid.querySelector('[data-toolbar]')?.addEventListener('submit', (e) => e.preventDefault());
  grid.querySelector('[data-filter-reset]')?.addEventListener('click', () => {
    for (const c of filters) c.value = '';
    page = 1;
    apply(true);
  });

  /* Delete: ask first, then mark it for the next Publicar. It is the same draft the
     project form's own "Apagar projeto" writes, so Publicar handles both the same way. */
  const confirmDialog = document.querySelector<HTMLDialogElement>('[data-confirm-dialog]');
  let pending: HTMLElement | null = null;
  grid.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const card = target.closest<HTMLElement>('[data-card]');
    if (!card) return;
    const slug = card.dataset['slug'];
    const name = card.dataset['name'] ?? '';
    if (target.closest('[data-card-delete]') && slug && confirmDialog) {
      pending = card;
      confirmDialog.querySelector('[data-confirm-title]')!.textContent = `Apagar «${name}»?`;
      confirmDialog.showModal();
      confirmDialog.querySelector<HTMLButtonElement>('[data-confirm-cancel]')?.focus();
    } else if (target.closest('[data-card-undo]') && slug) {
      const all = loadDrafts();
      delete all[`projeto/${slug}:apagar`];
      storeDrafts(all);
      showCount();
      apply(false);
      card.querySelector<HTMLElement>('[data-card-delete]')?.focus();
    }
  });
  confirmDialog?.querySelector('[data-confirm-cancel]')?.addEventListener('click', () => confirmDialog.close());
  confirmDialog?.querySelector('[data-confirm-go]')?.addEventListener('click', () => {
    const card = pending;
    const slug = card?.dataset['slug'];
    const name = card?.dataset['name'] ?? '';
    if (card && slug) {
      const all = loadDrafts();
      all[`projeto/${slug}:apagar`] = { from: '', to: name, label: `Projeto «${name}» — Apagar projeto` };
      storeDrafts(all);
      showCount();
      apply(false);
    }
    confirmDialog.close();
    card?.querySelector<HTMLElement>('[data-card-undo]')?.focus();
  });

  apply(false);
}

/* ── the edit modal ──────────────────────────────────────────────────────────
   Its URL renders the grid with the item open (AdminRoute.astro). Typing still keeps
   drafts as before; what the modal adds is a choice at the end. Guardar keeps them;
   Cancelar, the close button and Escape put the drafts back as they were when the modal
   opened, asking first when there is something to lose. Both return to the grid, on the
   same filters and page. */
const editDialog = document.querySelector<HTMLDialogElement>('[data-edit-dialog]');
if (editDialog) {
  const before = JSON.stringify(loadDrafts());
  const backTo = () => {
    let back = editDialog.dataset['back'] ?? '/admin/';
    try {
      const saved = JSON.parse(sessionStorage.getItem(VIEW_KEY) ?? 'null') as { path: string; search: string } | null;
      const url = new URL(back, location.origin);
      if (saved && saved.path === url.pathname && saved.search) {
        const merged = new URLSearchParams(saved.search);
        for (const [k, v] of url.searchParams) merged.set(k, v);
        back = `${url.pathname}?${merged}`;
      }
    } catch { /* the plain way back */ }
    location.assign(back);
  };
  const changed = () => JSON.stringify(loadDrafts()) !== before;
  const cancel = () => {
    if (changed() && !window.confirm('Sair sem guardar? As alterações feitas nesta janela perdem-se.')) return;
    storeDrafts(JSON.parse(before) as Record<string, Draft>);
    backTo();
  };
  editDialog.addEventListener('cancel', (e) => { e.preventDefault(); cancel(); });
  for (const a of editDialog.querySelectorAll<HTMLElement>('[data-modal-cancel]')) {
    a.addEventListener('click', (e) => { e.preventDefault(); cancel(); });
  }
  editDialog.querySelector('[data-modal-save]')?.addEventListener('click', (e) => { e.preventDefault(); backTo(); });
  editDialog.showModal();
}
