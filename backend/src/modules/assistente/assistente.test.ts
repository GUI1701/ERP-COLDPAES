import { describe, it, expect } from 'vitest'
import {
  analisarCaixa,
  analisarItensCriticos,
  analisarContasVencidas,
  analisarVendasVsCompras,
  analisarProdutoMaisVendido,
  analisarInsumoMaisComprado,
  analisarFornecedorMaiorCusto,
  analisarClienteMaiorReceita,
  analisarItensSemMovimento,
  analisarResultadoProjetado,
  analisarClienteQueda,
  identificarPergunta,
  gerarAlertasCriticos,
} from './assistente.service'
import type { DadosAssistente } from './assistente.service'

describe('analisarCaixa', () => {
  it('caixa projetado positivo → normal', () => {
    const r = analisarCaixa({ caixaAtual: 10000, caixaProjetado: 12000, resultadoProjetado: 2000 })
    expect(r.nivel).toBe('normal')
    expect(r.dados.caixaProjetado).toBe(12000)
  })

  it('caixa projetado negativo → critico', () => {
    const r = analisarCaixa({ caixaAtual: 5000, caixaProjetado: -1000, resultadoProjetado: -6000 })
    expect(r.nivel).toBe('critico')
    expect(r.dados.caixaProjetado).toBe(-1000)
  })
})

describe('analisarItensCriticos', () => {
  it('5 itens críticos → critico', () => {
    const itens = Array.from({ length: 5 }, (_, i) => ({
      nome: `Item ${i}`, tipo: 'PRODUTO', saldoAtual: 0, estoqueMinimo: 10,
    }))
    const r = analisarItensCriticos(itens)
    expect(r.nivel).toBe('critico')
    expect(r.dados.quantidade).toBe(5)
  })
})

describe('analisarContasVencidas', () => {
  it('contas vencidas → critico', () => {
    const alertas = [
      { descricao: 'Aluguel', valor: 3000, tipo: 'vencido' as const, tipoLancamento: 'DESPESA' },
      { descricao: 'Energia', valor: 500, tipo: 'vencido' as const, tipoLancamento: 'DESPESA' },
    ]
    const r = analisarContasVencidas(alertas)
    expect(r.nivel).toBe('critico')
    expect(r.dados.vencidas).toBe(2)
  })
})

describe('analisarVendasVsCompras', () => {
  it('vendas > compras → normal', () => {
    const r = analisarVendasVsCompras({ total: 15000 }, { total: 10000 })
    expect(r.nivel).toBe('normal')
    expect(r.dados.cobertura).toBe(150)
  })

  it('vendas < 80% das compras → critico', () => {
    const r = analisarVendasVsCompras({ total: 5000 }, { total: 10000 })
    expect(r.nivel).toBe('critico')
    expect(r.dados.cobertura).toBe(50)
  })
})

describe('analisarProdutoMaisVendido', () => {
  it('retorna nome do produto mais vendido', () => {
    const r = analisarProdutoMaisVendido([{ nome: 'Pão Francês', totalQuantidade: 500, unidade: 'un' }])
    expect(r.nivel).toBe('normal')
    expect(r.resposta).toContain('Pão Francês')
  })
})

describe('analisarInsumoMaisComprado', () => {
  it('retorna nome do insumo mais comprado', () => {
    const r = analisarInsumoMaisComprado([{ nome: 'Farinha de Trigo', totalQuantidade: 200, unidade: 'kg' }])
    expect(r.nivel).toBe('normal')
    expect(r.resposta).toContain('Farinha de Trigo')
  })
})

describe('analisarFornecedorMaiorCusto', () => {
  it('retorna nome do fornecedor com maior custo', () => {
    const r = analisarFornecedorMaiorCusto([{ fornecedor: 'Distribuidora XYZ', total: 8000 }])
    expect(r.nivel).toBe('normal')
    expect(r.resposta).toContain('Distribuidora XYZ')
  })
})

