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
  const [pwdStep, setPwdStep] = useState<'form' | 'code'>('form')
  const [pwdCode, setPwdCode] = useState('')
  const [pwdOld, setPwdOld] = useState('')
  const [pwdNew, setPwdNew] = useState('')
  const [pwdConfirm, setPwdConfirm] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdError, setPwdError] = useState('')

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

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
    setNameSaving(true); setNameError('')
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) { setEditingName(false); await fetchProfile() }
      else { const data = await res.json(); setNameError(t(data.error) || t('registerFailed')) }
    } catch { setNameError(t('registerFailed')) }
    finally { setNameSaving(false) }
  }

  const handleChangePassword = async () => {
    if (!pwdNew) { setPwdError(t('fillRequired')); return }
    if (pwdNew.length < 8) { setPwdError(t('passwordTooShort')); return }
    // 密码强度验证（前端先拦截，避免走到发验证码后才报错）
    let types = 0
    if (/[a-z]/.test(pwdNew)) types++
    if (/[A-Z]/.test(pwdNew)) types++
    if (/[0-9]/.test(pwdNew)) types++
    if (/[^a-zA-Z0-9]/.test(pwdNew)) types++
    if (types < 2) { setPwdError(t('passwordNeedsTypes')); return }
    const COMMON = ['password1','password123','qwerty123','qwerty1','trustno1','abc12345','1234qwer','1q2w3e4r','passw0rd','admin123','12345678','87654321','11111111','00000000','aaaaaaaa']
    if (COMMON.includes(pwdNew.toLowerCase())) { setPwdError(t('passwordCommon')); return }
    if (pwdNew !== pwdConfirm) { setPwdError(t('passwordMismatch')); return }
    setPwdSaving(true); setPwdError('')
    try {
      // Step 1 — verify old password (only for users who already have one)
      if (profile?.hasPassword) {
        if (!pwdOld) { setPwdError(t('fillRequired')); setPwdSaving(false); return }
        const checkRes = await fetch('/api/auth/check-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: profile?.email, password: pwdOld }),
        })
        if (!checkRes.ok) { setPwdError(t('currentPasswordWrong')); setPwdSaving(false); return }
      }
      // Step 2 — send verification code
      const sendRes = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile?.email, purpose: 'changePassword', locale }),
      })
      if (!sendRes.ok) { setPwdError(t('sendFailed')); setPwdSaving(false); return }
      // Step 3 — show code input; user types code, then set-password is called
      setPwdStep('code')
    } catch { setPwdError(t('registerFailed')) }
    finally { setPwdSaving(false) }
  }

  const handleSubmitNewPassword = async () => {
    if (!pwdCode) { setPwdError(t('fillRequired')); return }
    setPwdSaving(true); setPwdError('')
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile?.email, password: pwdNew, code: pwdCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        // 翻译后端返回的错误码，支持 passwordNeedsTypes / passwordCommon / passwordTooShort 等
        const errMsg = data.error
          ? (t(data.error) || data.error)
          : t('registerFailed')
        setPwdError(errMsg)
        setPwdSaving(false)
        return
      }
      // Success — close dialog, reset
      setPwdOld(''); setPwdNew(''); setPwdConfirm(''); setPwdCode(''); setPwdStep('form'); setChangingPwd(false)
      await fetchProfile()
    } catch { setPwdError(t('registerFailed')) }
    finally { setPwdSaving(false) }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true); setDeleteError('')
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' })
      if (res.ok) {
        await signOut({ callbackUrl: '/' })
      } else {
        const data = await res.json()
        setDeleteError(t(data.error) || t('registerFailed'))
      }
    } catch { setDeleteError(t('registerFailed')) }
    finally { setDeleting(false) }
  }

  const handleLogout = async () => { await signOut({ callbackUrl: '/' }) }

  if (status === 'loading') {
    return (
      <div className="min-h-[calc(100vh-200px)] px-4 py-10">
        <div className="max-w-2xl mx-auto animate-pulse space-y-6">
          <div className="bg-card rounded-sm border border-border p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-surface" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-surface rounded" />
                <div className="h-3 w-48 bg-surface rounded" />
              </div>
            </div>
          </div>
          <div className="h-24 bg-card rounded-sm border border-border" />
          <div className="h-24 bg-card rounded-sm border border-border" />
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
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Profile Section ── */}
        <div className="bg-card rounded-sm border border-border p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-5">{t('accountSettings')}</h2>
          <div className="flex items-center gap-5 mb-5">
            {session.user?.image ? (
              <img src={session.user.image} alt="" className="w-16 h-16 rounded-full object-cover shrink-0 border-2 border-border" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xl font-semibold shrink-0 border-2 border-border">
                {(profile?.name || session.user?.name || session.user?.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-lg font-medium text-text-primary">{profile?.name || session.user?.name || t('noName')}</p>
                <button onClick={() => { setNewName(session.user?.name || profile?.name || ''); setEditingName(true) }}
                  className="text-xs text-text-secondary/50 hover:text-accent transition-colors">✏️ {t('editName')}</button>
              </div>
            </div>
          </div>
          <div className="space-y-0">
            <div className="grid grid-cols-[100px_1fr] items-center py-3 border-t border-border/50">
              <span className="text-xs text-text-secondary">{t('email')}</span>
              <span className="text-xs text-text-primary">
                {session.user?.email}
                {profile?.emailVerified
                  ? <span className="text-green-500 ml-1.5">✓ {t('emailVerified')}</span>
                  : <span className="text-text-secondary/50 ml-1.5">({t('emailUnverified')})</span>}
              </span>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center py-3 border-t border-border/50">
              <span className="text-xs text-text-secondary">{t('role')}</span>
              <span className="text-xs text-text-primary">
                {(profile?.role || session.user?.role || 'user') === 'admin' ? `👑 ${t('admin')}` : `👤 ${t('user')}`}
              </span>
            </div>
            {profile?.createdAt && (
              <div className="grid grid-cols-[100px_1fr] items-center py-3 border-t border-border/50">
                <span className="text-xs text-text-secondary">{t('memberSince')}</span>
                <span className="text-xs text-text-primary">{formatDate(profile.createdAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Login Methods Section ── */}
        <div className="bg-card rounded-sm border border-border p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-1">🔑 {t('accountSettings')}</h2>
          <div className="space-y-0 mt-3">
            {profile && profile.accounts.length > 0 && profile.accounts.map((acc) => (
              <div key={acc.provider} className="grid grid-cols-[100px_1fr] items-center py-3 border-t border-border/50">
                <span className="text-xs text-text-secondary">{providerNames[acc.provider] || acc.provider}</span>
                <span className="text-xs text-green-500">✓ {t('connected')}</span>
              </div>
            ))}
            {profile && (
              <div className="grid grid-cols-[100px_1fr] items-center py-3 border-t border-border/50">
                <span className="text-xs text-text-secondary">{t('passwordLogin')}</span>
                <span className="text-xs text-text-primary flex items-center gap-2">
                  <span className="text-text-secondary/50">••••••••</span>
                  <button onClick={() => { setPwdOld(''); setPwdNew(''); setPwdConfirm(''); setPwdCode(''); setPwdStep('form'); setPwdError(''); setChangingPwd(true) }}
                    className="text-accent hover:underline text-xs">
                    {profile.hasPassword ? t('changePassword') : t('setPassword')}
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Account Actions Section ── */}
        <div className="bg-card rounded-sm border border-border p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-1">⚙️ {t('account')}</h2>
          <div className="space-y-0 mt-3">
            <div className="flex items-center justify-between py-3 border-t border-border/50">
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 rounded-sm border border-border text-xs text-text-secondary hover:bg-accent/5 hover:text-error transition-colors">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {t('logout')}
              </button>
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)}
                  className="px-4 py-2 rounded-sm border border-error/30 text-xs text-error hover:bg-error/5 transition-colors">
                  {t('deleteAccount')}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-error">{t('deleteConfirm')}</span>
                  <button onClick={handleDeleteAccount} disabled={deleting}
                    className="px-3 py-1.5 rounded-sm bg-error text-white text-xs disabled:opacity-50">{deleting ? '...' : t('confirm')}</button>
                  <button onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 rounded-sm border border-border text-xs text-text-secondary hover:bg-accent/5 transition-colors">{t('cancel')}</button>
                </div>
              )}
            </div>
            {deleteError && <p className="text-xs text-error mt-2">{deleteError}</p>}
          </div>
        </div>
      </div>

      {/* ── Edit Name Dialog ── */}
      {editingName && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setEditingName(false)} />
          <div className="relative bg-card rounded-sm border border-border shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-text-primary mb-4">{t('editName')}</h3>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
              className="w-full p-2 bg-surface border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30 mb-3" placeholder={t('name')} />
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
          <div className="absolute inset-0 bg-black/30" onClick={() => { setChangingPwd(false); setPwdStep('form') }} />
          <div className="relative bg-card rounded-sm border border-border shadow-lg p-6 w-full max-w-sm">
            {pwdStep === 'form' ? (
              <>
                <h3 className="text-sm font-semibold text-text-primary mb-4">{profile?.hasPassword ? t('changePassword') : t('setPassword')}</h3>
                {profile?.hasPassword && (
                  <input type="password" value={pwdOld} onChange={e => setPwdOld(e.target.value)}
                    className="w-full p-2 bg-surface border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30 mb-2" placeholder={t('currentPassword')} />
                )}
                <input type="password" value={pwdNew} onChange={e => setPwdNew(e.target.value)}
                  className="w-full p-2 bg-surface border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30 mb-2" placeholder={t('newPassword')} />
                <p className="text-[10px] text-text-secondary/50 -mt-1 mb-2">{t('passwordHint')}</p>
                <input type="password" value={pwdConfirm} onChange={e => setPwdConfirm(e.target.value)}
                  className="w-full p-2 bg-surface border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30 mb-3" placeholder={t('confirmPassword')} />
                {pwdError && <p className="text-xs text-error mb-3">{pwdError}</p>}
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setChangingPwd(false); setPwdStep('form') }}
                    className="px-3 py-1.5 rounded-sm border border-border text-xs text-text-secondary hover:bg-accent/5 transition-colors">{t('cancel')}</button>
                  <button onClick={handleChangePassword} disabled={pwdSaving}
                    className="px-3 py-1.5 rounded-sm bg-accent text-white text-xs disabled:opacity-50">{pwdSaving ? '...' : t('sendCode')}</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-text-primary mb-2">{t('verificationCode')}</h3>
                <p className="text-xs text-text-secondary mb-4">{t('codeSentTo', { email: profile?.email || '' })}</p>
                <input type="text" value={pwdCode} onChange={e => setPwdCode(e.target.value)}
                  className="w-full p-2 bg-surface border border-border rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30 mb-3 text-center tracking-widest" placeholder={t('codePlaceholder')} maxLength={6} />
                {pwdError && <p className="text-xs text-error mb-3">{pwdError}</p>}
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setChangingPwd(false); setPwdStep('form') }}
                    className="px-3 py-1.5 rounded-sm border border-border text-xs text-text-secondary hover:bg-accent/5 transition-colors">{t('cancel')}</button>
                  <button onClick={handleSubmitNewPassword} disabled={pwdSaving}
                    className="px-3 py-1.5 rounded-sm bg-accent text-white text-xs disabled:opacity-50">{pwdSaving ? '...' : t('verifyCode')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}