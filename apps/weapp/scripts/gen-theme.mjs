#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// 从 shared/constants/theme.ts 生成 apps/weapp/src/theme.generated.css
//
// 为什么要有这一步：SK-7 要求色板只有一个真源（shared/constants/theme.ts），
// 而 WXSS 无法 import TS。把色值抄进 app.css 必然漂移，所以改为**构建期生成**：
// 每次构建前重新渲染，不存在漂移窗口，也不需要额外的漂移门禁。
//
// 为什么不用 config/index.ts 里做：Taro 把 config/index.ts 编译成 CJS 后用
// require 加载，跨包 require 一个 .ts 会 MODULE_NOT_FOUND（实测）。所以独立成脚本。
//
// Node 24 原生支持 TS 类型擦除，直接 import theme.ts 即可，零额外依赖。
// ─────────────────────────────────────────────────────────────────────────────

import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const APP_DIR = path.resolve(SCRIPT_DIR, '..')
const THEME_TS = path.resolve(APP_DIR, '..', '..', 'shared', 'constants', 'theme.ts')
const TARGET = path.join(APP_DIR, 'src', 'theme.generated.css')

const theme = await import(pathToFileURL(THEME_TS).href)

const { THEME_COLOR_NAMES, THEME_CSS_VARIABLES, LIGHT_THEME_TOKENS } = theme

if (
  !Array.isArray(THEME_COLOR_NAMES) ||
  typeof THEME_CSS_VARIABLES !== 'object' ||
  typeof LIGHT_THEME_TOKENS !== 'object'
) {
  throw new Error(
    `shared/constants/theme.ts 的导出面与预期不符，无法生成主题 WXSS：${THEME_TS}`,
  )
}

for (const name of THEME_COLOR_NAMES) {
  if (typeof LIGHT_THEME_TOKENS[name] !== 'string' || LIGHT_THEME_TOKENS[name].length === 0) {
    throw new Error(`LIGHT_THEME_TOKENS.${name} 缺失或不是非空字符串`)
  }
  if (typeof THEME_CSS_VARIABLES[name] !== 'string') {
    throw new Error(`THEME_CSS_VARIABLES.${name} 缺失`)
  }
}

const declarations = THEME_COLOR_NAMES.map(
  (name) => `  ${THEME_CSS_VARIABLES[name]}: ${LIGHT_THEME_TOKENS[name]};`,
).join('\n')

// ⚠️ 选择器必须同时含 `page` 与 `body`：
//   小程序只有 page，H5 只有 body。只写 page 会让 H5 取不到变量值。
const css = [
  '/* 本文件由 apps/weapp/scripts/gen-theme.mjs 自动生成，请勿手改。',
  ' * 真源：shared/constants/theme.ts 的 LIGHT_THEME_TOKENS（SK-7）。 */',
  ':root,',
  'page,',
  'body {',
  declarations,
  '}',
  '',
].join('\n')

mkdirSync(path.dirname(TARGET), { recursive: true })
writeFileSync(TARGET, css, 'utf8')

console.log(`[gen-theme] wrote ${path.relative(APP_DIR, TARGET)} (${css.length} bytes)`)
