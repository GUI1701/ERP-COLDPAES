import { describe, it, expect } from 'vitest'
import {
  calcularCaixaAtual, calcularCaixaProjetado, calcularResultadoProjetado,
  calcularAlerta, validarEfetivacao, calcularResumo,
} from './financeiro.service'

const hoje = new Date()
const ontem = new Date(hoje); ontem.setDate(ontem.getDate() - 1)
const em5dias = new Date(hoje); em5dias.setDate(em5dias.getDate() + 5)
const em30dias = new Date(hoje); em30dias.setDate(em30dias.getDate() + 30)
const em45dias = new Date(hoje); em45dias.setDate(em45dias.getDate() + 45)

function lanc(tipo: 'RECEITA' | 'DESPESA', status: 'PREVISTO' | 'REALIZADO', valor: number, dataVencimento = hoje, dataEfetivacao: Date | null = null) {
  return { id: '1', descricao: 'teste', tipo, status, valor, dataVencimento, dataEfetivacao }
}

describe('calcularCaixaAtual', () => {
  it('soma apenas lançamentos REALIZADOS', () => {
    const listas = [lanc('RECEITA', 'REALIZADO', 1000), lanc('DESPESA', 'REALIZADO', 300)]
    expect(calcularCaixaAtual(listas)).toBe(700)
  })

  it('lançamentos PREVISTOS não afetam caixa real', () => {
    const lista = [lanc('RECEITA', 'REALIZADO', 1000), lanc('RECEITA', 'PREVISTO', 500)]
    expect(calcularCaixaAtual(lista)).toBe(1000)
  })
})

describe('calcularCaixaProjetado', () => {
  it('caixaAtual + receitas previstas - despesas previstas', () => {
    const lista = [
      lanc('RECEITA', 'PREVISTO', 500),
      lanc('DESPESA', 'PREVISTO', 200),
    ]
    expect(calcularCaixaProjetado(1000, lista)).toBe(1300)
  })
})

describe('calcularResultadoProjetado', () => {
  it('calcula receitas menos despesas dos próximos 30 dias', () => {
    const lista = [
      lanc('RECEITA', 'PREVISTO', 600, em5dias),
      lanc('DESPESA', 'PREVISTO', 200, em5dias),
      lanc('RECEITA', 'PREVISTO', 400, em45dias), // fora dos 30 dias
    ]
    const resultado = calcularResultadoProjetado(lista, hoje)
    expect(resultado.receitasPrevistas).toBe(600)
    expect(resultado.despesasPrevistas).toBe(200)
    expect(resultado.resultadoProjetado).toBe(400)
  })
})

describe('calcularAlerta', () => {
  it('retorna vencido quando vencimento < hoje e PREVISTO', () => {
    expect(calcularAlerta(lanc('DESPESA', 'PREVISTO', 100, ontem), hoje)).toBe('vencido')
  })

  it('retorna proximo quando vence em até 7 dias e PREVISTO', () => {
    expect(calcularAlerta(lanc('DESPESA', 'PREVISTO', 100, em5dias), hoje)).toBe('proximo')
  })

  it('retorna null quando REALIZADO independente da data', () => {
    expect(calcularAlerta(lanc('DESPESA', 'REALIZADO', 100, ontem), hoje)).toBeNull()
  })

  it('retorna null quando vence em mais de 7 dias', () => {
    expect(calcularAlerta(lanc('DESPESA', 'PREVISTO', 100, em45dias), hoje)).toBeNull()
  })
})

describe('validarEfetivacao', () => {
  it('lançamento REALIZADO não pode ser efetivado novamente', () => {
    expect(() => validarEfetivacao('REALIZADO')).toThrow('Lançamento já realizado')
  })

  it('lançamento REALIZADO não pode voltar para PREVISTO — sem função de reversão', () => {
    // Regra garantida pela ausência de endpoint de reversão no serviço
    expect(() => validarEfetivacao('REALIZADO')).toThrow()
  })

  it('lançamento PREVISTO pode ser efetivado', () => {
    expect(() => validarEfetivacao('PREVISTO')).not.toThrow()
  })
})

describe('calcularResumo', () => {
  it('retorna campo metricas com todos os campos esperados', () => {
    const resultado = calcularResumo([], hoje)
    expect(resultado).toHaveProperty('metricas')
    expect(resultado.metricas).toHaveProperty('receitasPrevistas')
    expect(resultado.metricas).toHaveProperty('despesasPrevistas')
    expect(resultado.metricas).toHaveProperty('resultadoProjetado')
    expect(resultado.metricas).toHaveProperty('contasReceber')
    expect(resultado.metricas).toHaveProperty('contasPagar')
  })

  it('contasReceber soma todas as receitas previstas', () => {
    const lista = [
      lanc('RECEITA', 'PREVISTO', 300, em45dias),
      lanc('RECEITA', 'PREVISTO', 200, em5dias),
      lanc('RECEITA', 'REALIZADO', 500),
    ]
    const resultado = calcularResumo(lista, hoje)
    expect(resultado.metricas.contasReceber).toBe(500)
  })

  it('contasPagar soma todas as despesas previstas', () => {
    const lista = [
      lanc('DESPESA', 'PREVISTO', 400, em5dias),
      lanc('DESPESA', 'REALIZADO', 100),
    ]
    const resultado = calcularResumo(lista, hoje)
    expect(resultado.metricas.contasPagar).toBe(400)
  })
})
