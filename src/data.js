// Dados fictícios (porém realistas) do protótipo Campus+.
// Tudo fica em memória e volta ao estado inicial com POST /api/reset ou reiniciando o servidor.

export const COURSES = [
  'Ciência da Computação',
  'Sistemas de Informação',
  'Engenharia Civil',
  'Administração',
  'Pedagogia',
  'Letras',
  'Farmácia',
];

export const INTERESTS = [
  'Inteligência Artificial',
  'Desenvolvimento Web',
  'Ciência de Dados',
  'Empreendedorismo',
  'Robótica',
  'Pesquisa Científica',
  'Estágio e Carreira',
  'Monitoria',
  'Sustentabilidade',
  'Cultura e Arte',
  'Esportes',
  'Idiomas',
];

export const ROLES = {
  estudante: 'Estudante',
  professor: 'Professor / Organizador',
  servidor: 'Servidor',
  gestor: 'Gestor',
};

// ---------- utilidades de data ----------
const pad = (n) => String(n).padStart(2, '0');
export const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

// Próximo dia útil a partir de "base" (inclusive)
function nextWeekday(base) {
  let d = new Date(base);
  while (d.getDay() === 0 || d.getDay() === 6) d = addDays(d, 1);
  return d;
}

export function today() {
  return nextWeekday(new Date());
}

