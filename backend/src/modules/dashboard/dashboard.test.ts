import { describe, it, expect } from 'vitest'
import { consolidarDashboard, calcularFluxoCaixa30d, calcularVendasPorProduto, calcularEstoqueInsumos } from './dashboard.service'

const resumoFin = {
  caixaAtual: 5000, caixaProjetado: 7000, entradasDia: 1000, saidasDia: 500,
  alertas: [{ id: '1', descricao: 'Conta vencida', valor: 200, dataVencimento: new Date(), tipo: 'vencido', tipoLancamento: 'DESPESA' }],
  metricas: { receitasPrevistas: 3000, despesasPrevistas: 1500, resultadoProjetado: 1500, contasReceber: 2000, contasPagar: 1000 },
}

const itens = [
  { id: '1', nome: 'Pão francês', tipo: 'PRODUTO', saldoAtual: 50, estoqueMinimo: 200, unidade: 'un', alerta: 'vermelho' },
  { id: '2', nome: 'Trigo', tipo: 'INSUMO', saldoAtual: 80, estoqueMinimo: 150, unidade: 'kg', alerta: 'vermelho' },
  { id: '3', nome: 'Croissant', tipo: 'PRODUTO', saldoAtual: 500, estoqueMinimo: 100, unidade: 'un', alerta: null },
  { id: '4', nome: 'Manteiga', tipo: 'INSUMO', saldoAtual: 48, estoqueMinimo: 40, unidade: 'kg', alerta: 'amarelo' },
]

const resumoComp = { totalComprado: 10000, quantidadeCompras: 5 }
const resumoVen = { totalVendido: 15000, quantidadeVendas: 12 }
const comprasMes = { total: 2000, quantidade: 2 }
const vendasMes = { total: 3000, quantidade: 4 }

const resultado = consolidarDashboard(resumoFin, itens, resumoComp, resumoVen, comprasMes, vendasMes, '2026-05-29T12:00:00.000Z')

describe('consolidarDashboard — estrutura', () => {
  it('retorna ultimaAtualizacao', () => {
    expect(resultado.ultimaAtualizacao).toBe('2026-05-29T12:00:00.000Z')
  })

  it('retorna todos os campos de primeiro nível', () => {
    expect(resultado).toHaveProperty('financeiro')
    expect(resultado).toHaveProperty('estoque')
    expect(resultado).toHaveProperty('compras')
    expect(resultado).toHaveProperty('vendas')
  })
})

describe('consolidarDashboard — financeiro', () => {
  it('consolida dados financeiros corretamente', () => {
    expect(resultado.financeiro.caixaAtual).toBe(5000)
    expect(resultado.financeiro.caixaProjetado).toBe(7000)
    expect(resultado.financeiro.receitasPrevistas).toBe(3000)
    expect(resultado.financeiro.resultadoProjetado).toBe(1500)
  })

  it('alertas financeiros aparecem no resumo', () => {
    expect(resultado.financeiro.alertas).toHaveLength(1)
    expect(resultado.financeiro.alertas[0].tipo).toBe('vencido')
  })
})

describe('consolidarDashboard — estoque', () => {
  it('separa produtos e insumos corretamente', () => {
    expect(resultado.estoque.produtos.every(p => p)).toBeTruthy()
    expect(resultado.estoque.produtos.map(p => p.nome)).toContain('Pão francês')
    expect(resultado.estoque.insumos.map(i => i.nome)).toContain('Trigo')
  })

  it('estoque.alertas contém itens com alerta', () => {
    expect(resultado.estoque.alertas.length).toBe(3) // 2 vermelho + 1 amarelo
  })

  it('estoque.criticos contém apenas itens vermelho', () => {
    expect(resultado.estoque.criticos.every(c => {
      const item = itens.find(i => i.id === c.id)
      return item?.alerta === 'vermelho'
    })).toBe(true)
  })

  it('estoque.criticos ordenado do mais crítico para o menos crítico', () => {
    const ratios = resultado.estoque.criticos.map(c => c.saldoAtual / c.estoqueMinimo)
    for (let i = 1; i < ratios.length; i++) {
      expect(ratios[i]).toBeGreaterThanOrEqual(ratios[i - 1])
    }
  })
})

