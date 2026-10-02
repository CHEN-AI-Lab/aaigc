// shared/utils/login-rate-limit.test.ts —— 登录限流核心逻辑测试
//
// 覆盖：
//   1. 无记录 → 放行（remaining = MAX_ATTEMPTS）
//   2. 锁定已过期 → 自动清除 + 放行
//   3. 锁定未过期 → 拒绝（返回 lockedUntil 时间戳）
//   4. 失败递增：连续失败到 MAX_ATTEMPTS → 设置锁定
//   5. 成功 → 清空计数（不论之前失败多少次）
//   6. 删除失败（Prisma 异常）静默吞掉，不影响业务

import { describe, it, expect, beforeEach, vi } from 'vitest'

// 必须 mock 在 import login-rate-limit 之前
const mockFindUnique = vi.fn()
const mockDelete = vi.fn()
const mockUpsert = vi.fn()

vi.mock('shared/utils/prisma', () => ({
  prisma: {
    rateLimit: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
  },
}))

// 用动态 import 保证 mock 生效
const { checkLoginRateLimit, recordLoginAttempt } = await import(
  'shared/utils/login-rate-limit'
)

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 分钟

beforeEach(() => {
  vi.clearAllMocks()
  // 默认 delete 不抛错
  mockDelete.mockResolvedValue(undefined)
})

describe('checkLoginRateLimit', () => {
  it('returns allowed when no record exists', async () => {
    mockFindUnique.mockResolvedValue(null)
    const result = await checkLoginRateLimit('user@example.com')
    expect(result).toEqual({
      allowed: true,
      remaining: MAX_ATTEMPTS,
      lockedUntil: null,
    })
  })

  it('auto-clears expired lock and returns allowed', async () => {
    const expiredLock = BigInt(Date.now() - 1000) // 1 秒前过期
    mockFindUnique.mockResolvedValue({
      key: 'user@example.com',
      count: 10,
      windowStart: BigInt(0),
      lockedUntil: expiredLock,
    })
    const result = await checkLoginRateLimit('user@example.com')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(MAX_ATTEMPTS)
    expect(mockDelete).toHaveBeenCalledWith({
      where: { key: 'user@example.com' },
    })
  })

  it('still tolerates delete failure on expired lock (silent catch)', async () => {
    const expiredLock = BigInt(Date.now() - 1000)
    mockFindUnique.mockResolvedValue({
      key: 'user@example.com',
      count: 10,
      windowStart: BigInt(0),
      lockedUntil: expiredLock,
    })
    // delete 抛错（race condition: 同时另一个请求已删了）
    mockDelete.mockRejectedValueOnce(new Error('record not found'))
    const result = await checkLoginRateLimit('user@example.com')
    expect(result.allowed).toBe(true) // 不影响放行
  })

  it('rejects when lock is still active', async () => {
    const futureLock = BigInt(Date.now() + LOCKOUT_DURATION)
    mockFindUnique.mockResolvedValue({
      key: 'user@example.com',
      count: MAX_ATTEMPTS,
      windowStart: BigInt(0),
      lockedUntil: futureLock,
    })
    const result = await checkLoginRateLimit('user@example.com')
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.lockedUntil).toBe(Number(futureLock))
  })

  it('returns remaining count for non-locked record', async () => {
    mockFindUnique.mockResolvedValue({
      key: 'user@example.com',
      count: 3,
      windowStart: BigInt(0),
      lockedUntil: null,
    })
    const result = await checkLoginRateLimit('user@example.com')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(MAX_ATTEMPTS - 3) // 2
  })

  it('clamps remaining to 0 when count exceeds MAX_ATTEMPTS', async () => {
    // count 可能超过 MAX（来自之前版本数据）
    mockFindUnique.mockResolvedValue({
      key: 'user@example.com',
      count: 99,
      windowStart: BigInt(0),
      lockedUntil: null,
    })
    const result = await checkLoginRateLimit('user@example.com')
    expect(result.remaining).toBe(0)
  })
})

describe('recordLoginAttempt (success)', () => {
  it('clears the rate-limit record on success', async () => {
    await recordLoginAttempt('user@example.com', true)
    expect(mockDelete).toHaveBeenCalledWith({
      where: { key: 'user@example.com' },
    })
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('tolerates delete failure on success (silent catch)', async () => {
    mockDelete.mockRejectedValueOnce(new Error('db down'))
    await expect(recordLoginAttempt('user@example.com', true)).resolves.toBeUndefined()
  })
})

describe('recordLoginAttempt (failure)', () => {
  it('upserts with count=1 for first failure', async () => {
    mockFindUnique.mockResolvedValue(null)
    await recordLoginAttempt('user@example.com', false)
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { key: 'user@example.com' },
      create: {
        key: 'user@example.com',
        count: 1,
        windowStart: expect.any(BigInt),
        lockedUntil: null, // 1 < 5，不锁定
      },
      update: {
        count: 1,
        lockedUntil: null,
      },
    })
  })

  it('sets lockedUntil on the 5th failure', async () => {
    mockFindUnique.mockResolvedValue({ count: 4 }) // 已失败 4 次
    await recordLoginAttempt('user@example.com', false)
    const call = mockUpsert.mock.calls[0][0]
    expect(call.update.count).toBe(5) // 5
    expect(call.update.lockedUntil).not.toBeNull() // 锁定
    expect(typeof call.update.lockedUntil).toBe('bigint')
    // 锁定时间 = 当前 + 15 分钟（误差 ±1s）
    const lockMs = Number(call.update.lockedUntil)
    const expected = Date.now() + LOCKOUT_DURATION
    expect(Math.abs(lockMs - expected)).toBeLessThan(1000)
  })

  it('keeps unlocked when count is below threshold', async () => {
    mockFindUnique.mockResolvedValue({ count: 2 })
    await recordLoginAttempt('user@example.com', false)
    const call = mockUpsert.mock.calls[0][0]
    expect(call.update.count).toBe(3)
    expect(call.update.lockedUntil).toBeNull()
  })

  it('uses upsert (not just update) so first-ever failure creates record', async () => {
    mockFindUnique.mockResolvedValue(null)
    await recordLoginAttempt('user@example.com', false)
    const call = mockUpsert.mock.calls[0][0]
    expect(call.create).toBeDefined()
    expect(call.where).toEqual({ key: 'user@example.com' })
  })
})
