// Modo sessão (facilitador) — apoia as seções 6 e 7 do plano de elicitação:
// roteiro de tarefas com cronômetro e resultado, perguntas de feedback e registro de achados exportável em CSV.
import { api } from '../api.js';
import { esc, toast, $$ } from '../ui.js';
import { openFindingSheet, setSessionMode } from '../app.js';

const TASKS = [
  { id: 't1', role: 'estudante', start: '#/inicio', text: 'Descubra onde será sua próxima aula e se algo mudou.', screen: 'T02/T04' },
  { id: 't2', role: 'estudante', start: '#/inicio', text: 'Encontre um evento do seu interesse e faça a inscrição.', screen: 'T03' },
  { id: 't3', role: 'estudante', start: '#/inicio', text: 'Ache uma sala livre para estudar em grupo amanhã à tarde e solicite o uso.', screen: 'T05' },
  { id: 't4', role: 'estudante', start: '#/inicio', text: 'Encontre outros estudantes interessados em Inteligência Artificial.', screen: 'T06/T07' },
  { id: 't5', role: 'professor', start: '#/inicio', text: 'Divulgue uma palestra apenas para o 5º período de Computação.', screen: 'T08' },
  { id: 't6', role: 'gestor', start: '#/painel', text: 'Descubra qual espaço é o mais procurado no mês.', screen: 'T09' },
  { id: 't7', role: 'gestor', start: '#/painel', text: 'Descubra qual é a atividade mais procurada pelos alunos.', screen: 'T09' },
  { id: 't8', role: 'servidor', start: '#/inicio', text: 'Encontre editais abertos.', screen: 'T03' },
];

const QUESTIONS = [
  ['Abertura', ['Como você descobre hoje eventos, avisos e horários na universidade?', 'Qual foi a última vez que você perdeu uma oportunidade por falta de informação?']],
  ['Durante as tarefas', ['O que você esperava encontrar nesta tela?', 'O que você faria agora? Para onde clicaria?', 'Alguma coisa aqui te confundiu ou pareceu desnecessária?']],
  ['Home e recomendações (F01)', ['O que você gostaria de ver primeiro ao abrir o aplicativo?', 'As sugestões parecem relevantes? O que faria você confiar (ou desconfiar) delas?', 'Que informações você aceitaria fornecer para receber sugestões melhores?', 'Que tipo de notificação seria útil, e qual viraria "spam"?']],
  ['Conexão entre estudantes (F02)', ['Você usaria esse recurso? Em que situações?', 'Quem deveria poder ver seu perfil: todos, só seu curso ou só quem você convidar?', 'Que problema você teme (assédio, exposição, spam)? O que ajudaria a se sentir seguro?']],
  ['Espaços (F03)', ['Que informação sobre a sala é indispensável?', 'Quanto tempo é aceitável esperar pela resposta de uma solicitação?', '(servidor/coordenador) Quem deve aprovar e com quais regras?']],
  ['Agenda de aulas (F04)', ['Como você gostaria de ser avisado de uma mudança de sala ou de aula remota?', 'Falta alguma informação na agenda (professor, link da aula, prazo de atividade)?']],
  ['Painel do gestor (F05)', ['Que decisões você toma hoje por falta de dados? Que indicador ajudaria?']],
  ['Descoberta (fechamento)', ['O que está faltando neste aplicativo para você usá-lo todos os dias?', 'Se pudesse remover uma tela, qual seria?', 'Se você tivesse uma varinha mágica, o que o Campus+ faria que ainda não apareceu aqui?', 'De 1 a 5, quão útil e quão fácil de usar foi o protótipo? Por quê?']],
];

const RESULT = { sim: ['Concluiu', 'ok'], parcial: ['Parcialmente', 'warn'], nao: ['Não concluiu', 'danger'] };

