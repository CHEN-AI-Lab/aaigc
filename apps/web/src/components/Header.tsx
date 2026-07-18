'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import LanguageSwitcher from './LanguageSwitcher'

export default function Header() {
  const t = useTranslations('common')

  return (
    <header className="border-b border-[rgba(127,99,21,0.1)] bg-bg/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center gap-8 px-6 h-16">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🚀</span>
          <span className="text-lg font-semibold text-text-primary">{t('appName')}</span>
        </Link>
        <nav className="flex items-center gap-6 ml-auto">
          <Link href="/products" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            {t('products')}
          </Link>
          <Link href="/tools" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            {t('tools')}
          </Link>
          <Link href="/about" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            {t('about')}
          </Link>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  )
}