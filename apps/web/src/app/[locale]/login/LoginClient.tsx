'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useRouter } from '@/i18n/navigation'
import Link from 'next/link'

export default function LoginClient() {
  const t = useTranslations('auth')
  const err = useTranslations('errors')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')

  const [email, setEmail] = useState(registered ? (searchParams.get('email') || '') : '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState(registered ? t('registerSuccess') : '')
  const [loading, setLoading] = useState<string | null>(null)
  const [oauthProvider, setOauthProvider] = useState<string | null>(null)

  // Forgot password state
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotCode, setForgotCode] = useState('')
  const [forgotCodeSent, setForgotCodeSent] = useState(false)
  const [forgotCodeVerified, setForgotCodeVerified] = useState(false)
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')
  const [forgotCountdown, setForgotCountdown] = useState(0)
  const forgotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handlePasswordLogin = async () => {
    setError('')
    setSuccessMsg('')
    if (!email || !password) {
      setError(t('fillRequired'))
      return
    }

    // Check if account is locked
    setLoading('password')
    try {
      const lockRes = await fetch(`/api/auth/check-lockout?email=${encodeURIComponent(email)}`)
      const lockData = await lockRes.json()
      if (lockData.locked) {
        setError(err('accountLocked').replace('{minutes}', String(lockData.minutesRemaining)))
        setLoading(null)
        return
      }
    } catch {
      // ignore lock check failure, proceed with login
    }

    try {
      const result = await signIn('password', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // Check remaining attempts
        try {
          const lockRes = await fetch(`/api/auth/check-lockout?email=${encodeURIComponent(email)}`)
          const lockData = await lockRes.json()
          if (lockData.locked) {
            setError(err('accountLocked').replace('{minutes}', String(lockData.minutesRemaining)))
          } else if (lockData.remaining < 3) {
            setError(`${t('loginFailed')} ${err('attemptsRemaining').replace('{count}', String(lockData.remaining))}`)
          } else {
            setError(t('loginFailed'))
          }
        } catch {
          setError(t('loginFailed'))
        }
      } else {
        router.push('/')
      }
    } catch {
      setError(t('loginFailed'))
    } finally {
      setLoading(null)
    }
  }

  const handleOAuth = async (provider: string) => {
    setOauthProvider(provider)
    setError('')
    setSuccessMsg('')
    try {
      await signIn(provider, { callbackUrl: `/${locale}` })
    } catch {
      setError(t('oauthNotConfigured'))
      setOauthProvider(null)
    }
  }

  // Forgot password handlers
  useEffect(() => {
    if (forgotCountdown > 0) {
      forgotTimerRef.current = setTimeout(() => setForgotCountdown(forgotCountdown - 1), 1000)
    }
    return () => { if (forgotTimerRef.current) clearTimeout(forgotTimerRef.current) }
  }, [forgotCountdown])

  const handleForgotSendCode = async () => {
    setError('')
    if (!forgotEmail) {
      setError(t('fillRequired'))
      return
    }
    setLoading('forgotSend')
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, purpose: 'forgotPassword' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ? err(data.error) : t('sendFailed'))
        return
      }
      setForgotCodeSent(true)
      setForgotCountdown(60)
    } catch {
      setError(t('sendFailed'))
    } finally {
      setLoading(null)
    }
  }

  const handleForgotVerifyCode = async () => {
    setError('')
    if (!forgotCode) {
      setError(t('fillRequired'))
      return
    }
    setLoading('forgotVerify')
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, code: forgotCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ? err(data.error) : t('verifyFailed'))
        return
      }
      setForgotCodeVerified(true)
    } catch {
      setError(t('verifyFailed'))
    } finally {
      setLoading(null)
    }
  }

  const handleForgotResetPassword = async () => {
    setError('')
    if (!forgotNewPassword || !forgotConfirmPassword) {
      setError(t('fillRequired'))
      return
    }
    if (forgotNewPassword.length < 8) {
      setError(t('passwordTooShort'))
      return
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setError(t('passwordMismatch'))
      return
    }
    setLoading('forgotReset')
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, password: forgotNewPassword, code: forgotCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ? err(data.error) : t('registerFailed'))
        return
      }
      setSuccessMsg(t('passwordResetSuccess'))
      setForgotMode(false)
      setForgotCodeSent(false)
      setForgotCodeVerified(false)
      setForgotNewPassword('')
      setForgotConfirmPassword('')
      setForgotCode('')
      setEmail(forgotEmail)
    } catch {
      setError(t('registerFailed'))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src="/icon.svg" alt="AAIGC" className="w-10 h-10" />
          </div>

          <h1 className="text-xl font-semibold text-text-primary text-center mb-8">
            {t('login')}
          </h1>

          {/* Success message */}
          {successMsg && (
            <div className="mb-6 p-3 rounded-md bg-green-50 border border-green-200">
              <p className="text-xs text-green-700 text-center">{successMsg}</p>
            </div>
          )}

          {/* OAuth buttons */}
          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={() => handleOAuth('google')}
              disabled={!!loading || !!oauthProvider}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-border text-sm text-text-primary hover:bg-hover transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('loginWithGoogle')}
            </button>
            <button
              onClick={() => handleOAuth('github')}
              disabled={!!loading || !!oauthProvider}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-border text-sm text-text-primary hover:bg-hover transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              {t('loginWithGithub')}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-secondary">{t('or')}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email + Password form */}
          {!forgotMode ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-md border border-border text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-text-secondary">
                    {t('password')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    className="text-xs text-accent hover:underline cursor-pointer"
                  >
                    {t('forgotPassword')}
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-md border border-border text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>

              {error && (
                <p className="text-xs text-error text-center">{error}</p>
              )}

              <button
                onClick={handlePasswordLogin}
                disabled={loading === 'password' || !!oauthProvider}
                className="w-full px-4 py-2.5 rounded-md bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading === 'password' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    ...
                  </span>
                ) : t('loginButton')}
              </button>
            </div>
          ) : (
            /* Forgot Password Form */
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-text-primary">{t('forgotPasswordTitle')}</h2>
              <p className="text-xs text-text-secondary">{t('forgotPasswordDesc')}</p>

              {!forgotCodeVerified ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">{t('email')}</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@example.com"
                      disabled={forgotCodeSent}
                      className="w-full px-3.5 py-2.5 rounded-md border border-border text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50 transition-colors disabled:opacity-50"
                    />
                  </div>

                  {!forgotCodeSent ? (
                    <button
                      onClick={handleForgotSendCode}
                      disabled={loading === 'forgotSend'}
                      className="w-full px-4 py-2.5 rounded-md bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {loading === 'forgotSend' ? '...' : t('sendCode')}
                    </button>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1.5">{t('verificationCode')}</label>
                        <input
                          type="text"
                          value={forgotCode}
                          onChange={(e) => setForgotCode(e.target.value)}
                          placeholder="000000"
                          maxLength={6}
                          className="w-full px-3.5 py-2.5 rounded-md border border-border text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50 transition-colors text-center tracking-[8px]"
                        />
                      </div>
                      <button
                        onClick={handleForgotVerifyCode}
                        disabled={loading === 'forgotVerify'}
                        className="w-full px-4 py-2.5 rounded-md bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {loading === 'forgotVerify' ? '...' : t('verifyCode')}
                      </button>
                      <button
                        onClick={handleForgotSendCode}
                        disabled={forgotCountdown > 0 || loading === 'forgotSend'}
                        className="w-full text-center text-xs text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                      >
                        {forgotCountdown > 0 ? `${forgotCountdown}s` : t('resendCode')}
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">{t('setNewPassword')}</label>
                    <input
                      type="password"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-md border border-border text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">{t('confirmPassword')}</label>
                    <input
                      type="password"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-md border border-border text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50 transition-colors"
                    />
                  </div>

                  {error && <p className="text-xs text-error text-center">{error}</p>}

                  <button
                    onClick={handleForgotResetPassword}
                    disabled={loading === 'forgotReset'}
                    className="w-full px-4 py-2.5 rounded-md bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading === 'forgotReset' ? '...' : t('resetPasswordBtn')}
                  </button>
                </>
              )}

              {error && !forgotCodeVerified && <p className="text-xs text-error text-center">{error}</p>}

              <button
                type="button"
                onClick={() => { setForgotMode(false); setForgotCodeSent(false); setForgotCodeVerified(false); setError('') }}
                className="text-xs text-accent hover:underline text-center mt-2"
              >
                {t('backToLogin')}
              </button>
            </div>
          )}
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-text-secondary mt-6">
          {t('noAccount')}{' '}
          <Link href={`/${locale}/register`} className="text-text-primary font-medium hover:underline">
            {t('register')}
          </Link>
        </p>
        <p className="text-center text-xs text-text-secondary mt-4 leading-relaxed">
          {t('continueAgree')}{' '}
          <Link href={`/${locale}/terms`} className="text-accent hover:underline">{t('termsOfService')}</Link>{' '}
          {t('and')}{' '}
          <Link href={`/${locale}/privacy`} className="text-accent hover:underline">{t('privacyPolicy')}</Link>
        </p>
      </div>
    </div>
  )
}