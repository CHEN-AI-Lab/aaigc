'use client'
import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from '@/auth-client'
import { signOut } from 'next-auth/react'
import { Link } from '@/i18n/navigation'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeSwitcher from './ThemeSwitcher'

export default function Header() {
  const t = useTranslations('common')
  const authT = useTranslations('auth')
  const { data: session, status } = useSession()

  const isAuthenticated = status === 'authenticated'
  const isLoading = status === 'loading'
  const isAdmin = isAuthenticated && session?.user?.role === 'admin'
  const [avatarOpen, setAvatarOpen] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭下拉
  useEffect(() => {
    if (!avatarOpen) return
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [avatarOpen])

  // 统计面板地址（环境感知）
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV || 'development'
  const statsUrl = vercelEnv === 'production'
    ? 'https://stats.aaigc.online'
    : 'https://stats-pre.aaigc.online'

  return (
    <header className="border-b border-border bg-bg/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center px-4 sm:px-6 h-16">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/icon.svg" alt="AAIGC" className="w-7 h-7" />
          <span className="text-lg font-semibold text-text-primary hidden sm:inline">{t('appName')}</span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6 flex-1 justify-center">
          <Link href="/products" className="text-xs sm:text-sm text-text-secondary hover:text-accent transition-colors">
            {t('products')}
          </Link>
          <Link href="/tools" className="text-xs sm:text-sm text-text-secondary hover:text-accent transition-colors">
            {t('tools')}
          </Link>
          <Link href="/about" className="hidden md:inline text-sm text-text-secondary hover:text-accent transition-colors">
            {t('about')}
          </Link>
          {isAdmin && (
            <a
              href={statsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm text-text-secondary hover:text-accent transition-colors"
            >
              {t('stats')}
            </a>
          )}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
          {isLoading ? (
            <div className="w-7 h-7 rounded-full sm:ml-3 bg-text-secondary/20 animate-pulse" />
          ) : isAuthenticated ? (
            <div className="relative sm:ml-3" ref={avatarRef}>
              <button
                onClick={() => setAvatarOpen(v => !v)}
                className="flex items-center gap-1.5 group"
                title={session.user.name || session.user.email || ''}>
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover border border-border group-hover:border-accent/30 transition-colors"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-semibold border border-border group-hover:border-accent/30 transition-colors">
                    {(session.user.name || session.user.email || '?')[0].toUpperCase()}
                  </div>
                )}
              </button>
              {avatarOpen && (
                <div className="absolute right-0 mt-2 bg-card border border-border rounded-md shadow-md z-[60] w-max whitespace-nowrap overflow-hidden">
                  <Link href="/account" onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-accent/10 transition-colors">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="21" x2="4" y2="14" />
                      <line x1="4" y1="10" x2="4" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12" y2="3" />
                      <line x1="20" y1="21" x2="20" y2="16" />
                      <line x1="20" y1="12" x2="20" y2="3" />
                      <line x1="1" y1="14" x2="7" y2="14" />
                      <line x1="9" y1="8" x2="15" y2="8" />
                      <line x1="17" y1="16" x2="23" y2="16" />
                    </svg>
                    {authT('settings')}
                  </Link>
                  <button onClick={() => { signOut({ callbackUrl: '/' }) }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-text-secondary hover:text-error hover:bg-error/5 transition-colors">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    {authT('logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="text-xs sm:text-sm text-text-secondary hover:text-accent transition-colors sm:ml-3">
              {authT('login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}