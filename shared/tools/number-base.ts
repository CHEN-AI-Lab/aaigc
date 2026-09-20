// number-base —— T1 纯计算：2/8/10/16 进制互转

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolFail, toolOk, readInt, readString, clampInt } from './common'

export interface NumberBaseInput {
  value: string
  fromBase: number
}

export interface NumberBaseEntry {
  base: number
  label: 'BIN' | 'OCT' | 'DEC' | 'HEX'
  value: string
}

export interface NumberBaseOutput {
  decimal: number
  values: NumberBaseEntry[]
}

const BASES: readonly { base: number; label: 'BIN' | 'OCT' | 'DEC' | 'HEX' }[] = [
  { base: 2, label: 'BIN' },
  { base: 8, label: 'OCT' },
  { base: 10, label: 'DEC' },
  { base: 16, label: 'HEX' },
]

export function parseNumberBase(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<NumberBaseInput> {
  const value = (readString(raw, 'value') ?? '').trim()
  if (value.length === 0) return toolFail('emptyInput', 'tools.emptyInput')
  return toolOk({ value, fromBase: clampInt(readInt(raw, 'fromBase', 10), 2, 16) })
}

export function runNumberBase(input: NumberBaseInput, _ctx: ToolContext): ToolOutcome<NumberBaseOutput> {
  const decimal = Number.parseInt(input.value, input.fromBase)
  if (Number.isNaN(decimal)) return toolFail('invalidNumber', 'tools.invalidNumber')
  return toolOk({
    decimal,
    values: BASES.map(({ base, label }) => ({
      base,
      label,
      value: decimal.toString(base).toUpperCase(),
    })),
  })
}

export function renderNumberBase(out: NumberBaseOutput, _ctx: ToolContext): string {
  return out.values.map((entry) => `${entry.label}\t${entry.value}`).join('\n')
}

export const numberBaseTool: ToolDefinition<NumberBaseInput, NumberBaseOutput> = {
  id: 'number-base',
  tier: 'T1',
  capabilities: [],
  inputs: [
    { name: 'value', kind: 'text', required: true, labelKey: 'tools.enterNumber' },
    {
      name: 'fromBase',
      kind: 'select',
      required: false,
      labelKey: 'tools.fromBase',
      default: 10,
      options: [
        { value: '2', labelKey: 'tools.base2' },
        { value: '8', labelKey: 'tools.base8' },
        { value: '10', labelKey: 'tools.base10' },
        { value: '16', labelKey: 'tools.base16' },
      ],
    },
  ],
  parse: parseNumberBase,
  run: runNumberBase,
  render: renderNumberBase,
}
