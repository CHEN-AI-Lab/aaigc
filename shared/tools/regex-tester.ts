// regex-tester —— T1 纯计算：正则匹配（不含平台 API）

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { errorDetail, toolFail, toolOk, readString } from './common'

export interface RegexTesterInput {
  pattern: string
  flags: string
  text: string
}

export interface RegexMatch {
  index: number
  match: string
}

export interface RegexTesterOutput {
  matches: RegexMatch[]
  total: number
}

const VALID_FLAGS = /^[dgimsuvy]*$/

export function parseRegexTester(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<RegexTesterInput> {
  const pattern = readString(raw, 'pattern') ?? ''
  const flags = readString(raw, 'flags') ?? 'gm'
  const text = readString(raw, 'text') ?? ''
  if (pattern.length === 0 || text.length === 0) {
    return toolOk({ pattern, flags, text })
  }
  if (!VALID_FLAGS.test(flags)) {
    return toolFail('invalidRegex', 'tools.invalidRegex')
  }
  return toolOk({ pattern, flags, text })
}

export function runRegexTester(
  input: RegexTesterInput,
  _ctx: ToolContext,
): ToolOutcome<RegexTesterOutput> {
  if (input.pattern.length === 0 || input.text.length === 0) {
    return toolOk({ matches: [], total: 0 })
  }
  let regex: RegExp
  try {
    regex = new RegExp(input.pattern, input.flags)
  } catch (caught) {
    // 引擎原始报错经 detail 透出，端侧作为次要文案附在 t('invalidRegex') 之后
    return toolFail('invalidRegex', 'tools.invalidRegex', undefined, errorDetail(caught))
  }

  const hasGlobal = input.flags.includes('g') || input.flags.includes('y')
  const matches: RegexMatch[] = []
  if (hasGlobal) {
    let m: RegExpExecArray | null
    let guard = 0
    while ((m = regex.exec(input.text)) !== null) {
      matches.push({ index: m.index, match: m[0] })
      if (m.index === regex.lastIndex) regex.lastIndex++
      if (++guard > 100000) break
    }
  } else {
    const m = regex.exec(input.text)
    if (m) matches.push({ index: m.index, match: m[0] })
  }
  return toolOk({ matches, total: matches.length })
}

export function renderRegexTester(out: RegexTesterOutput, _ctx: ToolContext): string {
  return out.matches.map((m, i) => `#${i + 1} @${m.index}\t${m.match}`).join('\n')
}

export const regexTesterTool: ToolDefinition<RegexTesterInput, RegexTesterOutput> = {
  id: 'regex-tester',
  tier: 'T1',
  capabilities: [],
  inputs: [
    { name: 'pattern', kind: 'text', required: true, labelKey: 'tools.regularExpression' },
    { name: 'flags', kind: 'text', required: false, labelKey: 'tools.flags', default: 'gm' },
    { name: 'text', kind: 'textarea', required: true, labelKey: 'tools.testText' },
  ],
  parse: parseRegexTester,
  run: runRegexTester,
  render: renderRegexTester,
}
