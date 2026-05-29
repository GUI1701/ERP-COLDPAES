import { FastifyInstance } from 'fastify'
import {
  getResumo, listarLancamentos, criarLancamento,
  efetivarLancamento, removerLancamento,
} from './financeiro.service'

export async function financeiroRoutes(app: FastifyInstance) {
  app.get('/financeiro/resumo', async () => getResumo())

  app.get('/financeiro/lancamentos', async (req) => {
    const { tipo, status } = req.query as { tipo?: string; status?: string }
    return listarLancamentos({ tipo, status })
  })

  app.post('/financeiro/lancamentos', {
    schema: {
      body: {
        type: 'object',
        required: ['descricao', 'tipo', 'valor', 'dataVencimento'],
        properties: {
          descricao: { type: 'string', minLength: 1 },
          tipo: { type: 'string', enum: ['RECEITA', 'DESPESA'] },
          status: { type: 'string', enum: ['PREVISTO', 'REALIZADO'] },
          valor: { type: 'number', minimum: 0.01 },
          dataVencimento: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const body = req.body as any
    const lanc = await criarLancamento({
      ...body,
      status: body.status ?? 'PREVISTO',
      dataVencimento: new Date(body.dataVencimento),
    })
    return reply.status(201).send(lanc)
  })

  app.post('/financeiro/lancamentos/:id/efetivar', async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      return await efetivarLancamento(id)
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.delete('/financeiro/lancamentos/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      await removerLancamento(id)
      return reply.status(204).send()
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })
}
