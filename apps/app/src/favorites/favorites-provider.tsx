// ─────────────────────────────────────────────────────────────────────────────
// 收藏 Provider —— 乐观 UI + 离线队列 + 跨设备同步
//
// 数据流：
//   切换收藏 → 立刻改本地展示（乐观）+ 把 op 压进离线队列
//            → 已登录则马上提交（/api/favorites/sync），失败就留在队列里等下次
//   进入 App / 登录后 → 先 pull（?since= 增量）再 push（提交积压的队列）
//
// 服务端是唯一真源（SK-12）：本地队列只是"待上传的意图"，任何合并语义都由
// shared/utils/favorite-sync.ts 的纯函数决定。
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ApiError } from 'shared/api/http-client'
import type { FavoriteItemRecord } from 'shared/types/api'
import { useSession } from '../auth/session-provider'
import {
  EMPTY_FAVORITES_STATE,
  appendToggle,
  applyLocalToggle,
  loadFavoritesState,
  pendingCount as countPending,
  pullFavorites,
  pushFavorites,
  saveFavoritesState,
  type FavoritesState,
} from './store'

export interface FavoritesContextValue {
  favorites: FavoriteItemRecord[]
  isFavorited: (toolId: string) => boolean
  /** 还没同步到服务端的 op 数（> 0 时界面显示"待同步"） */
  pendingCount: number
  syncing: boolean
  /** 最近一次同步失败的原因（ApiError.code 即 i18n key） */
  error: ApiError | null
  toggle: (toolId: string) => Promise<void>
  /** 手动重试同步 */
  sync: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }): ReactNode {
  const { api, status, handleApiError } = useSession()
  const [state, setState] = useState<FavoritesState>(EMPTY_FAVORITES_STATE)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  // 冷启动：先把本地缓存+队列读出来（未登录也能看到上次的收藏）
  useEffect(() => {
    let alive = true
    loadFavoritesState()
      .then((loaded) => {
        if (alive) setState(loaded)
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  const sync = useCallback(async (): Promise<void> => {
    if (!api) return
    setSyncing(true)
    setError(null)
    try {
      // 以磁盘上的最新状态为基准，避免闭包里的 state 过期
      const current = await loadFavoritesState()
      const pulled = await pullFavorites(api.favorites, current)
      setState(await pushFavorites(api.favorites, pulled))
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught)
        handleApiError(caught)
      }
    } finally {
      setSyncing(false)
    }
  }, [api, handleApiError])

  // 登录成功后自动同步一次
  useEffect(() => {
    if (status !== 'signedIn') return
    void sync()
  }, [status, sync])

  const toggle = useCallback(
    async (toolId: string): Promise<void> => {
      const current = state
      const favorited = current.favorites.some((item) => item.toolId === toolId && item.type === 'tool')

      // 1) 乐观更新 + 入队（即使未登录/离线也成立）
      const optimistic: FavoritesState = {
        favorites: applyLocalToggle(current.favorites, toolId, favorited),
        pending: appendToggle(current.pending, toolId, favorited),
        lastSyncedAt: current.lastSyncedAt,
      }
      setState(optimistic)
      await saveFavoritesState(optimistic)

      // 2) 已登录则立刻提交；失败保持队列，界面显示"待同步"
      if (!api || status !== 'signedIn') return
      setSyncing(true)
      setError(null)
      try {
        setState(await pushFavorites(api.favorites, optimistic))
      } catch (caught) {
        if (caught instanceof ApiError) {
          setError(caught)
          handleApiError(caught)
        }
      } finally {
        setSyncing(false)
      }
    },
    [state, api, status, handleApiError],
  )

  const value = useMemo<FavoritesContextValue>(() => {
    const keys = new Set(state.favorites.map((item) => `${item.type}:${item.toolId}`))
    return {
      favorites: state.favorites,
      isFavorited: (toolId: string) => keys.has(`tool:${toolId}`),
      pendingCount: countPending(state),
      syncing,
      error,
      toggle,
      sync,
    }
  }, [state, syncing, error, toggle, sync])

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites(): FavoritesContextValue {
  const value = useContext(FavoritesContext)
  if (!value) throw new Error('useFavorites must be used inside <FavoritesProvider>')
  return value
}
