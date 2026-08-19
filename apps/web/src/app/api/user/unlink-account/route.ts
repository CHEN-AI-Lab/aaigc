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

  // 邮箱验证码登录永远不可解绑——保底方式
  if (provider === "email" || provider === "credentials") {
    return NextResponse.json({ error: "cannotUnlinkEmail" }, { status: 400 })
  }

  // 拿到当前用户所有绑定方式和密码状态
  const [accounts, user] = await Promise.all([
    prisma.account.findMany({ where: { userId }, select: { id: true, provider: true, refresh_token: true, access_token: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } }),
  ])

  const hasPassword = !!user?.passwordHash
  const oauthAccounts = accounts.filter((a) => !["email", "credentials"].includes(a.provider))

  if (provider === "password") {
    if (!hasPassword) {
      return NextResponse.json({ error: "notSet" }, { status: 400 })
    }
    // 解绑密码前必须还有其他登录方式
    if (oauthAccounts.length === 0) {
      return NextResponse.json({ error: "mustKeepOneMethod" }, { status: 400 })
    }
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: null } })
    return NextResponse.json({ ok: true })
  }

  // OAuth 解绑
  const account = accounts.find((a) => a.provider === provider)
  if (!account) {
    return NextResponse.json({ error: "notFound" }, { status: 404 })
  }

  // 解绑后必须还有 ≥1 种登录方式
  const remainingOauth = oauthAccounts.filter((a) => a.provider !== provider)
  if (remainingOauth.length === 0 && !hasPassword) {
    return NextResponse.json({ error: "mustKeepOneMethod" }, { status: 400 })
  }

  // Google：先调官方 revoke API 取消 Google 那边的授权
  if (provider === "google") {
    const token = account.refresh_token || account.access_token
    if (token) {
      try {
        await fetch("https://oauth2.googleapis.com/revoke", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `token=${encodeURIComponent(token)}`,
        })
      } catch {
        // revoke 失败也继续——最坏情况是 Google 那边留着过期授权
      }
    }
  }

  // GitHub 没有服务端解绑 API，删 DB 即可，用户下次登录会重新走授权

  await prisma.account.delete({ where: { id: account.id } })

  // 告诉前端这个 provider 是否需要用户手动去取消授权
  const needsManualRevoke = provider === "github"

  return NextResponse.json({ ok: true, needsManualRevoke })
}