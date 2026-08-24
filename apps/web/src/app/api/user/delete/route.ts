import { NextResponse } from "next/server"
import { prisma } from "shared/utils/prisma"
import { auth } from "@/auth"
import { consumeVerificationCode } from "shared/utils/verification-code"
import { normalizeEmail } from "shared/utils/verification"
import { checkLoginRateLimit, recordLoginAttempt } from "shared/utils/login-rate-limit"
import { isSameOrigin } from "shared/utils/csrf"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "loginRequired" }, { status: 401 })
    }

    // CSRF 防护：校验同源
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    const { email: rawEmail, code } = await req.json()
    const email = normalizeEmail(rawEmail ?? '')
    if (!email || !code) {
      return NextResponse.json({ error: "invalidParams" }, { status: 400 })
    }

    // 先校验归属：邮箱必须是当前登录用户。
    // 原实现先消费验证码后校验归属，导致该接口成为可无限爆破他人验证码的预言机。
    if (normalizeEmail(session.user.email ?? '') !== email) {
      return NextResponse.json({ error: "invalidParams" }, { status: 400 })
    }

    // 限流：按邮箱计数，防止验证码爆破
    const rateKey = `delete:${email}`
    const rateCheck = await checkLoginRateLimit(rateKey)
    if (!rateCheck.allowed) {
      const minutesRemaining = Math.ceil((rateCheck.lockedUntil! - Date.now()) / 60000)
      return NextResponse.json({ error: "tooManyAttempts", minutesRemaining }, { status: 429 })
    }

    // 原子消费验证码（用途绑定 deleteAccount）
    const ok = await consumeVerificationCode(email, code, 'deleteAccount')
    if (!ok) {
      await recordLoginAttempt(rateKey, false)
      return NextResponse.json({ error: "verifyFailed" }, { status: 401 })
    }
    await recordLoginAttempt(rateKey, true)

    const userId = session.user.id
    await prisma.$transaction([
      prisma.favorite.deleteMany({ where: { userId } }),
      prisma.session.deleteMany({ where: { userId } }),
      prisma.account.deleteMany({ where: { userId } }),
      prisma.verificationCode.deleteMany({ where: { email } }),
      prisma.user.delete({ where: { id: userId } }),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Delete account error:", error)
    return NextResponse.json({ error: "requestFailed" }, { status: 500 })
  }
}
