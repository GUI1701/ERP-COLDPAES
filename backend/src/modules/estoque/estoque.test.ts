import { describe, it, expect } from 'vitest'
import { calcularNovoSaldo, calcularAlerta, validarMovimento } from './estoque.service'

describe('calcularNovoSaldo', () => {
  it('entrada aumenta saldo', () => {
    expect(calcularNovoSaldo(100, 'ENTRADA', 50)).toBe(150)
  })

  it('saída reduz saldo', () => {
    expect(calcularNovoSaldo(100, 'SAIDA', 30)).toBe(70)
  })

  it('saída maior que saldo lança erro', () => {
    expect(() => calcularNovoSaldo(50, 'SAIDA', 60)).toThrow('Saldo insuficiente')
  })

  it('ajuste positivo aumenta saldo', () => {
    expect(calcularNovoSaldo(100, 'AJUSTE', 20)).toBe(120)
  })

  it('ajuste negativo reduz saldo', () => {
    expect(calcularNovoSaldo(120, 'AJUSTE', -20)).toBe(100)
  })

  it('ajuste que deixa saldo negativo lança erro', () => {
    expect(() => calcularNovoSaldo(100, 'AJUSTE', -150)).toThrow('saldo negativo')
  })
})

describe('calcularAlerta', () => {
  it('retorna vermelho quando saldo igual ao mínimo', () => {
    expect(calcularAlerta(100, 100)).toBe('vermelho')
  })

  it('retorna vermelho quando saldo abaixo do mínimo', () => {
    expect(calcularAlerta(80, 100)).toBe('vermelho')
  })

  it('retorna amarelo quando saldo até 125% do mínimo', () => {
    expect(calcularAlerta(120, 100)).toBe('amarelo')
    expect(calcularAlerta(125, 100)).toBe('amarelo')
  })

  it('retorna null quando estoque está normal', () => {
    expect(calcularAlerta(126, 100)).toBeNull()
    expect(calcularAlerta(200, 100)).toBeNull()
  })
})

describe('validarMovimento', () => {
  it('ajuste sem motivo lança erro', () => {
    expect(() => validarMovimento('AJUSTE')).toThrow('Motivo é obrigatório')
    expect(() => validarMovimento('AJUSTE', '')).toThrow('Motivo é obrigatório')
    expect(() => validarMovimento('AJUSTE', '   ')).toThrow('Motivo é obrigatório')
  })

  it('ajuste com motivo não lança erro', () => {
    expect(() => validarMovimento('AJUSTE', 'Correção por inventário')).not.toThrow()
  })

  it('entrada e saída não exigem motivo', () => {
    expect(() => validarMovimento('ENTRADA')).not.toThrow()
    expect(() => validarMovimento('SAIDA')).not.toThrow()
  })
})
