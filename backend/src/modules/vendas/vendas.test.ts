import { describe, it, expect } from 'vitest'
import { calcularTotal, validarItemVenda, validarEstoqueParaVenda } from './vendas.service'

describe('calcularTotal', () => {
  it('soma quantidade × valorUnit corretamente', () => {
    expect(calcularTotal([{ quantidade: 5, valorUnit: 8 }])).toBe(40)
  })

  it('múltiplos itens com valores diferentes', () => {
    expect(calcularTotal([
      { quantidade: 2, valorUnit: 15 },
      { quantidade: 4, valorUnit: 10 },
    ])).toBe(70)
  })
})

describe('validarItemVenda', () => {
  it('aceita item do tipo PRODUTO', () => {
    expect(() => validarItemVenda('PRODUTO', 'Pão de queijo')).not.toThrow()
  })

  it('lança erro para item do tipo INSUMO', () => {
    expect(() => validarItemVenda('INSUMO', 'Trigo')).toThrow('insumo')
  })
})

describe('validarEstoqueParaVenda', () => {
  it('passa quando saldo >= quantidade', () => {
    expect(() => validarEstoqueParaVenda(100, 50, 'Pão')).not.toThrow()
  })

  it('passa quando saldo = quantidade', () => {
    expect(() => validarEstoqueParaVenda(50, 50, 'Pão')).not.toThrow()
  })

  it('lança erro quando saldo < quantidade', () => {
    expect(() => validarEstoqueParaVenda(30, 50, 'Pão')).toThrow('insuficiente')
  })

  it('lança erro quando saldo = 0', () => {
    expect(() => validarEstoqueParaVenda(0, 1, 'Pão')).toThrow('insuficiente')
  })
})
