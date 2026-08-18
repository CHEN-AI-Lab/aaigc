import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "shared/utils/prisma"

// 密码强度验证
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

export async function POST(req: Request) {
  try {
    const session = await auth()
    const { password, code } = await req.json()

    // 已登录用户：通过 session 设置密码（无需验证码）
    if (session?.user?.id) {
      if (!password) {
        return NextResponse.json({ error: "invalidParams" }, { status: 400 })
      }
      const pwdErr = validatePassword(password)
      if (pwdErr) {
        return NextResponse.json({ error: pwdErr }, { status: 400 })
      }
      const bcrypt = await import("bcryptjs")
      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash(password, salt)
      await prisma.user.update({
        where: { id: session.user.id },
        data: { passwordHash },
      })
      return NextResponse.json({ success: true })
    }

    // 未登录用户：需要 email + 验证码（用于忘记密码重置）
    const { email } = await req.json()
    if (!email || !password || !code) {
      return NextResponse.json({ error: "invalidParams" }, { status: 400 })
    }

    const pwdErr = validatePassword(password)
    if (pwdErr) {
      return NextResponse.json({ error: pwdErr }, { status: 400 })
    }

    const record = await prisma.verificationCode.findFirst({
      where: { email, code, used: false, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
    })
    if (!record) {
      return NextResponse.json({ error: "verifyFailed" }, { status: 401 })
    }
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: "emailNotRegistered" }, { status: 404 })
    }

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