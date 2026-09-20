// text-to-slug —— T1 纯计算：文本 → URL slug

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolOk, readString } from './common'

export interface TextToSlugInput {
  text: string
}

export interface TextToSlugOutput {
  slug: string
}

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function parseTextToSlug(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<TextToSlugInput> {
  return toolOk({ text: readString(raw, 'text') ?? '' })
}

export function runTextToSlug(input: TextToSlugInput, _ctx: ToolContext): ToolOutcome<TextToSlugOutput> {
  if (input.text.trim().length === 0) return toolOk({ slug: '' })
  return toolOk({ slug: toSlug(input.text) })
}

export function renderTextToSlug(out: TextToSlugOutput, _ctx: ToolContext): string {
  return out.slug
}

export const textToSlugTool: ToolDefinition<TextToSlugInput, TextToSlugOutput> = {
  id: 'text-to-slug',
  tier: 'T1',
  capabilities: [],
  inputs: [{ name: 'text', kind: 'textarea', required: true, labelKey: 'tools.enterText' }],
  parse: parseTextToSlug,
  run: runTextToSlug,
  render: renderTextToSlug,
}
