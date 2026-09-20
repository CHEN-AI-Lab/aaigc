import path from 'node:path'
import { defineConfig, type UserConfigExport } from '@tarojs/cli'

const SHARED_DIR = path.resolve(__dirname, '..', '..', '..', 'shared')

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
  defineConstants: {
    // ⚠️ 实测结论：defineConstants 是**字面量文本替换**，只对源码里静态写死的
    // `process.env.FOO` 生效。shared/constants/domains.ts 与 endpoints.ts 用的是
    // `readEnv(name) { process.env[name] }`（动态下标），defineConstants **替换不到**，
    // 产物里会原样残留 `process.env[e]`。
    // 好在这些 readEnv 都带 `typeof process !== 'undefined' && process.env` 守卫，
    // 小程序里安全退化为 ''（siteOrigin() 回落到第一方常量 aaigc.online），不会抛错。
    // 若要真正注入 env，需另想办法（alias / 改 shared 写法），不能只靠这一行。
    'process.env.NEXT_PUBLIC_APP_URL': JSON.stringify(
      process.env.NEXT_PUBLIC_APP_URL ?? '',
    ),
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
