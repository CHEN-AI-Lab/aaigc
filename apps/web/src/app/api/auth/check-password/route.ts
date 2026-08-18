import { NextResponse } from "next/server"
import { prisma } from "shared/utils/prisma"

// POST /api/auth/check-password
// 验证当前密码是否正确（用于修改密码时验证旧密码）
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: "invalidParams" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { passwordHash: true },
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json({ hasPassword: false }, { status: 401 })
    }

    // 用 bcrypt 验证密码
    const bcrypt = await import("bcryptjs")
    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ hasPassword: true, valid: false }, { status: 401 })
    }

    return NextResponse.json({ hasPassword: true, valid: true })
  } catch {
    return NextResponse.json({ error: "requestFailed" }, { status: 500 })
  }
}