import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "shared/utils/prisma"
import { checkLoginRateLimit, recordLoginAttempt } from "shared/utils/login-rate-limit"
import { normalizeEmail } from "shared/utils/verification"

// POST /api/auth/check-password
// 仅限已登录用户校验自己的当前密码（账号页修改密码前置校验）。
// 原实现未鉴权、且无密码模式会回显 userExists/hasPassword，构成未认证的用户枚举预言机，
// 并使用独立限流 key 成为绕过登录锁定的第二爆破通道。现统一使用会话邮箱 + 登录限流 key。
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "loginRequired" }, { status: 401 })
    }

    const { password } = await req.json()
    if (!password) {
      return NextResponse.json({ error: "invalidParams" }, { status: 400 })
    }

    const email = normalizeEmail(session.user.email)
    // 复用登录限流 key，确保此处的失败也计入登录锁定，消除第二爆破通道
    const rateKey = `login:${email}`
    const rateCheck = checkLoginRateLimit(rateKey)
    if (!rateCheck.allowed) {
      const minutesRemaining = Math.ceil((rateCheck.lockedUntil! - Date.now()) / 60000)
      return NextResponse.json({ error: "tooManyAttempts", minutesRemaining }, { status: 429 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { passwordHash: true },
    })
    if (!user || !user.passwordHash) {
      return NextResponse.json({ hasPassword: false }, { status: 401 })
    }

    const bcrypt = await import("bcryptjs")
    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      recordLoginAttempt(rateKey, false)
      return NextResponse.json({ hasPassword: true, valid: false }, { status: 401 })
    }

    recordLoginAttempt(rateKey, true)
    return NextResponse.json({ hasPassword: true, valid: true })
  } catch {
    return NextResponse.json({ error: "requestFailed" }, { status: 500 })
  }
}
