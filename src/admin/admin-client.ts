/**
 * The admin's browser side: send what changed, then follow the preview build until it is
 * ready, and say so in plain words. Nothing here decides what may be saved — the server
 * does (src/admin/api/save.ts); this only reports what the server and GitHub answer.
 */

interface BuildState { configured: boolean; state?: 'building' | 'ready' | 'failed' | 'none' | 'unknown'; commit?: string; url?: string; at?: string }

const POLL_MS = 8000;
const POLL_FOR_MS = 15 * 60_000;

async function buildState(): Promise<BuildState | null> {
  try {
    const res = await fetch('/admin/api/estado/', { headers: { Accept: 'application/json' }, cache: 'no-store' });
    return res.ok ? ((await res.json()) as BuildState) : null;
  } catch { return null; }
}

const ago = (iso?: string) => {
  if (!iso) return '';
  const min = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  return min < 1 ? 'agora mesmo' : min < 60 ? `há ${min} min` : `há ${Math.round(min / 60)} h`;
};

/* ── the status bar: the preview's state, on every admin page ───────────── */

const bar = document.querySelector<HTMLElement>('[data-build]');

function showBuild(s: BuildState | null) {
  if (!bar) return;
  if (!s) { bar.textContent = 'Estado da pré-visualização indisponível.'; return; }
  if (!s.configured) { bar.textContent = 'Guardar ainda não está configurado.'; return; }
  bar.textContent = s.state === 'building' ? 'Pré-visualização a ser preparada… '
    : s.state === 'ready' ? `Pré-visualização atualizada ${ago(s.at)}.`
    : s.state === 'failed' ? 'A última pré-visualização falhou. '
    : 'Pré-visualização: sem informação.';
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

/* ── how much is saved but not yet live, on the "Publicar" link ─────────── */

const badge = document.querySelector<HTMLElement>('[data-pending]');
async function refreshPending() {
  if (!badge) return;
  try {
    const res = await fetch('/admin/api/estado/?pendentes=1', { cache: 'no-store' });
    const s = (await res.json()) as { pending?: number; blocked?: boolean };
    badge.textContent = s.pending ? `(${s.pending})` : '';
    badge.title = s.pending ? `${s.pending} por publicar${s.blocked ? ' (bloqueado: alterações técnicas por rever)' : ''}` : '';
  } catch { badge.textContent = ''; }
}
void refreshPending();

/* ── publishing ─────────────────────────────────────────────────────────── */

const pub = document.querySelector<HTMLElement>('[data-publish]');
if (pub) {
  const start = pub.querySelector<HTMLButtonElement>('[data-publish-start]')!;
  const confirm = pub.querySelector<HTMLElement>('[data-publish-confirm]')!;
  const go = pub.querySelector<HTMLButtonElement>('[data-publish-go]')!;
  const cancel = pub.querySelector<HTMLButtonElement>('[data-publish-cancel]')!;
  const out = pub.querySelector<HTMLElement>('[data-publish-message]')!;
  const say = (text: string, tone?: 'ok' | 'error') => {
    out.textContent = text;
    if (tone) out.dataset['tone'] = tone; else delete out.dataset['tone'];
  };

  start.addEventListener('click', () => { start.hidden = true; confirm.hidden = false; go.focus(); });
  cancel.addEventListener('click', () => { confirm.hidden = true; start.hidden = false; start.focus(); });

  go.addEventListener('click', async () => {
    go.disabled = true;
    cancel.disabled = true;
    say('A publicar…');
    let res: Response | null = null;
    let body: { error?: string; nothing?: boolean; merged?: string } = {};
    try {
      res = await fetch('/admin/api/publicar/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ sha: pub.dataset['reviewed'] }),
      });
      body = await res.json();
    } catch { /* network */ }

    if (!res || !res.ok) {
      go.disabled = false;
      cancel.disabled = false;
      say(body.error ?? 'Não foi possível publicar (sem ligação?). Nada foi publicado.', 'error');
      return;
    }
    confirm.hidden = true;
    if (body.nothing) { say('Já não havia nada por publicar.'); return; }
    say('Enviado para o site. A atualizar nextvisionfilms.com (cerca de 3 minutos)…', 'ok');
    void refreshPending();
    if (body.merged) void followLive(body.merged);
  });

  async function followLive(commit: string) {
    const until = Date.now() + POLL_FOR_MS;
    while (Date.now() < until) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      let s: BuildState | null = null;
      try { s = (await (await fetch('/admin/api/estado/?alvo=site', { cache: 'no-store' })).json()) as BuildState; } catch { /* keep polling */ }
      if (!s?.configured || s.commit !== commit) continue;
      if (s.state === 'ready') { say('Publicado. O site já mostra as alterações.', 'ok'); return; }
      if (s.state === 'failed') {
        say('As alterações foram enviadas, mas a atualização do site falhou e o site continua como estava. Fale com o programador.', 'error');
        return;
      }
    }
    say('A atualização do site está a demorar mais do que o normal. As alterações já foram enviadas.');
  }
}

