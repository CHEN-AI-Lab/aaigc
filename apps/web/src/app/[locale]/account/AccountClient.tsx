'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useCallback, useEffect, useState, useRef } from 'react'

interface UserProfile {
  id: string
  email: string | null
  name: string | null
  role: string
  image: string | null
  createdAt: string
  hasPassword: boolean
  accounts: { provider: string }[]
}

// OAuth 账号的顺序和显示名称
const OAUTH_ORDER: Record<string, number> = { google: 0, github: 1 }
const OAUTH_NAMES: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
}

export default function AccountClient() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const { data: session, status, update } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)

  // ── Name inline edit ──
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  // ── Password inline edit ──
  const [showPwdForm, setShowPwdForm] = useState(false)
  const [pwdOld, setPwdOld] = useState('')
  const [pwdNew, setPwdNew] = useState('')
  const [pwdConfirm, setPwdConfirm] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdError, setPwdError] = useState('')

  // ── Delete account ──
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteCode, setDeleteCode] = useState('')
  const [deleteCodeSent, setDeleteCodeSent] = useState(false)
  const [deleteSendingCode, setDeleteSendingCode] = useState(false)
  const [deleteSaving, setDeleteSaving] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // ── Toast ──
  const [toast, setToast] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 3000)
  }

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.user)
      }
    } catch { /* ignore */ }
    finally { setProfileLoaded(true) }
  }, [])

  useEffect(() => {
    if (session) fetchProfile()
  }, [session, fetchProfile])

  useEffect(() => {
    if (editingName && nameRef.current) nameRef.current.focus()
  }, [editingName])

  const formatDate = (d: string | Date) => {
    try {
      return new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
    } catch { return '' }
  }

  // ── Name save ──
  const handleSaveName = async () => {
    const name = nameInput.trim()
    if (!name) { showToast(t('fillRequired')); return }
    setNameSaving(true)
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        setEditingName(false)
        await update({ name })
        await fetchProfile()
        showToast(t('nameUpdated'))
      } else {
        const data = await res.json()
        showToast(t(data.error) || t('registerFailed'))
      }
    } catch { showToast(t('registerFailed')) }
    finally { setNameSaving(false) }
  }

  // ── Password save ──
  const handleSavePassword = async () => {
    if (!pwdNew) { setPwdError(t('fillRequired')); return }
    if (pwdNew.length < 8) { setPwdError(t('passwordTooShort')); return }
    let types = 0
    if (/[a-z]/.test(pwdNew)) types++
    if (/[A-Z]/.test(pwdNew)) types++
    if (/[0-9]/.test(pwdNew)) types++
    if (/[^a-zA-Z0-9]/.test(pwdNew)) types++
    if (types < 2) { setPwdError(t('passwordNeedsTypes')); return }
    const COMMON = ['password1','password123','qwerty123','qwerty1','trustno1','abc12345','1234qwer','1q2w3e4r','passw0rd','admin123','12345678','87654321','11111111','00000000','aaaaaaaa']
    if (COMMON.includes(pwdNew.toLowerCase())) { setPwdError(t('passwordCommon')); return }
    if (pwdNew !== pwdConfirm) { setPwdError(t('passwordMismatch')); return }
    if (profile?.hasPassword) {
      if (!pwdOld) { setPwdError(t('fillRequired')); return }
      const r = await fetch('/api/auth/check-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, password: pwdOld }),
      })
      if (!r.ok) { setPwdError(t('currentPasswordWrong')); return }
    }

    setPwdSaving(true); setPwdError('')
    try {
      // 已登录用户直接调 set-password API（无需验证码）
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwdNew }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPwdError(t(data.error) || t('registerFailed'))
        setPwdSaving(false)
        return
      }
      setShowPwdForm(false); setPwdOld(''); setPwdNew(''); setPwdConfirm(''); setPwdError('')
      await fetchProfile()
      showToast(t('passwordUpdated'))
    } catch { setPwdError(t('registerFailed')) }
    finally { setPwdSaving(false) }
  }

  // ── Delete account ──
  const handleSendDeleteCode = async () => {
    setDeleteSendingCode(true); setDeleteError('')
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session?.user?.email, purpose: 'deleteAccount', locale }),
      })
      const data = await res.json()
      if (!res.ok) { setDeleteError(t('sendFailed')); return }
      if (data.devCode) setDeleteCode(data.devCode)
      setDeleteCodeSent(true)
    } catch { setDeleteError(t('sendFailed')) }
    finally { setDeleteSendingCode(false) }
  }

  const handleDeleteAccount = async () => {
    setDeleteSaving(true); setDeleteError('')
    try {
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session?.user?.email, code: deleteCode }),
      })
      if (res.ok) {
        await signOut({ callbackUrl: '/' })
      } else {
        const data = await res.json()
        setDeleteError(t(data.error) || t('registerFailed'))
      }
    } catch { setDeleteError(t('registerFailed')) }
    finally { setDeleteSaving(false) }
  }

  // ── Export data ──
  const handleExport = async () => {
    try {
      const res = await fetch('/api/user/export')
      if (!res.ok) { showToast(t('registerFailed')); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `aaigc-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast(t('exportSuccess'))
    } catch { showToast(t('registerFailed')) }
  }

  const handleLogout = async () => { await signOut({ callbackUrl: '/' }) }

  // ── Unlink OAuth ──
  const [unlinking, setUnlinking] = useState<string | null>(null)
  const [unlinkConfirmProvider, setUnlinkConfirmProvider] = useState<string | null>(null)
  const [unlinkError, setUnlinkError] = useState('')
  const [needsManualRevoke, setNeedsManualRevoke] = useState(false)

  const handleUnlinkClick = (provider: string) => {
    setUnlinkConfirmProvider(provider)
    setUnlinkError('')
    setNeedsManualRevoke(false)
  }

  const handleUnlinkConfirm = async () => {
    if (!unlinkConfirmProvider) return
    setUnlinking(unlinkConfirmProvider)
    try {
      const res = await fetch('/api/user/unlink-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: unlinkConfirmProvider }),
      })
      const data = await res.json()
      if (res.ok) {
        await fetchProfile()
        setUnlinkConfirmProvider(null)
        if (data.needsManualRevoke) {
          setNeedsManualRevoke(true)
          showToast(t('githubManualRevoke'))
        } else {
          showToast(t('unlinkSuccess'))
        }
      } else {
        setUnlinkError(t(data.error || 'unlinkFailed'))
      }
    } catch { setUnlinkError(t('unlinkFailed')) }
    finally { setUnlinking(null) }
  }

  // ── Loading / Not logged in ──
  if (status === 'loading' || (session && !profileLoaded)) {
    return (
      <div className="min-h-[calc(100vh-200px)] px-4 py-10">
        <div className="max-w-xl mx-auto animate-pulse space-y-6">
          <div className="h-48 bg-card rounded-sm border border-border" />
          <div className="h-32 bg-card rounded-sm border border-border" />
          <div className="h-32 bg-card rounded-sm border border-border" />
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary text-sm mb-4">{t('notLoggedIn')}</p>
          <Link href="/login" className="inline-block px-4 py-2 rounded-sm bg-accent text-white text-sm">{t('login')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-200px)] px-4 py-10">
      <div className="max-w-xl mx-auto space-y-6">

        {/* ── Card 1: Profile ── */}
        <div className="bg-card rounded-sm border border-border overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-accent to-accent-light" />
          <div className="p-5 sm:p-6">
            {/* Title + Logout */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-sm">👤</span>
                <h2 className="text-sm font-semibold text-text-primary">{t('accountSettings')}</h2>
              </div>
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs text-text-secondary/70 hover:text-error hover:bg-error/5 transition-colors">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {t('logout')}
              </button>
            </div>

            {/* Avatar + Name */}
            <div className="flex items-center gap-4 mb-5">
              {profile?.image || session.user?.image ? (
                <img src={profile?.image || session.user?.image || ''} alt="" className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-border" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent text-base font-semibold shrink-0 border-2 border-border">
                  {(profile?.name || session.user?.name || session.user?.email || '?')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={nameRef}
                      type="text"
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
                      className="flex-1 p-2 bg-surface border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30"
                      maxLength={30}
                      autoFocus
                    />
                    <button onClick={handleSaveName} disabled={nameSaving}
                      className="text-xs text-accent hover:underline disabled:opacity-50">{nameSaving ? '...' : t('save')}</button>
                    <button onClick={() => setEditingName(false)}
                      className="text-xs text-text-secondary/60 hover:text-text-primary">{t('cancel')}</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium text-text-primary">{profile?.name || session.user?.name || t('noName')}</span>
                    <button onClick={() => { setNameInput(profile?.name || session.user?.name || ''); setEditingName(true) }}
                      className="text-xs text-accent hover:underline">{t('editName')}</button>
                  </div>
                )}
                <p className="text-xs text-text-secondary/60 mt-1">
                  {(profile?.role || session.user?.role || 'user') === 'admin' ? `👑 ${t('admin')}` : `👤 ${t('user')}`}{profile?.createdAt && ` · ${t('memberSince')} ${formatDate(profile.createdAt)}`}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center py-3 border-t border-border/50">
              <span className="text-sm text-text-secondary/70 shrink-0 w-[60px]">{t('email')}</span>
              <span className="text-sm text-text-primary truncate ml-4">{session.user?.email}</span>
            </div>
          </div>
        </div>

        {/* ── Card 2: Security ── */}
        <div className="bg-card rounded-sm border border-border overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-200" />
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm">🔒</span>
              <h2 className="text-sm font-semibold text-text-primary">{t('security')}</h2>
            </div>

            <div className="space-y-0">
              {/* Password */}
              <div className="flex items-center justify-between py-3 border-t border-border/50">
                <span className="text-sm text-text-secondary/70 shrink-0 w-[60px]">{t('passwordLogin')}</span>
                <span className="text-right flex items-center gap-3 shrink-0 min-w-0">
                  <span className="text-sm text-text-secondary/60">{profile?.hasPassword ? '••••••••' : t('noPassword')}</span>
                  <button onClick={() => { setShowPwdForm(!showPwdForm); setPwdOld(''); setPwdNew(''); setPwdConfirm(''); setPwdError('') }}
                    className="text-sm text-accent hover:underline shrink-0">
                    {profile?.hasPassword ? t('changePassword') : t('setPassword')}
                  </button>
                </span>
              </div>

              {/* Connected Accounts */}
              {profile && profile.accounts.length > 0 && (
                <div className="flex items-center py-3 border-t border-border/50">
                  <span className="text-sm text-text-secondary/70 shrink-0 w-[60px]">{t('connectedAccounts')}</span>
                  <div className="flex gap-2 flex-wrap ml-auto">
                    {profile.accounts
                      .filter((acc) => ['google', 'github'].includes(acc.provider))
                      .sort((a, b) => (OAUTH_ORDER[a.provider] ?? 99) - (OAUTH_ORDER[b.provider] ?? 99))
                      .map((acc) => (
                        <span key={acc.provider} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-surface border border-border rounded-sm text-xs text-text-primary">
                          {acc.provider === 'google' && (
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12c0 1.78.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                          )}
                          {acc.provider === 'github' && (
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.43 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016.02 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.87.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.22.7.82.58C20.57 21.8 24 17.31 24 12c0-6.63-5.37-12-12-12z"/>
                            </svg>
                          )}
                          {OAUTH_NAMES[acc.provider] || acc.provider}
                          <span className="text-success text-[10px]">✓</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUnlinkClick(acc.provider) }}
                            disabled={unlinking === acc.provider}
                            className="text-text-secondary/60 hover:text-error transition-colors disabled:opacity-50"
                            title={t('unlink')}
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                              <polyline points="16 17 21 12 16 7" />
                              <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Inline password form */}
            {showPwdForm && (
              <div className="mt-3 p-3 bg-surface rounded-sm border border-border space-y-2.5">
                {profile?.hasPassword && (
                  <input type="password" value={pwdOld} onChange={e => setPwdOld(e.target.value)}
                    className="w-full p-2 bg-card border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30" placeholder={t('currentPassword')} />
                )}
                <input type="password" value={pwdNew} onChange={e => setPwdNew(e.target.value)}
                  className="w-full p-2 bg-card border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30" placeholder={t('newPassword')} />
                <p className="text-[10px] text-text-secondary/50 -mt-1.5">{t('passwordHint')}</p>
                <input type="password" value={pwdConfirm} onChange={e => setPwdConfirm(e.target.value)}
                  className="w-full p-2 bg-card border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30" placeholder={t('confirmPassword')} />
                {pwdError && <p className="text-xs text-error">{pwdError}</p>}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSavePassword} disabled={pwdSaving}
                    className="px-4 py-1.5 rounded-sm bg-accent text-white text-xs font-medium disabled:opacity-50">{pwdSaving ? '...' : t('save')}</button>
                  <button onClick={() => setShowPwdForm(false)}
                    className="px-4 py-1.5 rounded-sm border border-border text-xs text-text-secondary hover:bg-accent/5">{t('cancel')}</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Card 3: Data Management ── */}
        <div className="bg-card rounded-sm border border-border overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-sky-400 to-sky-200" />
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm">⚙️</span>
              <h2 className="text-sm font-semibold text-text-primary">{t('dataManagement')}</h2>
            </div>

            {/* Export */}
            <div className="flex items-center justify-between py-3 border-t border-border/50">
              <div className="min-w-0">
                <span className="text-sm text-text-secondary/70">{t('exportTitle')}</span>
                <p className="text-xs text-text-secondary/50 mt-0.5">{t('exportDesc')}</p>
              </div>
              <button onClick={handleExport}
                className="ml-4 px-4 py-2 rounded-sm bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity shrink-0">
                {t('exportButton')}
              </button>
            </div>

            {/* Delete */}
            <div className="flex items-center justify-between py-3 border-t border-border/50">
              <div className="min-w-0">
                <span className="text-sm text-text-secondary/70">{t('deleteAccount')}</span>
                <p className="text-xs text-text-secondary/50 mt-0.5">{t('deleteConfirm')}</p>
              </div>
              <button onClick={() => { setShowDeleteModal(true); setDeleteCode(''); setDeleteCodeSent(false); setDeleteError('') }}
                className="ml-4 px-4 py-2 rounded-sm border border-error/30 text-sm text-error hover:bg-error/5 transition-colors shrink-0">
                {t('deleteAccount')}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── Delete Account Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setShowDeleteModal(false); setDeleteCodeSent(false) }} />
          <div className="relative bg-card rounded-sm border border-border shadow-lg p-6 w-full max-w-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🗑️</span>
              <h3 className="text-sm font-semibold text-text-primary">{t('deleteAccount')}</h3>
            </div>
            <p className="text-xs text-text-secondary mb-4">{t('deleteConfirm')}</p>
            <ul className="text-[10px] text-text-secondary/50 mb-4 space-y-1 list-disc ml-4">
              <li>{t('favorites')}</li>
              <li>{t('deleteItems')}</li>
            </ul>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-text-secondary/50 mb-1 block">{t('email')}</label>
                <input
                  type="email"
                  value={session.user?.email || ''}
                  className="w-full p-2 bg-surface/50 border border-border rounded-sm text-sm text-text-primary/50 cursor-not-allowed"
                  disabled
                />
              </div>
              {deleteCodeSent && (
                <div>
                  <label className="text-[10px] text-text-secondary/50 mb-1 block">{t('verificationCode')}</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={deleteCode}
                    onChange={e => setDeleteCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-2 bg-surface border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-error/30 text-center tracking-widest"
                    placeholder={t('codePlaceholder')}
                  />
                </div>
              )}
              {deleteError && <p className="text-xs text-error">{deleteError}</p>}
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-3 py-1.5 rounded-sm border border-border text-xs text-text-secondary hover:bg-accent/5">{t('cancel')}</button>
                {!deleteCodeSent ? (
                  <button onClick={handleSendDeleteCode} disabled={deleteSendingCode || !session.user?.email}
                    className="flex-1 px-3 py-1.5 rounded-sm bg-error text-white text-xs disabled:opacity-50">{deleteSendingCode ? '...' : t('sendCode')}</button>
                ) : (
                  <button onClick={handleDeleteAccount} disabled={deleteSaving || deleteCode.length !== 6}
                    className="flex-1 px-3 py-1.5 rounded-sm bg-error text-white text-xs disabled:opacity-50">{deleteSaving ? '...' : t('confirm')}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Unlink Confirmation Modal ── */}
      {unlinkConfirmProvider && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setUnlinkConfirmProvider(null)} />
          <div className="relative bg-card rounded-sm border border-border shadow-lg p-6 w-full max-w-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔗</span>
              <h3 className="text-sm font-semibold text-text-primary">{t('unlink')}</h3>
            </div>
            <p className="text-xs text-text-secondary mb-2">
              {t('unlinkConfirm', { provider: OAUTH_NAMES[unlinkConfirmProvider] || unlinkConfirmProvider })}
            </p>
            {unlinkConfirmProvider === 'github' && (
              <p className="text-[10px] text-text-secondary/50 mb-4">
                {t('githubRevokeNote')}
              </p>
            )}
            {unlinkError && <p className="text-xs text-error mb-3">{unlinkError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setUnlinkConfirmProvider(null)}
                className="flex-1 px-3 py-1.5 rounded-sm border border-border text-xs text-text-secondary hover:bg-accent/5">{t('cancel')}</button>
              <button onClick={handleUnlinkConfirm} disabled={unlinking !== null}
                className="flex-1 px-3 py-1.5 rounded-sm bg-error text-white text-xs disabled:opacity-50">
                {unlinking ? '...' : t('confirmUnlink')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GitHub Manual Revoke Modal ── */}
      {needsManualRevoke && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setNeedsManualRevoke(false)} />
          <div className="relative bg-card rounded-sm border border-border shadow-lg p-6 w-full max-w-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">ℹ️</span>
              <h3 className="text-sm font-semibold text-text-primary">{t('unlink')}</h3>
            </div>
            <p className="text-xs text-text-secondary mb-4">{t('githubManualRevokeDone')}</p>
            <p className="text-[10px] text-text-secondary/50 mb-4">{t('githubManualRevokeNote')}</p>
            <div className="flex gap-2">
              <button onClick={() => setNeedsManualRevoke(false)}
                className="flex-1 px-3 py-1.5 rounded-sm bg-accent text-white text-xs hover:opacity-90">{t('understood')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
          <div className="bg-bg border border-border shadow-lg rounded-sm px-5 py-2.5 text-xs text-text-primary">
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}