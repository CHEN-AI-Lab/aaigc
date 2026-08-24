import { NextResponse, NextRequest } from "next/server"
import { checkVerificationCode } from "shared/utils/verification-code"
import { normalizeEmail } from "shared/utils/verification"
import { checkRateLimit } from "shared/utils/rate-limit"
import { getTrustedClientIp } from "shared/utils/ip"
import { checkLoginRateLimit, recordLoginAttempt } from "shared/utils/login-rate-limit"
import { isSameOrigin } from "shared/utils/csrf"

export async function POST(req: NextRequest) {
  try {
    // CSRF 防护：校验同源
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }
    const { email: rawEmail, code } = await req.json()
    const email = normalizeEmail(rawEmail ?? '')
    if (!email || !code) {
      return NextResponse.json({ error: "invalidParams" }, { status: 400 })
    }

    // IP 限流（可信来源）
    const ip = getTrustedClientIp(req)
    const ipRate = checkRateLimit(`verify-attempt:${ip}`, 5, 60_000)
    if (!ipRate.allowed) {
      return NextResponse.json({ error: "tooManyAttempts" }, { status: 429 })
    }

    // 邮箱级限流（防分布式 IP 爆破）
    const rateKey = `verify:${email}`
    const rateCheck = await checkLoginRateLimit(rateKey)
    if (!rateCheck.allowed) {
      const minutesRemaining = Math.ceil((rateCheck.lockedUntil! - Date.now()) / 60000)
      return NextResponse.json({ error: "tooManyAttempts", minutesRemaining }, { status: 429 })
    }

    // 非消费式校验（用途 register）。
    // 原实现在此标记 used:true，导致随后 register 的 findFirst(used:false) 必然失败 → 注册流程不可用。
    const ok = await checkVerificationCode(email, code, 'register')
    if (!ok) {
      await recordLoginAttempt(rateKey, false)
      return NextResponse.json({ error: "verifyFailed" }, { status: 401 })
    }
    await recordLoginAttempt(rateKey, true)

    return NextResponse.json({ success: true, verified: true })
  } catch (error) {
    console.error("Verify email error:", error)
    return NextResponse.json({ error: "verifyError" }, { status: 500 })
  }
}
