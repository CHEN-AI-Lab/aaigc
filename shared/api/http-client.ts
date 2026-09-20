// ─────────────────────────────────────────────────────────────────────────────
// 统一 API 客户端（CLI / 小程序 / App / 桌面共用；Web 也可用同源 baseUrl）
//   · 统一 header（Authorization: Bearer、Accept-Language、X-AAIGC-Platform）
//   · 401 tokenExpired → refresh → 重试一次
//   · 错误响应统一转 ApiError（带 ApiErrorCode，可直接当 i18n key）
// ─────────────────────────────────────────────────────────────────────────────

import type { TokenPair, TokenStore } from '../types/api'
import type { ApiErrorCode } from '../constants/error-codes'
import { isApiErrorCode } from '../constants/error-codes'

export interface ApiClientOptions {
  baseUrl: string
  tokenStore: TokenStore
  platform: string
  locale?: string
  /** 自定义 fetch（小程序 wx.request 适配 / 测试注入） */
  fetchImpl?: typeof fetch
  onTokenRefreshed?: (pair: TokenPair) => Promise<void> | void
  onUnauthorized?: () => Promise<void> | void
}

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly params?: Record<string, string | number>

  constructor(code: ApiErrorCode, status: number, params?: Record<string, string | number>) {
    super(code)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.params = params
  }
}

function resolveFetch(options: ApiClientOptions): typeof fetch {
  if (options.fetchImpl) return options.fetchImpl
  if (typeof fetch === 'function') return fetch
  throw new ApiError('networkFailed', 0)
}

interface ErrorPayload {
  code: ApiErrorCode
  params?: Record<string, string | number>
}

/**
 * 读出 `{ error, errorParams }`，不做任何抛出。
 *
 * 走 `response.clone()`：**不消费**原始 body，调用方之后还能再 `json()` 一次
 * （401 分支要先看错误码决定要不要 refresh，最终抛错时还可能要再读一次）。
 * 响应体不是 JSON / error 不是已知错误码 → 回落 requestFailed。
 */
async function readErrorPayload(response: Response): Promise<ErrorPayload> {
  try {
    const body: unknown = await response.clone().json()
    if (body && typeof body === 'object') {
      const record = body as Record<string, unknown>
      const payload: ErrorPayload = { code: 'requestFailed' }
      if (typeof record.error === 'string' && isApiErrorCode(record.error)) {
        payload.code = record.error
      }
      if (record.errorParams && typeof record.errorParams === 'object') {
        payload.params = record.errorParams as Record<string, string | number>
      }
      return payload
    }
  } catch {
    // 响应体不是 JSON：保留默认错误码
  }
  return { code: 'requestFailed' }
}

async function parseErrorBody(response: Response): Promise<never> {
  const payload = await readErrorPayload(response)
  throw new ApiError(payload.code, response.status, payload.params)
}

export interface ApiClient {
  get<T>(path: string, init?: RequestInit): Promise<T>
  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>
  patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>
  delete<T>(path: string, init?: RequestInit): Promise<T>
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const doFetch = resolveFetch(options)
  let refreshInFlight: Promise<TokenPair | null> | null = null

  async function refreshToken(): Promise<TokenPair | null> {
    if (refreshInFlight) return refreshInFlight
    refreshInFlight = (async () => {
      const current = await options.tokenStore.get()
      if (!current) return null
      try {
        const response = await doFetch(`${options.baseUrl}/api/auth/token/refresh`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ refreshToken: current.refreshToken }),
        })
        if (!response.ok) {
          await options.tokenStore.clear()
          if (options.onUnauthorized) await options.onUnauthorized()
          return null
        }
        const pair = (await response.json()) as TokenPair
        await options.tokenStore.set(pair)
        if (options.onTokenRefreshed) await options.onTokenRefreshed(pair)
        return pair
      } catch {
        return null
      }
    })()
    try {
      return await refreshInFlight
    } finally {
      refreshInFlight = null
    }
  }

  async function request<T>(method: string, path: string, body?: unknown, init?: RequestInit): Promise<T> {
    const url = path.startsWith('http') ? path : `${options.baseUrl}${path}`
    const pair = await options.tokenStore.get()
    const headers: Record<string, string> = {
      accept: 'application/json',
      'x-aaigc-platform': options.platform,
      ...(options.locale ? { 'accept-language': options.locale } : {}),
      ...((init?.headers as Record<string, string> | undefined) ?? {}),
    }
    if (pair?.accessToken) headers.authorization = `Bearer ${pair.accessToken}`
    if (body !== undefined) headers['content-type'] = 'application/json'

    const response = await doFetch(url, {
      ...init,
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })

    if (response.status === 401 && pair) {
      const payload = await readErrorPayload(response)
      // 只有「过期」值得 refresh 后重试：tokenInvalid（签名不对 / 结构非法）重试多少次都是 401，
      // 无差别重试会把一次误操作放大成 N 次请求，还会把真正的错误原因（坏 token）掩盖成
      // 「refresh 失败」。这里显式区分，tokenInvalid 直接抛给调用方去重新登录。
      if (payload.code === 'tokenExpired') {
        const refreshed = await refreshToken()
        if (refreshed) {
          const retryResponse = await doFetch(url, {
            ...init,
            method,
            headers: { ...headers, authorization: `Bearer ${refreshed.accessToken}` },
            ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
          })
          if (!retryResponse.ok) await parseErrorBody(retryResponse)
          return (await retryResponse.json()) as T
        }
        if (options.onUnauthorized) await options.onUnauthorized()
      }
      throw new ApiError(payload.code, response.status, payload.params)
    }

    if (!response.ok) await parseErrorBody(response)
    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  }

  return {
    get: <T>(path: string, init?: RequestInit) => request<T>('GET', path, undefined, init),
    post: <T>(path: string, body?: unknown, init?: RequestInit) => request<T>('POST', path, body, init),
    patch: <T>(path: string, body?: unknown, init?: RequestInit) => request<T>('PATCH', path, body, init),
    delete: <T>(path: string, init?: RequestInit) => request<T>('DELETE', path, undefined, init),
  }
}
