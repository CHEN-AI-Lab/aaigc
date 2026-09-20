// jwt-decoder —— T1 纯计算：JWT header/payload 解析（不校验签名）

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolFail, toolOk, readString, base64ToText } from './common'

export interface JwtDecoderInput {
  token: string
}

export interface JwtDecoderOutput {
  header: string
  payload: string
  algorithm: string | null
  expiresAt: number | null
}

/** base64url → 标准 base64 */
function normalizeSegment(segment: string): string {
  let out = segment.replace(/-/g, '+').replace(/_/g, '/')
  const remainder = out.length % 4
  if (remainder === 2) out += '=='
  else if (remainder === 3) out += '='
  else if (remainder === 1) out += '==='
  return out
}

export function parseJwtDecoder(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<JwtDecoderInput> {
  const token = (readString(raw, 'token') ?? '').trim()
  if (token.length === 0) return toolFail('emptyInput', 'tools.emptyInput')
  return toolOk({ token })
}

export function runJwtDecoder(input: JwtDecoderInput, _ctx: ToolContext): ToolOutcome<JwtDecoderOutput> {
  const parts = input.token.split('.')
  if (parts.length !== 3 || parts[0].length === 0 || parts[1].length === 0) {
    return toolFail('invalidJwt', 'tools.invalidJwt')
  }

  const headerText = base64ToText(normalizeSegment(parts[0]))
  const payloadText = base64ToText(normalizeSegment(parts[1]))
  if (headerText === null || payloadText === null) {
    return toolFail('invalidJwt', 'tools.invalidJwt')
  }

  let header: unknown
  let payload: unknown
  try {
    header = JSON.parse(headerText)
    payload = JSON.parse(payloadText)
  } catch {
    return toolFail('invalidJwt', 'tools.invalidJwt')
  }

  let algorithm: string | null = null
  let expiresAt: number | null = null
  if (header && typeof header === 'object') {
    const alg = (header as Record<string, unknown>).alg
    if (typeof alg === 'string') algorithm = alg
  }
  if (payload && typeof payload === 'object') {
    const exp = (payload as Record<string, unknown>).exp
    if (typeof exp === 'number') expiresAt = exp
  }

  return toolOk({
    header: JSON.stringify(header, null, 2),
    payload: JSON.stringify(payload, null, 2),
    algorithm,
    expiresAt,
  })
}

export function renderJwtDecoder(out: JwtDecoderOutput, _ctx: ToolContext): string {
  return `HEADER\n${out.header}\n\nPAYLOAD\n${out.payload}`
}

export const jwtDecoderTool: ToolDefinition<JwtDecoderInput, JwtDecoderOutput> = {
  id: 'jwt-decoder',
  tier: 'T1',
  capabilities: [],
  inputs: [
    { name: 'token', kind: 'textarea', required: true, labelKey: 'tools.jwtPlaceholder' },
  ],
  parse: parseJwtDecoder,
  run: runJwtDecoder,
  render: renderJwtDecoder,
}
