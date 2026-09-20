// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/device/token —— device flow 轮询兑换（架构 §4.2.1）
//
//   body: { deviceCode } →
//     409 authorizationPending  尚未在浏览器确认（客户端按 interval 继续轮询）
//     200 TokenPair             已确认，且该 deviceCode 已被消费（不可重复兑换）
//     404 deviceCodeNotFound / 410 deviceCodeExpired / 409 deviceCodeConsumed
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from 'shared/utils/prisma'
import { withCors } from '@/api-cors'
import { errorResponse, tooManyRequestsResponse } from '@/api-response'
import { issueTokenPair } from '@/issue-token-pair'
import { checkRateLimit } from 'shared/utils/rate-limit'
import { getTrustedClientIp } from 'shared/utils/ip'

export const POST = withCors(async (req: NextRequest) => {
  const ip = getTrustedClientIp(req)
  const rl = await checkRateLimit(`device-token:${ip}`, 60, 60_000)
  if (!rl.allowed) return tooManyRequestsResponse(rl.resetAt)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return errorResponse('invalidJson')
  }

  const deviceCode = (body as Record<string, unknown> | null)?.deviceCode
  if (typeof deviceCode !== 'string' || deviceCode.length === 0) {
    return errorResponse('missingDeviceCode')
  }

  const record = await prisma.deviceCode.findUnique({ where: { deviceCode } })
  if (!record) {
    return errorResponse('deviceCodeNotFound')
  }
  if (record.consumedAt) {
    return errorResponse('deviceCodeConsumed')
  }
  if (record.expiresAt.getTime() <= Date.now()) {
    return errorResponse('deviceCodeExpired')
  }
  if (!record.approvedAt || !record.userId) {
    // 记录轮询时间，便于运维观测「设备在等但用户没确认」
    await prisma.deviceCode.update({ where: { id: record.id }, data: { lastPolledAt: new Date() } })
    return errorResponse('authorizationPending')
  }

  const user = await prisma.user.findUnique({ where: { id: record.userId } })
  if (!user) {
    return errorResponse('deviceCodeNotFound')
  }

  // 条件抢占：并发轮询下只有一方能消费掉这个 deviceCode
  const claimed = await prisma.deviceCode.updateMany({
    where: { id: record.id, consumedAt: null },
    data: { consumedAt: new Date(), lastPolledAt: new Date() },
  })
  if (claimed.count !== 1) {
    return errorResponse('deviceCodeConsumed')
  }

  const pair = await issueTokenPair({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    clientId: record.clientId,
  })
  return NextResponse.json(pair)
})
