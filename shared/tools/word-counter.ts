// word-counter —— T1 纯计算：字符 / 词 / 行 / CJK 统计

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolOk, readString } from './common'

export interface WordCounterInput {
  text: string
}

export interface WordCounterOutput {
  chars: number
  charsNoSpace: number
  words: number
  lines: number
  cjk: number
}

const CJK_RE = /[一-鿿㐀-䶿豈-﫿]/g

export function parseWordCounter(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<WordCounterInput> {
  return toolOk({ text: readString(raw, 'text') ?? '' })
}

export function runWordCounter(input: WordCounterInput, _ctx: ToolContext): ToolOutcome<WordCounterOutput> {
  const text = input.text
  return toolOk({
    chars: text.length,
    charsNoSpace: text.replace(/\s/g, '').length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text ? text.split('\n').length : 0,
    cjk: (text.match(CJK_RE) || []).length,
  })
}

export function renderWordCounter(out: WordCounterOutput, _ctx: ToolContext): string {
  return [
    `characters\t${out.chars}`,
    `noSpace\t${out.charsNoSpace}`,
    `words\t${out.words}`,
    `lines\t${out.lines}`,
    `cjk\t${out.cjk}`,
  ].join('\n')
}

export const wordCounterTool: ToolDefinition<WordCounterInput, WordCounterOutput> = {
  id: 'word-counter',
  tier: 'T1',
  capabilities: [],
  inputs: [{ name: 'text', kind: 'textarea', required: true, labelKey: 'tools.typeOrPasteText' }],
  parse: parseWordCounter,
  run: runWordCounter,
  render: renderWordCounter,
}
