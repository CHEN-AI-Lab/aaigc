import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const monorepoRoot = require('path').join(__dirname, '../..')

// 安全响应头
const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // 注意：Content-Security-Policy 由 src/proxy.ts 注入（含一次性 nonce 的强防护方案）。
  // 是否启用强防护由运行时环境变量 AAIGC_STRICT_CSP 控制：
  //   - 未设置（默认）= 快模式，script-src 'self' 'unsafe-inline'，页面静态预渲染；
  //   - 'true' = 强防护，script-src 'self' 'nonce-xxx' 'strict-dynamic'，动态渲染。
  // next.config 的静态 CSP 无法为每次请求提供独立 nonce，故交由 proxy.ts 处理。
]

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development',
  },
  outputFileTracingRoot: monorepoRoot,
  // 显式指定 Turbopack 项目根为 monorepo root，避免误判 workspace root 导致全目录文件监听风暴（CPU/内存爆掉）
  turbopack: {
    root: monorepoRoot,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
