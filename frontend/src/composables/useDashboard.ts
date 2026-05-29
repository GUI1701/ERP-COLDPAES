import { ref } from 'vue'

const API = 'http://localhost:3000'

export interface DashboardResumo {
  ultimaAtualizacao: string
  financeiro: {
    caixaAtual: number
    caixaProjetado: number
    entradasDia: number
    saidasDia: number
    receitasPrevistas: number
    despesasPrevistas: number
    resultadoProjetado: number
    alertas: Array<{ id: string; descricao: string; valor: number; dataVencimento: string; tipo: 'vencido' | 'proximo'; tipoLancamento: string }>
  }
  estoque: {
    produtos: Array<{ id: string; nome: string; saldoAtual: number; unidade: string; alerta: string | null }>
    insumos: Array<{ id: string; nome: string; saldoAtual: number; unidade: string; alerta: string | null }>
    alertas: Array<{ id: string; nome: string; tipo: string; saldoAtual: number; estoqueMinimo: number; unidade: string; alerta: string }>
    criticos: Array<{ id: string; nome: string; tipo: string; saldoAtual: number; estoqueMinimo: number; unidade: string }>
  }
  compras: { totalComprado: number; quantidadeCompras: number; mes: { total: number; quantidade: number } }
  vendas: { totalVendido: number; quantidadeVendas: number; mes: { total: number; quantidade: number } }
}

export function useDashboard() {
  const dashboard = ref<DashboardResumo | null>(null)
  const loading = ref(false)
  const erro = ref<string | null>(null)

  async function carregar() {
    loading.value = true
    erro.value = null
    try {
      const res = await fetch(`${API}/dashboard/resumo`)
      dashboard.value = await res.json()
    } catch {
      erro.value = 'Erro ao conectar com o servidor'
    } finally {
      loading.value = false
    }
  }

  return { dashboard, loading, erro, carregar }
}
