// T03 — Detalhe do evento e inscrição
import { api } from '../api.js';
import { esc, fmtDate, typeTag, toast } from '../ui.js';

export default async function render(el, { params, state }) {
  let e = await api.get(`/events/${params.id}`);

  function draw() {
    const isDeadline = e.type === 'Edital' || e.type === 'Oportunidade';
    const aud = e.audience || {};
    const audienceText =
      [aud.courses?.length ? aud.courses.join(', ') : 'Todos os cursos', aud.periods?.length ? aud.periods.map((p) => `${p}º`).join(', ') + ' período' : 'todos os períodos'].join(' · ');
    const pct = e.seats ? Math.min(100, Math.round((e.enrolled / e.seats) * 100)) : 0;
    const isStudent = state.profile.role === 'estudante';

    let action = '';
    if (!isStudent) action = `<p class="muted small">Inscrições estão disponíveis no perfil estudante.</p>`;
    else if (e.link && !e.requiresSignup) action = `<a class="btn block" href="${esc(e.link)}" target="_blank" rel="noopener">Ver edital completo</a><button class="btn secondary block" type="button" data-remind style="margin-top:8px">Lembrar-me antes do prazo</button>`;
    else if (!e.requiresSignup) action = `<button class="btn secondary block" type="button" data-remind>Adicionar à minha agenda</button><p class="muted small center" style="margin-top:6px">Não precisa de inscrição.</p>`;
    else if (e.enrolledByMe) action = `<div class="alert ok"><span class="ico">✓</span><div>Você está inscrita(o). Enviaremos um lembrete 1 dia antes.</div></div><button class="btn secondary block" type="button" data-enroll style="margin-top:8px">Cancelar inscrição</button>`;
    else if (e.full) action = `<button class="btn secondary block" type="button" data-enroll>Entrar na lista de espera</button>`;
    else action = `<button class="btn block" type="button" data-enroll>${isDeadline ? 'Candidatar-se' : 'Inscrever-se'}</button>`;

    el.innerHTML = `
      <a class="back" href="#/eventos">← Eventos</a>
      <div class="split">
        <div>
          <div class="row">${typeTag(e.type)}${e.hours ? `<span class="tag">${e.hours}h complementares</span>` : ''}</div>
          <h1 style="margin-top:8px">${esc(e.title)}</h1>
          <p class="meta" style="margin-top:4px">por ${esc(e.organizer)}</p>
          ${e.reason ? `<div class="reason">💡 ${esc(e.reason)}</div>` : ''}
          <div class="card" style="margin-top:14px">
            <div class="stack small">
              <div>📅 <b>${isDeadline ? 'Prazo' : 'Data'}:</b> ${fmtDate(e.date)} às ${esc(e.time)}</div>
              <div>📍 <b>Local:</b> ${esc(e.place)}</div>
              <div>🎯 <b>Público:</b> ${esc(audienceText)}</div>
              ${e.seats ? `<div>🎟️ <b>Vagas:</b> ${e.enrolled} de ${e.seats} preenchidas
                <div style="height:8px;background:var(--surface-2);border-radius:8px;margin-top:6px"><div style="height:100%;width:${pct}%;background:${pct >= 100 ? 'var(--danger)' : 'var(--accent)'};border-radius:8px"></div></div></div>` : ''}
            </div>
          </div>
          <section class="section"><h2>Sobre</h2><p style="margin-top:6px">${esc(e.description) || '<span class="muted">Sem descrição.</span>'}</p></section>
          <section class="section"><h2>Temas</h2><div class="chips" style="margin-top:8px">${e.interests.map((i) => `<span class="chip">${esc(i)}</span>`).join('') || '<span class="muted">—</span>'}</div></section>
        </div>
        <div class="section">
          <div class="card">${action}</div>
          <p class="muted small" style="margin-top:10px">Faltou alguma informação para decidir? (ex.: certificado, acessibilidade, transmissão on-line)</p>
        </div>
      </div>`;

    el.querySelector('[data-enroll]')?.addEventListener('click', async () => {
      try {
        const was = e.enrolledByMe;
        e = await api.post(`/events/${e.id}/enroll`);
        toast(was ? 'Inscrição cancelada' : 'Inscrição confirmada!');
        draw();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
    el.querySelector('[data-remind]')?.addEventListener('click', () => toast('Lembrete criado (simulado)'));
  }

  draw();
}
