import { NextResponse } from "next/server"
import { prisma } from "shared/utils/prisma"
import { auth } from "@/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "loginRequired" }, { status: 401 })
  }

  const { email, code } = await req.json()
  if (!email || !code) {
    return NextResponse.json({ error: "invalidParams" }, { status: 400 })
  }

  // 验证码验证
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

  // 确认邮箱匹配当前用户
  if (session.user.email !== email) {
    return NextResponse.json({ error: "invalidParams" }, { status: 400 })
  }

  const userId = session.user.id
  const tx = [
    prisma.favorite.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    ...(session.user.email ? [prisma.verificationCode.deleteMany({ where: { email: session.user.email } })] : []),
    prisma.user.delete({ where: { id: userId } }),
  ]
  await prisma.$transaction(tx)

  return NextResponse.json({ ok: true })
}