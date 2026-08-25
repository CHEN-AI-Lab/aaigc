// DB-backed sliding-window rate limiter.
// Uses the existing Prisma RateLimit table so all Vercel serverless
// instances share the same counter. The previous in-memory Map was
// per-instance and ineffective in production under Vercel Fluid Compute.

import { prisma } from './prisma'

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now()
  const record = await prisma.rateLimit.findUnique({ where: { key } })

  // New window (no record, or the previous window has expired)
  if (!record || now - Number(record.windowStart) >= windowMs) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, windowStart: BigInt(now) },
      update: { count: 1, windowStart: BigInt(now), lockedUntil: null },
    })
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs }
  }

  // Within window but the cap has been reached
  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: Number(record.windowStart) + windowMs,
    }
  }

  // Within window, room left — atomic increment
  const updated = await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  })

  return {
    allowed: true,
    remaining: maxRequests - updated.count,
    resetAt: Number(record.windowStart) + windowMs,
  }
}
