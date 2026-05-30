import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

const PROD_PROJECT_ID = 'hsuiwjgsqvarwkfnrzek'

function loadEnvTest() {
  const envPath = resolve(process.cwd(), '.env.test')
  if (!existsSync(envPath)) {
    throw new Error(
      '\n⛔  backend/.env.test nao encontrado.\n' +
      '    Copie .env.test.example para .env.test\n' +
      '    e configure DATABASE_URL com o banco de teste.\n'
    )
  }
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx < 0) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    if (key) process.env[key] = val
  }
}

export async function setup() {
  loadEnvTest()

  const url = process.env.DATABASE_URL ?? ''

  if (!url) {
    throw new Error(
      '\n⛔  DATABASE_URL nao definido em .env.test.\n' +
      '    Configure um banco de teste isolado.\n'
    )
  }

  if (url.includes(PROD_PROJECT_ID)) {
    throw new Error(
      '\n⛔  BLOQUEADO: DATABASE_URL aponta para o banco de PRODUCAO.\n' +
      '    Os testes E2E exigem um banco de teste separado.\n' +
      '    Configure backend/.env.test com a URL de um segundo projeto Supabase.\n'
    )
  }

  console.log('\n✓  E2E: banco de teste validado. Iniciando simulacao operacional.\n')
}
