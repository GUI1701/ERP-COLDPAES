import { ref } from 'vue'

const API = 'http://localhost:3000'

export interface Insight {
  pergunta: string
  resposta: string
  nivel: 'normal' | 'atencao' | 'critico'
  dados: Record<string, unknown>
}

export interface ResumoAssistente {
  resumoDia: Insight[]
  alertasCriticos: Insight[]
  recomendacoes: string[]
  perguntasRapidas: string[]
}

export function useAssistente() {
  const resumo = ref<ResumoAssistente | null>(null)
  const resposta = ref<Insight | null>(null)
  const loading = ref(false)
  const erro = ref<string | null>(null)

  async function carregar() {
    loading.value = true
    erro.value = null
    try {
      const res = await fetch(`${API}/assistente/resumo`)
      resumo.value = await res.json()
    } catch {
      erro.value = 'Erro ao carregar o assistente.'
    } finally {
      loading.value = false
    }
  }

  async function perguntar(pergunta: string) {
    if (!pergunta.trim()) return
    loading.value = true
    erro.value = null
    try {
      const res = await fetch(`${API}/assistente/perguntar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta }),
      })
      resposta.value = await res.json()
    } catch {
      erro.value = 'Erro ao processar sua pergunta.'
    } finally {
      loading.value = false
    }
  }

  return { resumo, resposta, loading, erro, carregar, perguntar }
}
