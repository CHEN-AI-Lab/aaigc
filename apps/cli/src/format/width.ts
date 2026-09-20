// ─────────────────────────────────────────────────────────────────────────────
// 终端列宽 —— CJK 对齐的唯一依据
//
// `String.prototype.length` 数的是 UTF-16 code unit，中日韩字符与全角标点在终端里
// 占 2 列、组合符号占 0 列，直接用 length 对齐会让 `--lang zh-CN` 的表格错位。
// 这里按 Unicode East Asian Width 的常用区间做判定，不引入任何依赖。
// ─────────────────────────────────────────────────────────────────────────────

import { stripAnsi } from './ansi'

interface CodePointRange {
  from: number
  to: number
}

/** East Asian Wide / Fullwidth（终端占 2 列） */
const WIDE_RANGES: readonly CodePointRange[] = [
  { from: 0x1100, to: 0x115f }, // Hangul Jamo
  { from: 0x2e80, to: 0x303e }, // CJK 部首 / 康熙部首 / 中日韩符号
  { from: 0x3041, to: 0x33ff }, // 平假名 / 片假名 / 注音 / 中日韩兼容
  { from: 0x3400, to: 0x4dbf }, // CJK 扩展 A
  { from: 0x4e00, to: 0x9fff }, // CJK 基本区
  { from: 0xa000, to: 0xa4cf }, // 彝文
  { from: 0xa960, to: 0xa97f }, // Hangul Jamo 扩展 A
  { from: 0xac00, to: 0xd7a3 }, // Hangul 音节
  { from: 0xf900, to: 0xfaff }, // CJK 兼容表意
  { from: 0xfe10, to: 0xfe19 }, // 竖排标点
  { from: 0xfe30, to: 0xfe6f }, // CJK 兼容形式
  { from: 0xff00, to: 0xff60 }, // 全角 ASCII
  { from: 0xffe0, to: 0xffe6 }, // 全角符号
  { from: 0x1f300, to: 0x1f64f }, // Emoji
  { from: 0x1f900, to: 0x1f9ff }, // Emoji 补充
  { from: 0x20000, to: 0x3fffd }, // CJK 扩展 B 及以上
]

/** 零宽（组合符号 / 变体选择符 / 零宽连接符 / BOM） */
const ZERO_WIDTH_RANGES: readonly CodePointRange[] = [
  { from: 0x0300, to: 0x036f },
  { from: 0x200b, to: 0x200f },
  { from: 0xfe00, to: 0xfe0f },
  { from: 0xfeff, to: 0xfeff },
]

function inRanges(codePoint: number, ranges: readonly CodePointRange[]): boolean {
  for (const range of ranges) {
    if (codePoint >= range.from && codePoint <= range.to) return true
  }
  return false
}

/** 单个码点的终端列宽 */
export function charWidth(codePoint: number): number {
  if (codePoint < 0x20 || codePoint === 0x7f) return 0
  if (inRanges(codePoint, ZERO_WIDTH_RANGES)) return 0
  if (inRanges(codePoint, WIDE_RANGES)) return 2
  return 1
}

/** 字符串的终端列宽（先剥 ANSI，再按码点累加） */
export function displayWidth(text: string): number {
  let width = 0
  for (const char of stripAnsi(text)) {
    width += charWidth(char.codePointAt(0) ?? 0)
  }
  return width
}

/** 按终端列宽右侧补空格（已达标则原样返回） */
export function padEndWidth(text: string, width: number): string {
  const gap = width - displayWidth(text)
  return gap > 0 ? text + ' '.repeat(gap) : text
}

/** 按终端列宽截断，超长时以 `…` 收尾 */
export function truncateWidth(text: string, maxWidth: number): string {
  if (displayWidth(text) <= maxWidth) return text
  const ellipsisWidth = 1
  let width = 0
  let out = ''
  for (const char of stripAnsi(text)) {
    const next = width + charWidth(char.codePointAt(0) ?? 0)
    if (next > maxWidth - ellipsisWidth) break
    out += char
    width = next
  }
  return `${out}…`
}
