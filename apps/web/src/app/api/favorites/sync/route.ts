// ─────────────────────────────────────────────────────────────────────────────
// POST /api/favorites/sync —— 离线队列批量幂等提交（架构 §4.3）
//
// 同步模型：收藏是「无可变字段的集合」，所以不需要 CRDT：
//   R-1 幂等：add 已存在 = 成功，remove 不存在 = 成功 → 队列可任意重放
//   R-2 单设备 LWW：队列内按 clientTs 升序重放
//   R-3 跨设备 LWW：服务器「后写覆盖」（本路由按到达顺序落库）
//   R-4 无墓碑：clientTs <= lastSyncedAt 的 op 直接跳过，防止旧 add「复活」
//
// 返回**最新全量快照** + appliedOpIds / skippedOpIds，客户端据此清空本地队列。
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from 'shared/utils/prisma'
import { resolveAuthResult } from '@/auth-guard'
import { withCors } from '@/api-cors'
import { errorResponse, tooManyRequestsResponse } from '@/api-response'
import { checkRateLimit } from 'shared/utils/rate-limit'
import { isTrustedRequest } from 'shared/utils/csrf'
import { favoriteSyncSchema, parseOrFail } from 'shared/validators/api'
import { filterStaleMutations, sortMutations } from 'shared/utils/favorite-sync'
import type { FavoriteItemRecord, FavoriteSyncResult } from 'shared/types/api'

/** 单次同步上限：与 favoriteSyncSchema 的 max(500) 一致，此处再兜一次底 */
const MAX_OPS = 500

export const POST = withCors(async (req: NextRequest) => {
  const authResult = await resolveAuthResult(req)
  if (!authResult.ok) return errorResponse(authResult.code)
  const resolved = { session: authResult.session, mode: authResult.mode }

  if (!isTrustedRequest(req, resolved.mode)) {
    return errorResponse('forbidden')
  }

  const userId = resolved.session.user.id

  // 限流：每用户每分钟 20 次同步（批量接口，比单条更贵）
  const rl = await checkRateLimit(`fav-sync:${userId}`, 20, 60_000)
  if (!rl.allowed) return tooManyRequestsResponse(rl.resetAt)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return errorResponse('invalidJson')
  }

  const parsed = parseOrFail(favoriteSyncSchema, body)
  if (!parsed.ok) return errorResponse('syncPayloadInvalid')

  const { ops, lastSyncedAt } = parsed.data
  if (ops.length > MAX_OPS) return errorResponse('syncPayloadInvalid')

  // R-4：丢弃早于上次同步时刻的陈旧 op
  const { fresh, skippedOpIds } = filterStaleMutations(ops, lastSyncedAt)
  // R-2：按 clientTs 升序重放
  const ordered = sortMutations(fresh)

  const appliedOpIds: string[] = []
  const failedOpIds: string[] = []

  for (const op of ordered) {
    const where = { userId, toolId: op.toolId, type: op.type }
    try {
      if (op.action === 'add') {
        await prisma.favorite.upsert({
          where: { userId_toolId_type: where },
          create: where,
          update: {},
        })
      } else {
        await prisma.favorite.deleteMany({ where })
      }
      appliedOpIds.push(op.opId)
    } catch {
      // 单条失败不阻断整批：op 保持幂等，客户端下次可安全重放
      failedOpIds.push(op.opId)
    }
  }

  // 以数据库为唯一真源回读全量快照，避免返回「乐观但未落库」的脏数据
  const rows = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  const favorites: FavoriteItemRecord[] = rows.map((row) => ({
    id: row.id,
    toolId: row.toolId,
    type: row.type,
    createdAt: row.createdAt.toISOString(),
  }))

  const result: FavoriteSyncResult = {
    favorites,
    serverTime: new Date().toISOString(),
    appliedOpIds,
    skippedOpIds: [...skippedOpIds, ...failedOpIds],
  }

  return NextResponse.json(result)
})

export const OPTIONS = withCors(async () => new NextResponse(null, { status: 204 }))
