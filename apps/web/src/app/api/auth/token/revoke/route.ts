// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/token/revoke —— 登出 / 撤销 refresh token（架构 §4.2.1）
//
//   body: { refreshToken } → 204
//
// 语义遵循 RFC 7009：**幂等**。token 不存在、已撤销、已过期都返回 204，
// 不向调用方泄露「该 token 是否存在」。
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from 'shared/utils/prisma'
import { withCors } from '@/api-cors'
import { errorResponse, tooManyRequestsResponse } from '@/api-response'
import { hashRefreshToken } from 'shared/utils/auth-token'
import { checkRateLimit } from 'shared/utils/rate-limit'
import { getTrustedClientIp } from 'shared/utils/ip'

export const POST = withCors(async (req: NextRequest) => {
  const ip = getTrustedClientIp(req)
  const rl = await checkRateLimit(`token-revoke:${ip}`, 30, 60_000)
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
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  })

  return new NextResponse(null, { status: 204 })
})
