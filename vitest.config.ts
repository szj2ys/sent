import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    fileParallelism: false,
    pool: 'forks',
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './app'),
    },
  },
})
