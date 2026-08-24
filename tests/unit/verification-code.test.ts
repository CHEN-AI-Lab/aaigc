import { describe, it, expect, vi, beforeEach } from 'vitest'

// 用 vi.hoisted 确保 mock 对象在 vi.mock 工厂之前初始化（vitest 会提升 mock）
const { mockVerificationCode } = vi.hoisted(() => ({
  mockVerificationCode: {
    create: vi.fn(),
    findFirst: vi.fn(),
    updateMany: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
}))

vi.mock('shared/utils/prisma', () => ({
  prisma: { verificationCode: mockVerificationCode },
}))

import { consumeVerificationCode, checkVerificationCode } from 'shared/utils/verification-code'

beforeEach(() => {
  vi.clearAllMocks()
  mockVerificationCode.findFirst.mockResolvedValue(null)
  mockVerificationCode.updateMany.mockResolvedValue({ count: 1 })
  mockVerificationCode.update.mockResolvedValue({})
})

describe('verification-code: 原子消费', () => {
  it('消费有效验证码时标记 used:true（used:false 守卫防一码多用）', async () => {
    mockVerificationCode.findFirst.mockResolvedValue({ id: 'rec1', used: false, attempts: 0 })
    const ok = await consumeVerificationCode('a@b.com', '123456', 'login')
    expect(ok).toBe(true)
    expect(mockVerificationCode.updateMany).toHaveBeenCalledWith(
      { where: { id: 'rec1', used: false }, data: { used: true } }
    )
  })

  it('并发已被消费时返回 false（updateMany count=0）', async () => {
    mockVerificationCode.findFirst.mockResolvedValue({ id: 'rec1', used: false, attempts: 0 })
    mockVerificationCode.updateMany.mockResolvedValue({ count: 0 })
    const ok = await consumeVerificationCode('a@b.com', '123456', 'login')
    expect(ok).toBe(false)
  })

  it('checkVerificationCode 仅校验不消费', async () => {
    mockVerificationCode.findFirst.mockResolvedValue({ id: 'rec1', used: false, attempts: 0 })
    const ok = await checkVerificationCode('a@b.com', '123456', 'register')
    expect(ok).toBe(true)
    expect(mockVerificationCode.updateMany).not.toHaveBeenCalled()
  })
})

describe('verification-code: 防爆破（H3 修复回归）', () => {
  it('猜错码时 attempts 永不递增的旧逻辑已修复：改为对最新未用码递增', async () => {
    // 第一次 findFirst（按错误码查找）→ null；failureIncrement 再查最新未用码 → 返回记录
    mockVerificationCode.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'latestRec', used: false, attempts: 2 })

    const ok = await consumeVerificationCode('a@b.com', '000000', 'login')
    expect(ok).toBe(false)
    expect(mockVerificationCode.update).toHaveBeenCalledWith({
      where: { id: 'latestRec' },
      data: { attempts: { increment: 1 } },
    })
  })

  it('无任何未用码时不会报错（update 不被调用）', async () => {
    mockVerificationCode.findFirst.mockResolvedValue(null) // 两次都 null
    const ok = await consumeVerificationCode('a@b.com', '000000', 'login')
    expect(ok).toBe(false)
    expect(mockVerificationCode.update).not.toHaveBeenCalled()
  })

  it('attempts 已达上限时不被命中 → 校验失败', async () => {
    // 数据库 where 含 attempts: { lt: 5 }；attempts=5 的记录不会被返回（此处模拟该过滤结果）
    mockVerificationCode.findFirst.mockResolvedValue(null)
    const ok = await checkVerificationCode('a@b.com', '123456', 'verify')
    expect(ok).toBe(false)
  })
})
