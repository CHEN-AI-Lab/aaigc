import { NextResponse } from "next/server"
import { prisma } from "shared/utils/prisma"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "loginRequired" }, { status: 401 })
  }

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
        avatarMode: true,
        avatarChar: true,
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
    return NextResponse.json({ error: "userNotFound" }, { status: 404 })
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
      avatarMode: user.avatarMode,
      avatarChar: user.avatarChar,
      createdAt: user.createdAt,
      hasPassword: !!pw?.passwordHash,
      accounts: accounts.map((a) => ({ provider: a.provider })),
      // 哪些 OAuth provider 已配置了环境变量，可用于"关联账号"
      googleConfigured: !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
      githubConfigured: !!(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET),
    },
  })
}