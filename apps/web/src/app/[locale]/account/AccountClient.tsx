'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

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
  const locale = useLocale()
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState('')

  const [changingPwd, setChangingPwd] = useState(false)
  const [pwdOld, setPwdOld] = useState('')
  const [pwdNew, setPwdNew] = useState('')
  const [pwdConfirm, setPwdConfirm] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdError, setPwdError] = useState('')

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

  const formatDate = (d: string | Date) => {
    try {
      return new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return ''
    }
  }

  const providerNames: Record<string, string> = {
    google: 'Google',
    github: 'GitHub',
    credentials: t('passwordLogin') || 'Password',
    email: t('passwordLogin') || 'Password',
  }

  const handleSaveName = async () => {
    const name = newName.trim()
    if (!name) { setNameError(t('fillRequired')); return }
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
    if (!pwdNew) { setPwdError(t('fillRequired')); return }
    if (pwdNew.length < 8) { setPwdError(t('passwordTooShort')); return }
    if (pwdNew !== pwdConfirm) { setPwdError(t('passwordMismatch')); return }
    setPwdSaving(true)
    setPwdError('')
    try {
      // 已有密码的用户需验证旧密码；未设置过密码（OAuth 登录）的用户直接设置
      if (profile?.hasPassword) {
        if (!pwdOld) { setPwdError(t('fillRequired')); setPwdSaving(false); return }
        const checkRes = await fetch('/api/auth/check-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: profile?.email, password: pwdOld }),
        })
        if (!checkRes.ok) { setPwdError(t('loginFailed')); setPwdSaving(false); return }
      }
      const sendRes = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile?.email, purpose: 'changePassword' }),
      })
      if (!sendRes.ok) { setPwdError(t('sendFailed')); setPwdSaving(false); return }
      setPwdOld(''); setPwdNew(''); setPwdConfirm(''); setChangingPwd(false)
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
          <div className="bg-card rounded-sm border border-border p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-surface" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-surface rounded" />
                <div className="h-3 w-48 bg-surface rounded" />
                <div className="h-3 w-24 bg-surface rounded" />
              </div>
            </div>
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
          <Link href="/login" className="inline-block px-4 py-2 rounded-sm bg-accent text-white text-sm">
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
    <div className="min-h-[calc(100vh-200px)] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* ── User Info Card ── */}
        <div className="bg-card rounded-sm border border-border p-6">
          <div className="flex items-start gap-4">
            {session.user?.image ? (
              <img src={session.user.image} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />
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
                  onClick={() => { setNewName(session.user?.name || profile?.name || ''); setEditingName(true) }}
                  className="text-[10px] text-text-secondary/50 hover:text-accent transition-colors"
                >
                  ✏️ {t('editName')}
                </button>
              </div>
              <p className="text-xs text-text-secondary truncate">
                {session.user?.email}
                {profile?.emailVerified
                  ? <span className="text-green-500 ml-1">✓ {t('emailVerified')}</span>
                  : <span className="text-text-secondary/50 ml-1">({t('emailUnverified')})</span>}
              </p>
              <p className="text-xs text-text-secondary/50 mt-1">
                {(profile?.role || session.user?.role || 'user') === 'admin' ? `👑 ${t('admin')}` : `👤 ${t('user')}`}
                {profile?.createdAt && ` · ${t('memberSince')} ${formatDate(profile.createdAt)}`}
              </p>
              {profile && profile.accounts.length > 0 && (
                <p className="text-xs text-text-secondary/50 mt-1">
                  🔗 {t('connectedAccounts')}: {profile.accounts.map(a => providerNames[a.provider] || a.provider).join(', ')}
                </p>
              )}
              {profile && (
                <p className="text-xs text-text-secondary/50 mt-1">
                  🔒 {t('passwordLogin')}{' '}
                  <button onClick={() => { setPwdOld(''); setPwdNew(''); setPwdConfirm(''); setPwdError(''); setChangingPwd(true) }}
                    className="text-accent hover:underline ml-1">
                    {profile.hasPassword ? t('changePassword') : t('setPassword')}
                  </button>
                </p>
              )}
            </div>
            <button onClick={handleLogout}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-border text-xs text-text-secondary hover:bg-accent/5 hover:text-error transition-colors">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {t('logout')}
            </button>
          </div>
        </div>

        {/* ── Edit Name Dialog ── */}
        {editingName && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={() => setEditingName(false)} />
            <div className="relative bg-card rounded-sm border border-border shadow-lg p-6 w-full max-w-sm">
              <h3 className="text-sm font-semibold text-text-primary mb-4">{t('editName')}</h3>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                className="w-full p-2 bg-surface border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30 mb-3"
                placeholder={t('name')} />
              {nameError && <p className="text-xs text-error mb-3">{nameError}</p>}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditingName(false)}
                  className="px-3 py-1.5 rounded-sm border border-border text-xs text-text-secondary hover:bg-accent/5 transition-colors">{t('cancel')}</button>
                <button onClick={handleSaveName} disabled={nameSaving}
                  className="px-3 py-1.5 rounded-sm bg-accent text-white text-xs disabled:opacity-50">{nameSaving ? '...' : t('save')}</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Change Password Dialog ── */}
        {changingPwd && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={() => setChangingPwd(false)} />
            <div className="relative bg-card rounded-sm border border-border shadow-lg p-6 w-full max-w-sm">
              <h3 className="text-sm font-semibold text-text-primary mb-4">
                {profile?.hasPassword ? t('changePassword') : t('setPassword')}
              </h3>
              {profile?.hasPassword && (
                <input type="password" value={pwdOld} onChange={e => setPwdOld(e.target.value)}
                  className="w-full p-2 bg-surface border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30 mb-2"
                  placeholder={t('currentPassword')} />
              )}
              <input type="password" value={pwdNew} onChange={e => setPwdNew(e.target.value)}
                className="w-full p-2 bg-surface border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30 mb-2"
                placeholder={t('newPassword')} />
              <input type="password" value={pwdConfirm} onChange={e => setPwdConfirm(e.target.value)}
                className="w-full p-2 bg-surface border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30 mb-3"
                placeholder={t('confirmPassword')} />
              {pwdError && <p className="text-xs text-error mb-3">{pwdError}</p>}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setChangingPwd(false)}
                  className="px-3 py-1.5 rounded-sm border border-border text-xs text-text-secondary hover:bg-accent/5 transition-colors">{t('cancel')}</button>
                <button onClick={handleChangePassword} disabled={pwdSaving}
                  className="px-3 py-1.5 rounded-sm bg-accent text-white text-xs disabled:opacity-50">{pwdSaving ? '...' : t('save')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}