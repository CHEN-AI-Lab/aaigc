import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export default function LocaleNotFound() {
  const t = useTranslations('errors')

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-6xl mb-6">🚀</div>
        <h1 className="display-hero text-text-primary mb-4">404</h1>
        <p className="text-lg text-text-secondary mb-8">{t('notFound')}</p>
        <p className="text-sm text-text-secondary mb-8">{t('notFoundDesc')}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-dark text-white text-sm font-medium rounded-sm hover:opacity-90 transition-opacity"
        >
          {t('backHome')}
        </Link>
      </div>
    </div>
  )
}