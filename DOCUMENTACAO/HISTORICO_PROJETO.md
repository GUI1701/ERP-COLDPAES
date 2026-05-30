# ERP COLDPAES — Histórico e Documentação do Projeto

## Visão Geral

ERP operacional desenvolvido para a Coldpaes (panificadora). Monorepo com backend
Fastify + Prisma e frontend Vue 3 + Tailwind. Banco de dados PostgreSQL via Supabase.

Desenvolvido em ciclos diários ("Dias"), cada um entregando um módulo funcional completo.

---

## Histórico por Dia

### Dia 1 — Estrutura Inicial (`cd6a387`)
- Criação do monorepo: `backend/` (Fastify + TypeScript) e `frontend/` (Vue 3 + Vite + Tailwind)
- Configuração de `tsconfig`, `.gitignore`, dependências base
- Estrutura de pastas: `src/modules/`, `src/lib/`, `src/tests/`

### Dia 2 — Estoque e Configurações (`de1fe08`)
- Módulo `estoque`: cadastro de itens (PRODUTO | INSUMO), movimentações e saldo
- Lógica de alerta: `vermelho` (saldo ≤ mínimo), `amarelo` (saldo ≤ mínimo × 1,25)
- Tipos de movimento: ENTRADA, SAIDA, AJUSTE (com motivo obrigatório para AJUSTE)
- Model `Configuracao` (chave-valor genérico)
- 13 testes unitários para funções puras de estoque

### Dia 3 — Financeiro (`00796f0`)
- Módulo `financeiro`: lançamentos RECEITA/DESPESA em status PREVISTO/REALIZADO
- Cálculo de `caixaAtual` (realizados) e `caixaProjetado` (atual + previstos)
- `resultadoProjetado`: receitas − despesas previstos para os próximos 30 dias
- Alertas de vencimento: `vencido` (data < hoje) e `proximo` (vence em até 7 dias)
- Efetivação de lançamento registra data atual em `dataEfetivacao`
- 14 testes unitários

### Dia 4 — Compras e Vendas (`748bf0c`)
- Módulo `compras`: criação em transação atômica (itens, movimentação ENTRADA, despesa PREVISTA)
- Módulo `vendas`: criação em transação atômica (itens, movimentação SAIDA, receita PREVISTA)
- Validações: INSUMO não pode ser vendido; saldo insuficiente bloqueia venda
- Cancelamento reverte estoque e remove lançamentos (somente se PREVISTO)
- 5 testes de compras + 8 testes de vendas

### Dia 5 — Dashboard Executivo (`6bd0cfe`)
- `GET /dashboard/resumo`: agregação em tempo real de todos os módulos
- `consolidarDashboard`: função pura que compõe o retorno completo
- Produtos acabados e insumos separados; estoque crítico ordenado por urgência (ratio saldo/mínimo)
- 10 testes unitários

### Dia 6 — Relatórios e Indicadores Gerenciais (`8ee5cff`)
- `GET /relatorios/resumo`: período configurável (padrão: últimos 30 dias)
  - Financeiro (receitas, despesas, resultado, ticket médio)
  - Compras e vendas do período
  - Estoque: itens críticos e itens sem movimento
  - Evolução mensal (últimos 6 meses)
- `GET /relatorios/rankings`: top 5 mais vendidos/comprados, maiores vendas/compras, maiores receitas/despesas
- 10 testes unitários

### Dia 7 — Clientes e Fornecedores (`bf6b363`)
- CRUD completo de `Cliente` e `Fornecedor` com soft delete via campo `ativo`
- FK opcional em `Venda` (`clienteId`) e `Compra` (`fornecedorId`); campo texto mantido para retrocompatibilidade
- `GET /clientes/:id/resumo`: totalVendido, quantidadePedidos, ticketMédio, últimaVenda
- `GET /fornecedores/:id/resumo`: totalComprado, quantidadeCompras, ticketMédio, últimaCompra
- 5 testes de clientes + 5 testes de fornecedores

### Dia 8 — Assistente Operacional Local (`0bb83e7`)
- Camada de inteligência por regras — sem API externa de IA
- `GET /assistente/resumo`: resumoDia, alertasCriticos, recomendacoes, perguntasRapidas
- `POST /assistente/perguntar`: matching por palavras-chave → resposta estruturada
- Retorno padronizado: `{ pergunta, resposta, nivel, dados }` com `nivel ∈ [normal|atencao|critico]`
- 11 perguntas suportadas com regras de classificação por severidade
- Funções puras testáveis sem banco; `coletarDados()` é o único ponto de I/O
- Módulo estruturado para futura troca por IA externa sem alterar rotas ou frontend
- 17 testes unitários

