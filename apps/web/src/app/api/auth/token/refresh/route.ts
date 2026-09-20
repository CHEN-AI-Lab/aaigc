// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/token/refresh —— refresh token rotation（架构 §4.2.1 / Q-A5）
//
//   body: { refreshToken } → 200 新 TokenPair（旧 refresh 立即失效）
//
// rotation 语义：
//   · 正常刷新：旧 token 撤销，签发同族（familyId 不变）的新 token —— 链式滚动
//   · 重放检测：已撤销的 token 再次被使用 → **整族撤销**（RFC 6749 rotation 最佳实践，
//     用于发现 token 被盗：攻击者与真实用户必然有一方拿到已撤销的 token）
//   · 并发安全：用条件更新（revokedAt: null）抢占，count !== 1 视为已被他处轮换 → 按重放处理
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from 'shared/utils/prisma'
import { withCors } from '@/api-cors'
import { errorResponse, tooManyRequestsResponse } from '@/api-response'
import { issueTokenPair } from '@/issue-token-pair'
import { hashRefreshToken } from 'shared/utils/auth-token'
import { checkRateLimit } from 'shared/utils/rate-limit'
import { getTrustedClientIp } from 'shared/utils/ip'

/** 整族撤销：检测到已撤销 token 被重放时调用 */
async function revokeFamily(familyId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export const POST = withCors(async (req: NextRequest) => {
  const ip = getTrustedClientIp(req)
  const rl = await checkRateLimit(`token-refresh:${ip}`, 60, 60_000)
  if (!rl.allowed) return tooManyRequestsResponse(rl.resetAt)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return errorResponse('invalidJson')
  }

  const refreshToken = (body as Record<string, unknown> | null)?.refreshToken
  if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
    return errorResponse('missingRefreshToken')
  }

  const tokenHash = await hashRefreshToken(refreshToken)
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } })
  if (!record) {
    return errorResponse('refreshTokenInvalid')
  }

  // 重放检测：这个 token 已经被轮换过 —— 有人拿到了旧 token
  if (record.revokedAt) {
    await revokeFamily(record.familyId)
    return errorResponse('refreshTokenInvalid')
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } })
    return errorResponse('refreshTokenInvalid')
  }

  const user = await prisma.user.findUnique({ where: { id: record.userId } })
  if (!user) {
    await revokeFamily(record.familyId)
    return errorResponse('refreshTokenInvalid')
  }

  // 条件抢占：只有把 revokedAt 从 null 改成非 null 的那一方才允许签发新 token
  const claimed = await prisma.refreshToken.updateMany({
    where: { id: record.id, revokedAt: null },
    data: { revokedAt: new Date() },
  })
  if (claimed.count !== 1) {
    await revokeFamily(record.familyId)
    return errorResponse('refreshTokenInvalid')
  }

  const pair = await issueTokenPair({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    clientId: record.clientId,
    familyId: record.familyId,
  })
  return NextResponse.json(pair)
})
