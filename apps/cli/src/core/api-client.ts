// ─────────────────────────────────────────────────────────────────────────────
// 装配 shared 的 API 客户端 / 收藏 API —— CLI 不自建任何 HTTP 逻辑
//
// 401 语义由 shared/api/http-client 负责：只有 tokenExpired 才会 refresh 后重试，
// tokenInvalid（结构非法 / 签名不对）直接抛给调用方去重新登录。CLI 只挂两个
// 诊断回调，不重复实现 refresh。
// ─────────────────────────────────────────────────────────────────────────────

import { createApiClient, type ApiClient } from 'shared/api/http-client'
import { createFavoritesApi, type FavoritesApi } from 'shared/api/favorites'
import { CLI_PLATFORM, type CliConfig } from './config'
import type { Io } from './io'
import type { Translator } from './i18n'
import type { FileTokenStore } from './token-store'

export interface CliApi {
  client: ApiClient
  favorites: FavoritesApi
}

export function createCliApi(
  config: CliConfig,
  store: FileTokenStore,
  io: Io,
  translator: Translator,
): CliApi {
  // shared 的 http-client 在「refresh 失败」时会先调 onUnauthorized，
  // 再在 401 分支里因为 refreshed === null 又调一次；同一条提示只该出现一次。
  let unauthorizedReported = false

  const client = createApiClient({
    baseUrl: config.apiBaseUrl,
    tokenStore: store,
    platform: CLI_PLATFORM,
    locale: config.lang,
    onTokenRefreshed: () => {
      if (!io.json) io.diag(translator.c('tokenRefreshed'))
    },
    onUnauthorized: () => {
      if (unauthorizedReported) return
      unauthorizedReported = true
      // 这条即使 --json 也要出：它解释了本次失败的原因
      io.diag(translator.c('sessionExpired'))
    },
  })

  return { client, favorites: createFavoritesApi(client) }
}
