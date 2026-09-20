// ─────────────────────────────────────────────────────────────────────────────
// 工具运行时 —— 唯一的执行入口
//
//   T1 / T2 → 本地执行：shared/tools/registry.ts 的 runToolById()
//   T3      → 远程执行：站点 API（第三方端点列表只存在于服务端 env，客户端不持有）
//
// 为什么 T3 不本地跑：ip-lookup / dns-lookup 的查询端点来自服务端环境变量
// （IP_GEO_ENDPOINTS / DNS_DOH_ENDPOINTS），客户端没有、也不该有这些第三方地址。
// 走站点 API 还有额外好处：服务端限流 + SSRF 防护（私有网段不外发）继续生效。
//
// 结果渲染统一走 ToolDefinition.render()，因此 38 个工具不需要各写一套结果 UI；
// 表单则由 ToolDefinition.inputs 驱动（见 src/ui/ToolInputForm.tsx）。
// ─────────────────────────────────────────────────────────────────────────────

import type { ApiClient } from 'shared/api/http-client'
import { ApiError } from 'shared/api/http-client'
import { getTool, listTools, runToolById, toolFail } from 'shared/tools'
import type { ToolContext, ToolDefinition, ToolId, ToolOutcome } from 'shared/types/tool'
import { AppConfigError } from './env'

/** 工具列表（按注册表顺序；UI 自行分组/过滤） */
export function listAppTools(): ToolDefinition[] {
  return listTools()
}

export function getAppTool(id: string): ToolDefinition | undefined {
  return getTool(id)
}

/**
 * 远程执行适配器 —— 把站点 API 的响应体收敛成 `ToolDefinition.render()` 能消费的形状。
 *
 * 只登记**站点侧确实存在对应路由**的 T3 工具；没有登记的一律走本地（并在
 * `canRunRemotely()` 返回 false），UI 据此提示"该工具暂不支持"。
 */
interface RemoteToolHandler {
  /** 同源相对路径，不含域名（域名由 EXPO_PUBLIC_AAIGC_API_BASE_URL 决定） */
  readonly path: string
  /** 响应体 → 渲染输入；结构不认识返回 null（不猜、不填假数据） */
  toOutput(body: unknown): unknown | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/**
 * GET /api/tools/ip-lookup 的响应体是
 *   { ip, country?, region?, city?, isp?, usage? } 或降级形态 { ip }。
 *
 * 注意：路由在"私有/保留地址"与"所有 provider 都失败"两种情况下都只回 `{ ip }`，
 * 客户端无法区分 → 这里**不伪造** `IpLookupOutput.isPrivate`，只还原能确证的字段。
 * （renderIpLookup 只用 ip/country/region/city/isp/usage，不读 isPrivate。）
 */
function toIpLookupOutput(body: unknown): unknown | null {
  if (!isRecord(body)) return null
  const ip = readText(body.ip)
  if (ip.length === 0) return null
  return {
    ip,
    country: readText(body.country),
    region: readText(body.region),
    city: readText(body.city),
    isp: readText(body.isp),
    usage: readText(body.usage).length > 0 ? readText(body.usage) : 'unknown',
  }
}

const REMOTE_TOOLS: Partial<Record<ToolId, RemoteToolHandler>> = {
  'ip-lookup': { path: '/api/tools/ip-lookup', toOutput: toIpLookupOutput },
}

/** 该工具在 App 上是否有远程执行通道（UI 用它决定按钮可不可点） */
export function canRunRemotely(id: string): boolean {
  const tool = getTool(id)
  if (!tool) return false
  if (tool.tier !== 'T3') return false
  return REMOTE_TOOLS[tool.id] !== undefined
}

export interface ToolRunDeps {
  api: ApiClient
  /** BCP-47，远程接口的展示层本地化参数 */
  locale: string
}

async function runRemoteTool(
  tool: ToolDefinition,
  raw: Record<string, unknown>,
  deps: ToolRunDeps,
): Promise<ToolOutcome<unknown>> {
  const handler = REMOTE_TOOLS[tool.id]
  if (!handler) return toolFail('unsupportedPlatform', 'tools.unsupportedPlatform')

  // 入参仍走 shared 的 parse：本地能挡下的非法输入不必浪费一次网络往返
  const parsed = tool.parse(raw, { ...EMPTY_CONTEXT })
  if (!parsed.ok) return parsed

  try {
    const body = await deps.api.get<unknown>(
      `${handler.path}?lang=${encodeURIComponent(deps.locale)}`,
    )
    const output = handler.toOutput(body)
    if (output === null) return toolFail('networkFailed', 'tools.networkFailed')
    return { ok: true, data: output }
  } catch (error) {
    if (error instanceof AppConfigError) {
      return toolFail('networkFailed', 'tools.networkFailed', undefined, error.message)
    }
    if (error instanceof ApiError) {
      return toolFail('networkFailed', 'tools.networkFailed', undefined, error.code)
    }
    return toolFail('networkFailed', 'tools.networkFailed')
  }
}

/**
 * 远程分支只用 parse 做入参校验，不需要真实 ctx。
 * 这里的占位值不会外泄：parse() 按契约不做 IO，也不读时间/随机源。
 */
const EMPTY_CONTEXT: ToolContext = {
  locale: 'en',
  timezone: 'UTC',
  now: () => 0,
  randomBytes: (length: number) => new Uint8Array(length),
}

/** 执行工具：T1/T2 本地、T3 远程；未知 id 回 toolNotFound */
export async function runAppTool(
  id: string,
  raw: Record<string, unknown>,
  ctx: ToolContext,
  deps: ToolRunDeps,
): Promise<ToolOutcome<unknown>> {
  const tool = getTool(id)
  if (!tool) return toolFail('invalidInput', 'tools.toolNotFound')

  if (tool.tier === 'T3') return runRemoteTool(tool, raw, deps)
  return runToolById(id, raw, ctx)
}

/** 结果 → 文本（CLI / 小程序 / App 共用的同一条渲染路径） */
export function renderAppToolResult(id: string, data: unknown, ctx: ToolContext): string {
  const tool = getTool(id)
  if (!tool) return ''
  return tool.render(data, ctx)
}
