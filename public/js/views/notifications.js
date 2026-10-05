// Central de notificações — testa quais avisos são úteis e quais seriam "spam" (pergunta-guia 8)
import { api } from '../api.js';
import { esc } from '../ui.js';

const KIND = { mudanca_aula: ['📅', 'Aulas'], reserva: ['📍', 'Espaços'], eventos_interesse: ['✨', 'Eventos'], editais: ['📄', 'Editais'], avisos: ['📢', 'Avisos'], grupos: ['👥', 'Grupos'] };

export default async function render(el, { refreshChrome }) {
  const list = await api.get('/notifications');
  el.innerHTML = `
    <div class="page-head"><div><h1>Notificações</h1><p>${list.filter((n) => !n.read).length} não lida(s)</p></div>
      <a class="btn sm secondary" href="#/perfil?secao=notificacoes">Preferências</a></div>
    <div class="stack">
      ${list.length
        ? list
            .map((n) => {
              const [ic, cat] = KIND[n.kind] || ['🔔', 'Geral'];
              return `<a class="card card-row" href="${esc(n.link)}" style="${n.read ? '' : 'border-left:4px solid var(--accent)'}">
                <span style="font-size:1.3rem">${ic}</span>
                <div style="flex:1"><div class="row"><b>${esc(n.title)}</b><span class="spacer"></span><span class="meta">${esc(n.at)}</span></div>
                <div class="small">${esc(n.text)}</div><div class="meta">${cat}</div></div>
              </a>`;
            })
            .join('')
        : '<div class="empty">Nenhuma notificação.</div>'}
    </div>
    <p class="muted small" style="margin-top:14px">Quais destes avisos você gostaria de receber no celular? Algum seria incômodo?</p>`;
  await api.post('/notifications/read');
  refreshChrome();
}
