import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isValidEmail, isDisposableEmail, generateVerificationCode, VERIFICATION_CODE_TTL } from "@/lib/verification"
import { checkRateLimit } from "@/lib/rate-limit"
import { sendVerificationEmail } from "@/lib/mail"

export async function POST(req: Request) {
  try {
    const { email, purpose } = await req.json()

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

    // Check email registration status
    if (purpose === 'login') {
      // 登录：必须已注册
      const existing = await prisma.user.findUnique({ where: { email } })
      if (!existing) {
        return NextResponse.json({ error: "emailNotRegistered" }, { status: 404 })
      }
    } else if (purpose !== 'forgotPassword') {
      // 注册：必须未注册
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

    // Send email
    const sent = await sendVerificationEmail(email, code)
    if (!sent.success) {
      return NextResponse.json({ error: "sendFailed" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Send verification error:", error)
    return NextResponse.json({ error: "sendFailed" }, { status: 500 })
  }
}