### Dia 9 — Testes E2E e Simulação Operacional (`0bb83e7`)
- Infraestrutura de testes E2E isolada (`vitest.e2e.config.ts` separado de `vitest.config.ts`)
- Guard de segurança: bloqueia execução se `DATABASE_URL` contiver o project-id de produção Supabase
- `.env.test.example` documentando 3 opções de banco de teste (Supabase 2º projeto, Postgres local, Docker)
- 16 cenários sequenciais cobrindo fluxo completo: cadastro → compra → estoque → venda → efetivação → dashboard → relatórios → assistente → consistência global
- `npm test` roda apenas unitários; `npm run test:e2e` roda os E2E (requer `.env.test`)

### Ajuste Dashboard Executivo (pós-Dia 9 — não commitado)
- Novo campo `fluxoCaixa30d`: projeção dia a dia dos próximos 30 dias (saldo acumulado)
- Novo campo `vendasPorProduto`: ranking por quantidade e por valor no mês corrente
- Novo campo `estoqueInsumos`: insumos com status, mínimo e prioridade para Trigo
- Card "Compras do Mês" removido do Dashboard principal
- CORS expandido para `localhost:5173` e `localhost:5174`
- +5 testes unitários no dashboard (10 → 15)

---

## Módulos Existentes

### Backend (`backend/src/modules/`)

| Módulo | Arquivos | Responsabilidade |
|---|---|---|
| `estoque` | service, routes, test | Itens, saldo, movimentações, alertas |
| `financeiro` | service, routes, test | Lançamentos, caixa, efetivação, alertas |
| `compras` | service, routes, test | Compras com transação atômica |
| `vendas` | service, routes, test | Vendas com transação atômica |
| `dashboard` | service, routes, test | Agregação em tempo real |
| `relatorios` | service, routes, test | Relatórios por período, rankings |
| `clientes` | service, routes, test | CRUD + resumo por cliente |
| `fornecedores` | service, routes, test | CRUD + resumo por fornecedor |
| `assistente` | service, routes, test | IA local por regras |

### Frontend (`frontend/src/`)

| View | Rota | Status |
|---|---|---|
| DashboardView | `/dashboard` | Completo |
| FinanceiroView | `/financeiro` | Completo |
| EstoqueView | `/estoque` | Completo |
| ComprasView | `/compras` | Completo |
| VendasView | `/vendas` | Completo |
| RelatoriosView | `/relatorios` | Completo |
| ClientesView | `/clientes` | Completo |
| FornecedoresView | `/fornecedores` | Completo |
| AssistenteView | `/assistente` | Completo |
| DREView | `/dre` | Shell vazio — backend a implementar |
| BalancoView | `/balanco` | Shell vazio — backend a implementar |
| ConfiguracoesView | `/configuracoes` | Shell vazio — lógica a definir |

---

## Endpoints

### Estoque

| Método | Rota | Descrição |
|---|---|---|
| GET | `/estoque/itens` | Lista todos os itens com alerta calculado |
| POST | `/estoque/itens` | Cadastra item (PRODUTO ou INSUMO) |
| PUT | `/estoque/itens/:id` | Atualiza nome/unidade/mínimo/ideal |
| DELETE | `/estoque/itens/:id` | Remove item |
| POST | `/estoque/itens/:id/movimentos` | Registra movimentação (ENTRADA/SAIDA/AJUSTE) |
| GET | `/estoque/itens/:id/movimentos` | Lista movimentações do item |

### Financeiro

| Método | Rota | Descrição |
|---|---|---|
| GET | `/financeiro/resumo` | Caixa atual, projetado, alertas |
| GET | `/financeiro/lancamentos` | Lista lançamentos `[?tipo&status]` |
| POST | `/financeiro/lancamentos` | Cria lançamento manual |
| POST | `/financeiro/lancamentos/:id/efetivar` | Marca como REALIZADO com data atual |
| DELETE | `/financeiro/lancamentos/:id` | Remove (apenas PREVISTO) |

### Compras

| Método | Rota | Descrição |
|---|---|---|
| GET | `/compras` | Lista compras com itens e lançamentos |
| GET | `/compras/resumo` | Total comprado all-time |
| GET | `/compras/:id` | Detalhe da compra |
| POST | `/compras` | Cria compra (transação: estoque + despesa PREVISTA) |
| DELETE | `/compras/:id` | Cancela compra (reverte estoque, remove lançamentos PREVISTO) |

