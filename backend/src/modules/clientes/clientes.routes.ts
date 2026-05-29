import { FastifyInstance } from 'fastify'
import {
  listarClientes, buscarCliente, criarCliente,
  atualizarCliente, desativarCliente, getResumoCliente,
} from './clientes.service'

export async function clientesRoutes(app: FastifyInstance) {
  app.get('/clientes', async (req) => {
    const { todos } = req.query as { todos?: string }
    return listarClientes(todos !== 'true')
  })

  app.get('/clientes/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    try { return await buscarCliente(id) }
    catch { return reply.status(404).send({ error: 'Cliente não encontrado' }) }
  })

  app.get('/clientes/:id/resumo', async (req, reply) => {
    const { id } = req.params as { id: string }
    try { return await getResumoCliente(id) }
    catch { return reply.status(404).send({ error: 'Cliente não encontrado' }) }
  })

  app.post('/clientes', {
    schema: {
      body: {
        type: 'object', required: ['nome'],
        properties: {
          nome: { type: 'string', minLength: 1 },
          telefone: { type: 'string' }, email: { type: 'string' },
          cidade: { type: 'string' }, observacao: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    try {
      const cliente = await criarCliente(req.body as any)
      return reply.status(201).send(cliente)
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.put('/clientes/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    try { return await atualizarCliente(id, req.body as any) }
    catch (err: any) { return reply.status(400).send({ error: err.message }) }
  })

  app.delete('/clientes/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await desativarCliente(id)
    return reply.status(204).send()
  })
}