describe('consolidarDashboard — compras e vendas', () => {
  it('consolida totais de compras corretamente', () => {
    expect(resultado.compras.totalComprado).toBe(10000)
    expect(resultado.compras.quantidadeCompras).toBe(5)
    expect(resultado.compras.mes).toEqual({ total: 2000, quantidade: 2 })
  })

  it('consolida totais de vendas corretamente', () => {
    expect(resultado.vendas.totalVendido).toBe(15000)
    expect(resultado.vendas.quantidadeVendas).toBe(12)
    expect(resultado.vendas.mes).toEqual({ total: 3000, quantidade: 4 })
  })
})

// ── calcularFluxoCaixa30d ────────────────────────────────────────────────────

describe('calcularFluxoCaixa30d', () => {
  const hoje = new Date(2026, 4, 30) // 30 mai 2026
  const lancBase = [
    { tipo: 'RECEITA', valor: 1000, dataVencimento: new Date(2026, 4, 30) },
    { tipo: 'DESPESA', valor: 500,  dataVencimento: new Date(2026, 4, 31) },
    { tipo: 'RECEITA', valor: 300,  dataVencimento: new Date(2026, 5,  1) },
  ]

  it('retorna 30 dias por padrão', () => {
    const r = calcularFluxoCaixa30d(5000, lancBase, lancBase, hoje)
    expect(r).toHaveLength(30)
  })

  it('retorna N dias quando dias=N', () => {
    const r = calcularFluxoCaixa30d(5000, [], [], hoje, 7)
    expect(r).toHaveLength(7)
  })

  it('label no formato DD/MM', () => {
    const r = calcularFluxoCaixa30d(5000, [], [], hoje)
    expect(r[0].label).toBe('30/05')
    expect(r[1].label).toBe('31/05')
    expect(r[2].label).toBe('01/06')
  })

  it('entradas sempre positivas ou zero', () => {
    const r = calcularFluxoCaixa30d(5000, lancBase, lancBase, hoje)
    expect(r.every(d => d.entradas >= 0)).toBe(true)
  })

  it('saidas sempre negativas ou zero', () => {
    const r = calcularFluxoCaixa30d(5000, lancBase, lancBase, hoje)
    expect(r.every(d => d.saidas <= 0)).toBe(true)
    expect(r[1].saidas).toBe(-500)
  })

  it('caixaProjetado acumula corretamente dia a dia', () => {
    const r = calcularFluxoCaixa30d(5000, lancBase, lancBase, hoje)
    expect(r[0].caixaProjetado).toBe(6000)  // 5000 + 1000
    expect(r[1].caixaProjetado).toBe(5500)  // 6000 - 500
    expect(r[2].caixaProjetado).toBe(5800)  // 5500 + 300
  })

  it('caixaProjetado desce com saídas consecutivas', () => {
    const soSaidas = [
      { tipo: 'DESPESA', valor: 1000, dataVencimento: new Date(2026, 4, 30) },
      { tipo: 'DESPESA', valor: 1000, dataVencimento: new Date(2026, 4, 31) },
    ]
    const r = calcularFluxoCaixa30d(5000, soSaidas, soSaidas, hoje)
    expect(r[0].caixaProjetado).toBe(4000)
    expect(r[1].caixaProjetado).toBe(3000)
  })

  it('caixaProjetado sobe com entradas consecutivas', () => {
    const soEntradas = [
      { tipo: 'RECEITA', valor: 2000, dataVencimento: new Date(2026, 4, 30) },
      { tipo: 'RECEITA', valor: 3000, dataVencimento: new Date(2026, 4, 31) },
    ]
    const r = calcularFluxoCaixa30d(5000, soEntradas, soEntradas, hoje)
    expect(r[0].caixaProjetado).toBe(7000)
    expect(r[1].caixaProjetado).toBe(10000)
  })

  it('dias sem lançamento mantêm caixaProjetado anterior', () => {
    const umLanc = [{ tipo: 'RECEITA', valor: 1000, dataVencimento: new Date(2026, 4, 30) }]
    const r = calcularFluxoCaixa30d(5000, umLanc, umLanc, hoje)
    expect(r[0].caixaProjetado).toBe(6000)
    expect(r[1].caixaProjetado).toBe(6000) // sem lançamento
    expect(r[2].caixaProjetado).toBe(6000)
  })

  it('barras usam lancamentosBarra, acumulação usa lancamentosProjecao', () => {
    const projecao = [{ tipo: 'RECEITA', valor: 1000, dataVencimento: new Date(2026, 4, 30) }]
    const barra = [
      { tipo: 'RECEITA', valor: 1000, dataVencimento: new Date(2026, 4, 30) },
      { tipo: 'RECEITA', valor: 4000, dataVencimento: new Date(2026, 4, 30) }, // só na barra
    ]
    const r = calcularFluxoCaixa30d(10000, projecao, barra, hoje)
    expect(r[0].entradas).toBe(5000)          // barra mostra todos (1000 + 4000)
    expect(r[0].caixaProjetado).toBe(11000)   // acumula só projecao (10000 + 1000)
  })
})

