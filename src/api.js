import { Router } from 'express';
import { db, resetDb, nextId, COURSES, INTERESTS, ROLES, STUDENTS_PER_PERIOD, isoDate } from './data.js';

const api = Router();

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const STATUS_LABEL = { enviada: 'Enviada', em_analise: 'Em análise', aprovada: 'Aprovada', recusada: 'Recusada', cancelada: 'Cancelada' };

const parseDate = (iso) => new Date(`${iso}T12:00:00`);
const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// ---------- helpers de domínio ----------
function classesFor(dateIso) {
  const weekday = parseDate(dateIso).getDay();
  return db.classes
    .filter((c) => c.weekday === weekday)
    .map((c) => {
      const change = db.classChanges.find((ch) => ch.classId === c.id && ch.date === dateIso) || null;
      return { ...c, date: dateIso, change };
    })
    .sort((a, b) => a.start.localeCompare(b.start));
}

function audienceMatches(ev, profile) {
  const { courses = [], periods = [] } = ev.audience || {};
  const courseOk = courses.length === 0 || courses.includes(profile.course);
  const periodOk = periods.length === 0 || periods.includes(Number(profile.period));
  return courseOk && periodOk;
}

function decorateEvent(ev) {
  const p = db.profile;
  const matched = ev.interests.filter((i) => p.interests.includes(i));
  const reasons = [];
  if (matched.length) reasons.push(`você se interessa por ${matched.join(' e ')}`);
  const { courses = [], periods = [] } = ev.audience || {};
  const forPeriod = periods.includes(Number(p.period));
  const forCourse = courses.includes(p.course);
  if (forPeriod && forCourse) reasons.push(`é destinado ao ${p.period}º período de ${p.course}`);
  else if (forCourse) reasons.push(`é destinado ao curso de ${p.course}`);
  else if (forPeriod) reasons.push(`é destinado ao ${p.period}º período`);
  const score = matched.length * 2 + (reasons.length > matched.length ? 3 : 0) + (ev.fromPost ? 1 : 0);
  return {
    ...ev,
    enrolledByMe: db.enrollments.includes(ev.id),
    full: ev.seats > 0 && ev.enrolled >= ev.seats,
    forMe: audienceMatches(ev, p),
    reason: reasons.length ? `Recomendado porque ${reasons.join(' e ')}.` : null,
    score,
  };
}

function busyHours(spaceId, dateIso) {
  const base = db.occupancy[spaceId]?.[dateIso];
  // Para datas sem dados, gera um padrão determinístico (protótipo)
  const hours = base
    ? [...base]
    : [8, 9, 14, 19].map((h) => h + (parseDate(dateIso).getDate() % 3));
  for (const r of db.reservations) {
    if (r.spaceId === spaceId && r.date === dateIso && r.status === 'aprovada') {
      for (let h = Math.floor(toMin(r.start) / 60); h < Math.ceil(toMin(r.end) / 60); h++) hours.push(h);
    }
  }
  return [...new Set(hours)];
}

const PERIOD_RANGES = { manha: [7, 12], tarde: [13, 18], noite: [18, 22] };

function spaceWithAvailability(s, dateIso, period) {
  const busy = busyHours(s.id, dateIso);
  const slots = [];
  for (let h = 7; h < 22; h++) slots.push({ hour: h, label: `${String(h).padStart(2, '0')}:00`, free: !busy.includes(h) });
  const [from, to] = PERIOD_RANGES[period] || [7, 22];
  const inRange = slots.filter((sl) => sl.hour >= from && sl.hour < to);
  const freeCount = inRange.filter((sl) => sl.free).length;
  const nowHour = new Date().getHours();
  const isToday = dateIso === isoDate(new Date());
  return {
    ...s,
    slots,
    freeCount,
    totalCount: inRange.length,
    status: freeCount === 0 ? 'ocupado' : freeCount === inRange.length ? 'livre' : 'parcial',
    freeNow: isToday ? !busy.includes(nowHour) : null,
  };
}

