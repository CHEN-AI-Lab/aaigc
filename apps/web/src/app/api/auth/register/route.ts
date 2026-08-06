import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isValidEmail } from "@/lib/verification"

export async function POST(req: Request) {
  try {
    const { email, password, name, code } = await req.json()

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "请输入有效的邮箱地址" }, { status: 400 })
    }

    // Validate password
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "密码至少 8 位" }, { status: 400 })
    }

    // Validate name
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "请输入昵称" }, { status: 400 })
    }

    // Verify code
    if (!code) {
      return NextResponse.json({ error: "请先验证邮箱" }, { status: 400 })
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
      return NextResponse.json({ error: "验证码错误或已过期" }, { status: 401 })
    }

    // Check email not already registered
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 })
    }

    // Create user
    const bcrypt = await import("bcryptjs")
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name.trim(),
        role: "user",
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
    return NextResponse.json({ error: "注册失败" }, { status: 500 })
  }
}