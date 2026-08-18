import { NextResponse } from "next/server"
import { prisma } from "shared/utils/prisma"
import { auth } from "@/auth"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "loginRequired" }, { status: 401 })
  }

  const userId = session.user.id
  const body = await request.json()
  const provider = body?.provider as string

  if (!provider) {
    return NextResponse.json({ error: "invalidProvider" }, { status: 400 })
  }

  // 邮箱验证码登录永远不可解绑——这是用户的保底登录方式
  if (provider === "email" || provider === "credentials") {
    return NextResponse.json({ error: "cannotUnlinkEmail" }, { status: 400 })
  }

  // 拿到当前用户所有绑定方式和密码状态
  const [accounts, user] = await Promise.all([
    prisma.account.findMany({ where: { userId }, select: { id: true, provider: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } }),
  ])

  const hasPassword = !!user?.passwordHash
  const oauthAccounts = accounts.filter((a) => !["email", "credentials"].includes(a.provider))

  if (provider === "password") {
    if (!hasPassword) {
      return NextResponse.json({ error: "notSet" }, { status: 400 })
    }
    // 解绑密码前必须还有其他登录方式（OAuth）
    if (oauthAccounts.length === 0) {
      return NextResponse.json({ error: "mustKeepOneMethod" }, { status: 400 })
    }
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: null },
    })
    return NextResponse.json({ ok: true })
  }

  // OAuth 解绑
  const account = accounts.find((a) => a.provider === provider)
  if (!account) {
    return NextResponse.json({ error: "notFound" }, { status: 404 })
  }

  // 解绑这个 OAuth 后，必须还有 ≥1 种登录方式
  const remainingOauth = oauthAccounts.filter((a) => a.provider !== provider)
  if (remainingOauth.length === 0 && !hasPassword) {
    return NextResponse.json({ error: "mustKeepOneMethod" }, { status: 400 })
  }

  await prisma.account.delete({ where: { id: account.id } })
  return NextResponse.json({ ok: true })
}