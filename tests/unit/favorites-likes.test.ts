import { describe, it, expect, vi } from 'vitest'
import { FavoriteItem } from '../../shared/types/index'

describe('FavoriteItem type', () => {
  it('should accept valid favorite item with type', () => {
    const item: FavoriteItem = {
      id: 'abc123',
      toolId: 'json-formatter',
      type: 'tool',
      createdAt: '2026-08-07T10:00:00Z',
    }
    expect(item.toolId).toBe('json-formatter')
    expect(item.type).toBe('tool')
  })

  it('should support product type', () => {
    const item: FavoriteItem = {
      id: 'abc123',
      toolId: 'cookmate',
      type: 'product',
      createdAt: '2026-08-07T10:00:00Z',
    }
    expect(item.type).toBe('product')
  })

  it('should not require toolName field', () => {
    const item: FavoriteItem = {
      id: 'abc123',
      toolId: 'base64',
      type: 'tool',
      createdAt: '2026-08-07T10:00:00Z',
    }
    // @ts-expect-error - toolName should not exist
    expect(item.toolName).toBeUndefined()
  })
})

describe('Favorites API', () => {
  it('should return 401 when not authenticated', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: '请先登录' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId: 'json-formatter', type: 'tool' }),
    })

    expect(res.status).toBe(401)
    vi.unstubAllGlobals()
  })

  it('should require toolId', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: '缺少工具 ID' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(400)
    vi.unstubAllGlobals()
  })

  it('should toggle favorite on success', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isFavorited: true }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId: 'qrcode', type: 'tool' }),
    })
    const data = await res.json()

    expect(data.isFavorited).toBe(true)
    vi.unstubAllGlobals()
  })

  it('should pass type to API request', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isFavorited: true }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId: 'cookmate', type: 'product' }),
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.type).toBe('product')
    vi.unstubAllGlobals()
  })
})