// json-formatter —— T1 纯计算：JSON 格式化 / 压缩 / 校验

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { errorDetail, toolFail, toolOk, readEnum, readInt, readString, clampInt } from './common'

export type JsonFormatterMode = 'format' | 'minify' | 'validate'

export interface JsonFormatterInput {
  text: string
  mode: JsonFormatterMode
  indent: number
}

export interface JsonFormatterOutput {
  text: string
  valid: boolean
  bytes: number
}

const MODES: readonly JsonFormatterMode[] = ['format', 'minify', 'validate']

export function parseJsonFormatter(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<JsonFormatterInput> {
  const text = readString(raw, 'text')
  if (text === null || text.trim().length === 0) {
    return toolFail('emptyInput', 'tools.emptyInput')
  }
  return toolOk({
    text,
    mode: readEnum(raw, 'mode', MODES, 'format'),
    indent: clampInt(readInt(raw, 'indent', 2), 1, 8),
  })
}

export function runJsonFormatter(
  input: JsonFormatterInput,
  _ctx: ToolContext,
): ToolOutcome<JsonFormatterOutput> {
  let parsed: unknown
  try {
    parsed = JSON.parse(input.text)
  } catch (caught) {
    // 引擎原始报错经 detail 透出，端侧作为次要文案附在 t('invalidJson') 之后
    return toolFail('invalidJson', 'tools.invalidJson', undefined, errorDetail(caught))
  }

  if (input.mode === 'validate') {
    return toolOk({ text: '', valid: true, bytes: input.text.length })
  }

  const text =
    input.mode === 'minify'
      ? JSON.stringify(parsed)
      : JSON.stringify(parsed, null, input.indent)
  return toolOk({ text, valid: true, bytes: text.length })
}

export function renderJsonFormatter(out: JsonFormatterOutput, _ctx: ToolContext): string {
  return out.text
}

export const jsonFormatterTool: ToolDefinition<JsonFormatterInput, JsonFormatterOutput> = {
  id: 'json-formatter',
  tier: 'T1',
  capabilities: [],
  inputs: [
    { name: 'text', kind: 'textarea', required: true, labelKey: 'tools.input', placeholderKey: 'tools.jsonPlaceholder' },
    {
      name: 'mode',
      kind: 'select',
      required: false,
      labelKey: 'tools.mode',
      default: 'format',
      options: [
        { value: 'format', labelKey: 'tools.format' },
        { value: 'minify', labelKey: 'tools.minify' },
        { value: 'validate', labelKey: 'tools.validate' },
      ],
    },
    { name: 'indent', kind: 'number', required: false, labelKey: 'tools.indent', default: 2 },
  ],
  parse: parseJsonFormatter,
  run: runJsonFormatter,
  render: renderJsonFormatter,
}
