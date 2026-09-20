// ─────────────────────────────────────────────────────────────────────────────
// 参数解析 —— 基于 node:util 的 parseArgs（零依赖）
//
// 一次解析全部已知选项：strict 模式下未知选项直接抛错，由这里收敛成
// cliUsage（退出码 2），避免「打错选项被静默忽略」这种最难查的 CLI 事故。
// ─────────────────────────────────────────────────────────────────────────────

import { parseArgs } from 'node:util'
import { usageError } from './errors'

export interface CliArgValues {
  json?: boolean
  color?: boolean
  'no-color'?: boolean
  help?: boolean
  version?: boolean
  lang?: string
  'api-base-url'?: string
  'config-dir'?: string
  input?: string
  tier?: string
  capability?: string[]
  since?: string
  type?: string
}

export interface ParsedCliArgs {
  positionals: string[]
  values: CliArgValues
}

const OPTIONS = {
  json: { type: 'boolean' },
  color: { type: 'boolean' },
  'no-color': { type: 'boolean' },
  help: { type: 'boolean' },
  version: { type: 'boolean' },
  lang: { type: 'string' },
  'api-base-url': { type: 'string' },
  'config-dir': { type: 'string' },
  input: { type: 'string' },
  tier: { type: 'string' },
  capability: { type: 'string', multiple: true },
  since: { type: 'string' },
  type: { type: 'string' },
} as const

export function parseCliArgs(argv: readonly string[]): ParsedCliArgs {
  try {
    const parsed = parseArgs({
      args: [...argv],
      options: OPTIONS,
      strict: true,
      allowPositionals: true,
    })
    return { positionals: parsed.positionals, values: parsed.values as CliArgValues }
  } catch (error) {
    // parseArgs 抛的是 TypeError（ERR_PARSE_ARGS_*），原始 message 直接给用户看
    const detail = error instanceof Error ? error.message : String(error)
    throw usageError(undefined, detail)
  }
}
