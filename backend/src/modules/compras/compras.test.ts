import { describe, it, expect } from 'vitest'
import { calcularTotal, validarCancelamentoCompra } from './compras.service'

describe('calcularTotal', () => {
  it('soma quantidade × valorUnit corretamente', () => {
    expect(calcularTotal([{ quantidade: 2, valorUnit: 50 }])).toBe(100)
  })

  it('múltiplos itens com valores diferentes', () => {
    expect(calcularTotal([
      { quantidade: 3, valorUnit: 10 },
      { quantidade: 2, valorUnit: 25 },
    ])).toBe(80)
  })
})

describe('validarCancelamentoCompra', () => {
  it('passa quando saldo >= quantidade para todos os itens', () => {
    expect(() => validarCancelamentoCompra([
      { saldoAtual: 100, quantidade: 50, nome: 'Trigo' },
      { saldoAtual: 20, quantidade: 20, nome: 'Manteiga' },
    ])).not.toThrow()
  })

  it('lança erro quando saldo < quantidade', () => {
    expect(() => validarCancelamentoCompra([
      { saldoAtual: 30, quantidade: 50, nome: 'Trigo' },
    ])).toThrow('Trigo')
  })

  it('lança erro quando saldo = 0', () => {
    expect(() => validarCancelamentoCompra([
      { saldoAtual: 0, quantidade: 10, nome: 'Fermento' },
    ])).toThrow('Fermento')
  })
})
