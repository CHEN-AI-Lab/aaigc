// 统一 API 客户端单测：统一 header、错误码收敛、401 → refresh → 重试一次

import { describe, expect, it, vi } from 'vitest'
import type { TokenPair, TokenStore } from 'shared/types/api'
import { ApiError, createApiClient, createFavoritesApi } from 'shared/api'
import { apiErrorBody, statusForErrorCode } from 'shared/constants/error-codes'

const BASE_URL = 'https://api.test.local'

function pair(accessToken: string, refreshToken = 'refresh-1'): TokenPair {
  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresAt: '2025-06-01T00:00:00.000Z',
    user: { id: 'user-1', email: 'ada@example.com', name: 'Ada', role: 'user' },
  }
}

function memoryStore(initial: TokenPair | null = null): TokenStore & { current: TokenPair | null } {
  const store = {
    current: initial,
    async get(): Promise<TokenPair | null> {
      return store.current
    },
    async set(next: TokenPair): Promise<void> {
      store.current = next
    },
    async clear(): Promise<void> {
      store.current = null
    },
  }
  return store
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

interface RecordedCall {
  url: string
  init: RequestInit
}

function recorder(handler: (url: string, init: RequestInit, callIndex: number) => Response | Promise<Response>) {
  const calls: RecordedCall[] = []
  const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString()
    const call: RecordedCall = { url, init: init ?? {} }
    calls.push(call)
    return handler(url, call.init, calls.length - 1)
  }) as unknown as typeof fetch
  return { calls, fetchImpl }
}

describe('createApiClient request shaping', () => {
  it('attaches bearer, locale and platform headers', async () => {
    const { calls, fetchImpl } = recorder(() => jsonResponse({ ok: true }))
    const client = createApiClient({
      baseUrl: BASE_URL,
      tokenStore: memoryStore(pair('access-1')),
      platform: 'cli',
      locale: 'zh-CN',
      fetchImpl,
    })

    await client.get('/api/favorites')

    const headers = calls[0]?.init.headers as Record<string, string>
    expect(calls[0]?.url).toBe(`${BASE_URL}/api/favorites`)
    expect(headers.authorization).toBe('Bearer access-1')
    expect(headers['accept-language']).toBe('zh-CN')
    expect(headers['x-aaigc-platform']).toBe('cli')
    expect(headers.accept).toBe('application/json')
  })

  it('omits the authorization header when there is no token', async () => {
    const { calls, fetchImpl } = recorder(() => jsonResponse({ ok: true }))
    const client = createApiClient({ baseUrl: BASE_URL, tokenStore: memoryStore(), platform: 'desktop', fetchImpl })
    await client.get('/api/tools')
    expect((calls[0]?.init.headers as Record<string, string>).authorization).toBeUndefined()
  })

  it('serializes a JSON body and sets content-type', async () => {
    const { calls, fetchImpl } = recorder(() => jsonResponse({ isFavorited: true }))
    const client = createApiClient({ baseUrl: BASE_URL, tokenStore: memoryStore(), platform: 'app', fetchImpl })
    await client.post('/api/favorites', { toolId: 'json-formatter', action: 'add' })
    const init = calls[0]?.init
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe(JSON.stringify({ toolId: 'json-formatter', action: 'add' }))
    expect((init?.headers as Record<string, string>)['content-type']).toBe('application/json')
  })

  it('returns undefined for 204 responses', async () => {
    const { fetchImpl } = recorder(() => new Response(null, { status: 204 }))
    const client = createApiClient({ baseUrl: BASE_URL, tokenStore: memoryStore(), platform: 'cli', fetchImpl })
    await expect(client.delete('/api/favorites')).resolves.toBeUndefined()
  })
})

describe('createApiClient error handling', () => {
  it('converts { error: <code> } bodies into ApiError with the mapped status', async () => {
    const { fetchImpl } = recorder(() => jsonResponse({ error: 'tokenExpired' }, 401))
    const client = createApiClient({ baseUrl: BASE_URL, tokenStore: memoryStore(), platform: 'cli', fetchImpl })
    await expect(client.get('/api/user/profile')).rejects.toMatchObject({
      name: 'ApiError',
      code: 'tokenExpired',
      status: 401,
    })
  })

  it('falls back to requestFailed when the body is not JSON', async () => {
    const { fetchImpl } = recorder(() => new Response('upstream boom', { status: 500 }))
    const client = createApiClient({ baseUrl: BASE_URL, tokenStore: memoryStore(), platform: 'cli', fetchImpl })
    const error = await client.get('/api/user/profile').catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).code).toBe('requestFailed')
  })

  it('keeps errorParams for i18n interpolation', async () => {
    const body = apiErrorBody('rateLimited', { seconds: 30 })
    const { fetchImpl } = recorder(() => jsonResponse(body, statusForErrorCode('rateLimited')))
    const client = createApiClient({ baseUrl: BASE_URL, tokenStore: memoryStore(), platform: 'cli', fetchImpl })
    const error = await client.get('/api/x').catch((caught: unknown) => caught) as ApiError
    expect(error.code).toBe('rateLimited')
    expect(error.params).toEqual({ seconds: 30 })
  })
})

