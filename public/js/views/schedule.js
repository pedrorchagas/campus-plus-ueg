// T04 — Agenda de aulas (F04)
// Testa: descobrir a sala da próxima aula e perceber uma mudança (tarefa 1); como ser avisado (pergunta 16).
import { api } from '../api.js';
import { esc, fmtDate, openSheet, toast, $$ } from '../ui.js';
import { changeAlert, roomOf } from './home.js';

export default async function render(el, { state }) {
  const data = await api.get('/schedule');
  let selected = data.days.find((d) => d.isToday)?.date || data.days[0].date;

  function draw() {
    const day = data.days.find((d) => d.date === selected);
    const changes = data.days.reduce((n, d) => n + d.classes.filter((c) => c.change).length, 0);
    el.innerHTML = `
      <div class="page-head"><div><h1>Agenda de aulas</h1><p>${state.profile.course} · ${state.profile.period}º período</p></div>
        <button class="btn sm secondary" type="button" data-notify>🔔 Avisos</button></div>
      ${changes ? `<div class="alert warn" style="margin-bottom:12px"><span class="ico">!</span><div><b>${changes} alteração(ões)</b> nesta semana. Os dias marcados com ● têm mudanças.</div></div>` : ''}
      <div class="day-tabs" role="tablist" aria-label="Dias da semana">
        ${data.days
          .map((d) => {
            const dt = new Date(`${d.date}T12:00:00`);
            return `<button class="day-tab" role="tab" type="button" data-day="${d.date}" aria-selected="${d.date === selected}">
              <small>${d.isToday ? 'Hoje' : esc(d.weekday.slice(0, 3))}</small><b>${dt.getDate()}</b>
              ${d.classes.some((c) => c.change) ? '<span class="dot" aria-label="tem mudanças"></span>' : '<span style="height:6px"></span>'}
            </button>`;
          })
          .join('')}
      </div>
      <h2 style="margin-bottom:10px">${esc(day.weekday)}, ${fmtDate(day.date, { weekday: false })}</h2>
      <div class="stack">
        ${day.classes.length
          ? day.classes
              .map((c) => {
                const cls = c.change?.type === 'cancelada' ? 'cancelled' : c.change?.type === 'sala' ? 'changed' : c.change?.type === 'remoto' || c.mode === 'remoto' ? 'remote' : '';
                return `<button type="button" class="card class-card ${cls}" data-class="${c.id}" style="text-align:left;width:100%;cursor:pointer">
                  <div class="row"><b>${esc(c.start)} – ${esc(c.end)}</b><span class="spacer"></span>
                    ${c.mode === 'remoto' || c.change?.type === 'remoto' ? '<span class="tag accent">Remota</span>' : '<span class="tag">Presencial</span>'}</div>
                  <div class="card-title" style="margin-top:4px;${c.change?.type === 'cancelada' ? 'text-decoration:line-through;color:var(--muted)' : ''}">${esc(c.subject)}</div>
                  <div class="meta-list"><span>📍 ${roomOf(c)}</span><span>👤 ${esc(c.teacher)}</span></div>
                  ${c.change ? `<div style="margin-top:8px">${changeAlert(c)}</div>` : ''}
                </button>`;
              })
              .join('')
          : '<div class="empty">Sem aulas neste dia.</div>'}
      </div>
      <p class="muted small" style="margin-top:16px">Falta algo na agenda? (ex.: prazos de atividades, link do material, provas)</p>`;

    $$('[data-day]', el).forEach((b) => b.addEventListener('click', () => ((selected = b.dataset.day), draw())));
    $$('[data-class]', el).forEach((b) => b.addEventListener('click', () => openClass(day.classes.find((c) => c.id === b.dataset.class))));
    el.querySelector('[data-notify]').addEventListener('click', openNotify);
  }

  function openClass(c) {
    const remote = c.mode === 'remoto' || c.change?.type === 'remoto';
    const link = c.change?.link || c.link;
    openSheet(
      c.subject,
      `<div class="stack">
        ${changeAlert(c)}
        <div class="card stack small">
          <div>🕒 <b>Horário:</b> ${esc(c.start)} – ${esc(c.end)}</div>
          <div>📍 <b>Local:</b> ${roomOf(c)}</div>
          <div>👤 <b>Professor(a):</b> ${esc(c.teacher)}</div>
          <div>🎓 <b>Formato:</b> ${remote ? 'Remoto' : 'Presencial'}</div>
        </div>
        ${remote && link ? `<a class="btn block" href="${esc(link)}" target="_blank" rel="noopener">Entrar na aula on-line</a>` : `<a class="btn block secondary" href="#/espacos">Ver no mapa do campus</a>`}
        <div class="card"><b>Próximas entregas</b><p class="muted small" style="margin-top:4px">Lista de trabalho 3 — prazo sexta-feira (exemplo). <i>Essa informação deveria aparecer aqui?</i></p></div>
      </div>`
    );
  }

  function openNotify() {
    const n = state.profile.notifications;
    openSheet(
      'Avisos de mudança de aula',
      `<p class="muted" style="margin-bottom:12px">Como você quer saber de mudança de sala, cancelamento ou aula remota?</p>
      <form id="nf">
        ${[['push', 'Notificação no celular'], ['email', 'E-mail institucional'], ['whatsapp', 'WhatsApp'], ['resumo', 'Resumo diário às 6h']]
          .map(([v, l]) => `<label class="option"><input type="checkbox" name="ch" value="${v}" ${n.channels.includes(v) ? 'checked' : ''}><div>${l}</div></label>`)
          .join('')}
        <div class="field" style="margin-top:14px"><label for="adv">Com quanta antecedência?</label>
          <select class="input" id="adv"><option>Assim que houver mudança</option><option>1 hora antes da aula</option><option>Na noite anterior</option></select></div>
        <button class="btn block" type="submit">Salvar preferências</button>
      </form>`,
      (sheet) =>
        sheet.querySelector('#nf').addEventListener('submit', async (e) => {
          e.preventDefault();
          const channels = $$('input[name=ch]:checked', sheet).map((i) => i.value);
          const types = n.types.includes('mudanca_aula') ? n.types : [...n.types, 'mudanca_aula'];
          state.profile = await api.put('/me', { notifications: { ...n, channels, types } });
          sheet.querySelector('[data-close]').click();
          toast('Preferências salvas');
        })
    );
  }

  draw();
}
