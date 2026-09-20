// html-preview —— T2（需要 DOM/iframe 渲染）；下沉的是「文档归一化」这段纯逻辑

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolOk, readString } from './common'

export interface HtmlPreviewInput {
  html: string
}

export interface HtmlPreviewOutput {
  html: string
  /** 是否包含完整文档骨架（false 时端侧需补 <html> 包裹） */
  isFullDocument: boolean
  bytes: number
}

const DOCTYPE_RE = /^\s*<!doctype\s+html\s*>/i
const HTML_TAG_RE = /<html[\s>]/i

export function parseHtmlPreview(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<HtmlPreviewInput> {
  return toolOk({ html: readString(raw, 'html') ?? '' })
}

export function runHtmlPreview(input: HtmlPreviewInput, _ctx: ToolContext): ToolOutcome<HtmlPreviewOutput> {
  const html = input.html
  const hasDoctype = DOCTYPE_RE.test(html)
  const hasHtmlTag = HTML_TAG_RE.test(html)
  const isFullDocument = hasDoctype || hasHtmlTag
  const normalized = isFullDocument
    ? html
    : `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8" />\n</head>\n<body>\n${html}\n</body>\n</html>`
  return toolOk({ html: normalized, isFullDocument, bytes: normalized.length })
}

export function renderHtmlPreview(out: HtmlPreviewOutput, _ctx: ToolContext): string {
  return out.html
}

export const htmlPreviewTool: ToolDefinition<HtmlPreviewInput, HtmlPreviewOutput> = {
  id: 'html-preview',
  tier: 'T2',
  capabilities: ['dom'],
  inputs: [{ name: 'html', kind: 'textarea', required: true, labelKey: 'tools.editor' }],
  parse: parseHtmlPreview,
  run: runHtmlPreview,
  render: renderHtmlPreview,
}