/* ── the editor ─────────────────────────────────────────────────────────── */

const form = document.querySelector<HTMLFormElement>('[data-editor]');
if (form) {
  const save = form.querySelector<HTMLButtonElement>('[data-save]')!;
  const message = form.querySelector<HTMLElement>('[data-message]')!;
  const controls = [...form.querySelectorAll<HTMLTextAreaElement | HTMLSelectElement>('[data-original]')];
  let busy = false;

  const isDirty = (c: HTMLTextAreaElement | HTMLSelectElement) => c.value !== c.dataset['original'];
  const dirty = () => controls.filter(isDirty);
  const say = (text: string, tone?: 'ok' | 'error') => {
    message.textContent = text;
    if (tone) message.dataset['tone'] = tone; else delete message.dataset['tone'];
  };

  const refresh = () => {
    const n = dirty().length;
    save.disabled = busy || n === 0;
    for (const fs of form.querySelectorAll<HTMLElement>('[data-field]')) {
      const changed = [...fs.querySelectorAll<HTMLTextAreaElement | HTMLSelectElement>('[data-original]')].some(isDirty);
      if (changed) fs.dataset['dirty'] = ''; else delete fs.dataset['dirty'];
    }
    if (!busy) say(n ? `${n} ${n === 1 ? 'alteração' : 'alterações'} por guardar.` : 'Sem alterações por guardar.');
  };

  form.addEventListener('input', refresh);
  form.addEventListener('change', (e) => {
    const select = e.target;
    if (select instanceof HTMLSelectElement) {
      const img = form.querySelector<HTMLImageElement>(`[data-preview-for="${select.id}"]`);
      const thumb = select.selectedOptions[0]?.dataset['thumb'];
      if (img && thumb) img.src = thumb;
    }
    refresh();
  });
  window.addEventListener('beforeunload', (e) => { if (dirty().length && !busy) e.preventDefault(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const changed = dirty();
    if (!changed.length || busy) return;
    busy = true;
    save.disabled = true;
    say('A guardar…');

    let res: Response | null = null;
    let body: { error?: string; nothing?: boolean; commit?: string; changed?: string[]; shas?: Record<string, string> } = {};
    try {
      res = await fetch('/admin/api/guardar/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          screen: form.dataset['screen'],
          shas: JSON.parse(form.dataset['shas'] ?? '{}'),
          edits: Object.fromEntries(changed.map((c) => [c.name, c.value])),
        }),
      });
      body = await res.json();
    } catch { /* network: res stays null */ }

    busy = false;
    if (!res || !res.ok) {
      refresh();
      // After refresh(), which would otherwise replace the reason with a change count.
      say(body.error ?? 'Não foi possível guardar (sem ligação?). Nada foi guardado.', 'error');
      return;
    }

    for (const c of controls) c.dataset['original'] = c.value;
    if (body.shas) form.dataset['shas'] = JSON.stringify(body.shas);
    refresh();
    if (body.nothing) { say('Nada mudou: não havia nada para guardar.'); return; }
    say(`Guardado: ${(body.changed ?? []).join(', ')}. A preparar a pré-visualização (cerca de 2 minutos)…`, 'ok');
    if (body.commit) void follow(body.commit, Date.now());
  });

  let following = 0;

  /**
   * Follow the build of THIS save until it is finished, then reload the preview.
   *
   * A newer push to `dev` cancels an older build (dev.yml's concurrency), and the newer
   * build contains this save too, so any build STARTED after this save counts. A later
   * save starts its own follow and this one stops.
   */
  async function follow(commit: string, since: number) {
    const mine = ++following;
    const until = Date.now() + POLL_FOR_MS;
    while (Date.now() < until && mine === following) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      const s = await buildState();
      showBuild(s);
      if (mine !== following) return;
      const covers = s?.commit === commit || (s?.at !== undefined && Date.parse(s.at) >= since - 5000);
      if (!s?.configured || !covers) continue;
      if (s.state === 'ready') {
        say('Pré-visualização pronta. Confira à direita; quando estiver bem, publique em «Publicar».', 'ok');
        void refreshPending();
        const frame = document.querySelector<HTMLIFrameElement>('.admin-viewer iframe');
        if (frame) frame.src = frame.src;
        return;
      }
      if (s.state === 'failed') {
        say('As alterações estão guardadas, mas a pré-visualização falhou. Veja os detalhes na barra de baixo ou fale com o programador.', 'error');
        return;
      }
    }
    if (mine === following) say('A pré-visualização está a demorar mais do que o normal. As alterações estão guardadas.');
  }

  refresh();
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

  const post = async (url: string, body: unknown) => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) throw new Error(String(data['error'] ?? 'Falhou.'));
    return data;
  };

  go.addEventListener('click', async () => {
    if (problem() || !file) return;
    uploading += 1;
    go.disabled = true;
    bar.hidden = false;
    bar.value = 0;
    const f = file;
    type Started = { key: string; uploadId: string; partBytes: number };
    let started: Started | null = null;
    try {
      say('A carregar…');
      const begun = (await post('/admin/api/carregar/', { acao: 'iniciar', name: f.name, size: f.size })) as unknown as Started;
      started = begun;
      const { key, uploadId, partBytes } = begun;
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
        bar.value = Math.round((n / count) * 100);
        say(`A carregar… ${bar.value}%`);
      }
      await post('/admin/api/carregar/', { acao: 'concluir', key, uploadId, parts });
      started = null;

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
        ? 'Recebido. A processar o vídeo — normalmente 3 a 8 minutos. Pode continuar a trabalhar ou fechar esta página.'
        : 'Recebido. A processar a imagem — normalmente 2 a 4 minutos.', 'ok');
      void followUpload(id, say);
    } catch (e) {
      uploading = Math.max(0, uploading - 1);
      bar.hidden = true;
      const open = started as Started | null;
      if (open) void post('/admin/api/carregar/', { acao: 'abortar', key: open.key, uploadId: open.uploadId }).catch(() => undefined);
      say(e instanceof Error ? e.message : 'Não foi possível carregar.', 'error');
      check();
    }
  });
}

