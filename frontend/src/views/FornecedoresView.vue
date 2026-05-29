<template>
  <div>
    <h2 class="text-xl font-bold text-gray-800 mb-5">Fornecedores</h2>

    <div class="bg-white rounded-lg shadow-sm p-5 mb-5">
      <h3 class="text-sm font-semibold text-gray-700 mb-4">{{ editando ? 'Editar Fornecedor' : 'Cadastrar Fornecedor' }}</h3>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Nome <span class="text-red-500">*</span></label>
          <input v-model="form.nome" type="text" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Telefone</label>
          <input v-model="form.telefone" type="text" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Email</label>
          <input v-model="form.email" type="email" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Cidade</label>
          <input v-model="form.cidade" type="text" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
        <div class="col-span-2">
          <label class="block text-xs text-gray-500 mb-1">Observação</label>
          <input v-model="form.observacao" type="text" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
      </div>
      <div v-if="formErro" class="text-red-500 text-xs mb-3">{{ formErro }}</div>
      <div class="flex gap-2">
        <button @click="salvar" class="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
          {{ editando ? 'Salvar' : 'Cadastrar' }}
        </button>
        <button v-if="editando" @click="cancelar" class="text-sm text-gray-500 px-4 py-2 rounded hover:bg-gray-100">Cancelar</button>
      </div>
    </div>

    <div v-if="resumo" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-sm font-semibold text-blue-800">Resumo — {{ resumo.fornecedor.nome }}</h3>
        <button @click="resumo = null" class="text-xs text-blue-400 hover:text-blue-600">Fechar</button>
      </div>
      <div class="grid grid-cols-4 gap-3 text-center">
        <div><p class="text-xs text-gray-500">Total Comprado</p><p class="font-bold text-gray-800">{{ fmt(resumo.totalComprado) }}</p></div>
        <div><p class="text-xs text-gray-500">Compras</p><p class="font-bold text-gray-800">{{ resumo.quantidadeCompras }}</p></div>
        <div><p class="text-xs text-gray-500">Ticket Médio</p><p class="font-bold text-gray-800">{{ fmt(resumo.ticketMedio) }}</p></div>
        <div><p class="text-xs text-gray-500">Última Compra</p><p class="font-bold text-gray-800">{{ resumo.ultimaCompra ? fmtData(resumo.ultimaCompra) : '—' }}</p></div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th class="px-4 py-3 text-left">Nome</th>
            <th class="px-4 py-3 text-left">Telefone</th>
            <th class="px-4 py-3 text-left">Email</th>
            <th class="px-4 py-3 text-left">Cidade</th>
            <th class="px-4 py-3 text-center">Status</th>
            <th class="px-4 py-3 text-center">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="fornecedores.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">Nenhum fornecedor cadastrado.</td>
          </tr>
          <tr v-for="f in fornecedores" :key="f.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">{{ f.nome }}</td>
            <td class="px-4 py-3 text-gray-600">{{ f.telefone || '—' }}</td>
            <td class="px-4 py-3 text-gray-600">{{ f.email || '—' }}</td>
            <td class="px-4 py-3 text-gray-600">{{ f.cidade || '—' }}</td>
            <td class="px-4 py-3 text-center">
              <span class="text-xs px-2 py-0.5 rounded-full"
                :class="f.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                {{ f.ativo ? 'Ativo' : 'Inativo' }}
              </span>
            </td>
            <td class="px-4 py-3 text-center space-x-2">
              <button @click="verResumo(f.id)" class="text-xs text-blue-600 hover:underline">Resumo</button>
              <button @click="iniciarEdicao(f)" class="text-xs text-gray-600 hover:underline">Editar</button>
              <button v-if="f.ativo" @click="desativar(f.id)" class="text-xs text-red-500 hover:underline">Desativar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFornecedores } from '../composables/useFornecedores'
import type { Fornecedor } from '../composables/useFornecedores'

const { fornecedores, carregar, criar, atualizar, desativar: desativarFornecedor, getResumo } = useFornecedores()

const editando = ref<string | null>(null)
const formErro = ref<string | null>(null)
const resumo = ref<any>(null)
const form = ref({ nome: '', telefone: '', email: '', cidade: '', observacao: '' })

onMounted(() => carregar(true))

function iniciarEdicao(f: Fornecedor) {
  editando.value = f.id
  form.value = { nome: f.nome, telefone: f.telefone || '', email: f.email || '', cidade: f.cidade || '', observacao: f.observacao || '' }
  formErro.value = null
}

function cancelar() {
  editando.value = null
  form.value = { nome: '', telefone: '', email: '', cidade: '', observacao: '' }
  formErro.value = null
}

async function salvar() {
  formErro.value = null
  try {
    const data = {
      nome: form.value.nome,
      telefone: form.value.telefone || undefined,
      email: form.value.email || undefined,
      cidade: form.value.cidade || undefined,
      observacao: form.value.observacao || undefined,
    }
    if (editando.value) { await atualizar(editando.value, data); cancelar() }
    else { await criar(data as any); form.value = { nome: '', telefone: '', email: '', cidade: '', observacao: '' } }
  } catch (err: any) {
    formErro.value = err.message
  }
}

async function verResumo(id: string) {
  resumo.value = await getResumo(id)
}

async function desativar(id: string) {
  if (!confirm('Desativar este fornecedor?')) return
  await desativarFornecedor(id)
}

function fmt(val?: number) {
  return (val ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}
</script>