### Vendas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/vendas` | Lista vendas com itens e lançamentos |
| GET | `/vendas/resumo` | Total vendido all-time |
| GET | `/vendas/:id` | Detalhe da venda |
| POST | `/vendas` | Cria venda (transação: estoque + receita PREVISTA) |
| DELETE | `/vendas/:id` | Cancela venda (reverte estoque, remove lançamentos PREVISTO) |

### Dashboard

| Método | Rota | Descrição |
|---|---|---|
| GET | `/dashboard/resumo` | Financeiro + estoque + vendas + fluxoCaixa30d + vendasPorProduto + estoqueInsumos |

### Relatórios

| Método | Rota | Descrição |
|---|---|---|
| GET | `/relatorios/resumo` | Resumo do período `[?inicio=YYYY-MM-DD&fim=YYYY-MM-DD]` |
| GET | `/relatorios/rankings` | Top 5 produtos/fornecedores/clientes `[?inicio&fim]` |

### Clientes

| Método | Rota | Descrição |
|---|---|---|
| GET | `/clientes` | Lista clientes ativos `[?todos=true para incluir inativos]` |
| GET | `/clientes/:id` | Detalhe do cliente |
| GET | `/clientes/:id/resumo` | Total vendido, pedidos, ticket médio, última venda |
| POST | `/clientes` | Cadastra cliente |
| PUT | `/clientes/:id` | Atualiza dados do cliente |
| DELETE | `/clientes/:id` | Desativa cliente (soft delete — ativo = false) |

### Fornecedores

| Método | Rota | Descrição |
|---|---|---|
| GET | `/fornecedores` | Lista fornecedores ativos `[?todos=true]` |
| GET | `/fornecedores/:id` | Detalhe do fornecedor |
| GET | `/fornecedores/:id/resumo` | Total comprado, compras, ticket médio, última compra |
| POST | `/fornecedores` | Cadastra fornecedor |
| PUT | `/fornecedores/:id` | Atualiza dados do fornecedor |
| DELETE | `/fornecedores/:id` | Desativa fornecedor (soft delete) |

### Assistente

| Método | Rota | Descrição |
|---|---|---|
| GET | `/assistente/resumo` | resumoDia, alertasCriticos, recomendacoes, perguntasRapidas |
| POST | `/assistente/perguntar` | `{ pergunta }` → `{ pergunta, resposta, nivel, dados }` |

### Sistema

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Healthcheck: `{ status: "ok" }` |

**Total: 38 endpoints**

---

## Perguntas Suportadas pelo Assistente

| # | Pergunta | `critico` quando | `atencao` quando |
|---|---|---|---|
| 1 | O caixa está saudável? | caixaProjetado < 0 | resultadoProjetado < 0 |
| 2 | Quais itens exigem atenção hoje? | itensCriticos > 3 | itensCriticos ≥ 1 |
| 3 | Quais contas vencem ou estão vencidas? | vencidas ≥ 1 | proximas ≥ 1 |
| 4 | As vendas do mês cobrem as compras do mês? | vendas < compras × 0,8 | vendas < compras |
| 5 | Qual produto mais vendido? | — (informativo) | — |
| 6 | Qual insumo mais comprado? | — (informativo) | — |
| 7 | Qual fornecedor gerou maior custo? | — (informativo) | — |
| 8 | Qual cliente gerou maior receita? | — (informativo) | — |
| 9 | Existem itens sem movimento? | — | qtd > 5 |
| 10 | Qual é o resultado projetado dos próximos 30 dias? | resultadoProjetado < 0 | resultado < receitas × 0,1 |
| 11 | Qual cliente está comprando menos que o habitual? | queda > 50% | queda > 30% |

---

## Schema Atual (`backend/prisma/schema.prisma`)

**Banco:** PostgreSQL 15 via Supabase  
**ORM:** Prisma 5  
**Deploy:** `prisma db push` (schema-first, sem migrations versionadas)

### Enums

```
TipoItem:         PRODUTO | INSUMO
TipoMovimento:    ENTRADA | SAIDA | AJUSTE
TipoLancamento:   RECEITA | DESPESA
StatusLancamento: PREVISTO | REALIZADO
```

### Models

