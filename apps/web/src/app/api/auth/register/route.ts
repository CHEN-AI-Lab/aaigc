import { NextResponse } from "next/server"
import { prisma } from "shared/utils/prisma"
import { isValidEmail } from "shared/utils/verification"

export async function POST(req: Request) {
  try {
    const { email, password, name, code, agreeTerms } = await req.json()

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "invalidEmail" }, { status: 400 })
    }

    // Validate privacy consent
    if (!agreeTerms) {
      return NextResponse.json({ error: "agreeTermsRequired" }, { status: 400 })
    }

    // Validate password (optional)
    if (password && password.length < 8) {
      return NextResponse.json({ error: "passwordTooShort" }, { status: 400 })
    }

    // Validate name
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "nameRequired" }, { status: 400 })
    }

    // Verify code
    if (!code) {
      return NextResponse.json({ error: "verifyEmailFirst" }, { status: 400 })
    }

    const verification = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    })

    if (!verification) {
      return NextResponse.json({ error: "verifyFailed" }, { status: 401 })
    }

    // Check email not already registered
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "emailRegistered" }, { status: 409 })
    }

    // Create user
    let passwordHash = null
    if (password) {
      const bcrypt = await import("bcryptjs")
      const salt = await bcrypt.genSalt(10)
      passwordHash = await bcrypt.hash(password, salt)
    }

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name.trim(),
        role: "user",
        termsAgreedAt: new Date(),
      },
    })

    // Mark verification code as used
    await prisma.verificationCode.update({
      where: { id: verification.id },
      data: { used: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "registerFailed" }, { status: 500 })
  }
}