// ── calcularVendasPorProduto ────────────────────────────────────────────────

describe('calcularVendasPorProduto', () => {
  const itensVenda = [
    { quantidade: 100, valorUnit: 0.5,  item: { nome: 'Pão francês', tipo: 'PRODUTO', unidade: 'un' } },
    { quantidade: 50,  valorUnit: 0.5,  item: { nome: 'Pão francês', tipo: 'PRODUTO', unidade: 'un' } },
    { quantidade: 30,  valorUnit: 5.0,  item: { nome: 'Croissant',   tipo: 'PRODUTO', unidade: 'un' } },
  ]

  it('agrupa quantidade por produto e ordena desc', () => {
    const r = calcularVendasPorProduto(itensVenda)
    const pao = r.quantidade.find(p => p.nome === 'Pão francês')
    expect(pao?.quantidade).toBe(150)
    expect(r.quantidade[0].nome).toBe('Pão francês')
  })

  it('agrupa valor (qtd × valorUnit) por produto', () => {
    const r = calcularVendasPorProduto(itensVenda)
    const pao = r.valor.find(p => p.nome === 'Pão francês')
    expect(pao?.valor).toBeCloseTo(75)
    const croissant = r.valor.find(p => p.nome === 'Croissant')
    expect(croissant?.valor).toBeCloseTo(150)
  })
})

// ── calcularEstoqueInsumos ──────────────────────────────────────────────────

describe('calcularEstoqueInsumos', () => {
  it('retorna apenas insumos e prioriza Trigo', () => {
    const lista = [
      { id: '1', nome: 'Manteiga', tipo: 'INSUMO',   saldoAtual: 10,  unidade: 'kg', estoqueMinimo: 5,   alerta: null },
      { id: '2', nome: 'Trigo',    tipo: 'INSUMO',   saldoAtual: 50,  unidade: 'kg', estoqueMinimo: 100, alerta: 'vermelho' },
      { id: '3', nome: 'Sal',      tipo: 'INSUMO',   saldoAtual: 5,   unidade: 'kg', estoqueMinimo: 2,   alerta: null },
      { id: '4', nome: 'Bolo X',   tipo: 'PRODUTO',  saldoAtual: 100, unidade: 'un', estoqueMinimo: 10,  alerta: null },
    ]
    const r = calcularEstoqueInsumos(lista)
    expect(r[0].nome).toBe('Trigo')
    expect(r.find(i => i.nome === 'Bolo X')).toBeUndefined()
    expect(r).toHaveLength(3)
  })
})

// ── consolidarDashboard — novos campos ─────────────────────────────────────

describe('consolidarDashboard — novos campos', () => {
  it('não quebra com parâmetros opcionais vazios', () => {
    const r = consolidarDashboard(resumoFin, itens, resumoComp, resumoVen, comprasMes, vendasMes, '2026-05-29T12:00:00.000Z', [], [])
    expect(r.fluxoCaixa30d).toHaveLength(30)
    expect(r.vendasPorProduto.quantidade).toEqual([])
    expect(r.vendasPorProduto.valor).toEqual([])
    expect(Array.isArray(r.estoqueInsumos)).toBe(true)
  })
})
