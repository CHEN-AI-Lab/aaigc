// AAIGC 主题色 —— 与 web/iOS/App 对齐 Mistral 暖色调
// 参考 CLAUDE.md → Design System

export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeColors {
  bg: string
  surface: string
  surfaceAlt: string
  accent: string
  accentLight: string
  text: string
  textSecondary: string
  border: string
}

export const lightTheme: ThemeColors = {
  bg: '#fffaeb',
  surface: '#fff0c2',
  surfaceAlt: '#fff8e1',
  accent: '#fa520f',
  accentLight: '#ffa110',
  text: '#1f1f1f',
  textSecondary: '#767d88',
  border: '#e8d8a0',
}

export const darkTheme: ThemeColors = {
  bg: '#1a1612',
  surface: '#2a2520',
  surfaceAlt: '#352e27',
  accent: '#ff7a3d',
  accentLight: '#ffc04d',
  text: '#f5f5f5',
  textSecondary: '#a0a0a0',
  border: '#3d352d',
}

export function getTheme(mode: ThemeMode = 'light'): ThemeColors {
  if (mode === 'system') {
    // ⚠️ ArkTS 没有 navigator.mediaQuery；用 ConfigurationConstant 替代
    // 真实场景：import configuration from '@ohos.app.ability.configuration'
    // const colorMode = this.context.config.colorMode
    // 这里简化：默认用 light（暗色模式用户在设置面板手动切换）
    return lightTheme
  }
  return mode === 'dark' ? darkTheme : lightTheme
}

/** ThemeManager —— 持久化 + 订阅模式 */
import type { common } from '@kit.AbilityKit'
import preferences from '@ohos.data.preferences'

const THEME_STORE = 'aaigc_theme'
const THEME_KEY = 'theme_mode'

let themeInstance: preferences.Preferences | null = null

async function getThemePrefs(): Promise<preferences.Preferences | null> {
  if (themeInstance) return themeInstance
  const ctx = AppStorage.get<common.UIAbilityContext>('aaigc_context')
  if (!ctx) return null
  themeInstance = await preferences.getPreferences(ctx, THEME_STORE)
  return themeInstance
}

const listeners = new Set<(mode: ThemeMode) => void>()

/** 初始化（在 EntryAbility.onCreate 调用） */
export async function initTheme(): Promise<void> {
  // 用 PersistentStorage 持久化（不需要 preferences 的异步 API）
  PersistentStorage.persistProp<ThemeMode>('aaigc_theme_mode', 'light')
}

/** 读当前主题模式 */
export function getThemeMode(): ThemeMode {
  return AppStorage.get<ThemeMode>('aaigc_theme_mode') ?? 'light'
}

/** 设置主题模式 */
export async function setThemeMode(mode: ThemeMode): Promise<void> {
  if (mode !== 'light' && mode !== 'dark' && mode !== 'system') return
  AppStorage.set<ThemeMode>('aaigc_theme_mode', mode)
  // 异步持久化到 preferences（额外备份）
  try {
    const prefs = await getThemePrefs()
    if (prefs) {
      await prefs.put(THEME_KEY, mode)
      await prefs.flush()
    }
  } catch {
    // 静默失败 —— PersistentStorage 已经做了持久化
  }
  listeners.forEach(fn => {
    try { fn(mode) } catch { /* ignore */ }
  })
}

/** 订阅主题变更 */
export function onThemeChange(fn: (mode: ThemeMode) => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

/** 切换 light ↔ dark */
export async function toggleTheme(): Promise<ThemeMode> {
  const current = getThemeMode()
  const next: ThemeMode = current === 'dark' ? 'light' : 'dark'
  await setThemeMode(next)
  return next
}