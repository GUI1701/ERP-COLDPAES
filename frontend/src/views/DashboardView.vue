<template>
  <div>
    <div class="flex justify-between items-center mb-5">
      <h2 class="text-xl font-bold text-gray-800">Dashboard</h2>
      <span v-if="dashboard" class="text-xs text-gray-400">
        Atualizado {{ fmtHora(dashboard.ultimaAtualizacao) }}
      </span>
    </div>

    <div v-if="loading" class="text-gray-400 text-sm mb-4">Carregando...</div>
    <div v-if="erro" class="text-red-500 text-sm mb-4">{{ erro }}</div>

    <template v-if="dashboard">
      <!-- Cards linha 1 — Caixa -->
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Caixa Atual</p>
          <p class="text-2xl font-bold text-gray-800 mt-1">{{ fmt(dashboard.financeiro.caixaAtual) }}</p>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Caixa Projetado 30d</p>
          <p class="text-2xl font-bold text-gray-800 mt-1">{{ fmt(dashboard.financeiro.caixaProjetado) }}</p>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-emerald-500">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Entradas Hoje</p>
          <p class="text-2xl font-bold text-gray-800 mt-1">{{ fmt(dashboard.financeiro.entradasDia) }}</p>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-400">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Saídas Hoje</p>
          <p class="text-2xl font-bold text-gray-800 mt-1">{{ fmt(dashboard.financeiro.saidasDia) }}</p>
        </div>
      </div>

      <!-- Cards linha 2 — Projeção e Operações -->
      <div class="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-4">
        <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-teal-400">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Receitas Previstas</p>
          <p class="text-lg font-bold text-gray-800 mt-1">{{ fmt(dashboard.financeiro.receitasPrevistas) }}</p>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-orange-400">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Despesas Previstas</p>
          <p class="text-lg font-bold text-gray-800 mt-1">{{ fmt(dashboard.financeiro.despesasPrevistas) }}</p>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm border-l-4"
          :class="dashboard.financeiro.resultadoProjetado >= 0 ? 'border-green-400' : 'border-red-500'">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Resultado 30d</p>
          <p class="text-lg font-bold mt-1"
            :class="dashboard.financeiro.resultadoProjetado >= 0 ? 'text-green-700' : 'text-red-700'">
            {{ fmt(dashboard.financeiro.resultadoProjetado) }}
          </p>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-300">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Vendas do Mês</p>
          <p class="text-lg font-bold text-gray-800 mt-1">{{ fmt(dashboard.vendas.mes.total) }}</p>
          <p class="text-xs text-gray-400">{{ dashboard.vendas.mes.quantidade }} vendas</p>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-300">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Compras do Mês</p>
          <p class="text-lg font-bold text-gray-800 mt-1">{{ fmt(dashboard.compras.mes.total) }}</p>
          <p class="text-xs text-gray-400">{{ dashboard.compras.mes.quantidade }} compras</p>
        </div>
      </div>

      <!-- Estoque -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Produtos Acabados</h3>
          <p v-if="dashboard.estoque.produtos.length === 0" class="text-sm text-gray-400">Nenhum produto cadastrado.</p>
          <div v-for="p in dashboard.estoque.produtos" :key="p.id" class="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
            <span class="text-sm text-gray-700">{{ p.nome }}</span>
            <span class="text-sm font-medium"
              :class="{ 'text-red-600': p.alerta === 'vermelho', 'text-yellow-600': p.alerta === 'amarelo', 'text-gray-800': !p.alerta }">
              {{ p.saldoAtual }} {{ p.unidade }}
            </span>
          </div>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Insumos</h3>
          <p v-if="dashboard.estoque.insumos.length === 0" class="text-sm text-gray-400">Nenhum insumo cadastrado.</p>
          <div v-for="i in dashboard.estoque.insumos" :key="i.id" class="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
            <span class="text-sm text-gray-700">{{ i.nome }}</span>
            <span class="text-sm font-medium"
              :class="{ 'text-red-600': i.alerta === 'vermelho', 'text-yellow-600': i.alerta === 'amarelo', 'text-gray-800': !i.alerta }">
              {{ i.saldoAtual }} {{ i.unidade }}
            </span>
          </div>
        </div>
      </div>

      <!-- Alertas -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <!-- Alertas financeiros -->
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Alertas Financeiros</h3>
          <p v-if="dashboard.financeiro.alertas.length === 0" class="text-sm text-gray-400">Sem alertas financeiros.</p>
          <div v-for="a in dashboard.financeiro.alertas" :key="a.id"
            class="flex items-start gap-2 p-2 rounded border mb-2"
            :class="a.tipo === 'vencido' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'">
            <span class="w-2 h-2 rounded-full mt-1.5 shrink-0"
              :class="a.tipo === 'vencido' ? 'bg-red-500' : 'bg-yellow-500'"></span>
            <span class="text-sm" :class="a.tipo === 'vencido' ? 'text-red-700' : 'text-yellow-700'">
              {{ a.tipo === 'vencido' ? 'Vencida' : 'Vence em breve' }}: {{ a.descricao }} — {{ fmt(a.valor) }}
            </span>
          </div>
        </div>

        <!-- Alertas de estoque -->
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Alertas de Estoque
            <span v-if="dashboard.estoque.criticos.length > 0"
              class="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {{ dashboard.estoque.criticos.length }} crítico{{ dashboard.estoque.criticos.length > 1 ? 's' : '' }}
            </span>
          </h3>
          <p v-if="dashboard.estoque.alertas.length === 0" class="text-sm text-gray-400">Estoque normalizado.</p>
          <div v-for="a in dashboard.estoque.alertas" :key="a.id"
            class="flex items-start gap-2 p-2 rounded border mb-2"
            :class="a.alerta === 'vermelho' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'">
            <span class="w-2 h-2 rounded-full mt-1.5 shrink-0"
              :class="a.alerta === 'vermelho' ? 'bg-red-500' : 'bg-yellow-500'"></span>
            <span class="text-sm" :class="a.alerta === 'vermelho' ? 'text-red-700' : 'text-yellow-700'">
              {{ a.nome }} — {{ a.saldoAtual }} {{ a.unidade }}
              (mín: {{ a.estoqueMinimo }} {{ a.unidade }})
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useDashboard } from '../composables/useDashboard'

const { dashboard, loading, erro, carregar } = useDashboard()

onMounted(carregar)

function fmt(val?: number | null) {
  if (val == null) return 'R$ —'
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
</script>
