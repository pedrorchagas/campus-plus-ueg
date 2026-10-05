// T05 — Mapa/lista de espaços (F03)
// Testa: encontrar uma sala livre para estudar em grupo amanhã à tarde (tarefa 3) e que informações são indispensáveis (pergunta 13).
import { api, qs } from '../api.js';
import { esc, $$ } from '../ui.js';

const TYPES = ['Sala de estudos', 'Laboratório', 'Sala de aula', 'Auditório'];
const PERIODS = [['', 'Dia todo'], ['manha', 'Manhã'], ['tarde', 'Tarde'], ['noite', 'Noite']];

// Ilustração esquemática do campus (blocos fictícios)
const CAMPUS_SVG = `
<svg viewBox="0 0 100 75" preserveAspectRatio="none" aria-hidden="true">
  <rect x="0" y="0" width="100" height="75" fill="#e7eee3"/>
  <path d="M0 45 H100 M48 0 V75" stroke="#fff" stroke-width="4"/>
  <path d="M0 45 H100 M48 0 V75" stroke="#d9dfd4" stroke-width="0.4" stroke-dasharray="2 2"/>
  <g fill="#cfd8e3" stroke="#aab7c6" stroke-width=".4">
    <rect x="6" y="6" width="26" height="30" rx="1.5"/>
    <rect x="58" y="8" width="30" height="20" rx="1.5"/>
    <rect x="44" y="50" width="22" height="16" rx="1.5" transform="translate(4,-4)"/>
    <rect x="14" y="52" width="28" height="18" rx="1.5"/>
    <rect x="76" y="56" width="18" height="14" rx="1.5"/>
  </g>
  <g font-size="2.6" fill="#5b6878" font-family="system-ui,sans-serif" font-weight="700">
    <text x="8" y="10">BLOCO A</text><text x="60" y="12">BIBLIOTECA</text><text x="50" y="49.5">BLOCO B</text>
    <text x="16" y="56">BLOCO C</text><text x="77" y="59.5">INOVAÇÃO</text>
  </g>
  <circle cx="48" cy="45" r="5" fill="#cfe3c4" stroke="#b5cfa7" stroke-width=".4"/>
  <text x="48" y="46" font-size="2.2" text-anchor="middle" fill="#5b6878" font-family="system-ui,sans-serif">Praça</text>
</svg>`;

