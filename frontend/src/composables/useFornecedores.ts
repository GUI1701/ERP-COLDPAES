import { ref } from 'vue'

const API = 'http://localhost:3000'

export interface Fornecedor {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  cidade: string | null
  observacao: string | null
  ativo: boolean
  createdAt: string
}

export function useFornecedores() {
  const fornecedores = ref<Fornecedor[]>([])
  const loading = ref(false)
  const erro = ref<string | null>(null)

  async function carregar(todos = false) {
    loading.value = true
    erro.value = null
    try {
      const res = await fetch(`${API}/fornecedores${todos ? '?todos=true' : ''}`)
      fornecedores.value = await res.json()
    } catch {
      erro.value = 'Erro ao carregar fornecedores'
    } finally {
      loading.value = false
    }
  }

  async function criar(data: Omit<Fornecedor, 'id' | 'ativo' | 'createdAt'>) {
    const res = await fetch(`${API}/fornecedores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao criar')
    await carregar()
  }

  async function atualizar(id: string, data: Partial<Omit<Fornecedor, 'id' | 'createdAt'>>) {
    const res = await fetch(`${API}/fornecedores/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao atualizar')
    await carregar()
  }

  async function desativar(id: string) {
    await fetch(`${API}/fornecedores/${id}`, { method: 'DELETE' })
    await carregar()
  }

  async function getResumo(id: string) {
    const res = await fetch(`${API}/fornecedores/${id}/resumo`)
    return res.json()
  }

  return { fornecedores, loading, erro, carregar, criar, atualizar, desativar, getResumo }
}
