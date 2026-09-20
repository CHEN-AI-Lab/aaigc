// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/device/approve —— 用户在浏览器里确认设备码（device flow 的授权端）
//
//   body: { userCode } → { ok: true }
//
// 为什么需要这个路由：设计 §4.2.1 只列了 device/code 与 device/token，
// 但没有「谁来把 userCode 绑定到某个用户」这一步 —— 缺了它，device/token
// 永远返回 authorizationPending，CLI / 桌面端无法登录。这是补齐授权端的最小实现。
//
// 鉴权：必须已登录（cookie 或 Bearer 均可），且 cookie 通道走同源校验（防 CSRF）。
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from 'shared/utils/prisma'
import { withCors } from '@/api-cors'
import { errorResponse, tooManyRequestsResponse } from '@/api-response'
import { resolveAuthResult } from '@/auth-guard'
import { normalizeUserCode } from '@/device-flow'
import { isTrustedRequest } from 'shared/utils/csrf'
import { checkRateLimit } from 'shared/utils/rate-limit'

export const POST = withCors(async (req: NextRequest) => {
  const authResult = await resolveAuthResult(req)
  if (!authResult.ok) return errorResponse(authResult.code)
  const resolved = { session: authResult.session, mode: authResult.mode }

  // Bearer 通道豁免同源校验；cookie 通道沿用既有 isSameOrigin，Web 行为不变
  if (!isTrustedRequest(req, resolved.mode)) {
    return errorResponse('forbidden')
  }

  const userId = resolved.session.user.id
  const rl = await checkRateLimit(`device-approve:${userId}`, 20, 60_000)
  if (!rl.allowed) return tooManyRequestsResponse(rl.resetAt)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return errorResponse('invalidJson')
  }

  const rawUserCode = (body as Record<string, unknown> | null)?.userCode
  if (typeof rawUserCode !== 'string' || rawUserCode.trim().length === 0) {
    return errorResponse('missingUserCode')
  }

  const userCode = normalizeUserCode(rawUserCode)
  if (userCode.length === 0) {
    return errorResponse('missingUserCode')
  }

  const record = await prisma.deviceCode.findUnique({ where: { userCode } })
  if (!record) {
    return errorResponse('deviceCodeNotFound')
  }
  if (record.consumedAt) {
    return errorResponse('deviceCodeConsumed')
  }
  if (record.expiresAt.getTime() <= Date.now()) {
    return errorResponse('deviceCodeExpired')
  }
  // 已被别人确认 → 不允许改绑
  if (record.approvedAt && record.userId !== userId) {
    return errorResponse('deviceCodeConsumed')
  }
  // 本人重复确认 → 幂等
  if (record.approvedAt && record.userId === userId) {
    return NextResponse.json({ ok: true })
  }

  await prisma.deviceCode.update({
    where: { id: record.id },
    data: { userId, approvedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
})