const store = {
  get(k, fallback) {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
};

const fmtSecs = (s) => `${Math.floor(s / 60)}min ${String(s % 60).padStart(2, '0')}s`;

export default async function render(el, { state }) {
  let timer;

  async function draw() {
    const { findings, taskResults } = await api.get('/session');
    const info = store.get('campus.sessionInfo', { number: '1', date: new Date().toISOString().slice(0, 10), place: '', participant: '', members: '', version: 'v0.1', consent: false });
    const started = store.get('campus.taskStart', {});

    el.innerHTML = `
      <div class="page-head"><div><h1>Modo sessão</h1><p>Ferramentas do facilitador para a sessão de prototipação.</p></div></div>

      <div class="card switch-row" style="padding:12px 14px">
        <div><b>Botão "Achado" em todas as telas</b><div class="meta">Permite registrar observações sem sair da tela que o participante está usando.</div></div>
        <label class="switch"><input type="checkbox" id="s-mode" ${state.sessionMode ? 'checked' : ''} aria-label="Ativar botão de achados"><span></span></label>
      </div>

      <details class="card section" ${info.consent ? '' : 'open'}>
        <summary><b>Dados da sessão</b> <span class="meta">(7.1)</span></summary>
        <form id="s-info" style="margin-top:12px">
          <div class="form-row">
            <div class="field"><label for="si-n">Sessão nº</label><input class="input" id="si-n" name="number" value="${esc(info.number)}"></div>
            <div class="field"><label for="si-d">Data</label><input class="input" type="date" id="si-d" name="date" value="${esc(info.date)}"></div>
          </div>
          <div class="field"><label for="si-p">Participante (perfil, curso, período — anônimo)</label><input class="input" id="si-p" name="participant" value="${esc(info.participant)}" placeholder="Ex.: Estudante, Ciência da Computação, 3º período"></div>
          <div class="form-row">
            <div class="field"><label for="si-l">Local</label><input class="input" id="si-l" name="place" value="${esc(info.place)}"></div>
            <div class="field"><label for="si-v">Versão do protótipo</label><input class="input" id="si-v" name="version" value="${esc(info.version)}"></div>
          </div>
          <div class="field"><label for="si-m">Membros presentes e papéis</label><input class="input" id="si-m" name="members" value="${esc(info.members)}" placeholder="Ex.: Pedro (facilitador), Danielly (anotações)"></div>
          <label class="option"><input type="checkbox" name="consent" ${info.consent ? 'checked' : ''}><div>Participante consentiu com anotação/gravação e foi informado de que <b>o protótipo está sendo testado, não ele</b>.</div></label>
          <button class="btn sm" type="submit" style="margin-top:10px">Salvar dados da sessão</button>
        </form>
      </details>

      <section class="section">
        <div class="section-head"><h2>Tarefas guiadas <span class="meta">(6.2)</span></h2></div>
        <p class="meta" style="margin-bottom:10px">"Iniciar" troca o perfil simulado e abre a tela inicial. Volte aqui para registrar o resultado.</p>
        <div class="stack">
          ${TASKS.map((t, i) => {
            const r = taskResults[t.id];
            const s = started[t.id];
            return `<div class="card task ${r ? 'done' : ''}">
              <div class="row" style="flex-wrap:nowrap;align-items:flex-start"><span class="num">${i + 1}</span>
                <div style="flex:1"><b>"${esc(t.text)}"</b><div class="meta">${esc(state.meta.roles[t.role])} · ${t.screen}</div></div></div>
              ${r ? `<div class="row"><span class="tag ${RESULT[r.result][1]}">${RESULT[r.result][0]}</span>${r.seconds != null ? `<span class="meta">⏱ ${fmtSecs(r.seconds)}</span>` : ''}${r.note ? `<span class="meta">· ${esc(r.note)}</span>` : ''}<span class="spacer"></span><button class="link small" type="button" data-redo="${t.id}">Refazer</button></div>` : ''}
              ${!r && s ? `<div class="stack" style="gap:8px">
                  <div class="meta">⏱ Em andamento: <b data-elapsed="${s}">${fmtSecs(Math.round((Date.now() - s) / 1000))}</b></div>
                  <input class="input" placeholder="Onde hesitou, errou ou pediu ajuda? Caminhos inesperados?" data-note="${t.id}">
                  <div class="row">${Object.entries(RESULT).map(([k, [l]]) => `<button class="btn sm secondary" type="button" data-result="${k}" data-task="${t.id}">${l}</button>`).join('')}</div>
                </div>` : ''}
              ${!r && !s ? `<div><button class="btn sm" type="button" data-start="${t.id}">Iniciar tarefa</button></div>` : ''}
            </div>`;
          }).join('')}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Achados registrados <span class="meta">(7.2)</span></h2>
          <div class="row"><button class="btn sm" type="button" data-new>+ Achado</button><a class="btn sm secondary" href="/api/findings.csv">Exportar CSV</a></div></div>
        ${findings.length
          ? `<div class="table-wrap card" style="padding:0"><table class="data"><thead><tr><th>Sessão</th><th>Participante</th><th>Tela</th><th>Observação</th><th>Tipo</th><th>Requisito derivado</th><th>Prioridade</th><th></th></tr></thead><tbody>
              ${findings.map((f) => `<tr><td>${esc(f.session)}</td><td>${esc(f.participant)}</td><td>${esc(f.screen)}</td><td>${esc(f.observation)}</td><td>${esc(f.type)}</td><td>${esc(f.requirement)}</td><td>${esc(f.priority)}</td><td><button class="link small" type="button" data-del="${f.id}" aria-label="Excluir achado">Excluir</button></td></tr>`).join('')}
            </tbody></table></div>`
          : '<div class="empty">Nenhum achado ainda. Use o botão "Achado" durante as tarefas.</div>'}
        <p class="muted small" style="margin-top:8px">Os achados ficam na memória do servidor: exporte o CSV ao final de cada sessão (reiniciar o servidor apaga os dados).</p>
      </section>

      <section class="section">
        <h2>Perguntas de feedback <span class="meta">(6.4)</span></h2>
        <div class="stack" style="margin-top:10px">
          ${QUESTIONS.map(([title, qs]) => `<details class="card"><summary><b>${title}</b></summary><ol class="small" style="margin:8px 0 0;padding-left:20px">${qs.map((q) => `<li style="margin-bottom:4px">${esc(q)}</li>`).join('')}</ol></details>`).join('')}
        </div>
      </section>

      <section class="section">
        <h2>Entre participantes</h2>
        <div class="row" style="margin-top:10px">
          <button class="btn secondary" type="button" data-action="reset">Reiniciar dados de demonstração</button>
          <button class="btn ghost" type="button" data-wipe>Apagar também achados e tarefas</button>
        </div>
      </section>`;

    el.querySelector('#s-mode').addEventListener('change', (e) => {
      setSessionMode(e.target.checked);
      toast(e.target.checked ? 'Botão "Achado" ativado' : 'Botão "Achado" desativado');
    });
    el.querySelector('#s-info').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target));
      store.set('campus.sessionInfo', { ...fd, consent: !!fd.consent });
      store.set('campus.lastFinding', { session: fd.number, participant: fd.participant });
      toast('Dados da sessão salvos');
      draw();
    });
    $$('[data-start]', el).forEach((b) =>
      b.addEventListener('click', async () => {
        const t = TASKS.find((x) => x.id === b.dataset.start);
        const s = store.get('campus.taskStart', {});
        s[t.id] = Date.now();
        store.set('campus.taskStart', s);
        state.profile = await api.put('/me', { role: t.role, onboarded: true });
        setSessionMode(true);
        location.hash = t.start;
      })
    );
    $$('[data-result]', el).forEach((b) =>
      b.addEventListener('click', async () => {
        const id = b.dataset.task;
        const s = store.get('campus.taskStart', {});
        const seconds = s[id] ? Math.round((Date.now() - s[id]) / 1000) : null;
        const note = el.querySelector(`[data-note="${id}"]`)?.value || '';
        await api.put(`/tasks/${id}`, { result: b.dataset.result, seconds, note });
        delete s[id];
        store.set('campus.taskStart', s);
        draw();
      })
    );
    $$('[data-redo]', el).forEach((b) =>
      b.addEventListener('click', async () => {
        await api.del(`/tasks/${b.dataset.redo}`);
        draw();
      })
    );
    el.querySelector('[data-new]').addEventListener('click', () => openFindingSheet({ screen: '' }));
    $$('[data-del]', el).forEach((b) =>
      b.addEventListener('click', async () => {
        await api.del(`/findings/${b.dataset.del}`);
        draw();
      })
    );
    el.querySelector('[data-wipe]').addEventListener('click', async () => {
      if (b4wipe()) {
        await api.post('/reset?all=1');
        store.set('campus.taskStart', {});
        state.profile = await api.get('/me');
        toast('Tudo apagado');
        draw();
      }
    });

    clearInterval(timer);
    timer = setInterval(() => {
      $$('[data-elapsed]', el).forEach((n) => (n.textContent = fmtSecs(Math.round((Date.now() - Number(n.dataset.elapsed)) / 1000))));
    }, 1000);
  }

  // Confirmação em dois cliques (sem diálogos nativos)
  let armed = false;
  function b4wipe() {
    const btn = el.querySelector('[data-wipe]');
    if (armed) return true;
    armed = true;
    btn.textContent = 'Clique de novo para confirmar';
    btn.classList.add('danger');
    setTimeout(() => {
      armed = false;
      if (btn.isConnected) btn.textContent = 'Apagar também achados e tarefas';
    }, 4000);
    return false;
  }

  await draw();
  return () => clearInterval(timer);
}
