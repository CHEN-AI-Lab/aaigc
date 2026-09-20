// ─────────────────────────────────────────────────────────────────────────────
// App 运行时环境 —— 站点 API 基址的唯一来源
//
// SK-8：禁止硬编码域名 / 禁止非空 fallback。App **不猜**任何地址：
// 未配置就是未配置，联网动作会明确失败并把配置方法告诉用户，而不是悄悄指向某个站点。
//
// 内联约束（很重要）：
//   Metro / babel-preset-expo 只对 `process.env.EXPO_PUBLIC_<NAME>` 这种
//   **字面量成员访问**做静态内联。写成 `process.env[name]` 编译后拿到的是
//   undefined —— 所以下面这一行必须是静态形式，不要"重构"成动态读取。
// ─────────────────────────────────────────────────────────────────────────────

/** 环境变量名（同时用于设置页展示，让用户知道该配什么） */
export const API_BASE_URL_ENV = 'EXPO_PUBLIC_AAIGC_API_BASE_URL'

const RAW_API_BASE_URL: string | undefined = process.env.EXPO_PUBLIC_AAIGC_API_BASE_URL

/** 站点基址的三种状态：已配置 / 没配 / 配了但不是合法 http(s) origin */
export type ApiEndpoint =
  | { readonly ok: true; readonly baseUrl: string }
  | { readonly ok: false; readonly reason: 'missing' | 'invalid'; readonly raw: string }

/**
 * 归一化站点基址：去尾部斜杠 + 校验是 http(s) origin。
 * 非法取值一律判为 invalid —— 不"修一修凑合用"，也不回落到任何内置地址。
 */
export function normalizeApiBaseUrl(raw: string | undefined): ApiEndpoint {
  const trimmed = (raw ?? '').trim().replace(/\/+$/, '')
  if (trimmed.length === 0) return { ok: false, reason: 'missing', raw: '' }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { ok: false, reason: 'invalid', raw: trimmed }
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, reason: 'invalid', raw: trimmed }
  }
  if (parsed.host.length === 0) return { ok: false, reason: 'invalid', raw: trimmed }
  return { ok: true, baseUrl: trimmed }
}

/** 打包时定格的站点基址状态（App 生命周期内不变） */
export const apiEndpoint: ApiEndpoint = normalizeApiBaseUrl(RAW_API_BASE_URL)

/** 需要联网时调用：未配置 / 非法就抛，绝不返回一个"看起来能用"的地址 */
export function requireApiBaseUrl(): string {
  if (apiEndpoint.ok) return apiEndpoint.baseUrl
  throw new AppConfigError(apiEndpoint)
}

/** 配置错误 —— 与网络错误分开，UI 要给出"怎么修"而不是"重试" */
export class AppConfigError extends Error {
  readonly reason: 'missing' | 'invalid'
  readonly raw: string

  constructor(endpoint: Extract<ApiEndpoint, { ok: false }>) {
    super(`API base URL is ${endpoint.reason} (${API_BASE_URL_ENV})`)
    this.name = 'AppConfigError'
    this.reason = endpoint.reason
    this.raw = endpoint.raw
  }
}
