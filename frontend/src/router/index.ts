import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', component: () => import('../views/DashboardView.vue') },
        { path: 'financeiro', component: () => import('../views/FinanceiroView.vue') },
        { path: 'vendas', component: () => import('../views/VendasView.vue') },
        { path: 'compras', component: () => import('../views/ComprasView.vue') },
        { path: 'estoque', component: () => import('../views/EstoqueView.vue') },
        { path: 'relatorios', component: () => import('../views/RelatoriosView.vue') },
        { path: 'dre', component: () => import('../views/DREView.vue') },
        { path: 'balanco', component: () => import('../views/BalancoView.vue') },
        { path: 'clientes', component: () => import('../views/ClientesView.vue') },
        { path: 'fornecedores', component: () => import('../views/FornecedoresView.vue') },
        { path: 'assistente', component: () => import('../views/AssistenteView.vue') },
        { path: 'configuracoes', component: () => import('../views/ConfiguracoesView.vue') },
      ],
    },
  ],
})
