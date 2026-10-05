// T02 — Home personalizada (F01)
// Testa: ordem/hierarquia dos blocos e a clareza do texto "recomendado porque...".
// O participante pode reordenar os blocos ("Personalizar início") — a ordem escolhida é um dado de elicitação.
import { api } from '../api.js';
import { esc, fmtDate, relDay, typeTag, toast, $$ } from '../ui.js';

const BLOCK_LABEL = {
  proxima_aula: 'Próxima aula',
  avisos: 'Avisos',
  recomendados: 'Recomendado para você',
  agenda: 'Aulas de hoje',
  eventos: 'Meus próximos eventos',
};

export function changeAlert(c, { compact = false } = {}) {
  if (!c.change) return '';
  const ch = c.change;
  if (ch.type === 'sala')
    return `<div class="alert warn"><span class="ico">!</span><div><b>Sala alterada:</b> agora em <b>${esc(ch.newRoom)}</b> (${esc(ch.newBlock)}).${compact ? '' : ` ${esc(ch.note)} <span class="meta">· aviso de ${esc(ch.at)}</span>`}</div></div>`;
  if (ch.type === 'remoto')
    return `<div class="alert info"><span class="ico">i</span><div><b>Aula remota hoje.</b>${compact ? '' : ` ${esc(ch.note)}`} <a href="${esc(ch.link)}" target="_blank" rel="noopener">Entrar na aula</a></div></div>`;
  if (ch.type === 'cancelada')
    return `<div class="alert danger"><span class="ico">×</span><div><b>Aula cancelada.</b>${compact ? '' : ` ${esc(ch.note)}`}</div></div>`;
  return '';
}

export function roomOf(c) {
  if (c.change?.type === 'sala') return `<span class="old">${esc(c.room)}</span> → <b>${esc(c.change.newRoom)}</b>`;
  if (c.change?.type === 'remoto' || c.mode === 'remoto') return '<b>Remoto</b>';
  return `${esc(c.room)} · ${esc(c.block)}`;
}

export default async function render(el, { state }) {
  if (state.profile.role !== 'estudante') return renderStaff(el, state);

  const data = await api.get('/home');
  const { profile, meta } = state;
  let customizing = false;
  let dismissed = new Set();
  try {
    dismissed = new Set(JSON.parse(sessionStorage.getItem('campus.dismissed') || '[]'));
  } catch {}

  const blocks = {
    proxima_aula: () => {
      const c = data.nextClass;
      if (!c) return `<div class="card"><p class="muted">Sem aulas hoje. 🎉</p></div>`;
      return `
        <a class="card next-class" href="#/agenda">
          <div class="meta">${c.change?.type === 'cancelada' ? 'Aula de hoje' : 'Próxima aula'} · ${esc(c.start)}–${esc(c.end)}</div>
          <div class="card-title" style="font-size:1.12rem;margin-top:2px">${esc(c.subject)}</div>
          <div class="meta-list"><span>📍 ${roomOf(c)}</span><span>👤 ${esc(c.teacher)}</span></div>
          ${changeAlert(c, { compact: true })}
        </a>`;
    },
    avisos: () =>
      data.notices
        .map(
          (n) => `<div class="card card-row">
            <span class="tag ${n.priority === 'alta' ? 'danger' : n.priority === 'normal' ? 'accent' : ''}">${n.priority === 'alta' ? 'Importante' : 'Aviso'}</span>
            <div><div class="card-title">${esc(n.title)}</div><div class="meta">${esc(n.source)} · ${fmtDate(n.date, { weekday: false })}</div></div>
          </div>`
        )
        .join(''),
    recomendados: () => {
      const list = data.recommended.filter((e) => !dismissed.has(e.id));
      if (!list.length) return `<div class="empty">Sem sugestões no momento. <a href="#/perfil">Ajustar interesses</a></div>`;
      return list
        .map(
          (e) => `<div class="card">
            <div class="row">${typeTag(e.type)}<span class="meta">${fmtDate(e.date)} · ${esc(e.time)}</span><span class="spacer"></span>
              <button type="button" class="link small" data-dismiss="${e.id}" aria-label="Não tenho interesse em ${esc(e.title)}">Não tenho interesse</button></div>
            <a href="#/eventos/${e.id}" style="color:inherit;text-decoration:none"><div class="card-title" style="margin-top:6px">${esc(e.title)}</div>
            <div class="meta">${esc(e.place)}</div></a>
            <div class="reason">💡 ${esc(e.reason)}</div>
          </div>`
        )
        .join('');
    },
    agenda: () =>
      data.classes.length
        ? `<div class="card timeline">${data.classes
            .map(
              (c) => `<div class="tl-item ${c.change?.type === 'cancelada' ? 'cancel' : ''}">
                <div class="tl-time">${esc(c.start)}<small>${esc(c.end)}</small></div>
                <div class="tl-body"><div class="card-title">${esc(c.subject)}</div><div class="meta">${roomOf(c)}</div>
                ${c.change ? `<div style="margin-top:6px">${changeAlert(c, { compact: true })}</div>` : ''}</div>
              </div>`
            )
            .join('')}</div>`
        : `<div class="empty">Sem aulas hoje.</div>`,
    eventos: () =>
      data.myEvents.length
        ? data.myEvents
            .map((e) => `<a class="card card-row" href="#/eventos/${e.id}"><div class="tag accent">${fmtDate(e.date, { weekday: false })}</div><div><div class="card-title">${esc(e.title)}</div><div class="meta">${esc(e.time)} · ${esc(e.place)}</div></div></a>`)
            .join('')
        : `<div class="empty">Você ainda não se inscreveu em eventos. <a href="#/eventos">Explorar eventos</a></div>`,
  };

  const LINKS = { recomendados: ['#/eventos', 'Ver todos'], agenda: ['#/agenda', 'Semana'], eventos: ['#/eventos?meus=1', 'Ver todos'] };

  function draw() {
    const order = profile.homeOrder.filter((k) => blocks[k]);
    el.innerHTML = `
      <div class="page-head greet">
        <div><h1>Olá, ${esc(profile.name.split(' ')[0])}!</h1>
        <p>${esc(data.weekday)}, ${fmtDate(data.date, { weekday: false })} · ${data.changes ? `<b style="color:var(--warn)">${data.changes} mudança(s) nas aulas de hoje</b>` : 'nenhuma mudança nas aulas'}</p></div>
        <button type="button" class="btn sm secondary" data-customize aria-pressed="${customizing}">${customizing ? 'Concluir' : 'Personalizar'}</button>
      </div>
      ${customizing ? '<div class="alert info"><span class="ico">i</span><div>Use as setas para deixar no topo o que é mais importante para você.</div></div>' : ''}
      ${data.pendingReservations ? `<a class="alert warn" href="#/espacos/solicitacoes" style="text-decoration:none;margin-top:10px"><span class="ico">⏳</span><div>${data.pendingReservations} solicitação(ões) de espaço em análise.</div></a>` : ''}
      <div class="home-grid ${customizing ? 'customizing' : ''}">
        ${order
          .map(
            (k, i) => `<section class="section home-block ${k === 'recomendados' || k === 'proxima_aula' ? 'wide' : ''}" data-block="${k}">
              <div class="section-head"><h2>${BLOCK_LABEL[k]}</h2>
                <span class="reorder">
                  <button class="btn sm secondary" type="button" data-move="${k}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Mover ${BLOCK_LABEL[k]} para cima">↑</button>
                  <button class="btn sm secondary" type="button" data-move="${k}" data-dir="1" ${i === order.length - 1 ? 'disabled' : ''} aria-label="Mover ${BLOCK_LABEL[k]} para baixo">↓</button>
                </span>
                ${!customizing && LINKS[k] ? `<a href="${LINKS[k][0]}">${LINKS[k][1]}</a>` : ''}
              </div>
              <div class="stack">${blocks[k]()}</div>
            </section>`
          )
          .join('')}
      </div>`;

    el.querySelector('[data-customize]').addEventListener('click', async () => {
      if (customizing) {
        state.profile = await api.put('/me', { homeOrder: profile.homeOrder });
        toast('Ordem do início salva');
      }
      customizing = !customizing;
      draw();
    });
    $$('[data-move]', el).forEach((b) =>
      b.addEventListener('click', () => {
        const arr = profile.homeOrder;
        const i = arr.indexOf(b.dataset.move);
        const j = i + Number(b.dataset.dir);
        [arr[i], arr[j]] = [arr[j], arr[i]];
        draw();
      })
    );
    $$('[data-dismiss]', el).forEach((b) =>
      b.addEventListener('click', () => {
        dismissed.add(b.dataset.dismiss);
        try {
          sessionStorage.setItem('campus.dismissed', JSON.stringify([...dismissed]));
        } catch {}
        toast('Ok, vamos mostrar menos sugestões como essa');
        draw();
      })
    );
  }

  draw();
}

