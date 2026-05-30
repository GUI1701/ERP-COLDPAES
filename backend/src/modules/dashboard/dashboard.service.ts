import prisma from '../../lib/prisma'
import { listarItens } from '../estoque/estoque.service'
import { getResumo as getResumoFinanceiro } from '../financeiro/financeiro.service'
import { getResumoCompras } from '../compras/compras.service'
import { getResumoVendas } from '../vendas/vendas.service'

type LancPrevisto = { tipo: string; valor: number; dataVencimento: Date }
type ItemVendaMes = { quantidade: number; valorUnit: number; item: { nome: string; tipo: string; unidade: string } }
type ItemComAlerta = { id: string; nome: string; tipo: string; saldoAtual: number; estoqueMinimo: number; unidade: string; alerta: string | null }

// ── Pure analysis functions ──────────────────────────────────────────────────

export function calcularFluxoCaixa30d(
  caixaAtual: number,
  lancamentosProjecao: LancPrevisto[],
  lancamentosBarra: LancPrevisto[] = lancamentosProjecao,
  hoje: Date = new Date(),
  dias: number = 30,
): Array<{ data: string; label: string; entradas: number; saidas: number; caixaProjetado: number }> {
  // Mapa para barras visuais (inclui PREVISTO + REALIZADO)
  const mapaBarras = new Map<string, { entradas: number; saidas: number }>()
  for (const l of lancamentosBarra) {
    const d = new Date(l.dataVencimento)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const curr = mapaBarras.get(key) ?? { entradas: 0, saidas: 0 }
    if (l.tipo === 'RECEITA') curr.entradas += l.valor
    else curr.saidas += l.valor
    mapaBarras.set(key, curr)
  }

  // Mapa para acumulação do caixaProjetado (somente PREVISTO)
  const mapaProjecao = new Map<string, { entradas: number; saidas: number }>()
  for (const l of lancamentosProjecao) {
    const d = new Date(l.dataVencimento)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const curr = mapaProjecao.get(key) ?? { entradas: 0, saidas: 0 }
    if (l.tipo === 'RECEITA') curr.entradas += l.valor
    else curr.saidas += l.valor
    mapaProjecao.set(key, curr)
  }

  let saldo = caixaAtual
  return Array.from({ length: dias }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`

    const barras = mapaBarras.get(key) ?? { entradas: 0, saidas: 0 }
    const projecao = mapaProjecao.get(key) ?? { entradas: 0, saidas: 0 }

    saldo = saldo + projecao.entradas - projecao.saidas

    return {
      data: key,
      label,
      entradas: barras.entradas,   // positivo
      saidas: -barras.saidas,      // negativo
      caixaProjetado: saldo,
    }
  })
}

export function calcularVendasPorProduto(itensVenda: ItemVendaMes[]): {
  quantidade: Array<{ nome: string; quantidade: number; unidade: string }>
  valor: Array<{ nome: string; valor: number }>
} {
  const qtdMap = new Map<string, { nome: string; quantidade: number; unidade: string }>()
  const valMap = new Map<string, { nome: string; valor: number }>()

  for (const iv of itensVenda) {
    const nome = iv.item.nome
    const qtd = Number(iv.quantidade)
    const val = qtd * Number(iv.valorUnit)

    const prevQtd = qtdMap.get(nome) ?? { nome, quantidade: 0, unidade: iv.item.unidade }
    qtdMap.set(nome, { ...prevQtd, quantidade: prevQtd.quantidade + qtd })

    const prevVal = valMap.get(nome) ?? { nome, valor: 0 }
    valMap.set(nome, { ...prevVal, valor: prevVal.valor + val })
  }

  return {
    quantidade: [...qtdMap.values()].sort((a, b) => b.quantidade - a.quantidade),
    valor: [...valMap.values()].sort((a, b) => b.valor - a.valor),
  }
}

export function calcularEstoqueInsumos(itens: ItemComAlerta[]): Array<{
  id: string; nome: string; saldoAtual: number; unidade: string; estoqueMinimo: number; alerta: string | null
}> {
  const alertaOrdem: Record<string, number> = { vermelho: 0, amarelo: 1 }
  return itens
    .filter(i => i.tipo === 'INSUMO')
    .map(i => ({ id: i.id, nome: i.nome, saldoAtual: i.saldoAtual, unidade: i.unidade, estoqueMinimo: i.estoqueMinimo, alerta: i.alerta }))
    .sort((a, b) => {
      const aTrigo = a.nome.toLowerCase().includes('trigo') ? 0 : 1
      const bTrigo = b.nome.toLowerCase().includes('trigo') ? 0 : 1
      if (aTrigo !== bTrigo) return aTrigo - bTrigo
      const aOrd = a.alerta != null ? (alertaOrdem[a.alerta] ?? 2) : 2
      const bOrd = b.alerta != null ? (alertaOrdem[b.alerta] ?? 2) : 2
      if (aOrd !== bOrd) return aOrd - bOrd
      return a.nome.localeCompare(b.nome)
    })
}

// ── Consolidation ────────────────────────────────────────────────────────────

export function consolidarDashboard(
  resumoFin: any,
  itens: any[],
  resumoComp: any,
  resumoVen: any,
  comprasMes: { total: number; quantidade: number },
  vendasMes: { total: number; quantidade: number },
  ultimaAtualizacao: string = new Date().toISOString(),
  lancamentosProjecao: LancPrevisto[] = [],
  itensVendaMes: ItemVendaMes[] = [],
  lancamentosBarra: LancPrevisto[] = [],
) {
  const produtos = itens
    .filter(i => i.tipo === 'PRODUTO')
    .map(i => ({ id: i.id, nome: i.nome, saldoAtual: i.saldoAtual, unidade: i.unidade, alerta: i.alerta }))

  const insumos = itens
    .filter(i => i.tipo === 'INSUMO')
    .map(i => ({ id: i.id, nome: i.nome, saldoAtual: i.saldoAtual, unidade: i.unidade, alerta: i.alerta }))

  const alertasEstoque = itens
    .filter(i => i.alerta !== null)
    .map(i => ({ id: i.id, nome: i.nome, tipo: i.tipo, saldoAtual: i.saldoAtual, estoqueMinimo: i.estoqueMinimo, unidade: i.unidade, alerta: i.alerta }))

  const criticos = itens
    .filter(i => i.alerta === 'vermelho')
    .sort((a, b) => {
      const rA = a.estoqueMinimo > 0 ? a.saldoAtual / a.estoqueMinimo : -Infinity
      const rB = b.estoqueMinimo > 0 ? b.saldoAtual / b.estoqueMinimo : -Infinity
      return rA - rB
    })
    .map(i => ({ id: i.id, nome: i.nome, tipo: i.tipo, saldoAtual: i.saldoAtual, estoqueMinimo: i.estoqueMinimo, unidade: i.unidade }))

  const barras = lancamentosBarra.length > 0 ? lancamentosBarra : lancamentosProjecao

  return {
    ultimaAtualizacao,
    financeiro: {
      caixaAtual: resumoFin.caixaAtual,
      caixaProjetado: resumoFin.caixaProjetado,
      entradasDia: resumoFin.entradasDia,
      saidasDia: resumoFin.saidasDia,
      receitasPrevistas: resumoFin.metricas.receitasPrevistas,
      despesasPrevistas: resumoFin.metricas.despesasPrevistas,
      resultadoProjetado: resumoFin.metricas.resultadoProjetado,
      alertas: resumoFin.alertas,
    },
    estoque: { produtos, insumos, alertas: alertasEstoque, criticos },
    compras: {
      totalComprado: resumoComp.totalComprado,
      quantidadeCompras: resumoComp.quantidadeCompras,
      mes: comprasMes,
    },
    vendas: {
      totalVendido: resumoVen.totalVendido,
      quantidadeVendas: resumoVen.quantidadeVendas,
      mes: vendasMes,
    },
    fluxoCaixa30d: calcularFluxoCaixa30d(resumoFin.caixaAtual, lancamentosProjecao, barras),
    vendasPorProduto: calcularVendasPorProduto(itensVendaMes),
    estoqueInsumos: calcularEstoqueInsumos(itens),
  }
}

// ── Data fetching ────────────────────────────────────────────────────────────

export async function getDashboardResumo() {
  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const em30Dias = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 30)

  const [resumoFin, itens, resumoComp, resumoVen, aggComp, aggVen, lancPrevisto, itensVendaMes, lancTodos] =
    await Promise.all([
      getResumoFinanceiro(),
      listarItens(),
      getResumoCompras(),
      getResumoVendas(),
      prisma.compra.aggregate({ where: { data: { gte: inicioMes } }, _sum: { total: true }, _count: true }),
      prisma.venda.aggregate({ where: { data: { gte: inicioMes } }, _sum: { total: true }, _count: true }),
      // PREVISTO apenas — para acumulação do caixaProjetado
      prisma.lancamento.findMany({
        where: { status: 'PREVISTO', dataVencimento: { gte: hoje, lte: em30Dias } },
        select: { tipo: true, valor: true, dataVencimento: true },
      }),
      prisma.itemVenda.findMany({
        where: { venda: { data: { gte: inicioMes } } },
        select: { quantidade: true, valorUnit: true, item: { select: { nome: true, tipo: true, unidade: true } } },
      }),
      // PREVISTO + REALIZADO — para as barras do Gráfico 1
      prisma.lancamento.findMany({
        where: { dataVencimento: { gte: hoje, lte: em30Dias } },
        select: { tipo: true, valor: true, dataVencimento: true },
      }),
    ])

  return consolidarDashboard(
    resumoFin, itens, resumoComp, resumoVen,
    { total: Number(aggComp._sum.total ?? 0), quantidade: aggComp._count },
    { total: Number(aggVen._sum.total ?? 0), quantidade: aggVen._count },
    new Date().toISOString(),
    lancPrevisto.map(l => ({ tipo: String(l.tipo), valor: Number(l.valor), dataVencimento: l.dataVencimento })),
    itensVendaMes.map(iv => ({ quantidade: Number(iv.quantidade), valorUnit: Number(iv.valorUnit), item: iv.item })),
    lancTodos.map(l => ({ tipo: String(l.tipo), valor: Number(l.valor), dataVencimento: l.dataVencimento })),
  )
}
