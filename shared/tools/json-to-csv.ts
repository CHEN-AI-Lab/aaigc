// json-to-csv —— T1 纯计算：JSON（对象/数组/原始值）→ CSV

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolFail, toolOk, readString } from './common'

export interface JsonToCsvInput {
  json: string
}

export interface JsonToCsvOutput {
  csv: string
  columns: string[]
  rows: number
}

/** 扁平化嵌套对象为一行键值对（与既有 Web 行为一致） */
export function flattenObject(value: unknown, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  if (value === null || value === undefined) return result
  if (typeof value !== 'object' || Array.isArray(value)) {
    result[prefix] = String(value)
    return result
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (child !== null && typeof child === 'object' && !Array.isArray(child)) {
      Object.assign(result, flattenObject(child, path))
    } else {
      result[path] = child === null || child === undefined ? '' : String(child)
    }
  }
  return result
}

/** CSV 单元格转义（含逗号/引号/换行时加引号并转义双引号） */
export function escapeCsvCell(value: string): string {
  const text = String(value)
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function parseJsonToCsv(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<JsonToCsvInput> {
  const json = (readString(raw, 'json') ?? '').trim()
  if (json.length === 0) return toolFail('emptyInput', 'tools.emptyInput')
  return toolOk({ json })
}

export function runJsonToCsv(input: JsonToCsvInput, _ctx: ToolContext): ToolOutcome<JsonToCsvOutput> {
  let data: unknown
  try {
    data = JSON.parse(input.json)
  } catch {
    return toolFail('invalidJson', 'tools.invalidJson')
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return toolFail('invalidInput', 'tools.invalidInput')
    const hasObjects = data.some(
      (item) => item !== null && typeof item === 'object' && !Array.isArray(item),
    )
    if (hasObjects) {
      const flatRows = data.map((row) => flattenObject(row))
      const headers = [...new Set(flatRows.flatMap((row) => Object.keys(row)))]
      const lines = [
        headers.join(','),
        ...flatRows.map((row) => headers.map((h) => escapeCsvCell(row[h] ?? '')).join(',')),
      ]
      return toolOk({ csv: lines.join('\n'), columns: headers, rows: flatRows.length })
    }
    const lines = ['Value', ...data.map((v) => escapeCsvCell(String(v)))]
    return toolOk({ csv: lines.join('\n'), columns: ['Value'], rows: data.length })
  }

  if (data !== null && typeof data === 'object') {
    const flat = flattenObject(data)
    const lines = [
      'Key,Value',
      ...Object.entries(flat).map(([k, v]) => `${k},${escapeCsvCell(String(v))}`),
    ]
    return toolOk({ csv: lines.join('\n'), columns: ['Key', 'Value'], rows: Object.keys(flat).length })
  }

  return toolOk({ csv: `Value\n${String(data)}`, columns: ['Value'], rows: 1 })
}

export function renderJsonToCsv(out: JsonToCsvOutput, _ctx: ToolContext): string {
  return out.csv
}

export const jsonToCsvTool: ToolDefinition<JsonToCsvInput, JsonToCsvOutput> = {
  id: 'json-to-csv',
  tier: 'T1',
  capabilities: [],
  inputs: [
    { name: 'json', kind: 'textarea', required: true, labelKey: 'tools.input', placeholderKey: 'tools.jsonPlaceholder' },
  ],
  parse: parseJsonToCsv,
  run: runJsonToCsv,
  render: renderJsonToCsv,
}
