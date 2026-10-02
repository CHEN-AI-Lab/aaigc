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
    coverage: {
      // 只测跨端共享的核心模块覆盖率（5 端都依赖这些）
      // 不强制业务代码 100% 覆盖（web/app 端组件测试走 React Testing Library 单独统计）
      include: ['shared/**/*.ts'],
      exclude: [
        'shared/**/*.test.ts',
        'shared/**/__tests__/**',
        'shared/i18n/**',          // i18n README + 未来可能要加的 helper
        'shared/data/**',          // 静态数据，由 tools/registry.test.ts 间接覆盖
        'shared/types/**',         // 仅类型，无运行时
        'shared/**/index.ts',      // barrel export，无逻辑
        'shared/utils/prisma.ts',  // Prisma 客户端初始化（无业务逻辑）
        'shared/utils/mail.ts',    // 邮件发送依赖外部服务（不在单测范围）
      ],
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      thresholds: {
        // 共享核心模块必须 ≥ 70% 覆盖（端间契约不能裸奔）
        // 80% 是理想值，但新仓库拉到 80% 要补很多低价值边界，留给后续 PR 渐进提升
        lines: 70,
        functions: 60,
        branches: 65,
        statements: 70,
        perFile: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/web/src'),
      shared: path.resolve(__dirname, 'shared'),
      data: path.resolve(__dirname, 'shared/data'),
    },
  },
})