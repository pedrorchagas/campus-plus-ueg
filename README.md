# Campus+ — Protótipo para elicitação de requisitos

Protótipo navegável (descartável, fidelidade baixa/média) do **Campus+**, usado na técnica de **prototipação** descrita em [docs/Elicitacao de requisitos.md](docs/Elicitacao%20de%20requisitos.md). O objetivo é apresentar as telas aos stakeholders e descobrir requisitos funcionais, não funcionais e regras de negócio — não é uma entrega final.

- **Mobile first**, com layout adaptado para acesso via navegador no desktop.
- **Somente JavaScript + Express**: o back-end é Express, e o front-end é JavaScript puro (ES modules), sem framework e sem etapa de build.
- **Dados fictícios em memória**: não há banco de dados. Reiniciar o servidor volta tudo ao estado inicial.

## Como rodar no Codespace

```bash
npm install
npm start          # ou: npm run dev  (reinicia ao salvar arquivos)
```

O servidor sobe na porta **3000**. No Codespace, abra a aba **Ports** e clique no endereço da porta 3000; o link também aparece no terminal. Para que os stakeholders abram pelo celular, mude a visibilidade da porta para **Public** (botão direito → *Port Visibility*).

## Telas (seção 5.1)

| Tela | Rota | Perfil |
| --- | --- | --- |
| T01 — Onboarding e interesses | `#/boas-vindas` | todos |
| T02 — Home personalizada (blocos reordenáveis) | `#/inicio` | estudante |
| T03 — Lista e detalhe de eventos / editais | `#/eventos`, `#/eventos/:id` | todos |
| T04 — Agenda de aulas com mudanças | `#/agenda` | estudante |
| T05 — Mapa/lista de espaços, solicitação e acompanhamento | `#/espacos`, `#/espacos/:id`, `#/espacos/solicitacoes` | todos |
| T06 — Busca de pessoas e grupos | `#/pessoas` | estudante |
| T07 — Criação de grupo e convite | `#/grupos/novo`, `#/grupos/:id` | estudante |
| T08 — Publicação de conteúdo com público-alvo | `#/publicar` | professor, servidor |
| T09 — Dashboard do gestor | `#/painel` | gestor |
| Extra — Aprovação de espaços | `#/aprovacoes` | servidor |

Use o **seletor de perfil** no topo para alternar entre Estudante, Professor/Organizador, Servidor e Gestor.

## Modo sessão (facilitador)

Em **Perfil → Modo sessão** (ou `#/sessao`), com apoio às seções 6 e 7 do plano:

- **Dados da sessão** (7.1): número, participante anônimo, consentimento etc.
- **Tarefas guiadas** (6.2): "Iniciar" troca o perfil e abre a tela inicial; um cronômetro mede o tempo e você registra se o participante concluiu a tarefa (sim/parcial/não), com observações.
- **Botão "Achado"** flutuante em todas as telas (7.2): registra observação, tipo, requisito derivado e prioridade, já preenchendo a tela atual.
- **Exportar CSV** com todos os achados (abre no Excel/Sheets).
- **Perguntas de feedback** (6.4) para consulta rápida.
- **Reiniciar dados de demonstração** entre participantes, mantendo os achados.

> Os achados ficam na memória do servidor. **Exporte o CSV ao fim de cada sessão.**

## Estrutura

```
server.js            # Express: API em /api e arquivos estáticos
src/data.js          # dados fictícios (seed) e estado em memória
src/api.js           # rotas REST
public/index.html    # casca da SPA
public/css/styles.css
public/js/app.js     # roteador por hash, menus por perfil, registro de achados
public/js/views/*.js # uma tela por arquivo
```

## Fora do escopo (informado aos participantes)

Login institucional real (SSO), integrações externas, algoritmo de recomendação (simulado por interesses e público-alvo) e o design visual final.
