// base64 —— T1 纯计算：Unicode 安全的 Base64 编解码

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolFail, toolOk, readEnum, readString, base64ToText, textToBase64 } from './common'

export type Base64Mode = 'encode' | 'decode'

export interface Base64Input {
  text: string
  mode: Base64Mode
}

export interface Base64Output {
  text: string
}

const MODES: readonly Base64Mode[] = ['encode', 'decode']

export function parseBase64(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<Base64Input> {
  const text = readString(raw, 'text')
  if (text === null || text.length === 0) {
    return toolOk({ text: '', mode: readEnum(raw, 'mode', MODES, 'encode') })
  }
  return toolOk({ text, mode: readEnum(raw, 'mode', MODES, 'encode') })
}

export function runBase64(input: Base64Input, _ctx: ToolContext): ToolOutcome<Base64Output> {
  if (input.text.length === 0) return toolOk({ text: '' })
  if (input.mode === 'encode') {
    return toolOk({ text: textToBase64(input.text) })
  }
  const decoded = base64ToText(input.text)
  if (decoded === null) return toolFail('invalidBase64', 'tools.invalidBase64')
  return toolOk({ text: decoded })
}

export function renderBase64(out: Base64Output, _ctx: ToolContext): string {
  return out.text
}

export const base64Tool: ToolDefinition<Base64Input, Base64Output> = {
  id: 'base64',
  tier: 'T1',
  capabilities: [],
  inputs: [
    { name: 'text', kind: 'textarea', required: true, labelKey: 'tools.enterText' },
    {
      name: 'mode',
      kind: 'select',
      required: false,
      labelKey: 'tools.mode',
      default: 'encode',
      options: [
        { value: 'encode', labelKey: 'tools.encode' },
        { value: 'decode', labelKey: 'tools.decode' },
      ],
    },
  ],
  parse: parseBase64,
  run: runBase64,
  render: renderBase64,
}
