// Worker-level safety guard — executa antes de cada arquivo de teste E2E
const url = process.env.DATABASE_URL ?? ''

if (url.includes('hsuiwjgsqvarwkfnrzek')) {
  throw new Error(
    '⛔ E2E worker: DATABASE_URL aponta para o banco de producao. Abortando.'
  )
}
