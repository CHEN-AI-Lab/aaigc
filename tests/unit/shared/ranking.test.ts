// shared/api/ranking.test.ts —— 排行榜拉取测试
//
// 覆盖：
//   1. URL 拼接：project / limit / env / start / end
//   2. 非数组响应 → 返回空数组
//   3. NEXT_PUBLIC_VERCEL_ENV 决定 env 参数
//
// ⚠️ 注意：ranking.ts 在模块顶层读取 WORKER_URL（`const`，不可变），
//    所以必须用 vi.resetModules + 动态 import 才能在不同 env 下重新求值。

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const originalFetch = globalThis.fetch
const ORIGINAL_NEXT_PUBLIC_WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL
const ORIGINAL_VERCEL_ENV = process.env.NEXT_PUBLIC_VERCEL_ENV

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.restoreAllMocks()
  vi.resetModules()
  // 还原 env
  if (ORIGINAL_NEXT_PUBLIC_WORKER_URL === undefined) {
    delete process.env.NEXT_PUBLIC_WORKER_URL
  } else {
    process.env.NEXT_PUBLIC_WORKER_URL = ORIGINAL_NEXT_PUBLIC_WORKER_URL
  }
  if (ORIGINAL_VERCEL_ENV === undefined) {
    delete process.env.NEXT_PUBLIC_VERCEL_ENV
  } else {
    process.env.NEXT_PUBLIC_VERCEL_ENV = ORIGINAL_VERCEL_ENV
  }
})

async function loadRankingWithEnv(env: {
  workerUrl?: string
  vercelEnv?: string
}): Promise<typeof import('shared/api/ranking')> {
  // 在 import ranking 之前必须设好 env（因为 WORKER_URL 是模块顶 const）
  if (env.workerUrl !== undefined) {
    process.env.NEXT_PUBLIC_WORKER_URL = env.workerUrl
  }
  if (env.vercelEnv !== undefined) {
    process.env.NEXT_PUBLIC_VERCEL_ENV = env.vercelEnv
  }
  vi.resetModules()
  return import('shared/api/ranking')
}

describe('fetchRanking', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_VERCEL_ENV
  })

  it('builds URL with project + limit + default env=production', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => [{ id: 'tool-1', count: 42 }],
    })
    globalThis.fetch = mockFetch as unknown as typeof fetch

    const { fetchRanking } = await loadRankingWithEnv({
      workerUrl: 'https://stats.example.com',
    })

    const result = await fetchRanking('aaigc')
    expect(result).toEqual([{ id: 'tool-1', count: 42 }])

    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('https://stats.example.com/ranking')
    expect(url).toContain('project=aaigc')
    expect(url).toContain('limit=20')
    expect(url).toContain('env=production')
    expect(url).not.toContain('start=')
    expect(url).not.toContain('end=')
  })

  it('includes start + end query params when provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => [],
    })
    globalThis.fetch = mockFetch as unknown as typeof fetch

    const { fetchRanking } = await loadRankingWithEnv({
      workerUrl: 'https://stats.example.com',
    })
    await fetchRanking('aaigc', 10, '2026-10-01', '2026-10-02')

    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('limit=10')
    expect(url).toContain('start=2026-10-01')
    expect(url).toContain('end=2026-10-02')
  })

  it('uses NEXT_PUBLIC_VERCEL_ENV for env param when set', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => [],
    })
    globalThis.fetch = mockFetch as unknown as typeof fetch

    const { fetchRanking } = await loadRankingWithEnv({
      workerUrl: 'https://stats.example.com',
      vercelEnv: 'preview',
    })
    await fetchRanking('aaigc')

    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('env=preview')
  })

  it('returns empty array when response is not array', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({ error: 'something went wrong' }),
    })
    globalThis.fetch = mockFetch as unknown as typeof fetch

    const { fetchRanking } = await loadRankingWithEnv({
      workerUrl: 'https://stats.example.com',
    })
    const result = await fetchRanking('aaigc')
    expect(result).toEqual([])
  })

  it('respects custom limit', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => [],
    })
    globalThis.fetch = mockFetch as unknown as typeof fetch

    const { fetchRanking } = await loadRankingWithEnv({
      workerUrl: 'https://stats.example.com',
    })
    await fetchRanking('aaigc', 50)

    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('limit=50')
  })
})
