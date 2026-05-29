import { ref } from 'vue'

const API = 'http://localhost:3000'

export interface Lancamento {
  id: string
  descricao: string
  tipo: 'RECEITA' | 'DESPESA'
  status: 'PREVISTO' | 'REALIZADO'
  valor: number
  dataVencimento: string
  dataEfetivacao: string | null
  vendaId: string | null
  compraId: string | null
}

export interface Resumo {
  caixaAtual: number
  caixaProjetado: number
  entradasDia: number
  saidasDia: number
  alertas: Array<{
    id: string
    descricao: string
    valor: number
    dataVencimento: string
    tipo: 'vencido' | 'proximo'
    tipoLancamento: 'RECEITA' | 'DESPESA'
  }>
  metricas: {
    receitasPrevistas: number
    despesasPrevistas: number
    resultadoProjetado: number
    contasReceber: number
    contasPagar: number
  }
}

export function useFinanceiro() {
  const lancamentos = ref<Lancamento[]>([])
  const resumo = ref<Resumo | null>(null)
  const loading = ref(false)
  const erro = ref<string | null>(null)

  async function carregar(filtros?: { tipo?: string; status?: string }) {
    loading.value = true
    erro.value = null
    try {
      const params = new URLSearchParams()
      if (filtros?.tipo) params.set('tipo', filtros.tipo)
      if (filtros?.status) params.set('status', filtros.status)
      const res = await fetch(`${API}/financeiro/lancamentos?${params}`)
      lancamentos.value = await res.json()
    } catch {
      erro.value = 'Erro ao conectar com o servidor'
    } finally {
      loading.value = false
    }
  }

  async function carregarResumo() {
    try {
      const res = await fetch(`${API}/financeiro/resumo`)
      resumo.value = await res.json()
    } catch {
      erro.value = 'Erro ao carregar resumo'
    }
  }

  async function criar(data: {
    descricao: string
    tipo: 'RECEITA' | 'DESPESA'
    valor: number
    dataVencimento: string
  }) {
    const res = await fetch(`${API}/financeiro/lancamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).message || 'Erro ao criar lançamento')
    await Promise.all([carregar(), carregarResumo()])
  }

  async function efetivar(id: string) {
    const res = await fetch(`${API}/financeiro/lancamentos/${id}/efetivar`, { method: 'POST' })
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao efetivar')
    await Promise.all([carregar(), carregarResumo()])
  }

  async function remover(id: string) {
    const res = await fetch(`${API}/financeiro/lancamentos/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao remover')
    await Promise.all([carregar(), carregarResumo()])
  }

  return { lancamentos, resumo, loading, erro, carregar, carregarResumo, criar, efetivar, remover }
}
