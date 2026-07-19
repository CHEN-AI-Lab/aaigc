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

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-8">
        <a href={`/${locale}/products`} className="text-sm text-text-secondary hover:text-accent transition-colors">
          ← {t('title')}
        </a>
      </div>

      <div className="bg-surface rounded-sm p-8 shadow-warm-sm">
        <div className="flex items-start gap-6 mb-8">
          <div className="text-6xl">{product.icon}</div>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold text-text-primary mb-2">
              {t(`${slug}.name`)}
            </h1>
            <p className="text-text-secondary mb-4">
              {t(`${slug}.description`)}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {product.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-1 bg-bg text-text-secondary rounded-sm border border-[rgba(127,99,21,0.1)]">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-sm font-medium ${
                product.status === 'live' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {product.status === 'live' ? tc('live') : tc('inDevelopment')}
              </span>
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-dark text-white text-sm rounded-sm hover:opacity-90 transition-opacity"
              >
                {t('visit')} →
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(127,99,21,0.1)] pt-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">{t('features')}</h2>
          <ul className="space-y-2">
            {(t(`${slug}.features`) as unknown as string[]).map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-accent mt-0.5">•</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}