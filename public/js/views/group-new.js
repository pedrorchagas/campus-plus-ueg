// T07 — Criação de grupo e convite (F02)
// Testa: criar um grupo de estudos, definir quem pode ver/entrar e convidar colegas.
import { api, qs } from '../api.js';
import { esc, toast, $$ } from '../ui.js';

export default async function render(el, { state, query }) {
  let interest = query.interesse || state.profile.interests[0] || state.meta.interests[0];
  const invites = new Set();

  el.innerHTML = `
    <a class="back" href="#/pessoas?aba=grupos">← Pessoas e grupos</a>
    <div class="page-head"><div><h1>Criar grupo</h1><p>Monte um grupo de estudos, projeto ou interesse.</p></div></div>
    <form id="gf" class="split">
      <div>
        <div class="field"><label for="g-name">Nome do grupo *</label><input class="input" id="g-name" name="name" required placeholder="Ex.: Estudos de Machine Learning"></div>
        <div class="field"><label for="g-int">Tema *</label><select class="input" id="g-int" name="interest">${state.meta.interests.map((i) => `<option ${i === interest ? 'selected' : ''}>${esc(i)}</option>`).join('')}</select></div>
        <div class="field"><label for="g-desc">Descrição</label><textarea class="input" id="g-desc" name="description" placeholder="Objetivo, nível esperado, frequência dos encontros..."></textarea></div>
        <div class="form-row">
          <div class="field"><label for="g-max">Máx. participantes</label><input class="input" type="number" id="g-max" name="max" min="2" max="50" value="8"></div>
          <div class="field"><label for="g-mode">Encontros</label><select class="input" id="g-mode" name="mode"><option>Presencial</option><option>On-line</option><option>Híbrido</option></select></div>
        </div>
        <div class="field"><label for="g-meet">Quando e onde?</label><input class="input" id="g-meet" name="meeting" placeholder="Ex.: Quartas, 17h — Sala de Estudos 1"></div>
        <div class="field"><span class="label">Quem pode ver e entrar?</span>
          <label class="option"><input type="radio" name="visibility" value="publico" checked><div><b>Aberto</b><div class="meta">Qualquer estudante encontra e entra.</div></div></label>
          <label class="option"><input type="radio" name="visibility" value="curso"><div><b>Só do meu curso</b><div class="meta">Outros cursos não veem o grupo.</div></div></label>
          <label class="option"><input type="radio" name="visibility" value="convite"><div><b>Só convidados</b><div class="meta">Entrada apenas por convite ou aprovação.</div></div></label>
        </div>
      </div>
      <div>
        <h2>Convidar colegas</h2>
        <p class="meta" style="margin:2px 0 10px">Sugestões com interesse em <b id="g-int-lbl">${esc(interest)}</b>.</p>
        <div class="stack" id="g-people"></div>
        <button class="btn block" type="submit" style="margin-top:16px">Criar grupo e enviar convites</button>
      </div>
    </form>`;

  async function loadPeople() {
    const people = await api.get(`/people${qs({ interest })}`);
    const box = el.querySelector('#g-people');
    box.innerHTML = people.length
      ? people
          .map(
            (p) => `<button type="button" class="card person selectable ${invites.has(p.id) ? 'on' : ''}" data-pid="${p.id}" aria-pressed="${invites.has(p.id)}" style="width:100%;text-align:left">
              <span class="avatar ${p.restricted ? 'muted' : ''}">${p.restricted ? '🔒' : esc(p.avatar)}</span>
              <div class="info"><div class="name">${esc(p.name)}</div><div class="meta">${p.restricted ? 'Perfil restrito' : `${esc(p.course)} · ${p.period}º`}</div></div>
              <span class="tag ${invites.has(p.id) ? 'ok' : ''}">${invites.has(p.id) ? '✓ Convidar' : 'Selecionar'}</span>
            </button>`
          )
          .join('')
      : '<div class="empty">Ninguém com esse interesse ainda. Você pode convidar depois.</div>';
    $$('[data-pid]', box).forEach((b) =>
      b.addEventListener('click', () => {
        invites.has(b.dataset.pid) ? invites.delete(b.dataset.pid) : invites.add(b.dataset.pid);
        loadPeople();
      })
    );
  }

  el.querySelector('#g-int').addEventListener('change', (e) => {
    interest = e.target.value;
    el.querySelector('#g-int-lbl').textContent = interest;
    loadPeople();
  });

  el.querySelector('#gf').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    try {
      const g = await api.post('/groups', {
        ...fd,
        meeting: [fd.mode, fd.meeting].filter(Boolean).join(' — '),
        invites: [...invites],
      });
      toast(invites.size ? `Grupo criado! ${invites.size} convite(s) enviado(s).` : 'Grupo criado!');
      location.hash = `#/grupos/${g.id}`;
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  await loadPeople();
}
