// ─────────────────────────────────────────────────────────────────────────────
// i18n 运行时
//
// 与 apps/cli/src/core/i18n.ts、apps/app/src/i18n/translator.ts 同一套查找规则：
//   · 按 `a.b.c` 点分路径取值
//   · 当前语言缺失 → 回落 defaultLocale（en）
//   · en 也没有 → **原样返回 key**（绝不抛错、绝不留空串）
//   · `{name}` 占位替换，参数缺失时保留占位符（可见的缺口好过静默空串）
//
// 端内**不保留任何本地兜底文案表**：本地表会把「shared 缺 key」这种必须暴露的
// 问题盖掉（scripts/check-i18n-hardcode.py 同样禁止端内自建文案表）。
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, createElement, useCallback, useContext, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'

import { fallbackTable, tableFor } from './messages'
import {
  initialLocale,
  localeNames,
  locales,
  readStoredLocale,
  writeStoredLocale,
  type Locale,
} from './locale'

export type MessageParams = Record<string, string | number>

type Table = Record<string, unknown>

function isRecord(value: unknown): value is Table {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 按 `a.b.c` 路径取值；任一层缺失返回 null */
function lookup(table: Table, key: string): string | null {
  let cursor: unknown = table
  for (const segment of key.split('.')) {
    if (!isRecord(cursor)) return null
    cursor = cursor[segment]
  }
  return typeof cursor === 'string' ? cursor : null
}

/** `{name}` 占位替换；参数缺失时保留占位符 */
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
  const table = tableFor(locale)
  const fallback = fallbackTable()
  return {
    locale,
    t(key, params) {
      const hit = lookup(table, key) ?? lookup(fallback, key)
      return interpolate(hit ?? key, params)
    },
    tOrNull(key) {
      return lookup(table, key) ?? lookup(fallback, key)
    },
  }
}

/**
 * 取工具名/描述。
 *
 * shared/messages 的 `tools.<toolId>` 有两种形状：多数是 `{ name, description }`，
 * 个别（如 timestamp）是裸字符串。两种都要能吃。
 */
export function toolLabel(
  t: Translator,
  toolId: string,
  field: 'name' | 'description',
): string | null {
  const direct = t.tOrNull(`tools.${toolId}.${field}`)
  if (direct !== null) return direct
  if (field === 'name') return t.tOrNull(`tools.${toolId}`)
  return null
}

// ─── React 绑定 ─────────────────────────────────────────────────────────────

export interface I18nValue {
  locale: Locale
  t: Translator['t']
  tOrNull: Translator['tOrNull']
  translator: Translator
  setLocale(locale: Locale): void
  supportedLocales: readonly Locale[]
  localeNames: Record<Locale, string>
  /** 是否正在跟随系统（没手选过） */
  followingSystem: boolean
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale())
  // 「没手选过」与「手选了恰好等于默认值」是两种状态，用存储里有没有值来区分
  const [followingSystem, setFollowingSystem] = useState<boolean>(() => readStoredLocale() === null)

  const setLocale = useCallback((next: Locale) => {
    writeStoredLocale(next)
    setFollowingSystem(false)
    setLocaleState(next)
  }, [])

  const value = useMemo<I18nValue>(() => {
    const translator = createTranslator(locale)
    return {
      locale,
      t: translator.t,
      tOrNull: translator.tOrNull,
      translator,
      setLocale,
      supportedLocales: locales,
      localeNames,
      followingSystem,
    }
  }, [locale, setLocale, followingSystem])

  return createElement(I18nContext.Provider, { value }, children)
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (value === null) {
    throw new Error('useI18n 必须在 I18nProvider 内使用')
  }
  return value
}
