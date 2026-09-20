// ─────────────────────────────────────────────────────────────────────────────
// 工具注册表 —— 38 个工具的唯一索引，驱动五端自动生成表单 / CLI 参数
// ─────────────────────────────────────────────────────────────────────────────

import type { ToolCapability, ToolContext, ToolDefinition, ToolId, ToolOutcome, ToolTier } from '../types/tool'
import { TOOL_IDS } from '../types/tool'

import { jsonFormatterTool } from './json-formatter'
import { base64Tool } from './base64'
import { urlEncodeTool } from './url-encode'
import { regexTesterTool } from './regex-tester'
import { jwtDecoderTool } from './jwt-decoder'
import { uuidGeneratorTool } from './uuid-generator'
import { htmlPreviewTool } from './html-preview'
import { htmlEntitiesTool } from './html-entities'
import { cssMinifierTool } from './css-minifier'
import { numberBaseTool } from './number-base'
import { yamlJsonTool } from './yaml-json'
import { jsonToCsvTool } from './json-to-csv'
import { wordCounterTool } from './word-counter'
import { markdownPreviewTool } from './markdown-preview'
import { caseConverterTool } from './case-converter'
import { textDiffTool } from './text-diff'
import { loremIpsumTool } from './lorem-ipsum'
import { textToSlugTool } from './text-to-slug'
import { listSorterTool } from './list-sorter'
import { passwordGeneratorTool } from './password-generator'
import { qrCodeTool } from './qrcode'
import { colorPickerTool } from './color-picker'
import { imageToBase64Tool } from './image-to-base64'
import { imageConverterTool } from './image-converter'
import { imageEditorTool } from './image-editor'
import { calculatorTool } from './calculator'
import { ipLookupTool } from './ip-lookup'
import { dnsLookupTool } from './dns-lookup'
import { httpStatusCodesTool } from './http-status-codes'
import { userAgentParserTool } from './user-agent-parser'
import { timestampTool } from './timestamp'
import { dateCalculatorTool } from './date-calculator'
import { timerTool } from './timer'
import { emojiPickerTool } from './emoji-picker'
import { randomGeneratorTool } from './random-generator'
import { cronBuilderTool } from './cron-builder'
import { pdfTool } from './pdf-tool'
import { fileRenamerTool } from './file-renamer'

export const TOOL_REGISTRY: Record<ToolId, ToolDefinition> = {
  'json-formatter': jsonFormatterTool,
  base64: base64Tool,
  'url-encode': urlEncodeTool,
  'regex-tester': regexTesterTool,
  'jwt-decoder': jwtDecoderTool,
  'uuid-generator': uuidGeneratorTool,
  'html-preview': htmlPreviewTool,
  'html-entities': htmlEntitiesTool,
  'css-minifier': cssMinifierTool,
  'number-base': numberBaseTool,
  'yaml-json': yamlJsonTool,
  'json-to-csv': jsonToCsvTool,
  'word-counter': wordCounterTool,
  'markdown-preview': markdownPreviewTool,
  'case-converter': caseConverterTool,
  'text-diff': textDiffTool,
  'lorem-ipsum': loremIpsumTool,
  'text-to-slug': textToSlugTool,
  'list-sorter': listSorterTool,
  'password-generator': passwordGeneratorTool,
  qrcode: qrCodeTool,
  'color-picker': colorPickerTool,
  'image-to-base64': imageToBase64Tool,
  'image-converter': imageConverterTool,
  'image-editor': imageEditorTool,
  calculator: calculatorTool,
  'ip-lookup': ipLookupTool,
  'dns-lookup': dnsLookupTool,
  'http-status-codes': httpStatusCodesTool,
  'user-agent-parser': userAgentParserTool,
  timestamp: timestampTool,
  'date-calculator': dateCalculatorTool,
  timer: timerTool,
  'emoji-picker': emojiPickerTool,
  'random-generator': randomGeneratorTool,
  'cron-builder': cronBuilderTool,
  'pdf-tool': pdfTool,
  'file-renamer': fileRenamerTool,
}

export function isToolId(value: string): value is ToolId {
  return (TOOL_IDS as readonly string[]).includes(value)
}

/** 取工具定义；未知 id 返回 undefined（调用方据此回 toolNotFound） */
export function getTool(id: string): ToolDefinition | undefined {
  if (!isToolId(id)) return undefined
  return TOOL_REGISTRY[id]
}

export interface ToolFilter {
  tier?: ToolTier
  /** 端侧具备的能力；缺省表示不过滤 */
  capabilities?: ToolCapability[]
  /** 需要全部命中的能力（用于「端侧是否可原生运行」判定） */
  requiresAllCapabilities?: boolean
}

export function listTools(filter: ToolFilter = {}): ToolDefinition[] {
  const { tier, capabilities, requiresAllCapabilities = false } = filter
  return TOOL_IDS.map((id) => TOOL_REGISTRY[id]).filter((tool) => {
    if (tier && tool.tier !== tier) return false
    if (capabilities && capabilities.length > 0) {
      if (requiresAllCapabilities) {
        if (!tool.capabilities.every((c) => capabilities.includes(c))) return false
      } else if (!tool.capabilities.some((c) => capabilities.includes(c))) {
        return false
      }
    }
    return true
  })
}

/** 端侧能力集合 → 该端可离线原生运行的工具（T1 或能力被完全覆盖） */
export function supportedTools(capabilities: ToolCapability[]): ToolDefinition[] {
  return TOOL_IDS.map((id) => TOOL_REGISTRY[id]).filter((tool) => {
    if (tool.tier === 'T3') return false
    return tool.capabilities.every((c) => capabilities.includes(c))
  })
}

/** 统一入口：按 id 执行 parse → run；非法输入或未知 id 均返回 ToolOutcome */
export async function runToolById(
  id: string,
  raw: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolOutcome<unknown>> {
  const tool = getTool(id)
  if (!tool) {
    return { ok: false, error: { code: 'invalidInput', messageKey: 'tools.toolNotFound' } }
  }
  const parsed = tool.parse(raw, ctx)
  if (!parsed.ok) return parsed
  return tool.run(parsed.data, ctx)
}

/** 统一入口：parse → run → render（CLI / 小程序纯文本兜底） */
export async function renderToolById(
  id: string,
  raw: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolOutcome<string>> {
  const tool = getTool(id)
  if (!tool) {
    return { ok: false, error: { code: 'invalidInput', messageKey: 'tools.toolNotFound' } }
  }
  const parsed = tool.parse(raw, ctx)
  if (!parsed.ok) return parsed
  const result = await tool.run(parsed.data, ctx)
  if (!result.ok) return result
  return { ok: true, data: tool.render(result.data, ctx) }
}
