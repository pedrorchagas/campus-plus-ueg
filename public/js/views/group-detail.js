// T07 — Página do grupo (membros, convites pendentes, convidar mais)
import { api, qs } from '../api.js';
import { esc, toast, openSheet, closeSheet, $$ } from '../ui.js';
import { personCard } from './people.js';

const GVIS = { publico: 'Aberto a todos', curso: 'Somente do curso', convite: 'Somente convidados' };

export default async function render(el, { params }) {
  let g = await api.get(`/groups/${params.id}`);

  function draw() {
    const owner = g.owner === 'me';
    const canSeeMembers = g.isMember || g.visibility !== 'convite';
    el.innerHTML = `
      <a class="back" href="#/pessoas?aba=grupos">← Grupos</a>
      <div class="row"><span class="tag accent">${esc(g.interest)}</span><span class="tag">${GVIS[g.visibility]}</span></div>
      <h1 style="margin-top:8px">${esc(g.name)}</h1>
      <p style="margin-top:6px">${esc(g.description) || '<span class="muted">Sem descrição.</span>'}</p>
      <div class="card" style="margin-top:12px"><div class="stack small">
        <div>📍 <b>Encontros:</b> ${esc(g.meeting)}</div>
        <div>👥 <b>Participantes:</b> ${g.memberCount} de ${g.max}</div>
      </div></div>
      <div class="row" style="margin-top:12px">
        ${owner ? '<button class="btn" type="button" data-invite>Convidar colegas</button>' : g.isMember ? '<button class="btn secondary" type="button" data-join>Sair do grupo</button>' : g.requested ? '<span class="tag warn">Pedido de entrada enviado</span>' : `<button class="btn" type="button" data-join>${g.visibility === 'publico' ? 'Participar' : 'Pedir para entrar'}</button>`}
        ${g.isMember ? '<button class="btn secondary" type="button" data-chat>Conversa do grupo</button>' : ''}
      </div>
      <section class="section"><h2>Participantes</h2>
        <div class="stack" style="margin-top:10px">
          ${g.isMember ? `<div class="card person"><span class="avatar">EU</span><div class="info"><div class="name">Você</div><div class="meta">${owner ? 'Responsável pelo grupo' : 'Participante'}</div></div></div>` : ''}
          ${canSeeMembers ? g.memberPeople.map((p) => personCard(p, { actions: false })).join('') : '<div class="empty">Os participantes só são visíveis para membros.</div>'}
        </div>
      </section>
      ${g.invitedPeople.length ? `<section class="section"><h2>Convites pendentes</h2><div class="stack" style="margin-top:10px">${g.invitedPeople.map((p) => `<div class="card person"><span class="avatar">${esc(p.avatar)}</span><div class="info"><div class="name">${esc(p.name)}</div><div class="meta">Aguardando resposta</div></div><span class="tag warn">Pendente</span></div>`).join('')}</div></section>` : ''}`;

    el.querySelector('[data-join]')?.addEventListener('click', async () => {
      try {
        g = await api.post(`/groups/${g.id}/join`);
        toast(g.isMember ? 'Você entrou no grupo!' : g.requested ? 'Pedido enviado' : 'Você saiu do grupo');
        draw();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
    el.querySelector('[data-chat]')?.addEventListener('click', () => toast('Chat não faz parte deste protótipo — seria útil?'));
    el.querySelector('[data-invite]')?.addEventListener('click', openInvite);
  }

  async function openInvite() {
    const people = (await api.get(`/people${qs({ interest: g.interest })}`)).filter((p) => !g.members.includes(p.id) && !g.invites.includes(p.id));
    const chosen = new Set();
    openSheet(
      'Convidar colegas',
      `<p class="meta" style="margin-bottom:10px">Pessoas interessadas em ${esc(g.interest)}</p>
       <div class="stack">${people.length ? people.map((p) => `<label class="option"><input type="checkbox" value="${p.id}"><div><b>${esc(p.name)}</b><div class="meta">${p.restricted ? 'Perfil restrito' : `${esc(p.course)} · ${p.period}º`}</div></div></label>`).join('') : '<div class="empty">Todos já foram convidados.</div>'}</div>
       <div class="field" style="margin-top:12px"><label for="inv-link">Ou compartilhe um link de convite</label><input class="input" id="inv-link" readonly value="${location.origin}/#/grupos/${g.id}"></div>
       <button class="btn block" type="button" data-send>Enviar convites</button>`,
      (sheet) => {
        $$('input[type=checkbox]', sheet).forEach((c) => c.addEventListener('change', () => (c.checked ? chosen.add(c.value) : chosen.delete(c.value))));
        sheet.querySelector('[data-send]').addEventListener('click', async () => {
          g = await api.post(`/groups/${g.id}/invite`, { people: [...chosen] });
          closeSheet();
          toast(`${chosen.size} convite(s) enviado(s)`);
          draw();
        });
      }
    );
  }

  draw();
}
