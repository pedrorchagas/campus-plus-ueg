// Aprovação de solicitações de espaço (servidor / coordenação)
// Testa: quem aprova, com quais regras e em quanto tempo (perguntas 14 e 15).
import { api } from '../api.js';
import { esc, fmtDate, statusTag, toast, openSheet, closeSheet, $$ } from '../ui.js';

export default async function render(el) {
  let tab = 'pendentes';

  async function draw() {
    const all = await api.get('/reservations?scope=all');
    const pending = all.filter((r) => r.status === 'em_analise');
    const done = all.filter((r) => r.status !== 'em_analise');
    const list = tab === 'pendentes' ? pending : done;

    el.innerHTML = `
      <div class="page-head"><div><h1>Aprovações de espaços</h1><p>Solicitações dos espaços sob sua responsabilidade.</p></div></div>
      <div class="tabs" role="tablist">
        <button type="button" role="tab" data-tab="pendentes" aria-selected="${tab === 'pendentes'}">Pendentes (${pending.length})</button>
        <button type="button" role="tab" data-tab="decididas" aria-selected="${tab === 'decididas'}">Histórico</button>
      </div>
      <div class="stack">
        ${list.length
          ? list
              .map(
                (r) => `<div class="card">
                  <div class="row"><span class="card-title">${esc(r.spaceName)}</span><span class="meta">· ${esc(r.spaceBlock)}</span><span class="spacer"></span>${statusTag(r.status, r.statusLabel)}</div>
                  <div class="stack small" style="margin-top:8px;gap:4px">
                    <div>📅 ${fmtDate(r.date)} · ${esc(r.start)}–${esc(r.end)}</div>
                    <div>👤 ${esc(r.requester)} · ${r.people} pessoa(s)</div>
                    <div>📝 ${esc(r.purpose)}</div>
                    <div class="meta">Solicitado em ${fmtDate(r.createdAt, { weekday: false })} · aprovador: ${esc(r.approver)}</div>
                  </div>
                  ${r.status === 'em_analise'
                    ? `<div class="row" style="margin-top:12px"><button class="btn sm ok" type="button" data-approve="${r.id}">Aprovar</button><button class="btn sm secondary" type="button" data-reject="${r.id}">Recusar</button><button class="btn sm ghost" type="button" data-alt="${r.id}">Sugerir outro horário</button></div>`
                    : r.history.at(-1)?.note ? `<p class="meta" style="margin-top:8px">${esc(r.history.at(-1).note)}</p>` : ''}
                </div>`
              )
              .join('')
          : '<div class="empty">Nada por aqui.</div>'}
      </div>`;

    $$('[data-tab]', el).forEach((b) => b.addEventListener('click', () => ((tab = b.dataset.tab), draw())));
    $$('[data-approve]', el).forEach((b) =>
      b.addEventListener('click', async () => {
        await api.patch(`/reservations/${b.dataset.approve}`, { status: 'aprovada' });
        toast('Solicitação aprovada. O solicitante foi avisado.');
        draw();
      })
    );
    $$('[data-reject]', el).forEach((b) => b.addEventListener('click', () => reject(b.dataset.reject)));
    $$('[data-alt]', el).forEach((b) => b.addEventListener('click', () => toast('Contraproposta de horário — funcionalidade a validar')));
  }

  function reject(id) {
    openSheet(
      'Recusar solicitação',
      `<form id="rj">
        <div class="field"><label for="rj-reason">Motivo (será enviado ao solicitante)</label>
          <select class="input" id="rj-reason"><option>Espaço reservado para atividade acadêmica</option><option>Finalidade incompatível com o espaço</option><option>Antecedência mínima não respeitada</option><option>Outro</option></select></div>
        <div class="field"><label for="rj-note">Observação</label><textarea class="input" id="rj-note" placeholder="Opcional"></textarea></div>
        <button class="btn danger block" type="submit">Recusar</button>
      </form>`,
      (sheet) =>
        sheet.querySelector('#rj').addEventListener('submit', async (e) => {
          e.preventDefault();
          const note = [sheet.querySelector('#rj-reason').value, sheet.querySelector('#rj-note').value].filter(Boolean).join(' — ');
          await api.patch(`/reservations/${id}`, { status: 'recusada', note });
          closeSheet();
          toast('Solicitação recusada');
          draw();
        })
    );
  }

  await draw();
}