describe('createApiClient 401 refresh flow', () => {
  it('refreshes once and retries the original request', async () => {
    const store = memoryStore(pair('expired'))
    const refreshed: TokenPair[] = []
    const { calls, fetchImpl } = recorder((url, _init, index) => {
      if (url.endsWith('/api/auth/token/refresh')) {
        return jsonResponse(pair('access-2', 'refresh-2'))
      }
      if (index === 0) return jsonResponse({ error: 'tokenExpired' }, 401)
      return jsonResponse({ favorites: [] })
    })

    const client = createApiClient({
      baseUrl: BASE_URL,
      tokenStore: store,
      platform: 'desktop',
      fetchImpl,
      onTokenRefreshed: (next) => {
        refreshed.push(next)
      },
    })

    const result = await client.get<{ favorites: unknown[] }>('/api/favorites')
    expect(result.favorites).toEqual([])
    expect(store.current?.accessToken).toBe('access-2')
    expect(refreshed).toHaveLength(1)
    expect(calls).toHaveLength(3)
    expect((calls[2]?.init.headers as Record<string, string>).authorization).toBe('Bearer access-2')
  })

  it('clears the token and notifies when the refresh itself fails', async () => {
    const store = memoryStore(pair('expired'))
    let unauthorized = 0
    const { fetchImpl } = recorder((url) => {
      if (url.endsWith('/api/auth/token/refresh')) return jsonResponse({ error: 'refreshTokenInvalid' }, 401)
      return jsonResponse({ error: 'tokenExpired' }, 401)
    })

    const client = createApiClient({
      baseUrl: BASE_URL,
      tokenStore: store,
      platform: 'desktop',
      fetchImpl,
      onUnauthorized: () => {
        unauthorized += 1
      },
    })

    await expect(client.get('/api/favorites')).rejects.toMatchObject({ code: 'tokenExpired' })
    expect(store.current).toBeNull()
    expect(unauthorized).toBeGreaterThan(0)
  })

  it('does not attempt a refresh without a stored token', async () => {
    const { calls, fetchImpl } = recorder(() => jsonResponse({ error: 'loginRequired' }, 401))
    const client = createApiClient({ baseUrl: BASE_URL, tokenStore: memoryStore(), platform: 'cli', fetchImpl })
    await expect(client.get('/api/favorites')).rejects.toMatchObject({ code: 'loginRequired' })
    expect(calls).toHaveLength(1)
  })

  it('does NOT refresh on tokenInvalid — a broken token cannot be fixed by retrying', async () => {
    const store = memoryStore(pair('tampered'))
    let refreshCalls = 0
    const { calls, fetchImpl } = recorder((url) => {
      if (url.endsWith('/api/auth/token/refresh')) {
        refreshCalls += 1
        return jsonResponse(pair('access-2', 'refresh-2'))
      }
      return jsonResponse({ error: 'tokenInvalid' }, 401)
    })

    const client = createApiClient({ baseUrl: BASE_URL, tokenStore: store, platform: 'cli', fetchImpl })

    await expect(client.get('/api/favorites')).rejects.toMatchObject({ code: 'tokenInvalid', status: 401 })
    expect(calls).toHaveLength(1) // 既没有 refresh，也没有重试
    expect(refreshCalls).toBe(0)
    expect(store.current?.accessToken).toBe('tampered') // 凭证交给调用方处置，不擅自清空
  })
})

describe('createFavoritesApi', () => {
  it('requests an incremental snapshot with ?since', async () => {
    const { calls, fetchImpl } = recorder(() => jsonResponse({ favorites: [], serverTime: '2025-06-01T00:00:00.000Z' }))
    const client = createApiClient({ baseUrl: BASE_URL, tokenStore: memoryStore(), platform: 'cli', fetchImpl })
    await createFavoritesApi(client).list('2025-05-01T00:00:00.000Z')
    expect(calls[0]?.url).toBe(`${BASE_URL}/api/favorites?since=2025-05-01T00%3A00%3A00.000Z`)
  })

  it('sends an explicit action so replay is idempotent', async () => {
    const { calls, fetchImpl } = recorder(() => jsonResponse({ isFavorited: true }))
    const client = createApiClient({ baseUrl: BASE_URL, tokenStore: memoryStore(), platform: 'cli', fetchImpl })
    await createFavoritesApi(client).mutate('json-formatter', 'remove', 'tool')
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({
      toolId: 'json-formatter',
      type: 'tool',
      action: 'remove',
    })
  })

  it('compacts the offline queue before syncing', async () => {
    const { calls, fetchImpl } = recorder(() =>
      jsonResponse({ favorites: [], serverTime: '2025-06-01T00:00:00.000Z', appliedOpIds: ['op-2'], skippedOpIds: [] }),
    )
    const client = createApiClient({ baseUrl: BASE_URL, tokenStore: memoryStore(), platform: 'cli', fetchImpl })
    await createFavoritesApi(client).sync(
      [
        { opId: 'op-1', action: 'add', toolId: 'x', type: 'tool', clientTs: '2025-05-01T00:00:00.000Z' },
        { opId: 'op-2', action: 'remove', toolId: 'x', type: 'tool', clientTs: '2025-05-02T00:00:00.000Z' },
      ],
      '2025-04-30T00:00:00.000Z',
    )
    const body = JSON.parse(String(calls[0]?.init.body)) as { ops: Array<{ opId: string }>; lastSyncedAt?: string }
    expect(body.ops.map((entry) => entry.opId)).toEqual(['op-2'])
    expect(body.lastSyncedAt).toBe('2025-04-30T00:00:00.000Z')
  })
})
