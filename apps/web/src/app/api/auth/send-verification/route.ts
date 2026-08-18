import { NextResponse } from "next/server"
import { prisma } from "shared/utils/prisma"
import { isValidEmail, isDisposableEmail, generateVerificationCode, VERIFICATION_CODE_TTL } from "shared/utils/verification"
import { checkRateLimit } from "shared/utils/rate-limit"
import { sendVerificationEmail } from "shared/utils/mail"

export async function POST(req: Request) {
  try {
    const { email, purpose, locale } = await req.json()

    // Validate email format
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "invalidEmail" }, { status: 400 })
    }

    // Check disposable email
    if (isDisposableEmail(email)) {
      return NextResponse.json({ error: "realEmail" }, { status: 400 })
    }

    // Rate limit
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const rateCheck = checkRateLimit(`verify:${ip}`, 3, 60_000)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "rateLimited" }, { status: 429 })
    }

    // Check 120-second send interval
    const recent = await prisma.verificationCode.findFirst({
      where: { email, used: false, createdAt: { gte: new Date(Date.now() - 120000) } },
      orderBy: { createdAt: "desc" },
    })
    if (recent) {
      const elapsed = Math.floor((Date.now() - recent.createdAt.getTime()) / 1000)
      const remaining = Math.max(1, 120 - elapsed)
      return NextResponse.json({ error: "codeRecentlySent", remainingSeconds: remaining }, { status: 429 })
    }

    // Check email registration status
    if (purpose === 'login') {
      // 登录：必须已注册
      const existing = await prisma.user.findUnique({ where: { email } })
      if (!existing) {
        return NextResponse.json({ error: "emailNotRegistered" }, { status: 404 })
      }
    } else if (purpose !== 'forgotPassword' && purpose !== 'changePassword' && purpose !== 'deleteAccount') {
      // 注册：必须未注册（登录/forgotPassword/changePassword 跳过此检查）
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json({ error: "emailRegistered" }, { status: 409 })
      }
    }

    // Generate code
    const code = generateVerificationCode()

    // Store in database
    await prisma.verificationCode.create({
      data: {
        email,
        code,
        expiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL),
      },
    })

    // Send email with locale support
    const sent = await sendVerificationEmail(email, code, locale)
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