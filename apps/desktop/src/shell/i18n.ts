import { invoke } from '@tauri-apps/api/core'

import { errorText } from './error-text'

/**
 * 壳 UI 的语言。
 *
 * 文案本体在 `shared/messages/<locale>.json` 的 `desktop.*` 命名空间，由
 * `vite.config.ts` 在构建期抽出并注入成 `__DESKTOP_MESSAGES__` —— 只注入
 * `desktop.*` 这一棵子树，不把整份站点文案打进壳里，也不引入 i18n 运行时。
 */

/**
 * 壳 UI 支持的语言。
 *
 * **刻意不在这里写死语言数组**：直接取 `__DESKTOP_MESSAGES__` 的顶层 key，
 * 而那棵表是 `vite.config.ts` 逐个读 `shared/constants/locales.ts` 的 `locales`
 * 造出来的。写死就成了第三份语言清单 —— 另两份是 `locales.ts` 和 Rust 的
 * `src-tauri/src/locale.rs`，增删语言时必然漏掉一处。
 */
export const DESKTOP_LOCALES: readonly string[] = Object.keys(__DESKTOP_MESSAGES__)

export function isDesktopLocale(value: string): boolean {
  return DESKTOP_LOCALES.includes(value)
}

/**
 * 把 BCP-47 标签收敛到壳支持的语言；命中不了返回 `undefined`（不猜）。
 *
 * 繁体按地区/书写系统判定：`zh-TW` / `zh-HK` / `zh-MO` / `zh-Hant*` 走 zh-TW，
 * 其余 `zh*` 走 zh-CN。
 */
export function resolveLocale(tag: string): string | undefined {
  const candidate = matchLocale(tag.trim().toLowerCase().replace(/_/g, '-'))

  // 候选标签是写死的：若哪天 locales.ts 删了某个语言，这里必须返回 undefined
  // （由调用方退到产品默认语言），而不是交回一个文案表里根本不存在的 locale。
  return candidate !== undefined && isDesktopLocale(candidate) ? candidate : undefined
}

function matchLocale(normalized: string): string | undefined {
  if (
    normalized === 'zh-tw' ||
    normalized === 'zh-hk' ||
    normalized === 'zh-mo' ||
    normalized.startsWith('zh-hant')
  ) {
    return 'zh-TW'
  }

  if (normalized === 'zh' || normalized.startsWith('zh-')) {
    return 'zh-CN'
  }

  if (normalized === 'ja' || normalized.startsWith('ja-')) {
    return 'ja'
  }

  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en'
  }

  return undefined
}

/**
 * 构建期注入的产品默认语言（`shared/constants/locales.ts` 的 `defaultLocale`）。
 * vite.config.ts 已经校验过它一定在 `__DESKTOP_MESSAGES__` 里，走到这里还不合法
 * 说明注入被绕过，直接报错比悄悄换一个语言诚实。
 */
const DEFAULT_LOCALE: string = (() => {
  const injected = __DESKTOP_DEFAULT_LOCALE__

  if (!isDesktopLocale(injected)) {
    throw new Error(`注入的默认语言不在壳支持的语言里：${injected}`)
  }

  return injected
})()

/** 当前语言：按系统语言偏好逐个试，都命中不了就用产品默认语言。 */
const ACTIVE_LOCALE: string = (() => {
  const preferred =
    navigator.languages.length > 0 ? navigator.languages : [navigator.language]

  for (const tag of preferred) {
    const resolved = resolveLocale(tag)

    if (resolved !== undefined) {
      return resolved
    }
  }

  return DEFAULT_LOCALE
})()

// 让 index.html 的 lang 与壳 UI 实际渲染的语言一致（影响字体回退与读屏）。
// index.html 里写的是产品默认语言，这里按系统语言改写。
document.documentElement.lang = ACTIVE_LOCALE

export function activeLocale(): string {
  return ACTIVE_LOCALE
}

/**
 * 取一条壳 UI 文案。
 *
 * 占位符用 `{name}`，由 `params` 填充（例如 `{error}` / `{path}` / `{version}`）。
 * 查不到 key 时返回 key 本身，让漏翻在界面上显形，而不是悄悄回落到另一种语言。
 */
export function t(key: string, params?: Readonly<Record<string, string>>): string {
  const table: Readonly<Record<string, string>> | undefined = __DESKTOP_MESSAGES__[ACTIVE_LOCALE]
  const fallbackTable: Readonly<Record<string, string>> | undefined =
    __DESKTOP_MESSAGES__[DEFAULT_LOCALE]
  const template = table?.[key] ?? fallbackTable?.[key] ?? key

  if (params === undefined) {
    return template
  }

  return template.replace(/\{(\w+)\}/g, (placeholder: string, name: string) => {
    const value: string | undefined = params[name]
    return value ?? placeholder
  })
}

/**
 * 把壳 UI 选定的语言同步给外壳，让原生菜单 / 托盘 / 窗口标题 / 原生对话框跟着走。
 *
 * 原生侧在 `setup()` 里先按产品默认语言建一套菜单（那时页面还没加载），
 * 这里再按系统语言校正并重建。失败只记日志：语言不同步不该挡住用户用应用。
 */
export function syncNativeLocale(): void {
  void invoke<void>('set_locale', { locale: ACTIVE_LOCALE }).catch((error: unknown) => {
    console.error(`同步外壳语言失败：${errorText(error)}`)
  })
}
