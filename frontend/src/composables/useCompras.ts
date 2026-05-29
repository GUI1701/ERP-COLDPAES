import { ref } from 'vue'

const API = 'http://localhost:3000'

export interface Compra {
  id: string
  fornecedor: string | null
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

export interface ResumoCompras {
  totalComprado: number
  quantidadeCompras: number
}

export function useCompras() {
  const compras = ref<Compra[]>([])
  const resumo = ref<ResumoCompras | null>(null)
  const loading = ref(false)
  const erro = ref<string | null>(null)

  async function carregar() {
    loading.value = true
    erro.value = null
    try {
      const res = await fetch(`${API}/compras`)
      compras.value = await res.json()
    } catch {
      erro.value = 'Erro ao conectar com o servidor'
    } finally {
      loading.value = false
    }
  }

  async function carregarResumo() {
    try {
      const res = await fetch(`${API}/compras/resumo`)
      resumo.value = await res.json()
    } catch {}
  }

  async function criar(data: {
    fornecedor?: string
    data: string
    dataVencimento: string
    observacao?: string
    itens: Array<{ itemId: string; quantidade: number; valorUnit: number }>
  }) {
    const res = await fetch(`${API}/compras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao criar compra')
    await Promise.all([carregar(), carregarResumo()])
  }

  async function excluir(id: string) {
    const res = await fetch(`${API}/compras/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao excluir compra')
    await Promise.all([carregar(), carregarResumo()])
  }

  return { compras, resumo, loading, erro, carregar, carregarResumo, criar, excluir }
}
