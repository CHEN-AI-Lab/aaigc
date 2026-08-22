import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { prisma } from "shared/utils/prisma"
import { isValidEmail, isDisposableEmail, generateVerificationCode, VERIFICATION_CODE_TTL, normalizeEmail } from "shared/utils/verification"
import { checkRateLimit } from "shared/utils/rate-limit"
import { getTrustedClientIp } from "shared/utils/ip"
import { sendVerificationEmail } from "shared/utils/mail"
import { isSameOrigin } from "shared/utils/csrf"

const VALID_PURPOSES = new Set(['register', 'login', 'forgotPassword', 'changePassword', 'deleteAccount'])
const VALID_LOCALES = new Set(['en', 'zh-CN', 'zh-TW', 'ja'])

export async function POST(req: NextRequest) {
  try {
    // CSRF 防护：校验同源
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }
    const { email: rawEmail, purpose: rawPurpose, locale: rawLocale } = await req.json()
    const email = normalizeEmail(rawEmail ?? '')
    const purpose = VALID_PURPOSES.has(rawPurpose) ? rawPurpose : 'register'
    const locale = VALID_LOCALES.has(rawLocale) ? rawLocale : 'en'

    // Validate email format
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "invalidEmail" }, { status: 400 })
    }

    // Check disposable email
    if (isDisposableEmail(email)) {
      return NextResponse.json({ error: "realEmail" }, { status: 400 })
    }

    // Rate limit（基于平台可信 IP，避免 X-Forwarded-For 伪造绕过）
    const ip = getTrustedClientIp(req)
    const rateCheck = checkRateLimit(`verify:${ip}`, 3, 60_000)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "rateLimited" }, { status: 429 })
    }

    // Check email registration status（先于冷却检查：已注册是永久事实，优先提示，避免被"过于频繁"遮蔽）
    if (purpose === 'login') {
      // 登录：必须已注册
      const existing = await prisma.user.findUnique({ where: { email } })
      if (!existing) {
        return NextResponse.json({ error: "emailNotRegistered" }, { status: 404 })
      }
    } else if (purpose !== 'forgotPassword' && purpose !== 'changePassword' && purpose !== 'deleteAccount') {
      // 注册：必须未注册（登录/forgotPassword/changePassword/deleteAccount 跳过此检查）
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json({ error: "emailRegistered" }, { status: 409 })
      }
    }

    // Check 120-second send interval（无条件时间窗，不依赖 used 状态，
    // 防止攻击者将上一枚码标记为 used 后立即绕过冷却）
    const recent = await prisma.verificationCode.findFirst({
      where: { email, createdAt: { gte: new Date(Date.now() - 120000) } },
      orderBy: { createdAt: "desc" },
    })
    if (recent) {
      const elapsed = Math.floor((Date.now() - recent.createdAt.getTime()) / 1000)
      const remaining = Math.max(1, 120 - elapsed)
      return NextResponse.json({ error: "codeRecentlySent", remainingSeconds: remaining }, { status: 429 })
    }

    // Generate code（加密安全，见 verification.ts）
    const code = generateVerificationCode()

    // Store in database（带 purpose 绑定）
    await prisma.verificationCode.create({
      data: {
        email,
        code,
        purpose,
        expiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL),
      },
    })

    // Send email with locale support
    const sent = await sendVerificationEmail(email, code, locale, purpose)
    if (!sent.success) {
      return NextResponse.json({ error: "sendFailed" }, { status: 500 })
    }

    // In dev mode, return the code so the frontend can display it for testing
    return NextResponse.json({ success: true, devCode: sent.devCode })
  } catch (error) {
    console.error("Send verification error:", error)
    return NextResponse.json({ error: "sendFailed" }, { status: 500 })
  }
}
