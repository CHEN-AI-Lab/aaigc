'use client'

import { useTranslations } from 'next-intl'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useFavorites } from '@/components/FavoritesProvider'
import { tools } from 'data/tools'
import { products } from 'data/products'

type Tab = 'all' | 'tool' | 'product'

export default function AccountClient() {
  const t = useTranslations('auth')
  const tt = useTranslations('tools')
  const tp = useTranslations('products')
  const { data: session, status } = useSession()
  const { favorites, loading, toggleFavorite } = useFavorites()
  const [tab, setTab] = useState<Tab>('all')

  // Stats
  const toolFavs = useMemo(() => favorites.filter((f) => f.type === 'tool'), [favorites])
  const productFavs = useMemo(() => favorites.filter((f) => f.type === 'product'), [favorites])

  // Filtered list
  const filtered = useMemo(() => {
    if (tab === 'tool') return toolFavs
    if (tab === 'product') return productFavs
    return favorites
  }, [favorites, toolFavs, productFavs, tab])

  // Lookup helper: icon + name for tool/product
  const getItemInfo = (itemId: string, type: string) => {
    if (type === 'tool') {
      const tool = tools.find((t) => t.id === itemId)
      return { icon: tool?.icon || '🔧', name: tt(`${itemId}.name`) }
    }
    const product = products.find((p) => p.id === itemId)
    return { icon: product?.icon || '📦', name: tp(`${itemId}.name`) }
  }

  // Format date
  const formatDate = (d: string | Date) => {
    try {
      return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return ''
    }
  }

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

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: `${tt('all')}`, count: favorites.length },
    { key: 'tool', label: `🔧 ${tt('favoriteTools')}`, count: toolFavs.length },
    { key: 'product', label: `📦 ${tt('favoriteProducts')}`, count: productFavs.length },
  ]

  return (
    <div className="min-h-[calc(100vh-200px)] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* ── User Info Card ── */}
        <div className="bg-card rounded-sm border border-border p-6 mb-8">
          <div className="flex items-center gap-4">
            {session.user?.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xl font-semibold">
                {(session.user?.name || session.user?.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-text-primary">
                {session.user?.name || t('noName')}
              </p>
              <p className="text-xs text-text-secondary truncate">
                {session.user?.email}
              </p>
              <p className="text-xs text-text-secondary/50 mt-0.5">
                {(session.user as { role?: string })?.role === 'admin' ? `👑 ${t('admin')}` : `👤 ${t('user')}`}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="shrink-0 px-3 py-1.5 rounded-sm border border-border text-xs text-text-secondary hover:bg-accent/5 transition-colors"
            >
              {t('logout')}
            </button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: tt('myFavorites'), value: favorites.length, color: 'from-accent/20 to-accent/5' },
            { label: `🔧 ${tt('favoriteTools')}`, value: toolFavs.length, color: 'from-blue-500/20 to-blue-500/5' },
            { label: `📦 ${tt('favoriteProducts')}`, value: productFavs.length, color: 'from-green-500/20 to-green-500/5' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`bg-gradient-to-br ${stat.color} rounded-sm border border-border p-4 text-center`}
            >
              <p className="text-2xl font-semibold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-secondary mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Favorites Section ── */}
        <div>
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-surface rounded-sm p-1 border border-border">
            {tabs.map((tabItem) => (
              <button
                key={tabItem.key}
                onClick={() => setTab(tabItem.key)}
                className={`flex-1 text-xs py-1.5 rounded-sm transition-colors ${
                  tab === tabItem.key
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tabItem.label} {tabItem.count > 0 && `(${tabItem.count})`}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <p className="text-sm text-text-secondary text-center py-8">...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-2xl mb-2">📭</p>
              <p className="text-sm text-text-secondary">
                {tab === 'all' && tt('noFavorites')}
                {tab === 'tool' && `${tt('noFavorites')} 🔧`}
                {tab === 'product' && `${tt('noFavorites')} 📦`}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((f) => {
                const info = getItemInfo(f.toolId, f.type)
                return (
                  <li
                    key={f.id}
                    className="flex items-center gap-3 bg-card rounded-sm border border-border px-4 py-3"
                  >
                    <span className="text-lg shrink-0">{info.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{info.name}</p>
                      <p className="text-[10px] text-text-secondary/50">
                        {f.type === 'tool' ? `🔧 ${tt('tool')}` : `📦 ${tp('product')}`}
                        {f.createdAt && ` · ${formatDate(f.createdAt)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={f.type === 'product' ? `/products/${f.toolId}` : `/tools/${f.toolId}`}
                        className="text-xs text-accent hover:underline"
                      >
                        {t('view')}
                      </Link>
                      <button
                        onClick={() => toggleFavorite(f.toolId, f.type as 'tool' | 'product')}
                        className="p-1 rounded-sm text-text-secondary/40 hover:text-error transition-colors"
                        title={tt('unfavorite')}
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}