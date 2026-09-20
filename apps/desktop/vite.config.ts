import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { isSiteOriginConfigured, siteOrigin } from '../../shared/constants/domains'

// ─────────────────────────────────────────────────────────────────────────────
// 站点地址注入（构建期，缺失即失败）
//
// 唯一真源是 shared/constants/domains.ts 的 siteOrigin()，它读 NEXT_PUBLIC_APP_URL。
// 桌面端**不做非空 fallback**：没配置就直接让构建失败，而不是悄悄打开一个
// 我们并不确定的地址（SK-8）。注意这里用的是 isSiteOriginConfigured()，
// 而不是只看 siteOrigin() —— 后者在未配置时会回落到已确认的公开站 origin，
// 那是给 sitemap / metadata 这类「给个可用地址」场景用的，不能用来判断「配没配」。
// ─────────────────────────────────────────────────────────────────────────────
if (!isSiteOriginConfigured()) {
  throw new Error(
    [
      '构建失败：未配置 NEXT_PUBLIC_APP_URL。',
      '桌面端不提供默认站点地址（SK-8：禁止非空 fallback）。',
      '请在构建前显式注入，例如：',
      '  NEXT_PUBLIC_APP_URL=https://your-domain.example pnpm --filter desktop build',
    ].join('\n'),
  )
}

const SITE_ORIGIN = siteOrigin()

/**
 * 开发服务器端口的唯一真源是 src-tauri/tauri.conf.json 的 build.devUrl。
 * 这里把它读回来，避免 vite.config.ts 与 tauri.conf.json 各写一个端口。
 */
function readDevUrl(): string {
  const path = fileURLToPath(new URL('./src-tauri/tauri.conf.json', import.meta.url))
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('tauri.conf.json 的顶层不是对象')
  }

  const build: unknown = (parsed as Record<string, unknown>).build
  if (typeof build !== 'object' || build === null) {
    throw new Error('tauri.conf.json 缺少 build 段')
  }

  const devUrl: unknown = (build as Record<string, unknown>).devUrl
  if (typeof devUrl !== 'string' || devUrl.length === 0) {
    throw new Error('tauri.conf.json 缺少 build.devUrl')
  }

  return devUrl
}

const devUrl = new URL(readDevUrl())

export default defineConfig({
  // Tauri CLI 会接管终端输出，别让 Vite 清屏把它的日志冲掉
  clearScreen: false,
  plugins: [react(), tailwindcss()],
  define: {
    // 壳 UI 直接使用这个常量；Rust 侧另有一份由 build.rs 注入的副本，
    // 两者必须一致 —— src/shell/connect.ts 会在运行时比对，不一致就报配置错误。
    __SITE_ORIGIN__: JSON.stringify(SITE_ORIGIN),
  },
  server: {
    host: devUrl.hostname,
    port: Number.parseInt(devUrl.port, 10),
    strictPort: true,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
})
