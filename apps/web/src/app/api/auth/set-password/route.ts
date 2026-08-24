import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "shared/utils/prisma"
import { consumeVerificationCode } from "shared/utils/verification-code"
import { normalizeEmail } from "shared/utils/verification"
import { checkLoginRateLimit, recordLoginAttempt } from "shared/utils/login-rate-limit"
import { isSameOrigin } from "shared/utils/csrf"

// 密码强度验证
function validatePassword(password: string): string | null {
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

export async function POST(req: Request) {
  try {
    // CSRF 防护：校验同源
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    const session = await auth()
    // 一次性读取 body（修复原来二次 req.json() 导致忘记密码流程必然 500 的 bug）
    const { password, code, email: rawEmail, currentPassword } = await req.json()

    // 已登录用户：通过 session 设置密码
    if (session?.user?.id) {
      if (!password) {
        return NextResponse.json({ error: "invalidParams" }, { status: 400 })
      }
      const pwdErr = validatePassword(password)
      if (pwdErr) {
        return NextResponse.json({ error: pwdErr }, { status: 400 })
      }

      const me = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { passwordHash: true },
      })

      // 若已设密码，服务端强制校验当前密码（防止会话劫持后无重认证即改密）
      if (me?.passwordHash) {
        if (!currentPassword) {
          return NextResponse.json({ error: "currentPasswordWrong" }, { status: 401 })
        }
        const bcrypt = await import("bcryptjs")
        const ok = await bcrypt.compare(currentPassword, me.passwordHash)
        if (!ok) {
          return NextResponse.json({ error: "currentPasswordWrong" }, { status: 401 })
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
    const email = normalizeEmail(rawEmail ?? '')
    if (!email || !password || !code) {
      return NextResponse.json({ error: "invalidParams" }, { status: 400 })
    }

    const pwdErr = validatePassword(password)
    if (pwdErr) {
      return NextResponse.json({ error: pwdErr }, { status: 400 })
    }

    // 限流：按邮箱计数（修复双读 bug 后该分支可达，必须加限流以防验证码爆破）
    const rateKey = `reset:${email}`
    const rateCheck = await checkLoginRateLimit(rateKey)
    if (!rateCheck.allowed) {
      const minutesRemaining = Math.ceil((rateCheck.lockedUntil! - Date.now()) / 60000)
      return NextResponse.json({ error: "tooManyAttempts", minutesRemaining }, { status: 429 })
    }

    // 原子消费验证码（用途绑定 forgotPassword + 失败计数）
    const ok = await consumeVerificationCode(email, code, 'forgotPassword')
    if (!ok) {
      await recordLoginAttempt(rateKey, false)
      return NextResponse.json({ error: "verifyFailed" }, { status: 401 })
    }
    await recordLoginAttempt(rateKey, true)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // 不泄露邮箱是否注册
      return NextResponse.json({ error: "verifyFailed" }, { status: 401 })
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
    return NextResponse.json({ error: "registerFailed" }, { status: 500 })
  }
}
