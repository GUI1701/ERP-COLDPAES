import { describe, it, expect } from 'vitest'
import { consolidarDashboard } from './dashboard.service'

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
