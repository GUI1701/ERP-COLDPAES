import { defineConfig } from 'vitest/config'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {}
  const result: Record<string, string> = {}
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx < 0) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    if (key && val) result[key] = val
  }
  return result
}

const testEnv = loadEnvFile(resolve(__dirname, '.env.test'))

export default defineConfig({
  test: {
    include: ['src/tests/e2e/**/*.test.ts'],
    env: testEnv,
    globalSetup: ['./src/tests/e2e/setup/globalSetup.ts'],
    setupFiles: ['./src/tests/e2e/setup/testSetup.ts'],
    testTimeout: 30000,
    hookTimeout: 60000,
    sequence: { concurrent: false },
    fileParallelism: false,
  },
})
