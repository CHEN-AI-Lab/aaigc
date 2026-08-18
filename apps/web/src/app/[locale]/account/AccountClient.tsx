'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFavorites } from '@/components/FavoritesProvider'
import { tools } from 'data/tools'
import { products } from 'data/products'

type Tab = 'all' | 'tool' | 'product'

interface UserProfile {
  id: string
  email: string | null
  emailVerified: string | null
  name: string | null
  role: string
  image: string | null
  createdAt: string
  hasPassword: boolean
  accounts: { provider: string }[]
}

export default function AccountClient() {
  const t = useTranslations('auth')
  const tt = useTranslations('tools')
  const tp = useTranslations('products')
  const locale = useLocale()
  const { data: session, status } = useSession()
  const { favorites, loading, toggleFavorite } = useFavorites()
  const [tab, setTab] = useState<Tab>('all')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState('')

  // Change password dialog
  const [changingPwd, setChangingPwd] = useState(false)
  const [pwdOld, setPwdOld] = useState('')
  const [pwdNew, setPwdNew] = useState('')
  const [pwdConfirm, setPwdConfirm] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdError, setPwdError] = useState('')

  // Stats
  const toolFavs = useMemo(() => favorites.filter((f) => f.type === 'tool'), [favorites])
  const productFavs = useMemo(() => favorites.filter((f) => f.type === 'product'), [favorites])

  // Filtered list
  const filtered = useMemo(() => {
    if (tab === 'tool') return toolFavs
    if (tab === 'product') return productFavs
    return favorites
  }, [favorites, toolFavs, productFavs, tab])

  // Recent favorites (latest 3, mixed type)
  const recentFavs = useMemo(() => favorites.slice(0, 3), [favorites])

  // Fetch full profile
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.user)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (session) fetchProfile()
  }, [session, fetchProfile])

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
      return new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return ''
    }
  }

  // Providers label map
  const providerNames: Record<string, string> = {
    google: 'Google',
    github: 'GitHub',
    credentials: t('passwordLogin') || 'Password',
    email: t('passwordLogin') || 'Password',
  }

  const handleSaveName = async () => {
    const name = newName.trim()
    if (!name) {
      setNameError(t('fillRequired'))
      return
    }
    setNameSaving(true)
    setNameError('')
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        setEditingName(false)
        await fetchProfile()
      } else {
        const data = await res.json()
        setNameError(t(data.error) || t('registerFailed'))
      }
    } catch {
      setNameError(t('registerFailed'))
    } finally {
      setNameSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!pwdOld || !pwdNew) {
      setPwdError(t('fillRequired'))
      return
    }
    if (pwdNew.length < 8) {
      setPwdError(t('passwordTooShort'))
      return
    }
    if (pwdNew !== pwdConfirm) {
      setPwdError(t('passwordMismatch'))
      return
    }
    setPwdSaving(true)
    setPwdError('')
    try {
      // Verify current password
      const checkRes = await fetch('/api/auth/check-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile?.email, password: pwdOld }),
      })
      if (!checkRes.ok) {
        setPwdError(t('loginFailed'))
        setPwdSaving(false)
        return
      }
      // Update via send-verification + set-password flow
      const sendRes = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile?.email, purpose: 'changePassword' }),
      })
      if (!sendRes.ok) {
        setPwdError(t('sendFailed'))
        setPwdSaving(false)
        return
      }
      setPwdOld('')
      setPwdNew('')
      setPwdConfirm('')
      setChangingPwd(false)
    } catch {
      setPwdError(t('registerFailed'))
    } finally {
      setPwdSaving(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-[calc(100vh-200px)] px-4 py-10">
        <div className="max-w-2xl mx-auto animate-pulse">
          {/* User info skeleton */}
          <div className="bg-card rounded-sm border border-border p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-surface" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-surface rounded" />
                <div className="h-3 w-48 bg-surface rounded" />
                <div className="h-3 w-24 bg-surface rounded" />
              </div>
            </div>
          </div>
          {/* Stats cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-sm border border-border p-4">
                <div className="h-8 w-12 bg-surface rounded mx-auto mb-2" />
                <div className="h-3 w-20 bg-surface rounded mx-auto" />
              </div>
            ))}
          </div>
          {/* Favorites skeleton */}
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-card rounded-sm border border-border" />
            ))}
          </div>
        </div>
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
          <div className="flex items-start gap-4">
            {session.user?.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-14 h-14 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xl font-semibold shrink-0">
                {(session.user?.name || session.user?.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-medium text-text-primary">
                  {session.user?.name || t('noName')}
                </p>
                <button
                  onClick={() => {
                    setNewName(session.user?.name || profile?.name || '')
                    setEditingName(true)
                  }}
                  className="text-[10px] text-text-secondary/50 hover:text-accent transition-colors"
                >
                  ✏️ {t('editName')}
                </button>
              </div>
              <p className="text-xs text-text-secondary truncate">
                {session.user?.email}
                {profile?.emailVerified ? (
                  <span className="text-green-500 ml-1">✓ {t('emailVerified')}</span>
                ) : (
                  <span className="text-text-secondary/50 ml-1">({t('emailUnverified')})</span>
                )}
              </p>
              <p className="text-xs text-text-secondary/50 mt-0.5">
                {(profile?.role || session.user?.role || 'user') === 'admin' ? `👑 ${t('admin')}` : `👤 ${t('user')}`}
                {profile?.createdAt && ` · ${t('memberSince')} ${formatDate(profile.createdAt)}`}
              </p>
              {profile && profile.accounts.length > 0 && (
                <p className="text-xs text-text-secondary/50 mt-0.5">
                  🔗 {t('connectedAccounts')}: {profile.accounts.map((a) => providerNames[a.provider] || a.provider).join(', ')}
                </p>
              )}
              {profile?.hasPassword && (
                <p className="text-xs text-text-secondary/50 mt-0.5">
                  🔒 {t('passwordLogin')}{' '}
                  <button
                    onClick={() => {
                      setPwdOld(''); setPwdNew(''); setPwdConfirm(''); setPwdError('')
                      setChangingPwd(true)
                    }}
                    className="text-accent hover:underline ml-1"
                  >
                    {t('changePassword')}
                  </button>
                </p>
              )}
              {profile && !profile.hasPassword && profile.accounts.length === 0 && (
                <p className="text-xs text-text-secondary/50 mt-0.5">
                  🔒 {t('passwordLogin')}{' '}
                  <button
                    onClick={() => {
                      setPwdOld(''); setPwdNew(''); setPwdConfirm(''); setPwdError('')
                      setChangingPwd(true)
                    }}
                    className="text-accent hover:underline ml-1"
                  >
                    {t('setPassword')}
                  </button>
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="shrink-0 px-3 py-1.5 rounded-sm border border-border text-xs text-text-secondary hover:bg-accent/5 transition-colors"
            >
              {t('logout')}
            </button>
          </div>
        </div>

        {/* ── Recent Favorites ── */}
        {recentFavs.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-semibold text-text-secondary mb-3">🕘 {tt('recentFavorites')}</p>
            <div className="flex flex-wrap gap-2">
              {recentFavs.map((fav) => {
                const info = getItemInfo(fav.toolId, fav.type)
                return (
                  <Link
                    key={fav.id}
                    href={fav.type === 'product' ? `/products/${fav.toolId}` : `/tools/${fav.toolId}`}
                    className="flex items-center gap-1.5 bg-card rounded-sm border border-border px-2.5 py-1.5 text-xs text-text-primary hover:text-accent transition-colors"
                  >
                    {info.icon} {info.name}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-card rounded-sm border border-border" />
              ))}
            </div>
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

        {/* ── Edit Name Dialog ── */}
        {editingName && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={() => setEditingName(false)} />
            <div className="relative bg-card rounded-sm border border-border shadow-lg p-6 w-full max-w-sm">
              <h3 className="text-sm font-semibold text-text-primary mb-4">{t('editName')}</h3>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full p-2 bg-surface border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30 mb-3"
                placeholder={t('name')}
              />
              {nameError && <p className="text-xs text-error mb-3">{nameError}</p>}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditingName(false)}
                  className="px-3 py-1.5 rounded-sm border border-border text-xs text-text-secondary hover:bg-accent/5 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSaveName}
                  disabled={nameSaving}
                  className="px-3 py-1.5 rounded-sm bg-accent text-white text-xs disabled:opacity-50"
                >
                  {nameSaving ? '...' : t('save')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Change Password Dialog ── */}
        {changingPwd && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={() => setChangingPwd(false)} />
            <div className="relative bg-card rounded-sm border border-border shadow-lg p-6 w-full max-w-sm">
              <h3 className="text-sm font-semibold text-text-primary mb-4">{t('changePassword')}</h3>
              <input
                type="password"
                value={pwdOld}
                onChange={(e) => setPwdOld(e.target.value)}
                className="w-full p-2 bg-surface border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30 mb-2"
                placeholder={t('currentPassword')}
              />
              <input
                type="password"
                value={pwdNew}
                onChange={(e) => setPwdNew(e.target.value)}
                className="w-full p-2 bg-surface border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30 mb-2"
                placeholder={t('newPassword')}
              />
              <input
                type="password"
                value={pwdConfirm}
                onChange={(e) => setPwdConfirm(e.target.value)}
                className="w-full p-2 bg-surface border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30 mb-3"
                placeholder={t('confirmPassword')}
              />
              {pwdError && <p className="text-xs text-error mb-3">{pwdError}</p>}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setChangingPwd(false)}
                  className="px-3 py-1.5 rounded-sm border border-border text-xs text-text-secondary hover:bg-accent/5 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={pwdSaving}
                  className="px-3 py-1.5 rounded-sm bg-accent text-white text-xs disabled:opacity-50"
                >
                  {pwdSaving ? '...' : t('save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}