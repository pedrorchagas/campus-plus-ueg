import { api } from './api.js';
import { $, $$, esc, toast, openSheet, closeSheet, initials, loading } from './ui.js';

// ---------- estado global ----------
export const state = {
  profile: null,
  meta: null,
  sessionMode: false,
  currentScreen: '',
};

try {
  state.sessionMode = localStorage.getItem('campus.sessionMode') === '1';
} catch {}

// ---------- ícones ----------
const I = {
  home: 'M12 3 2 12h3v8h6v-6h2v6h6v-8h3L12 3Z',
  calendar: 'M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm-2 8h14v10H5V10Zm2 2v2h2v-2H7Zm4 0v2h2v-2h-2Z',
  star: 'm12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2Z',
  map: 'M15 4 9 2 3 4v18l6-2 6 2 6-2V2l-6 2Zm-6 .2 6 2v13.6l-6-2V4.2Z',
  people: 'M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05A4.2 4.2 0 0 1 17 16.5V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z',
  megaphone: 'M3 10v4a1 1 0 0 0 1 1h2l4 4V5L6 9H4a1 1 0 0 0-1 1Zm13.5 2A4.5 4.5 0 0 0 14 7.97v8.05A4.5 4.5 0 0 0 16.5 12ZM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06A9 9 0 0 0 14 3.23Z',
  chart: 'M3 3v18h18v-2H5V3H3Zm4 10h3v4H7v-4Zm5-6h3v10h-3V7Zm5 3h3v7h-3v-7Z',
  check: 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17Z',
  doc: 'M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6Zm7 1.5L18.5 9H13V3.5ZM8 13h8v2H8v-2Zm0 4h8v2H8v-2Z',
};
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${I[name]}"/></svg>`;

// Navegação principal por perfil (o protótipo adapta o menu ao público testado)
const NAV = {
  estudante: [
    ['#/inicio', 'Início', 'home'],
    ['#/agenda', 'Agenda', 'calendar'],
    ['#/eventos', 'Eventos', 'star'],
    ['#/espacos', 'Espaços', 'map'],
    ['#/pessoas', 'Pessoas', 'people'],
  ],
  professor: [
    ['#/inicio', 'Início', 'home'],
    ['#/publicar', 'Publicar', 'megaphone'],
    ['#/eventos', 'Eventos', 'star'],
    ['#/espacos', 'Espaços', 'map'],
  ],
  servidor: [
    ['#/inicio', 'Início', 'home'],
    ['#/aprovacoes', 'Aprovações', 'check'],
    ['#/eventos?tipo=Edital', 'Editais', 'doc'],
    ['#/espacos', 'Espaços', 'map'],
    ['#/publicar', 'Publicar', 'megaphone'],
  ],
  gestor: [
    ['#/painel', 'Painel', 'chart'],
    ['#/eventos', 'Eventos', 'star'],
    ['#/espacos', 'Espaços', 'map'],
  ],
};

// ---------- rotas ----------
// [padrão, módulo, rótulo da tela (para registro de achados)]
const ROUTES = [
  [/^\/boas-vindas$/, 'onboarding', 'T01 — Onboarding e interesses'],
  [/^\/inicio$/, 'home', 'T02 — Home personalizada'],
  [/^\/eventos$/, 'events', 'T03 — Lista de eventos'],
  [/^\/eventos\/(?<id>[\w-]+)$/, 'event-detail', 'T03 — Detalhe do evento'],
  [/^\/agenda$/, 'schedule', 'T04 — Agenda de aulas'],
  [/^\/espacos$/, 'spaces', 'T05 — Mapa/lista de espaços'],
  [/^\/espacos\/solicitacoes$/, 'reservations', 'T05 — Minhas solicitações'],
  [/^\/espacos\/(?<id>[\w-]+)$/, 'space-detail', 'T05 — Detalhe e solicitação de espaço'],
  [/^\/pessoas$/, 'people', 'T06 — Busca de pessoas e grupos'],
  [/^\/grupos\/novo$/, 'group-new', 'T07 — Criação de grupo e convite'],
  [/^\/grupos\/(?<id>[\w-]+)$/, 'group-detail', 'T07 — Grupo'],
  [/^\/publicar$/, 'publish', 'T08 — Publicação de conteúdo'],
  [/^\/painel$/, 'dashboard', 'T09 — Dashboard do gestor'],
  [/^\/aprovacoes$/, 'approvals', 'Aprovação de espaços (servidor)'],
  [/^\/notificacoes$/, 'notifications', 'Notificações'],
  [/^\/perfil$/, 'profile', 'Perfil e privacidade'],
  [/^\/sessao$/, 'session', 'Modo sessão (facilitador)'],
];

