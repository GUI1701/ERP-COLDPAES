import Fastify from 'fastify'
import cors from '@fastify/cors'

export function buildApp() {
  const app = Fastify({ logger: true })

  app.register(cors, { origin: 'http://localhost:5173' })

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
