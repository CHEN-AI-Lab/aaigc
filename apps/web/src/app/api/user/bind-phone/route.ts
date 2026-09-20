// ─────────────────────────────────────────────────────────────────────────────
// POST /api/user/bind-phone
//
// 设置页绑定手机号。参照 CookMate：
// - 手机号一旦绑定，不可修改、不可解绑（数据库已绑定则拒绝）
// - 无短信验证码服务，绑定身份验证使用当前密码
// - 未设置密码的用户必须先设置密码（setPasswordFirst）
//
// 鉴权：resolveAuth（Bearer 优先，回退 cookie）
// CSRF：Bearer 豁免同源，cookie 沿用既有校验。
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from 'shared/utils/prisma'
import { resolveAuthResult } from '@/auth-guard'
import { withCors } from '@/api-cors'
import { errorResponse, tooManyRequestsResponse } from '@/api-response'
import { checkRateLimit } from 'shared/utils/rate-limit'
import { isTrustedRequest } from 'shared/utils/csrf'

/** 中国大陆手机号 */
const PHONE_PATTERN = /^1[3-9]\d{9}$/

/** 明显假号：全相同数字 / 全 0 / 顺序号 */
function isObviouslyFakePhone(phone: string): boolean {
  return (
    phone === '11111111111' ||
    phone === '00000000000' ||
    phone === '12345678901' ||
    /^1(\d)\1{9}$/.test(phone)
  )
}

function retryAfterSeconds(resetAt: number): number {
  return Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
}

export const POST = withCors(async (req: NextRequest) => {
  try {
    const authResult = await resolveAuthResult(req)
    if (!authResult.ok) return errorResponse(authResult.code)
    const resolved = { session: authResult.session, mode: authResult.mode }

    if (!isTrustedRequest(req, resolved.mode)) {
      return errorResponse('forbidden')
    }

    const userId = resolved.session.user.id

    // 限流：每用户 5 次 / 10 分钟（既有行为不变）
    const rl = await checkRateLimit(`bind-phone:${userId}`, 5, 600_000)
    if (!rl.allowed) {
      const seconds = retryAfterSeconds(rl.resetAt)
      return tooManyRequestsResponse(rl.resetAt, { retryAfter: seconds })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return errorResponse('invalidJson')
    }

    const { phone, password } = (body ?? {}) as Record<string, unknown>

    if (typeof phone !== 'string' || !PHONE_PATTERN.test(phone)) {
      return errorResponse('invalidPhone')
    }
    if (isObviouslyFakePhone(phone)) {
      return errorResponse('invalidPhone')
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, passwordHash: true },
    })
    if (!user) {
      return errorResponse('userNotFound')
    }

    // 不可解绑：已绑定手机号则拒绝修改
    if (user.phone) {
      return errorResponse('phoneAlreadyBound')
    }

    // 密码验证（无短信验证码，用当前密码确认身份）
    if (!user.passwordHash) {
      return errorResponse('setPasswordFirst')
    }
    if (typeof password !== 'string' || password.length === 0) {
      return errorResponse('invalidParams')
    }
    const bcrypt = await import('bcryptjs')
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      // 既有状态码 401（映射表为 400）—— 显式覆盖，避免改变 Web 已依赖的行为
      return errorResponse('currentPasswordWrong', { status: 401 })
    }

    // 唯一性：该手机号不能被其他账号占用
    const existing = await prisma.user.findUnique({ where: { phone } })
    if (existing && existing.id !== userId) {
      return errorResponse('phoneBound')
    }

    await prisma.user.update({
      where: { id: userId },
      data: { phone },
    })

    return NextResponse.json({ success: true, phone })
  } catch (error) {
    console.error('Bind phone error:', error)
    return errorResponse('bindFailed')
  }
})

export const OPTIONS = withCors(async () => new NextResponse(null, { status: 204 }))
