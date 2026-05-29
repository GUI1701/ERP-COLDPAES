import prisma from '../../lib/prisma'

export function calcularTotal(itens: { quantidade: number; valorUnit: number }[]): number {
  return itens.reduce((acc, i) => acc + i.quantidade * i.valorUnit, 0)
}

export function validarItemVenda(tipo: string, nome: string): void {
  if (tipo === 'INSUMO') {
    throw new Error(`"${nome}" é um insumo e não pode ser vendido`)
  }
}

export function validarEstoqueParaVenda(saldoAtual: number, quantidade: number, nome: string): void {
  if (saldoAtual < quantidade) {
    throw new Error(`Saldo insuficiente de "${nome}": ${saldoAtual} disponível, ${quantidade} solicitado`)
  }
}

export async function listarVendas() {
  const lista = await prisma.venda.findMany({
    include: {
      itens: { include: { item: { select: { nome: true, unidade: true } } } },
      lancamentos: { select: { id: true, status: true, dataVencimento: true } },
    },
    orderBy: { data: 'desc' },
  })
  return lista.map(v => ({
    ...v,
    total: Number(v.total),
    itens: v.itens.map(i => ({ ...i, quantidade: Number(i.quantidade), valorUnit: Number(i.valorUnit) })),
  }))
}

export async function buscarVenda(id: string) {
  const v = await prisma.venda.findUniqueOrThrow({
    where: { id },
    include: { itens: { include: { item: true } }, lancamentos: true },
  })
  return { ...v, total: Number(v.total) }
}

export async function getResumoVendas() {
  const agg = await prisma.venda.aggregate({ _sum: { total: true }, _count: true })
  return {
    totalVendido: Number(agg._sum.total ?? 0),
    quantidadeVendas: agg._count,
  }
}

export async function criarVenda(input: {
  cliente?: string
  clienteId?: string
  data: Date
  dataVencimento: Date
  observacao?: string
  itens: Array<{ itemId: string; quantidade: number; valorUnit: number }>
}) {
  return prisma.$transaction(async (tx) => {
    for (const item of input.itens) {
      const itemData = await tx.item.findUniqueOrThrow({ where: { id: item.itemId } })
      validarItemVenda(itemData.tipo, itemData.nome)
      validarEstoqueParaVenda(Number(itemData.saldoAtual), item.quantidade, itemData.nome)
    }

    const total = calcularTotal(input.itens)

    // Auto-fill cliente texto a partir da entidade, se fornecido
    let clienteTexto = input.cliente
    if (input.clienteId && !clienteTexto) {
      const ent = await tx.cliente.findUnique({ where: { id: input.clienteId }, select: { nome: true } })
      if (ent) clienteTexto = ent.nome
    }

    const venda = await tx.venda.create({
      data: { cliente: clienteTexto, clienteId: input.clienteId, data: input.data, observacao: input.observacao, total },
    })

    for (const item of input.itens) {
      await tx.itemVenda.create({
        data: { vendaId: venda.id, itemId: item.itemId, quantidade: item.quantidade, valorUnit: item.valorUnit },
      })
      await tx.movimentoEstoque.create({
        data: { itemId: item.itemId, tipo: 'SAIDA', quantidade: item.quantidade, motivo: 'Venda' },
      })
      await tx.item.update({
        where: { id: item.itemId },
        data: { saldoAtual: { decrement: item.quantidade } },
      })
    }

    await tx.lancamento.create({
      data: {
        descricao: clienteTexto ? `Venda - ${clienteTexto}` : 'Venda',
        tipo: 'RECEITA',
        status: 'PREVISTO',
        valor: total,
        dataVencimento: input.dataVencimento,
        vendaId: venda.id,
      },
    })

    return { ...venda, total: Number(venda.total) }
  })
}

export async function excluirVenda(id: string) {
  return prisma.$transaction(async (tx) => {
    const venda = await tx.venda.findUniqueOrThrow({
      where: { id },
      include: { itens: true, lancamentos: true },
    })

    if (venda.lancamentos.some(l => l.status === 'REALIZADO')) {
      throw new Error('Não é possível excluir venda com lançamento já realizado')
    }

    for (const item of venda.itens) {
      await tx.movimentoEstoque.create({
        data: { itemId: item.itemId, tipo: 'ENTRADA', quantidade: item.quantidade, motivo: 'Cancelamento de venda' },
      })
      await tx.item.update({
        where: { id: item.itemId },
        data: { saldoAtual: { increment: item.quantidade } },
      })
    }

    await tx.lancamento.deleteMany({ where: { vendaId: id } })
    await tx.itemVenda.deleteMany({ where: { vendaId: id } })
    return tx.venda.delete({ where: { id } })
  })
}
