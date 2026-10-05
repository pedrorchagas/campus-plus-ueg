**Projeto:** Campus+

**Técnica atribuída ao grupo:** Prototipação

**Grupo:** 
- Danielly
- Gabriel
- Murilo
- Pedro  (Owner)
- Samir

**Data:** 05/10/2026

---

## 1. Técnica sorteada

**Prototipação.**

Consiste em construir uma versão simplificada do sistema (telas e fluxos navegáveis) e apresentá-la aos possíveis usuários para que reajam, testem tarefas e opinem. As reações revelam requisitos que dificilmente apareceriam apenas em conversas, como o que falta, o que sobra e o que causa confusão.

No Campus+, a técnica é adequada porque a universidade **ainda não definiu completamente** como a plataforma deve funcionar. O protótipo serve como instrumento de **descoberta**, não como entrega final: o objetivo é errar cedo e a baixo custo.

---

## 2. Objetivo da elicitação

Validar e refinar, junto aos envolvidos (estudantes, professores, servidores, coordenadores, organizadores de eventos e gestores), as ideias iniciais do Campus+, transformando-as em **necessidades, expectativas, funcionalidades, regras de negócio e restrições** claras o suficiente para virarem requisitos de software.

**Objetivos específicos:**

- Verificar se a visão inicial do sistema (seções 6.1 a 6.4 do documento-base) corresponde ao que os usuários realmente precisam.
- Identificar funcionalidades ausentes, desnecessárias ou mal compreendidas.
- Descobrir regras de negócio e restrições que ainda não foram explicitadas (por exemplo, quem aprova a reserva de espaços).
- Priorizar as funcionalidades de acordo com o valor percebido pelos usuários.

---

## 3. O que o grupo pretende descobrir

O grupo pretende descobrir requisitos funcionais, não funcionais não determinados pelos usuários e destrinchar melhor as ideias do cliente para desenvolver um produto que encaixe com o que o cliente precisa.

### 3.1 Perguntas-guia

| #   | Pergunta de descoberta                                                                                                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | O que o estudante considera "relevante" ao abrir a plataforma: aulas, avisos, eventos ou oportunidades? Em que ordem?             |
| 2   | Que dados pessoais o estudante aceita compartilhar para obter personalização (curso, período, horários, localização)?             |
| 3   | O estudante usaria a conexão com outros estudantes? Sob quais condições de privacidade e segurança?                               |
| 4   | Quais informações sobre salas e laboratórios são indispensáveis, e quem aprova as solicitações de uso?                            |
| 5   | Como o estudante quer ser avisado sobre mudanças de sala, cancelamento ou aula remota?                                            |
| 6   | Que informações os professores e servidores precisam informar ao divulgar eventos e oportunidades, e como definir o público-alvo? |
| 7   | Que indicadores os gestores precisam para decidir quais serviços e atividades são mais procurados?                                |
| 8   | Que notificações são úteis e quais seriam percebidas como "spam"?                                                                 |

### 3.2 Funcionalidades que precisam ser melhor compreendidas

|ID|Funcionalidade|Por que é incerta|Hipótese a validar|O que o protótipo vai testar|
|---|---|---|---|---|
|F01|**Home personalizada e recomendações**|Não se sabe o que o estudante considera relevante nem que dados aceita compartilhar|O estudante prefere ver aulas do dia e avisos primeiro, e eventos depois|Ordem e hierarquia dos blocos; clareza do texto "recomendado porque..."|
|F02|**Conexão entre estudantes**|Envolve privacidade e moderação; pode gerar rejeição|Estudantes querem encontrar colegas por interesse, mas apenas com perfil restrito ou sob convite|Busca por interesse, criação de grupo, convite e nível de exposição do perfil|
|F03|**Consulta e solicitação de espaços**|Não está claro quem aprova, quais regras valem e se a disponibilidade em tempo real é viável|Estudantes querem ver a disponibilidade e pedir reserva sem sair do aplicativo|Mapa/lista de salas, filtros, formulário de solicitação e acompanhamento do status|
|F04|**Horário de aulas e formato (presencial/remoto)**|O documento cita a dificuldade, mas não define a origem dos dados nem como mudanças serão comunicadas|O estudante quer ver a agenda do dia com alertas de mudança de sala ou cancelamento|Tela de agenda, indicação visual de alterações e notificações|
|F05|**Painel do gestor**|Os indicadores necessários são desconhecidos|O gestor quer ver os serviços e espaços mais procurados por período e curso|Gráficos, filtros e métricas que ele considera úteis|


---

## 4. Estratégia de aplicação da técnica

