import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FavoriteItem, LikeStatus } from '../../shared/types/index'

// Mock auth module
vi.mock('../../apps/web/src/lib/auth-client', () => ({
  useSession: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe('FavoriteItem type', () => {
  it('should accept valid favorite item', () => {
    const item: FavoriteItem = {
      id: 'abc123',
      toolId: 'json-formatter',
      createdAt: '2026-08-07T10:00:00Z',
    }
    expect(item.toolId).toBe('json-formatter')
  })

  it('should not require toolName field', () => {
    const item: FavoriteItem = {
      id: 'abc123',
      toolId: 'base64',
      createdAt: '2026-08-07T10:00:00Z',
    }
    // @ts-expect-error - toolName should not exist
    expect(item.toolName).toBeUndefined()
  })
})

describe('LikeStatus type', () => {
  it('should accept valid like status', () => {
    const status: LikeStatus = { liked: true, count: 5 }
    expect(status.liked).toBe(true)
    expect(status.count).toBe(5)
  })

  it('should accept zero count', () => {
    const status: LikeStatus = { liked: false, count: 0 }
    expect(status.liked).toBe(false)
    expect(status.count).toBe(0)
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
      body: JSON.stringify({ toolId: 'json-formatter' }),
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
})

describe('Likes API', () => {
  it('should return 401 when not authenticated', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: '请先登录' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const res = await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId: 'qrcode' }),
    })

    expect(res.status).toBe(401)
    vi.unstubAllGlobals()
  })

  it('should return like status and count on success', async () => {
    const mockResponse = { liked: true, count: 42 }
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })
    vi.stubGlobal('fetch', mockFetch)

    const res = await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId: 'qrcode' }),
    })
    const data = await res.json()

    expect(data.liked).toBe(true)
    expect(data.count).toBe(42)
    vi.unstubAllGlobals()
  })
})