import { getTranslations, setRequestLocale } from 'next-intl/server'
import { tools, toolCategories } from 'data/tools'

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

      <div className="mt-10 grid grid-cols-3 gap-4">
        <div className="p-5 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] text-center">
          <p className="text-2xl font-bold text-accent">{tools.length}</p>
          <p className="text-xs text-text-secondary mt-1">{t('statTools')}</p>
        </div>
        <div className="p-5 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] text-center">
          <p className="text-2xl font-bold text-accent">{toolCategories.length}</p>
          <p className="text-xs text-text-secondary mt-1">{t('statCategories')}</p>
        </div>
        <div className="p-5 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] text-center">
          <p className="text-2xl font-bold text-accent">3</p>
          <p className="text-xs text-text-secondary mt-1">{t('statLanguages')}</p>
        </div>
      </div>

      <div className="mt-12 p-6 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)]">
        <h2 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wider">{t('contact')}</h2>
        <div className="space-y-2 text-sm">
          <a href="mailto:chen@aaigc.online" className="block text-accent hover:underline">
            chen@aaigc.online
          </a>
          <a href="https://github.com/CHEN-AI-Lab" target="_blank" rel="noopener noreferrer" className="block text-accent hover:underline">
            GitHub: CHEN-AI-Lab
          </a>
        </div>
      </div>
    </div>
  )
}