### 4.1 Tipo e fidelidade do protótipo

| Aspecto    | Definição                                          |
| ---------- | -------------------------------------------------- |
| Tipo       | Protótipo descartável, com foco em exploração      |
| Fidelidade | Baixa a média: wireframes navegáveis               |
| Plataforma | Mobile primeiro, pelo perfil do público estudantil |
| Dados      | Fictícios, porém realistas                         |

### 4.2 Ciclo de aplicação

1. **Preparar:** construir o protótipo e o roteiro de tarefas.
2. **Apresentar:** realizar sessões individuais ou em pequenos grupos com representantes de cada perfil.
3. **Observar:** pedir que o participante execute tarefas pensando em voz alta, sem ajuda do grupo.
4. **Coletar feedback:** aplicar as perguntas do roteiro.
5. **Registrar e analisar:** transformar as observações em requisitos, regras de negócio e restrições.
6. **Refinar:** ajustar o protótipo e repetir o ciclo com novos participantes, se houver tempo.

### 4.3 Participantes

| Perfil                                   | Foco                                                     |
| ---------------------------------------- | -------------------------------------------------------- |
| Estudantes de cursos e períodos variados | Home, eventos, agenda, espaços, conexão entre estudantes |
| Professores e servidores                 | Publicação de conteúdo, aprovação de espaços             |
| Coordenador                              | Divulgação segmentada, regras institucionais             |
| Gestor                                   | Painel de indicadores                                    |

### 4.4 O que será apresentado e o que ficará de fora

**Apresentado:**

- Fluxos principais das funcionalidades F01 a F05.
- Navegação entre telas e hierarquia das informações.
- Textos, rótulos e organização dos conteúdos.

**Fora do escopo do protótipo (será informado aos participantes):**

- Login institucional real (SSO) e integrações externas.
- Regras técnicas de back-end e algoritmo de recomendação (será simulado).
- Design visual final: cores, identidade e animações.

---

## 5. Instrumentos ou materiais preparados

Preparamos um protótipo navegável com as telas T01 a T09, para realizarmos a introdução do projeto, tarifas guiadas e perguntas de feedback com o intuito de encontrar requisitos funcionais e não funcionais não detalhados pelo cliente.

### 5.1 Telas do protótipo

|Tela|Funcionalidade|Fluxo a testar|
|---|---|---|
|T01 — Onboarding e escolha de interesses|Perfil|Cadastro inicial|
|T02 — Home personalizada|F01|Ver o que é relevante hoje|
|T03 — Lista e detalhe de eventos|Eventos|Filtrar e se inscrever|
|T04 — Agenda de aulas|F04|Descobrir a sala da próxima aula e ver uma mudança|
|T05 — Mapa/lista de espaços e solicitação|F03|Encontrar uma sala livre e pedir reserva|
|T06 — Busca de pessoas e grupos|F02|Achar um grupo de estudos de Inteligência Artificial|
|T07 — Criação de grupo e convite|F02|Convidar colegas|
|T08 — Publicação de conteúdo (professor/organizador)|Divulgação|Publicar um evento para um público específico|
|T09 — Dashboard do gestor|F05|Interpretar os indicadores|

---

## 6. Atividades que serão realizadas com os clientes em sala

### 6.1 Roteiro da sessão

| Etapa              | Atividade                                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Abertura        | Apresentação do grupo, do projeto e do objetivo. Deixar claro que **o protótipo está sendo testado, não o participante**. Coletar consentimento. |
| 2. Contexto        | Perguntas sobre como o participante resolve hoje as situações descritas no projeto.                                                              |
| 3. Tarefas guiadas | O participante executa as tarefas pensando em voz alta. O grupo observa sem interferir.                                                          |
| 4. Feedback        | Perguntas por funcionalidade e perguntas de descoberta.                                                                                          |

### 6.2 Atividades dos participantes

1. "Descubra onde será sua próxima aula e se algo mudou." _(estudante)_
2. "Encontre um evento do seu interesse e faça a inscrição." _(estudante)_
3. "Ache uma sala livre para estudar em grupo amanhã à tarde e solicite o uso." _(estudante)_
4. "Encontre outros estudantes interessados em Inteligência Artificial." _(estudante)_
5. "Divulgue uma palestra apenas para o 5º período de Computação." _(professor/servidor/organizador)_
6. "Descubra qual espaço é o mais procurado no mês." _(gestor)_
7. "Descubra qual é a atividade mais procurada pelos alunos." _(gestor)_
8. "Encontre editais abertos." _(servidor)_
### 6.4 Perguntas para obter feedback e descobrir novos requisitos