// Início para professor/organizador e servidor
async function renderStaff(el, state) {
  const { profile } = state;
  const [posts, reservations, home] = await Promise.all([api.get('/posts'), api.get('/reservations?scope=all'), api.get('/home')]);
  const pending = reservations.filter((r) => r.status === 'em_analise');
  const isServer = profile.role === 'servidor';

  el.innerHTML = `
    <div class="page-head"><div><h1>Olá, ${esc(profile.name.split(' ')[0])}!</h1><p>${esc(state.meta.roles[profile.role])}</p></div></div>
    <div class="grid-2">
      <a class="card" href="#/publicar"><div style="font-size:1.4rem">📣</div><div class="card-title">Publicar conteúdo</div><div class="meta">Evento, palestra, oportunidade, edital ou aviso para um público específico.</div></a>
      ${isServer
        ? `<a class="card" href="#/aprovacoes"><div style="font-size:1.4rem">✅</div><div class="card-title">Aprovar solicitações</div><div class="meta">${pending.length} pedido(s) de espaço aguardando análise.</div></a>`
        : `<a class="card" href="#/espacos"><div style="font-size:1.4rem">📍</div><div class="card-title">Reservar um espaço</div><div class="meta">Auditórios, laboratórios e salas.</div></a>`}
    </div>
    <section class="section">
      <div class="section-head"><h2>Minhas publicações</h2><a href="#/publicar">Nova</a></div>
      <div class="stack">${posts.length
        ? posts.map((p) => `<a class="card" href="#/eventos/${p.id}"><div class="row">${typeTag(p.type)}<span class="meta">${fmtDate(p.date)}</span></div><div class="card-title" style="margin-top:6px">${esc(p.title)}</div><div class="meta">Alcance estimado: ${p.reach} pessoas · ${p.enrolled} inscrição(ões)</div></a>`).join('')
        : '<div class="empty">Nenhuma publicação ainda. Tente divulgar uma palestra para o 5º período de Computação.</div>'}</div>
    </section>
    <section class="section">
      <div class="section-head"><h2>Avisos institucionais</h2></div>
      <div class="stack">${home.notices.map((n) => `<div class="card"><div class="card-title">${esc(n.title)}</div><div class="meta">${esc(n.source)} · ${relDay(n.date, state.meta.today, state.meta.tomorrow)}</div></div>`).join('')}</div>
    </section>`;
}
