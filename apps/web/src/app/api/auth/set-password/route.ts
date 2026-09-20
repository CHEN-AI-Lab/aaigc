// POST /api/auth/set-password
//   · 已登录（cookie 或 Bearer）：设置 / 修改密码（已设密码时必须校验当前密码）
//   · 未登录：邮箱验证码重置（忘记密码）
//
// 改造：错误响应统一走 errorResponse（错误码收敛为 ApiErrorCode 联合类型，
// 状态码取自 API_ERROR_STATUS，个别历史状态码显式覆盖）；并注入 CORS + OPTIONS 预检。

import { NextRequest, NextResponse } from "next/server"
import { resolveAuthResult } from "@/auth-guard"
import { withCors } from "@/api-cors"
import { errorResponse } from "@/api-response"
import { prisma } from "shared/utils/prisma"
import { consumeVerificationCode } from "shared/utils/verification-code"
import { normalizeEmail } from "shared/utils/verification"
import { checkLoginRateLimit, recordLoginAttempt } from "shared/utils/login-rate-limit"
import { isTrustedRequest } from "shared/utils/csrf"
import type { ApiErrorCode } from "shared/constants/error-codes"

// 密码强度验证 —— 返回值收敛为 ApiErrorCode 联合类型，写错错误码直接编译报错
function validatePassword(password: string): ApiErrorCode | null {
  if (password.length < 8) return "passwordTooShort"
  if (password.length > 128) return "passwordTooLong"
  let types = 0
  if (/[a-z]/.test(password)) types++
  if (/[A-Z]/.test(password)) types++
  if (/[0-9]/.test(password)) types++
  if (/[^a-zA-Z0-9]/.test(password)) types++
  if (types < 2) return "passwordNeedsTypes"
  const COMMON_PASSWORDS = [
    'password1', 'password123', 'qwerty123', 'qwerty1', 'trustno1',
    'abc12345', '1234qwer', '1q2w3e4r', 'passw0rd', 'admin123',
    '12345678', '87654321', '11111111', '00000000', 'aaaaaaaa',
  ]
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) return "passwordCommon"
  return null
}

export const POST = withCors(async (req: NextRequest) => {
  try {
    const authResult = await resolveAuthResult(req)
    // 带了凭证但凭证坏了 → 明确告知（tokenExpired 可 refresh 后重试，tokenInvalid 须重新登录）；
    // 「压根没带凭证」= loginRequired，继续往下走忘记密码流程，与改造前一致。
    if (!authResult.ok && authResult.code !== "loginRequired") {
      return errorResponse(authResult.code)
    }
    const resolved = authResult.ok ? { session: authResult.session, mode: authResult.mode } : null

    // CSRF 防护：按通道判定（isTrustedRequest）—— Bearer 豁免同源；
    // cookie 会话与未登录的忘记密码流程沿用原 isSameOrigin，且检查顺序与改造前一致
    // （先校验、后读 body，避免跨源请求探测 body 解析行为）。
    if (!isTrustedRequest(req, resolved?.mode ?? "cookie")) {
      return errorResponse("forbidden")
    }

    // 一次性读取 body（修复原来二次 req.json() 导致忘记密码流程必然 500 的 bug）
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return errorResponse("invalidJson")
    }
    const record = (body ?? {}) as Record<string, unknown>
    const password = typeof record.password === "string" ? record.password : ""
    const code = typeof record.code === "string" ? record.code : ""
    const rawEmail = typeof record.email === "string" ? record.email : ""
    const currentPassword = typeof record.currentPassword === "string" ? record.currentPassword : ""

    // 已登录用户：通过会话（cookie 或 Bearer）设置密码
    if (resolved?.session.user.id) {
      const session = resolved.session
      if (!password) {
        return errorResponse("invalidParams")
      }
      const pwdErr = validatePassword(password)
      if (pwdErr) {
        return errorResponse(pwdErr)
      }

      const me = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { passwordHash: true },
      })

      // 若已设密码，服务端强制校验当前密码（防止会话劫持后无重认证即改密）
      if (me?.passwordHash) {
        if (!currentPassword) {
          // 既有状态码是 401（映射表为 400）→ 显式覆盖，保持 Web 行为不变
          return errorResponse("currentPasswordWrong", { status: 401 })
        }
        const bcrypt = await import("bcryptjs")
        const ok = await bcrypt.compare(currentPassword, me.passwordHash)
        if (!ok) {
          return errorResponse("currentPasswordWrong", { status: 401 })
        }
      }

      const bcrypt = await import("bcryptjs")
      const salt = await bcrypt.genSalt(12)
      const passwordHash = await bcrypt.hash(password, salt)
      await prisma.user.update({
        where: { id: session.user.id },
        data: { passwordHash },
      })
      return NextResponse.json({ success: true })
    }

    // 未登录用户：忘记密码重置（email + 验证码）
    const email = normalizeEmail(rawEmail)
    if (!email || !password || !code) {
      return errorResponse("invalidParams")
    }

    const pwdErr = validatePassword(password)
    if (pwdErr) {
      return errorResponse(pwdErr)
    }

    // 限流：按邮箱计数（修复双读 bug 后该分支可达，必须加限流以防验证码爆破）
    const rateKey = `reset:${email}`
    const rateCheck = await checkLoginRateLimit(rateKey)
    if (!rateCheck.allowed) {
      const minutesRemaining = Math.ceil((rateCheck.lockedUntil! - Date.now()) / 60000)
      return errorResponse("tooManyAttempts", { extra: { minutesRemaining } })
    }

    // 原子消费验证码（用途绑定 forgotPassword + 失败计数）
    const ok = await consumeVerificationCode(email, code, 'forgotPassword')
    if (!ok) {
      await recordLoginAttempt(rateKey, false)
      // 既有状态码是 401（映射表为 400）→ 显式覆盖，保持 Web 行为不变
      return errorResponse("verifyFailed", { status: 401 })
    }
    await recordLoginAttempt(rateKey, true)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // 不泄露邮箱是否注册
      return errorResponse("verifyFailed", { status: 401 })
    }

    const bcrypt = await import("bcryptjs")
    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Set password error:", error)
    // 既有状态码是 500（映射表为 400）→ 显式覆盖，保持 Web 行为不变
    return errorResponse("registerFailed", { status: 500 })
  }
})

export const OPTIONS = withCors(async () => new NextResponse(null, { status: 204 }))
