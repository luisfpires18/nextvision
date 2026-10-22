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
        say('Pré-visualização pronta. Confira à direita antes de publicar.', 'ok');
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
