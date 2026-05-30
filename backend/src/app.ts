import Fastify from 'fastify'
import cors from '@fastify/cors'
import { estoqueRoutes } from './modules/estoque/estoque.routes'
import { financeiroRoutes } from './modules/financeiro/financeiro.routes'
import { comprasRoutes } from './modules/compras/compras.routes'
import { vendasRoutes } from './modules/vendas/vendas.routes'
import { dashboardRoutes } from './modules/dashboard/dashboard.routes'
import { relatoriosRoutes } from './modules/relatorios/relatorios.routes'
import { clientesRoutes } from './modules/clientes/clientes.routes'
import { fornecedoresRoutes } from './modules/fornecedores/fornecedores.routes'
import { assistenteRoutes } from './modules/assistente/assistente.routes'

export function buildApp() {
  const app = Fastify({ logger: true })

  app.register(cors, { origin: 'http://localhost:5173' })
  app.register(estoqueRoutes)
  app.register(financeiroRoutes)
  app.register(comprasRoutes)
  app.register(vendasRoutes)
  app.register(dashboardRoutes)
  app.register(relatoriosRoutes)
  app.register(clientesRoutes)
  app.register(fornecedoresRoutes)
  app.register(assistenteRoutes)

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
