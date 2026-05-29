import Fastify from 'fastify'
import cors from '@fastify/cors'
import { estoqueRoutes } from './modules/estoque/estoque.routes'

export function buildApp() {
  const app = Fastify({ logger: true })

  app.register(cors, { origin: 'http://localhost:5173' })
  app.register(estoqueRoutes)

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
