'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useCallback, useEffect, useState, useRef } from 'react'

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

const providerNames: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  credentials: 'Password',
  email: 'Password',
}

export default function AccountClient() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const { data: session, status, update } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)

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
  const [deleteEmail, setDeleteEmail] = useState('')
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
      // 有密码 → 走验证旧密码流程（无需代码）；无密码 → 走邮箱验证码
      if (profile?.hasPassword) {
        // 直接更新密码（check-password 已验证旧密码）
        const bcrypt = await import('bcryptjs')
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(pwdNew, salt)
        const res = await fetch('/api/user/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passwordHash: hash }),
        })
        if (!res.ok) { setPwdError(t('registerFailed')); return }
      } else {
        // 无密码 → 通过 set-password API（需要验证码）
        const sendRes = await fetch('/api/auth/send-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: profile?.email, purpose: 'setPassword', locale }),
        })
        if (!sendRes.ok) { setPwdError(t('sendFailed')); return }
        const data = await sendRes.json()
        const code = data.devCode || (await askForCode())
        if (!code) { setPwdError(t('verifyFailed')); return }
        const setRes = await fetch('/api/auth/set-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: profile?.email, password: pwdNew, code }),
        })
        if (!setRes.ok) {
          const d = await setRes.json()
          setPwdError(t(d.error) || t('registerFailed'))
          return
        }
      }
      setShowPwdForm(false); setPwdOld(''); setPwdNew(''); setPwdConfirm(''); setPwdError('')
      await fetchProfile()
      showToast(t('nameUpdated'))
    } catch { setPwdError(t('registerFailed')) }
    finally { setPwdSaving(false) }
  }

  const askForCode = () => {
    return prompt(t('codePlaceholder'))
  }

  // ── Delete account ──
  const handleSendDeleteCode = async () => {
    setDeleteSendingCode(true); setDeleteError('')
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: deleteEmail, purpose: 'deleteAccount', locale }),
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
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: deleteEmail, code: deleteCode }),
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
      showToast(t('nameUpdated'))
    } catch { showToast(t('registerFailed')) }
  }

  const handleLogout = async () => { await signOut({ callbackUrl: '/' }) }

  // ── Loading / Not logged in ──
  if (status === 'loading') {
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
            <div className="flex items-center gap-2 mb-5">
              <span className="text-sm">👤</span>
              <h2 className="text-sm font-semibold text-text-primary">{t('accountSettings')}</h2>
            </div>

            {/* Avatar + Name */}
            <div className="flex items-center gap-4 mb-5">
              {profile?.image || session.user?.image ? (
                <img src={profile?.image || session.user?.image || ''} alt="" className="w-16 h-16 rounded-full object-cover shrink-0 border-2 border-border" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xl font-semibold shrink-0 border-2 border-border">
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
                      className="flex-1 p-1.5 bg-surface border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30"
                      maxLength={30}
                      autoFocus
                    />
                    <button onClick={handleSaveName} disabled={nameSaving}
                      className="text-xs text-accent hover:underline disabled:opacity-50">{nameSaving ? '...' : t('save')}</button>
                    <button onClick={() => setEditingName(false)}
                      className="text-xs text-text-secondary/50 hover:text-text-secondary">{t('cancel')}</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium text-text-primary">{profile?.name || session.user?.name || t('noName')}</span>
                    <button onClick={() => { setNameInput(profile?.name || session.user?.name || ''); setEditingName(true) }}
                      className="text-xs text-text-secondary/50 hover:text-accent transition-colors">✏️ {t('editName')}</button>
                  </div>
                )}
                <p className="text-xs text-text-secondary/50 mt-0.5">
                  {(profile?.role || session.user?.role || 'user') === 'admin' ? `👑 ${t('admin')}` : `👤 ${t('user')}`}
                  {profile?.createdAt && ` · ${t('memberSince')} ${formatDate(profile.createdAt)}`}
                </p>
              </div>
            </div>

            {/* Info rows */}
            <div className="space-y-0">
              <div className="flex items-center py-2.5 border-t border-border/50">
                <span className="text-xs text-text-secondary w-24 shrink-0">{t('email')}</span>
                <span className="text-xs text-text-primary">
                  {session.user?.email}
                  {profile?.emailVerified
                    ? <span className="text-green-500 ml-1.5">✓ {t('emailVerified')}</span>
                    : <span className="text-text-secondary/50 ml-1.5">({t('emailUnverified')})</span>}
                </span>
              </div>
              {profile && profile.accounts.length > 0 && profile.accounts.map((acc) => (
                <div key={acc.provider} className="flex items-center py-2.5 border-t border-border/50">
                  <span className="text-xs text-text-secondary w-24 shrink-0">{providerNames[acc.provider] || acc.provider}</span>
                  <span className="text-xs text-green-500">✓ {t('connected')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Card 2: Security ── */}
        <div className="bg-card rounded-sm border border-border overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-200" />
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm">🔒</span>
              <h2 className="text-sm font-semibold text-text-primary">{t('accountSettings')}</h2>
            </div>

            <div className="space-y-0">
              <div className="flex items-center py-2.5 border-t border-border/50">
                <span className="text-xs text-text-secondary w-24 shrink-0">{t('passwordLogin')}</span>
                <span className="text-xs text-text-primary flex items-center gap-2 flex-wrap">
                  <span className="text-text-secondary/50">{profile?.hasPassword ? '••••••••' : t('noPassword')}</span>
                  <button onClick={() => { setShowPwdForm(!showPwdForm); setPwdOld(''); setPwdNew(''); setPwdConfirm(''); setPwdError('') }}
                    className="text-accent hover:underline text-xs">
                    {profile?.hasPassword ? t('changePassword') : t('setPassword')}
                  </button>
                  {profile?.hasPassword && (
                    <Link href="/forgot-password" className="text-text-secondary/50 hover:text-text-secondary text-xs">({t('forgotPassword')})</Link>
                  )}
                </span>
              </div>
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
                  {!profile?.hasPassword && (
                    <span className="text-[10px] text-text-secondary/50 self-center ml-1">{t('codeSentTo', { email: profile?.email || '' })}</span>
                  )}
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
              <h2 className="text-sm font-semibold text-text-primary">{t('account')}</h2>
            </div>

            {/* Export */}
            <div className="flex items-center justify-between py-3 border-t border-border/50">
              <div>
                <p className="text-xs text-text-primary font-medium">{t('exportTitle')}</p>
                <p className="text-[10px] text-text-secondary/50 mt-0.5">{t('exportDesc')}</p>
              </div>
              <button onClick={handleExport}
                className="px-3 py-1.5 rounded-sm bg-accent text-white text-xs font-medium hover:opacity-90 transition-opacity shrink-0">
                {t('exportButton')}
              </button>
            </div>

            {/* Delete */}
            <div className="flex items-center justify-between py-3 border-t border-border/50">
              <div>
                <p className="text-xs text-text-primary font-medium">{t('deleteAccount')}</p>
                <p className="text-[10px] text-text-secondary/50 mt-0.5">{t('deleteConfirm')}</p>
              </div>
              <button onClick={() => { setShowDeleteModal(true); setDeleteEmail(''); setDeleteCode(''); setDeleteCodeSent(false); setDeleteError('') }}
                className="px-3 py-1.5 rounded-sm border border-error/30 text-xs text-error hover:bg-error/5 transition-colors shrink-0">
                {t('deleteAccount')}
              </button>
            </div>

            {/* Logout */}
            <div className="pt-3 border-t border-border/50">
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-border text-xs text-text-secondary hover:bg-accent/5 hover:text-error transition-colors">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {t('logout')}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── Delete Account Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-card rounded-sm border border-border shadow-lg p-6 w-full max-w-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🗑️</span>
              <h3 className="text-sm font-semibold text-text-primary">{t('deleteAccount')}</h3>
            </div>
            <p className="text-xs text-text-secondary mb-4">{t('deleteConfirm')}</p>
            <ul className="text-[10px] text-text-secondary/50 mb-4 space-y-1 list-disc ml-4">
              <li>{t('email')} {t('emailUnverified')}</li>
              <li>{t('favorites')}</li>
            </ul>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-text-secondary/50 mb-1 block">{t('email')}</label>
                <input type="email" value={deleteEmail} onChange={e => setDeleteEmail(e.target.value)}
                  className="w-full p-2 bg-surface border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-error/30"
                  placeholder={t('email')} disabled={deleteCodeSent} />
              </div>
              {deleteCodeSent && (
                <div>
                  <label className="text-[10px] text-text-secondary/50 mb-1 block">{t('verificationCode')}</label>
                  <input type="text" maxLength={6} value={deleteCode} onChange={e => setDeleteCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-2 bg-surface border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-error/30 text-center tracking-widest"
                    placeholder={t('codePlaceholder')} />
                </div>
              )}
              {deleteError && <p className="text-xs text-error">{deleteError}</p>}
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-3 py-1.5 rounded-sm border border-border text-xs text-text-secondary hover:bg-accent/5">{t('cancel')}</button>
                {!deleteCodeSent ? (
                  <button onClick={handleSendDeleteCode} disabled={deleteSendingCode || !deleteEmail}
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