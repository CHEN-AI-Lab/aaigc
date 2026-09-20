// ─────────────────────────────────────────────────────────────────────────────
// 统一失败响应构造（SK-1 / K2）
//
// 硬约束：响应体形状 `{ error: <ApiErrorCode>, errorParams?, ...extra }` 不可变。
// Web 端把 `error` 的值**直接当 i18n key 消费**：
//   AccountClient.tsx → t(data.error)
//   LoginClient.tsx / RegisterClient.tsx → err(data.error)
// 因此这里只做两件事：
//   1. 把 code 收敛为 `ApiErrorCode` 联合类型 → 拼错错误码变成编译错误；
//   2. 状态码默认取 `API_ERROR_STATUS` 映射表。
// 字段名、字段值语义一律不动。
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { apiErrorBody, statusForErrorCode, type ApiErrorCode } from 'shared/constants/error-codes'

export interface ErrorResponseOptions {
  /**
   * 显式覆盖状态码。
   * 仅用于**保持既有路由的历史状态码**（例如 user/delete 的 verifyFailed 历史上是 401，
   * 而映射表是 400）——收敛错误码集合不应顺带改变 Web 已依赖的 HTTP 行为。
   */
  status?: number
  /** 既有响应体里的额外字段（minutesRemaining / retryAfter 等），保持形状不变 */
  extra?: Record<string, unknown>
  headers?: HeadersInit
}

export function errorResponse(code: ApiErrorCode, options: ErrorResponseOptions = {}): NextResponse {
  const status = options.status ?? statusForErrorCode(code)
  return NextResponse.json(
    { ...apiErrorBody(code), ...(options.extra ?? {}) },
    { status, ...(options.headers ? { headers: options.headers } : {}) },
  )
}

/** 限流响应：状态码固定 429 并带 Retry-After（既有行为） */
export function tooManyRequestsResponse(resetAtMs: number, extra?: Record<string, unknown>): NextResponse {
  const seconds = Math.max(1, Math.ceil((resetAtMs - Date.now()) / 1000))
  return errorResponse('tooManyRequests', {
    extra,
    headers: { 'Retry-After': String(seconds) },
  })
}
