import prisma from '../../lib/prisma'

export function calcularTotal(itens: { quantidade: number; valorUnit: number }[]): number {
  return itens.reduce((acc, i) => acc + i.quantidade * i.valorUnit, 0)
}

export function validarCancelamentoCompra(
  itens: { saldoAtual: number; quantidade: number; nome: string }[]
): void {
  for (const i of itens) {
    if (i.saldoAtual < i.quantidade) {
      throw new Error(`Estoque de "${i.nome}" insuficiente para cancelar a compra`)
    }
  }
}

export async function listarCompras() {
  const lista = await prisma.compra.findMany({
    include: {
      itens: { include: { item: { select: { nome: true, unidade: true } } } },
      lancamentos: { select: { id: true, status: true, dataVencimento: true } },
    },
    orderBy: { data: 'desc' },
  })
  return lista.map(c => ({
    ...c,
    total: Number(c.total),
    itens: c.itens.map(i => ({ ...i, quantidade: Number(i.quantidade), valorUnit: Number(i.valorUnit) })),
  }))
}

export async function buscarCompra(id: string) {
  const c = await prisma.compra.findUniqueOrThrow({
    where: { id },
    include: { itens: { include: { item: true } }, lancamentos: true },
  })
  return { ...c, total: Number(c.total) }
}

export async function getResumoCompras() {
  const agg = await prisma.compra.aggregate({ _sum: { total: true }, _count: true })
  return {
    totalComprado: Number(agg._sum.total ?? 0),
    quantidadeCompras: agg._count,
  }
}

export async function criarCompra(input: {
  fornecedor?: string
  data: Date
  dataVencimento: Date
  observacao?: string
  itens: Array<{ itemId: string; quantidade: number; valorUnit: number }>
}) {
  const total = calcularTotal(input.itens)

  return prisma.$transaction(async (tx) => {
    const compra = await tx.compra.create({
      data: { fornecedor: input.fornecedor, data: input.data, observacao: input.observacao, total },
    })

    for (const item of input.itens) {
      await tx.itemCompra.create({
        data: { compraId: compra.id, itemId: item.itemId, quantidade: item.quantidade, valorUnit: item.valorUnit },
      })
      await tx.movimentoEstoque.create({
        data: { itemId: item.itemId, tipo: 'ENTRADA', quantidade: item.quantidade, motivo: 'Compra' },
      })
      await tx.item.update({
        where: { id: item.itemId },
        data: { saldoAtual: { increment: item.quantidade }, ultimoCusto: item.valorUnit },
      })
    }

    await tx.lancamento.create({
      data: {
        descricao: input.fornecedor ? `Compra - ${input.fornecedor}` : 'Compra',
        tipo: 'DESPESA',
        status: 'PREVISTO',
        valor: total,
        dataVencimento: input.dataVencimento,
        compraId: compra.id,
      },
    })

    return { ...compra, total: Number(compra.total) }
  })
}

export async function excluirCompra(id: string) {
  return prisma.$transaction(async (tx) => {
    const compra = await tx.compra.findUniqueOrThrow({
      where: { id },
      include: { itens: { include: { item: true } }, lancamentos: true },
    })

    if (compra.lancamentos.some(l => l.status === 'REALIZADO')) {
      throw new Error('Não é possível excluir compra com lançamento já realizado')
    }

    validarCancelamentoCompra(
      compra.itens.map(i => ({
        saldoAtual: Number(i.item.saldoAtual),
        quantidade: Number(i.quantidade),
        nome: i.item.nome,
      }))
    )

    for (const item of compra.itens) {
      await tx.movimentoEstoque.create({
        data: { itemId: item.itemId, tipo: 'SAIDA', quantidade: item.quantidade, motivo: 'Cancelamento de compra' },
      })
      await tx.item.update({
        where: { id: item.itemId },
        data: { saldoAtual: { decrement: item.quantidade } },
      })
    }

    await tx.lancamento.deleteMany({ where: { compraId: id } })
    await tx.itemCompra.deleteMany({ where: { compraId: id } })
    return tx.compra.delete({ where: { id } })
  })
}
