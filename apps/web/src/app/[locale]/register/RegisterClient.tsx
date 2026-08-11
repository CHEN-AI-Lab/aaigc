'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { signIn } from 'next-auth/react'
import { useRouter } from '@/i18n/navigation'
import Link from 'next/link'
import PasswordInput from '@/components/PasswordInput'

export default function RegisterClient() {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const tv = useTranslations('validation')
  const err = useTranslations('errors')
  const locale = useLocale()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [codeVerified, setCodeVerified] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [termsError, setTermsError] = useState('')
  const [shaking, setShaking] = useState(false)

  const [error, setError] = useState('')
  const [errorType, setErrorType] = useState<'error' | 'success' | 'info'>('error')
  const [loading, setLoading] = useState<string | null>(null)
  const [oauthProvider, setOauthProvider] = useState<string | null>(null)

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [countdown])

  useEffect(() => {
    if (shaking) {
      const t = setTimeout(() => setShaking(false), 400)
      return () => clearTimeout(t)
    }
  }, [shaking])

  const handleSendCode = async () => {
    setError('')
    setTermsError('')
    if (!agreeTerms) {
      setShaking(true)
      setTermsError(t('agreeTermsRequired'))
      setErrorType('error')
      return
    }
    if (!email) {
      setError(t('fillRequired'))
      setErrorType('error')
      return
    }

    setLoading('send')
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.remainingSeconds) setCountdown(data.remainingSeconds)
        setError(data.error ? err(data.error) : t('sendFailed'))
        setErrorType('error')
        return
      }
      setCodeSent(true)
      setCountdown(120)
    } catch {
      setError(t('sendFailed'))
      setErrorType('error')
    } finally {
      setLoading(null)
    }
  }

  const handleVerifyCode = async () => {
    setError('')
    if (!code) {
      setError(t('fillRequired'))
      setErrorType('error')
      return
    }

    setLoading('verify')
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ? err(data.error) : t('verifyFailed'))
        setErrorType('error')
        return
      }
      setCodeVerified(true)
    } catch {
      setError(t('verifyFailed'))
      setErrorType('error')
    } finally {
      setLoading(null)
    }
  }

  const handleRegister = async () => {
    setError('')

    if (!agreeTerms) {
      setTermsError(t('agreeTermsRequired'))
      setErrorType('error')
      return
    }

    if (!name) {
      setError(t('fillRequired'))
      setErrorType('error')
      return
    }

    if (password && password.length < 8) {
      setError(t('passwordTooShort'))
      setErrorType('error')
      return
    }

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'))
      setErrorType('error')
      return
    }

    setLoading('register')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, code, agreeTerms: true }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ? err(data.error) : t('registerFailed'))
        setErrorType('error')
        return
      }

      router.push(`/${locale}/login?registered=true&email=${encodeURIComponent(email)}`)
    } catch {
      setError(t('registerFailed'))
      setErrorType('error')
    } finally {
      setLoading(null)
    }
  }

  const handleOAuth = async (provider: string) => {
    setOauthProvider(provider)
    setError('')
    try {
      await signIn(provider, { callbackUrl: `/${locale}` })
    } catch {
      setError(t('oauthNotConfigured'))
      setOauthProvider(null)
    }
  }

  const errorColors = {
    error: 'bg-red-50 border border-red-200 text-red-600',
    success: 'bg-green-50 border border-green-200 text-green-700',
    info: 'bg-blue-50 border border-blue-200 text-blue-600',
  }

  return (
    <>
      <style>{`@keyframes shakeX{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}`}</style>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-card rounded-xl shadow-sm border border-border p-8">
            <div className="flex justify-center mb-4">
              <img src="/icon.svg" alt="AAIGC" className="w-10 h-10" />
            </div>

            <h1 className="text-xl font-semibold text-text-primary text-center">
              {t('register')}
            </h1>
            <p className="text-sm text-text-secondary text-center mt-1 mb-8">
              {t('registerSubtitle')}
            </p>

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
                {t('signupWithGoogle')}
              </button>
              <button
                onClick={() => handleOAuth('github')}
                disabled={!!loading || !!oauthProvider}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-border text-sm text-text-primary hover:bg-hover transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                {t('signupWithGithub')}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-secondary">{t('or')}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {!codeVerified ? (
              /* Step 1: Email + Code + Terms */
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {t('email')}
                  </label>
                  <div className="flex gap-2 mt-1.5">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setCodeSent(false) }}
                      placeholder="name@example.com"
                      disabled={codeSent}
                      className="flex-1 px-3.5 py-2.5 rounded-md border border-border text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50 transition-colors disabled:opacity-50"
                    />
                    <button
                      onClick={handleSendCode}
                      disabled={loading === 'send' || countdown > 0 || !email}
                      className="px-4 py-2.5 rounded-md text-sm font-medium bg-hover text-text-primary hover:bg-border disabled:opacity-40 whitespace-nowrap transition-colors"
                    >
                      {countdown > 0 ? `${countdown}${tc('seconds')}` : loading === 'send' ? tc('sending') : t('sendCode')}
                    </button>
                  </div>
                </div>

                {codeSent && (
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                      {t('verificationCode')}
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      placeholder={t('codePlaceholder')}
                      maxLength={6}
                      className="w-full px-3.5 py-2.5 rounded-md border border-border text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50 transition-colors text-center tracking-[8px]"
                    />

                    <button
                      onClick={handleVerifyCode}
                      disabled={loading === 'verify' || !code}
                      className="w-full mt-3 px-4 py-2.5 rounded-md bg-accent text-white text-sm font-medium hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading === 'verify' ? tc('sending') : t('verifyCode')}
                    </button>
                  </div>
                )}

                {/* Terms checkbox */}
                <div className={shaking ? 'animate-shake' : ''}
                     style={{ animation: shaking ? 'shakeX 0.4s ease-in-out' : undefined }}>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => { setAgreeTerms(e.target.checked); setTermsError('') }}
                      className="mt-0.5 w-4 h-4 rounded border-border text-accent focus:ring-accent"
                    />
                    <span className="text-xs text-text-secondary leading-relaxed">
                      {t('agreeTerms')} <Link href={`/${locale}/terms`} className="text-accent hover:underline" target="_blank">{t('termsOfService')}</Link> {t('and')} <Link href={`/${locale}/privacy`} className="text-accent hover:underline" target="_blank">{t('privacyPolicy')}</Link>
                    </span>
                  </label>
                </div>
                {termsError && <p className="text-xs text-error">{termsError}</p>}

                {error && (
                  <div className={`text-xs rounded-md px-3 py-2 text-center ${errorColors[errorType]}`}>
                    {error}
                  </div>
                )}
              </div>
            ) : (
              /* Step 2: User info */
              <div className="flex flex-col gap-4">
                <div className="p-3 rounded-md bg-green-50 border border-green-200 mb-2">
                  <p className="text-xs text-green-700 text-center">{t('emailVerified')}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {t('name')}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('name')}
                    className="w-full px-3.5 py-2.5 rounded-md border border-border text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {t('password')}
                    <span className="text-text-secondary/50 ml-1">({t('optional')})</span>
                  </label>
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-md border border-border text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50 transition-colors bg-card"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {t('confirmPassword')}
                  </label>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-md border border-border text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50 transition-colors bg-card"
                  />
                </div>

                {error && (
                  <div className={`text-xs rounded-md px-3 py-2 text-center ${errorColors[errorType]}`}>
                    {error}
                  </div>
                )}

                <button
                  onClick={handleRegister}
                  disabled={loading === 'register'}
                  className="w-full px-4 py-2.5 rounded-md bg-accent text-white text-sm font-medium hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loading === 'register' ? (
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {tc('sending')}
                    </span>
                  ) : t('registerButton')}
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-text-secondary mt-6">
            {t('continueAgree')}{' '}
            <Link href={`/${locale}/terms`} className="text-accent hover:underline">{t('termsOfService')}</Link>{' '}
            {t('and')}{' '}
            <Link href={`/${locale}/privacy`} className="text-accent hover:underline">{t('privacyPolicy')}</Link>
          </p>

          <p className="text-center text-sm text-text-secondary mt-4">
            {t('hasAccount')}{' '}
            <Link href={`/${locale}/login`} className="text-text-primary font-medium hover:underline">
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}