/** Processing (media-ingest.yml), then the preview build of the commit that attached it. */
async function followUpload(id: string, say: (t: string, tone?: 'ok' | 'error') => void) {
  const until = Date.now() + 40 * 60_000;
  while (Date.now() < until) {
    await new Promise((r) => setTimeout(r, 10_000));
    let s: { status?: string; error?: string | null; head?: string | null } = {};
    try { s = await (await fetch(`/admin/api/estado/?carregamento=${encodeURIComponent(id)}`, { cache: 'no-store' })).json(); } catch { continue; }
    if (s.status === 'failed') { say(`Não foi possível usar o ficheiro: ${s.error ?? 'erro desconhecido.'}`, 'error'); return; }
    if (s.status !== 'ready' || !s.head) continue;
    say('Processado. A preparar a pré-visualização…', 'ok');
    while (Date.now() < until) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      const b = await buildState();
      showBuild(b);
      if (b?.commit !== s.head) continue;
      if (b.state === 'ready') {
        say('Pronto: o novo ficheiro já está na pré-visualização. Quando estiver bem, publique em «Publicar».', 'ok');
        void refreshPending();
        return;
      }
      if (b.state === 'failed') { say('O ficheiro foi processado, mas a pré-visualização falhou. Fale com o programador.', 'error'); return; }
    }
  }
  say('O processamento está a demorar mais do que o normal. Volte a esta página mais tarde.');
}
