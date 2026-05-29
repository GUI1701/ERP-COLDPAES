import prisma from '../../lib/prisma'

interface LancBase {
  id: string
  descricao: string
  tipo: 'RECEITA' | 'DESPESA'
  status: 'PREVISTO' | 'REALIZADO'
  valor: number
  dataVencimento: Date
  dataEfetivacao: Date | null
}

export function calcularCaixaAtual(lancamentos: LancBase[]): number {
  return lancamentos
    .filter(l => l.status === 'REALIZADO')
    .reduce((acc, l) => l.tipo === 'RECEITA' ? acc + l.valor : acc - l.valor, 0)
}

export function calcularCaixaProjetado(caixaAtual: number, lancamentos: LancBase[]): number {
  const previsto = lancamentos
    .filter(l => l.status === 'PREVISTO')
    .reduce((acc, l) => l.tipo === 'RECEITA' ? acc + l.valor : acc - l.valor, 0)
  return caixaAtual + previsto
}

export function calcularResultadoProjetado(lancamentos: LancBase[], hoje: Date) {
  const limite = new Date(hoje)
  limite.setDate(limite.getDate() + 30)

  const previstas30d = lancamentos.filter(l =>
    l.status === 'PREVISTO' &&
    l.dataVencimento >= hoje &&
    l.dataVencimento <= limite
  )

  const receitasPrevistas = previstas30d
    .filter(l => l.tipo === 'RECEITA')
    .reduce((acc, l) => acc + l.valor, 0)

  const despesasPrevistas = previstas30d
    .filter(l => l.tipo === 'DESPESA')
    .reduce((acc, l) => acc + l.valor, 0)

  return { receitasPrevistas, despesasPrevistas, resultadoProjetado: receitasPrevistas - despesasPrevistas }
}

export function calcularAlerta(
  lancamento: { status: string; dataVencimento: Date },
  hoje: Date
): 'vencido' | 'proximo' | null {
  if (lancamento.status === 'REALIZADO') return null
  const hojeInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const limite = new Date(hojeInicio)
  limite.setDate(limite.getDate() + 7)
  if (new Date(lancamento.dataVencimento) < hojeInicio) return 'vencido'
  if (new Date(lancamento.dataVencimento) <= limite) return 'proximo'
  return null
}

export function validarEfetivacao(status: string): void {
  if (status === 'REALIZADO') throw new Error('Lançamento já realizado')
}

export function calcularResumo(lancamentos: LancBase[], hoje: Date) {
  const caixaAtual = calcularCaixaAtual(lancamentos)
  const caixaProjetado = calcularCaixaProjetado(caixaAtual, lancamentos)
  const metricas30d = calcularResultadoProjetado(lancamentos, hoje)

  const hojeInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const hojeFim = new Date(hojeInicio)
  hojeFim.setDate(hojeFim.getDate() + 1)

  const entradasDia = lancamentos
    .filter(l => l.tipo === 'RECEITA' && l.status === 'REALIZADO' && l.dataEfetivacao && l.dataEfetivacao >= hojeInicio && l.dataEfetivacao < hojeFim)
    .reduce((acc, l) => acc + l.valor, 0)

  const saidasDia = lancamentos
    .filter(l => l.tipo === 'DESPESA' && l.status === 'REALIZADO' && l.dataEfetivacao && l.dataEfetivacao >= hojeInicio && l.dataEfetivacao < hojeFim)
    .reduce((acc, l) => acc + l.valor, 0)

  const alertas = lancamentos
    .map(l => ({ ...l, alerta: calcularAlerta(l, hoje) }))
    .filter(l => l.alerta !== null)
    .map(l => ({
      id: l.id,
      descricao: l.descricao,
      valor: l.valor,
      dataVencimento: l.dataVencimento,
      tipo: l.alerta as 'vencido' | 'proximo',
      tipoLancamento: l.tipo,
    }))

  const contasReceber = lancamentos
    .filter(l => l.tipo === 'RECEITA' && l.status === 'PREVISTO')
    .reduce((acc, l) => acc + l.valor, 0)

  const contasPagar = lancamentos
    .filter(l => l.tipo === 'DESPESA' && l.status === 'PREVISTO')
    .reduce((acc, l) => acc + l.valor, 0)

  return {
    caixaAtual,
    caixaProjetado,
    entradasDia,
    saidasDia,
    alertas,
    metricas: { ...metricas30d, contasReceber, contasPagar },
  }
}

function serializar(l: any): LancBase & { createdAt: Date; updatedAt: Date; vendaId: string | null; compraId: string | null } {
  return { ...l, valor: Number(l.valor) }
}

export async function listarLancamentos(filtros?: { tipo?: string; status?: string }) {
  const where: any = {}
  if (filtros?.tipo) where.tipo = filtros.tipo
  if (filtros?.status) where.status = filtros.status
  return (await prisma.lancamento.findMany({ where, orderBy: { dataVencimento: 'asc' } })).map(serializar)
}

export async function criarLancamento(data: {
  descricao: string
  tipo: 'RECEITA' | 'DESPESA'
  status: 'PREVISTO' | 'REALIZADO'
  valor: number
  dataVencimento: Date
}) {
  return serializar(await prisma.lancamento.create({ data }))
}

export async function efetivarLancamento(id: string) {
  const lanc = await prisma.lancamento.findUniqueOrThrow({ where: { id } })
  validarEfetivacao(lanc.status)
  return serializar(await prisma.lancamento.update({
    where: { id },
    data: { status: 'REALIZADO', dataEfetivacao: new Date() },
  }))
}

export async function removerLancamento(id: string) {
  const lanc = await prisma.lancamento.findUniqueOrThrow({ where: { id } })
  if (lanc.status === 'REALIZADO') throw new Error('Não é possível remover um lançamento já realizado')
  return prisma.lancamento.delete({ where: { id } })
}

export async function getResumo() {
  const lancamentos = (await prisma.lancamento.findMany()).map(l => ({
    ...l,
    tipo: l.tipo as 'RECEITA' | 'DESPESA',
    status: l.status as 'PREVISTO' | 'REALIZADO',
    valor: Number(l.valor),
  }))
  return calcularResumo(lancamentos, new Date())
}
