import { CONTACT_EMAIL } from 'shared/constants'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'

type Props = { params: Promise<{ locale: string }> }

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'terms' })

  const items = (key: string) => {
    try { return t.raw(key) as string[] } catch { return [] }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold text-text-primary mb-2">{t('title')}</h1>
      <p className="text-xs text-text-secondary mb-8">{t('lastUpdated')}</p>

      <div className="text-sm text-text-secondary leading-relaxed space-y-6">
        <p>{t('intro')}</p>

        <section>
          <h2 className="text-base font-medium text-text-primary mb-2">{t('use')}</h2>
          <p>{t('useDesc')}</p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text-primary mb-2">{t('accounts')}</h2>
          <p>{t('accountsDesc')}</p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text-primary mb-2">{t('oauth')}</h2>
          <p>{t('oauthDesc')}</p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text-primary mb-2">{t('tools')}</h2>
          <p>{t('toolsDesc')}</p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text-primary mb-2">{t('prohibited')}</h2>
          <p className="mb-2">{t('prohibitedDesc')}</p>
          <ul className="list-disc pl-5 space-y-1">
            {(items('prohibitedItems') as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-text-primary mb-2">{t('liability')}</h2>
          <p>{t('liabilityDesc')}</p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text-primary mb-2">{t('changes')}</h2>
          <p>{t('changesDesc')}</p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text-primary mb-2">{t('contact')}</h2>
          <p>
            {t('contactDesc')}{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">{CONTACT_EMAIL}</a>
          </p>
        </section>
      </div>
    </div>
  )
}