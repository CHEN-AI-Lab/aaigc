import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const monorepoRoot = require('path').join(__dirname, '../..')

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development',
  },
  outputFileTracingRoot: monorepoRoot,
  // 显式指定 Turbopack 项目根为 monorepo root，避免误判 workspace root 导致全目录文件监听风暴（CPU/内存爆掉）
  turbopack: {
    root: monorepoRoot,
  },
}

export default withNextIntl(nextConfig)