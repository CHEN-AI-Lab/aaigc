import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { tools, toolCategories } from 'data/tools'

type Props = { params: Promise<{ locale: string }> }

export default async function ToolsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'tools' })
  const tt = await getTranslations({ locale, namespace: 'tool' })

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="section-title text-text-primary mb-2">{t('title')}</h1>
      <p className="text-text-secondary mb-10">{t('subtitle')}</p>

      {toolCategories.map((cat) => {
        const catTools = tools.filter((tool) => tool.category === cat.id)
        if (catTools.length === 0) return null
        return (
          <div key={cat.id} className="mb-12">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary mb-4">
              <span>{cat.icon}</span>
              <span>{locale === 'en' ? cat.nameEn : cat.name}</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {catTools.map((tool) => (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.id}`}
                  className="block bg-surface rounded-sm p-4 shadow-warm-sm hover:shadow-warm transition-shadow border border-[rgba(127,99,21,0.05)]"
                >
                  <div className="text-xs font-mono text-accent mb-2">{tool.icon}</div>
                  <h3 className="text-sm font-medium text-text-primary">{locale === 'en' ? tool.nameEn : tool.name}</h3>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                    {locale === 'en' ? tool.descriptionEn : tool.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}