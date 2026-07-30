import { getTranslations, setRequestLocale } from 'next-intl/server'

type Props = { params: Promise<{ locale: string }> }

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'about' })

  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="section-title text-text-primary mb-10">{t('title')}</h1>

      <div className="space-y-6 text-text-secondary leading-relaxed">
        <p className="text-lg">{t('desc')}</p>
        <p>{t('desc2')}</p>
      </div>

      <div className="mt-16 p-6 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)]">
        <h2 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wider">{t('contact')}</h2>
        <div className="space-y-2 text-sm">
          <a href="mailto:chen@aaigc.online" className="block text-accent hover:underline">
            chen@aaigc.online
          </a>
        </div>
      </div>
    </div>
  )
}