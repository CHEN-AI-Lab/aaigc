'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeSwitcher from './ThemeSwitcher'

export default function Header() {
  const t = useTranslations('common')

  return (
    <header className="border-b border-[rgba(127,99,21,0.1)] bg-bg/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center px-6 h-16">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/icon.svg" alt="AAIGC" className="w-7 h-7" />
          <span className="text-lg font-semibold text-text-primary">{t('appName')}</span>
        </Link>
        <nav className="flex items-center gap-6 flex-1 justify-center">
          <Link href="/products" className="text-sm text-text-secondary hover:text-accent transition-colors">
            {t('products')}
          </Link>
          <Link href="/tools" className="text-sm text-text-secondary hover:text-accent transition-colors">
            {t('tools')}
          </Link>
          <Link href="/about" className="text-sm text-text-secondary hover:text-accent transition-colors">
            {t('about')}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}