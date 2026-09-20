// ─────────────────────────────────────────────────────────────────────────────
// 收藏 API —— 五端共用（服务器为唯一真源，本地只有缓存 + 离线队列）
// ─────────────────────────────────────────────────────────────────────────────

import type {
  FavoriteAction,
  FavoriteItemRecord,
  FavoriteMutation,
  FavoriteSnapshot,
  FavoriteSyncResult,
} from '../types/api'
import type { ApiClient } from './http-client'
import { compactQueue } from '../utils/favorite-sync'

export interface FavoritesApi {
  /** 全量或增量（?since=<ISO>）拉取 */
  list(since?: string): Promise<FavoriteSnapshot>
  /** 单条变更。action 默认为 toggle（仅 Web 旧调用使用） */
  mutate(toolId: string, action: FavoriteAction, type?: string): Promise<{ isFavorited: boolean }>
  /** 批量幂等提交离线队列 */
  sync(ops: readonly FavoriteMutation[], lastSyncedAt?: string): Promise<FavoriteSyncResult>
}

export function createFavoritesApi(client: ApiClient): FavoritesApi {
  return {
    async list(since?: string): Promise<FavoriteSnapshot> {
      const path = since ? `/api/favorites?since=${encodeURIComponent(since)}` : '/api/favorites'
      return client.get<FavoriteSnapshot>(path)
    },
    async mutate(toolId, action, type = 'tool'): Promise<{ isFavorited: boolean }> {
      return client.post<{ isFavorited: boolean }>('/api/favorites', { toolId, type, action })
    },
    async sync(ops, lastSyncedAt): Promise<FavoriteSyncResult> {
      return client.post<FavoriteSyncResult>('/api/favorites/sync', {
        ops: compactQueue(ops),
        ...(lastSyncedAt ? { lastSyncedAt } : {}),
      })
    },
  }
}

/** 快照 → Set，便于端侧 O(1) 判定 */
export function favoriteSet(snapshot: FavoriteSnapshot): Set<string> {
  return new Set(snapshot.favorites.map((item: FavoriteItemRecord) => `${item.type}:${item.toolId}`))
}
