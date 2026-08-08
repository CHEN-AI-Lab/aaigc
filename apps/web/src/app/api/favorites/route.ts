import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ favorites })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  const { toolId, type } = await req.json()
  if (!toolId) {
    return NextResponse.json({ error: "缺少工具 ID" }, { status: 400 })
  }

  const userId = session.user.id
  const itemType = type || "tool"

  // Toggle favorite
  const existing = await prisma.favorite.findUnique({
    where: { userId_toolId_type: { userId, toolId, type: itemType } },
  })

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    return NextResponse.json({ isFavorited: false })
  }

  await prisma.favorite.create({ data: { userId, toolId, type: itemType } })
  return NextResponse.json({ isFavorited: true })
}