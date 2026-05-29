import { describe, it, expect } from 'vitest'
import { validarFornecedor, calcularTicketMedio } from './fornecedores.service'

describe('validarFornecedor', () => {
  it('lança erro quando nome está vazio', () => {
    expect(() => validarFornecedor({ nome: '' })).toThrow('obrigatório')
  })

  it('lança erro quando nome é apenas espaços', () => {
    expect(() => validarFornecedor({ nome: '   ' })).toThrow('obrigatório')
  })

  it('não lança erro com nome válido', () => {
    expect(() => validarFornecedor({ nome: 'Moinho Norte' })).not.toThrow()
  })
})

describe('calcularTicketMedio', () => {
  it('retorna 0 quando sem compras', () => {
    expect(calcularTicketMedio(0, 0)).toBe(0)
  })

  it('calcula corretamente', () => {
    expect(calcularTicketMedio(12000, 4)).toBe(3000)
  })
})
