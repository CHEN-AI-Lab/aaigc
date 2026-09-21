// yaml-json —— T1 纯计算：YAML ⇄ JSON（自带子集解析器，零 npm 依赖，保证小程序主包体积）

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolFail, toolOk, readEnum, readString } from './common'

export type YamlJsonMode = 'yaml2json' | 'json2yaml'

export interface YamlJsonInput {
  text: string
  mode: YamlJsonMode
}

export interface YamlJsonOutput {
  text: string
}

const MODES: readonly YamlJsonMode[] = ['yaml2json', 'json2yaml']

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

interface YamlLine {
  indent: number
  text: string
}

/** 去掉行尾注释（引号内的 # 保留） */
function stripComment(text: string): string {
  let quote: string | null = null
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quote) {
      if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === '#' && (i === 0 || /\s/.test(text[i - 1]))) {
      return text.slice(0, i).trimEnd()
    }
  }
  return text.trimEnd()
}

function preprocess(source: string): YamlLine[] {
  const lines: YamlLine[] = []
  for (const raw of source.split('\n')) {
    if (raw.trim().length === 0) continue
    const expanded = raw.replace(/\t/g, '  ')
    const indent = expanded.length - expanded.trimStart().length
    const text = stripComment(expanded.trim())
    if (text.length === 0) continue
    lines.push({ indent, text })
  }
  return lines
}

function parseScalar(text: string): JsonValue {
  const value = text.trim()
  if (value.length === 0) return null
  if (value.startsWith('"')) {
    try {
      const parsed: unknown = JSON.parse(value)
      if (typeof parsed === 'string') return parsed
    } catch {
      return value.slice(1, value.lastIndexOf('"'))
    }
    return value.slice(1, value.lastIndexOf('"'))
  }
  if (value.startsWith("'") && value.endsWith("'") && value.length >= 2) {
    return value.slice(1, -1).replace(/''/g, "'")
  }
  if (value === 'true' || value === 'yes' || value === 'on') return true
  if (value === 'false' || value === 'no' || value === 'off') return false
  if (value === 'null' || value === '~' || value === 'Null' || value === 'NULL') return null
  if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(value)) {
    const num = Number(value)
    if (Number.isFinite(num)) return num
  }
  return value
}

function splitKey(text: string): { key: string; rest: string } {
  let quote: string | null = null
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quote) {
      if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === ':') {
      const key = text.slice(0, i).trim()
      const rest = text.slice(i + 1).trim()
      const unquotedKey = key.startsWith('"') || key.startsWith("'") ? key.slice(1, -1) : key
      return { key: unquotedKey, rest }
    }
  }
  return { key: text, rest: '' }
}

function isSequenceItem(text: string): boolean {
  return text === '-' || text.startsWith('- ')
}

function looksLikeMapping(text: string): boolean {
  return splitKey(text).rest !== '' || /^[^\s:]+:$/.test(text)
}

function parseBlock(lines: YamlLine[], start: number, indent: number): { value: JsonValue; next: number } {
  let i = start
  if (i >= lines.length) return { value: null, next: i }

  if (isSequenceItem(lines[i].text)) {
    const array: JsonValue[] = []
    while (i < lines.length && lines[i].indent === indent && isSequenceItem(lines[i].text)) {
      const rest = lines[i].text === '-' ? '' : lines[i].text.slice(2).trim()
      i++
      if (rest.length === 0) {
        if (i < lines.length && lines[i].indent > indent) {
          const sub = parseBlock(lines, i, lines[i].indent)
          array.push(sub.value)
          i = sub.next
        } else {
          array.push(null)
        }
      } else if (looksLikeMapping(rest)) {
        const childIndent = indent + 2
        const subLines: YamlLine[] = [{ indent: childIndent, text: rest }]
        for (let j = i; j < lines.length && lines[j].indent > indent; j++) {
          subLines.push(lines[j])
        }
        const sub = parseBlock(subLines, 0, childIndent)
        array.push(sub.value)
        while (i < lines.length && lines[i].indent > indent) i++
      } else {
        array.push(parseScalar(rest))
      }
    }
    return { value: array, next: i }
  }

  const object: Record<string, JsonValue> = {}
  while (i < lines.length && lines[i].indent === indent && !isSequenceItem(lines[i].text)) {
    const { key, rest } = splitKey(lines[i].text)
    i++
    if (rest.length === 0) {
      if (i < lines.length && lines[i].indent > indent) {
        const sub = parseBlock(lines, i, lines[i].indent)
        object[key] = sub.value
        i = sub.next
      } else {
        object[key] = null
      }
    } else {
      object[key] = parseScalar(rest)
    }
  }
  return { value: object, next: i }
}

