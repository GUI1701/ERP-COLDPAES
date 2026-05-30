<template>
  <aside class="w-56 bg-slate-900 text-white flex flex-col shrink-0">
    <div class="px-5 py-4 border-b border-slate-700">
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest">ERP</p>
      <h1 class="text-base font-bold text-white mt-0.5">COLDPAES</h1>
    </div>
    <nav class="flex-1 py-3">
      <RouterLink
        v-for="item in menu"
        :key="item.path"
        :to="item.path"
        class="block px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        active-class="bg-slate-800 text-white border-l-2 border-blue-400"
      >
        {{ item.label }}
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup lang="ts">
const menu = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/financeiro', label: 'Financeiro' },
  { path: '/vendas', label: 'Vendas' },
  { path: '/compras', label: 'Compras' },
  { path: '/estoque', label: 'Estoque' },
  { path: '/clientes', label: 'Clientes' },
  { path: '/fornecedores', label: 'Fornecedores' },
  { path: '/relatorios', label: 'Relatórios' },
  { path: '/dre', label: 'DRE' },
  { path: '/balanco', label: 'Balanço Patrimonial' },
  { path: '/assistente', label: 'Assistente' },
  { path: '/configuracoes', label: 'Configurações' },
]
</script>
