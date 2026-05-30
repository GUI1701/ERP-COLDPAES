import prisma from '../../lib/prisma'
import { getDashboardResumo } from '../dashboard/dashboard.service'
import { getResumo, getRankings, calcularPeriodo } from '../relatorios/relatorios.service'

export interface Insight {
  pergunta: string
  resposta: string
  nivel: 'normal' | 'atencao' | 'critico'
  dados: Record<string, unknown>
}

export interface DadosAssistente {
  dashboard: {
    financeiro: {
      caixaAtual: number
      caixaProjetado: number
      entradasDia: number
      saidasDia: number
      receitasPrevistas: number
      despesasPrevistas: number
      resultadoProjetado: number
      alertas: Array<{
        id: string
        descricao: string
        valor: number
        dataVencimento: Date
        tipo: 'vencido' | 'proximo'
        tipoLancamento: string
      }>
    }
    estoque: {
      criticos: Array<{ id: string; nome: string; tipo: string; saldoAtual: number; estoqueMinimo: number; unidade: string }>
      alertas: Array<unknown>
      produtos: Array<unknown>
      insumos: Array<unknown>
    }
    compras: { totalComprado: number; quantidadeCompras: number; mes: { total: number; quantidade: number } }
    vendas: { totalVendido: number; quantidadeVendas: number; mes: { total: number; quantidade: number } }
    ultimaAtualizacao: string
  }
  rankings: {
    maisVendidos: Array<{ itemId: string; nome: string; unidade: string; totalQuantidade: number }>
    maisComprados: Array<{ itemId: string; nome: string; unidade: string; totalQuantidade: number }>
    maioresVendas: Array<{ id: string; cliente: string | null; total: number; data: Date }>
    maioresCompras: Array<{ id: string; fornecedor: string | null; total: number; data: Date }>
    maioresReceitas: Array<unknown>
    maioresDespesas: Array<unknown>
    itensCriticos: Array<unknown>
  }
  resumo: {
    estoque: {
      itensSemMovimento: Array<{ id: string; nome: string; tipo: string; saldoAtual: number; unidade: string }>
      itensCriticos: number
      itensCadastrados: number
      produtos: number
      insumos: number
    }
    financeiro: Record<string, unknown>
    compras: Record<string, unknown>
    vendas: Record<string, unknown>
    periodo: Record<string, unknown>
    evolucaoMensal: Array<unknown>
  }
  vendasClienteAtual: Array<{ cliente: string | null; total: number }>
  vendasClienteAnterior: Array<{ cliente: string | null; total: number }>
}

// ── Data collection ──────────────────────────────────────────────────────────