| Model | Campos principais | Relações |
|---|---|---|
| `Item` | nome, tipo, unidade, saldoAtual, estoqueMinimo, estoqueIdeal, ultimoCusto? | → MovimentoEstoque[], ItemVenda[], ItemCompra[] |
| `MovimentoEstoque` | itemId, tipo, quantidade, motivo? | → Item |
| `Lancamento` | descricao, tipo, status, valor, dataVencimento, dataEfetivacao?, vendaId?, compraId? | → Venda?, Compra? |
| `Cliente` | nome, telefone?, email?, cidade?, observacao?, ativo | → Venda[] |
| `Venda` | cliente? (texto), clienteId? (FK), data, observacao?, total | → Cliente?, ItemVenda[], Lancamento[] |
| `ItemVenda` | vendaId, itemId, quantidade, valorUnit | → Venda, Item |
| `Fornecedor` | nome, telefone?, email?, cidade?, observacao?, ativo | → Compra[] |
| `Compra` | fornecedor? (texto), fornecedorId? (FK), data, observacao?, total | → Fornecedor?, ItemCompra[], Lancamento[] |
| `ItemCompra` | compraId, itemId, quantidade, valorUnit | → Compra, Item |
| `Configuracao` | chave (unique), valor | — |

> **Nota design:** `Venda.cliente` (texto) + `Venda.clienteId` (FK) coexistem.
> O campo texto garante retrocompatibilidade com registros sem entidade Cliente vinculada.
> Idem para `Compra.fornecedor` e `Compra.fornecedorId`. Adicionados no Dia 7.

---

## Testes Existentes

### Unitários — `npm test` — **93 testes**

| Arquivo | Testes | Funções cobertas |
|---|---|---|
| `estoque.test.ts` | 13 | `calcularNovoSaldo`, `calcularAlerta`, `validarMovimento` |
| `financeiro.test.ts` | 14 | `calcularCaixaAtual`, `calcularCaixaProjetado`, `calcularAlerta`, `calcularResultadoProjetado`, `validarEfetivacao` |
| `dashboard.test.ts` | 15 | `consolidarDashboard`, `calcularFluxoCaixa30d`, `calcularVendasPorProduto`, `calcularEstoqueInsumos` |
| `relatorios.test.ts` | 10 | `calcularResultado`, `calcularMedia`, `calcularPeriodo`, `gerarUltimosMeses` |
| `vendas.test.ts` | 8 | `calcularTotal`, `validarItemVenda`, `validarEstoqueParaVenda` |
| `compras.test.ts` | 5 | `calcularTotal`, `validarCancelamentoCompra` |
| `clientes.test.ts` | 5 | `validarCliente`, `calcularTicketMedio` |
| `fornecedores.test.ts` | 5 | `validarFornecedor`, `calcularTicketMedio` |
| `assistente.test.ts` | 17 | 11 funções `analisar*`, `identificarPergunta`, `gerarAlertasCriticos` |
| `health.test.ts` | 1 | `GET /health` via Fastify inject |

**Princípio:** toda lógica de negócio é função pura. Nenhum teste unitário acessa banco ou usa mock.

### E2E — `npm run test:e2e` — **16 cenários / ~47 asserções**

Requer `backend/.env.test` com banco de teste isolado configurado.

| Bloco | Cenários |
|---|---|
| Cadastros | 1–4: cliente, fornecedor, produto, insumo |
| Fluxo compra | 5–7: compra → entrada estoque → despesa prevista |
| Fluxo venda | pré + 8–10: produção → venda → saída estoque → receita prevista |
| Efetivações | 11–12: pagamento e recebimento |
| Validação módulos | 13–15: dashboard, relatórios, assistente |
| Consistência global | 16 (7 sub-checks): estoque, financeiro, compras, vendas, dashboard, relatórios, assistente |

---

## Decisões de Arquitetura

| Decisão | Justificativa |
|---|---|
| **Fastify** em vez de Express | Performance superior, schema-first validation JSON nativa, logging estruturado embutido |
| **Prisma ORM** | Type safety end-to-end, schema declarativo como fonte de verdade, queries type-safe |
| **Supabase** | Banco gerenciado, free tier, pgBouncer embutido, mesmo PostgreSQL em dev e prod |
| **Funções puras para análise** | Todo cálculo de negócio é função pura → testável sem banco, sem mock. I/O isolado em funções `async` distintas |
| **Transações atômicas** | Compra e venda usam `prisma.$transaction`. Estoque + lançamento criados juntos ou nada |
| **Campo texto + FK opcional** | `fornecedor`/`fornecedorId` em Compra; `cliente`/`clienteId` em Venda. Retrocompatibilidade com registros antigos |
| **Sem autenticação no MVP** | Ferramenta interna para operação da própria padaria. Complexidade adiada deliberadamente |
| **Assistente por regras locais** | Sem dependência de API externa. Seam de troca definido: substituir funções `analisar*` por chamadas de IA sem tocar em rotas ou frontend |
| **Testes unitários separados de E2E** | `vitest.config.ts` exclui `tests/e2e/`. Guard bloqueia execução E2E contra project-id de produção |
| **Vue 3 + Composition API + Tailwind** | Sem UI library pesada, zero dependências de componentes externos, CSS utilitário |
| **Sem histórico de conversa** | Assistente responde perguntas pontuais. Sem armazenamento de sessão por decisão de escopo |

