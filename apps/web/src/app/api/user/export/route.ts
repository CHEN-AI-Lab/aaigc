import { NextResponse } from "next/server"
import { prisma } from "shared/utils/prisma"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "loginRequired" }, { status: 401 })
  }

  const userId = session.user.id

  const [user, accounts, favorites] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, image: true, avatarMode: true, avatarChar: true, createdAt: true },
    }),
    prisma.account.findMany({
      where: { userId },
      select: { provider: true, type: true },
    }),
    prisma.favorite.findMany({
      where: { userId },
      select: { toolId: true, type: true, createdAt: true },
    }),
  ])

  if (!user) {
    return NextResponse.json({ error: "userNotFound" }, { status: 404 })
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
      avatarMode: user.avatarMode,
      avatarChar: user.avatarChar,
      createdAt: user.createdAt,
    },
    accounts: accounts.map((a) => ({ provider: a.provider, type: a.type })),
    favorites: favorites.map((f) => ({
      type: f.type,
      id: f.toolId,
      savedAt: f.createdAt,
    })),
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="aaigc-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  })
}