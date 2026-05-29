import { ref } from 'vue'

const API = 'http://localhost:3000'

export interface Item {
  id: string
  nome: string
  tipo: 'PRODUTO' | 'INSUMO'
  unidade: string
  saldoAtual: number
  estoqueMinimo: number
  estoqueIdeal: number
  alerta: 'vermelho' | 'amarelo' | null
}

export interface Movimento {
  id: string
  itemId: string
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE'
  quantidade: number
  motivo?: string
  createdAt: string
}

export function useEstoque() {
  const itens = ref<Item[]>([])
  const loading = ref(false)
  const erro = ref<string | null>(null)

  async function carregar() {
    loading.value = true
    erro.value = null
    try {
      const res = await fetch(`${API}/estoque/itens`)
      itens.value = await res.json()
    } catch {
      erro.value = 'Erro ao conectar com o servidor'
    } finally {
      loading.value = false
    }
  }

  async function cadastrar(data: Omit<Item, 'id' | 'saldoAtual' | 'alerta'>) {
    const res = await fetch(`${API}/estoque/itens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).message || 'Erro ao cadastrar')
    await carregar()
  }

  async function atualizar(id: string, data: Partial<Pick<Item, 'nome' | 'unidade' | 'estoqueMinimo' | 'estoqueIdeal'>>) {
    const res = await fetch(`${API}/estoque/itens/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao atualizar')
    await carregar()
  }

  async function excluir(id: string) {
    await fetch(`${API}/estoque/itens/${id}`, { method: 'DELETE' })
    await carregar()
  }

  async function registrarMovimento(
    itemId: string,
    tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE',
    quantidade: number,
    motivo?: string
  ) {
    const res = await fetch(`${API}/estoque/itens/${itemId}/movimentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, quantidade, motivo }),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error || 'Erro ao registrar movimento')
    }
    await carregar()
  }

  async function listarMovimentos(itemId: string): Promise<Movimento[]> {
    const res = await fetch(`${API}/estoque/itens/${itemId}/movimentos`)
    return res.json()
  }

  return { itens, loading, erro, carregar, cadastrar, atualizar, excluir, registrarMovimento, listarMovimentos }
}
