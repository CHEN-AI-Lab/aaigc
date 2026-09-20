// ─────────────────────────────────────────────────────────────────────────────
// Mistral 暖色主题 token —— 唯一真源（SK-7）
//
// 各端消费方式：
//   Web      → CSS 变量（--color-bg / --color-surface / ...）
//   小程序   → WXSS 变量（同名）
//   App      → RN StyleSheet 常量
//   CLI      → ANSI 色板
//
// 禁止 bg-white / bg-[#1f1f1f] / text-red-500 等硬编码颜色。
// 暗色 6 值待设计确认（架构 Q-A11），此处不编造色值 —— 仅提供 light。
// ─────────────────────────────────────────────────────────────────────────────

export const THEME_COLOR_NAMES = [
  'bg',
  'surface',
  'accent',
  'accentLight',
  'text',
  'textSecondary',
] as const

export type ThemeColorName = (typeof THEME_COLOR_NAMES)[number]

/** CSS 变量名（Web / 小程序 WXSS 共用） */
export const THEME_CSS_VARIABLES: Record<ThemeColorName, string> = {
  bg: '--color-bg',
  surface: '--color-surface',
  accent: '--color-accent',
  accentLight: '--color-accent-light',
  text: '--color-text',
  textSecondary: '--color-text-secondary',
}

/** light 主题唯一真源（Mistral 暖色） */
export const LIGHT_THEME_TOKENS: Record<ThemeColorName, string> = {
  bg: '#fffaeb',
  surface: '#fff0c2',
  accent: '#fa520f',
  accentLight: '#ffa110',
  text: '#1f1f1f',
  textSecondary: '#767d88',
}

/** theme 模式的稳定枚举（供 ThemeSwitcher / 各端设置页复用） */
export const THEME_MODES = ['light', 'dark', 'system'] as const
export type ThemeMode = (typeof THEME_MODES)[number]

export const DEFAULT_THEME_MODE: ThemeMode = 'system'

/** 生成 CSS 变量声明块（供 Web 全局样式与各端初始化复用） */
export function themeCssDeclarations(tokens: Record<ThemeColorName, string> = LIGHT_THEME_TOKENS): string {
  return THEME_COLOR_NAMES.map((name) => `${THEME_CSS_VARIABLES[name]}: ${tokens[name]};`).join('\n')
}

/** CLI ANSI 256 色近似（不引入颜色库，保持零依赖） */
export const THEME_ANSI: Record<ThemeColorName, number> = {
  bg: 230,
  surface: 223,
  accent: 202,
  accentLight: 214,
  text: 235,
  textSecondary: 243,
}
