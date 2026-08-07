import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  const { toolId } = await req.json()
  if (!toolId) {
    return NextResponse.json({ error: "缺少工具 ID" }, { status: 400 })
  }

  const userId = session.user.id

  // Toggle like
  const existing = await prisma.like.findUnique({
    where: { userId_toolId: { userId, toolId } },
  })

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } })
  } else {
    await prisma.like.create({ data: { userId, toolId } })
  }

  // Get updated count
  const count = await prisma.like.count({ where: { toolId } })

  return NextResponse.json({
    liked: !existing,
    count,
  })
}