describe('analisarClienteMaiorReceita', () => {
  it('retorna nome do cliente com maior receita', () => {
    const r = analisarClienteMaiorReceita([{ cliente: 'Mercado Central', total: 12000 }])
    expect(r.nivel).toBe('normal')
    expect(r.resposta).toContain('Mercado Central')
  })
})

describe('analisarItensSemMovimento', () => {
  it('8 itens parados → atencao', () => {
    const itens = Array.from({ length: 8 }, (_, i) => ({ nome: `Item ${i}`, tipo: 'PRODUTO' }))
    const r = analisarItensSemMovimento(itens)
    expect(r.nivel).toBe('atencao')
    expect(r.dados.quantidade).toBe(8)
  })
})

describe('analisarResultadoProjetado', () => {
  it('resultado negativo → critico', () => {
    const r = analisarResultadoProjetado({ resultadoProjetado: -2000, receitasPrevistas: 5000, despesasPrevistas: 7000 })
    expect(r.nivel).toBe('critico')
  })
})

describe('analisarClienteQueda', () => {
  it('queda de 42% → atencao', () => {
    const atual = [{ cliente: 'Mercado São João', total: 5800 }]
    const anterior = [{ cliente: 'Mercado São João', total: 10000 }]
    const r = analisarClienteQueda(atual, anterior)
    expect(r.nivel).toBe('atencao')
    expect(r.dados.variacao).toBe(-42)
    expect(r.dados.cliente).toBe('Mercado São João')
  })

  it('queda de 60% → critico', () => {
    const atual = [{ cliente: 'Padaria Sol', total: 4000 }]
    const anterior = [{ cliente: 'Padaria Sol', total: 10000 }]
    const r = analisarClienteQueda(atual, anterior)
    expect(r.nivel).toBe('critico')
  })

  it('variação mínima → normal', () => {
    const atual = [{ cliente: 'Loja ABC', total: 9500 }]
    const anterior = [{ cliente: 'Loja ABC', total: 10000 }]
    const r = analisarClienteQueda(atual, anterior)
    expect(r.nivel).toBe('normal')
  })
})

describe('identificarPergunta', () => {
  it('pergunta desconhecida retorna null', () => {
    expect(identificarPergunta('qual o clima amanhã?')).toBeNull()
  })
})

describe('gerarAlertasCriticos', () => {
  it('retorna apenas itens criticos quando caixa negativo e contas vencidas', () => {
    const dados = {
      dashboard: {
        financeiro: {
          caixaAtual: 1000,
          caixaProjetado: -500,
          resultadoProjetado: -1500,
          receitasPrevistas: 0,
          despesasPrevistas: 1500,
          entradasDia: 0,
          saidasDia: 0,
          alertas: [
            { id: '1', descricao: 'Aluguel', valor: 2000, dataVencimento: new Date(), tipo: 'vencido' as const, tipoLancamento: 'DESPESA' },
          ],
        },
        estoque: { criticos: [], alertas: [], produtos: [], insumos: [] },
        compras: { totalComprado: 0, quantidadeCompras: 0, mes: { total: 0, quantidade: 0 } },
        vendas: { totalVendido: 0, quantidadeVendas: 0, mes: { total: 0, quantidade: 0 } },
        ultimaAtualizacao: '',
      },
      rankings: { maisVendidos: [], maisComprados: [], maioresVendas: [], maioresCompras: [], maioresReceitas: [], maioresDespesas: [], itensCriticos: [] },
      resumo: { estoque: { itensSemMovimento: [], itensCriticos: 0, itensCadastrados: 0, produtos: 0, insumos: 0 }, financeiro: {}, compras: {}, vendas: {}, periodo: {}, evolucaoMensal: [] },
      vendasClienteAtual: [],
      vendasClienteAnterior: [],
    } as unknown as DadosAssistente

    const alertas = gerarAlertasCriticos(dados)
    expect(alertas.length).toBeGreaterThanOrEqual(2)
    expect(alertas.every(a => a.nivel === 'critico')).toBe(true)
  })
})
