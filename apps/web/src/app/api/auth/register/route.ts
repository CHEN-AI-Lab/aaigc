import { NextResponse, NextRequest } from "next/server"
import { prisma } from "shared/utils/prisma"
import { isValidEmail, normalizeEmail } from "shared/utils/verification"
import { consumeVerificationCode } from "shared/utils/verification-code"
import { checkRateLimit } from "shared/utils/rate-limit"
import { getTrustedClientIp } from "shared/utils/ip"
import { checkLoginRateLimit, recordLoginAttempt } from "shared/utils/login-rate-limit"
import { isSameOrigin } from "shared/utils/csrf"

// 与 set-password 一致的密码强度校验，避免注册路径弱于改密路径
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

export async function POST(req: NextRequest) {
  try {
    // CSRF 防护：校验同源
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }
    const { email: rawEmail, password, name: rawName, code, agreeTerms } = await req.json()
    const email = normalizeEmail(rawEmail ?? '')

    // 限流（注册路由原本无任何限流，验证码校验可被无限爆破 + bcrypt CPU DoS）
    const ip = getTrustedClientIp(req)
    const ipRate = await checkRateLimit(`register:${ip}`, 5, 60_000)
    if (!ipRate.allowed) {
      return NextResponse.json({ error: "tooManyAttempts" }, { status: 429 })
    }

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "invalidEmail" }, { status: 400 })
    }

    // Validate privacy consent（严格布尔，避免任意真值通过）
    if (agreeTerms !== true) {
      return NextResponse.json({ error: "agreeTermsRequired" }, { status: 400 })
    }

    // Validate password (optional) — 与改密路径一致的强度校验
    if (password !== undefined && password !== null && password !== '') {
      if (typeof password !== 'string') {
        return NextResponse.json({ error: "invalidParams" }, { status: 400 })
      }
      const pwdErr = validatePassword(password)
      if (pwdErr) {
        return NextResponse.json({ error: pwdErr }, { status: 400 })
      }
    }

    // Validate name（类型 + 长度上限，避免无上限字符串写库）
    if (typeof rawName !== 'string' || rawName.trim().length === 0) {
      return NextResponse.json({ error: "nameRequired" }, { status: 400 })
    }
    const name = rawName.trim().slice(0, 50)

    // Verify code（原子消费，用途 register）
    if (!code) {
      return NextResponse.json({ error: "verifyEmailFirst" }, { status: 400 })
    }

    // 邮箱级失败计数（防分布式 IP 爆破验证码）
    const rateKey = `register-code:${email}`
    const rateCheck = await checkLoginRateLimit(rateKey)
    if (!rateCheck.allowed) {
      const minutesRemaining = Math.ceil((rateCheck.lockedUntil! - Date.now()) / 60000)
      return NextResponse.json({ error: "tooManyAttempts", minutesRemaining }, { status: 429 })
    }

    const ok = await consumeVerificationCode(email, code, 'register')
    if (!ok) {
      await recordLoginAttempt(rateKey, false)
      return NextResponse.json({ error: "verifyFailed" }, { status: 401 })
    }
    await recordLoginAttempt(rateKey, true)

    // Check email not already registered
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "emailRegistered" }, { status: 409 })
    }

    // Create user
    let passwordHash = null
    if (password) {
      const bcrypt = await import("bcryptjs")
      const salt = await bcrypt.genSalt(12)
      passwordHash = await bcrypt.hash(password, salt)
    }

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: "user",
        emailVerified: new Date(), // 注册即已验证邮箱（验证码已校验）
        termsAgreedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "registerFailed" }, { status: 500 })
  }
}
