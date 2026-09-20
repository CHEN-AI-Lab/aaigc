// ─────────────────────────────────────────────────────────────────────────────
// RN 视觉 token —— 颜色一律取自 shared/constants/theme.ts 的唯一真源（SK-7）
//
// 这里**不定义任何色值**：Web 用 CSS 变量、小程序用 WXSS 变量、App 用这份
// StyleSheet 常量，三端同源。间距/圆角是 App 侧排版参数，不属于主题色。
// ─────────────────────────────────────────────────────────────────────────────

import { Platform } from 'react-native'
import { LIGHT_THEME_TOKENS, type ThemeColorName } from 'shared/constants/theme'

export const colors: Record<ThemeColorName, string> = LIGHT_THEME_TOKENS

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
} as const

export const fontSize = {
  caption: 12,
  body: 14,
  title: 16,
  heading: 20,
  display: 26,
} as const

/** 结果 / 代码块用的等宽字体（各平台自带，不引入字体资源） */
export const monospaceFontFamily: string =
  Platform.select({ ios: 'Menlo', default: 'monospace' }) ?? 'monospace'
