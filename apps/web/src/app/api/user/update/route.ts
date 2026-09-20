// POST /api/user/update —— 修改昵称
// 改造：auth() → resolveAuthResult(req)（拿到 mode 供 CSRF 判定，并把 tokenExpired /
// tokenInvalid 下发客户端），isSameOrigin → isTrustedRequest。

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "shared/utils/prisma"
import { resolveAuthResult } from "@/auth-guard"
import { withCors } from "@/api-cors"
import { errorResponse, tooManyRequestsResponse } from "@/api-response"
import { checkRateLimit } from "shared/utils/rate-limit"
import { isTrustedRequest } from "shared/utils/csrf"

export const POST = withCors(async (req: NextRequest) => {
  const authResult = await resolveAuthResult(req)
  if (!authResult.ok) return errorResponse(authResult.code)
  const resolved = { session: authResult.session, mode: authResult.mode }

  // CSRF：cookie 通道沿用同源校验（Web 行为不变）；bearer 通道豁免
  if (!isTrustedRequest(req, resolved.mode)) {
    return errorResponse("forbidden")
  }

  // 限流：每用户每分钟 5 次名称修改（与改造前一致）
  const rl = await checkRateLimit(`update-name:${resolved.session.user.id}`, 5, 60_000)
  if (!rl.allowed) {
    return tooManyRequestsResponse(rl.resetAt)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return errorResponse("invalidJson")
  }

  const { name } = (body ?? {}) as Record<string, unknown>
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return errorResponse("invalidName")
  }

  const trimmed = name.trim()
  if (trimmed.length > 50) {
    return errorResponse("nameTooLong")
  }

  await prisma.user.update({
    where: { id: resolved.session.user.id },
    data: { name: trimmed },
  })

  return NextResponse.json({ ok: true })
})

export const OPTIONS = withCors(async () => new NextResponse(null, { status: 204 }))
