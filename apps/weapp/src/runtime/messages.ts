// ─────────────────────────────────────────────────────────────────────────────
// 文案表 —— 只收 weapp 需要的 namespace，来源是 shared/js/messages 的**切片产物**
// （scripts/build-shared-messages.mjs 生成，68 个文件 = 17 ns × 4 locale）。
//
// ⚠️ 为什么不 import shared/messages/<locale>.json：
//   那是整包（72–89 KB/语言，含 about/privacy/terms/home 等小程序用不到的 ns），
//   4 语言合计 ~312 KB。切片只取需要的 6 个 namespace。
//
// ⚠️ 为什么不用 `import()` 做「按 namespace 按需加载」：
//   实测（apps/weapp 构建产物）Taro 小程序侧**不会为 import() 生成异步 chunk** ——
//   被 import 的 JSON 会作为普通模块内联进发起方的页面 chunk
//   （产物里 `installedChunks` 计数为 0，页面 chunk 内直接出现 JSON.parse('...')）。
//   既然不产生按需 chunk，「按需加载」在小程序主包里既不省下载体积也不省解析，
//   只会把加载时序复杂化。因此这里改为**静态导入**，体积口径清晰、无运行期竞态。
//
// ⚠️ 路径用的是 weapp 侧 alias `@aaigc/messages`：
//   shared/package.json 的 exports 没有 `./js/*`，切片无法用包名说明符导入，
//   而 shared/ 不允许改 —— 见 config/index.ts 的 alias 配置。
// ─────────────────────────────────────────────────────────────────────────────

import enApp from '@aaigc/messages/en/app.json'
import enAuth from '@aaigc/messages/en/auth.json'
import enCommon from '@aaigc/messages/en/common.json'
import enErrors from '@aaigc/messages/en/errors.json'
import enTools from '@aaigc/messages/en/tools.json'
import enUi from '@aaigc/messages/en/ui.json'
import jaApp from '@aaigc/messages/ja/app.json'
import jaAuth from '@aaigc/messages/ja/auth.json'
import jaCommon from '@aaigc/messages/ja/common.json'
import jaErrors from '@aaigc/messages/ja/errors.json'
import jaTools from '@aaigc/messages/ja/tools.json'
import jaUi from '@aaigc/messages/ja/ui.json'
import zhCnApp from '@aaigc/messages/zh-CN/app.json'
import zhCnAuth from '@aaigc/messages/zh-CN/auth.json'
import zhCnCommon from '@aaigc/messages/zh-CN/common.json'
import zhCnErrors from '@aaigc/messages/zh-CN/errors.json'
import zhCnTools from '@aaigc/messages/zh-CN/tools.json'
import zhCnUi from '@aaigc/messages/zh-CN/ui.json'
import zhTwApp from '@aaigc/messages/zh-TW/app.json'
import zhTwAuth from '@aaigc/messages/zh-TW/auth.json'
import zhTwCommon from '@aaigc/messages/zh-TW/common.json'
import zhTwErrors from '@aaigc/messages/zh-TW/errors.json'
import zhTwTools from '@aaigc/messages/zh-TW/tools.json'
import zhTwUi from '@aaigc/messages/zh-TW/ui.json'

import { defaultLocale, locales, type Locale } from './locale'

/** 切片文件的形状：{ "<namespace>": {...} } */
type Slice = Record<string, unknown>
type Table = Record<string, unknown>

function slice(namespace: string, raw: unknown): Table {
  const root = raw as Slice
  const value = root[namespace]
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`文案切片缺少 namespace「${namespace}」`)
  }
  return value as Table
}

/**
 * weapp 需要的 namespace 清单。
 * 收哪些是有取舍的：about/privacy/terms/home/footer/download/products/updates/admin/cli/desktop
 * 都是 Web/桌面/CLI 专属或静态页面文案，小程序不引用，因此不引入。
 */
const TABLES: Record<Locale, Table> = {
  en: {
    ...slice('common', enCommon),
    ...slice('ui', enUi),
    ...slice('errors', enErrors),
    ...slice('app', enApp),
    ...slice('auth', enAuth),
    ...slice('tools', enTools),
  },
  'zh-CN': {
    ...slice('common', zhCnCommon),
    ...slice('ui', zhCnUi),
    ...slice('errors', zhCnErrors),
    ...slice('app', zhCnApp),
    ...slice('auth', zhCnAuth),
    ...slice('tools', zhCnTools),
  },
  'zh-TW': {
    ...slice('common', zhTwCommon),
    ...slice('ui', zhTwUi),
    ...slice('errors', zhTwErrors),
    ...slice('app', zhTwApp),
    ...slice('auth', zhTwAuth),
    ...slice('tools', zhTwTools),
  },
  ja: {
    ...slice('common', jaCommon),
    ...slice('ui', jaUi),
    ...slice('errors', jaErrors),
    ...slice('app', jaApp),
    ...slice('auth', jaAuth),
    ...slice('tools', jaTools),
  },
}

export function tableFor(locale: Locale): Table {
  return TABLES[locale]
}

export function fallbackTable(): Table {
  return TABLES[defaultLocale]
}

export { locales }
