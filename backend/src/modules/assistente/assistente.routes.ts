import { FastifyInstance } from 'fastify'
import { coletarDados, gerarResumoCompleto, responderPergunta } from './assistente.service'

export async function assistenteRoutes(app: FastifyInstance) {
  app.get('/assistente/resumo', async () => {
    const dados = await coletarDados()
    return gerarResumoCompleto(dados)
  })

  app.post('/assistente/perguntar', {
    schema: {
      body: {
        type: 'object',
        required: ['pergunta'],
        properties: {
          pergunta: { type: 'string', minLength: 1 },
        },
      },
    },
  }, async (req) => {
    const { pergunta } = req.body as { pergunta: string }
    const dados = await coletarDados()
    return responderPergunta(pergunta, dados)
  })
}
