<template>
  <div class="bg-white rounded-lg p-4 shadow-sm mb-4">
    <div class="flex justify-between items-center mb-3">
      <div>
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Caixa Projetado — Próximos 30 Dias
        </h3>
        <p v-if="temMovimentacao && temDiaNegativo" class="text-xs text-red-500 mt-0.5">
          ⚠ Caixa negativo projetado em {{ diasNegativos }} dia(s)
        </p>
      </div>
    </div>
    <div class="relative h-52">
      <Line v-if="temMovimentacao" :data="chartData" :options="chartOptions" />
      <p v-else class="text-sm text-gray-400 text-center pt-16">Sem movimentações no período.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Tooltip, Legend, Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

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

const temDiaNegativo = computed(() => props.dados.some(d => d.caixaProjetado < 0))
const diasNegativos  = computed(() => props.dados.filter(d => d.caixaProjetado < 0).length)

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
  const valores = props.dados.map(d => d.caixaProjetado)
  if (!valores.length) return { min: 0, max: 10_000, stepSize: 1_000 }

  const minCaixa = Math.min(...valores)
  const maxCaixa = Math.max(...valores)
  const absMaxBruto = Math.max(Math.abs(minCaixa), Math.abs(maxCaixa), 1_000)
  const step = calcularStep(absMaxBruto)

  let min = Math.floor(minCaixa / step) * step
  let max = Math.ceil(maxCaixa / step) * step

  if (min === max) max = min + step

  return { min, max, stepSize: step }
})

const pontoCores = computed(() =>
  props.dados.map(d => d.caixaProjetado < 0 ? '#EF4444' : '#3B82F6')
)

const chartData = computed(() => ({
  labels: props.dados.map(d => d.label),
  datasets: [
    {
      label: 'Caixa Projetado',
      data: props.dados.map(d => d.caixaProjetado),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59,130,246,0.08)',
      pointBackgroundColor: pontoCores.value,
      pointBorderColor: pontoCores.value,
      tension: 0.35,
      fill: true,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: (items: any[]) => items[0]?.label ?? '',
        label: (item: any) => `Caixa projetado: ${fmtTooltip(item.raw as number)}`,
        labelColor: (item: any) => ({
          borderColor:     (item.raw as number) < 0 ? '#EF4444' : '#3B82F6',
          backgroundColor: (item.raw as number) < 0 ? '#EF4444' : '#3B82F6',
        }),
      },
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
      grid: {
        color: (ctx: any) => ctx.tick?.value === 0 ? '#9CA3AF' : '#F3F4F6',
      },
    },
  },
}))
</script>
