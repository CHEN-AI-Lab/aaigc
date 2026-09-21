// ─────────────────────────────────────────────────────────────────────────────
// apps/cli/scripts/build.mjs —— 用 esbuild 把 CLI 打成单文件 ESM 可执行包
//
// 为什么要打包：shared/ 以「源码 TS + exports 子路径」的形式被各端消费
// （见 shared/package.json），没有编译产物；CLI 是 Node 进程，不能像 Next.js
// 那样靠 bundler 现场解析 TS + tsconfig paths。esbuild 顺带完成两件事：
//   1. 解析 tsconfig 的 `shared/*` paths（与 apps/web 同一套映射）；
//   2. 把 shared/messages/*.json 内联进产物，CLI 运行时无需再猜文件位置。
//
// 产物 apps/cli/dist/ 已被根 .gitignore 忽略，属于构建产物。
// ─────────────────────────────────────────────────────────────────────────────

import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const packageRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const repoRoot = path.resolve(packageRoot, '..', '..')
const require = createRequire(import.meta.url)

const PLATFORM = `${process.platform}-${process.arch}`

/**
 * esbuild 的可执行文件来自平台子包 `@esbuild/<platform>`。
 * pnpm 正常安装时该子包会链接到顶层 node_modules；若顶层链接缺失（仓库曾出现
 * 该状态），从 pnpm store 里把二进制路径直接喂给 esbuild（等价于
 * 原先 `scripts/build-shared-js.mjs` 用的同一套 ESBUILD_BINARY_PATH 兜底 —— 该脚本已随
 * T01.3 取消于 2026-09-21 删除，兜底思路保留在这里）。
 */
function resolveEsbuildBinary() {
  if (process.env.ESBUILD_BINARY_PATH) return
  try {
    require.resolve(`@esbuild/${PLATFORM}/bin/esbuild`)
    return
  } catch {
    // 顶层未链接，继续从 pnpm store 找
  }
  const storeDir = path.join(repoRoot, 'node_modules', '.pnpm')
  if (!existsSync(storeDir)) return
  const prefix = `@esbuild+${PLATFORM}@`
  const entry = readdirSync(storeDir).find((name) => name.startsWith(prefix))
  if (!entry) return
  const binary = path.join(storeDir, entry, 'node_modules', '@esbuild', PLATFORM, 'bin', 'esbuild')
  if (existsSync(binary)) process.env.ESBUILD_BINARY_PATH = binary
}

resolveEsbuildBinary()

await build({
  absWorkingDir: packageRoot,
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  // Node 22 = CI 的 node-version，产物不再向下兼容更老运行时
  target: 'node22',
  tsconfig: 'tsconfig.json',
  banner: { js: '#!/usr/bin/env node' },
  logLevel: 'info',
})