export default async function render(el, { state, query }) {
  const { today, tomorrow } = state.meta;
  const f = { date: query.data || today, period: query.periodo || '', type: '', capacity: '', view: 'lista' };
  try {
    f.view = sessionStorage.getItem('campus.spacesView') || 'lista';
  } catch {}
  const mine = state.profile.role === 'estudante' ? await api.get('/reservations') : [];
  const pending = mine.filter((r) => r.status === 'em_analise').length;

  el.innerHTML = `
    <div class="page-head"><div><h1>Espaços</h1><p>Salas, laboratórios e auditórios disponíveis.</p></div>
      <a class="btn sm secondary" href="#/espacos/solicitacoes">Minhas solicitações${pending ? ` (${pending})` : ''}</a></div>
    <div class="tabs" role="tablist">
      <button type="button" role="tab" data-view="lista" aria-selected="${f.view === 'lista'}">Lista</button>
      <button type="button" role="tab" data-view="mapa" aria-selected="${f.view === 'mapa'}">Mapa</button>
    </div>
    <div class="card" style="margin-bottom:14px">
      <div class="field" style="margin-bottom:10px"><span class="label">Quando?</span>
        <div class="chips">
          <button type="button" class="chip" data-date="${today}">Hoje</button>
          <button type="button" class="chip" data-date="${tomorrow}">Amanhã</button>
          <input type="date" class="input" id="sp-date" value="${f.date}" style="width:auto;min-height:36px;padding:4px 10px" aria-label="Escolher data">
        </div>
      </div>
      <div class="chips" role="group" aria-label="Período" style="margin-bottom:10px">
        ${PERIODS.map(([v, l]) => `<button type="button" class="chip" data-period="${v}">${l}</button>`).join('')}
      </div>
      <div class="form-row">
        <select class="input" id="sp-type" aria-label="Tipo de espaço"><option value="">Todos os tipos</option>${TYPES.map((t) => `<option>${t}</option>`).join('')}</select>
        <select class="input" id="sp-cap" aria-label="Capacidade mínima"><option value="">Qualquer capacidade</option><option value="4">4+ pessoas</option><option value="10">10+ pessoas</option><option value="30">30+ pessoas</option><option value="100">100+ pessoas</option></select>
      </div>
    </div>
    <div id="sp-out"></div>`;

  const out = el.querySelector('#sp-out');

  function syncChips() {
    $$('[data-date]', el).forEach((c) => c.setAttribute('aria-pressed', c.dataset.date === f.date));
    $$('[data-period]', el).forEach((c) => c.setAttribute('aria-pressed', c.dataset.period === f.period));
    $$('[data-view]', el).forEach((c) => c.setAttribute('aria-selected', c.dataset.view === f.view));
    el.querySelector('#sp-date').value = f.date;
  }

  const periodLabel = () => PERIODS.find(([v]) => v === f.period)[1].toLowerCase();
  const detailHref = (s) => `#/espacos/${s.id}?data=${f.date}${f.period ? `&periodo=${f.period}` : ''}`;
  const availText = (s) =>
    s.status === 'livre' ? 'Livre' : s.status === 'ocupado' ? 'Ocupado' : `${s.freeCount} de ${s.totalCount} horários livres`;

  async function load() {
    const { spaces } = await api.get(`/spaces${qs({ date: f.date, period: f.period, type: f.type, capacity: f.capacity })}`);
    spaces.sort((a, b) => b.freeCount - a.freeCount);
    if (!spaces.length) {
      out.innerHTML = '<div class="empty">Nenhum espaço com esses filtros.</div>';
      return;
    }
    if (f.view === 'mapa') {
      out.innerHTML = `
        <div class="map-wrap">${CAMPUS_SVG}
          ${spaces.map((s) => `<a class="pin ${s.status}" href="${detailHref(s)}" style="left:${s.x}%;top:${s.y}%" aria-label="${esc(s.name)}: ${availText(s)}"><span class="dot"></span><span class="lbl">${esc(s.name)}</span></a>`).join('')}
        </div>
        <div class="legend"><span><i style="background:var(--ok)"></i>Livre</span><span><i style="background:#d18a00"></i>Parcialmente livre</span><span><i style="background:var(--danger)"></i>Ocupado</span></div>
        <p class="muted small" style="margin-top:8px">Disponibilidade ${periodLabel()} de ${f.date === today ? 'hoje' : f.date === tomorrow ? 'amanhã' : f.date.split('-').reverse().join('/')}. Toque em um ponto para ver detalhes.</p>`;
    } else {
      out.innerHTML = `<div class="stack">${spaces
        .map(
          (s) => `<a class="card" href="${detailHref(s)}">
            <div class="row"><span class="card-title">${esc(s.name)}</span><span class="tag">${esc(s.type)}</span><span class="spacer"></span><span class="avail ${s.status}">● ${availText(s)}</span></div>
            <div class="meta-list"><span>📍 ${esc(s.block)}</span><span>👥 até ${s.capacity}</span>${s.freeNow != null ? `<span>${s.freeNow ? '🟢 livre agora' : '🔴 ocupado agora'}</span>` : ''}</div>
            <div class="meta" style="margin-top:4px">${s.equipment.map(esc).join(' · ')}</div>
            <div class="meta" style="margin-top:4px">✅ Aprovação: ${esc(s.approval)}</div>
          </a>`
        )
        .join('')}</div>`;
    }
  }

  $$('[data-date]', el).forEach((c) => c.addEventListener('click', () => ((f.date = c.dataset.date), syncChips(), load())));
  $$('[data-period]', el).forEach((c) => c.addEventListener('click', () => ((f.period = c.dataset.period), syncChips(), load())));
  $$('[data-view]', el).forEach((c) =>
    c.addEventListener('click', () => {
      f.view = c.dataset.view;
      try {
        sessionStorage.setItem('campus.spacesView', f.view);
      } catch {}
      syncChips();
      load();
    })
  );
  el.querySelector('#sp-date').addEventListener('change', (e) => e.target.value && ((f.date = e.target.value), syncChips(), load()));
  el.querySelector('#sp-type').addEventListener('change', (e) => ((f.type = e.target.value), load()));
  el.querySelector('#sp-cap').addEventListener('change', (e) => ((f.capacity = e.target.value), load()));

  syncChips();
  await load();
}
