// css-minifier —— T1 纯计算：CSS 压缩 / 展开

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolOk, readEnum, readString } from './common'

export type CssMinifierMode = 'minify' | 'format'

export interface CssMinifierInput {
  css: string
  mode: CssMinifierMode
}

export interface CssMinifierOutput {
  css: string
  savedBytes: number
}

const MODES: readonly CssMinifierMode[] = ['minify', 'format']

/** 压缩：去注释 → 折叠分隔符周围空白 → 折叠连续空白 → 去尾部分号 */
export function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/;}/g, '}')
    .trim()
}

/** 展开：每个声明一行、每条规则块换行（与既有 Web 行为一致） */
export function formatCss(css: string): string {
  return css
    .replace(/\{/g, ' {\n  ')
    .replace(/;/g, ';\n  ')
    .replace(/}/g, '\n}\n')
    .replace(/:\s+/g, ': ')
    .replace(/\n\s*\n/g, '\n')
    .trim()
}

export function parseCssMinifier(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<CssMinifierInput> {
  return toolOk({
    css: readString(raw, 'css') ?? '',
    mode: readEnum(raw, 'mode', MODES, 'minify'),
  })
}

export function runCssMinifier(input: CssMinifierInput, _ctx: ToolContext): ToolOutcome<CssMinifierOutput> {
  if (input.css.trim().length === 0) return toolOk({ css: '', savedBytes: 0 })
  if (input.mode === 'minify') {
    const minified = minifyCss(input.css)
    return toolOk({ css: minified, savedBytes: Math.max(0, input.css.length - minified.length) })
  }
  return toolOk({ css: formatCss(input.css), savedBytes: 0 })
}

export function renderCssMinifier(out: CssMinifierOutput, _ctx: ToolContext): string {
  return out.css
}

export const cssMinifierTool: ToolDefinition<CssMinifierInput, CssMinifierOutput> = {
  id: 'css-minifier',
  tier: 'T1',
  capabilities: [],
  inputs: [
    { name: 'css', kind: 'textarea', required: true, labelKey: 'tools.enterText' },
    {
      name: 'mode',
      kind: 'select',
      required: false,
      labelKey: 'tools.mode',
      default: 'minify',
      options: [
        { value: 'minify', labelKey: 'tools.minify' },
        { value: 'format', labelKey: 'tools.format' },
      ],
    },
  ],
  parse: parseCssMinifier,
  run: runCssMinifier,
  render: renderCssMinifier,
}
