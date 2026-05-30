<template>
  <div>
    <div class="flex justify-between items-center mb-5">
      <h2 class="text-xl font-bold text-gray-800">Assistente Operacional</h2>
      <button @click="carregar" class="text-sm text-blue-600 hover:underline">Atualizar</button>
    </div>

    <div v-if="loading" class="text-center py-16 text-gray-400 text-sm">Analisando dados...</div>
    <div v-else-if="erro" class="text-center py-16 text-red-400 text-sm">{{ erro }}</div>

    <template v-if="resumo && !loading">
      <!-- Alertas críticos -->
      <div v-if="resumo.alertasCriticos.length > 0" class="mb-5">
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Alertas Críticos</h3>
        <div class="space-y-2">
          <div
            v-for="insight in resumo.alertasCriticos"
            :key="insight.pergunta"
            class="rounded-lg p-3 border bg-red-50 border-red-200"
          >
            <p class="text-xs font-medium text-red-500 mb-0.5">{{ insight.pergunta }}</p>
            <p class="text-sm text-red-800">{{ insight.resposta }}</p>
          </div>
        </div>
      </div>

      <!-- Resumo do dia -->
      <div class="mb-5">
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Resumo do Dia</h3>
        <div class="space-y-2">
          <div
            v-for="insight in resumo.resumoDia"
            :key="insight.pergunta"
            class="rounded-lg p-3 border"
            :class="{
              'bg-red-50 border-red-200':    insight.nivel === 'critico',
              'bg-yellow-50 border-yellow-200': insight.nivel === 'atencao',
              'bg-green-50 border-green-200':  insight.nivel === 'normal',
            }"
          >
            <p
              class="text-xs font-medium mb-0.5"
              :class="{
                'text-red-500':    insight.nivel === 'critico',
                'text-yellow-600': insight.nivel === 'atencao',
                'text-green-600':  insight.nivel === 'normal',
              }"
            >{{ insight.pergunta }}</p>
            <p
              class="text-sm"
              :class="{
                'text-red-800':    insight.nivel === 'critico',
                'text-yellow-800': insight.nivel === 'atencao',
                'text-green-800':  insight.nivel === 'normal',
              }"
            >{{ insight.resposta }}</p>
          </div>
        </div>
      </div>

      <!-- Recomendações -->
      <div v-if="resumo.recomendacoes.length > 0" class="mb-5 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="text-xs font-semibold text-blue-700 uppercase tracking-widest mb-2">Recomendações</h3>
        <ul class="space-y-1">
          <li v-for="rec in resumo.recomendacoes" :key="rec" class="text-sm text-blue-800">• {{ rec }}</li>
        </ul>
      </div>

      <!-- Perguntas rápidas -->
      <div class="mb-5">
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Perguntas Rápidas</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="q in resumo.perguntasRapidas"
            :key="q"
            @click="fazerPergunta(q)"
            class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors"
          >
            {{ q }}
          </button>
        </div>
      </div>

      <!-- Campo pergunta livre + resposta -->
      <div class="bg-white rounded-lg shadow-sm p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Fazer uma pergunta</h3>
        <div class="flex gap-2">
          <input
            v-model="perguntaDigitada"
            type="text"
            placeholder="Ex: O caixa está saudável?"
            class="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            @keyup.enter="fazerPergunta(perguntaDigitada)"
          />
          <button
            @click="fazerPergunta(perguntaDigitada)"
            :disabled="loading"
            class="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Perguntar
          </button>
        </div>

        <div v-if="resposta" class="mt-4">
          <div
            class="rounded-lg p-3 border"
            :class="{
              'bg-red-50 border-red-200':       resposta.nivel === 'critico',
              'bg-yellow-50 border-yellow-200':  resposta.nivel === 'atencao',
              'bg-green-50 border-green-200':    resposta.nivel === 'normal',
            }"
          >
            <p
              class="text-xs font-medium mb-0.5"
              :class="{
                'text-red-500':    resposta.nivel === 'critico',
                'text-yellow-600': resposta.nivel === 'atencao',
                'text-green-600':  resposta.nivel === 'normal',
              }"
            >{{ resposta.pergunta }}</p>
            <p
              class="text-sm"
              :class="{
                'text-red-800':    resposta.nivel === 'critico',
                'text-yellow-800': resposta.nivel === 'atencao',
                'text-green-800':  resposta.nivel === 'normal',
              }"
            >{{ resposta.resposta }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAssistente } from '../composables/useAssistente'

const { resumo, resposta, loading, erro, carregar, perguntar } = useAssistente()

const perguntaDigitada = ref('')

onMounted(() => carregar())

async function fazerPergunta(texto: string) {
  if (!texto.trim()) return
  await perguntar(texto)
  if (texto === perguntaDigitada.value) perguntaDigitada.value = ''
}
</script>
