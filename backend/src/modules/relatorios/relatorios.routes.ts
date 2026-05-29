import { FastifyInstance } from 'fastify'
import { calcularPeriodo, getResumo, getRankings } from './relatorios.service'

export async function relatoriosRoutes(app: FastifyInstance) {
  app.get('/relatorios/resumo', async (req) => {
    const { inicio, fim } = req.query as { inicio?: string; fim?: string }
    const periodo = calcularPeriodo(inicio, fim)
    return getResumo(periodo.inicio, periodo.fim)
  })

  app.get('/relatorios/rankings', async (req) => {
    const { inicio, fim } = req.query as { inicio?: string; fim?: string }
    const periodo = calcularPeriodo(inicio, fim)
    return getRankings(periodo.inicio, periodo.fim)
  })
}
