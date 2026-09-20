// url-encode —— T1 纯计算：URL 百分号编解码

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolFail, toolOk, readEnum, readString } from './common'

export type UrlEncodeMode = 'encode' | 'decode'

export interface UrlEncodeInput {
  text: string
  mode: UrlEncodeMode
}

export interface UrlEncodeOutput {
  text: string
}

const MODES: readonly UrlEncodeMode[] = ['encode', 'decode']

export function parseUrlEncode(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<UrlEncodeInput> {
  const text = readString(raw, 'text') ?? ''
  return toolOk({ text, mode: readEnum(raw, 'mode', MODES, 'encode') })
}

export function runUrlEncode(input: UrlEncodeInput, _ctx: ToolContext): ToolOutcome<UrlEncodeOutput> {
  try {
    if (input.mode === 'encode') {
      return toolOk({ text: encodeURIComponent(input.text) })
    }
    return toolOk({ text: decodeURIComponent(input.text) })
  } catch {
    return toolFail('invalidUrl', 'tools.invalidUrl')
  }
}

export function renderUrlEncode(out: UrlEncodeOutput, _ctx: ToolContext): string {
  return out.text
}

export const urlEncodeTool: ToolDefinition<UrlEncodeInput, UrlEncodeOutput> = {
  id: 'url-encode',
  tier: 'T1',
  capabilities: [],
  inputs: [
    { name: 'text', kind: 'textarea', required: true, labelKey: 'tools.enterUrl' },
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
  parse: parseUrlEncode,
  run: runUrlEncode,
  render: renderUrlEncode,
}
