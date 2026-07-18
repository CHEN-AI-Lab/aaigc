import { getTranslations, setRequestLocale } from 'next-intl/server'

type Props = { params: Promise<{ locale: string }> }

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'privacy' })

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="section-title text-text-primary mb-6">{t('title')}</h1>
      <div className="text-sm text-text-secondary leading-relaxed space-y-4">
        <p>{t('desc')}</p>
        <p>{t('contact')}</p>
      </div>
    </div>
  )
}