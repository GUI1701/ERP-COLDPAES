import { ref } from 'vue'

const API = 'http://localhost:3000'

export interface Venda {
  id: string
  cliente: string | null
  data: string
  observacao: string | null
  total: number
  createdAt: string
  itens: Array<{
    id: string
    itemId: string
    quantidade: number
    valorUnit: number
    item: { nome: string; unidade: string }
  }>
  lancamentos: Array<{ id: string; status: string; dataVencimento: string }>
}

export interface ResumoVendas {
  totalVendido: number
  quantidadeVendas: number
}

export function useVendas() {
  const vendas = ref<Venda[]>([])
  const resumo = ref<ResumoVendas | null>(null)
  const loading = ref(false)
  const erro = ref<string | null>(null)

  async function carregar() {
    loading.value = true
    erro.value = null
    try {
      const res = await fetch(`${API}/vendas`)
      vendas.value = await res.json()
    } catch {
      erro.value = 'Erro ao conectar com o servidor'
    } finally {
      loading.value = false
    }
  }

  async function carregarResumo() {
    try {
      const res = await fetch(`${API}/vendas/resumo`)
      resumo.value = await res.json()
    } catch {}
  }

  async function criar(data: {
    cliente?: string
    data: string
    dataVencimento: string
    observacao?: string
    itens: Array<{ itemId: string; quantidade: number; valorUnit: number }>
  }) {
    const res = await fetch(`${API}/vendas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao criar venda')
    await Promise.all([carregar(), carregarResumo()])
  }

  async function excluir(id: string) {
    const res = await fetch(`${API}/vendas/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao excluir venda')
    await Promise.all([carregar(), carregarResumo()])
  }

  return { vendas, resumo, loading, erro, carregar, carregarResumo, criar, excluir }
}
