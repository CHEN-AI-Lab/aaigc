// GET /api/user/profile —— 账号设置页的个人资料
// 改造：auth() → resolveAuthResult(req)（Bearer / cookie 双通道，失败码区分
// loginRequired / tokenExpired / tokenInvalid），并注入 CORS 头。
// 响应体形状与改造前逐字段一致。

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "shared/utils/prisma"
import { resolveAuthResult } from "@/auth-guard"
import { withCors } from "@/api-cors"
import { errorResponse } from "@/api-response"

export const GET = withCors(async (req: NextRequest) => {
  const authResult = await resolveAuthResult(req)
  if (!authResult.ok) return errorResponse(authResult.code)
  const session = authResult.session

  const userId = session.user.id

  const [user, accounts, pw] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        emailVerified: true,
        name: true,
        role: true,
        image: true,
        createdAt: true,
      },
    }),
    prisma.account.findMany({
      where: { userId },
      select: { provider: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    }),
  ])

  if (!user) {
    return errorResponse("userNotFound")
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      emailVerified: user.emailVerified,
      name: user.name,
      role: user.role,
      image: user.image,
      createdAt: user.createdAt,
      hasPassword: !!pw?.passwordHash,
      accounts: accounts.map((a) => ({ provider: a.provider })),
      // 哪些 OAuth provider 已配置了环境变量，可用于"关联账号"
      googleConfigured: !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
      githubConfigured: !!(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET),
    },
  })
})

export const OPTIONS = withCors(async () => new NextResponse(null, { status: 204 }))