/** YAML → JSON 值。空文档返回 null */
export function parseYaml(source: string): JsonValue | null {
  const lines = preprocess(source)
  if (lines.length === 0) return null
  const result = parseBlock(lines, 0, lines[0].indent)
  return result.value
}

function scalarToYaml(value: JsonValue): string {
  if (value === null) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  const needsQuote =
    text.length === 0 ||
    /^[-+]?[\d.]/.test(text) ||
    text === 'true' ||
    text === 'false' ||
    text === 'null' ||
    text === '~' ||
    text === 'yes' ||
    text === 'no' ||
    /[:#{}[\],&*?|>%@`"']/.test(text) ||
    /^\s|\s$/.test(text)
  return needsQuote ? JSON.stringify(text) : text
}

export function dumpYaml(value: JsonValue, indent = 0): string {
  const pad = ' '.repeat(indent)
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}[]`
    return value
      .map((item) => {
        if (Array.isArray(item)) {
          return item.length === 0 ? `${pad}- []` : `${pad}-\n${dumpYaml(item, indent + 2)}`
        }
        if (item !== null && typeof item === 'object') {
          const body = dumpYaml(item, indent + 2)
          return Object.keys(item).length === 0 ? `${pad}- {}` : `${pad}-\n${body}`
        }
        return `${pad}- ${scalarToYaml(item)}`
      })
      .join('\n')
  }
  if (value !== null && typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.length === 0) return `${pad}{}`
    return keys
      .map((key) => {
        const child = (value as Record<string, JsonValue>)[key]
        const safeKey = scalarToYaml(key)
        if (Array.isArray(child)) {
          return child.length === 0 ? `${pad}${safeKey}: []` : `${pad}${safeKey}:\n${dumpYaml(child, indent + 2)}`
        }
        if (child !== null && typeof child === 'object') {
          return Object.keys(child).length === 0
            ? `${pad}${safeKey}: {}`
            : `${pad}${safeKey}:\n${dumpYaml(child, indent + 2)}`
        }
        return `${pad}${safeKey}: ${scalarToYaml(child)}`
      })
      .join('\n')
  }
  return `${pad}${scalarToYaml(value)}`
}

export function parseYamlJson(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<YamlJsonInput> {
  const text = readString(raw, 'text') ?? ''
  const mode = readEnum(raw, 'mode', MODES, 'yaml2json')
  if (text.trim().length === 0) return toolFail('emptyInput', 'tools.emptyInput')
  return toolOk({ text, mode })
}

export function runYamlJson(input: YamlJsonInput, _ctx: ToolContext): ToolOutcome<YamlJsonOutput> {
  try {
    if (input.mode === 'yaml2json') {
      const parsed = parseYaml(input.text)
      if (parsed === null) return toolFail('emptyInput', 'tools.emptyYaml')
      return toolOk({ text: JSON.stringify(parsed, null, 2) })
    }
    const parsed: JsonValue = JSON.parse(input.text) as JsonValue
    return toolOk({ text: `${dumpYaml(parsed)}\n` })
  } catch {
    return toolFail('invalidJson', 'tools.conversionFailed')
  }
}

export function renderYamlJson(out: YamlJsonOutput, _ctx: ToolContext): string {
  return out.text
}

export const yamlJsonTool: ToolDefinition<YamlJsonInput, YamlJsonOutput> = {
  id: 'yaml-json',
  tier: 'T1',
  capabilities: [],
  inputs: [
    { name: 'text', kind: 'textarea', required: true, labelKey: 'tools.pleaseEnterContent' },
    {
      name: 'mode',
      kind: 'select',
      required: false,
      labelKey: 'tools.mode',
      default: 'yaml2json',
      options: [
        { value: 'yaml2json', labelKey: 'tools.yamlToJson' },
        { value: 'json2yaml', labelKey: 'tools.jsonToYaml' },
      ],
    },
  ],
  parse: parseYamlJson,
  run: runYamlJson,
  render: renderYamlJson,
}
