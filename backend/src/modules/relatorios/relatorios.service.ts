import prisma from '../../lib/prisma'

export function calcularResultado(receitas: number, despesas: number): number {
  return receitas - despesas
}

export function calcularMedia(total: number, quantidade: number): number {
  if (quantidade === 0) return 0
  return total / quantidade
}

export function calcularPeriodo(inicio?: string, fim?: string): { inicio: Date; fim: Date } {
  if (inicio && fim) {
    return { inicio: new Date(inicio + 'T00:00:00'), fim: new Date(fim + 'T23:59:59.999') }
  }
  const hoje = new Date()
  const ini = new Date(hoje)
  ini.setDate(ini.getDate() - 30)
  return { inicio: ini, fim: hoje }
}

export function gerarUltimosMeses(quantidade: number, hoje: Date) {
  return Array.from({ length: quantidade }, (_, i) => {
    const idx = quantidade - 1 - i
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - idx, 1)
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() - idx + 1, 0, 23, 59, 59, 999)
    const label = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}`
    return { inicio, fim, label }
  })
}

export async function getResumo(inicio: Date, fim: Date) {
  const hoje = new Date()
  const seisMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1)

  const [recAgg, despAgg, compAgg, venAgg, todosItens, movsPeriodo, lancs6m, vens6m, comps6m] =
    await Promise.all([
      prisma.lancamento.aggregate({ where: { tipo: 'RECEITA', status: 'REALIZADO', dataEfetivacao: { gte: inicio, lte: fim } }, _sum: { valor: true }, _count: true }),
      prisma.lancamento.aggregate({ where: { tipo: 'DESPESA', status: 'REALIZADO', dataEfetivacao: { gte: inicio, lte: fim } }, _sum: { valor: true }, _count: true }),
      prisma.compra.aggregate({ where: { data: { gte: inicio, lte: fim } }, _sum: { total: true }, _count: true }),
      prisma.venda.aggregate({ where: { data: { gte: inicio, lte: fim } }, _sum: { total: true }, _count: true }),
      prisma.item.findMany({ select: { id: true, nome: true, tipo: true, saldoAtual: true, estoqueMinimo: true, unidade: true } }),
      prisma.movimentoEstoque.groupBy({ by: ['itemId'], where: { createdAt: { gte: inicio, lte: fim } } }),
      prisma.lancamento.findMany({ where: { status: 'REALIZADO', dataEfetivacao: { gte: seisMesesAtras } }, select: { tipo: true, valor: true, dataEfetivacao: true } }),
      prisma.venda.findMany({ where: { data: { gte: seisMesesAtras } }, select: { total: true, data: true } }),
      prisma.compra.findMany({ where: { data: { gte: seisMesesAtras } }, select: { total: true, data: true } }),
    ])

  const receitas = Number(recAgg._sum.valor ?? 0)
  const despesas = Number(despAgg._sum.valor ?? 0)
  const totalComprado = Number(compAgg._sum.total ?? 0)
  const totalVendido = Number(venAgg._sum.total ?? 0)

  const idsComMov = new Set(movsPeriodo.map(m => m.itemId))
  const itensSemMovimento = todosItens
    .filter(i => !idsComMov.has(i.id))
    .map(i => ({ id: i.id, nome: i.nome, tipo: i.tipo, saldoAtual: Number(i.saldoAtual), unidade: i.unidade }))

  const meses = gerarUltimosMeses(6, hoje)
  const evolucaoMensal = meses.map(mes => {
    const rec = lancs6m.filter(l => l.tipo === 'RECEITA' && l.dataEfetivacao && l.dataEfetivacao >= mes.inicio && l.dataEfetivacao <= mes.fim).reduce((a, l) => a + Number(l.valor), 0)
    const desp = lancs6m.filter(l => l.tipo === 'DESPESA' && l.dataEfetivacao && l.dataEfetivacao >= mes.inicio && l.dataEfetivacao <= mes.fim).reduce((a, l) => a + Number(l.valor), 0)
    const ven = vens6m.filter(v => v.data >= mes.inicio && v.data <= mes.fim).reduce((a, v) => a + Number(v.total), 0)
    const comp = comps6m.filter(c => c.data >= mes.inicio && c.data <= mes.fim).reduce((a, c) => a + Number(c.total), 0)
    return { mes: mes.label, receitas: rec, despesas: desp, resultado: rec - desp, vendas: ven, compras: comp }
  })

  return {
    periodo: { inicio: inicio.toISOString().split('T')[0], fim: fim.toISOString().split('T')[0] },
    financeiro: {
      receitas, despesas,
      resultado: calcularResultado(receitas, despesas),
      ticketMedioReceita: calcularMedia(receitas, recAgg._count),
      ticketMedioDespesa: calcularMedia(despesas, despAgg._count),
    },
    compras: { totalComprado, quantidadeCompras: compAgg._count, compraMedia: calcularMedia(totalComprado, compAgg._count) },
    vendas: { totalVendido, quantidadeVendas: venAgg._count, vendaMedia: calcularMedia(totalVendido, venAgg._count) },
    estoque: {
      itensCadastrados: todosItens.length,
      itensCriticos: todosItens.filter(i => Number(i.saldoAtual) <= Number(i.estoqueMinimo)).length,
      produtos: todosItens.filter(i => i.tipo === 'PRODUTO').length,
      insumos: todosItens.filter(i => i.tipo === 'INSUMO').length,
      itensSemMovimento,
    },
    evolucaoMensal,
  }
}

export async function getRankings(inicio: Date, fim: Date) {
  const [grpVen, grpComp, maiVen, maiComp, maiRec, maiDesp, todosItens] = await Promise.all([
    prisma.itemVenda.groupBy({ by: ['itemId'], where: { venda: { data: { gte: inicio, lte: fim } } }, _sum: { quantidade: true }, orderBy: { _sum: { quantidade: 'desc' } }, take: 5 }),
    prisma.itemCompra.groupBy({ by: ['itemId'], where: { compra: { data: { gte: inicio, lte: fim } } }, _sum: { quantidade: true }, orderBy: { _sum: { quantidade: 'desc' } }, take: 5 }),
    prisma.venda.findMany({ where: { data: { gte: inicio, lte: fim } }, orderBy: { total: 'desc' }, take: 5, select: { id: true, cliente: true, total: true, data: true } }),
    prisma.compra.findMany({ where: { data: { gte: inicio, lte: fim } }, orderBy: { total: 'desc' }, take: 5, select: { id: true, fornecedor: true, total: true, data: true } }),
    prisma.lancamento.findMany({ where: { tipo: 'RECEITA', status: 'REALIZADO', dataEfetivacao: { gte: inicio, lte: fim } }, orderBy: { valor: 'desc' }, take: 5, select: { id: true, descricao: true, valor: true, dataEfetivacao: true } }),
    prisma.lancamento.findMany({ where: { tipo: 'DESPESA', status: 'REALIZADO', dataEfetivacao: { gte: inicio, lte: fim } }, orderBy: { valor: 'desc' }, take: 5, select: { id: true, descricao: true, valor: true, dataEfetivacao: true } }),
    prisma.item.findMany({ select: { id: true, nome: true, tipo: true, saldoAtual: true, estoqueMinimo: true, unidade: true } }),
  ])

  const itemIds = [...new Set([...grpVen.map(g => g.itemId), ...grpComp.map(g => g.itemId)])]
  const itensMap = new Map((await prisma.item.findMany({ where: { id: { in: itemIds } }, select: { id: true, nome: true, unidade: true } })).map(i => [i.id, i]))

  const itensCriticos = todosItens
    .filter(i => Number(i.saldoAtual) <= Number(i.estoqueMinimo))
    .sort((a, b) => {
      const rA = Number(a.estoqueMinimo) > 0 ? Number(a.saldoAtual) / Number(a.estoqueMinimo) : -Infinity
      const rB = Number(b.estoqueMinimo) > 0 ? Number(b.saldoAtual) / Number(b.estoqueMinimo) : -Infinity
      return rA - rB
    })
    .map(i => ({ id: i.id, nome: i.nome, tipo: i.tipo, saldoAtual: Number(i.saldoAtual), estoqueMinimo: Number(i.estoqueMinimo), unidade: i.unidade }))

  return {
    maisVendidos: grpVen.map(g => ({ itemId: g.itemId, nome: itensMap.get(g.itemId)?.nome ?? '', unidade: itensMap.get(g.itemId)?.unidade ?? '', totalQuantidade: Number(g._sum.quantidade ?? 0) })),
    maioresVendas: maiVen.map(v => ({ id: v.id, cliente: v.cliente, total: Number(v.total), data: v.data })),
    maisComprados: grpComp.map(g => ({ itemId: g.itemId, nome: itensMap.get(g.itemId)?.nome ?? '', unidade: itensMap.get(g.itemId)?.unidade ?? '', totalQuantidade: Number(g._sum.quantidade ?? 0) })),
    maioresCompras: maiComp.map(c => ({ id: c.id, fornecedor: c.fornecedor, total: Number(c.total), data: c.data })),
    maioresReceitas: maiRec.map(l => ({ id: l.id, descricao: l.descricao, valor: Number(l.valor), dataEfetivacao: l.dataEfetivacao })),
    maioresDespesas: maiDesp.map(l => ({ id: l.id, descricao: l.descricao, valor: Number(l.valor), dataEfetivacao: l.dataEfetivacao })),
    itensCriticos,
  }
}
