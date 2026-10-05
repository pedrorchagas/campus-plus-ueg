// T09 — Dashboard do gestor (F05)
// Testa: descobrir o espaço mais procurado (tarefa 6) e a atividade mais procurada (tarefa 7); quais indicadores faltam (pergunta 18).
import { api, qs } from '../api.js';
import { esc, $$ } from '../ui.js';

const nf = new Intl.NumberFormat('pt-BR');

function hbar(items, unit) {
  const max = Math.max(...items.map((i) => i.value));
  return `<div class="hbar">${items
    .map(
      (it, idx) => `<div class="hbar-row ${idx === 0 ? 'top1' : ''}" tabindex="0" data-tip="${esc(it.label)}: ${nf.format(it.value)} ${unit}">
        <div class="top"><span>${esc(it.label)}</span><span>${nf.format(it.value)}</span></div>
        <div class="hbar-track"><div class="hbar-fill" style="width:${(it.value / max) * 100}%"></div></div>
      </div>`
    )
    .join('')}</div>`;
}

function columns(items, unit) {
  const max = Math.max(...items.map((i) => i.value));
  return `<div class="cols">${items
    .map(
      (it) => `<div class="col" tabindex="0" data-tip="${esc(it.label)}: ${nf.format(it.value)} ${unit}">
        <span class="v">${nf.format(it.value)}</span><div class="bar" style="height:${(it.value / max) * 100}%"></div></div>`
    )
    .join('')}</div><div class="col-labels">${items.map((it) => `<span>${esc(it.label)}</span>`).join('')}</div>`;
}

function table(items, col) {
  return `<div class="table-wrap"><table class="data"><thead><tr><th>${col}</th><th class="num">Total</th></tr></thead><tbody>
    ${items.map((it) => `<tr><td>${esc(it.label)}</td><td class="num">${nf.format(it.value)}</td></tr>`).join('')}</tbody></table></div>`;
}

export default async function render(el, { state }) {
  const f = { month: 'atual', course: '' };
  let asTable = false;
  const tip = document.createElement('div');
  tip.className = 'tip';
  tip.hidden = true;
  document.body.appendChild(tip);

  async function draw() {
    const d = await api.get(`/dashboard${qs(f)}`);
    const chart = (title, sub, items, unit, col, kind = 'h') => `
      <div class="card chart-card">
        <h3>${title}</h3><div class="sub">${sub}</div>
        ${asTable ? table(items, col) : kind === 'h' ? hbar(items, unit) : columns(items, unit)}
      </div>`;

    el.innerHTML = `
      <div class="page-head"><div><h1>Painel de indicadores</h1><p>Uso dos serviços e espaços do Campus+.</p></div>
        <button class="btn sm secondary" type="button" data-table aria-pressed="${asTable}">${asTable ? 'Ver gráficos' : 'Ver tabelas'}</button></div>
      <div class="row" style="margin-bottom:14px">
        <select class="input" id="d-month" aria-label="Período" style="flex:1;min-width:140px">
          <option value="atual" ${f.month === 'atual' ? 'selected' : ''}>Este mês</option>
          <option value="anterior" ${f.month === 'anterior' ? 'selected' : ''}>Mês anterior</option>
          <option value="trimestre" ${f.month === 'trimestre' ? 'selected' : ''}>Últimos 3 meses</option>
        </select>
        <select class="input" id="d-course" aria-label="Curso" style="flex:1;min-width:160px">
          <option value="">Todos os cursos</option>
          ${state.meta.courses.map((c) => `<option ${f.course === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
        </select>
      </div>

      <div class="kpis">${d.kpis
        .map((k) => `<div class="card kpi"><div class="lbl">${esc(k.label)}</div><div class="val">${typeof k.value === 'number' ? nf.format(k.value) : esc(k.value)}</div><div class="delta">${esc(k.delta)} vs. período anterior</div></div>`)
        .join('')}</div>

      <div class="grid-2" style="margin-top:14px">
        ${chart('Espaços mais procurados', 'Solicitações de uso no período', d.spaces, 'solicitações', 'Espaço')}
        ${chart('Atividades mais procuradas', 'Inscrições por evento/curso', d.activities, 'inscrições', 'Atividade')}
        ${chart('Serviços mais acessados', 'Acessos por funcionalidade', d.services, 'acessos', 'Serviço')}
        ${chart('Acessos por semana', 'Usuários únicos por semana', d.weeks, 'usuários', 'Semana', 'v')}
      </div>

      <div class="alert info" style="margin-top:14px"><span class="ico">?</span><div>${esc(d.note)} <span class="muted">(ex.: horários de pico, taxa de não comparecimento, avaliação dos eventos, demanda reprimida)</span></div></div>`;

    el.querySelector('#d-month').addEventListener('change', (e) => ((f.month = e.target.value), draw()));
    el.querySelector('#d-course').addEventListener('change', (e) => ((f.course = e.target.value), draw()));
    el.querySelector('[data-table]').addEventListener('click', () => ((asTable = !asTable), draw()));

    // Tooltip ao passar o mouse / focar uma barra
    $$('[data-tip]', el).forEach((n) => {
      const show = (x, y) => {
        tip.textContent = n.dataset.tip;
        tip.hidden = false;
        tip.style.left = `${Math.min(x + 12, innerWidth - tip.offsetWidth - 8)}px`;
        tip.style.top = `${y - 36}px`;
      };
      n.addEventListener('mousemove', (e) => show(e.clientX, e.clientY));
      n.addEventListener('focus', () => {
        const r = n.getBoundingClientRect();
        show(r.left, r.top);
      });
      n.addEventListener('mouseleave', () => (tip.hidden = true));
      n.addEventListener('blur', () => (tip.hidden = true));
    });
  }

  await draw();
  return () => tip.remove();
}
