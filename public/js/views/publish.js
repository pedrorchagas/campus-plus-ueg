// T08 — Publicação de conteúdo (professor / servidor / organizador)
// Testa: divulgar uma palestra apenas para o 5º período de Computação (tarefa 5) e que dados são necessários (pergunta-guia 6).
import { api } from '../api.js';
import { esc, fmtDate, typeTag, toast, openSheet, debounce, $$ } from '../ui.js';

const TYPES = ['Palestra', 'Evento', 'Curso', 'Oportunidade', 'Edital', 'Aviso'];

export default async function render(el, { state }) {
  const { courses, interests, today } = state.meta;
  const aud = { courses: new Set(), periods: new Set(), interests: new Set() };
  let type = 'Palestra';

  el.innerHTML = `
    <div class="page-head"><div><h1>Publicar</h1><p>Divulgue para o público certo — sem depender de grupos de mensagens.</p></div></div>
    <form id="pf" class="split" novalidate>
      <div>
        <div class="field"><span class="label">Tipo de publicação</span>
          <div class="chips" role="group" aria-label="Tipo">${TYPES.map((t) => `<button type="button" class="chip" data-type="${t}" aria-pressed="${t === type}">${t}</button>`).join('')}</div></div>
        <div class="field"><label for="p-title">Título *</label><input class="input" id="p-title" name="title" required placeholder="Ex.: Palestra — Carreira em Ciência de Dados"></div>
        <div class="field"><label for="p-desc">Descrição</label><textarea class="input" id="p-desc" name="description" placeholder="O que é, para quem é, o que o participante ganha (certificado, horas complementares...)"></textarea></div>
        <div class="form-row">
          <div class="field"><label for="p-date" id="p-date-lbl">Data *</label><input class="input" type="date" id="p-date" name="date" min="${today}" required></div>
          <div class="field"><label for="p-time">Horário</label><input class="input" type="time" id="p-time" name="time" value="19:00"></div>
        </div>
        <div class="field"><label for="p-place">Local</label><input class="input" id="p-place" name="place" placeholder="Ex.: Auditório 1 — Bloco A ou On-line"><a class="small" href="#/espacos">Precisa reservar um espaço?</a></div>
        <div class="form-row" data-signup-fields>
          <div class="field"><label for="p-seats">Vagas</label><input class="input" type="number" id="p-seats" name="seats" min="0" placeholder="0 = ilimitado"></div>
          <div class="field"><span class="label">Inscrição</span><label class="option" style="padding:10px"><input type="checkbox" name="requiresSignup" checked><div class="small">Exigir inscrição</div></label></div>
        </div>
      </div>

      <div>
        <div class="card">
          <h2>Público-alvo</h2>
          <p class="meta" style="margin:2px 0 12px">Sem seleção = todos. Apenas quem estiver no público verá a publicação.</p>
          <div class="field"><span class="label">Cursos</span>
            <div class="chips">${courses.map((c) => `<button type="button" class="chip" data-course="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join('')}</div></div>
          <div class="field"><span class="label">Períodos</span>
            <div class="chips">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => `<button type="button" class="chip" data-period="${p}" aria-pressed="false">${p}º</button>`).join('')}</div></div>
          <div class="field"><span class="label">Temas (para recomendação)</span>
            <div class="chips">${interests.map((i) => `<button type="button" class="chip" data-interest="${esc(i)}" aria-pressed="false">${esc(i)}</button>`).join('')}</div></div>
          <div class="reach" aria-live="polite"><b id="reach">—</b><div class="small">pessoas devem receber<br><span id="aud-text">Todos os cursos · todos os períodos</span></div></div>
        </div>

        <div class="field" style="margin-top:14px"><span class="label">Como avisar o público?</span>
          <label class="option"><input type="checkbox" name="ch" value="destaque" checked><div>Destaque na home de quem é do público</div></label>
          <label class="option"><input type="checkbox" name="ch" value="push"><div>Notificação no celular</div></label>
          <label class="option"><input type="checkbox" name="ch" value="email"><div>E-mail institucional</div></label>
        </div>

        <h3 style="margin:14px 0 8px">Pré-visualização</h3>
        <div class="preview" id="preview"></div>

        <div class="row" style="margin-top:14px">
          <button class="btn secondary" type="button" data-draft style="flex:1">Salvar rascunho</button>
          <button class="btn" type="submit" style="flex:1">Publicar</button>
        </div>
        <p class="muted small" style="margin-top:8px">Publicações passam por moderação? Quem pode publicar para toda a universidade? <i>(a definir com vocês)</i></p>
      </div>
    </form>`;

  const form = el.querySelector('#pf');

  function audienceText() {
    const c = aud.courses.size ? [...aud.courses].join(', ') : 'Todos os cursos';
    const p = aud.periods.size ? [...aud.periods].sort((a, b) => a - b).map((n) => `${n}º`).join(', ') + ' período' : 'todos os períodos';
    return `${c} · ${p}`;
  }

  const updateReach = debounce(async () => {
    const { reach } = await api.post('/reach', { audience: { courses: [...aud.courses], periods: [...aud.periods].map(Number), interests: [...aud.interests] } });
    el.querySelector('#reach').textContent = `~${reach}`;
  }, 150);

  function updatePreview() {
    const fd = new FormData(form);
    const deadline = type === 'Edital' || type === 'Oportunidade';
    el.querySelector('#p-date-lbl').textContent = deadline ? 'Inscrições até *' : 'Data *';
    el.querySelector('#aud-text').textContent = audienceText();
    el.querySelector('#preview').innerHTML = `<div class="card">
      <div class="row">${typeTag(type)}</div>
      <div class="card-title" style="margin-top:6px">${esc(fd.get('title')) || '<span class="muted">Título da publicação</span>'}</div>
      <div class="meta-list"><span>📅 ${fd.get('date') ? fmtDate(fd.get('date')) : 'data'} · ${esc(fd.get('time'))}</span><span>📍 ${esc(fd.get('place')) || 'local'}</span></div>
      <div class="meta" style="margin-top:4px">${esc(state.profile.name)}</div>
      ${aud.courses.size || aud.periods.size ? `<div class="reason">💡 Recomendado porque é destinado ao seu curso/período.</div>` : ''}
    </div>`;
  }

  $$('[data-type]', el).forEach((b) =>
    b.addEventListener('click', () => {
      type = b.dataset.type;
      $$('[data-type]', el).forEach((x) => x.setAttribute('aria-pressed', x === b));
      el.querySelector('[data-signup-fields]').hidden = type === 'Aviso';
      updatePreview();
    })
  );
  const toggle = (attr, set, cast = (v) => v) =>
    $$(`[data-${attr}]`, el).forEach((b) =>
      b.addEventListener('click', () => {
        const v = cast(b.dataset[attr]);
        set.has(v) ? set.delete(v) : set.add(v);
        b.setAttribute('aria-pressed', set.has(v));
        updatePreview();
        updateReach();
      })
    );
  toggle('course', aud.courses);
  toggle('period', aud.periods, Number);
  toggle('interest', aud.interests);
  form.addEventListener('input', updatePreview);
  el.querySelector('[data-draft]').addEventListener('click', () => toast('Rascunho salvo (simulado)'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    if (!fd.get('title') || !fd.get('date')) {
      toast('Preencha o título e a data.', 'error');
      (!fd.get('title') ? el.querySelector('#p-title') : el.querySelector('#p-date')).focus();
      return;
    }
    try {
      const ev = await api.post('/posts', {
        type,
        title: fd.get('title'),
        description: fd.get('description'),
        date: fd.get('date'),
        time: fd.get('time'),
        place: fd.get('place'),
        seats: fd.get('seats'),
        requiresSignup: type !== 'Aviso' && !!fd.get('requiresSignup'),
        audience: { courses: [...aud.courses], periods: [...aud.periods] },
        interests: [...aud.interests],
        channels: fd.getAll('ch'),
      });
      openSheet(
        'Publicado!',
        `<div class="stack">
          <div class="alert ok"><span class="ico">✓</span><div><b>${esc(ev.title)}</b> foi publicado para <b>${esc(audienceText())}</b> (~${ev.reach} pessoas).</div></div>
          <p class="small muted">Dica para a sessão: troque o perfil para <b>Estudante</b> (Ciência da Computação, 5º período) e veja a publicação aparecer na home.</p>
          <a class="btn block" href="#/eventos/${ev.id}">Ver publicação</a>
          <a class="btn secondary block" href="#/inicio">Ir para o início</a>
        </div>`
      );
      form.reset();
      [aud.courses, aud.periods, aud.interests].forEach((s) => s.clear());
      $$('[data-course],[data-period],[data-interest]', el).forEach((b) => b.setAttribute('aria-pressed', 'false'));
      updatePreview();
      updateReach();
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  updatePreview();
  updateReach();
}
