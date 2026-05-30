import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp } from '../../app'
import prisma from '../../lib/prisma'

// ── Helpers ──────────────────────────────────────────────────────────────────

function hoje(): string {
  return new Date().toISOString().split('T')[0]
}

function daqui(dias: number): string {
  return new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
}

// Janela de 3 dias centrada em hoje para consultas de relatorios (evita drift de timezone)
function periodoTeste(): string {
  return `inicio=${daqui(-1)}&fim=${daqui(1)}`
}

async function truncateAll() {
  await prisma.movimentoEstoque.deleteMany()
  await prisma.itemVenda.deleteMany()
  await prisma.itemCompra.deleteMany()
  await prisma.lancamento.deleteMany()
  await prisma.venda.deleteMany()
  await prisma.compra.deleteMany()
  await prisma.item.deleteMany()
  await prisma.cliente.deleteMany()
  await prisma.fornecedor.deleteMany()
  await prisma.configuracao.deleteMany()
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Simulacao Operacional Coldpaes — E2E', () => {
  const app = buildApp()

  let clienteId: string
  let fornecedorId: string
  let paoId: string
  let polvilhoId: string
  let despesaId: string
  let receitaId: string

  beforeAll(async () => {
    await app.ready()
    await truncateAll()
  })

  afterAll(async () => {
    await truncateAll()
    await app.close()
    await prisma.$disconnect()
  })

  // ── Cenario 1 ───────────────────────────────────────────────────────────────

  it('1. Cadastro de cliente', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/clientes',
      payload: { nome: 'Padaria do Joao', cidade: 'Sao Paulo' },
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.id).toBeTruthy()
    expect(body.nome).toBe('Padaria do Joao')
    expect(body.ativo).toBe(true)
    clienteId = body.id
  })

  // ── Cenario 2 ───────────────────────────────────────────────────────────────

  it('2. Cadastro de fornecedor', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/fornecedores',
      payload: { nome: 'Distribuidora Norte' },
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.id).toBeTruthy()
    expect(body.nome).toBe('Distribuidora Norte')
    expect(body.ativo).toBe(true)
    fornecedorId = body.id
  })

  // ── Cenario 3 ───────────────────────────────────────────────────────────────

  it('3. Cadastro de produto (Pao de Queijo)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/estoque/itens',
      payload: {
        nome: 'Pao de Queijo',
        tipo: 'PRODUTO',
        unidade: 'un',
        estoqueMinimo: 10,
        estoqueIdeal: 100,
      },
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.tipo).toBe('PRODUTO')
    expect(body.saldoAtual).toBe(0)
    paoId = body.id
  })

  // ── Cenario 4 ───────────────────────────────────────────────────────────────

  it('4. Cadastro de insumo (Polvilho)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/estoque/itens',
      payload: {
        nome: 'Polvilho',
        tipo: 'INSUMO',
        unidade: 'kg',
        estoqueMinimo: 5,
        estoqueIdeal: 50,
      },
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.tipo).toBe('INSUMO')
    expect(body.saldoAtual).toBe(0)
    polvilhoId = body.id
  })

  // ── Cenario 5 ───────────────────────────────────────────────────────────────

  it('5. Compra de insumo (20 kg Polvilho x R$ 8,50)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/compras',
      payload: {
        fornecedorId,
        data: hoje(),
        dataVencimento: daqui(30),
        itens: [{ itemId: polvilhoId, quantidade: 20, valorUnit: 8.5 }],
      },
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(Number(body.total)).toBe(170)
  })

  // ── Cenario 6 ───────────────────────────────────────────────────────────────

  it('6. Entrada automatica no estoque apos compra', async () => {
    const res = await app.inject({ method: 'GET', url: '/estoque/itens' })
    expect(res.statusCode).toBe(200)
    const itens = res.json()
    const polvilho = itens.find((i: any) => i.id === polvilhoId)
    expect(polvilho).toBeDefined()
    expect(polvilho.saldoAtual).toBe(20)
  })

  // ── Cenario 7 ───────────────────────────────────────────────────────────────

  it('7. Criacao automatica de despesa prevista', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/financeiro/lancamentos?status=PREVISTO',
    })
    expect(res.statusCode).toBe(200)
    const lancamentos = res.json()
    const despesa = lancamentos.find(
      (l: any) => l.tipo === 'DESPESA' && l.status === 'PREVISTO',
    )
    expect(despesa).toBeDefined()
    expect(Number(despesa.valor)).toBe(170)
    despesaId = despesa.id
  })

  // ── Pre-venda: entrada de produto via producao ───────────────────────────────

  it('(pre-venda) Entrada de estoque de produto via producao', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/estoque/itens/${paoId}/movimentos`,
      payload: { tipo: 'ENTRADA', quantidade: 50, motivo: 'Producao do dia' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().saldoAtual).toBe(50)
  })

  // ── Cenario 8 ───────────────────────────────────────────────────────────────

  it('8. Venda de produto (30 un Pao de Queijo x R$ 3,50)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/vendas',
      payload: {
        clienteId,
        data: hoje(),
        dataVencimento: daqui(7),
        itens: [{ itemId: paoId, quantidade: 30, valorUnit: 3.5 }],
      },
    })
    expect(res.statusCode).toBe(201)
    expect(Number(res.json().total)).toBe(105)
  })

  // ── Cenario 9 ───────────────────────────────────────────────────────────────

  it('9. Saida automatica do estoque apos venda', async () => {
    const res = await app.inject({ method: 'GET', url: '/estoque/itens' })
    expect(res.statusCode).toBe(200)
    const pao = res.json().find((i: any) => i.id === paoId)
    expect(pao).toBeDefined()
    expect(pao.saldoAtual).toBe(20) // 50 - 30
  })

  // ── Cenario 10 ──────────────────────────────────────────────────────────────

  it('10. Criacao automatica de receita prevista', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/financeiro/lancamentos?status=PREVISTO',
    })
    expect(res.statusCode).toBe(200)
    const lancamentos = res.json()
    const receita = lancamentos.find(
      (l: any) => l.tipo === 'RECEITA' && l.status === 'PREVISTO',
    )
    expect(receita).toBeDefined()
    expect(Number(receita.valor)).toBe(105)
    receitaId = receita.id
  })

  // ── Cenario 11 ──────────────────────────────────────────────────────────────

  it('11. Efetivacao de pagamento (despesa)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/financeiro/lancamentos/${despesaId}/efetivar`,
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().status).toBe('REALIZADO')
  })

  // ── Cenario 12 ──────────────────────────────────────────────────────────────

  it('12. Efetivacao de recebimento (receita)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/financeiro/lancamentos/${receitaId}/efetivar`,
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().status).toBe('REALIZADO')
  })

  // ── Cenario 13 ──────────────────────────────────────────────────────────────

  it('13. Dashboard refletindo os dados', async () => {
    const res = await app.inject({ method: 'GET', url: '/dashboard/resumo' })
    expect(res.statusCode).toBe(200)
    const dash = res.json()

    expect(dash.financeiro).toBeDefined()
    expect(dash.estoque).toBeDefined()
    expect(dash.compras).toBeDefined()
    expect(dash.vendas).toBeDefined()

    // caixaAtual = receita realizada (105) - despesa realizada (170) = -65
    expect(dash.financeiro.caixaAtual).toBe(-65)
    expect(dash.compras.totalComprado).toBe(170)
    expect(dash.vendas.totalVendido).toBe(105)
  })

  // ── Cenario 14 ──────────────────────────────────────────────────────────────

  it('14. Relatorios refletindo os dados', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/relatorios/resumo?${periodoTeste()}`,
    })
    expect(res.statusCode).toBe(200)
    const rel = res.json()

    expect(rel.compras.totalComprado).toBe(170)
    expect(rel.vendas.totalVendido).toBe(105)
    expect(rel.estoque.itensCadastrados).toBe(2)
  })

  // ── Cenario 15 ──────────────────────────────────────────────────────────────

  it('15. Assistente respondendo com base nos dados', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/assistente/perguntar',
      payload: { pergunta: 'O caixa esta saudavel?' },
    })
    expect(res.statusCode).toBe(200)
    const resp = res.json()

    expect(resp.pergunta).toBeDefined()
    expect(['normal', 'atencao', 'critico']).toContain(resp.nivel)
    expect(typeof resp.resposta).toBe('string')
    expect(resp.resposta.length).toBeGreaterThan(0)
    expect(resp.dados).toBeDefined()
  })

  // ── Cenario 16: Consistencia Global ──────────────────────────────────────────

  describe('16. Consistencia Global', () => {
    it('16.1 Estoque: saldos corretos apos toda a simulacao', async () => {
      const res = await app.inject({ method: 'GET', url: '/estoque/itens' })
      expect(res.statusCode).toBe(200)
      const itens = res.json()

      const polvilho = itens.find((i: any) => i.id === polvilhoId)
      const pao = itens.find((i: any) => i.id === paoId)

      expect(polvilho).toBeDefined()
      expect(pao).toBeDefined()
      expect(polvilho.saldoAtual).toBe(20)
      expect(pao.saldoAtual).toBe(20)
    })

    it('16.2 Financeiro: exatamente 1 despesa e 1 receita realizadas', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/financeiro/lancamentos',
      })
      expect(res.statusCode).toBe(200)
      const lancamentos = res.json()

      const despesasRealizadas = lancamentos.filter(
        (l: any) => l.tipo === 'DESPESA' && l.status === 'REALIZADO',
      )
      const receitasRealizadas = lancamentos.filter(
        (l: any) => l.tipo === 'RECEITA' && l.status === 'REALIZADO',
      )

      expect(despesasRealizadas).toHaveLength(1)
      expect(receitasRealizadas).toHaveLength(1)
      expect(Number(despesasRealizadas[0].valor)).toBe(170)
      expect(Number(receitasRealizadas[0].valor)).toBe(105)
    })

    it('16.3 Compras: totalComprado = 170', async () => {
      const res = await app.inject({ method: 'GET', url: '/compras/resumo' })
      expect(res.statusCode).toBe(200)
      expect(res.json().totalComprado).toBe(170)
    })

    it('16.4 Vendas: totalVendido = 105', async () => {
      const res = await app.inject({ method: 'GET', url: '/vendas/resumo' })
      expect(res.statusCode).toBe(200)
      expect(res.json().totalVendido).toBe(105)
    })

    it('16.5 Dashboard: todos os modulos presentes e coerentes', async () => {
      const res = await app.inject({ method: 'GET', url: '/dashboard/resumo' })
      expect(res.statusCode).toBe(200)
      const dash = res.json()

      expect(dash.financeiro).toBeDefined()
      expect(typeof dash.financeiro.caixaAtual).toBe('number')

      expect(dash.estoque).toBeDefined()
      expect(Array.isArray(dash.estoque.criticos)).toBe(true)

      expect(dash.compras).toBeDefined()
      expect(typeof dash.compras.totalComprado).toBe('number')

      expect(dash.vendas).toBeDefined()
      expect(typeof dash.vendas.totalVendido).toBe('number')
    })

    it('16.6 Relatorios: resultado = receitas - despesas', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/relatorios/resumo?${periodoTeste()}`,
      })
      expect(res.statusCode).toBe(200)
      const { financeiro } = res.json()

      expect(financeiro).toBeDefined()
      expect(financeiro.resultado).toBe(financeiro.receitas - financeiro.despesas)
    })

    it('16.7 Assistente: resposta estruturada com dados do caixa', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/assistente/perguntar',
        payload: { pergunta: 'O caixa esta saudavel?' },
      })
      expect(res.statusCode).toBe(200)
      const resp = res.json()

      expect(['normal', 'atencao', 'critico']).toContain(resp.nivel)
      expect(typeof resp.resposta).toBe('string')
      expect(resp.resposta.length).toBeGreaterThan(0)
      expect(resp.dados).toBeDefined()
      expect(typeof resp.dados.caixaAtual).toBe('number')
    })
  })
})
