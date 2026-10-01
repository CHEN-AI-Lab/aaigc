// AAIGC HarmonyOS 端 —— i18n 系统
//
// 设计要点：
//   1. shared/messages/<locale>.json 是唯一真源（4 语言：en / zh-CN / zh-TW / ja）
//   2. shared/js/messages/<locale>/<ns>.json 是构建期切片产物（scripts/build-shared-messages.mjs 生成）
//   3. ohpm 不能直接 import JSON 文件 —— 用 build hook 在 hvigor 阶段把 JSON 内联为 ArkTS 字面量
//   4. 当前骨架用 **运行时 inline 注入**（scripts/build-shvigor-hook.mjs），
//      真实场景可以换成 hvigor plugin 注入 __AAIGC_HARMONY_MESSAGES__ 常量
//
// 调用：t('common', 'tools') → "Tools" / "工具" / "工具" / "ツール"

import type { Locale } from 'shared/types'
import { defaultLocale, locales } from 'shared/constants/locales'

// MessagesBundle 类型：与 shared/messages 的 namespace 结构对齐
// ⚠️ 这里**故意**用宽松 Record<string, string>，因为 namespace 嵌套深度不一致（部分 key 嵌套对象）
export type MessagesBundle = Record<string, Record<string, string>>

// 构建期注入（由 apps/harmony/scripts/build-hvigor-hook.mjs 生成 entry/src/main/ets/generated/messages.generated.ets）
// 当该文件不存在时降级到 empty bundle —— 所有 key 走 fallback 路径
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const AAIGC_MESSAGES: Record<Locale, MessagesBundle> | undefined

// 加载 bundle：优先用构建期注入，降级到运行时 fetch（未实现）
function loadBundle(locale: Locale): MessagesBundle {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return AAIGC_MESSAGES?.[locale] ?? {}
}

/**
 * 翻译函数
 * @param ns namespace（"common" | "home" | "products" | "tools" | ...）
 * @param key namespace 内的 key
 * @param locale 当前语言（默认 fallback 到 en）
 * @returns 翻译结果；找不到时返回 `${ns}.${key}` 作为显式标记
 */
export function t(ns: string, key: string, locale: Locale = defaultLocale as Locale): string {
  const bundle = loadBundle(locale)
  const value = bundle[ns]?.[key]
  if (value !== undefined) return value

  // 降级到 en
  if (locale !== defaultLocale) {
    const fallback = loadBundle(defaultLocale as Locale)
    const fbValue = fallback[ns]?.[key]
    if (fbValue !== undefined) return fbValue
  }

  return `${ns}.${key}`
}

/**
 * 嵌套 key 翻译（点分路径）
 * 例：tPath('products.cookmate.name') → "CookMate" / "CookMate" / "CookMate" / "CookMate"
 */
export function tPath(path: string, locale: Locale = defaultLocale as Locale): string {
  const segments = path.split('.')
  const ns = segments[0]
  const key = segments.slice(1).join('.')
  return t(ns, key, locale)
}

export { locales }
export type { Locale }