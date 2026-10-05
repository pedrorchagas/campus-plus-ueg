// T06 — Busca de pessoas e grupos (F02)
// Testa: encontrar estudantes interessados em IA (tarefa 4), níveis de exposição do perfil e segurança (perguntas 10–12).
import { api, qs } from '../api.js';
import { esc, searchIcon, debounce, toast, openSheet, closeSheet, $$ } from '../ui.js';

const VIS_LABEL = { todos: 'toda a comunidade', curso: 'estudantes do seu curso', convite: 'somente convidados' };
const GVIS = { publico: ['Aberto', 'ok'], curso: ['Só do curso', 'accent'], convite: ['Só convidados', 'warn'] };

export function personCard(p, { actions = true } = {}) {
  return `<div class="card person">
    <span class="avatar ${p.restricted ? 'muted' : ''}">${p.restricted ? '🔒' : esc(p.avatar)}</span>
    <div class="info">
      <div class="name">${esc(p.name)}</div>
      ${p.restricted
        ? '<div class="meta">Perfil restrito — visível após aceitar seu convite</div>'
        : `<div class="meta">${esc(p.course)} · ${p.period}º período</div>${p.bio ? `<div class="small" style="margin-top:2px">${esc(p.bio)}</div>` : ''}`}
      <div class="chips" style="margin-top:6px;gap:4px">${p.interests.map((i) => `<span class="tag ${p.common.includes(i) ? 'accent' : ''}">${esc(i)}</span>`).join('')}</div>
    </div>
    ${actions
      ? `<div style="display:grid;gap:6px;justify-items:end">
          ${p.invited ? '<span class="tag ok">Convite enviado</span>' : `<button class="btn sm" type="button" data-invite="${p.id}">Convidar</button>`}
          <button class="link small" type="button" data-report="${p.id}" style="color:var(--muted)">Denunciar</button>
        </div>`
      : ''}
  </div>`;
}

export function groupCard(g) {
  const [vl, vc] = GVIS[g.visibility];
  let btn;
  if (g.isMember) btn = '<span class="tag ok">✓ Você participa</span>';
  else if (g.requested) btn = '<span class="tag warn">Pedido enviado</span>';
  else if (g.memberCount >= g.max) btn = '<span class="tag">Lotado</span>';
  else btn = `<button class="btn sm" type="button" data-join="${g.id}">${g.visibility === 'publico' ? 'Participar' : 'Pedir para entrar'}</button>`;
  return `<div class="card">
    <div class="row"><span class="tag accent">${esc(g.interest)}</span><span class="tag ${vc}">${vl}</span><span class="spacer"></span><span class="meta">👥 ${g.memberCount}/${g.max}</span></div>
    <a href="#/grupos/${g.id}" style="color:inherit;text-decoration:none"><div class="card-title" style="margin-top:6px">${esc(g.name)}</div>
    <div class="small" style="margin-top:2px">${esc(g.description)}</div></a>
    <div class="row" style="margin-top:10px"><span class="meta">📍 ${esc(g.meeting)}</span><span class="spacer"></span>${btn}</div>
  </div>`;
}

