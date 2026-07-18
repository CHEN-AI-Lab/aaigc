import { getTranslations, setRequestLocale } from 'next-intl/server'

type Props = { params: Promise<{ locale: string }> }

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'privacy' })

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="section-title text-text-primary mb-8">{t('title')}</h1>
      <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">{t('infoTitle')}</h2>
          <p>{t('infoDesc')}</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">{t('cookiesTitle')}</h2>
          <p>{t('cookiesDesc')}</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">{t('thirdTitle')}</h2>
          <p>{t('thirdDesc')}</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">{t('contactTitle')}</h2>
          <p>{t('contactDesc')}</p>
        </section>
      </div>
    </div>
  )
}