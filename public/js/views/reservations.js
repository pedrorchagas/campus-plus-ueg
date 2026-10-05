// T05 — Acompanhamento das solicitações de espaço
import { api } from '../api.js';
import { esc, fmtDate, statusTag, toast, $$ } from '../ui.js';

const STEP_LABEL = { enviada: 'Enviada', em_analise: 'Em análise', aprovada: 'Aprovada', recusada: 'Recusada', cancelada: 'Cancelada' };

export function timeline(r) {
  const final = ['aprovada', 'recusada', 'cancelada'].includes(r.status);
  const items = r.history.map((h, i) => {
    const last = i === r.history.length - 1;
    const cls = h.status === 'recusada' || h.status === 'cancelada' ? 'bad' : last && !final ? 'current' : 'done';
    return `<li class="${cls}"><b>${STEP_LABEL[h.status]}</b> <span class="meta">· ${fmtDate(h.at, { weekday: false })}</span>${h.note ? `<div class="meta">${esc(h.note)}</div>` : ''}</li>`;
  });
  if (!final) items.push(`<li><span class="muted">Decisão</span><div class="meta">Previsão: até 2 dias úteis</div></li>`);
  return `<ol class="steps">${items.join('')}</ol>`;
}

export default async function render(el) {
  async function draw() {
    const list = await api.get('/reservations');
    el.innerHTML = `
      <a class="back" href="#/espacos">← Espaços</a>
      <div class="page-head"><div><h1>Minhas solicitações</h1><p>Acompanhe o andamento dos pedidos de uso de espaços.</p></div></div>
      <div class="stack">
        ${list.length
          ? list
              .map(
                (r) => `<div class="card">
                  <div class="row"><span class="card-title">${esc(r.spaceName)}</span><span class="spacer"></span>${statusTag(r.status, r.statusLabel)}</div>
                  <div class="meta" style="margin:2px 0 10px">${fmtDate(r.date)} · ${esc(r.start)}–${esc(r.end)} · ${esc(r.purpose)}</div>
                  ${timeline(r)}
                  ${r.status === 'em_analise' || (r.status === 'aprovada' && r.date >= new Date().toISOString().slice(0, 10)) ? `<button class="btn sm secondary" type="button" data-cancel="${r.id}">Cancelar</button>` : ''}
                </div>`
              )
              .join('')
          : '<div class="empty">Nenhuma solicitação ainda. <a href="#/espacos">Encontrar um espaço</a></div>'}
      </div>`;
    $$('[data-cancel]', el).forEach((b) =>
      b.addEventListener('click', async () => {
        await api.patch(`/reservations/${b.dataset.cancel}`, { status: 'cancelada' });
        toast('Solicitação cancelada');
        draw();
      })
    );
  }
  await draw();
}
