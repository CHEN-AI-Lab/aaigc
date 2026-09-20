// html-entities —— T1 纯计算：HTML 实体转义 / 反转义（不依赖 DOMParser）

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolOk, readEnum, readString } from './common'

export type HtmlEntitiesMode = 'escape' | 'unescape'

export interface HtmlEntitiesInput {
  text: string
  mode: HtmlEntitiesMode
}

export interface HtmlEntitiesOutput {
  text: string
}

const MODES: readonly HtmlEntitiesMode[] = ['escape', 'unescape']

/** 命名实体表（覆盖 HTML 4 / HTML5 常用集合） */
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  copy: '©',
  reg: '®',
  trade: '™',
  deg: '°',
  plusmn: '±',
  times: '×',
  divide: '÷',
  frac12: '½',
  frac14: '¼',
  frac34: '¾',
  larr: '←',
  rarr: '→',
  uarr: '↑',
  darr: '↓',
  harr: '↔',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  euro: '€',
  pound: '£',
  yen: '¥',
  cent: '¢',
  sect: '§',
  para: '¶',
  middot: '·',
  bull: '•',
  dagger: '†',
  permil: '‰',
  prime: '′',
  oline: '‾',
  lparen: '(',
  rparen: ')',
}

const ESCAPE_PAIRS: readonly [RegExp, string][] = [
  [/&/g, '&amp;'],
  [/</g, '&lt;'],
  [/>/g, '&gt;'],
  [/"/g, '&quot;'],
  [/'/g, '&#39;'],
]

/** 转义：& < > " ' */
export function escapeHtmlEntities(text: string): string {
  let out = text
  for (const [pattern, replacement] of ESCAPE_PAIRS) {
    out = out.replace(pattern, replacement)
  }
  return out
}

/** 反转义：命名实体 + 十进制/十六进制数字实体 */
export function unescapeHtmlEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (entity, body: string) => {
    if (body.startsWith('#')) {
      const isHex = body[1] === 'x' || body[1] === 'X'
      const digits = isHex ? body.slice(2) : body.slice(1)
      const codePoint = Number.parseInt(digits, isHex ? 16 : 10)
      if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return entity
      return String.fromCodePoint(codePoint)
    }
    const named = NAMED_ENTITIES[body]
    if (named !== undefined) return named
    const lower = body.toLowerCase()
    const namedLower = NAMED_ENTITIES[lower]
    return namedLower === undefined ? entity : namedLower
  })
}

export function parseHtmlEntities(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<HtmlEntitiesInput> {
  return toolOk({
    text: readString(raw, 'text') ?? '',
    mode: readEnum(raw, 'mode', MODES, 'escape'),
  })
}

export function runHtmlEntities(
  input: HtmlEntitiesInput,
  _ctx: ToolContext,
): ToolOutcome<HtmlEntitiesOutput> {
  return toolOk({
    text: input.mode === 'escape' ? escapeHtmlEntities(input.text) : unescapeHtmlEntities(input.text),
  })
}

export function renderHtmlEntities(out: HtmlEntitiesOutput, _ctx: ToolContext): string {
  return out.text
}

export const htmlEntitiesTool: ToolDefinition<HtmlEntitiesInput, HtmlEntitiesOutput> = {
  id: 'html-entities',
  tier: 'T1',
  capabilities: [],
  inputs: [
    { name: 'text', kind: 'textarea', required: true, labelKey: 'tools.enterHtml' },
    {
      name: 'mode',
      kind: 'select',
      required: false,
      labelKey: 'tools.mode',
      default: 'escape',
      options: [
        { value: 'escape', labelKey: 'tools.escape' },
        { value: 'unescape', labelKey: 'tools.unescape' },
      ],
    },
  ],
  parse: parseHtmlEntities,
  run: runHtmlEntities,
  render: renderHtmlEntities,
}