function decorateReservation(r) {
  const space = db.spaces.find((s) => s.id === r.spaceId);
  return { ...r, spaceName: space?.name, spaceBlock: space?.block, approver: space?.approver, statusLabel: STATUS_LABEL[r.status] };
}

function canSee(person) {
  const p = db.profile;
  if (db.connections.includes(person.id)) return true;
  if (person.visibility === 'todos') return true;
  if (person.visibility === 'curso') return person.course === p.course;
  return false;
}

function decoratePerson(person) {
  const visible = canSee(person);
  const common = person.interests.filter((i) => db.profile.interests.includes(i));
  return visible
    ? { ...person, restricted: false, common, invited: db.connections.includes(person.id) }
    : { id: person.id, name: person.name.split(' ')[0] + ' ' + person.name.split(' ').slice(-1)[0][0] + '.', avatar: person.avatar, course: null, period: null, interests: person.interests, visibility: person.visibility, restricted: true, common, invited: db.connections.includes(person.id) };
}

function decorateGroup(g) {
  return {
    ...g,
    memberCount: g.members.length,
    memberPeople: g.members.map((id) => db.people.find((p) => p.id === id)).filter(Boolean).map(decoratePerson),
    isMember: g.members.includes('me'),
    requested: db.joinRequests.includes(g.id),
    invitedPeople: g.invites.map((id) => db.people.find((p) => p.id === id)).filter(Boolean).map((p) => ({ id: p.id, name: p.name, avatar: p.avatar })),
  };
}

function estimateReach(audience = {}) {
  const courses = audience.courses?.length ? audience.courses : COURSES;
  const periodsCount = audience.periods?.length || 8;
  let total = 0;
  for (const c of courses) total += Math.round((STUDENTS_PER_PERIOD[c] || 30) * periodsCount);
  if (audience.interests?.length) total = Math.round(total * Math.min(1, 0.25 * audience.interests.length));
  return total;
}

// ---------- referência ----------
api.get('/meta', (req, res) => {
  res.json({ courses: COURSES, interests: INTERESTS, roles: ROLES, today: db.todayIso, tomorrow: db.tomorrowIso });
});

// ---------- perfil (T01) ----------
api.get('/me', (req, res) => res.json(db.profile));

// Nome padrão de cada perfil simulado (trocado ao alternar o perfil, se o nome não foi personalizado)
const PERSONAS = { estudante: 'Ana Souza', professor: 'Prof. Carlos Mendes', servidor: 'Rita Oliveira', gestor: 'Paulo Henrique' };

api.put('/me', (req, res) => {
  const { role, name } = req.body;
  if (role && role !== db.profile.role && !name && Object.values(PERSONAS).includes(db.profile.name)) {
    db.profile.name = PERSONAS[role];
  }
  const allowed = ['onboarded', 'role', 'name', 'course', 'period', 'interests', 'privacy', 'notifications', 'homeOrder'];
  for (const k of allowed) if (k in req.body) db.profile[k] = req.body[k];
  if (db.profile.period) db.profile.period = Number(db.profile.period);
  res.json(db.profile);
});

// ---------- home (T02) ----------
api.get('/home', (req, res) => {
  const classes = classesFor(db.todayIso);
  // Relógio simulado (início do dia) para que a demonstração da mudança de sala funcione em qualquer horário da sessão
  const upcoming = classes.filter((c) => c.change?.type !== 'cancelada');
  const recommended = db.events
    .filter((e) => audienceMatches(e, db.profile))
    .map(decorateEvent)
    .filter((e) => e.reason)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  const nextEvents = db.events
    .map(decorateEvent)
    .filter((e) => e.enrolledByMe)
    .sort((a, b) => a.date.localeCompare(b.date));
  res.json({
    date: db.todayIso,
    weekday: WEEKDAYS[parseDate(db.todayIso).getDay()],
    nextClass: upcoming[0] || classes[0] || null,
    classes,
    changes: classes.filter((c) => c.change).length,
    notices: db.notices,
    recommended,
    myEvents: nextEvents,
    unread: db.notifications.filter((n) => !n.read).length,
    pendingReservations: db.reservations.filter((r) => r.requester === db.profile.name && r.status === 'em_analise').length,
  });
});

