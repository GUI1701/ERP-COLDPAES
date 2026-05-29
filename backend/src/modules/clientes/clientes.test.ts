import { describe, it, expect } from 'vitest'
import { validarCliente, calcularTicketMedio } from './clientes.service'

describe('validarCliente', () => {
  it('lança erro quando nome está vazio', () => {
    expect(() => validarCliente({ nome: '' })).toThrow('obrigatório')
  })

  it('lança erro quando nome é apenas espaços', () => {
    expect(() => validarCliente({ nome: '   ' })).toThrow('obrigatório')
  })

  it('não lança erro com nome válido', () => {
    expect(() => validarCliente({ nome: 'Mercado X' })).not.toThrow()
  })
})

describe('calcularTicketMedio', () => {
  it('retorna 0 quando sem vendas', () => {
    expect(calcularTicketMedio(0, 0)).toBe(0)
  })

  it('calcula corretamente', () => {
    expect(calcularTicketMedio(9000, 3)).toBe(3000)
  })
})
