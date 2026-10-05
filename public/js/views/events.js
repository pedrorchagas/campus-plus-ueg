// T03 — Lista de eventos e oportunidades
// Testa: filtrar e encontrar algo do interesse (tarefa 2) e encontrar editais abertos (tarefa 8).
import { api, qs } from '../api.js';
import { esc, fmtDate, typeTag, searchIcon, debounce, $$ } from '../ui.js';

const TYPES = ['Evento', 'Palestra', 'Curso', 'Oportunidade', 'Edital'];

export default async function render(el, { query, state }) {
  const f = { type: query.tipo || '', q: '', interest: '', mine: query.meus === '1' };

  el.innerHTML = `
    <div class="page-head"><div><h1>${f.type === 'Edital' ? 'Editais' : 'Eventos e oportunidades'}</h1>
      <p>${state.profile.role === 'estudante' ? 'Mostrando o que é aberto ao seu curso e período.' : 'Tudo o que está publicado no Campus+.'}</p></div></div>
    <div class="search"><span>${searchIcon}</span><input class="input" type="search" id="ev-q" placeholder="Buscar por nome, tema ou organizador" aria-label="Buscar eventos"></div>
    <div class="chips scroll" style="margin-top:12px" role="group" aria-label="Tipo">
      <button type="button" class="chip" data-type="" aria-pressed="${!f.type}">Todos</button>
      ${TYPES.map((t) => `<button type="button" class="chip" data-type="${t}" aria-pressed="${f.type === t}">${t === 'Edital' ? 'Editais' : t + 's'}</button>`).join('')}
    </div>
    <div class="row" style="margin-top:10px">
      <select class="input" id="ev-int" aria-label="Filtrar por interesse" style="flex:1;min-width:0">
        <option value="">Todos os temas</option>
        ${state.meta.interests.map((i) => `<option>${esc(i)}</option>`).join('')}
      </select>
      ${state.profile.role === 'estudante' ? `<button type="button" class="chip" id="ev-mine" aria-pressed="${f.mine}">Minhas inscrições</button>` : ''}
    </div>
    <div class="stack" id="ev-list" style="margin-top:14px"></div>`;

  const list = el.querySelector('#ev-list');

  async function load() {
    const items = await api.get(`/events${qs({ type: f.type, q: f.q, interest: f.interest, mine: f.mine ? '1' : '' })}`);
    list.innerHTML = items.length
      ? items.map(card).join('')
      : `<div class="empty">Nada encontrado com esses filtros.<br><button class="link" type="button" data-clear>Limpar filtros</button></div>`;
    list.querySelector('[data-clear]')?.addEventListener('click', () => {
      Object.assign(f, { type: '', q: '', interest: '', mine: false });
      el.querySelector('#ev-q').value = '';
      el.querySelector('#ev-int').value = '';
      syncChips();
      load();
    });
  }

  function card(e) {
    const deadline = e.type === 'Edital' || e.type === 'Oportunidade';
    const seats = e.seats ? (e.full ? '<span class="tag danger">Esgotado</span>' : `<span class="meta">${e.seats - e.enrolled} vagas</span>`) : '';
    return `<a class="card" href="#/eventos/${e.id}">
      <div class="row">${typeTag(e.type)}${e.enrolledByMe ? '<span class="tag ok">✓ Inscrita(o)</span>' : ''}<span class="spacer"></span>${seats}</div>
      <div class="card-title" style="margin-top:6px">${esc(e.title)}</div>
      <div class="meta-list"><span>📅 ${deadline ? 'Inscrições até ' : ''}${fmtDate(e.date)}${deadline ? '' : ' · ' + esc(e.time)}</span><span>📍 ${esc(e.place)}</span></div>
      <div class="meta" style="margin-top:4px">${esc(e.organizer)}</div>
      ${e.reason ? `<div class="reason">💡 ${esc(e.reason)}</div>` : ''}
    </a>`;
  }

  function syncChips() {
    $$('[data-type]', el).forEach((c) => c.setAttribute('aria-pressed', c.dataset.type === f.type));
    el.querySelector('#ev-mine')?.setAttribute('aria-pressed', f.mine);
  }

  $$('[data-type]', el).forEach((c) =>
    c.addEventListener('click', () => {
      f.type = c.dataset.type;
      syncChips();
      load();
    })
  );
  el.querySelector('#ev-q').addEventListener('input', debounce((e) => ((f.q = e.target.value), load())));
  el.querySelector('#ev-int').addEventListener('change', (e) => ((f.interest = e.target.value), load()));
  el.querySelector('#ev-mine')?.addEventListener('click', () => ((f.mine = !f.mine), syncChips(), load()));

  await load();
}
