<template>
  <div>
    <h2 class="text-xl font-bold text-gray-800 mb-5">Configurações</h2>

    <!-- Formulário cadastro / edição -->
    <div class="bg-white rounded-lg shadow-sm p-5 mb-5">
      <h3 class="text-sm font-semibold text-gray-700 mb-4">{{ editando ? 'Editar Item' : 'Cadastrar Item' }}</h3>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Nome</label>
          <input v-model="form.nome" type="text" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Tipo</label>
          <select v-model="form.tipo" :disabled="!!editando" class="w-full border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-100">
            <option value="PRODUTO">Produto</option>
            <option value="INSUMO">Insumo</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Unidade</label>
          <input v-model="form.unidade" type="text" placeholder="kg, un, L..." class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Estoque Mínimo</label>
          <input v-model.number="form.estoqueMinimo" type="number" min="0" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Estoque Ideal</label>
          <input v-model.number="form.estoqueIdeal" type="number" min="0" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
      </div>
      <div v-if="formErro" class="text-red-500 text-xs mb-3">{{ formErro }}</div>
      <div class="flex gap-2">
        <button @click="salvar" class="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
          {{ editando ? 'Salvar alterações' : 'Cadastrar' }}
        </button>
        <button v-if="editando" @click="cancelar" class="text-sm text-gray-500 px-4 py-2 rounded hover:bg-gray-100">
          Cancelar
        </button>
      </div>
    </div>

    <!-- Lista de itens -->
    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th class="px-4 py-3 text-left">Nome</th>
            <th class="px-4 py-3 text-left">Tipo</th>
            <th class="px-4 py-3 text-left">Unidade</th>
            <th class="px-4 py-3 text-right">Mínimo</th>
            <th class="px-4 py-3 text-right">Ideal</th>
            <th class="px-4 py-3 text-center">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="itens.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">Nenhum item cadastrado.</td>
          </tr>
          <tr v-for="item in itens" :key="item.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">{{ item.nome }}</td>
            <td class="px-4 py-3 text-gray-600">{{ item.tipo === 'PRODUTO' ? 'Produto' : 'Insumo' }}</td>
            <td class="px-4 py-3 text-gray-600">{{ item.unidade }}</td>
            <td class="px-4 py-3 text-right text-gray-600">{{ item.estoqueMinimo }}</td>
            <td class="px-4 py-3 text-right text-gray-600">{{ item.estoqueIdeal }}</td>
            <td class="px-4 py-3 text-center space-x-2">
              <button @click="iniciarEdicao(item)" class="text-xs text-blue-600 hover:underline">Editar</button>
              <button @click="remover(item.id)" class="text-xs text-red-500 hover:underline">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEstoque } from '../composables/useEstoque'
import type { Item } from '../composables/useEstoque'

const { itens, carregar, cadastrar, atualizar, excluir } = useEstoque()

const editando = ref<string | null>(null)
const formErro = ref<string | null>(null)
const form = ref({ nome: '', tipo: 'PRODUTO' as 'PRODUTO' | 'INSUMO', unidade: '', estoqueMinimo: 0, estoqueIdeal: 0 })

onMounted(carregar)

function iniciarEdicao(item: Item) {
  editando.value = item.id
  form.value = { nome: item.nome, tipo: item.tipo, unidade: item.unidade, estoqueMinimo: item.estoqueMinimo, estoqueIdeal: item.estoqueIdeal }
  formErro.value = null
}

function cancelar() {
  editando.value = null
  form.value = { nome: '', tipo: 'PRODUTO', unidade: '', estoqueMinimo: 0, estoqueIdeal: 0 }
  formErro.value = null
}

async function salvar() {
  formErro.value = null
  try {
    if (editando.value) {
      await atualizar(editando.value, { nome: form.value.nome, unidade: form.value.unidade, estoqueMinimo: form.value.estoqueMinimo, estoqueIdeal: form.value.estoqueIdeal })
      cancelar()
    } else {
      await cadastrar({ ...form.value })
      form.value = { nome: '', tipo: 'PRODUTO', unidade: '', estoqueMinimo: 0, estoqueIdeal: 0 }
    }
  } catch (err: any) {
    formErro.value = err.message
  }
}

async function remover(id: string) {
  if (!confirm('Excluir este item? Esta ação não pode ser desfeita.')) return
  await excluir(id)
}
</script>
