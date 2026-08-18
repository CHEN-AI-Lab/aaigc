'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useSession } from '@/auth-client'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import type { FavoriteItem } from 'shared/types'

type ToastState = { message: string; key: number; error?: boolean } | null

type FavoritesContextValue = {
  favorites: FavoriteItem[]
  loading: boolean
  isFavorited: (itemId: string, type: string) => boolean
  toggleFavorite: (itemId: string, type?: 'tool' | 'product') => Promise<boolean>
  toast: ToastState
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations('tools')
  const { data: session } = useSession()
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)

  const showToast = useCallback((message: string, error = false) => {
    setToast({ message, key: Date.now(), error })
    setTimeout(() => setToast(null), 2000)
  }, [])

  // Fetch favorites on session change (login/logout/refresh).
  // No hasFetched ref — always fetch when session changes, so hard refresh works reliably.
  useEffect(() => {
    if (!session) {
      setFavorites([])
      return
    }

    let cancelled = false
    setLoading(true)
    fetch('/api/favorites')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setFavorites(data.favorites || [])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [session])

  const isFavorited = useCallback(
    (itemId: string, type: string) =>
      favorites.some((f) => f.toolId === itemId && f.type === type),
    [favorites]
  )

  const toggleFavorite = useCallback(
    async (itemId: string, type: 'tool' | 'product' = 'tool') => {
      if (!session) {
        showToast(t('loginRequired'))
        setTimeout(() => router.push('/login'), 1500)
        return false
      }

      try {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId: itemId, type }),
        })
        if (!res.ok) return false
        const data = await res.json()

        setFavorites((prev) =>
          data.isFavorited
            ? [
                {
                  id: `tmp-${Date.now()}`,
                  toolId: itemId,
                  type,
                  createdAt: new Date().toISOString(),
                },
                ...prev.filter((f) => !(f.toolId === itemId && f.type === type)),
              ]
            : prev.filter((f) => !(f.toolId === itemId && f.type === type))
        )

        showToast(data.isFavorited ? t('favoriteSuccess') : t('unfavoriteSuccess'))
        return data.isFavorited as boolean
      } catch {
        return false
      }
    },
    [session, router, showToast, t]
  )

  return (
    <FavoritesContext.Provider value={{ favorites, loading, isFavorited, toggleFavorite, toast }}>
      {children}
      {toast && (
        <div
          key={toast.key}
          className={`fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] text-xs rounded-md px-4 py-2.5 shadow-lg whitespace-nowrap ${
            toast.error ? 'bg-text text-white' : 'bg-accent/95 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </FavoritesContext.Provider>
  )
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext)
  if (!ctx) {
    throw new Error('useFavorites must be used within <FavoritesProvider>')
  }
  return ctx
}