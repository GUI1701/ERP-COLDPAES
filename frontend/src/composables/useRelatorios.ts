import { ref } from 'vue'

const API = 'http://localhost:3000'

export function useRelatorios() {
  const resumo = ref<any>(null)
  const rankings = ref<any>(null)
  const loading = ref(false)
  const erro = ref<string | null>(null)

  async function carregar(inicio: string, fim: string) {
    loading.value = true
    erro.value = null
    try {
      const params = `inicio=${inicio}&fim=${fim}`
      const [resResumo, resRankings] = await Promise.all([
        fetch(`${API}/relatorios/resumo?${params}`),
        fetch(`${API}/relatorios/rankings?${params}`),
      ])
      resumo.value = await resResumo.json()
      rankings.value = await resRankings.json()
    } catch {
      erro.value = 'Erro ao carregar relatórios'
    } finally {
      loading.value = false
    }
  }

  return { resumo, rankings, loading, erro, carregar }
}
