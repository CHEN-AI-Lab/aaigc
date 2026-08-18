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
    return NextResponse.json({ error: "userNotFound" }, { status: 404 })
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      name: user.name,
      role: user.role,
      image: user.image,
      createdAt: user.createdAt,
      hasPassword: !!pw?.passwordHash,
      accounts: accounts.map((a) => ({ provider: a.provider })),
    },
  })
}