const HOME_BY_ROLE = { estudante: '#/inicio', professor: '#/inicio', servidor: '#/inicio', gestor: '#/painel' };

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  return { path, query: Object.fromEntries(new URLSearchParams(query)) };
}

let cleanup = null;

async function router() {
  const { path, query } = parseHash();

  if (!state.profile.onboarded && path !== '/boas-vindas' && path !== '/sessao') {
    location.replace('#/boas-vindas');
    return;
  }
  if (path === '/' || path === '') {
    location.replace(HOME_BY_ROLE[state.profile.role] || '#/inicio');
    return;
  }

  const match = ROUTES.map(([re, mod, label]) => ({ m: path.match(re), mod, label })).find((r) => r.m);
  const view = $('#view');
  if (typeof cleanup === 'function') cleanup();
  cleanup = null;
  closeSheet();

  if (!match) {
    view.innerHTML = `<div class="empty"><p>Tela não encontrada.</p><p><a href="#/inicio">Voltar ao início</a></p></div>`;
    return;
  }

  state.currentScreen = match.label;
  document.body.dataset.screen = match.mod;
  renderChrome(path);
  loading(view);
  window.scrollTo(0, 0);

  try {
    const mod = await import(`./views/${match.mod}.js`);
    cleanup = await mod.default(view, { params: match.m.groups || {}, query, state, refreshChrome });
  } catch (err) {
    console.error(err);
    view.innerHTML = `<div class="alert danger"><span class="ico">!</span><div>Não foi possível carregar a tela. ${esc(err.message)}</div></div>`;
  }
  view.focus({ preventScroll: true });
}

// ---------- moldura (menus, perfil, sino) ----------
function renderChrome(path = parseHash().path) {
  const p = state.profile;
  const onb = !p.onboarded;
  const items = NAV[p.role] || NAV.estudante;
  const hash = location.hash || "#/";
  // Item ativo: correspondência exata do hash; senão, o prefixo da rota (ex.: /eventos/e1 → Eventos)
  const activeHref =
    items.find(([href]) => hash === href)?.[0] ??
    items.find(([href]) => !href.includes('?') && (path === href.slice(1) || path.startsWith(href.slice(1) + '/')))?.[0] ??
    (path.startsWith('/grupos') ? '#/pessoas' : null);
  const links = items
    .map(([href, label, ic]) => `<a href="${href}" class="${href === activeHref ? 'active' : ''}" ${href === activeHref ? 'aria-current="page"' : ''}>${icon(ic)}<span>${label}</span></a>`)
    .join('');

  $('#bottom-nav').innerHTML = links;
  $('#bottom-nav').hidden = onb;
  $('#side-nav').innerHTML = onb ? '' : links;
  $('#side-foot').innerHTML = `
    <a href="#/perfil">Perfil e privacidade</a>
    <a href="#/notificacoes">Notificações</a>
    <a href="#/sessao">Modo sessão (facilitador)</a>
    <button type="button" data-action="reset">Reiniciar dados de demonstração</button>`;

  $('#role-select').innerHTML = Object.entries(state.meta.roles)
    .map(([k, v]) => `<option value="${k}" ${k === p.role ? 'selected' : ''}>${esc(v)}</option>`)
    .join('');
  $('#avatar-btn').textContent = initials(p.name);
  $('#fab-finding').hidden = !state.sessionMode;
  refreshChrome();
}

async function refreshChrome() {
  try {
    const list = await api.get('/notifications');
    const unread = list.filter((n) => !n.read).length;
    const badge = $('#bell-badge');
    badge.textContent = unread;
    badge.hidden = unread === 0;
  } catch {}
}

// ---------- registro de achados (seção 7.2 do plano de elicitação) ----------
const FINDING_TYPES = ['Problema de usabilidade', 'Sugestão', 'Novo requisito', 'Regra de negócio', 'Restrição', 'Dúvida em aberto'];

