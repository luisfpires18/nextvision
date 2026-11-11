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
          : d.label.endsWith('— Apagar projeto') || n.endsWith(':apagar') ? 'sai do site'
          : n.endsWith(':criar') ? 'entra no site'
          : d.label.endsWith('— Lista') || d.from.startsWith('[') ? 'lista alterada'
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
        // A frame that plays a film keeps its film when only the image is changed here.
        const frame = typeof item === 'string' ? null : (item as { image: string });
        body.append(picker(frame ? frame.image : (item as string), (k) => { items[i] = frame ? { ...frame, image: k } : k; }, `Imagem ${n}`));
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
  const del = card.dataset['deleteDraft'];
  if (del && names.includes(del)) return 'delete';
  return names.some((n) => keys.some((k) => n.startsWith(k))) ? 'changed' : null;
};

/** What the publish list calls each kind of item, by its draft prefix. */
const NOUNS: Record<string, string> = { projeto: 'Projeto', equipa: 'Equipa', servico: 'Serviço', categoria: 'Categoria' };

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

  /* Delete: ask first, then mark it for the next Publicar. For a project it is the same
     draft the project form's own "Apagar projeto" writes. The server checks again, and
     refuses a category still in use or the team's last person, naming why. */
  const confirmDialog = document.querySelector<HTMLDialogElement>('[data-confirm-dialog]');
  let pending: HTMLElement | null = null;
  grid.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const card = target.closest<HTMLElement>('[data-card]');
    if (!card) return;
    const draft = card.dataset['deleteDraft'];
    const name = card.dataset['name'] ?? '';
    if (target.closest('[data-card-delete]') && draft && confirmDialog) {
      // Known to be refused (a category with projects, the team's last person): the same
      // modal explains why and offers only to close.
      const blocked = card.dataset['deleteBlocked'];
      pending = blocked ? null : card;
      confirmDialog.querySelector('[data-confirm-title]')!.textContent = blocked ? `Não é possível apagar «${name}»` : `Apagar «${name}»?`;
      confirmDialog.querySelector('[data-confirm-body]')!.textContent = blocked ?? 'Sai do site quando carregar em Publicar. Até lá pode desfazer.';
      confirmDialog.querySelector('[data-confirm-hint]')!.textContent = blocked ? '' : card.dataset['deleteHint'] ?? '';
      confirmDialog.querySelector<HTMLElement>('[data-confirm-go]')!.hidden = Boolean(blocked);
      confirmDialog.querySelector<HTMLElement>('[data-confirm-cancel]')!.textContent = blocked ? 'Fechar' : 'Cancelar';
      confirmDialog.showModal();
      confirmDialog.querySelector<HTMLButtonElement>('[data-confirm-cancel]')?.focus();
    } else if (target.closest('[data-card-undo]') && draft) {
      const all = loadDrafts();
      delete all[draft];
      storeDrafts(all);
      showCount();
      apply(false);
      card.querySelector<HTMLElement>('[data-card-delete]')?.focus();
    }
  });
  confirmDialog?.querySelector('[data-confirm-cancel]')?.addEventListener('click', () => confirmDialog.close());
  confirmDialog?.querySelector('[data-confirm-go]')?.addEventListener('click', () => {
    const card = pending;
    const draft = card?.dataset['deleteDraft'];
    const name = card?.dataset['name'] ?? '';
    if (card && draft) {
      const noun = NOUNS[draft.split('/')[0] ?? ''] ?? '';
      const all = loadDrafts();
      all[draft] = { from: '', to: name, label: `${noun} «${name}» — Apagar` };
      storeDrafts(all);
      showCount();
      apply(false);
    }
    confirmDialog.close();
    card?.querySelector<HTMLElement>('[data-card-undo]')?.focus();
  });

  /* New entries waiting for Publicar: a card each, first in the grid, with Desfazer. They
     exist only as drafts (`equipa/novo-…:criar`), so the page draws them from those. */
  const createPrefix = grid.dataset['createPrefix'];
  if (createPrefix) {
    const target = list ?? (() => {
      const ul = document.createElement('ul');
      ul.className = 'ad-grid';
      grid.querySelector('.ad-empty')?.replaceWith(ul);
      return ul;
    })();
    const drawNew = () => {
      for (const old of target.querySelectorAll('[data-new-card]')) old.remove();
      for (const [key, d] of Object.entries(loadDrafts()).reverse()) {
        if (!key.startsWith(`${createPrefix}/novo-`) || !key.endsWith(':criar')) continue;
        let name = '';
        try {
          const v = JSON.parse(d.to) as { name?: string; namePt?: string };
          name = v.name ?? v.namePt ?? '';
        } catch { /* a damaged draft still shows, unnamed */ }
        const li = document.createElement('li');
        li.className = 'ad-card';
        li.dataset['newCard'] = '';
        li.innerHTML = '<div class="ad-card__media" aria-hidden="true"><span class="ad-card__initial"></span></div><div class="ad-card__body"><h3 class="ad-card__title"></h3><p class="ad-chip" data-tone="changed">Novo, por publicar</p></div><div class="ad-card__actions"><button type="button" class="ad-undo">Desfazer</button></div>';
        li.querySelector('.ad-card__initial')!.textContent = name.trim().charAt(0).toUpperCase();
        li.querySelector('.ad-card__title')!.textContent = name || 'Sem nome';
        const undo = li.querySelector<HTMLButtonElement>('.ad-undo')!;
        undo.setAttribute('aria-label', `Desfazer «${name}»`);
        undo.addEventListener('click', () => {
          const all = loadDrafts();
          delete all[key];
          storeDrafts(all);
          showCount();
          drawNew();
        });
        target.prepend(li);
      }
    };
    drawNew();
  }

  apply(false);
}

