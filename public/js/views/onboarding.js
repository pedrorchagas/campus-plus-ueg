// T01 — Onboarding e escolha de interesses
// Testa: que dados o usuário aceita informar e compartilhar (pergunta-guia 2) e preferências de notificação (8).
import { api } from '../api.js';
import { esc, toast, $$ } from '../ui.js';

const NOTIF_TYPES = [
  ['mudanca_aula', 'Mudança de sala, cancelamento ou aula remota'],
  ['reserva', 'Andamento das minhas solicitações de espaço'],
  ['eventos_interesse', 'Eventos dos meus interesses'],
  ['editais', 'Editais e oportunidades (bolsas, estágios)'],
  ['avisos', 'Avisos gerais da universidade'],
  ['grupos', 'Convites e mensagens de grupos'],
];

const HOME_BY_ROLE = { gestor: '#/painel' };

export default async function render(el, { state }) {
  const p = structuredClone(state.profile);
  const { courses, interests, roles } = state.meta;
  let step = 0;

  const steps = [
    // 0 — boas-vindas
    () => `
      <div class="hero">
        <span class="logo">C+</span>
        <h1>Boas-vindas ao Campus+</h1>
        <p>Aulas, eventos, espaços e oportunidades da universidade em um só lugar — do jeito que faz sentido para você.</p>
      </div>
      <div class="benefits"><ul>
        <li class="card">📅 <div><b>Sua agenda do dia</b><div class="meta">Sala, horário e avisos de mudança.</div></div></li>
        <li class="card">✨ <div><b>Sugestões para você</b><div class="meta">Eventos, cursos e editais de acordo com seus interesses.</div></div></li>
        <li class="card">📍 <div><b>Espaços disponíveis</b><div class="meta">Encontre uma sala livre e peça a reserva.</div></div></li>
        <li class="card">👥 <div><b>Pessoas com interesses parecidos</b><div class="meta">Monte ou encontre grupos de estudo.</div></div></li>
      </ul></div>
      <p class="muted small center">Login institucional (SSO) é simulado neste protótipo.</p>`,

    // 1 — perfil
    () => `
      <h1>Quem é você?</h1>
      <p class="muted" style="margin:4px 0 16px">Usamos essas informações para mostrar o que é relevante.</p>
      <div class="field"><span class="label">Perfil</span>
        ${Object.entries(roles).map(([k, v]) => `<label class="option"><input type="radio" name="role" value="${k}" ${p.role === k ? 'checked' : ''}><div><b>${esc(v)}</b></div></label>`).join('')}
      </div>
      <div class="field"><label for="o-name">Como quer ser chamada(o)?</label><input class="input" id="o-name" name="name" value="${esc(p.name)}"></div>
      <div data-student ${p.role !== 'estudante' ? 'hidden' : ''}>
        <div class="form-row">
          <div class="field"><label for="o-course">Curso</label><select class="input" id="o-course" name="course">${courses.map((c) => `<option ${c === p.course ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
          <div class="field"><label for="o-period">Período</label><select class="input" id="o-period" name="period">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<option value="${n}" ${n === p.period ? 'selected' : ''}>${n}º</option>`).join('')}</select></div>
        </div>
        <p class="hint muted small">No sistema real, curso e período viriam do cadastro acadêmico.</p>
      </div>`,

    // 2 — interesses
    () => `
      <h1>O que te interessa?</h1>
      <p class="muted" style="margin:4px 0 16px">Escolha quantos quiser. Você pode mudar depois no perfil.</p>
      <div class="chips" role="group" aria-label="Interesses">
        ${interests.map((i) => `<button type="button" class="chip" data-interest="${esc(i)}" aria-pressed="${p.interests.includes(i)}">${esc(i)}</button>`).join('')}
      </div>
      <p class="muted small" style="margin-top:14px" id="int-count"></p>`,

    // 3 — privacidade
    () => `
      <h1>Seus dados, suas regras</h1>
      <p class="muted" style="margin:4px 0 16px">Quanto mais você compartilha, melhores ficam as sugestões. Tudo é opcional.</p>
      <div class="card">
        ${sw('shareSchedule', 'Usar meus horários de aula', 'Para sugerir eventos que não conflitem com suas aulas.', p.privacy.shareSchedule)}
        ${sw('shareLocation', 'Usar minha localização no campus', 'Para indicar salas livres e eventos próximos de você.', p.privacy.shareLocation)}
        ${sw('showInterests', 'Mostrar meus interesses a outros estudantes', 'Permite que colegas te encontrem para grupos de estudo.', p.privacy.showInterests)}
      </div>
      <div class="field" style="margin-top:16px"><span class="label">Quem pode ver meu perfil?</span>
        ${[
          ['todos', 'Toda a comunidade acadêmica'],
          ['curso', 'Somente estudantes do meu curso'],
          ['convite', 'Somente quem eu convidar ou aceitar'],
        ].map(([v, l]) => `<label class="option"><input type="radio" name="visibility" value="${v}" ${p.privacy.visibility === v ? 'checked' : ''}><div>${l}</div></label>`).join('')}
      </div>`,

    // 4 — notificações
    () => `
      <h1>Como quer ser avisada(o)?</h1>
      <p class="muted" style="margin:4px 0 16px">Escolha o que é útil. O resto não chega até você.</p>
      <div class="field"><span class="label">Canais</span>
        <div class="chips">
          ${[['push', 'Notificação no celular'], ['email', 'E-mail institucional'], ['whatsapp', 'WhatsApp'], ['resumo', 'Resumo diário']].map(([v, l]) => `<button type="button" class="chip" data-channel="${v}" aria-pressed="${p.notifications.channels.includes(v)}">${l}</button>`).join('')}
        </div>
      </div>
      <div class="field"><span class="label">Assuntos</span>
        ${NOTIF_TYPES.map(([v, l]) => `<label class="option"><input type="checkbox" name="ntype" value="${v}" ${p.notifications.types.includes(v) ? 'checked' : ''}><div>${l}</div></label>`).join('')}
      </div>
      <div class="card">${sw('quietHours', 'Não incomodar das 22h às 7h', 'Exceto mudanças de aula do dia seguinte.', p.notifications.quietHours)}</div>`,
  ];

  function sw(name, label, hint, checked) {
    return `<div class="switch-row"><div><b>${label}</b><div class="meta">${hint}</div></div>
      <label class="switch"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''} aria-label="${esc(label)}"><span></span></label></div>`;
  }

  function collect() {
    const f = (sel) => el.querySelector(sel);
    if (step === 1) {
      p.role = f('input[name=role]:checked')?.value || p.role;
      p.name = f('#o-name').value.trim() || p.name;
      p.course = f('#o-course').value;
      p.period = Number(f('#o-period').value);
    }
    if (step === 2) p.interests = $$('[data-interest][aria-pressed=true]', el).map((b) => b.dataset.interest);
    if (step === 3) {
      p.privacy = {
        visibility: f('input[name=visibility]:checked').value,
        shareSchedule: f('input[name=shareSchedule]').checked,
        shareLocation: f('input[name=shareLocation]').checked,
        showInterests: f('input[name=showInterests]').checked,
      };
    }
    if (step === 4) {
      p.notifications = {
        channels: $$('[data-channel][aria-pressed=true]', el).map((b) => b.dataset.channel),
        types: $$('input[name=ntype]:checked', el).map((i) => i.value),
        quietHours: f('input[name=quietHours]').checked,
      };
    }
  }

  function draw() {
    const last = step === steps.length - 1;
    el.innerHTML = `
      <div class="onb">
        <div class="progress" aria-label="Etapa ${step + 1} de ${steps.length}">${steps.map((_, i) => `<span class="${i <= step ? 'on' : ''}"></span>`).join('')}</div>
        <div class="body">${steps[step]()}</div>
        <div class="actions">
          ${step > 0 ? '<button class="btn secondary" type="button" data-prev>Voltar</button>' : ''}
          ${step === 0 ? '<button class="btn" type="button" data-next>Entrar com conta institucional</button>' : `<button class="btn" type="button" data-next>${last ? 'Concluir' : 'Continuar'}</button>`}
        </div>
        ${step >= 2 ? '<p class="center small" style="margin-top:10px"><button type="button" class="link" data-skip>Pular esta etapa</button></p>' : ''}
      </div>`;

    el.querySelector('[data-next]').addEventListener('click', next);
    el.querySelector('[data-prev]')?.addEventListener('click', () => {
      collect();
      step -= 1;
      draw();
    });
    el.querySelector('[data-skip]')?.addEventListener('click', () => {
      step === steps.length - 1 ? finish() : ((step += 1), draw());
    });
    $$('.chip', el).forEach((c) =>
      c.addEventListener('click', () => {
        c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') !== 'true');
        updateCount();
      })
    );
    $$('input[name=role]', el).forEach((r) =>
      r.addEventListener('change', () => (el.querySelector('[data-student]').hidden = r.value !== 'estudante'))
    );
    updateCount();
  }

  function updateCount() {
    const c = el.querySelector('#int-count');
    if (!c) return;
    const n = $$('[data-interest][aria-pressed=true]', el).length;
    c.textContent = n ? `${n} interesse(s) selecionado(s).` : 'Nenhum interesse selecionado — as sugestões serão genéricas.';
  }

  async function next() {
    collect();
    if (step < steps.length - 1) {
      step += 1;
      draw();
      return;
    }
    finish();
  }

  async function finish() {
    collect();
    state.profile = await api.put('/me', { ...p, onboarded: true });
    toast('Perfil configurado!');
    location.hash = HOME_BY_ROLE[p.role] || '#/inicio';
  }

  draw();
}
