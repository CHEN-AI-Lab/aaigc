import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { products } from 'data/products'

type Props = { params: Promise<{ locale: string; slug: string }> }

export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = []
  for (const p of products) {
    params.push({ locale: 'zh-CN', slug: p.id })
    params.push({ locale: 'en', slug: p.id })
  }
  return params
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'products' })
  const tc = await getTranslations({ locale, namespace: 'common' })

  const product = products.find((p) => p.id === slug)
  if (!product) notFound()

  const name = t(`${slug}.name`)
  const desc = t(`${slug}.description`)
  const productData = t.raw(slug) as Record<string, unknown> | undefined
  const features = productData?.features as string[] | undefined
  const isLive = product.status === 'live'

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-8">
        <a href={`/${locale}/products`} className="text-sm text-text-secondary hover:text-accent transition-colors">
          ← {t('title')}
        </a>
      </div>

      <div className="bg-surface rounded-lg p-8 shadow-warm-sm">
        <div className="flex items-start gap-6 mb-6">
          <div className="text-6xl shrink-0">{product.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-semibold text-text-primary">{name}</h1>
              <span className={`shrink-0 text-xs px-2.5 py-0.5 rounded-lg font-medium ${
                isLive ? 'bg-green-500 text-white' : 'bg-surface text-text-secondary'
              }`}>
                {isLive ? tc('live') : tc('comingSoon')}
              </span>
            </div>
            {desc && <p className="text-text-secondary leading-relaxed">{desc}</p>}
          </div>
        </div>

        {features && features.length > 0 && (
          <div className="mt-10 mb-10">
            <h2 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">{t('features')}</h2>
            <ul className="space-y-2.5">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-text-secondary/80">
                  <span className="text-accent shrink-0 mt-0.5">✦</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isLive && product.url && (
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full px-6 py-3.5 bg-accent text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            {t('visit')} →
          </a>
        )}
      </div>
    </div>
  )
}