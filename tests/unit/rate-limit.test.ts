import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockRateLimit } = vi.hoisted(() => ({
  mockRateLimit: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('shared/utils/prisma', () => ({
  prisma: { rateLimit: mockRateLimit },
}))

import { checkRateLimit } from 'shared/utils/rate-limit'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('rate-limit (DB-backed)', () => {
  it('无记录时开启新窗口并允许', async () => {
    mockRateLimit.findUnique.mockResolvedValue(null)
    mockRateLimit.upsert.mockResolvedValue({ count: 1 })
    const r = await checkRateLimit('dns-lookup:1.1.1.1', 20, 60_000)
    expect(r.allowed).toBe(true)
    expect(r.remaining).toBe(19)
    expect(mockRateLimit.upsert).toHaveBeenCalled()
  })

  it('窗口未满时原子递增并允许', async () => {
    const now = Date.now()
    mockRateLimit.findUnique.mockResolvedValue({
      count: 3,
      windowStart: BigInt(now),
      lockedUntil: null,
    })
    mockRateLimit.update.mockResolvedValue({ count: 4 })
    const r = await checkRateLimit('dns-lookup:1.1.1.1', 20, 60_000)
    expect(r.allowed).toBe(true)
    expect(r.remaining).toBe(16)
    expect(mockRateLimit.update).toHaveBeenCalledWith({
      where: { key: 'dns-lookup:1.1.1.1' },
      data: { count: { increment: 1 } },
    })
  })

  it('达到上限时拒绝并返回 resetAt', async () => {
    const now = Date.now()
    mockRateLimit.findUnique.mockResolvedValue({
      count: 20,
      windowStart: BigInt(now - 5_000),
      lockedUntil: null,
    })
    const r = await checkRateLimit('dns-lookup:1.1.1.1', 20, 60_000)
    expect(r.allowed).toBe(false)
    expect(r.remaining).toBe(0)
    expect(r.resetAt).toBeGreaterThan(now)
  })

  it('窗口已过期时重置', async () => {
    const longAgo = Date.now() - 120_000
    mockRateLimit.findUnique.mockResolvedValue({
      count: 20,
      windowStart: BigInt(longAgo),
      lockedUntil: null,
    })
    mockRateLimit.upsert.mockResolvedValue({ count: 1 })
    const r = await checkRateLimit('dns-lookup:1.1.1.1', 20, 60_000)
    expect(r.allowed).toBe(true)
    expect(r.remaining).toBe(19)
    expect(mockRateLimit.upsert).toHaveBeenCalled()
  })
})
