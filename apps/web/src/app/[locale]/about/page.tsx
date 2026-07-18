import { getTranslations, setRequestLocale } from 'next-intl/server'

type Props = { params: Promise<{ locale: string }> }

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'about' })

  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="section-title text-text-primary mb-6">{t('title')}</h1>
      <div className="space-y-4 text-text-secondary leading-relaxed">
        <p className="text-lg">{t('description')}</p>
        <p>{t('description2')}</p>
      </div>

      <div className="mt-12 p-6 bg-surface rounded-sm shadow-warm-sm">
        <h2 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wider">{t('contact')}</h2>
        <div className="space-y-2 text-sm">
          <a href="mailto:admin@aaigc.online" className="block text-accent hover:underline">
            admin@aaigc.online
          </a>
          <a href="https://github.com/CHEN-AI-Lab" target="_blank" rel="noopener noreferrer" className="block text-accent hover:underline">
            {t('github')}: CHEN-AI-Lab
          </a>
        </div>
      </div>
    </div>
  )
}