// `aaigc tools list` / `aaigc tools run <toolId>`
//
// 这是 CLI 最大的价值点：38 个工具是 shared/tools 下的纯函数，不需要服务端即可执行。
// 因此这两条命令**不要求登录、不要求配置 API 基址**，断网也能用。
// 执行一律走 shared/tools/registry.ts 的 runToolById / renderToolById，
// 时间与随机源经 createCliToolContext 注入（见 core/tool-context.ts）。

import { getTool, listTools, renderToolById, runToolById, type ToolFilter } from 'shared/tools'
import type { ToolCapability, ToolDefinition, ToolInputField, ToolTier } from 'shared/types/tool'
import type { CliArgValues } from '../core/args'
import { failureError, toolFailureError, usageError, usageErrorFor } from '../core/errors'
import { readOrCreateDeviceId } from '../core/device-id'
import { reportToolRun } from '../core/telemetry'
import { createCliToolContext } from '../core/tool-context'
import { renderTable } from '../format/table'
import { localizedToolName } from './tool-label'
import type { CommandContext } from './types'

interface ToolInputSummary {
  name: string
  kind: ToolInputField['kind']
  required: boolean
  label: string
  default?: string | number | boolean
  options?: { value: string; label: string }[]
}

interface ToolSummary {
  id: string
  tier: ToolTier
  capabilities: ToolCapability[]
  name: string
  description: string
  inputs: ToolInputSummary[]
}

/** 端侧可用的 tier / capability 取值直接从注册表推导，避免在 CLI 里再写一份常量 */
function knownTiers(): ToolTier[] {
  return [...new Set(listTools().map((tool) => tool.tier))]
}

function knownCapabilities(): ToolCapability[] {
  return [...new Set(listTools().flatMap((tool) => tool.capabilities))]
}

function summarize(ctx: CommandContext, tool: ToolDefinition): ToolSummary {
  const { translator } = ctx
  return {
    id: tool.id,
    tier: tool.tier,
    capabilities: tool.capabilities,
    name: localizedToolName(translator, tool.id),
    description: translator.tOrNull(`tools.${tool.id}.description`) ?? '',
    inputs: tool.inputs.map((field) => ({
      name: field.name,
      kind: field.kind,
      required: field.required,
      label: translator.t(field.labelKey),
      ...(field.default === undefined ? {} : { default: field.default }),
      ...(field.options
        ? {
            options: field.options.map((option) => ({
              value: option.value,
              label: translator.t(option.labelKey),
            })),
          }
        : {}),
    })),
  }
}

function parseTier(raw: string | undefined): ToolTier | undefined {
  if (raw === undefined) return undefined
  const tiers = knownTiers()
  if (!(tiers as string[]).includes(raw)) {
    throw usageError(
      { value: raw, tiers: tiers.join(' | ') },
      `Unknown --tier value: ${raw} (expected one of ${tiers.join(', ')})`,
    )
  }
  return raw as ToolTier
}

function parseCapabilities(raw: string[] | undefined): ToolCapability[] {
  if (raw === undefined || raw.length === 0) return []
  const known = knownCapabilities()
  const unknown = raw.filter((value) => !(known as string[]).includes(value))
  if (unknown.length > 0) {
    throw usageError(
      { value: unknown.join(', '), capabilities: known.join(' | ') },
      `Unknown --capability value: ${unknown.join(', ')} (expected one of ${known.join(', ')})`,
    )
  }
  return raw as ToolCapability[]
}

export async function toolsListCommand(ctx: CommandContext, values: CliArgValues): Promise<void> {
  const tier = parseTier(values.tier)
  const capabilities = parseCapabilities(values.capability)

  const filter: ToolFilter = {}
  if (tier) filter.tier = tier
  if (capabilities.length > 0) filter.capabilities = capabilities

  const summaries = listTools(filter).map((tool) => summarize(ctx, tool))

  if (ctx.io.json) {
    ctx.io.writeJson({ tools: summaries })
    return
  }

  if (summaries.length === 0) {
    ctx.io.write(ctx.translator.t('tools.noResults'))
    return
  }

  const { translator } = ctx
  const rows = summaries.map((summary) => [
    summary.id,
    summary.tier,
    summary.capabilities.join(','),
    summary.name,
  ])
  ctx.io.write(
    renderTable(
      [
        translator.t('cli.toolsColId'),
        translator.t('cli.toolsColTier'),
        translator.t('cli.toolsColCaps'),
        translator.t('cli.toolsColName'),
      ],
      rows,
      { borders: ctx.io.stdoutIsTty },
    ),
  )
}

function toUint8Array(chunk: unknown): Uint8Array {
  if (typeof chunk === 'string') return new TextEncoder().encode(chunk)
  if (chunk instanceof Uint8Array) return chunk
  throw usageError(undefined, 'Unexpected stdin chunk type')
}

async function readStdin(): Promise<string> {
  const chunks: Uint8Array[] = []
  for await (const chunk of process.stdin) {
    chunks.push(toUint8Array(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}

/** `--input '<json>'` / `--input -` / 未给参数时读管道；三者都拿不到就报用法错误 */
async function resolveToolInput(
  raw: string | undefined,
  ctx: CommandContext,
): Promise<Record<string, unknown>> {
  let text: string
  if (raw === undefined) {
    if (process.stdin.isTTY === true) {
      throw usageError(undefined, ctx.translator.t('cli.errInputRequired'))
    }
    ctx.io.diag(ctx.translator.t('cli.toolsReadingStdin'))
    text = await readStdin()
  } else if (raw === '-') {
    ctx.io.diag(ctx.translator.t('cli.toolsReadingStdin'))
    text = await readStdin()
  } else {
    text = raw
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw usageErrorFor('invalidJson', undefined, ctx.translator.t('cli.errInputNotObject'))
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw usageErrorFor('invalidParams', undefined, ctx.translator.t('cli.errInputNotObject'))
  }
  return parsed as Record<string, unknown>
}

export async function toolsRunCommand(
  ctx: CommandContext,
  positionals: string[],
  values: CliArgValues,
): Promise<void> {
  const toolId = positionals[0]
  if (toolId === undefined || toolId.length === 0) throw usageErrorFor('missingToolId')

  const tool = getTool(toolId)
  if (!tool) {
    throw failureError('toolNotFound', undefined, `Unknown tool id: ${toolId}`)
  }

  const input = await resolveToolInput(values.input, ctx)
  const toolContext = createCliToolContext({ locale: ctx.config.lang, tier: tool.tier })

  if (ctx.io.json) {
    // 机器消费：直接给 runToolById 的结构化结果，不经过 render 的文本化
    const outcome = await runToolById(toolId, input, toolContext)
    if (!outcome.ok) throw toolFailureError(outcome.error)
    ctx.io.writeJson(outcome.data)
  } else {
    // 人读：用工具自带的 render（与 Web / 小程序纯文本兜底同源）
    const outcome = await renderToolById(toolId, input, toolContext)
    if (!outcome.ok) throw toolFailureError(outcome.error)
    ctx.io.write(outcome.data)
  }

  if (ctx.config.telemetryEnabled) {
    await reportToolRun({
      deviceId: await readOrCreateDeviceId(ctx.config.configDir),
      locale: ctx.config.lang,
      tool: toolId,
    })
  }
}
