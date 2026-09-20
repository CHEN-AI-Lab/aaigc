// text-diff —— T1 纯计算：按行 LCS 差异比较（零 npm 依赖，与 diff 库输出语义一致）

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolOk, readString } from './common'

export interface TextDiffInput {
  left: string
  right: string
}

export type DiffPartType = 'equal' | 'added' | 'removed'

export interface DiffPart {
  type: DiffPartType
  value: string
  lines: number
}

export interface TextDiffOutput {
  parts: DiffPart[]
  addedLines: number
  removedLines: number
  totalLines: number
}

/** 按行切分并保留换行符，与 diff.diffLines 的 token 粒度一致 */
export function splitLines(text: string): string[] {
  if (text.length === 0) return []
  const matches = text.match(/[^\n]*\n|[^\n]+$/g)
  return matches ?? []
}

/** 最长公共子序列（行级），返回 LCS 长度表 */
function lcsTable(a: string[], b: string[]): number[][] {
  const table: number[][] = []
  for (let i = 0; i <= a.length; i++) {
    table.push(new Array<number>(b.length + 1).fill(0))
  }
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }
  return table
}

/** 行级差异（added = 仅在右侧，removed = 仅在左侧） */
export function diffLines(left: string, right: string): DiffPart[] {
  const a = splitLines(left)
  const b = splitLines(right)
  const table = lcsTable(a, b)

  const parts: DiffPart[] = []
  const push = (type: DiffPartType, value: string): void => {
    const last = parts[parts.length - 1]
    if (last && last.type === type) {
      last.value += value
      last.lines += 1
      return
    }
    parts.push({ type, value, lines: 1 })
  }

  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push('equal', a[i])
      i++
      j++
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      push('removed', a[i])
      i++
    } else {
      push('added', b[j])
      j++
    }
  }
  while (i < a.length) {
    push('removed', a[i])
    i++
  }
  while (j < b.length) {
    push('added', b[j])
    j++
  }
  return parts
}

export function parseTextDiff(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<TextDiffInput> {
  return toolOk({ left: readString(raw, 'left') ?? '', right: readString(raw, 'right') ?? '' })
}

export function runTextDiff(input: TextDiffInput, _ctx: ToolContext): ToolOutcome<TextDiffOutput> {
  const parts = diffLines(input.left, input.right)
  let addedLines = 0
  let removedLines = 0
  for (const part of parts) {
    if (part.type === 'added') addedLines += part.lines
    if (part.type === 'removed') removedLines += part.lines
  }
  return toolOk({
    parts,
    addedLines,
    removedLines,
    totalLines: Math.max(splitLines(input.left).length, splitLines(input.right).length),
  })
}

/** 纯文本渲染：+/-/空格 前缀，供 CLI 与小程序兜底 */
export function renderTextDiff(out: TextDiffOutput, _ctx: ToolContext): string {
  return out.parts
    .map((part) => {
      const marker = part.type === 'added' ? '+' : part.type === 'removed' ? '-' : ' '
      return part.value
        .split('\n')
        .filter((line, index, arr) => !(index === arr.length - 1 && line === ''))
        .map((line) => `${marker}${line}`)
        .join('\n')
    })
    .join('\n')
}

export const textDiffTool: ToolDefinition<TextDiffInput, TextDiffOutput> = {
  id: 'text-diff',
  tier: 'T1',
  capabilities: [],
  inputs: [
    { name: 'left', kind: 'textarea', required: true, labelKey: 'tools.originalText' },
    { name: 'right', kind: 'textarea', required: true, labelKey: 'tools.modifiedText' },
  ],
  parse: parseTextDiff,
  run: runTextDiff,
  render: renderTextDiff,
}
