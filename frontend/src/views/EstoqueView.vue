<template>
  <div>
    <h2 class="text-xl font-bold text-gray-800 mb-5">Estoque</h2>

    <div v-if="loading" class="text-gray-400 text-sm mb-4">Carregando...</div>
    <div v-if="erro" class="text-red-500 text-sm mb-4">{{ erro }}</div>

    <div class="bg-white rounded-lg shadow-sm overflow-hidden mb-5">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th class="px-4 py-3 text-left">Nome</th>
            <th class="px-4 py-3 text-left">Tipo</th>
            <th class="px-4 py-3 text-right">Saldo</th>
            <th class="px-4 py-3 text-right">Mínimo</th>
            <th class="px-4 py-3 text-right">Ideal</th>
            <th class="px-4 py-3 text-center">Status</th>
            <th class="px-4 py-3 text-center">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="itens.length === 0">
            <td colspan="7" class="px-4 py-8 text-center text-gray-400">
              Nenhum item cadastrado. Acesse Configurações para cadastrar.
            </td>
          </tr>
          <tr v-for="item in itens" :key="item.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">{{ item.nome }}</td>
            <td class="px-4 py-3">
              <span class="text-xs px-2 py-0.5 rounded-full"
                :class="item.tipo === 'PRODUTO' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'">
                {{ item.tipo === 'PRODUTO' ? 'Produto' : 'Insumo' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right font-medium"
              :class="{ 'text-red-600': item.alerta === 'vermelho', 'text-yellow-600': item.alerta === 'amarelo', 'text-gray-800': !item.alerta }">
              {{ item.saldoAtual }} {{ item.unidade }}
            </td>
            <td class="px-4 py-3 text-right text-gray-500">{{ item.estoqueMinimo }} {{ item.unidade }}</td>
            <td class="px-4 py-3 text-right text-gray-500">{{ item.estoqueIdeal }} {{ item.unidade }}</td>
            <td class="px-4 py-3 text-center">
              <span v-if="item.alerta === 'vermelho'" class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Crítico</span>
              <span v-else-if="item.alerta === 'amarelo'" class="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Atenção</span>
              <span v-else class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Normal</span>
            </td>
            <td class="px-4 py-3 text-center space-x-2">
              <button @click="selecionarItem(item)" class="text-xs text-blue-600 hover:underline">Movimentar</button>
              <button @click="verHistorico(item)" class="text-xs text-gray-500 hover:underline">Histórico</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Formulário de movimentação -->
    <div v-if="itemSelecionado" class="bg-white rounded-lg shadow-sm p-5 mb-5">
      <h3 class="text-sm font-semibold text-gray-700 mb-4">Movimentação — {{ itemSelecionado.nome }}</h3>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Tipo</label>
          <select v-model="mov.tipo" class="w-full border border-gray-300 rounded px-3 py-2 text-sm">
            <option value="ENTRADA">Entrada</option>
            <option value="SAIDA">Saída</option>
            <option value="AJUSTE">Ajuste</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">
            Quantidade
            <span v-if="mov.tipo === 'AJUSTE'" class="text-gray-400">(negativo para reduzir)</span>
          </label>
          <input v-model.number="mov.quantidade" type="number" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
      </div>
      <div class="mb-4">
        <label class="block text-xs text-gray-500 mb-1">
          Motivo <span v-if="mov.tipo === 'AJUSTE'" class="text-red-500">*</span>
        </label>
        <input v-model="mov.motivo" type="text" class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          placeholder="Ex: Correção por inventário físico" />
      </div>
      <div v-if="movErro" class="text-red-500 text-xs mb-3">{{ movErro }}</div>
      <div class="flex gap-2">
        <button @click="confirmarMovimento" class="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">Confirmar</button>
        <button @click="fecharMov" class="text-sm text-gray-500 px-4 py-2 rounded hover:bg-gray-100">Cancelar</button>
      </div>
    </div>

    <!-- Histórico -->
    <div v-if="itemHistorico" class="bg-white rounded-lg shadow-sm p-5">
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-sm font-semibold text-gray-700">Histórico — {{ itemHistorico.nome }}</h3>
        <button @click="itemHistorico = null; historico = []" class="text-xs text-gray-400 hover:text-gray-600">Fechar</button>
      </div>
      <p v-if="historico.length === 0" class="text-sm text-gray-400">Sem movimentações registradas.</p>
      <table v-else class="w-full text-xs">
        <thead class="text-gray-500 uppercase border-b">
          <tr>
            <th class="py-2 text-left">Data</th>
            <th class="py-2 text-left">Tipo</th>
            <th class="py-2 text-right">Qtd</th>
            <th class="py-2 text-left pl-4">Motivo</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="m in historico" :key="m.id">
            <td class="py-2 text-gray-500">{{ formatarData(m.createdAt) }}</td>
            <td class="py-2 font-medium" :class="tipoClass(m.tipo)">{{ m.tipo }}</td>
            <td class="py-2 text-right font-medium">{{ m.quantidade }}</td>
            <td class="py-2 text-gray-500 pl-4">{{ m.motivo || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEstoque } from '../composables/useEstoque'
import type { Item, Movimento } from '../composables/useEstoque'

const { itens, loading, erro, carregar, registrarMovimento, listarMovimentos } = useEstoque()

const itemSelecionado = ref<Item | null>(null)
const movErro = ref<string | null>(null)
const mov = ref({ tipo: 'ENTRADA' as 'ENTRADA' | 'SAIDA' | 'AJUSTE', quantidade: 0, motivo: '' })

const historico = ref<Movimento[]>([])
const itemHistorico = ref<Item | null>(null)

onMounted(carregar)

function selecionarItem(item: Item) {
  itemSelecionado.value = item
  movErro.value = null
  mov.value = { tipo: 'ENTRADA', quantidade: 0, motivo: '' }
  itemHistorico.value = null
  historico.value = []
}

function fecharMov() {
  itemSelecionado.value = null
  movErro.value = null
}

async function confirmarMovimento() {
  if (!itemSelecionado.value) return
  try {
    await registrarMovimento(itemSelecionado.value.id, mov.value.tipo, mov.value.quantidade, mov.value.motivo || undefined)
    fecharMov()
  } catch (err: any) {
    movErro.value = err.message
  }
}

async function verHistorico(item: Item) {
  itemHistorico.value = item
  historico.value = await listarMovimentos(item.id)
  itemSelecionado.value = null
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR')
}

function tipoClass(tipo: string) {
  if (tipo === 'ENTRADA') return 'text-green-600'
  if (tipo === 'SAIDA') return 'text-red-600'
  return 'text-blue-600'
}
</script>
