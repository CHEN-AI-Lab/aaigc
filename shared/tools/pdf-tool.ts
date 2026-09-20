// pdf-tool —— T2（PDF 读写需要 file 能力 + pdf-lib）
// 下沉的是「页码区间解析 / 输出文件命名」这段纯逻辑。

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolFail, toolOk, readEnum, readString } from './common'

export type PdfOperation = 'merge' | 'split' | 'extract' | 'rotate'

export interface PdfToolInput {
  operation: PdfOperation
  /** 总页数（端侧读取 PDF 后传入） */
  pageCount: number
  /** 页码表达式，如 "1-3,5,8-"（1-based，支持开区间） */
  range: string
  fileName: string
}

export interface PdfToolOutput {
  /** 解析后的 0-based 页码索引 */
  pageIndexes: number[]
  outputFileName: string
  operation: PdfOperation
  parts: number
}

const OPERATIONS: readonly PdfOperation[] = ['merge', 'split', 'extract', 'rotate']

/**
 * 解析页码表达式（1-based）：
 *  - "1-3"  → [0,1,2]
 *  - "5"    → [4]
 *  - "8-"   → [7..pageCount-1]
 *  - "-3"   → [0,1,2]
 * 空串表示全部页。
 */
export function parsePageRange(range: string, pageCount: number): number[] | null {
  const raw = range.trim()
  if (raw.length === 0) {
    return pageCount > 0 ? Array.from({ length: pageCount }, (_, i) => i) : []
  }
  const indexes = new Set<number>()
  for (const part of raw.split(',')) {
    const segment = part.trim()
    if (segment.length === 0) continue
    const [fromPart, toPart] = segment.split('-')
    if (toPart === undefined) {
      const single = Number.parseInt(fromPart, 10)
      if (!Number.isFinite(single) || single < 1 || single > pageCount) return null
      indexes.add(single - 1)
      continue
    }
    const hasFrom = fromPart.trim().length > 0
    const hasTo = toPart.trim().length > 0
    const from = hasFrom ? Number.parseInt(fromPart, 10) : 1
    const to = hasTo ? Number.parseInt(toPart, 10) : pageCount
    if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to > pageCount || from > to) {
      return null
    }
    for (let p = from; p <= to; p++) indexes.add(p - 1)
  }
  return [...indexes].sort((a, b) => a - b)
}

/**
 * 输出文件命名。
 * merge / split 与 Web 端当前生产行为保持一致（`<base>_merged.pdf` / `<base>.zip`），
 * 由 T02.3 裁决对齐；extract / rotate 目前 Web 端无对应 UI，暂保留原命名。
 */
export function pdfOutputFileName(sourceName: string, operation: PdfOperation): string {
  const dot = sourceName.lastIndexOf('.')
  const base = dot > 0 ? sourceName.slice(0, dot) : sourceName
  switch (operation) {
    case 'merge':
      return `${base}_merged.pdf`
    case 'split':
      return `${base}.zip`
    case 'extract':
      return `${base}-extracted.pdf`
    case 'rotate':
      return `${base}-rotated.pdf`
  }
}

export function parsePdfTool(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<PdfToolInput> {
  const pageCount = Number.parseInt(String(raw.pageCount ?? '0'), 10)
  if (!Number.isFinite(pageCount) || pageCount < 1) {
    return toolFail('emptyInput', 'tools.emptyInput')
  }
  return toolOk({
    operation: readEnum(raw, 'operation', OPERATIONS, 'merge'),
    pageCount,
    range: readString(raw, 'range') ?? '',
    fileName: readString(raw, 'fileName') ?? 'document.pdf',
  })
}

export function runPdfTool(input: PdfToolInput, _ctx: ToolContext): ToolOutcome<PdfToolOutput> {
  const pageIndexes = parsePageRange(input.range, input.pageCount)
  if (pageIndexes === null) return toolFail('outOfRange', 'tools.outOfRange')
  return toolOk({
    pageIndexes,
    outputFileName: pdfOutputFileName(input.fileName, input.operation),
    operation: input.operation,
    parts: input.operation === 'split' ? pageIndexes.length || input.pageCount : 1,
  })
}

export function renderPdfTool(out: PdfToolOutput, _ctx: ToolContext): string {
  const pages = out.pageIndexes.length === 0 ? 'all' : out.pageIndexes.map((i) => i + 1).join(',')
  return [`operation\t${out.operation}`, `pages\t${pages}`, `output\t${out.outputFileName}`].join('\n')
}

export const pdfTool: ToolDefinition<PdfToolInput, PdfToolOutput> = {
  id: 'pdf-tool',
  tier: 'T2',
  capabilities: ['file'],
  inputs: [
    {
      name: 'operation',
      kind: 'select',
      required: false,
      labelKey: 'tools.mode',
      default: 'merge',
      options: [
        { value: 'merge', labelKey: 'tools.pdfMerge' },
        { value: 'split', labelKey: 'tools.pdfSplit' },
        { value: 'extract', labelKey: 'tools.pdfExtract' },
        { value: 'rotate', labelKey: 'tools.pdfRotate' },
      ],
    },
    { name: 'pageCount', kind: 'number', required: true, labelKey: 'tools.pageCount' },
    { name: 'range', kind: 'text', required: false, labelKey: 'tools.pageRange' },
    { name: 'fileName', kind: 'text', required: false, labelKey: 'tools.fileName' },
  ],
  parse: parsePdfTool,
  run: runPdfTool,
  render: renderPdfTool,
}
