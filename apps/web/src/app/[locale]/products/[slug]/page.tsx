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
            <h1 className="text-3xl font-semibold text-text-primary mb-2">{name}</h1>
            {desc && <p className="text-text-secondary mb-4">{desc}</p>}
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-sm font-medium ${
                product.status === 'live' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {product.status === 'live' ? tc('live') : tc('inDevelopment')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}