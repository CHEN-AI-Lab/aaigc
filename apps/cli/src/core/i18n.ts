// ─────────────────────────────────────────────────────────────────────────────
// CLI i18n —— 复用 shared/messages/*.json（五端同一套文案真源）
//
// 设计取舍：
//   · 文案表全部来自 shared：错误码 = errors.<code>，工具名 = tools.<id>.name，
//     CLI 界面文案 = cli.<key>（与前者同源，受同一次四语对齐校验约束）；
//   · CLI 不再自建任何文案表 —— 过渡态的 ./cli-strings.ts 已删除；
//   · 查找缺失时回落 en，en 也没有就原样返回 key —— 绝不抛错、绝不留空串。
// ─────────────────────────────────────────────────────────────────────────────

import enMessages from 'shared/messages/en.json'
import zhCnMessages from 'shared/messages/zh-CN.json'
import zhTwMessages from 'shared/messages/zh-TW.json'
import jaMessages from 'shared/messages/ja.json'
import { defaultLocale, isLocale } from 'shared/constants/locales'
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
  /**
   * shared/messages 文案。领域文案走 `errors.<code>` / `tools.<id>.*`，
   * CLI 界面文案走 `cli.<key>` —— 同一张表、同一套查找与回落规则。
   */
  t(key: string, params?: MessageParams): string
  /** 同 t()，但缺失时返回 null（用于「有没有这条文案」本身就是语义的场景） */
  tOrNull(key: string): string | null
}

export function createTranslator(locale: Locale): Translator {
  return {
    locale,
    t(key, params) {
      const hit = lookup(TABLES[locale], key) ?? lookup(TABLES[defaultLocale], key)
      return interpolate(hit ?? key, params)
    },
    tOrNull(key) {
      return lookup(TABLES[locale], key) ?? lookup(TABLES[defaultLocale], key)
    },
  }
}

/** 解析 `--lang` / `AAIGC_LANG` 的取值；非法返回 null 由调用方转用法错误 */
export function parseLocale(value: string): Locale | null {
  const trimmed = value.trim()
  if (isLocale(trimmed)) return trimmed
  // 容忍 `zh_CN` / `ZH-cn` 这类常见写法，但不做「猜语言」的兜底
  const normalized = trimmed.replace(/_/g, '-')
  const exact = Object.keys(TABLES).find(
    (candidate) => candidate.toLowerCase() === normalized.toLowerCase(),
  )
  return exact && isLocale(exact) ? exact : null
}

/** 供 `--help` 与错误提示列出受支持语言 */
export function supportedLocales(): Locale[] {
  return Object.keys(TABLES).filter(isLocale)
}
