// 登录限流（DB 版本，替代内存 Map）。
// Vercel serverless 多实例下内存 Map 不共享，跨实例无锁定效果；
// 改为 Prisma 持久化 RateLimit 表，所有实例共享同一份计数与锁定。

import { prisma } from './prisma'

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 分钟

export async function checkLoginRateLimit(
  key: string
): Promise<{ allowed: boolean; remaining: number; lockedUntil: number | null }> {
  const now = Date.now()
  const record = await prisma.rateLimit.findUnique({ where: { key } })
  if (!record) {
    return { allowed: true, remaining: MAX_ATTEMPTS, lockedUntil: null }
  }
  // 锁定已过期 → 自动清除并放行
  if (record.lockedUntil && record.lockedUntil <= BigInt(now)) {
    await prisma.rateLimit.delete({ where: { key } }).catch(() => {})
    return { allowed: true, remaining: MAX_ATTEMPTS, lockedUntil: null }
  }
  // 仍在锁定
  if (record.lockedUntil && record.lockedUntil > BigInt(now)) {
    return { allowed: false, remaining: 0, lockedUntil: Number(record.lockedUntil) }
  }
  return {
    allowed: true,
    remaining: Math.max(0, MAX_ATTEMPTS - record.count),
    lockedUntil: null,
  }
}

export async function recordLoginAttempt(key: string, success: boolean) {
  if (success) {
    // 成功：清空计数
    await prisma.rateLimit.delete({ where: { key } }).catch(() => {})
    return
  }
  // 失败：递增 + 必要时设置锁定
  const now = Date.now()
  const cur = await prisma.rateLimit.findUnique({ where: { key } })
  const nextCount = (cur?.count ?? 0) + 1
  const lockedUntil =
    nextCount >= MAX_ATTEMPTS ? BigInt(now + LOCKOUT_DURATION) : null
  await prisma.rateLimit.upsert({
    where: { key },
    create: {
      key,
      count: nextCount,
      windowStart: BigInt(now),
      lockedUntil,
    },
    update: {
      count: nextCount,
      lockedUntil,
    },
  })
}
