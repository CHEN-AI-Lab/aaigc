// ─────────────────────────────────────────────────────────────────────────────
// 装配 shared 的 API 客户端 / 收藏 API —— App 不自建任何 HTTP 逻辑
//
// 401 语义由 shared/api/http-client 负责，App 只挂两个回调：
//   · tokenExpired → http-client 自动 refresh 并重试一次（App 不重复实现）
//   · refresh 失败 / 没得 refresh → onUnauthorized，App 清凭证回登录页
//   · tokenInvalid（签名不对 / 结构非法）→ http-client 直接抛 ApiError，
//     由 SessionProvider 的 classifyApiError 识别后同样清凭证回登录页
//     （注意：tokenInvalid **不会**触发 onUnauthorized，必须自己兜）
// ─────────────────────────────────────────────────────────────────────────────

import { createApiClient, type ApiClient } from 'shared/api/http-client'
import { createFavoritesApi, type FavoritesApi } from 'shared/api/favorites'
import type { Platform, TokenPair } from 'shared/types'
import type { SecureTokenStore } from '../auth/token-store'
import { requireApiBaseUrl } from './env'

/** 端维度取值（SK-6：不散落裸字符串） */
export const APP_PLATFORM: Platform = 'app'

export interface AppApi {
  client: ApiClient
  favorites: FavoritesApi
}

export interface CreateAppApiOptions {
  store: SecureTokenStore
  /** BCP-47，作为 Accept-Language 下发 */
  locale: string
  /** 会话已不可救（refresh 失败）时的回调 */
  onUnauthorized: () => void
  onTokenRefreshed?: (pair: TokenPair) => void
}

/**
 * 未配置站点基址时**直接抛** AppConfigError（SK-8：不猜地址、不回落）。
 * 调用方（SessionProvider）捕获后进入"未配置"状态并把配置方法显示在设置页。
 */
export function createAppApi(options: CreateAppApiOptions): AppApi {
  const baseUrl = requireApiBaseUrl()

  const client = createApiClient({
    baseUrl,
    tokenStore: options.store,
    platform: APP_PLATFORM,
    locale: options.locale,
    onUnauthorized: options.onUnauthorized,
    ...(options.onTokenRefreshed ? { onTokenRefreshed: options.onTokenRefreshed } : {}),
  })

  return { client, favorites: createFavoritesApi(client) }
}
