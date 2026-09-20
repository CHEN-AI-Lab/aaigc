// ─────────────────────────────────────────────────────────────────────────────
// ANSI 着色 —— 色值来自 shared/constants/theme.ts 的 THEME_ANSI（CLI 专用色板）
//
// 不在 CLI 里写死颜色码（SK-7）：CLI 只把主题 token 转成 256 色前景序列。
// ─────────────────────────────────────────────────────────────────────────────

import { THEME_ANSI } from 'shared/constants/theme'

/** 终端里用得到的主题 token 子集（bg/surface 是背景色，CLI 不用） */
export type AnsiRole = 'accent' | 'accentLight' | 'textSecondary'

const FG_PREFIX = '\u001b[38;5;'
const RESET = '\u001b[0m'

/** ANSI 序列匹配（仅处理 SGR：ESC [ 数字;数字 m） */
const ANSI_PATTERN = /\u001b\[[0-9;]*m/g

export function paint(role: AnsiRole, text: string, enabled: boolean): string {
  if (!enabled || text.length === 0) return text
  return `${FG_PREFIX}${THEME_ANSI[role]}m${text}${RESET}`
}

/** 算终端列宽前必须先剥掉 ANSI，否则转义序列会被当成可见字符 */
export function stripAnsi(text: string): string {
  return text.replace(ANSI_PATTERN, '')
}
