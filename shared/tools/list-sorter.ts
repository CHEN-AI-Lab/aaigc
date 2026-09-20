// list-sorter —— T1 纯计算：行排序 / 去重 / 洗牌（洗牌随机源经 ToolContext 注入）

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { RandomSource, toolOk, readEnum, readString } from './common'

export type ListSorterMode = 'asc' | 'desc' | 'unique' | 'shuffle'

export interface ListSorterInput {
  text: string
  mode: ListSorterMode
}

export interface ListSorterOutput {
  text: string
  lines: number
}

const MODES: readonly ListSorterMode[] = ['asc', 'desc', 'unique', 'shuffle']

export function parseListSorter(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<ListSorterInput> {
  return toolOk({
    text: readString(raw, 'text') ?? '',
    mode: readEnum(raw, 'mode', MODES, 'asc'),
  })
}

export function runListSorter(input: ListSorterInput, ctx: ToolContext): ToolOutcome<ListSorterOutput> {
  const lines = input.text.split('\n')
  switch (input.mode) {
    case 'asc':
      lines.sort((a, b) => a.localeCompare(b))
      break
    case 'desc':
      lines.sort((a, b) => b.localeCompare(a))
      break
    case 'unique':
      return toolOk({ text: [...new Set(lines)].join('\n'), lines: new Set(lines).size })
    case 'shuffle':
      new RandomSource(ctx).shuffle(lines)
      break
  }
  return toolOk({ text: lines.join('\n'), lines: lines.length })
}

export function renderListSorter(out: ListSorterOutput, _ctx: ToolContext): string {
  return out.text
}

export const listSorterTool: ToolDefinition<ListSorterInput, ListSorterOutput> = {
  id: 'list-sorter',
  tier: 'T1',
  capabilities: [],
  inputs: [
    { name: 'text', kind: 'textarea', required: true, labelKey: 'tools.enterText' },
    {
      name: 'mode',
      kind: 'select',
      required: false,
      labelKey: 'tools.mode',
      default: 'asc',
      options: [
        { value: 'asc', labelKey: 'tools.sortAsc' },
        { value: 'desc', labelKey: 'tools.sortDesc' },
        { value: 'unique', labelKey: 'tools.dedup' },
        { value: 'shuffle', labelKey: 'tools.shuffle' },
      ],
    },
  ],
  parse: parseListSorter,
  run: runListSorter,
  render: renderListSorter,
}
