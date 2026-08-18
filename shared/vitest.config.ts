import { defineConfig } from 'vitest/config'
import path from 'path'

// shared package test runner.
// The shared layer's tests live in the monorepo root tests/unit/ (shared.*.test.ts),
// so point vitest's root at the monorepo root to pick them up.
export default defineConfig({
  test: {
    root: path.resolve(__dirname, '..'),
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
      '@': path.resolve(__dirname, '../apps/web/src'),
      shared: path.resolve(__dirname, '.'),
      data: path.resolve(__dirname, '../data'),
    },
  },
})