#!/usr/bin/env node
/**
 * 用 esbuild 把 shared/js/entry.ts 打成 shared/js/shared.mjs（产物入库）。
 *
 * 用法：
 *   node scripts/build-shared-js.mjs                 # 写入 shared/js/shared.mjs
 *   node scripts/build-shared-js.mjs --out <dir>     # 写入 <dir>/shared.mjs（漂移检查用）
 *   node scripts/build-shared-js.mjs --check         # 重建到临时目录并与入库产物 diff
 *
 * --platform=neutral 会在误用 Node / DOM API 时直接报错，
 * 这是「38 个工具必须能脱离 DOM 运行」的第一道机械保证。
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..')
const ENTRY = path.join(REPO_ROOT, 'shared', 'js', 'entry.ts')
const DEFAULT_OUT = path.join(REPO_ROOT, 'shared', 'js', 'shared.mjs')

/** esbuild 解析：优先包内解析，失败时回退 ESBUILD_MODULE_PATH（离线环境兜底） */
async function loadEsbuild() {
  try {
    return await import('esbuild')
  } catch {
    const override = process.env.ESBUILD_MODULE_PATH
    if (override) {
      return await import(pathToFileURL(override).href)
    }
    throw new Error(
      'Cannot resolve esbuild. Run `pnpm install` or set ESBUILD_MODULE_PATH to the esbuild package entry.',
    )
  }
}

function parseArgs(argv) {
  const args = { out: null, check: false }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') {
      args.out = argv[++i]
    } else if (argv[i] === '--check') {
      args.check = true
    }
  }
  return args
}

async function buildBundle(esbuild, outfile) {
  const result = await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    target: 'es2020',
    outfile,
    legalComments: 'none',
    logLevel: 'warning',
    write: true,
    metafile: true,
  })
  return result
}

/**
 * 预检 esbuild 是否真的可用。
 *
 * 为什么需要这段：当平台二进制缺失时（node_modules 被跨 OS 安装污染过会发生），
 * `import('esbuild')` 会成功、`transform()` 抛出的错误也能被 catch，
 * 但 esbuild 内部随后会**以退出码 0 结束进程** —— 于是调用方（含 check-shared-js.sh）
 * 看到的是「命令成功」，门禁长期报绿却什么都没检查。
 * 所以这里主动探一次，失败就明确 exit 1，把假绿掐死在源头。
 */
async function assertEsbuildUsable(esbuild) {
  try {
    await esbuild.transform('export const __aaigcProbe = 1', { loader: 'js' })
  } catch (error) {
    const detail = error?.message ?? String(error)
    throw new Error(
      [
        'esbuild 不可用（多半是平台二进制缺失）。',
        '',
        detail,
        '',
        '修复：pnpm install；若仍失败可显式指定二进制——',
        "  export ESBUILD_BINARY_PATH=<repo>/node_modules/.pnpm/@esbuild+<platform>@<ver>/node_modules/@esbuild/<platform>/bin/esbuild",
      ].join('\n'),
    )
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const esbuild = await loadEsbuild()
  await assertEsbuildUsable(esbuild)

  if (args.check) {
    const tmpDir = mkdtempSync(path.join(tmpdir(), 'aaigc-shared-js-'))
    const outfile = path.join(tmpDir, 'shared.mjs')
    await buildBundle(esbuild, outfile)
    if (!existsSync(DEFAULT_OUT)) {
      console.error(`❌ ${path.relative(REPO_ROOT, DEFAULT_OUT)} 不存在，请先运行 pnpm build:shared`)
      process.exit(1)
    }
    const current = readFileSync(DEFAULT_OUT, 'utf8')
    const rebuilt = readFileSync(outfile, 'utf8')
    if (current !== rebuilt) {
      console.error('❌ shared/js/shared.mjs 与 shared/ 源码不一致（双源漂移）')
      console.error('   请运行：pnpm build:shared')
      process.exit(1)
    }
    console.log('✅ shared/js/shared.mjs 与源码一致（无漂移）')
    return
  }

  const outfile = args.out ? path.join(args.out, 'shared.mjs') : DEFAULT_OUT
  mkdirSync(path.dirname(outfile), { recursive: true })
  const result = await buildBundle(esbuild, outfile)

  const outputs = Object.keys(result.metafile?.outputs ?? {})
  const bytes = outputs.reduce((sum, key) => sum + (result.metafile.outputs[key]?.bytes ?? 0), 0)
  console.log(`✅ built ${path.relative(REPO_ROOT, outfile)} (${(bytes / 1024).toFixed(1)} KB)`)
}

main().catch((error) => {
  console.error(error?.message ?? error)
  process.exit(1)
})
