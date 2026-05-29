import { FastifyInstance } from 'fastify'
import { getDashboardResumo } from './dashboard.service'

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/dashboard/resumo', async () => getDashboardResumo())
}
