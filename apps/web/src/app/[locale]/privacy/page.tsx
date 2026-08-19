import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'

type Props = { params: Promise<{ locale: string }> }

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'privacy' })

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
          <h2 className="text-base font-medium text-text-primary mb-2">{t('dataCollect')}</h2>
          <p className="mb-2">{t('dataCollectDesc')}</p>
          <ul className="list-disc pl-5 space-y-1">
            {(items('dataCollectItems') as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-text-primary mb-2">{t('dataUse')}</h2>
          <p className="mb-2">{t('dataUseDesc')}</p>
          <ul className="list-disc pl-5 space-y-1">
            {(items('dataUseItems') as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-text-primary mb-2">{t('dataStorage')}</h2>
          <p>{t('dataStorageDesc')}</p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text-primary mb-2">{t('dataRetention')}</h2>
          <p>{t('dataRetentionDesc')}</p>
        </section>

        {/* <section>
          <h2 className="text-base font-medium text-text-primary mb-2">{t('thirdParty')}</h2>
          <p className="mb-2">{t('thirdPartyDesc')}</p>
          <ul className="list-disc pl-5 space-y-1">
            {(items('thirdPartyItems') as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section> */}

        <section>
          <h2 className="text-base font-medium text-text-primary mb-2">{t('cookies')}</h2>
          <p>{t('cookiesDesc')}</p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text-primary mb-2">{t('rights')}</h2>
          <p className="mb-2">{t('rightsDesc')}</p>
          <ul className="list-disc pl-5 space-y-1">
            {(items('rightsItems') as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        {/* <section>
          <h2 className="text-base font-medium text-text-primary mb-2">{t('gdpr')}</h2>
          <p>{t('gdprDesc')}</p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text-primary mb-2">{t('ccpa')}</h2>
          <p>{t('ccpaDesc')}</p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text-primary mb-2">{t('pip')}</h2>
          <p>{t('pipDesc')}</p>
        </section> */}

        <section>
          <h2 className="text-base font-medium text-text-primary mb-2">{t('contact')}</h2>
          <p>{t('contactDesc')}</p>
        </section>
      </div>
    </div>
  )
}