/* ── the overview: what is waiting in each section ──────────────────────────── */
{
  const all = Object.keys(loadDrafts());
  for (const card of document.querySelectorAll<HTMLElement>('[data-section-keys]')) {
    const keys = JSON.parse(card.dataset['sectionKeys'] ?? '[]') as string[];
    const n = all.filter((name) => keys.some((k) => name.startsWith(k))).length;
    const chip = card.querySelector<HTMLElement>('[data-section-waiting]');
    if (chip && n) { chip.hidden = false; chip.textContent = n === 1 ? '1 alteração por publicar' : `${n} alterações por publicar`; }
  }
  const waiting = document.querySelector<HTMLElement>('[data-waiting]');
  if (waiting && all.length) {
    waiting.hidden = false;
    waiting.textContent = all.length === 1
      ? 'Há 1 alteração guardada neste computador à espera de Publicar.'
      : `Há ${all.length} alterações guardadas neste computador à espera de Publicar.`;
  }
}

/* ── the filters on a phone: folded behind one button (admin.css shows them inline on
   a wider screen, where the button is hidden), with the number of filters in use ── */
{
  const box = document.querySelector<HTMLElement>('[data-filters]');
  const toggle = box?.querySelector<HTMLButtonElement>('[data-filters-toggle]');
  if (box && toggle) {
    const paint = () => {
      const n = [...box.querySelectorAll<HTMLSelectElement>('select')].filter((s) => s.value).length;
      const count = box.querySelector<HTMLElement>('[data-filter-count]');
      if (count) count.textContent = n ? `(${n})` : '';
    };
    toggle.addEventListener('click', () => {
      const open = !box.hasAttribute('data-open');
      box.toggleAttribute('data-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    box.addEventListener('change', paint);
    paint();
  }
}

/* ── the add form (EntryCreate.astro) ────────────────────────────────────────
   "Criar" checks the required fields here, so a missing one is named at once, and turns
   the form into one draft. The server checks everything again at Publicar. */
const createForm = document.querySelector<HTMLFormElement>('[data-create-entry]');
if (createForm) {
  const say = (text: string) => {
    const m = createForm.querySelector<HTMLElement>('[data-message]');
    if (m) { m.textContent = text; m.dataset['tone'] = text ? 'error' : ''; }
  };
  const portrait = createForm.querySelector<HTMLSelectElement>('select[name="portrait"]');
  portrait?.addEventListener('change', () => {
    const img = createForm.querySelector<HTMLImageElement>('[data-preview-for="create-portrait"]');
    const src = portrait.selectedOptions[0]?.dataset['thumb'];
    if (img && src) img.src = src;
  });
  const slugInput = createForm.querySelector<HTMLInputElement>('[data-slug-from]');
  const slugOut = createForm.querySelector<HTMLElement>('[data-slug-preview]');
  slugInput?.addEventListener('input', () => {
    if (slugOut) slugOut.textContent = `/categoria-portfolio/${slugFrom(slugInput.value) || '…'}/`;
  });
  createForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = [...createForm.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('[name]')];
    const empty = fields.find((f) => f.required && !f.value.trim());
    if (empty) {
      const label = empty.closest('fieldset')?.querySelector('legend')?.textContent ?? 'Este campo';
      say(`«${label}» não pode ficar vazio.`);
      empty.focus();
      return;
    }
    const value = Object.fromEntries(fields.map((f) => [f.name, f.value.trim()]));
    const prefix = createForm.dataset['prefix'] ?? '';
    const name = value['name'] ?? value['namePt'] ?? '';
    const id = `novo-${Math.random().toString(36).slice(2, 10)}`;
    const all = loadDrafts();
    all[`${prefix}/${id}:criar`] = { from: '', to: JSON.stringify(value), label: `${createForm.dataset['noun'] ?? ''} «${name}» — Novo` };
    storeDrafts(all);
    location.assign(document.querySelector<HTMLElement>('[data-edit-dialog]')?.dataset['back'] ?? '/admin/');
  });
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

/* ── Comercial: the carousel and the videos as cards (ListGrid.astro) ─────────────
   The whole list is one draft. The cards are drawn from it, or from the live list when
   there is none, so every add, change, move or delete shows at once. A draft started from
   a list that someone has published over since is dropped and said so, never applied
   over theirs. */
{
  const root = document.querySelector<HTMLElement>('[data-list-grid]');
  if (root) {
    type Film = { id: string; title: string; poster: string };
    /** A carousel frame: the bare image key, or the image with the film it plays (edit.ts parseList). */
    type Frame = string | { image: string; film: string; title?: string };
    const imageOf = (f: unknown): string => (typeof f === 'string' ? f : (f as { image: string }).image);
    const frameFilm = (f: unknown) => (typeof f === 'object' && f ? (f as Exclude<Frame, string>) : null);
    const kind = root.dataset['kind'] as 'images' | 'films';
    const name = root.dataset['name']!;
    const label = root.dataset['label']!;
    const base = root.dataset['base']!;
    const cards = root.querySelector<HTMLElement>('[data-list-cards]')!;
    const empty = root.querySelector<HTMLElement>('[data-list-empty]')!;
    const pendingNote = root.querySelector<HTMLElement>('[data-list-pending]')!;
    const staleNote = root.querySelector<HTMLElement>('[data-list-stale]')!;
    const dialog = root.querySelector<HTMLDialogElement>('[data-list-dialog]')!;
    const body = dialog.querySelector<HTMLElement>('[data-list-dialog-body]')!;
    const say = (text: string) => { const m = dialog.querySelector<HTMLElement>('[data-list-message]')!; m.textContent = text; m.dataset['tone'] = text ? 'error' : ''; };
    const images = JSON.parse(root.querySelector('[data-list-images]')?.textContent ?? '[]') as { group: string; items: { key: string; label: string; thumb: string }[] }[];
    const posters = JSON.parse(root.querySelector('[data-list-posters]')?.textContent ?? '{}') as Record<string, string>;
    const thumbOf = new Map(images.flatMap((g) => g.items.map((i) => [i.key, i.thumb] as const)));

    {
      const d = loadDrafts()[name];
      if (d && d.from !== base) {
        const all = loadDrafts();
        delete all[name];
        storeDrafts(all);
        staleNote.hidden = false;
      }
    }
    const current = (): unknown[] => JSON.parse(loadDrafts()[name]?.to ?? base) as unknown[];
    const write = (list: unknown[]) => {
      const all = loadDrafts();
      const to = JSON.stringify(list);
      if (to === base) delete all[name];
      else all[name] = { from: base, to, label };
      storeDrafts(all);
      showCount();
      render();
    };

    const el = <T extends HTMLElement = HTMLElement>(tag: string, props: Record<string, unknown> = {}, ...kids: (Node | string)[]): T => {
      const e = Object.assign(document.createElement(tag), props) as T;
      e.append(...kids);
      return e;
    };

    function render() {
      const list = current();
      const baseList = JSON.parse(base) as unknown[];
      const changed = Boolean(loadDrafts()[name]);
      pendingNote.hidden = !changed;
      cards.replaceChildren();
      paintFollowing();
      empty.hidden = list.length > 0;
      list.forEach((item, i) => {
        const key = kind === 'images' ? imageOf(item) : (item as Film).poster;
        const title = kind === 'images' ? `Imagem ${i + 1}` : (item as Film).title || 'Sem nome';
        const meta = kind === 'images'
          ? [i === 1 ? 'À frente quando a página abre' : null, frameFilm(item) ? 'Toca um vídeo do YouTube' : null, posters[key] ? `Do projeto «${posters[key]}»` : null].filter(Boolean).join(' · ')
          : `YouTube · ${(item as Film).id}`;
        const isNew = JSON.stringify(baseList[i]) !== JSON.stringify(item);
        const media = el('div', { className: 'ad-card__media' }, el('span', { className: 'ad-card__initial', textContent: kind === 'images' && !frameFilm(item) ? String(i + 1) : '▶' }));
        media.setAttribute('aria-hidden', 'true');
        const src = thumbOf.get(key);
        if (src) {
          const img = el<HTMLImageElement>('img', { src, alt: '', loading: 'lazy', decoding: 'async', width: 320, height: 180 });
          img.addEventListener('error', () => img.remove(), { once: true });
          media.append(img);
        }
        const edit = iconButton('edit', `Editar ${kind === 'images' ? `a imagem ${i + 1}` : `«${title}»`}`);
        edit.addEventListener('click', () => open(i));
        const del = iconButton('remove', `Apagar ${kind === 'images' ? `a imagem ${i + 1}` : `«${title}»`}`);
        del.addEventListener('click', () => {
          if (!window.confirm(kind === 'images'
            ? `Tirar a imagem ${i + 1} do carrossel?\n\nSai do site quando carregar em Publicar. A imagem fica guardada.`
            : `Tirar «${title}» da página?\n\nSai do site quando carregar em Publicar.`)) return;
          const next = current();
          next.splice(i, 1);
          write(next);
        });
        const bodyEl = el('div', { className: 'ad-card__body' }, el('h3', { className: 'ad-card__title', textContent: title }));
        if (meta) bodyEl.append(el('p', { className: 'ad-card__meta', textContent: meta }));
        if (changed && isNew) bodyEl.append(el('p', { className: 'ad-chip', textContent: 'Alterado, por publicar' }));
        const li = el('li', { className: 'ad-card' }, media, bodyEl, el('div', { className: 'ad-card__actions' }, edit, del));
        cards.append(li);
      });
    }

    /** The picker: every image on the site, with its thumbnail; the current one always an option. */
    const picker = (key: string) => {
      const img = el<HTMLImageElement>('img', { src: thumbOf.get(key) ?? '', alt: '', width: 160, height: 90 });
      const s = el<HTMLSelectElement>('select', { name: 'image' });
      if (key && !thumbOf.has(key)) s.append(el('option', { value: key, textContent: `${key} (atual)`, selected: true }));
      for (const g of images) {
        const og = el('optgroup', { label: g.group });
        for (const i of g.items) og.append(el('option', { value: i.key, textContent: i.label, selected: i.key === key }));
        s.append(og);
      }
      s.addEventListener('change', () => { img.src = thumbOf.get(s.value) ?? ''; });
      return el('div', { className: 'ed-media__row' }, img, el('label', { className: 'ed-media__pick' }, el('span', { className: 'f-lang', textContent: 'Imagem do site' }), s));
    };
    const field = (text: string, input: HTMLElement) => el('fieldset', { className: 'ed-field' }, el('legend', { textContent: text }), input);

    let editing: number | null = null; // null: adding
    function open(index: number | null) {
      editing = index;
      say('');
      const list = current();
      const item = index === null ? null : list[index];
      dialog.querySelector('[data-list-dialog-title]')!.textContent = index === null
        ? (kind === 'images' ? 'Acrescentar imagem ao carrossel' : 'Acrescentar vídeo')
        : (kind === 'images' ? `Imagem ${index + 1}` : (item as Film).title);
      body.replaceChildren();
      const upload = root!.querySelector<HTMLElement>('[data-list-upload]');
      if (upload) upload.hidden = index !== null;
      /* An upload lands at the card's place in the PUBLISHED list, so it is offered only
         while the card is still there; a moved or new card waits for Publicar. */
      const idOf = (x: unknown) => (kind === 'images' ? JSON.stringify(x) : (x as Film | undefined)?.id);
      const settled = index !== null && idOf((JSON.parse(base) as unknown[])[index]) === idOf(item);
      for (const at of root!.querySelectorAll<HTMLElement>('[data-list-upload-at]')) {
        at.hidden = !settled || Number(at.dataset['listUploadAt']) !== index;
      }
      const later = root!.querySelector<HTMLElement>('[data-list-upload-later]')!;
      later.hidden = settled || (kind === 'images' && index === null);
      later.textContent = index === null
        ? 'Para carregar uma capa nova, acrescente o vídeo e carregue em Publicar; depois volte a abri-lo aqui.'
        : 'Para carregar um ficheiro novo para este lugar, carregue primeiro em Publicar.';
      if (kind === 'images') {
        const frame = frameFilm(item);
        body.append(
          field(index === null ? 'Escolher uma imagem do site' : 'Imagem', picker(item ? imageOf(item) : (images[0]?.items[0]?.key ?? ''))),
          field('Vídeo no YouTube (opcional)', el('input', { type: 'text', name: 'film', value: frame?.film ? `https://youtu.be/${frame.film}` : '', placeholder: 'https://www.youtube.com/watch?v=…', spellcheck: false, autocomplete: 'off' })),
          el('p', { className: 'ed-note', textContent: 'Se puser um vídeo, a imagem passa a ter o botão «Ver o filme» e, ao carregar nela, o vídeo toca no carrossel. Deixe vazio para ser só uma imagem.' }),
          field('Nome do vídeo (opcional)', el('input', { type: 'text', name: 'filmTitle', value: frame?.title ?? '', autocomplete: 'off' })),
          el('p', { className: 'ed-note', textContent: 'O nome não aparece na página: é o que os leitores de ecrã anunciam.' }),
        );
      } else {
        const f = (item ?? { id: '', title: '', poster: images[0]?.items[0]?.key ?? '' }) as Film;
        body.append(
          field('Endereço no YouTube', el('input', { type: 'text', name: 'id', value: f.id, placeholder: 'https://www.youtube.com/watch?v=…', spellcheck: false, autocomplete: 'off' })),
          field('Nome do vídeo', el('input', { type: 'text', name: 'title', value: f.title, autocomplete: 'off' })),
          el('p', { className: 'ed-note', textContent: 'O nome não aparece na página: é o que os leitores de ecrã anunciam.' }),
          field('Capa (aparece antes de carregar em ver)', picker(f.poster)),
        );
      }
      if (index !== null && list.length > 1) {
        const pos = el<HTMLSelectElement>('select', { name: 'position' });
        list.forEach((_, n) => pos.append(el('option', { value: String(n), textContent: `${n + 1}.ª${kind === 'images' && n === 1 ? ' (à frente quando a página abre)' : ''}`, selected: n === index })));
        body.append(field('Posição', pos));
      }
      dialog.showModal();
      body.querySelector<HTMLElement>('input, select')?.focus();
    }

    dialog.querySelector('[data-list-cancel]')!.addEventListener('click', () => dialog.close());
    dialog.querySelector('[data-list-save]')!.addEventListener('click', () => {
      const value = (n: string) => body.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${n}"]`)?.value.trim() ?? '';
      let item: unknown;
      if (kind === 'images') {
        const address = value('film');
        const film = address ? youtubeIdOf(address) : null;
        if (address && !film) { say('Não reconheço o endereço do vídeo. Cole o link, por exemplo https://www.youtube.com/watch?v=…'); return; }
        item = film ? { image: value('image'), film, ...(value('filmTitle') ? { title: value('filmTitle') } : {}) } : value('image');
      } else {
        const id = youtubeIdOf(value('id'));
        if (!id) { say('Não reconheço este endereço. Cole o link do vídeo, por exemplo https://www.youtube.com/watch?v=…'); return; }
        if (!value('title')) { say('Escreva o nome do vídeo.'); return; }
        item = { id, title: value('title'), poster: value('image') };
      }
      const list = current();
      if (editing === null) list.push(item);
      else {
        list.splice(editing, 1);
        const to = body.querySelector<HTMLSelectElement>('[name="position"]') ? Number(value('position')) : editing;
        list.splice(to, 0, item);
      }
      write(list);
      dialog.close();
    });
    document.querySelector('[data-list-add]')?.addEventListener('click', () => open(null));
    root.querySelector('[data-list-reset]')?.addEventListener('click', () => {
      if (!window.confirm(`Desfazer todas as alterações por publicar ${kind === 'images' ? 'no carrossel' : 'nos vídeos'}?`)) return;
      write(JSON.parse(base) as unknown[]);
    });

    /* Which categories' projects follow the images: one more list draft. The project
       cards below are all in the page; this shows the ones the carousel will really have. */
    const cats = root.querySelector<HTMLDialogElement>('[data-cats-dialog]');
    const catsName = 'services:categories';
    const catsBase = cats?.dataset['base'] ?? '[]';
    const now = () => JSON.parse(loadDrafts()[catsName]?.from === catsBase ? loadDrafts()[catsName]!.to : catsBase) as string[];
    function paintFollowing() {
      const box = root!.querySelector<HTMLElement>('[data-following]');
      if (!box) return;
      const chosen = now();
      const above = new Set(current().map(imageOf));
      for (const li of box.querySelectorAll<HTMLElement>('li')) {
        li.hidden = !(li.dataset['cats'] ?? '').split(' ').some((c) => chosen.includes(c)) || above.has(li.dataset['poster'] ?? '');
      }
      const names = JSON.parse(cats?.dataset['names'] ?? '{}') as Record<string, string>;
      const label = root!.querySelector<HTMLElement>('[data-cats-names]');
      if (label) label.textContent = chosen.map((c) => names[c] ?? c).join(', ') || 'nenhuma categoria';
    }
    if (cats) {
      const boxes = [...cats.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
      root.querySelector('[data-cats-open]')?.addEventListener('click', () => {
        const chosen = now();
        for (const b of boxes) b.checked = chosen.includes(b.value);
        cats.showModal();
      });
      cats.querySelector('[data-cats-cancel]')!.addEventListener('click', () => cats.close());
      cats.querySelector('[data-cats-save]')!.addEventListener('click', () => {
        const to = JSON.stringify(boxes.filter((b) => b.checked).map((b) => b.value));
        const all = loadDrafts();
        if (to === catsBase) delete all[catsName];
        else all[catsName] = { from: catsBase, to, label: 'Página Serviços — Projetos no carrossel' };
        storeDrafts(all);
        showCount();
        cats.close();
        paintFollowing();
      });
    }

    render();
  }
}

/** A YouTube id from an id or any of the usual addresses (the server's edit.ts rule, again). */
function youtubeIdOf(input: string): string | null {
  const v = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(v)) return v;
  const m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(v);
  return m ? m[1]! : null;
}

/* ── a person's links, the site's phones and social networks (EntryEditor.astro) ──
   One hidden field holds the whole list as JSON; these rows edit it, and every change
   fires `input`, so it is a draft like any other. The server checks each row again
   (entries.ts `parseEntryList`). */
for (const input of document.querySelectorAll<HTMLInputElement>('input[data-rows]')) {
  const kind = input.dataset['rows'] as 'links' | 'phones' | 'socials';
  const platforms = JSON.parse(input.dataset['platforms'] ?? '[]') as string[];
  const list = input.parentElement!.querySelector<HTMLOListElement>('[data-rows-list]')!;
  type Row = Record<string, string>;
  let rows: Row[] = [];
  try { rows = JSON.parse(input.value) as Row[]; } catch { rows = []; }
  const NAMES: Record<string, string> = { instagram: 'Instagram', linkedin: 'LinkedIn', youtube: 'YouTube', vimeo: 'Vimeo', whatsapp: 'WhatsApp', other: 'Outra' };
  const commit = () => {
    input.value = JSON.stringify(rows);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const field = (text: string, control: HTMLElement) => {
    const l = document.createElement('label');
    l.className = 'ed-media__pick';
    const s = document.createElement('span');
    s.className = 'f-lang';
    s.textContent = text;
    l.append(s, control);
    return l;
  };
  const textInput = (row: Row, key: string, placeholder = '') => {
    const i = document.createElement('input');
    i.type = 'text';
    i.value = row[key] ?? '';
    i.placeholder = placeholder;
    i.autocomplete = 'off';
    i.spellcheck = false;
    if (key === 'number') i.inputMode = 'tel';
    if (key === 'url') i.inputMode = 'url';
    i.addEventListener('input', (e) => { e.stopPropagation(); row[key] = i.value; commit(); });
    return i;
  };
  const render = () => {
    list.replaceChildren();
    if (!rows.length) {
      const li = document.createElement('li');
      li.className = 'ed-note';
      li.textContent = 'Nenhum. Carregue em + para acrescentar.';
      list.append(li);
    }
    rows.forEach((row, i) => {
      const li = document.createElement('li');
      li.className = 'ed-block';
      const head = document.createElement('div');
      head.className = 'ed-blockhead';
      const title = document.createElement('strong');
      title.textContent = `${i + 1}. ${row['label'] || (kind === 'phones' ? 'Telefone' : 'Ligação')}`;
      const moves = document.createElement('span');
      moves.className = 'ed-order__moves';
      const move = (d: -1 | 1, sign: string, what: string) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = sign;
        b.disabled = !rows[i + d];
        b.setAttribute('aria-label', `${what} a linha ${i + 1}`);
        b.addEventListener('click', () => { [rows[i], rows[i + d]] = [rows[i + d]!, rows[i]!]; commit(); render(); });
        return b;
      };
      const del = iconButton('remove', `Apagar a linha ${i + 1}`);
      del.addEventListener('click', () => {
        if (!window.confirm(`Apagar «${row['label'] || `linha ${i + 1}`}»?`)) return;
        rows.splice(i, 1);
        commit();
        render();
      });
      moves.append(move(-1, '↑', 'Subir'), move(1, '↓', 'Descer'), del);
      head.append(title, moves);
      const body = document.createElement('div');
      body.className = 'ed-pair';
      body.append(field('Nome', textInput(row, 'label', kind === 'phones' ? 'Principal' : 'Instagram')));
      if (kind === 'phones') body.append(field('Número', textInput(row, 'number', '+351 912 345 678')));
      else {
        const s = document.createElement('select');
        for (const p of platforms) s.append(new Option(NAMES[p] ?? p, p, false, (row['platform'] ?? 'other') === p));
        s.addEventListener('change', (e) => { e.stopPropagation(); row['platform'] = s.value; commit(); });
        body.append(field('Rede', s), field('Endereço', textInput(row, 'url', 'https://')));
      }
      li.append(head, body);
      list.append(li);
    });
  };
  input.parentElement!.querySelector('[data-rows-add]')?.addEventListener('click', () => {
    rows.push(kind === 'phones' ? { label: '', number: '' } : { label: '', url: '', platform: platforms[0] ?? 'other' });
    commit();
    render();
    list.lastElementChild?.querySelector<HTMLInputElement>('input')?.focus();
  });
  render();
}
