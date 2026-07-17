import { getTranslations, setRequestLocale } from 'next-intl/server'
import { products } from 'data/products'

type Props = { params: Promise<{ locale: string }> }

export default async function ProductsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'products' })
  const tc = await getTranslations({ locale, namespace: 'common' })

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="section-title text-text-primary mb-2">{t('title')}</h1>
      <p className="text-text-secondary mb-10">{t('subtitle')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {products.map((p) => (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-surface rounded-sm p-8 shadow-warm-sm hover:shadow-warm transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="text-5xl">{p.icon}</div>
              <div className="flex-1">
                <h2 className="card-title text-text-primary mb-2">{locale === 'en' ? p.nameEn : p.name}</h2>
                <p className="text-sm text-text-secondary mb-4">
                  {locale === 'en' ? p.descriptionEn : p.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {p.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-1 bg-bg text-text-secondary rounded-sm border border-[rgba(127,99,21,0.1)]">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-sm font-medium ${
                    p.status === 'live' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {p.status === 'live' ? tc('live') : tc('inDevelopment')}
                  </span>
                  <span className="text-sm text-accent font-medium">{t('visit')} →</span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}