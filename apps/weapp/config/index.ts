import path from 'node:path'

import { defineConfig, type UserConfigExport } from '@tarojs/cli'

const APP_DIR = path.resolve(__dirname, '..')
const SHARED_DIR = path.resolve(APP_DIR, '..', '..', 'shared')
/** 切片文案目录（scripts/build-shared-messages.mjs 的产物） */
const SHARED_MESSAGES_DIR = path.join(SHARED_DIR, 'js', 'messages')

// ─────────────────────────────────────────────────────────────────────────────
// 构建期 env：小程序没有 process 对象，env 必须在构建期被**替换成字面量**。
//
// ⚠️ 实测结论（spike）：`defineConstants` 是字面量文本替换，只对静态写死的
// `process.env.FOO` 生效；shared/constants/{domains,endpoints}.ts 用的是
// `process.env[name]`（动态下标），替换不到。
// 所以这里**不依赖** defineConstants 去修 shared，而是注入一个 weapp 专属的
// 全局常量对象，由 src/runtime/env.ts 作为**唯一出口**消费。
// 小程序产物是公开的 —— 这里只放公开配置，不放任何密钥。
// ─────────────────────────────────────────────────────────────────────────────
const WEAPP_ENV = {
  /** API 基址（末尾无斜杠）。未配置时运行期明确失败，不做非空 fallback（SK-8） */
  apiBaseUrl: (process.env.WEAPP_API_BASE_URL ?? '').trim().replace(/\/+$/, ''),
  /** Bearer 通道的 clientId（服务端 /api/auth/token 必填） */
  clientId: (process.env.WEAPP_CLIENT_ID ?? '').trim(),
  /** 埋点用环境标识 */
  env: process.env.NODE_ENV ?? 'production',
} as const

const baseConfig: UserConfigExport<'webpack5'> = {
  projectName: 'aaigc-weapp',
  date: '2026-9-20',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    375: 2,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  alias: {
    // shared/package.json 的 exports 没有 `./js/*`，切片文案无法用包名说明符导入，
    // 且不允许改 shared/ —— 用 weapp 侧 alias 指到真实目录。
    '@aaigc/messages': SHARED_MESSAGES_DIR,
  },
  defineConstants: {
    __AAIGC_WEAPP_ENV__: JSON.stringify(WEAPP_ENV),
  },
  copy: {
    patterns: [],
    options: {},
  },
  framework: 'react',
  compiler: {
    type: 'webpack5',
    prebundle: { enable: false },
  },
  cache: { enable: false },
  mini: {
    // ── 承重配置（已实测）：让 Taro 的 babel-loader 处理 src 之外的 shared/ TS 源码 ──
    // 默认 rule.include = [sourceDir, taro 自身的 node_modules]，不含 shared/，
    // 不加这行会直接 ModuleParseError（Unexpected token，import type）。
    // 注意：数组元素必须是合法的 webpack condition（绝对路径字符串 / RegExp / 函数），
    // 不能写成 { path, type: 'folder' } —— 那会被 Taro 配置校验直接拒绝。
    compile: {
      include: [SHARED_DIR],
    },
    postcss: {
      pxtransform: { enable: true, config: {} },
      cssModules: { enable: false },
    },
  },
  h5: {
    // H5 走的是 H5WebpackModule，同一份逻辑（H5WebpackModule.js 里也是
    // rule.include.unshift(...compile.include)），所以这里必须再配一次。
    compile: {
      include: [SHARED_DIR],
    },
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      autoprefixer: { enable: true, config: {} },
      cssModules: { enable: false },
    },
  },
}

export default defineConfig(baseConfig)
