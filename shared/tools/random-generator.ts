// random-generator —— T1 纯计算：随机数字 / 字符串 / 颜色（随机源经 ToolContext 注入）

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { RandomSource, toolFail, toolOk, readEnum, readInt, clampInt, padNumber } from './common'

export type RandomMode = 'number' | 'string' | 'color'

export interface RandomGeneratorInput {
  mode: RandomMode
  min: number
  max: number
  length: number
  charset: string
}

export interface RandomGeneratorOutput {
  value: string
  /** number 模式下的数值；其他模式为 NaN */
  numeric: number
}

const MODES: readonly RandomMode[] = ['number', 'string', 'color']

const DEFAULT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function parseRandomGenerator(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<RandomGeneratorInput> {
  const mode = readEnum(raw, 'mode', MODES, 'number')
  const min = readInt(raw, 'min', 1)
  const max = readInt(raw, 'max', 100)
  if (mode === 'number' && max < min) return toolFail('outOfRange', 'tools.outOfRange')
  const charset = typeof raw.charset === 'string' && raw.charset.length > 0 ? raw.charset : DEFAULT_CHARSET
  if (mode === 'string' && charset.length === 0) return toolFail('invalidInput', 'tools.invalidInput')
  return toolOk({ mode, min, max, length: clampInt(readInt(raw, 'length', 8), 1, 256), charset })
}

export function runRandomGenerator(
  input: RandomGeneratorInput,
  ctx: ToolContext,
): ToolOutcome<RandomGeneratorOutput> {
  const source = new RandomSource(ctx)
  if (input.mode === 'number') {
    const value = source.range(input.min, input.max)
    return toolOk({ value: String(value), numeric: value })
  }
  if (input.mode === 'string') {
    let out = ''
    for (let i = 0; i < input.length; i++) out += source.pick(input.charset.split(''))
    return toolOk({ value: out, numeric: NaN })
  }
  const bytes = new Uint8Array(3)
  for (let i = 0; i < 3; i++) bytes[i] = source.byte()
  const value = `#${padNumber(bytes[0], 2)}${padNumber(bytes[1], 2)}${padNumber(bytes[2], 2)}`
  return toolOk({ value, numeric: NaN })
}

export function renderRandomGenerator(out: RandomGeneratorOutput, _ctx: ToolContext): string {
  return out.value
}

export const randomGeneratorTool: ToolDefinition<RandomGeneratorInput, RandomGeneratorOutput> = {
  id: 'random-generator',
  tier: 'T1',
  capabilities: [],
  inputs: [
    {
      name: 'mode',
      kind: 'select',
      required: false,
      labelKey: 'tools.mode',
      default: 'number',
      options: [
        { value: 'number', labelKey: 'tools.randomNumber' },
        { value: 'string', labelKey: 'tools.randomString' },
        { value: 'color', labelKey: 'tools.randomColor' },
      ],
    },
    { name: 'min', kind: 'number', required: false, labelKey: 'tools.min', default: 1 },
    { name: 'max', kind: 'number', required: false, labelKey: 'tools.max', default: 100 },
    { name: 'length', kind: 'number', required: false, labelKey: 'tools.length', default: 8 },
    { name: 'charset', kind: 'text', required: false, labelKey: 'tools.charset' },
  ],
  parse: parseRandomGenerator,
  run: runRandomGenerator,
  render: renderRandomGenerator,
}
