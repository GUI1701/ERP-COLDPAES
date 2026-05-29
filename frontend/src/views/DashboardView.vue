<template>
  <div>
    <h2 class="text-xl font-bold text-gray-800 mb-5">Dashboard</h2>

    <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
      <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Caixa Atual</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">R$ 45.320,00</p>
      </div>
      <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Caixa Projetado 30d</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">R$ 52.800,00</p>
      </div>
      <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-emerald-500">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Entradas do Dia</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">R$ 8.400,00</p>
      </div>
      <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-400">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Saídas do Dia</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">R$ 3.200,00</p>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
      <div class="bg-white rounded-lg p-4 shadow-sm">
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Produtos Acabados</h3>
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-700">Pão de queijo congelado</span>
            <span class="font-medium">1.200 un</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-700">Croissant congelado</span>
            <span class="font-medium">840 un</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-700">Pão francês congelado</span>
            <span class="font-medium text-red-600">180 un</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg p-4 shadow-sm">
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Insumos</h3>
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-700">Trigo</span>
            <span class="font-medium text-red-600">120 kg</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-700">Manteiga</span>
            <span class="font-medium text-yellow-600">45 kg</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-700">Fermento</span>
            <span class="font-medium">28 kg</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg p-4 shadow-sm">
      <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Alertas</h3>
      <div class="space-y-2">
        <div class="flex items-start gap-2 p-2 bg-red-50 rounded border border-red-200">
          <span class="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
          <span class="text-sm text-red-700">Trigo abaixo do estoque mínimo — 120 kg (mínimo: 150 kg)</span>
        </div>
        <div class="flex items-start gap-2 p-2 bg-red-50 rounded border border-red-200">
          <span class="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
          <span class="text-sm text-red-700">Conta vencida: Fornecedor ABC — R$ 2.400,00 (venceu 27/05)</span>
        </div>
        <div class="flex items-start gap-2 p-2 bg-yellow-50 rounded border border-yellow-200">
          <span class="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 shrink-0"></span>
          <span class="text-sm text-yellow-700">Manteiga próxima do mínimo — 45 kg (mínimo: 40 kg)</span>
        </div>
        <div class="flex items-start gap-2 p-2 bg-yellow-50 rounded border border-yellow-200">
          <span class="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 shrink-0"></span>
          <span class="text-sm text-yellow-700">Conta vence em 2 dias: Energia elétrica — R$ 1.800,00</span>
        </div>
      </div>
    </div>
  </div>
</template>
