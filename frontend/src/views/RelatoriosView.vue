<template>
  <div>
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-xl font-bold text-gray-800">Relatórios</h2>
      <span v-if="resumo" class="text-xs text-gray-400">{{ resumo.periodo.inicio }} → {{ resumo.periodo.fim }}</span>
    </div>

    <!-- Seletor de período -->
    <div class="bg-white rounded-lg p-4 shadow-sm mb-5 flex flex-wrap gap-3 items-end">
      <div class="flex gap-2">
        <button @click="aplicarPreset('30d')"
          class="text-xs px-3 py-1.5 rounded border transition-colors"
          :class="preset === '30d' ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300 hover:bg-gray-50'">
          Últimos 30 dias
        </button>
        <button @click="aplicarPreset('mes')"
          class="text-xs px-3 py-1.5 rounded border transition-colors"
          :class="preset === 'mes' ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300 hover:bg-gray-50'">
          Este mês
        </button>
      </div>
      <div class="flex gap-2 items-end">
        <div>
          <label class="block text-xs text-gray-500 mb-1">De</label>
          <input v-model="dataInicio" type="date" class="border border-gray-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Até</label>
          <input v-model="dataFim" type="date" class="border border-gray-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <button @click="aplicar" class="text-xs bg-gray-700 text-white px-3 py-1.5 rounded hover:bg-gray-800">Aplicar</button>
      </div>
    </div>

    <div v-if="loading" class="text-gray-400 text-sm mb-4">Carregando...</div>
    <div v-if="erro" class="text-red-500 text-sm mb-4">{{ erro }}</div>

    <template v-if="resumo && rankings">
      <!-- Cards financeiros -->
      <div class="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
        <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Receitas</p>
          <p class="text-2xl font-bold text-gray-800 mt-1">{{ fmt(resumo.financeiro.receitas) }}</p>
          <p class="text-xs text-gray-400 mt-1">Ticket médio: {{ fmt(resumo.financeiro.ticketMedioReceita) }}</p>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-400">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Despesas</p>
          <p class="text-2xl font-bold text-gray-800 mt-1">{{ fmt(resumo.financeiro.despesas) }}</p>
          <p class="text-xs text-gray-400 mt-1">Ticket médio: {{ fmt(resumo.financeiro.ticketMedioDespesa) }}</p>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm border-l-4"
          :class="resumo.financeiro.resultado >= 0 ? 'border-green-400' : 'border-red-600'">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Resultado</p>
          <p class="text-2xl font-bold mt-1" :class="resumo.financeiro.resultado >= 0 ? 'text-green-700' : 'text-red-700'">
            {{ fmt(resumo.financeiro.resultado) }}
          </p>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-400">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Total Comprado</p>
          <p class="text-2xl font-bold text-gray-800 mt-1">{{ fmt(resumo.compras.totalComprado) }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ resumo.compras.quantidadeCompras }} compras · média {{ fmt(resumo.compras.compraMedia) }}</p>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-teal-400">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Total Vendido</p>
          <p class="text-2xl font-bold text-gray-800 mt-1">{{ fmt(resumo.vendas.totalVendido) }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ resumo.vendas.quantidadeVendas }} vendas · média {{ fmt(resumo.vendas.vendaMedia) }}</p>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-300">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Itens Críticos</p>
          <p class="text-2xl font-bold text-gray-800 mt-1">{{ resumo.estoque.itensCriticos }}</p>
          <p class="text-xs text-gray-400 mt-1">de {{ resumo.estoque.itensCadastrados }} itens ({{ resumo.estoque.produtos }} prod. / {{ resumo.estoque.insumos }} ins.)</p>
        </div>
      </div>

      <!-- Evolução mensal -->
      <div class="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Evolução Mensal — Últimos 6 Meses</h3>
        <table class="w-full text-sm">
          <thead class="text-gray-500 text-xs uppercase border-b">
            <tr>
              <th class="py-2 text-left">Mês</th>
              <th class="py-2 text-right">Receitas</th>
              <th class="py-2 text-right">Despesas</th>
              <th class="py-2 text-right">Resultado</th>
              <th class="py-2 text-right">Vendas</th>
              <th class="py-2 text-right">Compras</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="m in resumo.evolucaoMensal" :key="m.mes">
              <td class="py-2 font-medium text-gray-700">{{ m.mes }}</td>
              <td class="py-2 text-right text-green-700">{{ fmt(m.receitas) }}</td>
              <td class="py-2 text-right text-red-600">{{ fmt(m.despesas) }}</td>
              <td class="py-2 text-right font-medium" :class="m.resultado >= 0 ? 'text-green-700' : 'text-red-700'">{{ fmt(m.resultado) }}</td>
              <td class="py-2 text-right text-gray-600">{{ fmt(m.vendas) }}</td>
              <td class="py-2 text-right text-gray-600">{{ fmt(m.compras) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Rankings -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <RankingTable titulo="Mais Vendidos (quantidade)" :itens="rankings.maisVendidos" campo="totalQuantidade" :isCurrency="false" />
        <RankingTable titulo="Maiores Vendas (valor)" :itens="rankings.maioresVendas.map(v => ({ nome: v.cliente || 'S/ cliente', totalQuantidade: v.total }))" campo="totalQuantidade" :isCurrency="true" />
        <RankingTable titulo="Mais Comprados (quantidade)" :itens="rankings.maisComprados" campo="totalQuantidade" :isCurrency="false" />
        <RankingTable titulo="Maiores Compras (valor)" :itens="rankings.maioresCompras.map(c => ({ nome: c.fornecedor || 'S/ fornecedor', totalQuantidade: c.total }))" campo="totalQuantidade" :isCurrency="true" />
        <RankingTable titulo="Maiores Receitas" :itens="rankings.maioresReceitas.map(l => ({ nome: l.descricao, totalQuantidade: l.valor }))" campo="totalQuantidade" :isCurrency="true" />
        <RankingTable titulo="Maiores Despesas" :itens="rankings.maioresDespesas.map(l => ({ nome: l.descricao, totalQuantidade: l.valor }))" campo="totalQuantidade" :isCurrency="true" />
      </div>

      <!-- Itens críticos + sem movimento -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Itens Críticos (estoque)</h3>
          <p v-if="!rankings.itensCriticos.length" class="text-sm text-gray-400">Nenhum item crítico.</p>
          <div v-for="(item, i) in rankings.itensCriticos" :key="item.id" class="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
            <span class="text-gray-700">{{ i + 1 }}. {{ item.nome }} <span class="text-xs text-gray-400">({{ item.tipo }})</span></span>
            <span class="text-red-600 font-medium">{{ item.saldoAtual }}/{{ item.estoqueMinimo }} {{ item.unidade }}</span>
          </div>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Itens sem Movimentação no Período
            <span v-if="resumo.estoque.itensSemMovimento.length" class="ml-1 text-yellow-600">({{ resumo.estoque.itensSemMovimento.length }})</span>
          </h3>
          <p v-if="!resumo.estoque.itensSemMovimento.length" class="text-sm text-gray-400">Todos os itens tiveram movimentação.</p>
          <div v-for="item in resumo.estoque.itensSemMovimento" :key="item.id" class="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
            <span class="text-gray-700">{{ item.nome }} <span class="text-xs text-gray-400">({{ item.tipo }})</span></span>
            <span class="text-gray-500">{{ item.saldoAtual }} {{ item.unidade }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, defineComponent, h, onMounted } from 'vue'
import { useRelatorios } from '../composables/useRelatorios'

const { resumo, rankings, loading, erro, carregar } = useRelatorios()

const preset = ref('30d')
const dataInicio = ref('')
const dataFim = ref('')

const RankingTable = defineComponent({
  props: { titulo: String, itens: Array as any, campo: String, isCurrency: Boolean },
  setup(props) {
    return () => h('div', { class: 'bg-white rounded-lg p-4 shadow-sm' }, [
      h('h3', { class: 'text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3' }, props.titulo),
      !props.itens?.length
        ? h('p', { class: 'text-sm text-gray-400' }, 'Sem dados.')
        : props.itens.map((item: any, i: number) =>
            h('div', { key: i, class: 'flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0' }, [
              h('span', { class: 'text-gray-700' }, `${i + 1}. ${item.nome || item.descricao || '—'}`),
              h('span', { class: 'font-medium text-gray-800' }, props.isCurrency
                ? Number(item.totalQuantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : `${item.totalQuantidade} ${item.unidade ?? ''}`
              ),
            ])
          ),
    ])
  },
})

function hoje() { return new Date().toISOString().split('T')[0] }
function diasAtras(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}
function inicioMes() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}

function aplicarPreset(p: string) {
  preset.value = p
  if (p === '30d') { dataInicio.value = diasAtras(30); dataFim.value = hoje() }
  else if (p === 'mes') { dataInicio.value = inicioMes(); dataFim.value = hoje() }
  carregar(dataInicio.value, dataFim.value)
}

function aplicar() {
  preset.value = 'custom'
  carregar(dataInicio.value, dataFim.value)
}

function fmt(val?: number | null) {
  if (val == null) return 'R$ —'
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

onMounted(() => aplicarPreset('30d'))
</script>