export async function coletarDados(): Promise<DadosAssistente> {
  const periodo = calcularPeriodo()
  const hoje = new Date()
  const inicio30 = new Date(hoje)
  inicio30.setDate(inicio30.getDate() - 30)
  const inicio60 = new Date(hoje)
  inicio60.setDate(inicio60.getDate() - 60)

  const [dashboard, rankings, resumo, vendasAtual, vendasAnterior] = await Promise.all([
    getDashboardResumo(),
    getRankings(periodo.inicio, periodo.fim),
    getResumo(periodo.inicio, periodo.fim),
    prisma.venda.findMany({ where: { data: { gte: inicio30 } }, select: { cliente: true, total: true } }),
    prisma.venda.findMany({ where: { data: { gte: inicio60, lt: inicio30 } }, select: { cliente: true, total: true } }),
  ])

  return {
    dashboard: dashboard as DadosAssistente['dashboard'],
    rankings: rankings as DadosAssistente['rankings'],
    resumo: resumo as DadosAssistente['resumo'],
    vendasClienteAtual: vendasAtual.map(v => ({ cliente: v.cliente, total: Number(v.total) })),
    vendasClienteAnterior: vendasAnterior.map(v => ({ cliente: v.cliente, total: Number(v.total) })),
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Pure analysis functions ──────────────────────────────────────────────────

export function analisarCaixa(fin: {
  caixaAtual: number
  caixaProjetado: number
  resultadoProjetado: number
}): Insight {
  const pergunta = 'O caixa está saudável?'
  const dados = { caixaAtual: fin.caixaAtual, caixaProjetado: fin.caixaProjetado, resultadoProjetado: fin.resultadoProjetado }
  if (fin.caixaProjetado < 0) {
    return { pergunta, resposta: `Caixa projetado negativo em ${fmt(fin.caixaProjetado)}. Situação crítica.`, nivel: 'critico', dados }
  }
  if (fin.resultadoProjetado < 0) {
    return { pergunta, resposta: `Caixa atual positivo (${fmt(fin.caixaAtual)}), mas resultado projetado negativo: ${fmt(fin.resultadoProjetado)}.`, nivel: 'atencao', dados }
  }
  return { pergunta, resposta: `Caixa saudável. Atual: ${fmt(fin.caixaAtual)}. Projetado: ${fmt(fin.caixaProjetado)}.`, nivel: 'normal', dados }
}

export function analisarItensCriticos(
  itensCriticos: Array<{ nome: string; tipo: string; saldoAtual: number; estoqueMinimo: number }>
): Insight {
  const pergunta = 'Quais itens exigem atenção hoje?'
  const qtd = itensCriticos.length
  if (qtd > 3) {
    return {
      pergunta,
      resposta: `${qtd} itens com estoque crítico: ${itensCriticos.slice(0, 3).map(i => i.nome).join(', ')} e outros.`,
      nivel: 'critico',
      dados: { quantidade: qtd, itens: itensCriticos },
    }
  }
  if (qtd >= 1) {
    return {
      pergunta,
      resposta: `${qtd} item(ns) abaixo do estoque mínimo: ${itensCriticos.map(i => i.nome).join(', ')}.`,
      nivel: 'atencao',
      dados: { quantidade: qtd, itens: itensCriticos },
    }
  }
  return { pergunta, resposta: 'Nenhum item com estoque crítico.', nivel: 'normal', dados: { quantidade: 0, itens: [] } }
}

export function analisarContasVencidas(
  alertas: Array<{ descricao: string; valor: number; tipo: 'vencido' | 'proximo'; tipoLancamento: string }>
): Insight {
  const pergunta = 'Quais contas vencem ou estão vencidas?'
  const vencidas = alertas.filter(a => a.tipo === 'vencido')
  const proximas = alertas.filter(a => a.tipo === 'proximo')
  if (vencidas.length >= 1) {
    const total = vencidas.reduce((acc, a) => acc + a.valor, 0)
    return {
      pergunta,
      resposta: `${vencidas.length} conta(s) vencida(s), total ${fmt(total)}: ${vencidas.slice(0, 2).map(a => a.descricao).join(', ')}${vencidas.length > 2 ? '...' : ''}.`,
      nivel: 'critico',
      dados: { vencidas: vencidas.length, proximas: proximas.length, totalVencido: total },
    }
  }
  if (proximas.length >= 1) {
    const total = proximas.reduce((acc, a) => acc + a.valor, 0)
    return {
      pergunta,
      resposta: `${proximas.length} conta(s) vencem nos próximos 7 dias, total ${fmt(total)}.`,
      nivel: 'atencao',
      dados: { vencidas: 0, proximas: proximas.length, totalProximo: total },
    }
  }
  return { pergunta, resposta: 'Nenhuma conta vencida ou próxima do vencimento.', nivel: 'normal', dados: { vencidas: 0, proximas: 0 } }
}

export function analisarVendasVsCompras(
  vendasMes: { total: number },
  comprasMes: { total: number }
): Insight {
  const pergunta = 'As vendas do mês cobrem as compras do mês?'
  const v = vendasMes.total
  const c = comprasMes.total
  if (c === 0) {
    return { pergunta, resposta: `Nenhuma compra registrada no mês. Vendas: ${fmt(v)}.`, nivel: 'normal', dados: { vendasMes: v, comprasMes: c, cobertura: null } }
  }
  const cobertura = Math.round((v / c) * 100)
  if (v < c * 0.8) {
    return { pergunta, resposta: `Vendas (${fmt(v)}) cobrem apenas ${cobertura}% das compras (${fmt(c)}). Situação crítica.`, nivel: 'critico', dados: { vendasMes: v, comprasMes: c, cobertura } }
  }
  if (v < c) {
    return { pergunta, resposta: `Vendas (${fmt(v)}) cobrem ${cobertura}% das compras (${fmt(c)}). Atenção.`, nivel: 'atencao', dados: { vendasMes: v, comprasMes: c, cobertura } }
  }
  return { pergunta, resposta: `Vendas (${fmt(v)}) cobrem ${cobertura}% das compras (${fmt(c)}). Situação saudável.`, nivel: 'normal', dados: { vendasMes: v, comprasMes: c, cobertura } }
}

export function analisarProdutoMaisVendido(
  maisVendidos: Array<{ nome: string; totalQuantidade: number; unidade: string }>
): Insight {
  const pergunta = 'Qual produto mais vendido?'
  if (maisVendidos.length === 0) {
    return { pergunta, resposta: 'Nenhuma venda registrada no período.', nivel: 'normal', dados: {} }
  }
  const top = maisVendidos[0]
  return { pergunta, resposta: `Produto mais vendido: ${top.nome} (${top.totalQuantidade} ${top.unidade}).`, nivel: 'normal', dados: { produto: top.nome, quantidade: top.totalQuantidade, unidade: top.unidade } }
}

export function analisarInsumoMaisComprado(
  maisComprados: Array<{ nome: string; totalQuantidade: number; unidade: string }>
): Insight {
  const pergunta = 'Qual insumo mais comprado?'
  if (maisComprados.length === 0) {
    return { pergunta, resposta: 'Nenhuma compra registrada no período.', nivel: 'normal', dados: {} }
  }
  const top = maisComprados[0]
  return { pergunta, resposta: `Item mais comprado: ${top.nome} (${top.totalQuantidade} ${top.unidade}).`, nivel: 'normal', dados: { insumo: top.nome, quantidade: top.totalQuantidade, unidade: top.unidade } }
}

export function analisarFornecedorMaiorCusto(
  maioresCompras: Array<{ fornecedor: string | null; total: number }>
): Insight {
  const pergunta = 'Qual fornecedor gerou maior custo?'
  if (maioresCompras.length === 0) {
    return { pergunta, resposta: 'Nenhuma compra registrada no período.', nivel: 'normal', dados: {} }
  }
  const top = maioresCompras[0]
  return { pergunta, resposta: `Fornecedor com maior custo: ${top.fornecedor ?? 'Não identificado'} (${fmt(top.total)}).`, nivel: 'normal', dados: { fornecedor: top.fornecedor, total: top.total } }
}

export function analisarClienteMaiorReceita(
  maioresVendas: Array<{ cliente: string | null; total: number }>
): Insight {
  const pergunta = 'Qual cliente gerou maior receita?'
  if (maioresVendas.length === 0) {
    return { pergunta, resposta: 'Nenhuma venda registrada no período.', nivel: 'normal', dados: {} }
  }
  const top = maioresVendas[0]
  return { pergunta, resposta: `Cliente com maior receita: ${top.cliente ?? 'Não identificado'} (${fmt(top.total)}).`, nivel: 'normal', dados: { cliente: top.cliente, total: top.total } }
}

export function analisarItensSemMovimento(
  itensSemMovimento: Array<{ nome: string; tipo: string }>
): Insight {
  const pergunta = 'Existem itens sem movimento?'
  const qtd = itensSemMovimento.length
  if (qtd > 5) {
    return {
      pergunta,
      resposta: `${qtd} itens sem movimentação no período: ${itensSemMovimento.slice(0, 3).map(i => i.nome).join(', ')} e outros.`,
      nivel: 'atencao',
      dados: { quantidade: qtd, itens: itensSemMovimento },
    }
  }
  if (qtd > 0) {
    return {
      pergunta,
      resposta: `${qtd} item(ns) sem movimentação no período: ${itensSemMovimento.map(i => i.nome).join(', ')}.`,
      nivel: 'normal',
      dados: { quantidade: qtd, itens: itensSemMovimento },
    }
  }
  return { pergunta, resposta: 'Todos os itens tiveram movimentação no período.', nivel: 'normal', dados: { quantidade: 0 } }
}

export function analisarResultadoProjetado(fin: {
  resultadoProjetado: number
  receitasPrevistas: number
  despesasPrevistas: number
}): Insight {
  const pergunta = 'Qual é o resultado projetado dos próximos 30 dias?'
  const { resultadoProjetado: rp, receitasPrevistas: rec, despesasPrevistas: desp } = fin
  if (rp < 0) {
    return { pergunta, resposta: `Resultado projetado negativo: ${fmt(rp)} (receitas ${fmt(rec)} vs despesas ${fmt(desp)}).`, nivel: 'critico', dados: { resultadoProjetado: rp, receitasPrevistas: rec, despesasPrevistas: desp } }
  }
  if (rec > 0 && rp < rec * 0.1) {
    return { pergunta, resposta: `Resultado projetado positivo mas baixo: ${fmt(rp)} (margem de ${Math.round((rp / rec) * 100)}%).`, nivel: 'atencao', dados: { resultadoProjetado: rp, receitasPrevistas: rec, despesasPrevistas: desp } }
  }
  return { pergunta, resposta: `Resultado projetado positivo: ${fmt(rp)} nos próximos 30 dias.`, nivel: 'normal', dados: { resultadoProjetado: rp, receitasPrevistas: rec, despesasPrevistas: desp } }
}

export function analisarClienteQueda(
  vendasAtual: Array<{ cliente: string | null; total: number }>,
  vendasAnterior: Array<{ cliente: string | null; total: number }>
): Insight {
  const pergunta = 'Qual cliente está comprando menos que o habitual?'

  const anterior = new Map<string, number>()
  for (const v of vendasAnterior) {
    if (v.cliente) anterior.set(v.cliente, (anterior.get(v.cliente) ?? 0) + v.total)
  }

  const atual = new Map<string, number>()
  for (const v of vendasAtual) {
    if (v.cliente) atual.set(v.cliente, (atual.get(v.cliente) ?? 0) + v.total)
  }

  let piorCliente: string | null = null
  let piorVariacao = 0

  for (const [nome, totalAnt] of anterior.entries()) {
    if (totalAnt === 0) continue
    const totalAt = atual.get(nome) ?? 0
    const variacao = Math.round(((totalAt - totalAnt) / totalAnt) * 100)
    if (variacao < piorVariacao) {
      piorVariacao = variacao
      piorCliente = nome
    }
  }

  if (!piorCliente || piorVariacao >= 0) {
    return { pergunta, resposta: 'Nenhum cliente com queda relevante em relação ao período anterior.', nivel: 'normal', dados: { cliente: null, variacao: 0 } }
  }

  const periodoAtual = atual.get(piorCliente) ?? 0
  const periodoAnterior = anterior.get(piorCliente) ?? 0
  const quedaAbs = Math.abs(piorVariacao)
  const nivel: 'critico' | 'atencao' | 'normal' = quedaAbs > 50 ? 'critico' : quedaAbs > 30 ? 'atencao' : 'normal'

  return {
    pergunta,
    resposta: `${piorCliente} reduziu as compras em ${quedaAbs}% em relação ao período anterior.`,
    nivel,
    dados: { cliente: piorCliente, periodoAtual, periodoAnterior, variacao: piorVariacao },
  }
}

// ── Keyword matching ──────────────────────────────────────────────────────────

function normalizar(str: string): string {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

const PERGUNTAS_KEYWORDS: Array<{ chave: string; palavras: string[] }> = [
  { chave: 'clienteQueda',         palavras: ['queda', 'caiu', 'comprando menos', 'habitual', 'receita menor'] },
  { chave: 'caixa',                palavras: ['caixa', 'saudavel', 'saude'] },
  { chave: 'itensCriticos',        palavras: ['exigem atencao', 'estoque critico', 'alerta'] },
  { chave: 'contasVencidas',       palavras: ['conta', 'vencid', 'vencimento', 'vence'] },
  { chave: 'vendasVsCompras',      palavras: ['cobrem', 'vendas do mes', 'compras do mes'] },
  { chave: 'produtoMaisVendido',   palavras: ['produto', 'mais vendido'] },
  { chave: 'insumoMaisComprado',   palavras: ['insumo', 'mais comprado'] },
  { chave: 'fornecedorMaiorCusto', palavras: ['fornecedor', 'maior custo', 'maior gasto'] },
  { chave: 'clienteMaiorReceita',  palavras: ['cliente', 'receita'] },
  { chave: 'itensSemMovimento',    palavras: ['sem movimento', 'parado', 'inativo'] },
  { chave: 'resultadoProjetado',   palavras: ['resultado', 'projetado', '30 dia'] },
]

export function identificarPergunta(texto: string): string | null {
  const n = normalizar(texto)
  for (const { chave, palavras } of PERGUNTAS_KEYWORDS) {
    if (palavras.some(p => n.includes(normalizar(p)))) return chave
  }
  return null
}

// ── Assembly ──────────────────────────────────────────────────────────────────

export function gerarResumoDia(dados: DadosAssistente): Insight[] {
  const fin = dados.dashboard.financeiro
  return [
    analisarCaixa({ caixaAtual: fin.caixaAtual, caixaProjetado: fin.caixaProjetado, resultadoProjetado: fin.resultadoProjetado }),
    analisarVendasVsCompras(dados.dashboard.vendas.mes, dados.dashboard.compras.mes),
    analisarItensCriticos(dados.dashboard.estoque.criticos),
    analisarItensSemMovimento(dados.resumo.estoque.itensSemMovimento),
  ]
}

export function gerarAlertasCriticos(dados: DadosAssistente): Insight[] {
  const fin = dados.dashboard.financeiro
  return [
    analisarCaixa({ caixaAtual: fin.caixaAtual, caixaProjetado: fin.caixaProjetado, resultadoProjetado: fin.resultadoProjetado }),
    analisarContasVencidas(fin.alertas),
    analisarItensCriticos(dados.dashboard.estoque.criticos),
    analisarVendasVsCompras(dados.dashboard.vendas.mes, dados.dashboard.compras.mes),
    analisarResultadoProjetado({ resultadoProjetado: fin.resultadoProjetado, receitasPrevistas: fin.receitasPrevistas, despesasPrevistas: fin.despesasPrevistas }),
    analisarClienteQueda(dados.vendasClienteAtual, dados.vendasClienteAnterior),
  ].filter(i => i.nivel === 'critico')
}

export function gerarRecomendacoes(dados: DadosAssistente): string[] {
  const recs: string[] = []
  const fin = dados.dashboard.financeiro

  if (fin.alertas.filter(a => a.tipo === 'vencido').length > 0)
    recs.push('Regularize as contas vencidas para evitar juros e bloqueios de crédito.')
  if (dados.dashboard.estoque.criticos.length > 0)
    recs.push(`Reabasteça os itens críticos: ${dados.dashboard.estoque.criticos.slice(0, 2).map(i => i.nome).join(', ')}.`)
  if (fin.caixaProjetado < 0)
    recs.push('Caixa projetado negativo: revise despesas previstas ou antecipe receitas.')
  if (dados.resumo.estoque.itensSemMovimento.length > 5)
    recs.push('Muitos itens sem movimento. Considere promoções ou revisão de estoque.')

  return recs
}

export function gerarPerguntasRapidas(): string[] {
  return [
    'O caixa está saudável?',
    'Quais itens exigem atenção hoje?',
    'Quais contas vencem ou estão vencidas?',
    'As vendas do mês cobrem as compras do mês?',
    'Qual produto mais vendido?',
    'Qual insumo mais comprado?',
    'Qual fornecedor gerou maior custo?',
    'Qual cliente gerou maior receita?',
    'Existem itens sem movimento?',
    'Qual é o resultado projetado dos próximos 30 dias?',
    'Qual cliente está comprando menos que o habitual?',
  ]
}

export function responderPergunta(texto: string, dados: DadosAssistente): Insight {
  const chave = identificarPergunta(texto)
  const fin = dados.dashboard.financeiro

  if (!chave) {
    return {
      pergunta: texto,
      resposta: 'Ainda não sei responder essa pergunta. Tente uma das perguntas rápidas.',
      nivel: 'normal',
      dados: {},
    }
  }

  switch (chave) {
    case 'caixa':
      return analisarCaixa({ caixaAtual: fin.caixaAtual, caixaProjetado: fin.caixaProjetado, resultadoProjetado: fin.resultadoProjetado })
    case 'itensCriticos':
      return analisarItensCriticos(dados.dashboard.estoque.criticos)
    case 'contasVencidas':
      return analisarContasVencidas(fin.alertas)
    case 'vendasVsCompras':
      return analisarVendasVsCompras(dados.dashboard.vendas.mes, dados.dashboard.compras.mes)
    case 'produtoMaisVendido':
      return analisarProdutoMaisVendido(dados.rankings.maisVendidos)
    case 'insumoMaisComprado':
      return analisarInsumoMaisComprado(dados.rankings.maisComprados)
    case 'fornecedorMaiorCusto':
      return analisarFornecedorMaiorCusto(dados.rankings.maioresCompras)
    case 'clienteMaiorReceita':
      return analisarClienteMaiorReceita(dados.rankings.maioresVendas)
    case 'itensSemMovimento':
      return analisarItensSemMovimento(dados.resumo.estoque.itensSemMovimento)
    case 'resultadoProjetado':
      return analisarResultadoProjetado({ resultadoProjetado: fin.resultadoProjetado, receitasPrevistas: fin.receitasPrevistas, despesasPrevistas: fin.despesasPrevistas })
    case 'clienteQueda':
      return analisarClienteQueda(dados.vendasClienteAtual, dados.vendasClienteAnterior)
    default:
      return {
        pergunta: texto,
        resposta: 'Ainda não sei responder essa pergunta. Tente uma das perguntas rápidas.',
        nivel: 'normal',
        dados: {},
      }
  }
}

export function gerarResumoCompleto(dados: DadosAssistente) {
  return {
    resumoDia: gerarResumoDia(dados),
    alertasCriticos: gerarAlertasCriticos(dados),
    recomendacoes: gerarRecomendacoes(dados),
    perguntasRapidas: gerarPerguntasRapidas(),
  }
}