// ---------- seed ----------
function buildSeed() {
  const t = today();
  const tomorrow = nextWeekday(addDays(t, 1));
  const d = (n) => isoDate(addDays(t, n));

  const profile = {
    onboarded: false,
    role: 'estudante',
    name: 'Ana Souza',
    email: 'ana.souza@aluno.ueg.br',
    course: 'Ciência da Computação',
    period: 5,
    campus: 'Campus Central — Anápolis',
    interests: ['Inteligência Artificial', 'Ciência de Dados'],
    privacy: {
      visibility: 'curso', // todos | curso | convite
      shareSchedule: true,
      shareLocation: false,
      showInterests: true,
    },
    notifications: {
      channels: ['push'],
      types: ['mudanca_aula', 'reserva', 'eventos_interesse'],
      quietHours: true,
    },
    homeOrder: ['proxima_aula', 'avisos', 'recomendados', 'agenda', 'eventos'],
  };

  // Grade semanal (1 = segunda ... 5 = sexta)
  const classes = [
    { id: 'c1', weekday: 1, start: '07:30', end: '09:10', subject: 'Inteligência Artificial', teacher: 'Prof. Carlos Mendes', room: 'Sala 204', block: 'Bloco B', mode: 'presencial' },
    { id: 'c2', weekday: 1, start: '09:30', end: '11:10', subject: 'Engenharia de Software II', teacher: 'Profa. Juliana Rocha', room: 'Lab. 3', block: 'Bloco C', mode: 'presencial' },
    { id: 'c3', weekday: 2, start: '07:30', end: '09:10', subject: 'Banco de Dados II', teacher: 'Prof. Ricardo Alves', room: 'Lab. 1', block: 'Bloco C', mode: 'presencial' },
    { id: 'c4', weekday: 2, start: '09:30', end: '11:10', subject: 'Computação Gráfica', teacher: 'Prof. Marcos Lima', room: 'Sala 105', block: 'Bloco A', mode: 'presencial' },
    { id: 'c5', weekday: 3, start: '07:30', end: '09:10', subject: 'Redes de Computadores', teacher: 'Profa. Fernanda Dias', room: 'Sala 210', block: 'Bloco B', mode: 'presencial' },
    { id: 'c6', weekday: 3, start: '09:30', end: '11:10', subject: 'Inteligência Artificial', teacher: 'Prof. Carlos Mendes', room: 'Lab. 2', block: 'Bloco C', mode: 'presencial' },
    { id: 'c7', weekday: 4, start: '07:30', end: '09:10', subject: 'Engenharia de Software II', teacher: 'Profa. Juliana Rocha', room: 'Sala 204', block: 'Bloco B', mode: 'presencial' },
    { id: 'c8', weekday: 4, start: '09:30', end: '11:10', subject: 'Metodologia Científica', teacher: 'Profa. Helena Prado', room: 'Remoto', block: '—', mode: 'remoto', link: 'https://meet.exemplo.ueg.br/metodologia' },
    { id: 'c9', weekday: 5, start: '07:30', end: '09:10', subject: 'Banco de Dados II', teacher: 'Prof. Ricardo Alves', room: 'Lab. 1', block: 'Bloco C', mode: 'presencial' },
    { id: 'c10', weekday: 5, start: '09:30', end: '11:10', subject: 'Computação Gráfica', teacher: 'Prof. Marcos Lima', room: 'Sala 105', block: 'Bloco A', mode: 'presencial' },
  ];

  // Mudanças pontuais — sempre aplicadas a "hoje" e "amanhã" para a demonstração funcionar em qualquer dia
  const todaysClasses = classes.filter((c) => c.weekday === t.getDay());
  const tomorrowsClasses = classes.filter((c) => c.weekday === tomorrow.getDay());
  const classChanges = [];
  if (todaysClasses[0]) {
    classChanges.push({ classId: todaysClasses[0].id, date: isoDate(t), type: 'sala', newRoom: 'Auditório 1', newBlock: 'Bloco A', note: 'Mudança por manutenção do ar-condicionado.', at: '06:45' });
  }
  if (todaysClasses[1]) {
    classChanges.push({ classId: todaysClasses[1].id, date: isoDate(t), type: 'remoto', link: 'https://meet.exemplo.ueg.br/aula-remota', note: 'Professor em congresso; aula será on-line.', at: 'ontem, 18:20' });
  }
  if (tomorrowsClasses[0]) {
    classChanges.push({ classId: tomorrowsClasses[0].id, date: isoDate(tomorrow), type: 'cancelada', note: 'Aula cancelada. Reposição em data a definir.', at: 'hoje, 08:10' });
  }

  const events = [
    { id: 'e1', type: 'Palestra', title: 'IA Generativa na prática: do protótipo ao produto', date: d(3), time: '19:00', place: 'Auditório 1 — Bloco A', organizer: 'Liga Acadêmica de IA', interests: ['Inteligência Artificial', 'Desenvolvimento Web'], audience: { courses: ['Ciência da Computação', 'Sistemas de Informação'], periods: [] }, seats: 120, enrolled: 87, hours: 3, description: 'Palestra com profissionais do mercado sobre como levar soluções de IA generativa a produção: custos, ética, avaliação e boas práticas.', requiresSignup: true },
    { id: 'e2', type: 'Curso', title: 'Python para Ciência de Dados (extensão — 20h)', date: d(8), time: '14:00', place: 'Lab. 2 — Bloco C', organizer: 'Pró-Reitoria de Extensão', interests: ['Ciência de Dados', 'Inteligência Artificial'], audience: { courses: [], periods: [] }, seats: 30, enrolled: 26, hours: 20, description: 'Curso extracurricular com certificado. Pandas, visualização de dados e introdução a modelos preditivos.', requiresSignup: true },
    { id: 'e3', type: 'Evento', title: 'Semana de Empreendedorismo Universitário', date: d(12), time: '08:00', place: 'Centro de Convivência', organizer: 'Empresa Júnior', interests: ['Empreendedorismo', 'Estágio e Carreira'], audience: { courses: [], periods: [] }, seats: 300, enrolled: 142, hours: 10, description: 'Rodas de conversa, pitch de startups e oficinas de modelagem de negócios.', requiresSignup: true },
    { id: 'e4', type: 'Oportunidade', title: 'Estágio em Desenvolvimento Web — Prefeitura', date: d(15), time: '23:59', place: 'On-line', organizer: 'Central de Estágios', interests: ['Estágio e Carreira', 'Desenvolvimento Web'], audience: { courses: ['Ciência da Computação', 'Sistemas de Informação'], periods: [4, 5, 6, 7, 8] }, seats: 4, enrolled: 0, hours: 0, description: 'Bolsa de R$ 1.100 + auxílio-transporte. 20h semanais. Inscrições até a data indicada.', requiresSignup: true },
    { id: 'e5', type: 'Edital', title: 'Edital PIBIC 2026/2027 — Iniciação Científica', date: d(20), time: '23:59', place: 'On-line', organizer: 'Pró-Reitoria de Pesquisa', interests: ['Pesquisa Científica'], audience: { courses: [], periods: [] }, seats: 60, enrolled: 0, hours: 0, description: 'Seleção de bolsistas de iniciação científica. Documentos: histórico, plano de trabalho e carta do orientador.', requiresSignup: false, link: 'https://www.exemplo.ueg.br/editais/pibic-2026' },
    { id: 'e6', type: 'Edital', title: 'Edital de Monitoria — 2º semestre', date: d(6), time: '17:00', place: 'Secretaria Acadêmica', organizer: 'Coordenação de Graduação', interests: ['Monitoria'], audience: { courses: [], periods: [] }, seats: 25, enrolled: 0, hours: 0, description: 'Vagas de monitoria remunerada e voluntária para diversas disciplinas.', requiresSignup: false, link: 'https://www.exemplo.ueg.br/editais/monitoria' },
    { id: 'e7', type: 'Evento', title: 'Hackathon Cidades Sustentáveis', date: d(18), time: '09:00', place: 'Bloco C — Laboratórios', organizer: 'Núcleo de Inovação', interests: ['Sustentabilidade', 'Desenvolvimento Web', 'Inteligência Artificial'], audience: { courses: [], periods: [] }, seats: 80, enrolled: 54, hours: 24, description: '24h de desenvolvimento de soluções para problemas urbanos. Equipes de 3 a 5 pessoas.', requiresSignup: true },
    { id: 'e8', type: 'Evento', title: 'Mostra Cultural: Música e Poesia no Campus', date: d(5), time: '18:30', place: 'Praça Central', organizer: 'Diretório Central dos Estudantes', interests: ['Cultura e Arte'], audience: { courses: [], periods: [] }, seats: 0, enrolled: 0, hours: 2, description: 'Apresentações abertas de alunos e servidores. Entrada livre.', requiresSignup: false },
    { id: 'e9', type: 'Curso', title: 'Inglês instrumental para leitura de artigos', date: d(10), time: '16:00', place: 'Sala 105 — Bloco A', organizer: 'Centro de Idiomas', interests: ['Idiomas', 'Pesquisa Científica'], audience: { courses: [], periods: [] }, seats: 35, enrolled: 35, hours: 30, description: 'Turma com vagas esgotadas — entre na lista de espera.', requiresSignup: true },
    { id: 'e10', type: 'Evento', title: 'Torneio Interatléticas de Futsal', date: d(9), time: '15:00', place: 'Ginásio', organizer: 'Atlética Unificada', interests: ['Esportes'], audience: { courses: [], periods: [] }, seats: 0, enrolled: 0, hours: 0, description: 'Venha torcer pelo seu curso!', requiresSignup: false },
  ];

  const notices = [
    { id: 'n1', title: 'Rematrícula aberta até sexta-feira', source: 'Secretaria Acadêmica', priority: 'alta', date: d(0) },
    { id: 'n2', title: 'Biblioteca com horário estendido na semana de provas', source: 'Biblioteca', priority: 'normal', date: d(-1) },
    { id: 'n3', title: 'Restaurante universitário: cardápio vegetariano às quartas', source: 'RU', priority: 'baixa', date: d(-2) },
  ];

  const spaces = [
    { id: 's1', name: 'Sala de Estudos 1', type: 'Sala de estudos', block: 'Biblioteca', capacity: 8, equipment: ['TV', 'Quadro branco', 'Tomadas'], approval: 'Automática (até 3h)', approver: 'Sistema', x: 64, y: 22 },
    { id: 's2', name: 'Sala de Estudos 2', type: 'Sala de estudos', block: 'Biblioteca', capacity: 6, equipment: ['Quadro branco', 'Tomadas'], approval: 'Automática (até 3h)', approver: 'Sistema', x: 82, y: 34 },
    { id: 's3', name: 'Lab. 1', type: 'Laboratório', block: 'Bloco C', capacity: 30, equipment: ['30 computadores', 'Projetor', 'Ar-condicionado'], approval: 'Responsável pelo laboratório', approver: 'Técnico do Bloco C', x: 19, y: 78 },
    { id: 's4', name: 'Lab. 2', type: 'Laboratório', block: 'Bloco C', capacity: 25, equipment: ['25 computadores', 'GPU', 'Projetor'], approval: 'Responsável pelo laboratório', approver: 'Técnico do Bloco C', x: 36, y: 86 },
    { id: 's5', name: 'Sala 204', type: 'Sala de aula', block: 'Bloco B', capacity: 45, equipment: ['Projetor', 'Ar-condicionado'], approval: 'Coordenação do curso', approver: 'Coordenação', x: 58, y: 72 },
    { id: 's6', name: 'Sala 105', type: 'Sala de aula', block: 'Bloco A', capacity: 40, equipment: ['Projetor'], approval: 'Coordenação do curso', approver: 'Coordenação', x: 26, y: 40 },
    { id: 's7', name: 'Auditório 1', type: 'Auditório', block: 'Bloco A', capacity: 150, equipment: ['Som', 'Projetor', 'Microfones', 'Ar-condicionado'], approval: 'Direção do câmpus', approver: 'Direção', x: 12, y: 22 },
    { id: 's8', name: 'Espaço Maker', type: 'Laboratório', block: 'Núcleo de Inovação', capacity: 15, equipment: ['Impressora 3D', 'Kits Arduino', 'Bancadas'], approval: 'Responsável pelo laboratório', approver: 'Núcleo de Inovação', x: 85, y: 86 },
  ];

  // Ocupação fixa por espaço/dia — slots de 1h entre 07h e 22h
  const occupancy = {};
  const busyPatterns = {
    s1: [9, 10, 14], s2: [8, 15, 16, 17], s3: [7, 8, 9, 10, 19, 20], s4: [9, 10, 14, 15, 16],
    s5: [7, 8, 9, 10, 19, 20, 21], s6: [9, 10, 11, 19, 20], s7: [19, 20, 21], s8: [13, 14],
  };
  for (const s of spaces) {
    occupancy[s.id] = {
      [isoDate(t)]: busyPatterns[s.id],
      [isoDate(tomorrow)]: busyPatterns[s.id].map((h) => (h + 1 > 21 ? h : h + 1)),
    };
  }

  const reservations = [
    { id: 'r1', spaceId: 's3', date: isoDate(tomorrow), start: '19:00', end: '21:00', purpose: 'Treinamento de modelo do TCC', people: 3, status: 'em_analise', requester: 'Ana Souza', createdAt: d(-1), history: [{ status: 'enviada', at: d(-1) }, { status: 'em_analise', at: d(0) }] },
    { id: 'r2', spaceId: 's7', date: d(14), start: '18:00', end: '22:00', purpose: 'Colação simbólica da turma', people: 120, status: 'em_analise', requester: 'Bruno Carvalho (Engenharia Civil)', createdAt: d(-2), history: [{ status: 'enviada', at: d(-2) }, { status: 'em_analise', at: d(-1) }] },
    { id: 'r3', spaceId: 's8', date: d(4), start: '14:00', end: '17:00', purpose: 'Protótipo de robô seguidor de linha', people: 4, status: 'em_analise', requester: 'Lucas Martins (Ciência da Computação)', createdAt: d(-1), history: [{ status: 'enviada', at: d(-1) }] },
    { id: 'r4', spaceId: 's1', date: d(-3), start: '14:00', end: '16:00', purpose: 'Estudo para prova de BD', people: 5, status: 'aprovada', requester: 'Ana Souza', createdAt: d(-5), history: [{ status: 'enviada', at: d(-5) }, { status: 'aprovada', at: d(-5), note: 'Aprovação automática' }] },
  ];

  const people = [
    { id: 'p1', name: 'Lucas Martins', course: 'Ciência da Computação', period: 5, interests: ['Inteligência Artificial', 'Robótica'], visibility: 'todos', bio: 'Curto visão computacional e robótica.', avatar: 'LM' },
    { id: 'p2', name: 'Beatriz Nunes', course: 'Sistemas de Informação', period: 3, interests: ['Inteligência Artificial', 'Ciência de Dados'], visibility: 'curso', bio: 'Monitora de Estatística.', avatar: 'BN' },
    { id: 'p3', name: 'Rafael Costa', course: 'Ciência da Computação', period: 7, interests: ['Inteligência Artificial', 'Pesquisa Científica'], visibility: 'convite', bio: '', avatar: 'RC' },
    { id: 'p4', name: 'Mariana Alves', course: 'Administração', period: 4, interests: ['Empreendedorismo', 'Ciência de Dados'], visibility: 'todos', bio: 'Fundadora da Empresa Júnior.', avatar: 'MA' },
    { id: 'p5', name: 'João Pedro Lima', course: 'Ciência da Computação', period: 5, interests: ['Desenvolvimento Web', 'Inteligência Artificial'], visibility: 'todos', bio: 'Front-end e um pouco de ML.', avatar: 'JL' },
    { id: 'p6', name: 'Camila Ferreira', course: 'Engenharia Civil', period: 6, interests: ['Sustentabilidade'], visibility: 'todos', bio: '', avatar: 'CF' },
    { id: 'p7', name: 'Thiago Ribeiro', course: 'Sistemas de Informação', period: 5, interests: ['Inteligência Artificial', 'Estágio e Carreira'], visibility: 'curso', bio: 'Procurando grupo para estudar para certificações.', avatar: 'TR' },
    { id: 'p8', name: 'Larissa Gomes', course: 'Letras', period: 2, interests: ['Idiomas', 'Cultura e Arte'], visibility: 'todos', bio: '', avatar: 'LG' },
  ];

  const groups = [
    { id: 'g1', name: 'Grupo de Estudos em IA', description: 'Encontros semanais para estudar machine learning e ler artigos.', interest: 'Inteligência Artificial', visibility: 'publico', members: ['p1', 'p5', 'p7'], max: 12, meeting: 'Quartas, 17h — Sala de Estudos 1', owner: 'p1', invites: [] },
    { id: 'g2', name: 'Kaggle Squad', description: 'Competições de ciência de dados em equipe.', interest: 'Ciência de Dados', visibility: 'curso', members: ['p2', 'p4'], max: 6, meeting: 'On-line, sábados', owner: 'p2', invites: [] },
    { id: 'g3', name: 'IA aplicada à Saúde (pesquisa)', description: 'Grupo ligado a projeto de iniciação científica. Entrada mediante convite.', interest: 'Inteligência Artificial', visibility: 'convite', members: ['p3'], max: 5, meeting: 'Lab. 2, sextas', owner: 'p3', invites: [] },
    { id: 'g4', name: 'Robótica Livre', description: 'Projetos com Arduino no Espaço Maker.', interest: 'Robótica', visibility: 'publico', members: ['p1'], max: 10, meeting: 'Terças, 14h — Espaço Maker', owner: 'p1', invites: [] },
  ];

  const notifications = [
    { id: 'nt1', kind: 'mudanca_aula', title: 'Sala alterada', text: 'Sua aula das 07:30 mudou para o Auditório 1 (Bloco A).', at: 'hoje, 06:45', read: false, link: '#/agenda' },
    { id: 'nt2', kind: 'reserva', title: 'Solicitação em análise', text: 'Lab. 1 — pedido em análise pelo Técnico do Bloco C.', at: 'hoje, 08:00', read: false, link: '#/espacos/solicitacoes' },
    { id: 'nt3', kind: 'eventos_interesse', title: 'Novo evento de IA', text: 'IA Generativa na prática — restam 33 vagas.', at: 'ontem', read: true, link: '#/eventos/e1' },
  ];

  return {
    profile,
    classes,
    classChanges,
    events,
    notices,
    spaces,
    occupancy,
    reservations,
    people,
    groups,
    notifications,
    enrollments: ['e7'],
    connections: [], // ids de pessoas convidadas/conectadas
    joinRequests: [], // ids de grupos solicitados
    posts: [],
    findings: [],
    taskResults: {},
    seq: 100,
    todayIso: isoDate(t),
    tomorrowIso: isoDate(tomorrow),
  };
}

export let db = buildSeed();

export function resetDb() {
  db = buildSeed();
  return db;
}

export function nextId(prefix) {
  db.seq += 1;
  return `${prefix}${db.seq}`;
}

// Número fictício de estudantes por curso/período (para "alcance estimado" e painel)
export const STUDENTS_PER_PERIOD = {
  'Ciência da Computação': 38,
  'Sistemas de Informação': 32,
  'Engenharia Civil': 41,
  Administração: 45,
  Pedagogia: 36,
  Letras: 28,
  Farmácia: 34,
};
