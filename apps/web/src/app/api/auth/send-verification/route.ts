import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isValidEmail, isDisposableEmail, generateVerificationCode, VERIFICATION_CODE_TTL } from "@/lib/verification"
import { checkRateLimit } from "@/lib/rate-limit"
import { sendVerificationEmail } from "@/lib/mail"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    // Validate email format
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "请输入有效的邮箱地址" }, { status: 400 })
    }

    // Check disposable email
    if (isDisposableEmail(email)) {
      return NextResponse.json({ error: "请使用真实邮箱地址" }, { status: 400 })
    }

    // Rate limit
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const rateCheck = checkRateLimit(`verify:${ip}`, 3, 60_000)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 })
    }

    // Check email not already registered
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 })
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
      return NextResponse.json({ error: "验证码发送失败" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Send verification error:", error)
    return NextResponse.json({ error: "验证码发送失败" }, { status: 500 })
  }
}