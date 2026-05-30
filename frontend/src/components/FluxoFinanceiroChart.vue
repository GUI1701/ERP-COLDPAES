<template>
  <div class="bg-white rounded-lg p-4 shadow-sm mb-4">
    <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
      Fluxo Financeiro — Próximos 30 Dias
    </h3>
    <div class="relative h-52">
      <Bar v-if="temMovimentacao" :data="chartData" :options="chartOptions" />
      <p v-else class="text-sm text-gray-400 text-center pt-16">Sem movimentações no período.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Tooltip, Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface DiaFluxo {
  label: string
  entradas: number
  saidas: number
  caixaProjetado: number
}

const props = defineProps<{ dados: DiaFluxo[] }>()

const temMovimentacao = computed(() =>
  props.dados.some(d => d.entradas !== 0 || d.saidas !== 0)
)

const fmtAxis = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const fmtTooltip = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(v)

function calcularStep(absMax: number): number {
  if (absMax <= 10_000)  return 1_000
  if (absMax <= 50_000)  return 5_000
  if (absMax <= 100_000) return 10_000
  if (absMax <= 250_000) return 25_000
  return 50_000
}

const escalaY = computed(() => {
  const maxEntrada = Math.max(...props.dados.map(d => d.entradas), 0)
  const maxSaida   = Math.max(...props.dados.map(d => Math.abs(d.saidas)), 0)
  const absMaxBruto = Math.max(maxEntrada, maxSaida, 1_000)
  const step = calcularStep(absMaxBruto)
  const absMax = Math.ceil(absMaxBruto / step) * step
  return { min: -absMax, max: absMax, stepSize: step }
})

const chartData = computed(() => ({
  labels: props.dados.map(d => d.label),
  datasets: [
    {
      label: 'Entradas',
      data: props.dados.map(d => d.entradas),
      backgroundColor: '#22C55E',
      borderRadius: 3,
      borderSkipped: false,
    },
    {
      label: 'Saídas',
      data: props.dados.map(d => d.saidas),
      backgroundColor: '#EF4444',
      borderRadius: 3,
      borderSkipped: false,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: { font: { size: 11 }, boxWidth: 10, padding: 12 },
    },
    tooltip: {
      callbacks: {
        title: (items: any[]) => items[0]?.label ?? '',
        label: (item: any) => {
          const abs = Math.abs(item.raw as number)
          if (abs === 0) return undefined
          return `${item.dataset.label}: ${fmtTooltip(abs)}`
        },
      },
      filter: (item: any) => Math.abs(item.raw as number) > 0,
    },
  },
  scales: {
    x: {
      ticks: { font: { size: 9 }, maxRotation: 45 },
      grid: { display: false },
    },
    y: {
      min: escalaY.value.min,
      max: escalaY.value.max,
      ticks: {
        stepSize: escalaY.value.stepSize,
        font: { size: 9 },
        callback: (v: any) => fmtAxis(Number(v)),
      },
      grid: { color: '#F3F4F6' },
    },
  },
}))
</script>
