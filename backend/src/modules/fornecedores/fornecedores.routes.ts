import { FastifyInstance } from 'fastify'
import {
  listarFornecedores, buscarFornecedor, criarFornecedor,
  atualizarFornecedor, desativarFornecedor, getResumoFornecedor,
} from './fornecedores.service'

export async function fornecedoresRoutes(app: FastifyInstance) {
  app.get('/fornecedores', async (req) => {
    const { todos } = req.query as { todos?: string }
    return listarFornecedores(todos !== 'true')
  })

  app.get('/fornecedores/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    try { return await buscarFornecedor(id) }
    catch { return reply.status(404).send({ error: 'Fornecedor não encontrado' }) }
  })

  app.get('/fornecedores/:id/resumo', async (req, reply) => {
    const { id } = req.params as { id: string }
    try { return await getResumoFornecedor(id) }
    catch { return reply.status(404).send({ error: 'Fornecedor não encontrado' }) }
  })

  app.post('/fornecedores', {
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
      const fornecedor = await criarFornecedor(req.body as any)
      return reply.status(201).send(fornecedor)
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.put('/fornecedores/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    try { return await atualizarFornecedor(id, req.body as any) }
    catch (err: any) { return reply.status(400).send({ error: err.message }) }
  })

  app.delete('/fornecedores/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await desativarFornecedor(id)
    return reply.status(204).send()
  })
}
