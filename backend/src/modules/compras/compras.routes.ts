import { FastifyInstance } from 'fastify'
import {
  listarCompras, buscarCompra, getResumoCompras,
  criarCompra, excluirCompra,
} from './compras.service'

export async function comprasRoutes(app: FastifyInstance) {
  app.get('/compras', async () => listarCompras())

  app.get('/compras/resumo', async () => getResumoCompras())

  app.get('/compras/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      return await buscarCompra(id)
    } catch {
      return reply.status(404).send({ error: 'Compra não encontrada' })
    }
  })

  app.post('/compras', {
    schema: {
      body: {
        type: 'object',
        required: ['data', 'dataVencimento', 'itens'],
        properties: {
          fornecedor: { type: 'string' },
          data: { type: 'string' },
          dataVencimento: { type: 'string' },
          observacao: { type: 'string' },
          itens: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['itemId', 'quantidade', 'valorUnit'],
              properties: {
                itemId: { type: 'string' },
                quantidade: { type: 'number', minimum: 0.001 },
                valorUnit: { type: 'number', minimum: 0.01 },
              },
            },
          },
        },
      },
    },
  }, async (req, reply) => {
    const body = req.body as any
    try {
      const compra = await criarCompra({
        ...body,
        data: new Date(body.data),
        dataVencimento: new Date(body.dataVencimento),
      })
      return reply.status(201).send(compra)
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.delete('/compras/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      await excluirCompra(id)
      return reply.status(204).send()
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })
}
