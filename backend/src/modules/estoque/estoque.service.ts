import { TipoMovimento } from '@prisma/client'
import prisma from '../../lib/prisma'

type TipoMov = 'ENTRADA' | 'SAIDA' | 'AJUSTE'

export function calcularNovoSaldo(saldoAtual: number, tipo: TipoMov, quantidade: number): number {
  if (tipo === 'ENTRADA') return saldoAtual + quantidade
  if (tipo === 'SAIDA') {
    const novo = saldoAtual - quantidade
    if (novo < 0) throw new Error('Saldo insuficiente para saída')
    return novo
  }
  // AJUSTE — quantidade pode ser negativa
  const novo = saldoAtual + quantidade
  if (novo < 0) throw new Error('Ajuste resultaria em saldo negativo')
  return novo
}

export function calcularAlerta(saldoAtual: number, estoqueMinimo: number): 'vermelho' | 'amarelo' | null {
  if (saldoAtual <= estoqueMinimo) return 'vermelho'
  if (saldoAtual <= estoqueMinimo * 1.25) return 'amarelo'
  return null
}

export function validarMovimento(tipo: TipoMov, motivo?: string): void {
  if (tipo === 'AJUSTE' && !motivo?.trim()) {
    throw new Error('Motivo é obrigatório para ajuste')
  }
}

function serializar(item: any) {
  return {
    ...item,
    saldoAtual: Number(item.saldoAtual),
    estoqueMinimo: Number(item.estoqueMinimo),
    estoqueIdeal: Number(item.estoqueIdeal),
  }
}

export async function listarItens() {
  const itens = await prisma.item.findMany({ orderBy: { nome: 'asc' } })
  return itens.map(item => ({
    ...serializar(item),
    alerta: calcularAlerta(Number(item.saldoAtual), Number(item.estoqueMinimo)),
  }))
}

export async function cadastrarItem(data: {
  nome: string
  tipo: 'PRODUTO' | 'INSUMO'
  unidade: string
  estoqueMinimo: number
  estoqueIdeal: number
}) {
  return serializar(await prisma.item.create({ data }))
}

export async function atualizarItem(id: string, data: {
  nome?: string
  unidade?: string
  estoqueMinimo?: number
  estoqueIdeal?: number
}) {
  return serializar(await prisma.item.update({ where: { id }, data }))
}

export async function deletarItem(id: string) {
  return prisma.item.delete({ where: { id } })
}

export async function registrarMovimento(
  itemId: string,
  tipo: TipoMov,
  quantidade: number,
  motivo?: string
) {
  validarMovimento(tipo, motivo)

  return prisma.$transaction(async (tx) => {
    const item = await tx.item.findUniqueOrThrow({ where: { id: itemId } })
    const novoSaldo = calcularNovoSaldo(Number(item.saldoAtual), tipo, quantidade)

    await tx.movimentoEstoque.create({
      data: { itemId, tipo: tipo as TipoMovimento, quantidade, motivo },
    })

    return serializar(await tx.item.update({
      where: { id: itemId },
      data: { saldoAtual: novoSaldo },
    }))
  })
}

export async function listarMovimentos(itemId: string) {
  const movimentos = await prisma.movimentoEstoque.findMany({
    where: { itemId },
    orderBy: { createdAt: 'desc' },
  })
  return movimentos.map(m => ({ ...m, quantidade: Number(m.quantidade) }))
}
