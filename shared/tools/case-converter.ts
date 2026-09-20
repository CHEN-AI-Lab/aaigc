// case-converter —— T1 纯计算：大小写 / 命名风格转换

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolOk, readEnum, readString } from './common'

export type CaseStyle = 'upper' | 'lower' | 'title' | 'camel' | 'snake'

export interface CaseConverterInput {
  text: string
  style: CaseStyle
}

export interface CaseConverterOutput {
  text: string
}

const STYLES: readonly CaseStyle[] = ['upper', 'lower', 'title', 'camel', 'snake']

export function toTitleCase(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase())
}

export function toCamelCase(text: string): string {
  return text.replace(/[^a-zA-Z0-9]+(.)/g, (_match, c: string) => c.toUpperCase())
}

export function toSnakeCase(text: string): string {
  return text.replace(/\s+/g, '_').toLowerCase()
}

export function convertCase(text: string, style: CaseStyle): string {
  switch (style) {
    case 'upper':
      return text.toUpperCase()
    case 'lower':
      return text.toLowerCase()
    case 'title':
      return toTitleCase(text)
    case 'camel':
      return toCamelCase(text)
    case 'snake':
      return toSnakeCase(text)
  }
}

export function parseCaseConverter(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<CaseConverterInput> {
  return toolOk({
    text: readString(raw, 'text') ?? '',
    style: readEnum(raw, 'style', STYLES, 'upper'),
  })
}

export function runCaseConverter(
  input: CaseConverterInput,
  _ctx: ToolContext,
): ToolOutcome<CaseConverterOutput> {
  if (input.text.length === 0) return toolOk({ text: '' })
  return toolOk({ text: convertCase(input.text, input.style) })
}

export function renderCaseConverter(out: CaseConverterOutput, _ctx: ToolContext): string {
  return out.text
}

export const caseConverterTool: ToolDefinition<CaseConverterInput, CaseConverterOutput> = {
  id: 'case-converter',
  tier: 'T1',
  capabilities: [],
  inputs: [
    { name: 'text', kind: 'textarea', required: true, labelKey: 'tools.enterText' },
    {
      name: 'style',
      kind: 'select',
      required: false,
      labelKey: 'tools.mode',
      default: 'upper',
      options: [
        { value: 'upper', labelKey: 'tools.caseUpper' },
        { value: 'lower', labelKey: 'tools.caseLower' },
        { value: 'title', labelKey: 'tools.caseTitle' },
        { value: 'camel', labelKey: 'tools.caseCamel' },
        { value: 'snake', labelKey: 'tools.caseSnake' },
      ],
    },
  ],
  parse: parseCaseConverter,
  run: runCaseConverter,
  render: renderCaseConverter,
}