export function openFindingSheet(prefill = {}) {
  let last = {};
  try {
    last = JSON.parse(localStorage.getItem('campus.lastFinding') || '{}');
  } catch {}
  const screen = prefill.screen || state.currentScreen;
  openSheet(
    'Registrar achado',
    `<form id="finding-form">
      <div class="form-row">
        <div class="field"><label for="f-session">Sessão nº</label><input class="input" id="f-session" name="session" value="${esc(last.session || '1')}" inputmode="numeric"></div>
        <div class="field"><label for="f-priority">Prioridade</label>
          <select class="input" id="f-priority" name="priority">${['Alta', 'Média', 'Baixa'].map((p) => `<option ${p === 'Média' ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label for="f-part">Participante (perfil, anônimo)</label><input class="input" id="f-part" name="participant" placeholder="Ex.: Estudante, 3º período" value="${esc(last.participant || '')}"></div>
      <div class="field"><label for="f-screen">Tela / funcionalidade</label><input class="input" id="f-screen" name="screen" value="${esc(screen)}"></div>
      <div class="field"><label for="f-obs">Observação ou citação *</label><textarea class="input" id="f-obs" name="observation" required placeholder='Ex.: "Prefiro ver minhas aulas antes de eventos"'></textarea></div>
      <div class="field"><label for="f-type">Tipo</label>
        <select class="input" id="f-type" name="type">${FINDING_TYPES.map((t) => `<option>${t}</option>`).join('')}</select></div>
      <div class="field"><label for="f-req">Requisito derivado (opcional)</label><input class="input" id="f-req" name="requirement" placeholder="RF/RNF/RN: ..."></div>
      <button class="btn block" type="submit">Salvar achado</button>
    </form>`,
    (sheet) => {
      sheet.querySelector('#finding-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        try {
          await api.post('/findings', data);
          try {
            localStorage.setItem('campus.lastFinding', JSON.stringify({ session: data.session, participant: data.participant }));
          } catch {}
          closeSheet();
          toast('Achado registrado');
          if (document.body.dataset.screen === 'session') router();
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    }
  );
  setTimeout(() => $('#f-obs')?.focus(), 50);
}

export function setSessionMode(on) {
  state.sessionMode = on;
  try {
    localStorage.setItem('campus.sessionMode', on ? '1' : '0');
  } catch {}
  $('#fab-finding').hidden = !on;
}

function openAbout() {
  openSheet(
    'Sobre este protótipo',
    `<div class="stack">
      <p>Este é um <b>protótipo descartável</b> do Campus+, criado para ouvir sua opinião. <b>Estamos testando o protótipo, não você</b> — não existe resposta errada.</p>
      <div class="alert info"><span class="ico">i</span><div><b>Fora do escopo (simulado):</b><br>• Login institucional real (SSO) e integrações com sistemas da universidade.<br>• Regras de back-end e o algoritmo de recomendação.<br>• Design visual final: cores, identidade e animações.</div></div>
      <p class="muted small">Todos os nomes, salas e números são fictícios. Use o seletor de perfil no topo para ver o sistema como estudante, professor/organizador, servidor ou gestor.</p>
      <button class="btn block" type="button" data-close-about>Entendi</button>
    </div>`,
    (sheet) => sheet.querySelector('[data-close-about]').addEventListener('click', closeSheet)
  );
}

async function resetData() {
  openSheet(
    'Reiniciar dados?',
    `<p>Volta o protótipo ao estado inicial (perfil, inscrições, reservas, grupos e publicações) para o próximo participante. <b>Os achados registrados são mantidos.</b></p>
     <div class="row" style="margin-top:16px"><button class="btn secondary" type="button" data-close>Cancelar</button><button class="btn danger" type="button" data-confirm>Reiniciar</button></div>`,
    (sheet) => {
      sheet.querySelector('.row [data-close]').addEventListener('click', closeSheet);
      sheet.querySelector('[data-confirm]').addEventListener('click', async () => {
        await api.post('/reset');
        state.profile = await api.get('/me');
        closeSheet();
        toast('Dados reiniciados');
        location.hash = '#/boas-vindas';
        router();
      });
    }
  );
}

// ---------- inicialização ----------
async function init() {
  [state.meta, state.profile] = await Promise.all([api.get('/meta'), api.get('/me')]);

  $('#role-select').addEventListener('change', async (e) => {
    state.profile = await api.put('/me', { role: e.target.value, onboarded: true });
    toast(`Visualizando como: ${state.meta.roles[state.profile.role]}`);
    location.hash = HOME_BY_ROLE[state.profile.role];
    if (location.hash === HOME_BY_ROLE[state.profile.role]) router();
  });
  $('#fab-finding').addEventListener('click', () => openFindingSheet());
  $('#sheet-backdrop').addEventListener('click', closeSheet);
  document.addEventListener('keydown', (e) => e.key === 'Escape' && closeSheet());
  document.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'about') openAbout();
    if (action === 'reset') resetData();
  });

  window.addEventListener('hashchange', router);
  router();
}

init().catch((err) => {
  $('#view').innerHTML = `<div class="alert danger"><span class="ico">!</span><div>Servidor indisponível: ${esc(err.message)}</div></div>`;
});

export { router };
