'use client'

import { useTranslations } from 'next-intl'
import { useSession } from '@/auth-client'
import { Link } from '@/i18n/navigation'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeSwitcher from './ThemeSwitcher'

export default function Header() {
  const t = useTranslations('common')
  const authT = useTranslations('auth')
  const { data: session } = useSession()

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
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
          {session?.user ? (
            <Link href="/account" className="text-xs sm:text-sm text-text-secondary hover:text-accent transition-colors sm:ml-3">
              {authT('account')}
            </Link>
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