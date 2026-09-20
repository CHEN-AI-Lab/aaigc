// ─────────────────────────────────────────────────────────────────────────────
// CLI 错误模型
//
// 三个来源：
//   1. API 错误 —— 错误码直接复用 shared 的 `ApiErrorCode`（= i18n key，见
//      shared/constants/error-codes.ts），文案由 shared/messages 的 errors.* 渲染；
//   2. 工具错误 —— 复用 shared 的 `ToolErrorCode` + `ToolError.messageKey`，
//      文案由 shared/messages 的 tools.* 渲染（工具错误不经 HTTP，故码集不同）；
//   3. CLI 本地错误 —— 请求根本发不出去（用法错、配置缺失）。ApiErrorCode 里没有
//      语义对得上的取值，故单独定义两个本地码；它们**不冒充** API 错误码，
//      机器消费方据此可以区分「服务端拒绝」与「本地没配对」。
// ─────────────────────────────────────────────────────────────────────────────

import type { ApiErrorCode } from 'shared/constants/error-codes'
import { isApiErrorCode, TOOL_ERROR_CODES } from 'shared/constants/error-codes'
import type { ToolError, ToolErrorCode } from 'shared/types/tool'
import { EXIT_FAILURE, EXIT_USAGE, type CliExitCode } from './exit-codes'

/** CLI 本地错误码（与 ApiErrorCode / ToolErrorCode 均不重叠） */
export const CLI_ERROR_CODES = ['cliUsage', 'cliConfigMissing'] as const

export type CliErrorCode = (typeof CLI_ERROR_CODES)[number]

/** 错误响应体里可能出现的全部码 */
export type CliReportableCode = ApiErrorCode | ToolErrorCode | CliErrorCode

export interface CliErrorInit {
  code: CliReportableCode
  exitCode: CliExitCode
  params?: Record<string, string | number>
  /** 次要诊断信息（引擎原始报错等），端侧自行决定是否展示 */
  detail?: string
  /** 文案 key 覆盖：工具错误自带 messageKey（如 tools.invalidJson） */
  messageKey?: string
}

/** CLI 内部统一错误类型：携带错误码 + 退出码，由 index.ts 单点转成 stderr 输出 */
export class CliError extends Error {
  readonly code: CliReportableCode
  readonly exitCode: CliExitCode
  readonly params?: Record<string, string | number>
  readonly detail?: string
  readonly messageKey?: string

  constructor(init: CliErrorInit) {
    super(init.detail ? `${init.code}: ${init.detail}` : init.code)
    this.name = 'CliError'
    this.code = init.code
    this.exitCode = init.exitCode
    if (init.params) this.params = init.params
    if (init.detail) this.detail = init.detail
    if (init.messageKey) this.messageKey = init.messageKey
  }
}

/**
 * 用法错误 → 退出码 2。
 * `code` 缺省为本地码 cliUsage；当 shared 里有更精确的码（missingToolId /
 * invalidParams / invalidJson …）时优先用它，这样机器消费方拿到的错误码更具体。
 */
export function usageErrorFor(
  code: CliReportableCode,
  params?: Record<string, string | number>,
  detail?: string,
): CliError {
  return new CliError({
    code,
    exitCode: EXIT_USAGE,
    ...(params ? { params } : {}),
    ...(detail ? { detail } : {}),
  })
}

export function usageError(
  params?: Record<string, string | number>,
  detail?: string,
): CliError {
  return usageErrorFor('cliUsage', params, detail)
}

/** 必需配置缺失（如 AAIGC_CLI_API_BASE_URL 未设置）→ 退出码 2，绝不悄悄兜底 */
export function configMissingError(
  params?: Record<string, string | number>,
  detail?: string,
): CliError {
  return new CliError({
    code: 'cliConfigMissing',
    exitCode: EXIT_USAGE,
    ...(params ? { params } : {}),
    ...(detail ? { detail } : {}),
  })
}

/** 业务失败（API 报错 / 未登录 / 设备码失效 …）→ 退出码 1 */
export function failureError(
  code: CliReportableCode,
  params?: Record<string, string | number>,
  detail?: string,
): CliError {
  return new CliError({
    code,
    exitCode: EXIT_FAILURE,
    ...(params ? { params } : {}),
    ...(detail ? { detail } : {}),
  })
}

/** 工具执行失败（ToolOutcome.error）→ 退出码 1，保留工具自己的错误码与文案 key */
export function toolFailureError(error: ToolError): CliError {
  return new CliError({
    code: error.code,
    exitCode: EXIT_FAILURE,
    messageKey: error.messageKey,
    ...(error.params ? { params: error.params } : {}),
    ...(error.detail ? { detail: error.detail } : {}),
  })
}

function isCliReportableCode(value: string): value is CliReportableCode {
  return (
    (CLI_ERROR_CODES as readonly string[]).includes(value) ||
    isApiErrorCode(value) ||
    (TOOL_ERROR_CODES as readonly string[]).includes(value)
  )
}

/** 读 Node 的 `errno` 风格错误码（不做 any 断言） */
export function errorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code
    return typeof code === 'string' ? code : undefined
  }
  return undefined
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * 把任意抛出物收敛成 CliError，保证 index.ts 只处理一种错误类型。
 *
 * 注意 shared/api/http-client 的 `request()` **不包装 fetch 自身的网络异常**
 * （DNS 失败 / 连接被拒会直接抛 TypeError），所以这里必须兜住非 ApiError 的抛出物。
 */
export function toCliError(error: unknown): CliError {
  if (error instanceof CliError) return error
  const code = errorCode(error)
  if (code !== undefined && isCliReportableCode(code)) {
    return failureError(code, undefined, errorMessage(error))
  }
  return failureError('networkFailed', undefined, errorMessage(error))
}
