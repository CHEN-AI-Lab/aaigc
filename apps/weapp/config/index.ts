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
  defineConstants: {},
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
    // ── 本次 spike 的关键配置：让 Taro 编译 src 之外的 TS 源码 ──
    compile: {
      include: [SHARED_DIR],
    },
    postcss: {
      pxtransform: { enable: true, config: {} },
      cssModules: { enable: false },
    },
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      autoprefixer: { enable: true, config: {} },
      cssModules: { enable: false },
    },
  },
}

export default defineConfig(baseConfig)
