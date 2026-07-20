import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { tools, toolCategories } from 'data/tools'

type Props = { params: Promise<{ locale: string }> }

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'about' })

  const toolCount = tools.length
  const catCount = toolCategories.length

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="section-title text-text-primary mb-8">{t('title')}</h1>

      <div className="space-y-8">
        {/* Mission */}
        <div>
          <p className="text-lg text-text-secondary leading-relaxed">{t('desc')}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] text-center">
            <p className="text-2xl font-bold text-accent">{toolCount}</p>
            <p className="text-xs text-text-secondary mt-1">{t('statTools')}</p>
          </div>
          <div className="p-4 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] text-center">
            <p className="text-2xl font-bold text-accent">{catCount}</p>
            <p className="text-xs text-text-secondary mt-1">{t('statCategories')}</p>
          </div>
          <div className="p-4 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] text-center">
            <p className="text-2xl font-bold text-accent">3</p>
            <p className="text-xs text-text-secondary mt-1">{t('statLanguages')}</p>
          </div>
        </div>

        {/* What we offer */}
        <div>
          <h2 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">{t('offerTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {toolCategories.map(cat => {
              const count = tools.filter(t => t.category === cat.id).length
              return (
                <Link key={cat.id} href="/tools"
                  className="p-4 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] hover:shadow-warm-sm transition-shadow">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{cat.icon}</span>
                    <span className="text-sm font-medium text-text-primary">{t(`${cat.id}Cat`)}</span>
                  </div>
                  <p className="text-xs text-text-secondary">{count} {t('toolsCount')}</p>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Contact */}
        <div className="p-6 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)]">
          <h2 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">{t('contact')}</h2>
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
    </div>
  )
}