// lorem-ipsum —— T1 纯计算：占位文本生成（随机源经 ToolContext 注入）

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { RandomSource, toolOk, readEnum, readInt, clampInt } from './common'

export type LoremUnit = 'paragraphs' | 'sentences' | 'words'

export interface LoremIpsumInput {
  count: number
  unit: LoremUnit
}

export interface LoremIpsumOutput {
  text: string
}

const UNITS: readonly LoremUnit[] = ['paragraphs', 'sentences', 'words']

const WORDS: readonly string[] = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
  'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
  'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
  'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'dolor',
  'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat', 'nulla',
  'pariatur',
]

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function makeSentence(source: RandomSource, minWords: number, spread: number): string {
  const length = minWords + source.below(spread)
  const words: string[] = []
  for (let i = 0; i < length; i++) words.push(source.pick(WORDS))
  return `${capitalize(words.join(' '))}.`
}

export function parseLoremIpsum(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<LoremIpsumInput> {
  return toolOk({
    count: clampInt(readInt(raw, 'count', 5), 1, 100),
    unit: readEnum(raw, 'unit', UNITS, 'paragraphs'),
  })
}

export function runLoremIpsum(input: LoremIpsumInput, ctx: ToolContext): ToolOutcome<LoremIpsumOutput> {
  const source = new RandomSource(ctx)
  if (input.unit === 'words') {
    const words: string[] = []
    for (let i = 0; i < input.count; i++) words.push(source.pick(WORDS))
    const text = words.join(' ')
    return toolOk({ text: `${capitalize(text)}.` })
  }
  if (input.unit === 'sentences') {
    const sentences: string[] = []
    for (let i = 0; i < input.count; i++) sentences.push(makeSentence(source, 5, 15))
    return toolOk({ text: sentences.join(' ') })
  }
  const paragraphs: string[] = []
  for (let i = 0; i < input.count; i++) {
    const sentenceCount = 3 + source.below(5)
    const sentences: string[] = []
    for (let j = 0; j < sentenceCount; j++) sentences.push(makeSentence(source, 8, 20))
    paragraphs.push(sentences.join(' '))
  }
  return toolOk({ text: paragraphs.join('\n\n') })
}

export function renderLoremIpsum(out: LoremIpsumOutput, _ctx: ToolContext): string {
  return out.text
}

export const loremIpsumTool: ToolDefinition<LoremIpsumInput, LoremIpsumOutput> = {
  id: 'lorem-ipsum',
  tier: 'T1',
  capabilities: [],
  inputs: [
    { name: 'count', kind: 'number', required: false, labelKey: 'tools.count', default: 5 },
    {
      name: 'unit',
      kind: 'select',
      required: false,
      labelKey: 'tools.mode',
      default: 'paragraphs',
      options: [
        { value: 'paragraphs', labelKey: 'tools.loremParagraphs' },
        { value: 'sentences', labelKey: 'tools.loremSentences' },
        { value: 'words', labelKey: 'tools.loremWords' },
      ],
    },
  ],
  parse: parseLoremIpsum,
  run: runLoremIpsum,
  render: renderLoremIpsum,
}
