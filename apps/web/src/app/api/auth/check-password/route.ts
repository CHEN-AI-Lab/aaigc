import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/auth/check-password
// 检查账号是否存在、是否设置了密码
export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: "invalidParams" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ userExists: false, hasPassword: false })
    }

    return NextResponse.json({
      userExists: true,
      hasPassword: !!user.passwordHash,
    })
  } catch {
    return NextResponse.json({ error: "requestFailed" }, { status: 500 })
  }
}