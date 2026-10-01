// favorites store —— 鸿蒙端收藏的本地持久化
//
// 设计要点：
//   1. 用 @ohos.data.preferences（轻量 KV 存储）
//   2. 存数据结构与 web/iOS/App 对齐：FavoriteItemRecord[]
//      - id: `${type}:${toolId}`（与 favorite-sync.ts 的 favoriteKey 对齐）
//      - toolId: string
//      - type: 'tool'（当前端只收藏工具）
//      - createdAt: ISO 8601 string
//   3. 与 shared/utils/favorite-sync.ts 的 favoriteKey 对齐 —— 跨端键空间一致
//   4. 真源在服务端（SK-12），本端只缓存快照 —— 真实场景应该从 /api/favorites 拉
//
// ⚠️ 当前骨架只演示本地缓存 + toggle：
//   - getFavorites(): 读本地缓存
//   - isFavorite(toolId): 检查是否在缓存中
//   - toggleFavorite(toolId): add/remove 切本地缓存
//   真实场景需补：
//   - 启动时拉服务端快照（覆盖缓存）
//   - toggle 后异步 POST 到 /api/favorites（fire-and-forget）
//   - 用 shared/utils/favorite-sync.ts 的 mergeFavorites 做合并

import preferences from '@ohos.data.preferences'
import type { common } from '@kit.AbilityKit'
import type { FavoriteItemRecord } from 'shared/types/api'
import { favoriteKey } from 'shared/utils/favorite-sync'

const STORE_NAME = 'aaigc_favorites'
const KEY_RECORDS = 'favorite_records'

let prefsInstance: preferences.Preferences | null = null

async function getPrefs(): Promise<preferences.Preferences> {
  if (prefsInstance) return prefsInstance
  const ctx = AppStorage.get<common.UIAbilityContext>('aaigc_context')
  if (!ctx) {
    throw new Error('favorites store: aaigc_context not set. Call setContext() in UIAbility.onCreate().')
  }
  prefsInstance = await preferences.getPreferences(ctx, STORE_NAME)
  return prefsInstance
}

/** 在 UIAbility 启动时调用，把 context 写入 AppStorage */
export function setContext(ctx: common.UIAbilityContext): void {
  AppStorage.setOrCreate<common.UIAbilityContext>('aaigc_context', ctx)
}

/** 读全部收藏 */
export async function getFavorites(): Promise<FavoriteItemRecord[]> {
  try {
    const prefs = await getPrefs()
    const raw = await prefs.get(KEY_RECORDS, '[]') as string
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((r: unknown): r is FavoriteItemRecord =>
      typeof r === 'object' && r !== null && typeof (r as FavoriteItemRecord).id === 'string',
    )
  } catch (err) {
    console.warn('[AAIGC favorites] getFavorites failed:', JSON.stringify(err))
    return []
  }
}

/** 检查某 toolId 是否已收藏 */
export async function isFavorite(toolId: string, type: 'tool' | 'product' = 'tool'): Promise<boolean> {
  const records = await getFavorites()
  const key = favoriteKey(toolId, type)
  return records.some(r => r.id === key)
}

/**
 * 切换收藏状态
 * @returns { isFavorited, totalCount } —— 切换后的状态
 */
export async function toggleFavorite(
  toolId: string,
  type: 'tool' | 'product' = 'tool',
): Promise<{ isFavorited: boolean; totalCount: number }> {
  const records = await getFavorites()
  const key = favoriteKey(toolId, type)
  const idx = records.findIndex(r => r.id === key)

  let next: FavoriteItemRecord[]
  let isFavorited: boolean

  if (idx >= 0) {
    next = records.filter((_, i) => i !== idx)
    isFavorited = false
  } else {
    const now = new Date().toISOString()
    next = [...records, { id: key, toolId, type, createdAt: now }]
    isFavorited = true
  }

  try {
    const prefs = await getPrefs()
    await prefs.put(KEY_RECORDS, JSON.stringify(next))
    await prefs.flush()
  } catch (err) {
    console.error('[AAIGC favorites] toggleFavorite failed:', JSON.stringify(err))
  }

  return { isFavorited, totalCount: next.length }
}

/** 清空所有收藏（设置面板用） */
export async function clearFavorites(): Promise<void> {
  try {
    const prefs = await getPrefs()
    await prefs.put(KEY_RECORDS, '[]')
    await prefs.flush()
  } catch (err) {
    console.error('[AAIGC favorites] clearFavorites failed:', JSON.stringify(err))
  }
}