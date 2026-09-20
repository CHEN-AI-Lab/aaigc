// ─────────────────────────────────────────────────────────────────────────────
// 收藏跨端同步的纯逻辑（架构 §4.3）
//
// 收藏是「无可变字段的集合」，因此不需要 CRDT：
//   R-1 幂等天然成立：add 已存在 = 成功，remove 不存在 = 成功
//   R-2 单设备 LWW：队列内按 clientTs 升序重放
//   R-3 跨设备 LWW：服务器「后写覆盖」
//   R-4 无墓碑：客户端只重放 clientTs > lastSyncedAt 的 op，防止旧 add「复活」
// ─────────────────────────────────────────────────────────────────────────────

import type { FavoriteItemRecord, FavoriteMutation, FavoriteSnapshot } from '../types/api'

export function favoriteKey(toolId: string, type: string): string {
  return `${type}:${toolId}`
}

function toMs(value: string): number {
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? 0 : ms
}

/** 按 clientTs 升序重放队列（R-2 单设备 LWW） */
export function sortMutations(ops: readonly FavoriteMutation[]): FavoriteMutation[] {
  return [...ops].sort((a, b) => {
    const diff = toMs(a.clientTs) - toMs(b.clientTs)
    if (diff !== 0) return diff
    return a.opId < b.opId ? -1 : a.opId > b.opId ? 1 : 0
  })
}

/** 过滤掉 lastSyncedAt 之前的陈旧 op（R-4 防「复活」） */
export function filterStaleMutations(
  ops: readonly FavoriteMutation[],
  lastSyncedAt?: string,
): { fresh: FavoriteMutation[]; skippedOpIds: string[] } {
  if (!lastSyncedAt) return { fresh: [...ops], skippedOpIds: [] }
  const threshold = toMs(lastSyncedAt)
  const fresh: FavoriteMutation[] = []
  const skippedOpIds: string[] = []
  for (const op of ops) {
    if (toMs(op.clientTs) > threshold) fresh.push(op)
    else skippedOpIds.push(op.opId)
  }
  return { fresh, skippedOpIds }
}

export interface ApplyResult {
  favorites: FavoriteItemRecord[]
  appliedOpIds: string[]
  skippedOpIds: string[]
  serverTime: string
}

/**
 * 把离线队列幂等地应用到服务端快照上（set 语义：add = upsert，remove = delete）。
 * 纯函数 —— 不触碰数据库，便于单测与端侧预演。
 */
export function applyMutations(
  server: readonly FavoriteItemRecord[],
  ops: readonly FavoriteMutation[],
  options: { lastSyncedAt?: string; serverTime: string; makeId?: (toolId: string, type: string) => string } = { serverTime: '' },
): ApplyResult {
  const makeId = options.makeId ?? ((toolId: string, type: string) => favoriteKey(toolId, type))
  const byKey = new Map<string, FavoriteItemRecord>()
  for (const item of server) byKey.set(favoriteKey(item.toolId, item.type), item)

  const { fresh, skippedOpIds } = filterStaleMutations(ops, options.lastSyncedAt)
  const ordered = sortMutations(fresh)
  const appliedOpIds: string[] = []

  for (const op of ordered) {
    const key = favoriteKey(op.toolId, op.type)
    if (op.action === 'add') {
      if (!byKey.has(key)) {
        byKey.set(key, {
          id: makeId(op.toolId, op.type),
          toolId: op.toolId,
          type: op.type,
          createdAt: options.serverTime,
        })
      }
    } else {
      byKey.delete(key)
    }
    appliedOpIds.push(op.opId)
  }

  const favorites = [...byKey.values()].sort((a, b) => {
    const diff = toMs(b.createdAt) - toMs(a.createdAt)
    if (diff !== 0) return diff
    return favoriteKey(a.toolId, a.type) < favoriteKey(b.toolId, b.type) ? -1 : 1
  })

  return { favorites, appliedOpIds, skippedOpIds, serverTime: options.serverTime }
}

/** 判断某个 (toolId, type) 是否在快照中 */
export function hasFavorite(snapshot: Pick<FavoriteSnapshot, 'favorites'>, toolId: string, type: string): boolean {
  return snapshot.favorites.some((item) => item.toolId === toolId && item.type === type)
}

/**
 * 客户端合并：以服务端快照为真源，叠加本地尚未同步的 op（乐观 UI 用）。
 * 注意：本地队列只是缓存，不是真源（SK-12）。
 */
export function mergeFavorites(
  snapshot: FavoriteSnapshot,
  queue: readonly FavoriteMutation[],
  lastSyncedAt?: string,
): FavoriteSnapshot {
  const pending = filterStaleMutations(queue, lastSyncedAt).fresh
  if (pending.length === 0) return snapshot
  const result = applyMutations(snapshot.favorites, pending, {
    lastSyncedAt,
    serverTime: snapshot.serverTime,
  })
  return { favorites: result.favorites, serverTime: snapshot.serverTime }
}

/** 把本地队列压缩为最小集合（同一 key 只保留最后一条 op） */
export function compactQueue(ops: readonly FavoriteMutation[]): FavoriteMutation[] {
  const ordered = sortMutations(ops)
  const lastByKey = new Map<string, FavoriteMutation>()
  for (const op of ordered) lastByKey.set(favoriteKey(op.toolId, op.type), op)
  return sortMutations([...lastByKey.values()])
}
