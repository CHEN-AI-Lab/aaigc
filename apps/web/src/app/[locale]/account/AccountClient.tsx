'use client'

import { useTranslations } from 'next-intl'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from '@/i18n/navigation'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import type { FavoriteItem } from 'shared/types'

export default function AccountClient() {
  const t = useTranslations('auth')
  const tt = useTranslations('tools')
  const tp = useTranslations('products')
  const { data: session, status } = useSession()
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [favoritesLoading, setFavoritesLoading] = useState(false)

  const fetchFavorites = useCallback(async () => {
    setFavoritesLoading(true)
    try {
      const res = await fetch('/api/favorites')
      if (res.ok) {
        const data = await res.json()
        setFavorites(data.favorites || [])
      }
    } catch {
      // ignore
    } finally {
      setFavoritesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session) {
      fetchFavorites()
    }
  }, [session, fetchFavorites])

  if (status === 'loading') {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <p className="text-text-secondary text-sm">...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary text-sm mb-4">{t('notLoggedIn')}</p>
          <Link
            href="/login"
            className="inline-block px-4 py-2 rounded-sm bg-accent text-white text-sm"
          >
            {t('login')}
          </Link>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-text-primary text-center mb-8">
          {t('account')}
        </h1>

        <div className="bg-bg rounded-sm border border-[rgba(127,99,21,0.1)] p-6 space-y-4">
          {/* Avatar + Name */}
          <div className="flex items-center gap-4">
            {session.user?.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent text-lg font-semibold">
                {(session.user?.name || session.user?.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-text-primary">
                {session.user?.name || t('noName')}
              </p>
              <p className="text-xs text-text-secondary">
                {session.user?.email}
              </p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-center justify-between py-2 border-t border-[rgba(127,99,21,0.1)]">
            <span className="text-xs text-text-secondary">{t('role')}</span>
            <span className="text-xs text-text-primary font-medium">
              {(session.user as any)?.role === 'admin' ? t('admin') : t('user')}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 rounded-sm border border-[rgba(127,99,21,0.2)] text-sm text-text-primary hover:bg-accent/5 transition-colors"
          >
            {t('logout')}
          </button>
        </div>

        {/* My Favorites */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            {tt('myFavorites')}
          </h2>
          {favoritesLoading ? (
            <p className="text-sm text-text-secondary">...</p>
          ) : favorites.length === 0 ? (
            <p className="text-sm text-text-secondary">{tt('noFavorites')}</p>
          ) : (
            <ul className="space-y-2">
              {favorites.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between bg-bg rounded-sm border border-[rgba(127,99,21,0.1)] px-4 py-3"
                >
                  <span className="text-sm text-text-primary">
                    {f.type === 'product' ? tp(`${f.toolId}.name`) : tt(`${f.toolId}.name`)}
                  </span>
                  <Link
                    href={f.type === 'product' ? `/products/${f.toolId}` : `/tools/${f.toolId}`}
                    className="text-xs text-accent hover:underline"
                  >
                    {t('view')}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}