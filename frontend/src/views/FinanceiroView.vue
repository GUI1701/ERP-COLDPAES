<template>
  <div>
    <h2 class="text-xl font-bold text-gray-800 mb-5">Financeiro</h2>

    <!-- Cards linha 1 -->
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
      <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Caixa Atual</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ fmt(resumo?.caixaAtual) }}</p>
      </div>
      <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Caixa Projetado</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ fmt(resumo?.caixaProjetado) }}</p>
      </div>
      <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-emerald-500">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Entradas Hoje</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ fmt(resumo?.entradasDia) }}</p>
      </div>
      <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-400">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Saídas Hoje</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ fmt(resumo?.saidasDia) }}</p>
      </div>
    </div>

    <!-- Cards linha 2 — Projeção 30 dias -->
    <div class="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-4">
      <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-emerald-300">
        <p class="text-xs text-gray-500 uppercase tracking-wide">A Receber</p>
        <p class="text-lg font-bold text-gray-800 mt-1">{{ fmt(resumo?.metricas.contasReceber) }}</p>
      </div>
      <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-300">
        <p class="text-xs text-gray-500 uppercase tracking-wide">A Pagar</p>
        <p class="text-lg font-bold text-gray-800 mt-1">{{ fmt(resumo?.metricas.contasPagar) }}</p>
      </div>
      <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-teal-400">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Receitas 30d</p>
        <p class="text-lg font-bold text-gray-800 mt-1">{{ fmt(resumo?.metricas.receitasPrevistas) }}</p>
      </div>
      <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-orange-400">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Despesas 30d</p>
        <p class="text-lg font-bold text-gray-800 mt-1">{{ fmt(resumo?.metricas.despesasPrevistas) }}</p>
      </div>
      <div class="bg-white rounded-lg p-4 shadow-sm border-l-4"
        :class="(resumo?.metricas.resultadoProjetado ?? 0) >= 0 ? 'border-green-400' : 'border-red-500'">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Resultado 30d</p>
        <p class="text-lg font-bold mt-1"
          :class="(resumo?.metricas.resultadoProjetado ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'">
          {{ fmt(resumo?.metricas.resultadoProjetado) }}
        </p>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="resumo?.alertas.length" class="bg-white rounded-lg p-4 shadow-sm mb-4">
      <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Alertas</h3>
      <div class="space-y-2">
        <div v-for="a in resumo.alertas" :key="a.id"
          class="flex items-start gap-2 p-2 rounded border"
          :class="a.tipo === 'vencido' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'">
          <span class="w-2 h-2 rounded-full mt-1.5 shrink-0"
            :class="a.tipo === 'vencido' ? 'bg-red-500' : 'bg-yellow-500'"></span>
          <span class="text-sm" :class="a.tipo === 'vencido' ? 'text-red-700' : 'text-yellow-700'">
            {{ a.tipo === 'vencido' ? 'Vencida' : 'Vence em breve' }}: {{ a.descricao }} — {{ fmt(a.valor) }}
            ({{ fmtData(a.dataVencimento) }})
          </span>
        </div>
      </div>
    </div>

    <!-- Barra de filtro e novo lançamento -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex gap-1">
        <button v-for="f in filtros" :key="f.valor"
          @click="filtroAtivo = f.valor; carregar(f.params)"
          class="text-xs px-3 py-1.5 rounded-full border transition-colors"
          :class="filtroAtivo === f.valor ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300 hover:bg-gray-50'">
          {{ f.label }}
        </button>
      </div>
      <button @click="mostrarForm = !mostrarForm"
        class="text-xs bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700">
        + Novo lançamento
      </button>
    </div>

    <!-- Formulário novo lançamento -->
    <div v-if="mostrarForm" class="bg-white rounded-lg shadow-sm p-5 mb-4">
      <h3 class="text-sm font-semibold text-gray-700 mb-4">Novo Lançamento</h3>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="col-span-2">
          <label class="block text-xs text-gray-500 mb-1">Descrição</label>
          <input v-model="form.descricao" type="text" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Tipo</label>
          <select v-model="form.tipo" class="w-full border border-gray-300 rounded px-3 py-2 text-sm">
            <option value="RECEITA">Receita</option>
            <option value="DESPESA">Despesa</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Valor (R$)</label>
          <input v-model.number="form.valor" type="number" min="0.01" step="0.01" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Vencimento</label>
          <input v-model="form.dataVencimento" type="date" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
      </div>
      <div v-if="formErro" class="text-red-500 text-xs mb-3">{{ formErro }}</div>
      <div class="flex gap-2">
        <button @click="salvar" class="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">Salvar</button>
        <button @click="mostrarForm = false; formErro = null" class="text-sm text-gray-500 px-4 py-2 rounded hover:bg-gray-100">Cancelar</button>
      </div>
    </div>

    <!-- Tabela de lançamentos -->
    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th class="px-4 py-3 text-left">Descrição</th>
            <th class="px-4 py-3 text-left">Tipo</th>
            <th class="px-4 py-3 text-right">Valor</th>
            <th class="px-4 py-3 text-center">Vencimento</th>
            <th class="px-4 py-3 text-center">Status</th>
            <th class="px-4 py-3 text-center">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="lancamentos.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">Nenhum lançamento encontrado.</td>
          </tr>
          <tr v-for="l in lancamentos" :key="l.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-gray-800">{{ l.descricao }}</td>
            <td class="px-4 py-3">
              <span class="text-xs px-2 py-0.5 rounded-full"
                :class="l.tipo === 'RECEITA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                {{ l.tipo === 'RECEITA' ? 'Receita' : 'Despesa' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right font-medium">{{ fmt(l.valor) }}</td>
            <td class="px-4 py-3 text-center text-gray-500">{{ fmtData(l.dataVencimento) }}</td>
            <td class="px-4 py-3 text-center">
              <span class="text-xs px-2 py-0.5 rounded-full"
                :class="l.status === 'REALIZADO' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">
                {{ l.status === 'REALIZADO' ? 'Realizado' : 'Previsto' }}
              </span>
            </td>
            <td class="px-4 py-3 text-center space-x-2">
              <button v-if="l.status === 'PREVISTO'" @click="efetivarLanc(l.id)"
                class="text-xs text-blue-600 hover:underline">Efetivar</button>
              <button v-if="l.status === 'PREVISTO'" @click="removerLanc(l.id)"
                class="text-xs text-red-500 hover:underline">Excluir</button>
              <span v-if="l.status === 'REALIZADO'" class="text-xs text-gray-400">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFinanceiro } from '../composables/useFinanceiro'

