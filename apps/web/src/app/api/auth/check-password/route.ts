// POST /api/auth/check-password
// 仅限已登录用户校验自己的当前密码（账号页修改密码前置校验）。
// 原实现未鉴权、且无密码模式会回显 userExists/hasPassword，构成未认证的用户枚举预言机，
// 并使用独立限流 key 成为绕过登录锁定的第二爆破通道。现统一使用会话邮箱 + 登录限流 key。
// 鉴权：cookie 或 Bearer 双通道（getSessionOrToken），Web 行为不变。
//
// 改造：错误响应统一走 errorResponse + 注入 CORS / OPTIONS 预检。
// 注意：成功与「密码校验失败」分支返回的是 hasPassword / valid 字段（非 error 码），
// 这是前端已依赖的既有契约，形状一字未动。

import { NextRequest, NextResponse } from "next/server"
import { resolveAuthResult } from "@/auth-guard"
import { withCors } from "@/api-cors"
import { errorResponse } from "@/api-response"
import { prisma } from "shared/utils/prisma"
import { checkLoginRateLimit, recordLoginAttempt } from "shared/utils/login-rate-limit"
import { normalizeEmail } from "shared/utils/verification"

export const POST = withCors(async (req: NextRequest) => {
  try {
    const authResult = await resolveAuthResult(req)
    if (!authResult.ok) return errorResponse(authResult.code)
    const session = authResult.session
    // 契约不变：会话里没有 email（例如 Bearer 未携带）仍然是 401 loginRequired
    if (!session.user.email) {
      return errorResponse("loginRequired")
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return errorResponse("invalidJson")
    }
    const password = (body as Record<string, unknown> | null)?.password
    if (typeof password !== "string" || password.length === 0) {
      return errorResponse("invalidParams")
    }

    const email = normalizeEmail(session.user.email)
    // 复用登录限流 key，确保此处的失败也计入登录锁定，消除第二爆破通道
    const rateKey = `login:${email}`
    const rateCheck = await checkLoginRateLimit(rateKey)
    if (!rateCheck.allowed) {
      const minutesRemaining = Math.ceil((rateCheck.lockedUntil! - Date.now()) / 60000)
      return errorResponse("tooManyAttempts", { extra: { minutesRemaining } })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { passwordHash: true },
    })
    if (!user || !user.passwordHash) {
      // 既有契约：401 + { hasPassword: false }（无 error 字段，前端依赖）
      return NextResponse.json({ hasPassword: false }, { status: 401 })
    }

    const bcrypt = await import("bcryptjs")
    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      await recordLoginAttempt(rateKey, false)
      // 既有契约：401 + { hasPassword: true, valid: false }
      return NextResponse.json({ hasPassword: true, valid: false }, { status: 401 })
    }

    await recordLoginAttempt(rateKey, true)
    return NextResponse.json({ hasPassword: true, valid: true })
  } catch {
    return errorResponse("requestFailed")
  }
})

export const OPTIONS = withCors(async () => new NextResponse(null, { status: 204 }))