// ---------- eventos e oportunidades (T03) ----------
api.get('/events', (req, res) => {
  const { type, q, interest, onlyForMe, mine } = req.query;
  let list = db.events.map(decorateEvent);
  if (type) list = list.filter((e) => e.type === type);
  if (interest) list = list.filter((e) => e.interests.includes(interest));
  if (q) {
    const s = q.toLowerCase();
    list = list.filter((e) => `${e.title} ${e.description} ${e.organizer}`.toLowerCase().includes(s));
  }
  if (onlyForMe === '1') list = list.filter((e) => e.forMe);
  if (mine === '1') list = list.filter((e) => e.enrolledByMe);
  // Público-alvo restrito: estudantes fora do público não veem
  if (db.profile.role === 'estudante') list = list.filter((e) => e.forMe);
  list.sort((a, b) => a.date.localeCompare(b.date));
  res.json(list);
});

api.get('/events/:id', (req, res) => {
  const ev = db.events.find((e) => e.id === req.params.id);
  if (!ev) return res.status(404).json({ error: 'Evento não encontrado' });
  res.json(decorateEvent(ev));
});

api.post('/events/:id/enroll', (req, res) => {
  const ev = db.events.find((e) => e.id === req.params.id);
  if (!ev) return res.status(404).json({ error: 'Evento não encontrado' });
  const i = db.enrollments.indexOf(ev.id);
  if (i >= 0) {
    db.enrollments.splice(i, 1);
    ev.enrolled = Math.max(0, ev.enrolled - 1);
  } else {
    if (ev.seats > 0 && ev.enrolled >= ev.seats) return res.status(409).json({ error: 'Vagas esgotadas. Você foi adicionada(o) à lista de espera (simulado).' });
    db.enrollments.push(ev.id);
    ev.enrolled += 1;
  }
  res.json(decorateEvent(ev));
});

// ---------- agenda (T04) ----------
api.get('/schedule', (req, res) => {
  const base = parseDate(db.todayIso);
  const monday = new Date(base);
  monday.setDate(base.getDate() - (base.getDay() - 1));
  const days = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = isoDate(d);
    days.push({ date: iso, weekday: WEEKDAYS[d.getDay()], isToday: iso === db.todayIso, classes: classesFor(iso) });
  }
  // Inclui o "amanhã" quando cai na semana seguinte (ex.: hoje é sexta)
  if (!days.some((d) => d.date === db.tomorrowIso)) {
    const d = parseDate(db.tomorrowIso);
    days.push({ date: db.tomorrowIso, weekday: WEEKDAYS[d.getDay()] + ' (próx.)', isToday: false, classes: classesFor(db.tomorrowIso) });
  }
  res.json({ today: db.todayIso, days });
});

// ---------- espaços (T05) ----------
api.get('/spaces', (req, res) => {
  const { type, date = db.todayIso, period, capacity, equipment, q } = req.query;
  let list = db.spaces.map((s) => spaceWithAvailability(s, date, period));
  if (type) list = list.filter((s) => s.type === type);
  if (capacity) list = list.filter((s) => s.capacity >= Number(capacity));
  if (equipment) list = list.filter((s) => s.equipment.some((e) => e.toLowerCase().includes(equipment.toLowerCase())));
  if (q) list = list.filter((s) => `${s.name} ${s.block}`.toLowerCase().includes(q.toLowerCase()));
  res.json({ date, period: period || null, spaces: list });
});