export default async function render(el, { state, query }) {
  const f = { tab: query.aba || 'pessoas', interest: query.interesse || '', q: '' };
  const vis = state.profile.privacy.visibility;

  el.innerHTML = `
    <div class="page-head"><div><h1>Pessoas e grupos</h1><p>Encontre colegas com interesses parecidos.</p></div>
      <a class="btn sm" href="#/grupos/novo${f.interest ? `?interesse=${encodeURIComponent(f.interest)}` : ''}" id="new-group">+ Criar grupo</a></div>
    <div class="alert info" style="margin-bottom:12px"><span class="ico">🔒</span><div>Seu perfil está visível para <b>${VIS_LABEL[vis]}</b>. <a href="#/perfil">Alterar</a></div></div>
    <div class="tabs" role="tablist">
      <button type="button" role="tab" data-tab="pessoas" aria-selected="${f.tab === 'pessoas'}">Pessoas</button>
      <button type="button" role="tab" data-tab="grupos" aria-selected="${f.tab === 'grupos'}">Grupos</button>
    </div>
    <div class="search"><span>${searchIcon}</span><input class="input" type="search" id="pp-q" placeholder="Buscar por nome ou interesse" aria-label="Buscar"></div>
    <div class="chips scroll" style="margin-top:10px" role="group" aria-label="Interesse">
      <button type="button" class="chip" data-int="">Todos</button>
      ${[...state.profile.interests, ...state.meta.interests.filter((i) => !state.profile.interests.includes(i))]
        .map((i) => `<button type="button" class="chip" data-int="${esc(i)}">${esc(i)}</button>`)
        .join('')}
    </div>
    <div class="stack" id="pp-list" style="margin-top:14px"></div>`;

  const list = el.querySelector('#pp-list');

  function sync() {
    $$('[data-tab]', el).forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === f.tab));
    $$('[data-int]', el).forEach((b) => b.setAttribute('aria-pressed', b.dataset.int === f.interest));
    el.querySelector('#new-group').href = `#/grupos/novo${f.interest ? `?interesse=${encodeURIComponent(f.interest)}` : ''}`;
  }

  async function load() {
    const params = qs({ interest: f.interest, q: f.q });
    if (f.tab === 'pessoas') {
      const people = await api.get(`/people${params}`);
      list.innerHTML = people.length ? people.map((p) => personCard(p)).join('') : '<div class="empty">Ninguém encontrado com esse filtro.</div>';
    } else {
      const groups = await api.get(`/groups${params}`);
      list.innerHTML = groups.length
        ? groups.map(groupCard).join('')
        : `<div class="empty">Nenhum grupo sobre esse tema ainda.<br><a href="#/grupos/novo?interesse=${encodeURIComponent(f.interest)}">Criar o primeiro</a></div>`;
    }
  }

  list.addEventListener('click', async (e) => {
    const inv = e.target.closest('[data-invite]');
    const rep = e.target.closest('[data-report]');
    const join = e.target.closest('[data-join]');
    if (inv) {
      await api.post(`/people/${inv.dataset.invite}/invite`);
      toast('Convite enviado. A pessoa precisa aceitar para vocês se conectarem.');
      load();
    }
    if (join) {
      try {
        const g = await api.post(`/groups/${join.dataset.join}/join`);
        toast(g.isMember ? 'Você entrou no grupo!' : 'Pedido enviado ao responsável do grupo');
        load();
      } catch (err) {
        toast(err.message, 'error');
      }
    }
    if (rep) {
      openSheet(
        'Denunciar ou bloquear',
        `<form id="rep" class="stack">
          ${['Mensagens indesejadas / spam', 'Assédio ou comportamento ofensivo', 'Perfil falso', 'Outro motivo'].map((m, i) => `<label class="option"><input type="radio" name="m" value="${m}" ${i === 0 ? 'checked' : ''}><div>${m}</div></label>`).join('')}
          <label class="option"><input type="checkbox" name="block" checked><div>Bloquear também esta pessoa</div></label>
          <button class="btn danger block" type="submit">Enviar denúncia</button>
          <p class="muted small">A denúncia é anônima e analisada pela equipe de moderação (simulado).</p>
        </form>`,
        (sheet) =>
          sheet.querySelector('#rep').addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const r = await api.post(`/people/${rep.dataset.report}/report`);
            closeSheet();
            toast(r.message);
          })
      );
    }
  });

  $$('[data-tab]', el).forEach((b) => b.addEventListener('click', () => ((f.tab = b.dataset.tab), sync(), load())));
  $$('[data-int]', el).forEach((b) => b.addEventListener('click', () => ((f.interest = b.dataset.int), sync(), load())));
  el.querySelector('#pp-q').addEventListener('input', debounce((e) => ((f.q = e.target.value), load())));

  sync();
  await load();
}
