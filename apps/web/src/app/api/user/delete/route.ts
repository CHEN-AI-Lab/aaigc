// ─────────────────────────────────────────────────────────────────────────────
// POST /api/user/delete —— 注销账号（邮箱验证码二次确认）
//
// 鉴权：resolveAuth（Bearer 优先，回退 cookie）
// CSRF：Bearer 豁免同源，cookie 沿用既有校验。
//
// 安全不变点：先校验邮箱归属、再消费验证码（否则该接口会成为可无限爆破
// 他人验证码的预言机）。
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from 'shared/utils/prisma'
import { resolveAuthResult } from '@/auth-guard'
import { withCors } from '@/api-cors'
import { errorResponse } from '@/api-response'
import { consumeVerificationCode } from 'shared/utils/verification-code'
import { normalizeEmail } from 'shared/utils/verification'
import { checkLoginRateLimit, recordLoginAttempt } from 'shared/utils/login-rate-limit'
import { isTrustedRequest } from 'shared/utils/csrf'

export const POST = withCors(async (req: NextRequest) => {
  try {
    const authResult = await resolveAuthResult(req)
    if (!authResult.ok) return errorResponse(authResult.code)
    const resolved = { session: authResult.session, mode: authResult.mode }

    if (!isTrustedRequest(req, resolved.mode)) {
      return errorResponse('forbidden')
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return errorResponse('invalidJson')
    }

    const { email: rawEmail, code } = (body ?? {}) as Record<string, unknown>
    const email = normalizeEmail(typeof rawEmail === 'string' ? rawEmail : '')
    if (!email || !code || typeof code !== 'string') {
      return errorResponse('invalidParams')
    }

    // 先校验归属：邮箱必须是当前登录用户。
    if (normalizeEmail(resolved.session.user.email ?? '') !== email) {
      return errorResponse('invalidParams')
    }

    // 限流：按邮箱计数，防止验证码爆破
    const rateKey = `delete:${email}`
    const rateCheck = await checkLoginRateLimit(rateKey)
    if (!rateCheck.allowed) {
      const minutesRemaining = Math.max(
        1,
        Math.ceil(((rateCheck.lockedUntil ?? Date.now()) - Date.now()) / 60000),
      )
      return errorResponse('tooManyAttempts', { extra: { minutesRemaining } })
    }

    // 原子消费验证码（用途绑定 deleteAccount）
    const ok = await consumeVerificationCode(email, code, 'deleteAccount')
    if (!ok) {
      await recordLoginAttempt(rateKey, false)
      // 既有状态码 401（映射表为 400）—— 显式覆盖，避免改变 Web 已依赖的行为
      return errorResponse('verifyFailed', { status: 401 })
    }
    await recordLoginAttempt(rateKey, true)

    const userId = resolved.session.user.id
    await prisma.$transaction([
      prisma.favorite.deleteMany({ where: { userId } }),
      prisma.session.deleteMany({ where: { userId } }),
      prisma.account.deleteMany({ where: { userId } }),
      prisma.verificationCode.deleteMany({ where: { email } }),
      prisma.user.delete({ where: { id: userId } }),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Delete account error:', error)
    return errorResponse('requestFailed')
  }
})

export const OPTIONS = withCors(async () => new NextResponse(null, { status: 204 }))
