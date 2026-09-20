// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/favorites            全量拉取；?since=<ISO 8601> 时只返回该时刻之后新增的
// POST /api/favorites            单条收藏变更
//
// ⚠️ 改造原因（架构 §4.3 / P0-08 硬前提）：
//    POST 原先是**纯 toggle** —— 查到就 delete、没查到就 create。这个语义**非幂等**，
//    离线队列无法安全重放：网络恢复后重放一次操作，会把用户刚点的收藏反向取消。
//    现在 `action` 显式化：
//      add    = upsert（已存在则 no-op）      → 幂等
//      remove = delete（不存在则 no-op）      → 幂等
//      toggle = 与改造前完全一致（仅 Web 现有调用，FavoritesProvider 未传 action）
//
// 鉴权：Bearer 优先、cookie 回退（auth-guard）。
// CSRF：cookie 通道沿用 isSameOrigin（Web 行为 100% 不变）；bearer 通道豁免
//      （token 存于各端安全存储，不在 cookie 中，浏览器不会自动附带）。
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from 'shared/utils/prisma'
import { resolveAuthResult } from '@/auth-guard'
import { withCors } from '@/api-cors'
import { errorResponse, tooManyRequestsResponse } from '@/api-response'
import { checkRateLimit } from 'shared/utils/rate-limit'
import { getTrustedClientIp } from 'shared/utils/ip'
import { isTrustedRequest } from 'shared/utils/csrf'
import { FAVORITE_TYPES, favoritePostSchema, parseOrFail } from 'shared/validators/api'
import type { FavoriteAction, FavoriteItemRecord } from 'shared/types/api'

/** 收藏类型白名单（与改造前一致：tool / product / article / snippet） */
const VALID_FAV_TYPES = new Set<string>(FAVORITE_TYPES)

/** Prisma row → 契约类型（createdAt 统一成 ISO 8601 字符串，与改造前序列化结果一致） */
function toRecord(row: { id: string; toolId: string; type: string; createdAt: Date }): FavoriteItemRecord {
  return {
    id: row.id,
    toolId: row.toolId,
    type: row.type,
    createdAt: row.createdAt.toISOString(),
  }
}

export const GET = withCors(async (req: NextRequest) => {
  const authResult = await resolveAuthResult(req)
  if (!authResult.ok) return errorResponse(authResult.code)
  const resolved = { session: authResult.session, mode: authResult.mode }

  // 增量拉取：?since=<ISO 8601 UTC>。非法时间戳按 invalidParams 处理，
  // 绝不把 Invalid Date 交给 Prisma（那会变成 500）。
  const since = req.nextUrl.searchParams.get('since')
  let createdAtFilter: { gt: Date } | undefined
  if (since !== null && since !== '') {
    const sinceMs = Date.parse(since)
    if (Number.isNaN(sinceMs)) {
      return errorResponse('invalidParams')
    }
    createdAtFilter = { gt: new Date(sinceMs) }
  }

  const rows = await prisma.favorite.findMany({
    where: {
      userId: resolved.session.user.id,
      ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    favorites: rows.map(toRecord),
    serverTime: new Date().toISOString(),
  })
})

export const POST = withCors(async (req: NextRequest) => {
  const authResult = await resolveAuthResult(req)
  if (!authResult.ok) return errorResponse(authResult.code)
  const resolved = { session: authResult.session, mode: authResult.mode }

  // CSRF：按通道判定（bearer 豁免，cookie 沿用同源校验）
  if (!isTrustedRequest(req, resolved.mode)) {
    return errorResponse('forbidden')
  }

  // 限流：每 IP 每分钟 30 次收藏操作（与改造前一致）
  const ip = getTrustedClientIp(req)
  const rl = await checkRateLimit(`fav:${ip}`, 30, 60_000)
  if (!rl.allowed) {
    return tooManyRequestsResponse(rl.resetAt)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return errorResponse('invalidJson')
  }
  const record = (body ?? {}) as Record<string, unknown>

  // toolId / type 先按历史口径判定 —— 保留既有错误码（Web 端 t(data.error) 直接消费），
  // 再交给 zod 校验整体（含 action）。
  const toolId = typeof record.toolId === 'string' ? record.toolId.trim() : ''
  if (toolId.length === 0 || toolId.length > 100) {
    return errorResponse('missingToolId')
  }
  const itemType = typeof record.type === 'string' ? record.type : 'tool'
  if (!VALID_FAV_TYPES.has(itemType)) {
    return errorResponse('invalidType')
  }

  const parsed = parseOrFail(favoritePostSchema, {
    toolId,
    type: itemType,
    action: record.action ?? 'toggle',
  })
  if (!parsed.ok) {
    return errorResponse('invalidParams')
  }
  const action: FavoriteAction = parsed.data.action

  const userId = resolved.session.user.id
  const uniqueWhere = { userId_toolId_type: { userId, toolId, type: itemType } }
  const existing = await prisma.favorite.findUnique({ where: uniqueWhere })

  // add：幂等 upsert（已存在 = 成功，不重复创建）
  if (action === 'add') {
    if (!existing) {
      await prisma.favorite.create({ data: { userId, toolId, type: itemType } })
    }
    return NextResponse.json({ isFavorited: true })
  }

  // remove：幂等删除（不存在 = 成功）
  if (action === 'remove') {
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } })
    }
    return NextResponse.json({ isFavorited: false })
  }

  // toggle：与改造前逐行一致（Web 现有调用路径）
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    return NextResponse.json({ isFavorited: false })
  }
  await prisma.favorite.create({ data: { userId, toolId, type: itemType } })
  return NextResponse.json({ isFavorited: true })
})

export const OPTIONS = withCors(async () => new NextResponse(null, { status: 204 }))
