import { NextRequest, NextResponse } from "next/server"
import { prisma } from "shared/utils/prisma"
import { auth } from "@/auth"
import { checkRateLimit } from "shared/utils/rate-limit"
import { getTrustedClientIp } from "shared/utils/ip"
import { isSameOrigin } from "shared/utils/csrf"

// 合法的收藏类型白名单
const VALID_FAV_TYPES = new Set(["tool", "article", "snippet"])

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "loginRequired" }, { status: 401 })
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ favorites })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "loginRequired" }, { status: 401 })
  }

  // CSRF 防护：校验同源
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  // 限流：每 IP 每分钟 30 次收藏操作
  const ip = getTrustedClientIp(req)
  const rl = checkRateLimit(`fav:${ip}`, 30, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "tooManyRequests" }, { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalidJson" }, { status: 400 })
  }

  const { toolId, type } = body as Record<string, unknown>

  // 输入校验
  if (!toolId || typeof toolId !== "string" || toolId.trim().length === 0 || toolId.length > 100) {
    return NextResponse.json({ error: "missingToolId" }, { status: 400 })
  }

  const userId = session.user.id
  const rawType = typeof type === "string" ? type : "tool"
  if (!VALID_FAV_TYPES.has(rawType)) {
    return NextResponse.json({ error: "invalidType" }, { status: 400 })
  }
  const itemType = rawType

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
