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

import { checkLoginRateLimit, recordLoginAttempt } from 'shared/utils/login-rate-limit'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('login-rate-limit', () => {
  it('无记录时允许登录', async () => {
    mockRateLimit.findUnique.mockResolvedValue(null)
    const r = await checkLoginRateLimit('login:a@b.com')
    expect(r.allowed).toBe(true)
    expect(r.remaining).toBe(5)
  })

  it('失败 5 次后锁定 15 分钟', async () => {
    mockRateLimit.findUnique.mockResolvedValue(null)
    for (let i = 0; i < 5; i++) {
      mockRateLimit.upsert.mockResolvedValue({ count: i + 1 })
      await recordLoginAttempt('login:a@b.com', false)
    }
    mockRateLimit.findUnique.mockResolvedValue({
      count: 5,
      lockedUntil: BigInt(Date.now() + 1000 * 60 * 60),
    })
    const r = await checkLoginRateLimit('login:a@b.com')
    expect(r.allowed).toBe(false)
    expect(r.lockedUntil).not.toBeNull()
  })

  it('成功后清除计数', async () => {
    mockRateLimit.delete.mockResolvedValue({})
    await recordLoginAttempt('login:a@b.com', true)
    expect(mockRateLimit.delete).toHaveBeenCalledWith({ where: { key: 'login:a@b.com' } })
  })

  it('锁定过期后自动重置', async () => {
    mockRateLimit.findUnique.mockResolvedValue({
      count: 5,
      lockedUntil: BigInt(Date.now() - 1000),
    })
    const r = await checkLoginRateLimit('login:a@b.com')
    expect(r.allowed).toBe(true)
    expect(mockRateLimit.delete).toHaveBeenCalled()
  })
})
