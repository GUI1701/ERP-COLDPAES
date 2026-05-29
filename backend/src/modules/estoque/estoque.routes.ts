import { FastifyInstance } from 'fastify'
import {
  listarItens, cadastrarItem, atualizarItem, deletarItem,
  registrarMovimento, listarMovimentos,
} from './estoque.service'

export async function estoqueRoutes(app: FastifyInstance) {
  app.get('/estoque/itens', async () => listarItens())

  app.post('/estoque/itens', {
    schema: {
      body: {
        type: 'object',
        required: ['nome', 'tipo', 'unidade', 'estoqueMinimo', 'estoqueIdeal'],
        properties: {
          nome: { type: 'string', minLength: 1 },
          tipo: { type: 'string', enum: ['PRODUTO', 'INSUMO'] },
          unidade: { type: 'string', minLength: 1 },
          estoqueMinimo: { type: 'number', minimum: 0 },
          estoqueIdeal: { type: 'number', minimum: 0 },
        },
      },
    },
  }, async (req, reply) => {
    const item = await cadastrarItem(req.body as any)
    return reply.status(201).send(item)
  })

  app.put('/estoque/itens/:id', {
    schema: {
      body: {
        type: 'object',
        properties: {
          nome: { type: 'string', minLength: 1 },
          unidade: { type: 'string', minLength: 1 },
          estoqueMinimo: { type: 'number', minimum: 0 },
          estoqueIdeal: { type: 'number', minimum: 0 },
        },
      },
    },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      return await atualizarItem(id, req.body as any)
    } catch {
      return reply.status(404).send({ error: 'Item não encontrado' })
    }
  })

  app.delete('/estoque/itens/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await deletarItem(id)
    return reply.status(204).send()
  })

  app.post('/estoque/itens/:id/movimentos', {
    schema: {
      body: {
        type: 'object',
        required: ['tipo', 'quantidade'],
        properties: {
          tipo: { type: 'string', enum: ['ENTRADA', 'SAIDA', 'AJUSTE'] },
          quantidade: { type: 'number' },
          motivo: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { tipo, quantidade, motivo } = req.body as any
    try {
      return await registrarMovimento(id, tipo, quantidade, motivo)
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.get('/estoque/itens/:id/movimentos', async (req) => {
    const { id } = req.params as { id: string }
    return listarMovimentos(id)
  })
}
