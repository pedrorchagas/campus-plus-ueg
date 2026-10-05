// T05 — Detalhe do espaço e solicitação de uso
// Testa: formulário de solicitação, regras de aprovação visíveis (pergunta 15) e tempo de resposta aceitável (14).
import { api, qs } from '../api.js';
import { esc, fmtDate, toast, openSheet, closeSheet, $$ } from '../ui.js';

const hh = (h) => `${String(h).padStart(2, '0')}:00`;

export default async function render(el, { params, query, state }) {
  let date = query.data || state.meta.today;
  let space = await api.get(`/spaces/${params.id}${qs({ date })}`);
  // Seleção de horário: intervalo [from, to) em horas
  let sel = null;
  if (query.periodo) {
    const first = space.slots.find((s) => s.free && s.hour >= { manha: 7, tarde: 13, noite: 18 }[query.periodo]);
    if (first) sel = { from: first.hour, to: first.hour + 1 };
  }

  function draw() {
    const auto = space.approver === 'Sistema';
    el.innerHTML = `
      <a class="back" href="#/espacos">← Espaços</a>
      <div class="split">
        <div>
          <div class="row"><span class="tag">${esc(space.type)}</span></div>
          <h1 style="margin-top:6px">${esc(space.name)}</h1>
          <p class="meta">${esc(space.block)} · ${state.profile.campus || 'Campus Central'}</p>
          <div class="card" style="margin-top:12px"><div class="stack small">
            <div>👥 <b>Capacidade:</b> ${space.capacity} pessoas</div>
            <div>🧰 <b>Equipamentos:</b> ${space.equipment.map(esc).join(', ')}</div>
            <div>✅ <b>Quem aprova:</b> ${esc(space.approval)}${auto ? '' : ` — ${esc(space.approver)}`}</div>
            <div>⏱️ <b>Prazo de resposta:</b> ${auto ? 'imediato' : 'até 2 dias úteis'}</div>
          </div></div>
          <details class="card" style="margin-top:10px"><summary><b>Regras de uso</b></summary>
            <ul class="small" style="margin:8px 0 0;padding-left:18px">
              <li>Solicitar com no mínimo ${auto ? '1 hora' : '48 horas'} de antecedência.</li>
              <li>Máximo de ${auto ? '3 horas por reserva' : '4 horas por solicitação'}.</li>
              <li>Não comparecer 2 vezes bloqueia novas reservas por 15 dias.</li>
              <li>Deixar o espaço organizado e equipamentos desligados.</li>
            </ul>
            <p class="muted small" style="margin-top:6px"><i>Regras fictícias — quais deveriam valer de verdade?</i></p>
          </details>
        </div>

        <div class="section">
          <div class="row" style="margin-bottom:10px"><h2>Disponibilidade</h2><span class="spacer"></span>
            <input type="date" class="input" id="sd-date" value="${date}" style="width:auto;min-height:36px;padding:4px 10px" aria-label="Data"></div>
          <p class="meta" style="margin-bottom:8px">${fmtDate(date)} · toque nos horários livres para selecionar</p>
          <div class="slots" role="group" aria-label="Horários">
            ${space.slots
              .map((s) => {
                const isSel = sel && s.hour >= sel.from && s.hour < sel.to;
                return `<button type="button" class="slot ${s.free ? 'free' : 'busy'} ${isSel ? 'sel' : ''}" data-hour="${s.hour}" ${s.free ? '' : 'disabled'} aria-pressed="${!!isSel}" aria-label="${s.label} ${s.free ? 'livre' : 'ocupado'}">${s.label}</button>`;
              })
              .join('')}
          </div>
          <div class="legend"><span><i style="background:var(--ok-soft);border:1px solid #b7e2c4"></i>Livre</span><span><i style="background:var(--surface-2)"></i>Ocupado</span><span><i style="background:var(--ok)"></i>Selecionado</span></div>

          <form class="card" id="req" style="margin-top:14px">
            <h3 style="margin-bottom:10px">Solicitar uso</h3>
            <div class="form-row">
              <div class="field"><label for="r-start">Início</label><select class="input" id="r-start" name="start">${opts(7, 21, sel?.from)}</select></div>
              <div class="field"><label for="r-end">Fim</label><select class="input" id="r-end" name="end">${opts(8, 22, sel?.to)}</select></div>
            </div>
            <div class="field"><label for="r-purpose">Finalidade *</label>
              <select class="input" id="r-purpose-type" aria-label="Tipo de uso"><option>Estudo em grupo</option><option>Trabalho / projeto</option><option>Reunião de grupo de pesquisa</option><option>Evento / palestra</option><option>Outro</option></select>
              <input class="input" id="r-purpose" name="purpose" placeholder="Descreva brevemente (ex.: estudar para prova de BD)"></div>
            <div class="field"><label for="r-people">Número de pessoas</label><input class="input" type="number" min="1" max="${space.capacity}" id="r-people" name="people" value="4"></div>
            <label class="option" style="margin-bottom:12px"><input type="checkbox" id="r-agree" required><div class="small">Li e concordo com as regras de uso do espaço.</div></label>
            <button class="btn block" type="submit">${auto ? 'Reservar agora' : 'Enviar solicitação'}</button>
            <p class="muted small center" style="margin-top:8px">${auto ? 'Salas de estudo até 3h são aprovadas na hora.' : `Sua solicitação será analisada por: ${esc(space.approver)}.`}</p>
          </form>
        </div>
      </div>`;

    el.querySelector('#sd-date').addEventListener('change', async (e) => {
      if (!e.target.value) return;
      date = e.target.value;
      sel = null;
      space = await api.get(`/spaces/${params.id}${qs({ date })}`);
      draw();
    });
    $$('.slot.free', el).forEach((b) =>
      b.addEventListener('click', () => {
        const h = Number(b.dataset.hour);
        // Primeiro toque seleciona 1h; tocar em horário adjacente amplia o intervalo
        if (sel && h === sel.to && space.slots.find((s) => s.hour === h)?.free) sel.to = h + 1;
        else if (sel && h === sel.from - 1) sel.from = h;
        else if (sel && h >= sel.from && h < sel.to) sel = null;
        else sel = { from: h, to: h + 1 };
        draw();
      })
    );
    el.querySelector('#req').addEventListener('submit', submit);
  }

  function opts(from, to, selected) {
    let s = '';
    for (let h = from; h <= to; h++) s += `<option value="${hh(h)}" ${h === selected ? 'selected' : ''}>${hh(h)}</option>`;
    return s;
  }

  async function submit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const detail = fd.get('purpose').trim();
    const purposeType = el.querySelector('#r-purpose-type').value;
    try {
      const r = await api.post('/reservations', {
        spaceId: space.id,
        date,
        start: fd.get('start'),
        end: fd.get('end'),
        purpose: detail ? `${purposeType}: ${detail}` : purposeType,
        people: fd.get('people'),
      });
      const ok = r.status === 'aprovada';
      openSheet(
        ok ? 'Reserva confirmada!' : 'Solicitação enviada',
        `<div class="stack">
          <div class="alert ${ok ? 'ok' : 'warn'}"><span class="ico">${ok ? '✓' : '⏳'}</span><div>${ok ? 'O espaço está reservado para você.' : `Em análise por <b>${esc(r.approver)}</b>. Você será avisada(o) quando houver resposta.`}</div></div>
          <div class="card small"><b>${esc(r.spaceName)}</b><br>${fmtDate(r.date)} · ${esc(r.start)}–${esc(r.end)}<br>${esc(r.purpose)} · ${r.people} pessoa(s)</div>
          <a class="btn block" href="#/espacos/solicitacoes">Acompanhar solicitações</a>
          <button class="btn secondary block" type="button" data-more>Ficar nesta tela</button>
        </div>`,
        (sheet) => sheet.querySelector('[data-more]').addEventListener('click', closeSheet)
      );
      space = await api.get(`/spaces/${params.id}${qs({ date })}`);
      sel = null;
      draw();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  draw();
}
