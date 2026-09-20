// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/token —— Bearer 通道换取 TokenPair（架构 §4.2.1 / P0-03）
//
//   body: { grantType: 'email-code' | 'password', email, code? | password?, clientId }
//   → 200 TokenPair
//
// 与 Web 的 NextAuth Credentials 通道共用同一套限流计数器
// （email-code:<email> / login:<email>），保证「网页爆破」与「API 爆破」共享锁定。
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from 'shared/utils/prisma'
import { withCors } from '@/api-cors'
import { errorResponse, tooManyRequestsResponse } from '@/api-response'
import { issueTokenPair } from '@/issue-token-pair'
import { checkRateLimit } from 'shared/utils/rate-limit'
import { getTrustedClientIp } from 'shared/utils/ip'
import { consumeVerificationCode } from 'shared/utils/verification-code'
import { isValidEmail, normalizeEmail } from 'shared/utils/verification'
import { checkLoginRateLimit, recordLoginAttempt } from 'shared/utils/login-rate-limit'
import { apiErrorBody, statusForErrorCode } from 'shared/constants/error-codes'

const SUPPORTED_GRANTS = ['email-code', 'password'] as const
type SupportedGrant = (typeof SUPPORTED_GRANTS)[number]

function isSupportedGrant(value: unknown): value is SupportedGrant {
  return typeof value === 'string' && (SUPPORTED_GRANTS as readonly string[]).includes(value)
}

export const POST = withCors(async (req: NextRequest) => {
  // 限流：每 IP 每分钟 20 次 token 换取
  const ip = getTrustedClientIp(req)
  const rl = await checkRateLimit(`token:${ip}`, 20, 60_000)
  if (!rl.allowed) return tooManyRequestsResponse(rl.resetAt)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return errorResponse('invalidJson')
  }

  const record = (body ?? {}) as Record<string, unknown>
  const { grantType, email: rawEmail, code, password, clientId } = record

  if (typeof clientId !== 'string' || clientId.trim().length === 0) {
    return errorResponse('missingClientId')
  }
  if (!isSupportedGrant(grantType)) {
    return errorResponse('grantTypeUnsupported')
  }
  if (typeof rawEmail !== 'string' || rawEmail.trim().length === 0) {
    return errorResponse('emailRequired')
  }
  const email = normalizeEmail(rawEmail)
  if (!isValidEmail(email)) {
    return errorResponse('invalidEmail')
  }
  if (grantType === 'email-code' && (typeof code !== 'string' || code.trim().length === 0)) {
    return errorResponse('codeRequired')
  }
  if (grantType === 'password' && (typeof password !== 'string' || password.length === 0)) {
    return errorResponse('passwordRequired')
  }

  // 与 auth.ts 的 Credentials 通道共用同一计数器
  const rateKey = grantType === 'email-code' ? `email-code:${email}` : `login:${email}`
  const rateCheck = await checkLoginRateLimit(rateKey)
  if (!rateCheck.allowed) {
    const minutes = Math.max(1, Math.ceil(((rateCheck.lockedUntil ?? Date.now()) - Date.now()) / 60000))
    return NextResponse.json(
      { ...apiErrorBody('accountLocked', { minutes }) },
      { status: statusForErrorCode('accountLocked') },
    )
  }

  if (grantType === 'email-code') {
    // 原子消费验证码（用途绑定 login，与网页登录同一份码池）
    const ok = await consumeVerificationCode(email, code as string, 'login')
    if (!ok) {
      await recordLoginAttempt(rateKey, false)
      // 验证码错误：沿用 Web 既有错误码（err('verifyFailed')），状态码与既有 auth 路由一致为 401
      return errorResponse('verifyFailed', { status: 401 })
    }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    await recordLoginAttempt(rateKey, false)
    return errorResponse('invalidCredentials')
  }

  if (grantType === 'password') {
    if (!user.passwordHash) {
      await recordLoginAttempt(rateKey, false)
      return errorResponse('invalidCredentials')
    }
    const bcrypt = await import('bcryptjs')
    const valid = await bcrypt.compare(password as string, user.passwordHash)
    if (!valid) {
      await recordLoginAttempt(rateKey, false)
      return errorResponse('invalidCredentials')
    }
  } else if (!user.emailVerified) {
    // 验证码本身就是邮箱验证 —— 与 auth.ts 的 email 通道行为一致
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } })
  }

  await recordLoginAttempt(rateKey, true)

  const pair = await issueTokenPair({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    clientId: clientId.trim(),
  })
  return NextResponse.json(pair)
})
