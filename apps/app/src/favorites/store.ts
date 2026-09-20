// ─────────────────────────────────────────────────────────────────────────────
// 收藏的本地持久化 + 同步编排（无 React，可单测）
//
// 真源在服务端（SK-12）：本地只有「快照缓存 + 未同步队列」，两者都用 AsyncStorage
// （收藏不是机密，不需要 SecureStore）。
//
// 所有合并语义都来自 shared/utils/favorite-sync.ts 的纯函数：
//   mergeFavorites   —— 服务端快照叠加本地未同步 op（乐观 UI）
//   compactQueue     —— 同一 key 只保留最后一条 op（由 /api/favorites/sync 内部再压一次）
//   filterStaleMutations —— 丢掉 lastSyncedAt 之前的陈旧 op，防旧 add「复活」
// 这里只负责"读出来 / 存回去 / 调接口"，不重新实现任何合并规则。
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Crypto from 'expo-crypto'
import type { FavoritesApi } from 'shared/api/favorites'
import type { FavoriteItemRecord, FavoriteMutation, FavoriteSnapshot } from 'shared/types/api'
import { filterStaleMutations, mergeFavorites, sortMutations } from 'shared/utils/favorite-sync'

export const FAVORITES_CACHE_KEY = 'aaigc.favorites.cache.v1'
export const FAVORITES_QUEUE_KEY = 'aaigc.favorites.queue.v1'

/** 收藏类型（与 shared/validators/api.ts 的 FAVORITE_TYPES 对齐；本端只用到 tool） */
const FAVORITE_TYPE_TOOL = 'tool'

export interface FavoritesState {
  /** 合并后的展示集合（服务端快照 + 未同步队列） */
  favorites: FavoriteItemRecord[]
  /** 未同步的离线队列 */
  pending: FavoriteMutation[]
  /** ISO 8601 UTC；null = 从未同步过（首次拉全量） */
  lastSyncedAt: string | null
}

