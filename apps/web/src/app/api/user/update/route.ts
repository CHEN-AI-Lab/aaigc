import { NextRequest, NextResponse } from "next/server"
import { prisma } from "shared/utils/prisma"
import { auth } from "@/auth"
import { checkRateLimit } from "shared/utils/rate-limit"
import { isSameOrigin } from "shared/utils/csrf"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "loginRequired" }, { status: 401 })
  }

  // CSRF 防护：校验同源
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  // 限流：每用户每分钟 5 次名称修改
  const rl = await checkRateLimit(`update-name:${session.user.id}`, 5, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "tooManyRequests" }, { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalidJson" }, { status: 400 })
  }

  const { name } = body as Record<string, unknown>
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "invalidName" }, { status: 400 })
  }

  const trimmed = name.trim()
  if (trimmed.length > 50) {
    return NextResponse.json({ error: "nameTooLong" }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: trimmed },
  })

  return NextResponse.json({ ok: true })
}

// 更新头像模式（avatarMode）和自选字母（avatarChar）
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "loginRequired" }, { status: 401 })
  }

  // CSRF 防护：校验同源
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalidJson" }, { status: 400 })
  }

  const { avatarMode, avatarChar } = body as Record<string, unknown>

  const updates: Record<string, string | null> = {}

  // avatarMode: "auto" | "letter"
  if (avatarMode !== undefined) {
    if (avatarMode !== "auto" && avatarMode !== "letter") {
      return NextResponse.json({ error: "invalidAvatarMode" }, { status: 400 })
    }
    updates.avatarMode = avatarMode as string
  }

  // avatarChar: 1-2 字符的字母或 null
  if (avatarChar !== undefined) {
    if (avatarChar === null) {
      updates.avatarChar = null
    } else if (typeof avatarChar === "string" && avatarChar.length >= 1 && avatarChar.length <= 2) {
      updates.avatarChar = avatarChar
    } else {
      return NextResponse.json({ error: "invalidAvatarChar" }, { status: 400 })
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "noFieldsToUpdate" }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: updates,
  })

  return NextResponse.json({ ok: true })
}
