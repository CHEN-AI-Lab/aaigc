import Taro from '@tarojs/taro'

// ⚠️ 不要写 `from 'shared/api'`：shared/package.json 的 exports 只有 `./api/*`，
//    没有 `./api` 本身，webpack 会报 "not exported"。与 CLI 保持一致用子路径。
import { createApiClient } from 'shared/api/http-client'
import { createFavoritesApi } from 'shared/api/favorites'
import type { ApiClient } from 'shared/api/http-client'
import type { TokenPair, TokenStore } from 'shared/types/api'

import { apiBaseUrl, clientId, isApiBaseUrlConfigured } from './env'

// ─────────────────────────────────────────────────────────────────────────────
// 小程序侧的 HTTP / Token 适配层。
//
// shared/api 是五端共用的 API 客户端，它只认两样东西：
//   1) 一个 fetch 形状的实现（status / ok / json() / clone()）
//   2) 一个 TokenStore（get / set / clear）
// 两端的具体实现由各自端提供 —— 这里就是小程序版本。
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_STORAGE_KEY = 'aaigc.weapp.token'

/** 构造 shared/api 需要的 Response 形状（只实现它真正用到的四个成员） */
function makeResponse(status: number, text: string): Response {
  const parse = (): unknown => {
    if (text.length === 0) return null
    try {
      return JSON.parse(text) as unknown
    } catch {
      return null
    }
  }

  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(parse()),
    text: () => Promise.resolve(text),
    clone() {
      return makeResponse(status, text)
    },
  } as unknown as Response
}

/** wx.request → fetch 形状 */
function taroFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : String(input)

  return new Promise<Response>((resolve, reject) => {
    void Taro.request({
      url,
      method: (init?.method ?? 'GET') as keyof Taro.request.Method,
      header: init?.headers as Record<string, string> | undefined,
      data: init?.body as string | Record<string, unknown> | undefined,
      // 用 text 而不是 json：让 shared/api 自己决定何时解析，避免 204 / 非 JSON 响应在这里就炸
      dataType: 'text',
      success: (res) => resolve(makeResponse(res.statusCode, typeof res.data === 'string' ? res.data : String(res.data ?? ''))),
      fail: (err) => reject(new TypeError(err.errMsg || 'request failed')),
    })
  })
}

/** TokenStore：Taro 的 storage 是同步 API，这里包成 shared/api 要求的异步接口 */
const tokenStore: TokenStore = {
  async get(): Promise<TokenPair | null> {
    try {
      const value = Taro.getStorageSync(TOKEN_STORAGE_KEY)
      if (
        value &&
        typeof value === 'object' &&
        typeof (value as TokenPair).accessToken === 'string' &&
        typeof (value as TokenPair).refreshToken === 'string'
      ) {
        return value as TokenPair
      }
      return null
    } catch {
      return null
    }
  },
  async set(pair: TokenPair): Promise<void> {
    try {
      Taro.setStorageSync(TOKEN_STORAGE_KEY, pair)
    } catch {
      // 存储写失败不应阻断请求流程（本次会话仍可用内存中的 pair）
    }
  },
  async clear(): Promise<void> {
    try {
      Taro.removeStorageSync(TOKEN_STORAGE_KEY)
    } catch {
      // 同上
    }
  },
}

let cached: { client: ApiClient; favorites: ReturnType<typeof createFavoritesApi> } | null = null

/**
 * 取 API 客户端。
 *
 * 未配置 API 基址时返回 null —— **不提供任何默认域名**（SK-8：禁止非空 fallback）。
 * 调用方拿到 null 要显式提示，而不是随便编一个地址发请求。
 */
export function getApi(): { client: ApiClient; favorites: ReturnType<typeof createFavoritesApi> } | null {
  if (!isApiBaseUrlConfigured()) return null
  if (cached) return cached

  const client = createApiClient({
    baseUrl: apiBaseUrl(),
    tokenStore,
    platform: 'weapp',
    fetchImpl: taroFetch as unknown as typeof fetch,
  })

  cached = { client, favorites: createFavoritesApi(client) }
  return cached
}

/** 登录态是否可用（有 token 且配置了基址） */
export async function hasSession(): Promise<boolean> {
  if (!isApiBaseUrlConfigured()) return false
  return (await tokenStore.get()) !== null
}

export async function clearSession(): Promise<void> {
  await tokenStore.clear()
}

export { clientId }
