import { FastifyInstance } from 'fastify'
import {
  listarVendas, buscarVenda, getResumoVendas,
  criarVenda, excluirVenda,
} from './vendas.service'

export async function vendasRoutes(app: FastifyInstance) {
  app.get('/vendas', async () => listarVendas())

  app.get('/vendas/resumo', async () => getResumoVendas())

  app.get('/vendas/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      return await buscarVenda(id)
    } catch {
      return reply.status(404).send({ error: 'Venda não encontrada' })
    }
  })

  app.post('/vendas', {
    schema: {
      body: {
        type: 'object',
        required: ['data', 'dataVencimento', 'itens'],
        properties: {
          cliente: { type: 'string' },
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
      const venda = await criarVenda({
        ...body,
        data: new Date(body.data),
        dataVencimento: new Date(body.dataVencimento),
      })
      return reply.status(201).send(venda)
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.delete('/vendas/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      await excluirVenda(id)
      return reply.status(204).send()
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })
}
