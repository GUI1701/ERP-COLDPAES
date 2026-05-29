import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp } from '../app'

describe('health', () => {
  const app = buildApp()

  beforeAll(() => app.ready())
  afterAll(() => app.close())

  it('GET /health retorna 200 com status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok' })
  })
})
