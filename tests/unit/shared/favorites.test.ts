// shared/api/favorites.test.ts —— 5 端共用 favorites API 测试
//
// 覆盖：
//   1. list 增量 vs 全量 URL 拼接（since 编码、空 since）
//   2. mutate 默认 type='tool' 透传
//   3. sync 调用 compactQueue 去重 + 条件 lastSyncedAt
//   4. favoriteSet O(1) 集合生成 + key 格式（type:toolId）

import { describe, it, expect } from 'vitest'
import { createFavoritesApi, favoriteSet } from 'shared/api/favorites'
import type { ApiClient } from 'shared/api/http-client'
import type {
  FavoriteItemRecord,
  FavoriteMutation,
  FavoriteSnapshot,
  FavoriteSyncResult,
} from 'shared/types/api'

type CapturedRequest = {
  method: 'GET' | 'POST'
  url?: string
  body?: unknown
}

/**
 * 构造一个会记录所有请求的 mock ApiClient。
 * 返回值带 `_captured` 数组，便于测试断言 URL/body。
 */
function makeMockClient(handler: (req: CapturedRequest) => unknown): {
  client: ApiClient
  captured: CapturedRequest[]
} {
  const captured: CapturedRequest[] = []
  const client: ApiClient = {
    get: async <T>(url: string): Promise<T> => {
      const req = { method: 'GET' as const, url }
      captured.push(req)
      return handler(req) as T
    },
    post: async <T>(url: string, body: unknown): Promise<T> => {
      const req = { method: 'POST' as const, url, body }
      captured.push(req)
      return handler(req) as T
    },
  } as ApiClient
  return { client, captured }
}

describe('createFavoritesApi.list', () => {
  it('uses plain /api/favorites when no since', async () => {
    const { client, captured } = makeMockClient(() => ({
      favorites: [],
      serverTime: '2026-10-02T00:00:00Z',
    } as FavoriteSnapshot))
    const api = createFavoritesApi(client)
    await api.list()
    expect(captured).toHaveLength(1)
    expect(captured[0].method).toBe('GET')
    expect(captured[0].url).toBe('/api/favorites')
  })

  it('appends since=<ISO> query string when provided', async () => {
    const { client, captured } = makeMockClient(() => ({
      favorites: [],
      serverTime: '2026-10-02T00:00:00Z',
    } as FavoriteSnapshot))
    const api = createFavoritesApi(client)
    await api.list('2026-10-01T00:00:00Z')
    expect(captured[0].url).toBe('/api/favorites?since=2026-10-01T00%3A00%3A00Z')
  })

  it('URL-encodes special characters in since (e.g. +)', async () => {
    const { client, captured } = makeMockClient(() => ({
      favorites: [],
      serverTime: '2026-10-02T00:00:00Z',
    } as FavoriteSnapshot))
    const api = createFavoritesApi(client)
    await api.list('2026-10-01T00:00:00+08:00')
    // '+' 必须被编码为 %2B
    expect(captured[0].url).toContain('%2B08%3A00')
    expect(captured[0].url).not.toMatch(/\+\d/)
  })
})

describe('createFavoritesApi.mutate', () => {
  it('defaults type to "tool" when not provided', async () => {
    const { client, captured } = makeMockClient(() => ({ isFavorited: true }))
    const api = createFavoritesApi(client)
    await api.mutate('json-formatter', 'add')
    expect(captured[0].body).toEqual({
      toolId: 'json-formatter',
      type: 'tool',
      action: 'add',
    })
  })

  it('passes through explicit type', async () => {
    const { client, captured } = makeMockClient(() => ({ isFavorited: true }))
    const api = createFavoritesApi(client)
    await api.mutate('cookmate', 'add', 'product')
    expect(captured[0].body).toEqual({
      toolId: 'cookmate',
      type: 'product',
      action: 'add',
    })
  })

  it('returns isFavorited from server response', async () => {
    const { client } = makeMockClient(() => ({ isFavorited: false }))
    const api = createFavoritesApi(client)
    const result = await api.mutate('json-formatter', 'remove')
    expect(result).toEqual({ isFavorited: false })
  })
})

