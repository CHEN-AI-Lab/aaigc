import { NextResponse } from "next/server"
import { prisma } from "shared/utils/prisma"
import { checkLoginRateLimit, recordLoginAttempt } from "shared/utils/login-rate-limit"

// POST /api/auth/check-password
// 两个用途（按是否带 password 区分）：
// 1. 无 password：登录页 pre-check，仅查询账号是否存在、是否设置了密码
//    → 返回 { userExists, hasPassword }
// 2. 带 password：账号页修改密码时验证旧密码
//    → 返回 { hasPassword, valid }
// 两种模式都受该邮箱的速率限制保护，防止暴力枚举/猜测。
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email) {
      return NextResponse.json({ error: "missingEmail" }, { status: 400 })
    }

    // Rate limit: 独立于登录锁定的 key（避免输错旧密码把登录也锁死）
    const rateKey = `passwordCheck:${email.toLowerCase()}`
    const rateCheck = checkLoginRateLimit(rateKey)
    if (!rateCheck.allowed) {
      const minutesRemaining = Math.ceil((rateCheck.lockedUntil! - Date.now()) / 60000)
      return NextResponse.json({ error: "tooManyAttempts", minutesRemaining }, { status: 429 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { passwordHash: true },
    })

    // 模式 1：仅查询存在性（登录页 pre-check，不触发失败计数）
    if (!password) {
      return NextResponse.json({ userExists: !!user, hasPassword: !!user?.passwordHash })
    }

    // 模式 2：验证旧密码
    if (!user || !user.passwordHash) {
      return NextResponse.json({ hasPassword: false }, { status: 401 })
    }

    // 用 bcrypt 验证密码
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