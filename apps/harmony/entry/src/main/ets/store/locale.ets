// 全局 AppStorage —— Locale 持久化
//
// ArkUI 没有 React Context，但有 AppStorage + PersistentStorage 全局 KV。
// 这里把 Locale 放到 PersistentStorage 持久化（关闭 App 后保留）。

import type { Locale } from 'shared/types'
import { defaultLocale, locales, isLocale } from 'shared/constants/locales'

const KEY = 'aaigc_locale'

export function initLocale() {
  // 持久化绑定（App 启动时）
  PersistentStorage.persistProp<Locale>(KEY, defaultLocale as Locale)

  // 验证当前值是否合法（防御旧版本遗留的非法值）
  const current = AppStorage.get<Locale>(KEY)
  if (!isLocale(current as string)) {
    AppStorage.set<Locale>(KEY, defaultLocale as Locale)
  }
}

export function getLocale(): Locale {
  return AppStorage.get<Locale>(KEY) ?? (defaultLocale as Locale)
}

export function setLocale(next: Locale) {
  if (!isLocale(next)) return
  AppStorage.set<Locale>(KEY, next)
}

export { locales }
export type { Locale }