const { lancamentos, resumo, carregar, carregarResumo, criar, efetivar, remover } = useFinanceiro()

const filtroAtivo = ref('todos')
const mostrarForm = ref(false)
const formErro = ref<string | null>(null)
const form = ref({ descricao: '', tipo: 'RECEITA' as 'RECEITA' | 'DESPESA', valor: 0, dataVencimento: '' })

const filtros = [
  { label: 'Todos', valor: 'todos', params: undefined },
  { label: 'A Receber', valor: 'receber', params: { tipo: 'RECEITA', status: 'PREVISTO' } },
  { label: 'A Pagar', valor: 'pagar', params: { tipo: 'DESPESA', status: 'PREVISTO' } },
  { label: 'Realizados', valor: 'realizados', params: { status: 'REALIZADO' } },
]

onMounted(() => Promise.all([carregar(), carregarResumo()]))

async function salvar() {
  formErro.value = null
  try {
    await criar({ ...form.value })
    mostrarForm.value = false
    form.value = { descricao: '', tipo: 'RECEITA', valor: 0, dataVencimento: '' }
  } catch (err: any) {
    formErro.value = err.message
  }
}

async function efetivarLanc(id: string) {
  try { await efetivar(id) } catch (err: any) { alert(err.message) }
}

async function removerLanc(id: string) {
  if (!confirm('Excluir este lançamento?')) return
  try { await remover(id) } catch (err: any) { alert(err.message) }
}

function fmt(val?: number | null) {
  if (val == null) return 'R$ —'
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}
</script>
