import prisma from '../../lib/prisma'
import { listarItens } from '../estoque/estoque.service'
import { getResumo as getResumoFinanceiro } from '../financeiro/financeiro.service'
import { getResumoCompras } from '../compras/compras.service'
import { getResumoVendas } from '../vendas/vendas.service'

export function consolidarDashboard(
  resumoFin: any,
  itens: any[],
  resumoComp: any,
  resumoVen: any,
  comprasMes: { total: number; quantidade: number },
  vendasMes: { total: number; quantidade: number },
  ultimaAtualizacao: string = new Date().toISOString()
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
  }
}

export async function getDashboardResumo() {
  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

  const [resumoFin, itens, resumoComp, resumoVen, aggComp, aggVen] = await Promise.all([
    getResumoFinanceiro(),
    listarItens(),
    getResumoCompras(),
    getResumoVendas(),
    prisma.compra.aggregate({ where: { data: { gte: inicioMes } }, _sum: { total: true }, _count: true }),
    prisma.venda.aggregate({ where: { data: { gte: inicioMes } }, _sum: { total: true }, _count: true }),
  ])

  return consolidarDashboard(
    resumoFin, itens, resumoComp, resumoVen,
    { total: Number(aggComp._sum.total ?? 0), quantidade: aggComp._count },
    { total: Number(aggVen._sum.total ?? 0), quantidade: aggVen._count }
  )
}
