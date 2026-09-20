// password-generator —— T1 纯计算：随机密码 + 强度评分（随机源经 ToolContext 注入）

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { RandomSource, toolFail, toolOk, readBool, readInt, clampInt } from './common'

export interface PasswordGeneratorInput {
  length: number
  upper: boolean
  lower: boolean
  digits: boolean
  symbols: boolean
}

export interface PasswordGeneratorOutput {
  password: string
  strength: number
  poolSize: number
}

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

/** 0–100 的强度评分（与既有 Web 行为一致） */
export function scoreStrength(
  length: number,
  flags: { upper: boolean; lower: boolean; digits: boolean; symbols: boolean },
): number {
  let score = 0
  if (length >= 8) score += 25
  if (length >= 12) score += 25
  if (flags.upper && flags.lower) score += 15
  if (flags.digits) score += 15
  if (flags.symbols) score += 20
  return Math.min(100, score)
}

export function parsePasswordGenerator(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<PasswordGeneratorInput> {
  return toolOk({
    length: clampInt(readInt(raw, 'length', 16), 4, 128),
    upper: readBool(raw, 'upper', true),
    lower: readBool(raw, 'lower', true),
    digits: readBool(raw, 'digits', true),
    symbols: readBool(raw, 'symbols', true),
  })
}

export function runPasswordGenerator(
  input: PasswordGeneratorInput,
  ctx: ToolContext,
): ToolOutcome<PasswordGeneratorOutput> {
  let pool = ''
  if (input.upper) pool += UPPER
  if (input.lower) pool += LOWER
  if (input.digits) pool += DIGITS
  if (input.symbols) pool += SYMBOLS
  if (pool.length === 0) {
    return toolFail('invalidInput', 'tools.invalidInput')
  }

  const source = new RandomSource(ctx)
  let password = ''
  for (let i = 0; i < input.length; i++) {
    password += pool[source.below(pool.length)]
  }

  return toolOk({
    password,
    strength: scoreStrength(input.length, input),
    poolSize: pool.length,
  })
}

export function renderPasswordGenerator(out: PasswordGeneratorOutput, _ctx: ToolContext): string {
  return out.password
}

export const passwordGeneratorTool: ToolDefinition<PasswordGeneratorInput, PasswordGeneratorOutput> = {
  id: 'password-generator',
  tier: 'T1',
  capabilities: [],
  inputs: [
    { name: 'length', kind: 'number', required: false, labelKey: 'tools.length', default: 16 },
    { name: 'upper', kind: 'boolean', required: false, labelKey: 'tools.upper', default: true },
    { name: 'lower', kind: 'boolean', required: false, labelKey: 'tools.lower', default: true },
    { name: 'digits', kind: 'boolean', required: false, labelKey: 'tools.digits', default: true },
    { name: 'symbols', kind: 'boolean', required: false, labelKey: 'tools.symbols', default: true },
  ],
  parse: parsePasswordGenerator,
  run: runPasswordGenerator,
  render: renderPasswordGenerator,
}
