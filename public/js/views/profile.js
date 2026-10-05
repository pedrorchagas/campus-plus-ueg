// Perfil, interesses, privacidade e notificações (complementa T01)
import { api } from '../api.js';
import { esc, toast, initials, $$ } from '../ui.js';

export default async function render(el, { state, query }) {
  const p = structuredClone(state.profile);
  const sw = (name, label, checked) =>
    `<div class="switch-row"><b class="small">${label}</b><label class="switch"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''} aria-label="${esc(label)}"><span></span></label></div>`;

  el.innerHTML = `
    <div class="card person" style="margin-bottom:14px">
      <span class="avatar lg">${initials(p.name)}</span>
      <div class="info"><h1>${esc(p.name)}</h1>
        <div class="meta">${esc(state.meta.roles[p.role])}${p.role === 'estudante' ? ` · ${esc(p.course)} · ${p.period}º período` : ''}</div>
        <div class="meta">${esc(p.email)}</div></div>
    </div>
    <form id="pf" class="split">
      <div>
        <section class="card"><h2>Interesses</h2><p class="meta" style="margin:2px 0 10px">Usados para recomendar eventos, grupos e oportunidades.</p>
          <div class="chips">${state.meta.interests.map((i) => `<button type="button" class="chip" data-interest="${esc(i)}" aria-pressed="${p.interests.includes(i)}">${esc(i)}</button>`).join('')}</div></section>
        <section class="card"><h2>Privacidade</h2>
          <div class="field" style="margin-top:10px"><label for="vis">Quem pode ver meu perfil</label>
            <select class="input" id="vis" name="visibility">
              ${[['todos', 'Toda a comunidade acadêmica'], ['curso', 'Somente meu curso'], ['convite', 'Somente quem eu aceitar']].map(([v, l]) => `<option value="${v}" ${p.privacy.visibility === v ? 'selected' : ''}>${l}</option>`).join('')}
            </select></div>
          ${sw('shareSchedule', 'Usar meus horários nas sugestões', p.privacy.shareSchedule)}
          ${sw('shareLocation', 'Usar minha localização no campus', p.privacy.shareLocation)}
          ${sw('showInterests', 'Mostrar meus interesses a colegas', p.privacy.showInterests)}
          <button type="button" class="link small" data-export style="margin-top:8px">Baixar meus dados (LGPD)</button>
        </section>
      </div>
      <div>
        <section class="card" id="notificacoes"><h2>Notificações</h2>
          ${sw('n_mudanca_aula', 'Mudanças de aula', p.notifications.types.includes('mudanca_aula'))}
          ${sw('n_reserva', 'Minhas solicitações de espaço', p.notifications.types.includes('reserva'))}
          ${sw('n_eventos_interesse', 'Eventos dos meus interesses', p.notifications.types.includes('eventos_interesse'))}
          ${sw('n_editais', 'Editais e oportunidades', p.notifications.types.includes('editais'))}
          ${sw('n_avisos', 'Avisos gerais', p.notifications.types.includes('avisos'))}
          ${sw('n_grupos', 'Grupos e convites', p.notifications.types.includes('grupos'))}
          ${sw('quietHours', 'Não incomodar das 22h às 7h', p.notifications.quietHours)}
        </section>
        <button class="btn block" type="submit" style="margin-top:14px">Salvar alterações</button>
        <button class="btn secondary block" type="button" data-redo style="margin-top:8px">Refazer boas-vindas (T01)</button>
      </div>
    </form>`;

  $$('[data-interest]', el).forEach((c) => c.addEventListener('click', () => c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') !== 'true')));
  el.querySelector('[data-export]').addEventListener('click', () => toast('Exportação de dados pessoais — requisito a validar'));
  el.querySelector('[data-redo]').addEventListener('click', async () => {
    state.profile = await api.put('/me', { onboarded: false });
    location.hash = '#/boas-vindas';
  });
  el.querySelector('#pf').addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = (n) => el.querySelector(`input[name=${n}]`).checked;
    const types = ['mudanca_aula', 'reserva', 'eventos_interesse', 'editais', 'avisos', 'grupos'].filter((t) => q(`n_${t}`));
    state.profile = await api.put('/me', {
      interests: $$('[data-interest][aria-pressed=true]', el).map((b) => b.dataset.interest),
      privacy: { visibility: el.querySelector('#vis').value, shareSchedule: q('shareSchedule'), shareLocation: q('shareLocation'), showInterests: q('showInterests') },
      notifications: { ...p.notifications, types, quietHours: q('quietHours') },
    });
    toast('Perfil atualizado');
  });
  if (query.secao === 'notificacoes') el.querySelector('#notificacoes').scrollIntoView();
}