---

## Stack Técnica

### Backend
- **Runtime:** Node.js + TypeScript 5
- **Framework:** Fastify 4 + `@fastify/cors`
- **ORM:** Prisma 5 + `@prisma/client`
- **Banco:** PostgreSQL 15 (Supabase — pooler pgBouncer)
- **Dev server:** `tsx watch`
- **Testes:** Vitest 2

### Frontend
- **Framework:** Vue 3 (`<script setup>` + Composition API)
- **Build:** Vite
- **CSS:** Tailwind CSS
- **Roteamento:** Vue Router 4
- **HTTP:** Fetch nativo (sem Axios)
- **Porta padrão:** 5173 (fallback: 5174)

---

## Estrutura de Arquivos

```
ERP-COLDPAES/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── app.ts                    # buildApp() — registra todas as rotas e CORS
│   │   ├── server.ts                 # ponto de entrada (porta 3000)
│   │   ├── lib/
│   │   │   └── prisma.ts             # singleton PrismaClient
│   │   ├── modules/
│   │   │   ├── estoque/              # service · routes · test
│   │   │   ├── financeiro/
│   │   │   ├── compras/
│   │   │   ├── vendas/
│   │   │   ├── dashboard/
│   │   │   ├── relatorios/
│   │   │   ├── clientes/
│   │   │   ├── fornecedores/
│   │   │   └── assistente/
│   │   └── tests/
│   │       ├── health.test.ts
│   │       └── e2e/
│   │           ├── setup/
│   │           │   ├── globalSetup.ts    # guard contra banco de produção
│   │           │   └── testSetup.ts      # guard no worker
│   │           └── simulacao-operacional.test.ts
│   ├── .env                          # produção (não commitado)
│   ├── .env.test                     # banco de teste (não commitado)
│   ├── .env.test.example             # template público
│   ├── vitest.config.ts              # unitários — exclui e2e/
│   └── vitest.e2e.config.ts          # E2E — carrega .env.test exclusivamente
│
├── frontend/
│   └── src/
│       ├── App.vue
│       ├── main.ts
│       ├── router/index.ts
│       ├── components/
│       │   └── Sidebar.vue
│       ├── layouts/
│       │   └── MainLayout.vue
│       ├── composables/
│       │   ├── useDashboard.ts
│       │   ├── useFinanceiro.ts
│       │   ├── useEstoque.ts
│       │   ├── useCompras.ts
│       │   ├── useVendas.ts
│       │   ├── useRelatorios.ts
│       │   ├── useClientes.ts
│       │   ├── useFornecedores.ts
│       │   └── useAssistente.ts
│       └── views/
│           ├── DashboardView.vue
│           ├── FinanceiroView.vue
│           ├── EstoqueView.vue
│           ├── ComprasView.vue
│           ├── VendasView.vue
│           ├── RelatoriosView.vue
│           ├── ClientesView.vue
│           ├── FornecedoresView.vue
│           ├── AssistenteView.vue
│           ├── DREView.vue           # shell vazio
│           ├── BalancoView.vue       # shell vazio
│           └── ConfiguracoesView.vue # shell vazio
│
└── DOCUMENTACAO/
    └── HISTORICO_PROJETO.md          # este arquivo
```

---

## Próximos Módulos Planejados

| Módulo | View existente | Observação |
|---|---|---|
| **DRE** (Demonstrativo de Resultado do Exercício) | `DREView.vue` ✓ | Backend a implementar. Dados já disponíveis nos lançamentos |
| **Balanço Patrimonial** | `BalancoView.vue` ✓ | Backend a implementar. Requer definição de contas patrimoniais |
| **Configurações do sistema** | `ConfiguracoesView.vue` ✓ | Model `Configuracao` já existe. Lógica de negócio a definir |
| **Assistente com IA externa** | `AssistenteView.vue` ✓ | Estrutura pronta para swap: substituir funções `analisar*` por chamadas de API (Claude, GPT etc.) |
| **Módulo de Produção** | — | Fichas técnicas, ordens de produção, consumo de insumos por produto |
| **Autenticação** | — | Não planejado para MVP. Candidato quando o sistema for multiusuário |
