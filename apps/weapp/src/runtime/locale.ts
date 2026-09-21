// ─────────────────────────────────────────────────────────────────────────────
// Locale：取值集合直接复用 shared/constants/locales.ts（唯一真源），
// 这里只补两件端侧的事：系统语言识别、用户手选的持久化。
// ─────────────────────────────────────────────────────────────────────────────

import Taro from '@tarojs/taro'

import { defaultLocale, isLocale, localeNames, locales } from 'shared/constants/locales'
// ⚠️ Locale 类型定义在 shared/types，不在 shared/constants/locales ——
//    locales.ts 只是 import 了它，没有 re-export。
import type { Locale } from 'shared/types'

export { defaultLocale, isLocale, localeNames, locales }
export type { Locale }

const STORAGE_KEY = 'aaigc.weapp.locale'

/**
 * 系统语言标签 → 受支持的 Locale。
 *
 * 与 apps/app 的 resolveSystemLocale 同一套规则（不"猜语言"式兜底，只做确定性归一）：
 *   · zh 且带 Hant / TW / HK / MO → zh-TW
 *   · 其余 zh*                     → zh-CN
 *   · ja*                          → ja
 *   · 其它                         → en（shared 的 defaultLocale）
 */
export function resolveSystemLocale(languageTag: string | undefined): Locale {
  const tag = (languageTag ?? '').trim().replace(/_/g, '-')
  if (tag.length === 0) return defaultLocale
  if (isLocale(tag)) return tag

  const parts = tag.split('-')
  const primary = parts[0].toLowerCase()
  if (primary === 'zh') {
    const traditional = parts
      .slice(1)
      .map((part) => part.toLowerCase())
      .some((part) => part === 'hant' || part === 'tw' || part === 'hk' || part === 'mo')
    return traditional ? 'zh-TW' : 'zh-CN'
  }
  if (primary === 'ja') return 'ja'
  return defaultLocale
}

/** 读取小程序宿主语言。取不到就按 defaultLocale，不编造。 */
export function detectSystemLocale(): Locale {
  try {
    const info = Taro.getSystemInfoSync()
    return resolveSystemLocale(info.language)
  } catch {
    return defaultLocale
  }
}

/** 用户手选的语言（未选过返回 null —— "没选过"与"选了默认值"是两种状态） */
export function readStoredLocale(): Locale | null {
  try {
    const value = Taro.getStorageSync(STORAGE_KEY)
    return typeof value === 'string' && isLocale(value) ? value : null
  } catch {
    return null
  }
}

export function writeStoredLocale(locale: Locale): void {
  try {
    Taro.setStorageSync(STORAGE_KEY, locale)
  } catch {
    // 存储写失败不应阻断切换（本次会话仍然生效）
  }
}

/** 当前应生效的 locale：手选优先，否则跟随系统 */
export function initialLocale(): Locale {
  return readStoredLocale() ?? detectSystemLocale()
}
