import { ref } from 'vue'

const API = 'http://localhost:3000'

export interface Cliente {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  cidade: string | null
  observacao: string | null
  ativo: boolean
  createdAt: string
}

export function useClientes() {
  const clientes = ref<Cliente[]>([])
  const loading = ref(false)
  const erro = ref<string | null>(null)

  async function carregar(todos = false) {
    loading.value = true
    erro.value = null
    try {
      const res = await fetch(`${API}/clientes${todos ? '?todos=true' : ''}`)
      clientes.value = await res.json()
    } catch {
      erro.value = 'Erro ao carregar clientes'
    } finally {
      loading.value = false
    }
  }

  async function criar(data: Omit<Cliente, 'id' | 'ativo' | 'createdAt'>) {
    const res = await fetch(`${API}/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao criar')
    await carregar()
  }

  async function atualizar(id: string, data: Partial<Omit<Cliente, 'id' | 'createdAt'>>) {
    const res = await fetch(`${API}/clientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao atualizar')
    await carregar()
  }

  async function desativar(id: string) {
    await fetch(`${API}/clientes/${id}`, { method: 'DELETE' })
    await carregar()
  }

  async function getResumo(id: string) {
    const res = await fetch(`${API}/clientes/${id}/resumo`)
    return res.json()
  }

  return { clientes, loading, erro, carregar, criar, atualizar, desativar, getResumo }
}
