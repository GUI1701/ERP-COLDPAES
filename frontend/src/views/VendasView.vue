<template>
  <div>
    <h2 class="text-xl font-bold text-gray-800 mb-5">Vendas</h2>

    <div class="grid grid-cols-2 gap-4 mb-5">
      <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Total Vendido</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ fmt(resumo?.totalVendido) }}</p>
      </div>
      <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-slate-400">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Quantidade de Vendas</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ resumo?.quantidadeVendas ?? '—' }}</p>
      </div>
    </div>

    <div class="flex justify-end mb-3">
      <button @click="mostrarForm = !mostrarForm" class="text-xs bg-green-600 text-white px-4 py-1.5 rounded hover:bg-green-700">
        + Nova Venda
      </button>
    </div>

    <div v-if="mostrarForm" class="bg-white rounded-lg shadow-sm p-5 mb-5">
      <h3 class="text-sm font-semibold text-gray-700 mb-4">Nova Venda</h3>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Cliente</label>
          <input v-model="form.cliente" type="text" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Data da Venda</label>
          <input v-model="form.data" type="date" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Vencimento do Recebimento</label>
          <input v-model="form.dataVencimento" type="date" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Observação</label>
          <input v-model="form.observacao" type="text" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
      </div>

      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Produtos <span class="text-gray-400 normal-case font-normal">(apenas produtos acabados)</span>
      </p>
      <div v-for="(linha, i) in linhas" :key="i" class="flex gap-2 mb-2 items-center">
        <select v-model="linha.itemId" class="flex-1 border border-gray-300 rounded px-3 py-2 text-sm">
          <option value="">Selecionar produto...</option>
          <option v-for="item in produtos" :key="item.id" :value="item.id">
            {{ item.nome }} ({{ item.saldoAtual }} {{ item.unidade }} disponíveis)
          </option>
        </select>
        <input v-model.number="linha.quantidade" type="number" min="0.001" step="0.001"
          placeholder="Qtd" class="w-24 border border-gray-300 rounded px-3 py-2 text-sm" />
        <input v-model.number="linha.valorUnit" type="number" min="0.01" step="0.01"
          placeholder="R$ unit" class="w-28 border border-gray-300 rounded px-3 py-2 text-sm" />
        <span class="w-28 text-sm text-right text-gray-600">{{ fmt(linha.quantidade * linha.valorUnit) }}</span>
        <button @click="removerLinha(i)" v-if="linhas.length > 1"
          class="text-gray-400 hover:text-red-500 text-lg font-bold w-6">×</button>
      </div>
      <button @click="adicionarLinha" class="text-xs text-green-600 hover:underline mt-1 mb-4">+ Adicionar produto</button>

      <div class="flex items-center justify-between">
        <p class="text-sm font-semibold text-gray-700">Total: <span class="text-green-700">{{ fmt(totalForm) }}</span></p>
        <div class="flex gap-2">
          <button @click="salvar" class="bg-green-600 text-white text-sm px-4 py-2 rounded hover:bg-green-700">Salvar</button>
          <button @click="fecharForm" class="text-sm text-gray-500 px-4 py-2 rounded hover:bg-gray-100">Cancelar</button>
        </div>
      </div>
      <p v-if="formErro" class="text-red-500 text-xs mt-2">{{ formErro }}</p>
    </div>

    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th class="px-4 py-3 text-left">Cliente</th>
            <th class="px-4 py-3 text-center">Data</th>
            <th class="px-4 py-3 text-right">Total</th>
            <th class="px-4 py-3 text-center">Vencimento</th>
            <th class="px-4 py-3 text-center">Status</th>
            <th class="px-4 py-3 text-center">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="vendas.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">Nenhuma venda registrada.</td>
          </tr>
          <tr v-for="v in vendas" :key="v.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">{{ v.cliente || '—' }}</td>
            <td class="px-4 py-3 text-center text-gray-500">{{ fmtData(v.data) }}</td>
            <td class="px-4 py-3 text-right font-medium">{{ fmt(v.total) }}</td>
            <td class="px-4 py-3 text-center text-gray-500">
              {{ v.lancamentos[0] ? fmtData(v.lancamentos[0].dataVencimento) : '—' }}
            </td>
            <td class="px-4 py-3 text-center">
              <span v-if="v.lancamentos[0]" class="text-xs px-2 py-0.5 rounded-full"
                :class="v.lancamentos[0].status === 'REALIZADO' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">
                {{ v.lancamentos[0].status === 'REALIZADO' ? 'Recebido' : 'Pendente' }}
              </span>
            </td>
            <td class="px-4 py-3 text-center">
              <button v-if="v.lancamentos[0]?.status !== 'REALIZADO'" @click="excluirVenda(v.id)"
                class="text-xs text-red-500 hover:underline">Excluir</button>
              <span v-else class="text-xs text-gray-400">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useVendas } from '../composables/useVendas'
import { useEstoque } from '../composables/useEstoque'

const { vendas, resumo, carregar, carregarResumo, criar, excluir } = useVendas()
const { itens: itensCatalogo, carregar: carregarItens } = useEstoque()

const produtos = computed(() => itensCatalogo.value.filter(i => i.tipo === 'PRODUTO'))

const mostrarForm = ref(false)
const formErro = ref<string | null>(null)
const form = ref({ cliente: '', data: hoje(), dataVencimento: '', observacao: '' })
const linhas = ref([{ itemId: '', quantidade: 1, valorUnit: 0 }])

const totalForm = computed(() => linhas.value.reduce((acc, l) => acc + l.quantidade * l.valorUnit, 0))

onMounted(() => Promise.all([carregar(), carregarResumo(), carregarItens()]))

function hoje() {
  return new Date().toISOString().split('T')[0]
}

function adicionarLinha() {
  linhas.value.push({ itemId: '', quantidade: 1, valorUnit: 0 })
}

function removerLinha(i: number) {
  linhas.value.splice(i, 1)
}

function fecharForm() {
  mostrarForm.value = false
  formErro.value = null
  form.value = { cliente: '', data: hoje(), dataVencimento: '', observacao: '' }
  linhas.value = [{ itemId: '', quantidade: 1, valorUnit: 0 }]
}

async function salvar() {
  formErro.value = null
  try {
    await criar({
      cliente: form.value.cliente || undefined,
      data: form.value.data,
      dataVencimento: form.value.dataVencimento,
      observacao: form.value.observacao || undefined,
      itens: linhas.value,
    })
    fecharForm()
  } catch (err: any) {
    formErro.value = err.message
  }
}

async function excluirVenda(id: string) {
  if (!confirm('Excluir esta venda e reverter o estoque?')) return
  try {
    await excluir(id)
  } catch (err: any) {
    alert(err.message)
  }
}

function fmt(val?: number | null) {
  if (val == null) return 'R$ —'
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}
</script>
