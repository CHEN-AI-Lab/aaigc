// markdown-preview —— T1 纯计算：Markdown → HTML
//
// 安全性：所有文本节点统一转义（& < > "），解析器只输出白名单标签，
// 因此输出可直接用于 innerHTML 而不必再引入运行时 sanitizer。

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolOk, readString } from './common'

export interface MarkdownPreviewInput {
  markdown: string
}

export interface MarkdownPreviewOutput {
  html: string
  words: number
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 行内语法：**粗体** *斜体* `代码` [链接](url) */
function renderInline(text: string): string {
  let out = escapeHtml(text)
  out = out.replace(/`([^`]+)`/g, (_m, code: string) => `<code>${code}</code>`)
  out = out.replace(/\*\*([^*]+)\*\*/g, (_m, bold: string) => `<strong>${bold}</strong>`)
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, (_m, prefix: string, em: string) => `${prefix}<em>${em}</em>`)
  out = out.replace(/~~([^~]+)~~/g, (_m, s: string) => `<del>${s}</del>`)
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|#[^\s)]*|\/[^\s)]*)\)/g,
    (_m, label: string, href: string) => `<a href="${href}" rel="noopener noreferrer">${label}</a>`,
  )
  return out
}

/**
 * 块级 Markdown → HTML。
 * 支持：ATX 标题、代码块、引用、无序/有序列表、分隔线、段落、行尾双空格换行。
 */
export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const html: string[] = []
  let index = 0

  const closeList = (state: { listType: string | null }): void => {
    if (state.listType !== null) {
      html.push(state.listType === 'ol' ? '</ol>' : '</ul>')
      state.listType = null
    }
  }

  const state = { listType: null as string | null }

  while (index < lines.length) {
    const raw = lines[index]
    const line = raw.trimEnd()

    if (line.trim().length === 0) {
      closeList(state)
      index++
      continue
    }

    // 代码块（```）
    const fence = line.match(/^\s*```(\w*)\s*$/)
    if (fence) {
      closeList(state)
      const lang = fence[1] ?? ''
      const body: string[] = []
      index++
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
        body.push(escapeHtml(lines[index]))
        index++
      }
      index++
      const cls = lang ? ` class="language-${escapeHtml(lang)}"` : ''
      html.push(`<pre><code${cls}>${body.join('\n')}</code></pre>`)
      continue
    }

    // 标题
    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      closeList(state)
      const level = heading[1].length
      html.push(`<h${level}>${renderInline(heading[2].trim())}</h${level}>`)
      index++
      continue
    }

    // 分隔线（--- / *** / ___，至少 3 个）
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      closeList(state)
      html.push('<hr />')
      index++
      continue
    }

    // 引用
    if (/^\s*>\s?/.test(line)) {
      closeList(state)
      const body: string[] = []
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        body.push(renderInline(lines[index].replace(/^\s*>\s?/, '')))
        index++
      }
      html.push(`<blockquote>${body.join('<br />')}</blockquote>`)
      continue
    }

    // 列表
    const unordered = line.match(/^\s*[-*+]\s+(.*)$/)
    const ordered = line.match(/^\s*\d+[.)]\s+(.*)$/)
    const listType = unordered ? 'ul' : ordered ? 'ol' : null
    if (listType) {
      if (state.listType !== listType) {
        closeList(state)
        html.push(`<${listType}>`)
        state.listType = listType
      }
      const content = (unordered ?? ordered)?.[1] ?? ''
      html.push(`<li>${renderInline(content)}</li>`)
      index++
      continue
    }

    // 段落（连续非空行合并，行尾双空格 = <br />）
    closeList(state)
    const paragraph: string[] = []
    while (
      index < lines.length &&
      lines[index].trim().length > 0 &&
      !/^\s*```/.test(lines[index]) &&
      !/^#{1,6}\s/.test(lines[index]) &&
      !/^\s*>/.test(lines[index]) &&
      !/^\s*[-*+]\s/.test(lines[index]) &&
      !/^\s*\d+[.)]\s/.test(lines[index])
    ) {
      paragraph.push(renderInline(lines[index].replace(/ {2,}$/, (m) => (m.length >= 2 ? '<br />' : m))))
      index++
    }
    if (paragraph.length > 0) html.push(`<p>${paragraph.join('<br />')}</p>`)
  }

  closeList(state)
  return html.join('\n')
}

export function parseMarkdownPreview(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<MarkdownPreviewInput> {
  return toolOk({ markdown: readString(raw, 'markdown') ?? '' })
}

export function runMarkdownPreview(
  input: MarkdownPreviewInput,
  _ctx: ToolContext,
): ToolOutcome<MarkdownPreviewOutput> {
  const trimmed = input.markdown.trim()
  return toolOk({
    html: trimmed.length === 0 ? '' : markdownToHtml(input.markdown),
    words: trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length,
  })
}

export function renderMarkdownPreview(out: MarkdownPreviewOutput, _ctx: ToolContext): string {
  return out.html
}

export const markdownPreviewTool: ToolDefinition<MarkdownPreviewInput, MarkdownPreviewOutput> = {
  id: 'markdown-preview',
  tier: 'T1',
  capabilities: [],
  inputs: [{ name: 'markdown', kind: 'textarea', required: true, labelKey: 'tools.originalText' }],
  parse: parseMarkdownPreview,
  run: runMarkdownPreview,
  render: renderMarkdownPreview,
}
