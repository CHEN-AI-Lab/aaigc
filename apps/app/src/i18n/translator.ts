// ─────────────────────────────────────────────────────────────────────────────
// App i18n —— 复用 shared/messages/*.json（五端同一套文案真源）
//
// 与 apps/cli/src/core/i18n.ts 同一套查找/回落/插值规则（该文件在另一个 app 内，
// 无法跨 app 导入；两处逻辑必须一致，已在交付报告里列为"下沉 shared"候选）：
//   · 文案表全部来自 shared：错误码 = errors.<code>，工具名 = tools.<id>.name，
//     界面文案 = common.* / auth.* / ui.*；
//   · 查找缺失时回落 en，en 也没有就原样返回 key —— 绝不抛错、绝不留空串。
// ─────────────────────────────────────────────────────────────────────────────

import enMessages from 'shared/messages/en.json'
import jaMessages from 'shared/messages/ja.json'
import zhCnMessages from 'shared/messages/zh-CN.json'
import zhTwMessages from 'shared/messages/zh-TW.json'
import { defaultLocale, isLocale, locales } from 'shared/constants/locales'
import type { Locale } from 'shared/types'

/** 文案表只用于按点分路径取值，值类型不重要 */
type MessageTable = Record<string, unknown>

export type MessageParams = Record<string, string | number>

const TABLES: Record<Locale, MessageTable> = {
  en: enMessages as MessageTable,
  'zh-CN': zhCnMessages as MessageTable,
  'zh-TW': zhTwMessages as MessageTable,
  ja: jaMessages as MessageTable,
}

/**
 * ── 过渡态：App 独有文案 ──────────────────────────────────────────────────
 *
 * 这些是**只有 App 界面才需要**的标签（设备码登录、运行环境、跟随系统…），
 * shared/messages 里目前没有对应 key。正确做法是在 shared/messages/*.json 里
 * 新增 `app.*` namespace（与 `cli.*` 同一个模式，受同一次四语对齐校验约束），
 * 但 shared/ 归共享层维护者所有，本次不擅自改动。
 *
 * 因此这里做一个**只对 `app.` 前缀生效**的兜底表：
 *   · 命中 shared 的 key 优先 —— 一旦 shared/messages 补齐 `app.*`，
 *     共享层自动胜出，本表变成死代码，删掉即可，无需改任何调用点；
 *   · 只覆盖确实没有等价 key 的标签，其余一律复用 shared 既有文案
 *     （如 tools.copied / about.languages / errors.authorizationPending）。
 */
const APP_LOCAL_MESSAGES: Record<Locale, Record<string, string>> = {
  en: {
    'app.deviceLogin': 'Device code',
    'app.runtime': 'Runtime',
    'app.apiBaseUrl': 'API base URL',
    'app.timezone': 'Time zone',
    'app.followSystem': 'Follow system',
    'app.version': 'Version',
    'app.noFavorites': 'No favorites yet',
    'app.pendingSync': '{count} change(s) waiting to sync',
  },
  'zh-CN': {
    'app.deviceLogin': '设备码登录',
    'app.runtime': '运行环境',
    'app.apiBaseUrl': 'API 基址',
    'app.timezone': '时区',
    'app.followSystem': '跟随系统',
    'app.version': '版本',
    'app.noFavorites': '还没有收藏',
    'app.pendingSync': '有 {count} 项变更待同步',
  },
  'zh-TW': {
    'app.deviceLogin': '裝置碼登入',
    'app.runtime': '執行環境',
    'app.apiBaseUrl': 'API 位址',
    'app.timezone': '時區',
    'app.followSystem': '跟隨系統',
    'app.version': '版本',
    'app.noFavorites': '還沒有收藏',
    'app.pendingSync': '有 {count} 項變更待同步',
  },
  ja: {
    'app.deviceLogin': 'デバイスコード',
    'app.runtime': '実行環境',
    'app.apiBaseUrl': 'API ベース URL',
    'app.timezone': 'タイムゾーン',
    'app.followSystem': 'システムに従う',
    'app.version': 'バージョン',
    'app.noFavorites': 'お気に入りはまだありません',
    'app.pendingSync': '{count} 件の変更が同期待ちです',
  },
}

function lookupAppLocal(locale: Locale, key: string): string | null {
  if (!key.startsWith('app.')) return null
  return APP_LOCAL_MESSAGES[locale][key] ?? APP_LOCAL_MESSAGES[defaultLocale][key] ?? null
}

function isRecord(value: unknown): value is MessageTable {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 按 `a.b.c` 路径取值；任一层缺失返回 null */
function lookup(table: MessageTable, key: string): string | null {
  let cursor: unknown = table
  for (const segment of key.split('.')) {
    if (!isRecord(cursor)) return null
    cursor = cursor[segment]
  }
  return typeof cursor === 'string' ? cursor : null
}

/** `{name}` 占位替换；参数缺失时保留占位符（可见的缺口好过静默空串） */
function interpolate(template: string, params?: MessageParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined ? match : String(value)
  })
}

export interface Translator {
  readonly locale: Locale
  t(key: string, params?: MessageParams): string
  /** 同 t()，但缺失时返回 null（用于"有没有这条文案"本身就是语义的场景） */
  tOrNull(key: string): string | null
}

export function createTranslator(locale: Locale): Translator {
  return {
    locale,
    t(key, params) {
      const hit =
        lookup(TABLES[locale], key) ??
        lookup(TABLES[defaultLocale], key) ??
        lookupAppLocal(locale, key)
      return interpolate(hit ?? key, params)
    },
    tOrNull(key) {
      return lookup(TABLES[locale], key) ?? lookup(TABLES[defaultLocale], key) ?? lookupAppLocal(locale, key)
    },
  }
}

export function supportedLocales(): Locale[] {
  return [...locales]
}

/**
 * 系统语言标签 → 受支持的 Locale。
 *
 * 规则（不"猜语言"式兜底，只做确定性的标签归一）：
 *   · zh 且带 Hant / TW / HK / MO 字样 → zh-TW
 *   · 其余 zh*                        → zh-CN
 *   · ja*                             → ja
 *   · 其它                            → en
 */
export function resolveSystemLocale(languageTag: string | undefined): Locale {
  const tag = (languageTag ?? '').trim().replace(/_/g, '-')
  if (tag.length === 0) return defaultLocale
  if (isLocale(tag)) return tag

  const parts = tag.split('-')
  const primary = parts[0].toLowerCase()
  if (primary === 'zh') {
    const rest = parts.slice(1).map((part) => part.toLowerCase())
    const traditional = rest.some(
      (part) => part === 'hant' || part === 'tw' || part === 'hk' || part === 'mo',
    )
    return traditional ? 'zh-TW' : 'zh-CN'
  }
  if (primary === 'ja') return 'ja'
  return defaultLocale
}
