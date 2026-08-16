import { NextResponse } from "next/server"
import { prisma } from "shared/utils/prisma"

export async function POST(req: Request) {
  try {
    const { email, password, code } = await req.json()

    if (!email || !password || !code) {
      return NextResponse.json({ error: "invalidParams" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "passwordTooShort" }, { status: 400 })
    }

    // Verify code
    const record = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    })

    if (!record) {
      return NextResponse.json({ error: "verifyFailed" }, { status: 401 })
    }

    // Mark code as used
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    })

    // Find user
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: "emailNotRegistered" }, { status: 404 })
    }

    // Update password
    const bcrypt = await import("bcryptjs")
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Set password error:", error)
    return NextResponse.json({ error: "registerFailed" }, { status: 500 })
  }
}