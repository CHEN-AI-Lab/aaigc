'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import Link from 'next/link'

export default function RegisterClient() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const router = useRouter()

  // Step 1: Email verification
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [codeVerified, setCodeVerified] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Step 2: User info
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [countdown])

  const handleSendCode = async () => {
    setError('')
    if (!email) {
      setError(t('fillRequired'))
      return
    }

    setLoading('send')
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || t('sendFailed'))
        return
      }
      setCodeSent(true)
      setCountdown(60)
    } catch {
      setError(t('sendFailed'))
    } finally {
      setLoading(null)
    }
  }

  const handleVerifyCode = async () => {
    setError('')
    if (!code) {
      setError(t('fillRequired'))
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
        setError(data.error || t('verifyFailed'))
        return
      }
      setCodeVerified(true)
    } catch {
      setError(t('verifyFailed'))
    } finally {
      setLoading(null)
    }
  }

  const handleRegister = async () => {
    setError('')

    if (!name || !password || !confirmPassword) {
      setError(t('fillRequired'))
      return
    }

    if (password.length < 8) {
      setError(t('passwordTooShort'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'))
      return
    }

    setLoading('register')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, code }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || t('registerFailed'))
        return
      }

      router.push(`/${locale}/login?registered=true&email=${encodeURIComponent(email)}`)
    } catch {
      setError(t('registerFailed'))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[rgba(127,99,21,0.08)] p-8">
          <div className="flex justify-center mb-6">
            <img src="/icon.svg" alt="AAIGC" className="w-10 h-10" />
          </div>

          <h1 className="text-xl font-semibold text-text-primary text-center mb-8">
            {t('register')}
          </h1>

          {!codeVerified ? (
            /* Step 1: Email verification */
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
                  disabled={codeSent}
                  className="w-full px-3.5 py-2.5 rounded-md border border-[rgba(127,99,21,0.15)] text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50 transition-colors disabled:opacity-50"
                />
              </div>

              {!codeSent ? (
                <button
                  onClick={handleSendCode}
                  disabled={loading === 'send'}
                  className="w-full px-4 py-2.5 rounded-md bg-[#1f1f1f] text-white text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
                >
                  {loading === 'send' ? '...' : t('sendCode')}
                </button>
              ) : (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                      {t('verificationCode')}
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-3.5 py-2.5 rounded-md border border-[rgba(127,99,21,0.15)] text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50 transition-colors text-center tracking-[8px]"
                    />
                  </div>

                  <button
                    onClick={handleVerifyCode}
                    disabled={loading === 'verify'}
                    className="w-full px-4 py-2.5 rounded-md bg-[#1f1f1f] text-white text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
                  >
                    {loading === 'verify' ? '...' : t('verifyCode')}
                  </button>

                  <button
                    onClick={handleSendCode}
                    disabled={countdown > 0 || loading === 'send'}
                    className="w-full text-center text-xs text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                  >
                    {countdown > 0 ? `${countdown}s` : t('resendCode')}
                  </button>
                </div>
              )}

              {error && <p className="text-xs text-red-500 text-center">{error}</p>}
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
                  className="w-full px-3.5 py-2.5 rounded-md border border-[rgba(127,99,21,0.15)] text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  {t('password')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-md border border-[rgba(127,99,21,0.15)] text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  {t('confirmPassword')}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-md border border-[rgba(127,99,21,0.15)] text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>

              {error && <p className="text-xs text-red-500 text-center">{error}</p>}

              <button
                onClick={handleRegister}
                disabled={loading === 'register'}
                className="w-full px-4 py-2.5 rounded-md bg-[#1f1f1f] text-white text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
              >
                {loading === 'register' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    ...
                  </span>
                ) : t('registerButton')}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-text-secondary mt-6">
          {t('hasAccount')}{' '}
          <Link href={`/${locale}/login`} className="text-text-primary font-medium hover:underline">
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  )
}