describe('createFavoritesApi.sync', () => {
  it('compacts queue before sending (dedup + last-write-wins)', async () => {
    const { client, captured } = makeMockClient(() => ({
      accepted: [],
      rejected: [],
      serverTime: '2026-10-02T00:00:00Z',
    } as FavoriteSyncResult))
    const api = createFavoritesApi(client)
    const ops: FavoriteMutation[] = [
      { type: 'tool', toolId: 'json-formatter', action: 'add', clientTs: '2026-10-02T00:00:01Z' },
      { type: 'tool', toolId: 'json-formatter', action: 'remove', clientTs: '2026-10-02T00:00:02Z' },
      { type: 'tool', toolId: 'json-formatter', action: 'add', clientTs: '2026-10-02T00:00:03Z' },
    ]
    await api.sync(ops)
    expect(captured[0].body).toBeDefined()
    const body = captured[0].body as { ops: Array<{ action: string }> }
    expect(body.ops).toHaveLength(1)
    expect(body.ops[0].action).toBe('add') // 最后一次 add 胜出
  })

  it('includes lastSyncedAt only when provided', async () => {
    const { client, captured } = makeMockClient(() => ({
      accepted: [],
      rejected: [],
      serverTime: '2026-10-02T00:00:00Z',
    } as FavoriteSyncResult))
    const api = createFavoritesApi(client)
    await api.sync([])
    const body1 = captured[0].body as Record<string, unknown>
    expect(body1).not.toHaveProperty('lastSyncedAt')

    await api.sync([], '2026-10-01T00:00:00Z')
    const body2 = captured[1].body as Record<string, unknown>
    expect(body2.lastSyncedAt).toBe('2026-10-01T00:00:00Z')
  })
})

describe('favoriteSet', () => {
  it('produces O(1) lookup set with type:toolId keys', () => {
    const snapshot: FavoriteSnapshot = {
      favorites: [
        { id: 't:1', type: 'tool', toolId: 'json-formatter', createdAt: '2026-10-02T00:00:00Z' } as FavoriteItemRecord,
        { id: 'p:1', type: 'product', toolId: 'cookmate', createdAt: '2026-10-02T00:00:00Z' } as FavoriteItemRecord,
        { id: 't:2', type: 'tool', toolId: 'base64', createdAt: '2026-10-02T00:00:00Z' } as FavoriteItemRecord,
      ],
      serverTime: '2026-10-02T00:00:00Z',
    }
    const set = favoriteSet(snapshot)
    expect(set.size).toBe(3)
    expect(set.has('tool:json-formatter')).toBe(true)
    expect(set.has('product:cookmate')).toBe(true)
    expect(set.has('tool:base64')).toBe(true)
    expect(set.has('tool:missing')).toBe(false)
  })

  it('handles empty snapshot', () => {
    const set = favoriteSet({ favorites: [], serverTime: '2026-10-02T00:00:00Z' })
    expect(set.size).toBe(0)
  })

  it('disambiguates tool and product with same toolId (跨端契约核心)', () => {
    const snapshot: FavoriteSnapshot = {
      favorites: [
        { id: 't:x', type: 'tool', toolId: 'shared-id', createdAt: '2026-10-02T00:00:00Z' } as FavoriteItemRecord,
        { id: 'p:x', type: 'product', toolId: 'shared-id', createdAt: '2026-10-02T00:00:00Z' } as FavoriteItemRecord,
      ],
      serverTime: '2026-10-02T00:00:00Z',
    }
    const set = favoriteSet(snapshot)
    expect(set.size).toBe(2)
    expect(set.has('tool:shared-id')).toBe(true)
    expect(set.has('product:shared-id')).toBe(true)
  })
})
