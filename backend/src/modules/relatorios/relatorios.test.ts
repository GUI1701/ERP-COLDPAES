import { describe, it, expect } from 'vitest'
import { calcularResultado, calcularMedia, calcularPeriodo, gerarUltimosMeses } from './relatorios.service'

describe('calcularResultado', () => {
  it('receitas - despesas', () => {
    expect(calcularResultado(5000, 3000)).toBe(2000)
  })

  it('resultado negativo quando despesas > receitas', () => {
    expect(calcularResultado(3000, 5000)).toBe(-2000)
  })
})

describe('calcularMedia', () => {
  it('total / quantidade', () => {
    expect(calcularMedia(1000, 5)).toBe(200)
  })

  it('retorna 0 quando quantidade = 0', () => {
    expect(calcularMedia(1000, 0)).toBe(0)
  })

  it('retorna 0 quando total e quantidade = 0', () => {
    expect(calcularMedia(0, 0)).toBe(0)
  })
})

describe('calcularPeriodo', () => {
  it('usa datas fornecidas quando com filtro', () => {
    const p = calcularPeriodo('2026-01-01', '2026-01-31')
    expect(p.inicio.getFullYear()).toBe(2026)
    expect(p.inicio.getMonth()).toBe(0)
    expect(p.fim.getMonth()).toBe(0)
  })

  it('usa últimos 30 dias quando sem filtro', () => {
    const p = calcularPeriodo()
    const dias = (p.fim.getTime() - p.inicio.getTime()) / (1000 * 60 * 60 * 24)
    expect(dias).toBeCloseTo(30, 0)
  })
})

describe('gerarUltimosMeses', () => {
  const hoje = new Date(2026, 4, 29) // Maio 2026

  it('gera quantidade correta de meses', () => {
    expect(gerarUltimosMeses(6, hoje)).toHaveLength(6)
  })

  it('meses em ordem crescente com labels corretos', () => {
    const meses = gerarUltimosMeses(6, hoje)
    expect(meses[0].label).toBe('2025-12')
    expect(meses[5].label).toBe('2026-05')
  })

  it('cada mês tem inicio e fim corretos', () => {
    const meses = gerarUltimosMeses(3, hoje)
    expect(meses[2].inicio.getMonth()).toBe(4) // Maio
    expect(meses[2].fim.getMonth()).toBe(4)
  })
})
