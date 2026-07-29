import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    css: true,
    // WSL 资源限制：单 fork 模式，避免撑爆 CPU/内存
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    maxWorkers: 1,
    maxConcurrency: 5,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/web/src'),
      shared: path.resolve(__dirname, 'shared'),
      data: path.resolve(__dirname, 'data'),
    },
  },
})