**Abertura (perfil e contexto)**

1. Como você descobre hoje eventos, avisos e horários na universidade?
2. Qual foi a última vez que você perdeu uma oportunidade por falta de informação?

**Durante as tarefas (observar e perguntar)**

3. O que você esperava encontrar nesta tela?
4. O que você faria agora? Para onde clicaria?
5. Alguma coisa aqui te confundiu ou pareceu desnecessária?

**Home e recomendações (F01)**

6. O que você gostaria de ver primeiro ao abrir o aplicativo?
7. As sugestões parecem relevantes? O que faria você confiar (ou desconfiar) delas?
8. Que informações você aceitaria fornecer para receber sugestões melhores (curso, horários, localização)?
9. Que tipo de notificação seria útil, e qual viraria "spam"?

**Conexão entre estudantes (F02)**

10. Você usaria esse recurso? Em que situações?
11. Quem deveria poder ver seu perfil: todos, só seu curso ou só quem você convidar?
12. Que problema você teme (assédio, exposição, spam)? O que ajudaria a se sentir seguro?

**Espaços (F03)**

13. Que informação sobre a sala é indispensável (capacidade, equipamentos, horário livre)?
14. Quanto tempo é aceitável esperar pela resposta de uma solicitação?
15. _(servidor/coordenador)_ Quem deve aprovar e com quais regras?

**Agenda de aulas (F04)**

16. Como você gostaria de ser avisado de uma mudança de sala ou de aula remota?
17. Falta alguma informação na agenda (professor, link da aula, prazo de atividade)?

**Painel do gestor (F05)**

18. Que decisões você toma hoje por falta de dados? Que indicador ajudaria?

**Descoberta (fechamento)**

19. O que está faltando neste aplicativo para você usá-lo todos os dias?
20. Se pudesse remover uma tela, qual seria?
21. Se você tivesse uma varinha mágica, o que o Campus+ faria que ainda não apareceu aqui?
22. Em uma escala de 1 a 5, quão útil e quão fácil de usar foi o protótipo? Por quê?

---

## 7. Informações que deverão ser registradas durante a aplicação

### 7.1 Dados da sessão

- Número da sessão, data, horário e local.
- Perfil do participante (estudante, professor, servidor, coordenador ou gestor), curso e período, mantendo o anonimato.
- Membros do grupo presentes e papel de cada um.
- Versão do protótipo utilizada.
- Confirmação do consentimento para anotação e gravação.

### 7.2 Registro de achados

Exemplo:

| Sessão | Participante (perfil)  | Tela/Funcionalidade | Observação ou citação                           | Tipo             | Requisito derivado                                           | Prioridade |
| ------ | ---------------------- | ------------------- | ----------------------------------------------- | ---------------- | ------------------------------------------------------------ | ---------- |
| 1      | Estudante, 3º período  | T02 Home            | "Prefiro ver minhas aulas antes de eventos"     | Sugestão         | RF: a home deve exibir a agenda do dia no topo               | Alta       |
| 2      | Servidor da secretaria | T05 Solicitação     | "A reserva precisa de aprovação do coordenador" | Regra de negócio | RN: reservas de laboratórios exigem aprovação do responsável | Alta       |

**Tipos de achado:** problema de usabilidade, sugestão, novo requisito, regra de negócio, restrição, dúvida em aberto.

### 7.3 Observações de comportamento

Para cada tarefa, registrar:

- Se o participante concluiu a tarefa (sim, parcialmente ou não).
- Tempo aproximado para concluir.
- Onde hesitou, errou ou pediu ajuda.
- Caminhos inesperados que o participante tentou seguir.
- Expressões verbais relevantes (dúvida, frustração, entusiasmo).

### 7.4 Informações de negócio a capturar

- **Necessidades e expectativas** expressas espontaneamente.
- **Regras de negócio** (quem aprova, prazos, permissões por perfil).
- **Restrições** (privacidade, uso de dados, limitações institucionais, sistemas já existentes).
- **Funcionalidades sugeridas** que não estão no protótipo.
- **Funcionalidades rejeitadas** ou consideradas dispensáveis.
- **Priorização** feita pelo participante.
- **Respostas às perguntas** de feedback, incluindo a nota de 1 a 5.

---

## 8. Resultados esperados

- Lista de requisitos funcionais, não funcionais e regras de negócio validada com os usuários.
- Protótipo revisado com base no feedback.
- Funcionalidades priorizadas para o primeiro ciclo de desenvolvimento.
- Registro das dúvidas que ainda exigem outras técnicas de elicitação (entrevista, questionário, observação etc.).