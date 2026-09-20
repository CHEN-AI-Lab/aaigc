// uuid-generator —— T1 纯计算：UUID v4（随机源经 ToolContext 注入）

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { RandomSource, toolOk, readInt, clampInt } from './common'

export interface UuidGeneratorInput {
  count: number
}

export interface UuidGeneratorOutput {
  values: string[]
  text: string
}

const HEX = '0123456789abcdef'

/** 生成单个 UUID v4（RFC 4122 §4.4） */
export function formatUuidV4(bytes: Uint8Array): string | null {
  if (bytes.length < 16) return null
  const b = new Uint8Array(16)
  b.set(bytes.subarray(0, 16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80

  let out = ''
  for (let i = 0; i < 16; i++) {
    out += HEX[b[i] >> 4]
    out += HEX[b[i] & 0x0f]
    if (i === 3 || i === 5 || i === 7 || i === 9) out += '-'
  }
  return out
}

export function parseUuidGenerator(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<UuidGeneratorInput> {
  return toolOk({ count: clampInt(readInt(raw, 'count', 1), 1, 100) })
}

export function runUuidGenerator(
  input: UuidGeneratorInput,
  ctx: ToolContext,
): ToolOutcome<UuidGeneratorOutput> {
  const source = new RandomSource(ctx)
  const values: string[] = []
  for (let i = 0; i < input.count; i++) {
    const bytes = new Uint8Array(16)
    for (let j = 0; j < 16; j++) bytes[j] = source.byte()
    const uuid = formatUuidV4(bytes)
    if (uuid === null) break
    values.push(uuid)
  }
  return toolOk({ values, text: values.join('\n') })
}

export function renderUuidGenerator(out: UuidGeneratorOutput, _ctx: ToolContext): string {
  return out.text
}

export const uuidGeneratorTool: ToolDefinition<UuidGeneratorInput, UuidGeneratorOutput> = {
  id: 'uuid-generator',
  tier: 'T1',
  capabilities: [],
  inputs: [
    { name: 'count', kind: 'number', required: false, labelKey: 'tools.count', default: 1 },
  ],
  parse: parseUuidGenerator,
  run: runUuidGenerator,
  render: renderUuidGenerator,
}