api.get('/spaces/:id', (req, res) => {
  const s = db.spaces.find((x) => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Espaço não encontrado' });
  res.json(spaceWithAvailability(s, req.query.date || db.todayIso, req.query.period));
});

api.get('/reservations', (req, res) => {
  const { scope } = req.query; // mine | all
  let list = db.reservations;
  if (scope !== 'all') list = list.filter((r) => r.requester === db.profile.name);
  res.json(list.map(decorateReservation).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

api.post('/reservations', (req, res) => {
  const { spaceId, date, start, end, purpose, people } = req.body;
  const space = db.spaces.find((s) => s.id === spaceId);
  if (!space) return res.status(400).json({ error: 'Espaço inválido' });
  if (!date || !start || !end || !purpose) return res.status(400).json({ error: 'Preencha data, horário e finalidade.' });
  if (toMin(end) <= toMin(start)) return res.status(400).json({ error: 'O horário final deve ser depois do inicial.' });
  if (Number(people) > space.capacity) return res.status(400).json({ error: `A capacidade de ${space.name} é de ${space.capacity} pessoas.` });
  const busy = busyHours(spaceId, date);
  for (let h = Math.floor(toMin(start) / 60); h < Math.ceil(toMin(end) / 60); h++) {
    if (busy.includes(h)) return res.status(409).json({ error: `Conflito: ${space.name} está ocupado às ${String(h).padStart(2, '0')}:00.` });
  }
  const auto = space.approver === 'Sistema' && toMin(end) - toMin(start) <= 180;
  const now = db.todayIso;
  const r = {
    id: nextId('r'),
    spaceId,
    date,
    start,
    end,
    purpose,
    people: Number(people) || 1,
    status: auto ? 'aprovada' : 'em_analise',
    requester: db.profile.name,
    createdAt: now,
    history: auto
      ? [{ status: 'enviada', at: now }, { status: 'aprovada', at: now, note: 'Aprovação automática (sala de estudos, até 3h).' }]
      : [{ status: 'enviada', at: now }, { status: 'em_analise', at: now, note: `Aguardando ${space.approver}.` }],
  };
  db.reservations.push(r);
  db.notifications.unshift({ id: nextId('nt'), kind: 'reserva', title: auto ? 'Reserva aprovada' : 'Solicitação enviada', text: `${space.name} — ${date.split('-').reverse().join('/')} ${start}–${end}.`, at: 'agora', read: false, link: '#/espacos/solicitacoes' });
  res.status(201).json(decorateReservation(r));
});

api.patch('/reservations/:id', (req, res) => {
  const r = db.reservations.find((x) => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Solicitação não encontrada' });
  const { status, note } = req.body;
  if (!STATUS_LABEL[status]) return res.status(400).json({ error: 'Status inválido' });
  r.status = status;
  r.history.push({ status, at: db.todayIso, note: note || (status === 'cancelada' ? 'Cancelada pelo solicitante.' : `Decisão de ${db.profile.name}.`) });
  res.json(decorateReservation(r));
});

// ---------- pessoas e grupos (T06/T07) ----------
api.get('/people', (req, res) => {
  const { interest, q } = req.query;
  let list = db.people;
  if (interest) list = list.filter((p) => p.interests.includes(interest));
  if (q) list = list.filter((p) => `${p.name} ${p.interests.join(' ')}`.toLowerCase().includes(q.toLowerCase()));
  res.json(list.map(decoratePerson).sort((a, b) => b.common.length - a.common.length));
});

api.post('/people/:id/invite', (req, res) => {
  const p = db.people.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Pessoa não encontrada' });
  if (!db.connections.includes(p.id)) db.connections.push(p.id);
  res.json(decoratePerson(p));
});

api.post('/people/:id/report', (req, res) => {
  res.json({ ok: true, message: 'Denúncia registrada. A moderação irá analisar (simulado).' });
});

api.get('/groups', (req, res) => {
  const { interest, q } = req.query;
  let list = db.groups;
  if (interest) list = list.filter((g) => g.interest === interest);
  if (q) list = list.filter((g) => `${g.name} ${g.description} ${g.interest}`.toLowerCase().includes(q.toLowerCase()));
  // Grupos "só convidados" aparecem, mas sem detalhes de membros
  res.json(list.map(decorateGroup));
});

api.get('/groups/:id', (req, res) => {
  const g = db.groups.find((x) => x.id === req.params.id);
  if (!g) return res.status(404).json({ error: 'Grupo não encontrado' });
  res.json(decorateGroup(g));
});

api.post('/groups', (req, res) => {
  const { name, description, interest, visibility, max, meeting, invites = [] } = req.body;
  if (!name || !interest) return res.status(400).json({ error: 'Informe nome e tema do grupo.' });
  const g = { id: nextId('g'), name, description: description || '', interest, visibility: visibility || 'publico', members: ['me'], max: Number(max) || 10, meeting: meeting || 'A combinar', owner: 'me', invites };
  db.groups.unshift(g);
  res.status(201).json(decorateGroup(g));
});

api.post('/groups/:id/join', (req, res) => {
  const g = db.groups.find((x) => x.id === req.params.id);
  if (!g) return res.status(404).json({ error: 'Grupo não encontrado' });
  if (g.members.includes('me')) {
    g.members = g.members.filter((m) => m !== 'me');
  } else if (g.visibility === 'publico') {
    if (g.members.length >= g.max) return res.status(409).json({ error: 'Grupo lotado.' });
    g.members.push('me');
  } else if (!db.joinRequests.includes(g.id)) {
    db.joinRequests.push(g.id);
  }
  res.json(decorateGroup(g));
});

api.post('/groups/:id/invite', (req, res) => {
  const g = db.groups.find((x) => x.id === req.params.id);
  if (!g) return res.status(404).json({ error: 'Grupo não encontrado' });
  for (const id of req.body.people || []) if (!g.invites.includes(id)) g.invites.push(id);
  res.json(decorateGroup(g));
});

// ---------- publicação (T08) ----------
api.post('/reach', (req, res) => res.json({ reach: estimateReach(req.body.audience) }));

api.get('/posts', (req, res) => res.json(db.posts));

api.post('/posts', (req, res) => {
  const { type, title, description, date, time, place, seats, requiresSignup, audience, interests = [], channels = [] } = req.body;
  if (!type || !title || !date) return res.status(400).json({ error: 'Informe tipo, título e data.' });
  const reach = estimateReach({ ...audience, interests });
  const ev = {
    id: nextId('e'),
    type,
    title,
    description: description || '',
    date,
    time: time || '00:00',
    place: place || 'A definir',
    organizer: db.profile.name,
    interests,
    audience: { courses: audience?.courses || [], periods: (audience?.periods || []).map(Number) },
    seats: Number(seats) || 0,
    enrolled: 0,
    hours: 0,
    requiresSignup: !!requiresSignup,
    fromPost: true,
    channels,
    reach,
    publishedAt: db.todayIso,
  };
  db.events.push(ev);
  db.posts.unshift(ev);
  res.status(201).json(ev);
});

// ---------- painel do gestor (T09) ----------
api.get('/dashboard', (req, res) => {
  const { month = 'atual', course = '' } = req.query;
  // Dados simulados: um fator determinístico varia os números conforme os filtros
  const mFactor = { atual: 1, anterior: 0.86, trimestre: 2.7 }[month] || 1;
  const cFactor = course ? 0.18 + (course.length % 5) * 0.03 : 1;
  const f = mFactor * cFactor;
  const n = (v) => Math.max(1, Math.round(v * f));

  const spaces = [
    { label: 'Lab. 2 (GPU)', value: n(142) },
    { label: 'Sala de Estudos 1', value: n(131) },
    { label: 'Espaço Maker', value: n(97) },
    { label: 'Sala de Estudos 2', value: n(88) },
    { label: 'Lab. 1', value: n(64) },
    { label: 'Auditório 1', value: n(21) },
  ];
  const activities = [
    { label: 'Hackathon Cidades Sustentáveis', value: n(212) },
    { label: 'IA Generativa na prática', value: n(187) },
    { label: 'Python para Ciência de Dados', value: n(163) },
    { label: 'Semana de Empreendedorismo', value: n(142) },
    { label: 'Inglês instrumental', value: n(98) },
    { label: 'Mostra Cultural', value: n(55) },
  ];
  const services = [
    { label: 'Agenda de aulas', value: n(2410) },
    { label: 'Eventos e oportunidades', value: n(1380) },
    { label: 'Reserva de espaços', value: n(612) },
    { label: 'Editais', value: n(540) },
    { label: 'Grupos de estudo', value: n(305) },
  ];
  const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'].map((label, i) => ({ label, value: n([780, 910, 1240, 1105][i]) }));
  const reqs = n(486);
  const approved = Math.round(reqs * 0.78);
  res.json({
    filters: { month, course },
    kpis: [
      { label: 'Usuários ativos', value: n(1834), delta: '+12%' },
      { label: 'Solicitações de espaço', value: reqs, delta: '+8%' },
      { label: 'Inscrições em eventos', value: n(857), delta: '+21%' },
      { label: 'Taxa de aprovação', value: `${Math.round((approved / reqs) * 100)}%`, delta: '−3 p.p.' },
    ],
    spaces,
    activities,
    services,
    weeks,
    note: 'Dados fictícios para discussão. Quais indicadores ajudariam na sua decisão?',
  });
});

// ---------- notificações ----------
api.get('/notifications', (req, res) => res.json(db.notifications));
api.post('/notifications/read', (req, res) => {
  db.notifications.forEach((n) => (n.read = true));
  res.json({ ok: true });
});

// ---------- modo sessão: registro de achados (seção 7) ----------
api.get('/session', (req, res) => res.json({ findings: db.findings, taskResults: db.taskResults }));

api.post('/findings', (req, res) => {
  const { session, participant, screen, observation, type, requirement, priority } = req.body;
  if (!observation) return res.status(400).json({ error: 'Descreva a observação.' });
  const f = { id: nextId('f'), session: session || '1', participant: participant || '', screen: screen || '', observation, type: type || 'Sugestão', requirement: requirement || '', priority: priority || 'Média', at: new Date().toISOString() };
  db.findings.push(f);
  res.status(201).json(f);
});

api.delete('/findings/:id', (req, res) => {
  db.findings = db.findings.filter((f) => f.id !== req.params.id);
  res.json({ ok: true });
});

api.put('/tasks/:id', (req, res) => {
  db.taskResults[req.params.id] = { ...req.body, at: new Date().toISOString() };
  res.json(db.taskResults[req.params.id]);
});

api.delete('/tasks/:id', (req, res) => {
  delete db.taskResults[req.params.id];
  res.json({ ok: true });
});

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

api.get('/findings.csv', (req, res) => {
  const header = ['Sessão', 'Participante (perfil)', 'Tela/Funcionalidade', 'Observação ou citação', 'Tipo', 'Requisito derivado', 'Prioridade', 'Registrado em'];
  const rows = db.findings.map((f) => [f.session, f.participant, f.screen, f.observation, f.type, f.requirement, f.priority, f.at]);
  const csv = '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(';')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="achados-campus-plus.csv"');
  res.send(csv);
});

// Reinicia os dados de demonstração entre participantes. Os achados da sessão são mantidos, a menos que ?all=1.
api.post('/reset', (req, res) => {
  const { findings, taskResults } = db;
  resetDb();
  if (req.query.all !== '1') Object.assign(db, { findings, taskResults });
  res.json({ ok: true });
});

export default api;