export const EMPTY_FAVORITES_STATE: FavoritesState = {
  favorites: [],
  pending: [],
  lastSyncedAt: null,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function parseFavoriteRecord(raw: unknown): FavoriteItemRecord | null {
  if (!isRecord(raw)) return null
  const { id, toolId, type, createdAt } = raw
  if (typeof id !== 'string' || id.length === 0) return null
  if (typeof toolId !== 'string' || toolId.length === 0) return null
  if (typeof type !== 'string' || type.length === 0) return null
  if (!isIsoDate(createdAt)) return null
  return { id, toolId, type, createdAt }
}

function parseMutation(raw: unknown): FavoriteMutation | null {
  if (!isRecord(raw)) return null
  const { opId, action, toolId, type, clientTs } = raw
  if (typeof opId !== 'string' || opId.length === 0) return null
  if (action !== 'add' && action !== 'remove') return null
  if (typeof toolId !== 'string' || toolId.length === 0) return null
  if (type !== 'tool' && type !== 'product') return null
  if (!isIsoDate(clientTs)) return null
  return { opId, action, toolId, type, clientTs }
}

async function readJson(key: string): Promise<unknown> {
  try {
    const raw = await AsyncStorage.getItem(key)
    return raw === null ? null : (JSON.parse(raw) as unknown)
  } catch {
    // 读不出 / 解析失败 = 没有缓存，不是错误；下一次同步会重建
    return null
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 落盘失败不影响本次会话的正确性（服务端才是真源），静默跳过
  }
}

/** 读本地缓存 + 队列，合并出可展示的乐观状态 */
export async function loadFavoritesState(): Promise<FavoritesState> {
  const cacheRaw = await readJson(FAVORITES_CACHE_KEY)
  const queueRaw = await readJson(FAVORITES_QUEUE_KEY)

  let favorites: FavoriteItemRecord[] = []
  let lastSyncedAt: string | null = null
  if (isRecord(cacheRaw)) {
    const items = Array.isArray(cacheRaw.favorites) ? cacheRaw.favorites : []
    favorites = items.map(parseFavoriteRecord).filter((item): item is FavoriteItemRecord => item !== null)
    lastSyncedAt = isIsoDate(cacheRaw.lastSyncedAt) ? cacheRaw.lastSyncedAt : null
  }

  const pending = (Array.isArray(queueRaw) ? queueRaw : [])
    .map(parseMutation)
    .filter((op): op is FavoriteMutation => op !== null)

  const snapshot: FavoriteSnapshot = { favorites, serverTime: lastSyncedAt ?? '' }
  return {
    favorites: mergeFavorites(snapshot, pending, lastSyncedAt ?? undefined).favorites,
    pending,
    lastSyncedAt,
  }
}

/** 落盘：快照缓存 + 未同步队列（两者必须一起写，避免出现"缓存已更新但队列丢了"） */
export async function saveFavoritesState(state: FavoritesState): Promise<void> {
  await writeJson(FAVORITES_CACHE_KEY, {
    favorites: state.favorites,
    lastSyncedAt: state.lastSyncedAt,
  })
  await writeJson(FAVORITES_QUEUE_KEY, state.pending)
}

const persist = saveFavoritesState

/** 把一条 toggle 落进离线队列（幂等：同一 key 只保留最后一条） */
export function appendToggle(
  pending: readonly FavoriteMutation[],
  toolId: string,
  isCurrentlyFavorited: boolean,
): FavoriteMutation[] {
  const op: FavoriteMutation = {
    opId: Crypto.randomUUID(),
    action: isCurrentlyFavorited ? 'remove' : 'add',
    toolId,
    type: 'tool',
    clientTs: new Date().toISOString(),
  }
  // 用 shared 的排序语义做"同一 key 只留最后一条"（compactQueue 的同款规则）
  const byKey = new Map<string, FavoriteMutation>()
  for (const item of sortMutations([...pending, op])) {
    byKey.set(`${item.type}:${item.toolId}`, item)
  }
  return sortMutations([...byKey.values()])
}

/** 本地乐观切换（真源仍在服务端；这里只改展示集合） */
export function applyLocalToggle(
  favorites: readonly FavoriteItemRecord[],
  toolId: string,
  isCurrentlyFavorited: boolean,
): FavoriteItemRecord[] {
  const key = `${FAVORITE_TYPE_TOOL}:${toolId}`
  if (isCurrentlyFavorited) {
    return favorites.filter((item) => `${item.type}:${item.toolId}` !== key)
  }
  if (favorites.some((item) => `${item.type}:${item.toolId}` === key)) return [...favorites]
  return [
    { id: key, toolId, type: FAVORITE_TYPE_TOOL, createdAt: new Date().toISOString() },
    ...favorites,
  ]
}

/** 拉取（有 lastSyncedAt 则走 ?since= 增量）并与本地队列合并 */
export async function pullFavorites(
  api: FavoritesApi,
  state: FavoritesState,
): Promise<FavoritesState> {
  const snapshot = await api.list(state.lastSyncedAt ?? undefined)
  const merged = mergeFavorites(snapshot, state.pending, state.lastSyncedAt ?? undefined)
  const next: FavoritesState = {
    favorites: merged.favorites,
    pending: state.pending,
    lastSyncedAt: snapshot.serverTime,
  }
  await persist(next)
  return next
}

/**
 * 提交离线队列。服务端返回 appliedOpIds / skippedOpIds，
 * 两者都从队列里剔除（skipped = 服务端判定为陈旧，重放它反而会「复活」）。
 */
export async function pushFavorites(
  api: FavoritesApi,
  state: FavoritesState,
): Promise<FavoritesState> {
  if (state.pending.length === 0) {
    const snapshot = await api.list(state.lastSyncedAt ?? undefined)
    const next: FavoritesState = {
      favorites: mergeFavorites(snapshot, [], state.lastSyncedAt ?? undefined).favorites,
      pending: [],
      lastSyncedAt: snapshot.serverTime,
    }
    await persist(next)
    return next
  }

  const result = await api.sync(state.pending, state.lastSyncedAt ?? undefined)
  const settled = new Set([...result.appliedOpIds, ...result.skippedOpIds])
  const remaining = state.pending.filter((op) => !settled.has(op.opId))

  const next: FavoritesState = {
    favorites: mergeFavorites(result, remaining, result.serverTime).favorites,
    pending: remaining,
    lastSyncedAt: result.serverTime,
  }
  await persist(next)
  return next
}

/** 登出时清掉本端缓存（服务端数据不动） */
export async function clearFavoritesCache(): Promise<void> {
  await AsyncStorage.multiRemove([FAVORITES_CACHE_KEY, FAVORITES_QUEUE_KEY]).catch(() => undefined)
}

/** 供 UI 判断"这条 op 还没同步上去"（可选展示离线标记） */
export function pendingCount(state: FavoritesState): number {
  return filterStaleMutations(state.pending, state.lastSyncedAt ?? undefined).fresh.length
}
