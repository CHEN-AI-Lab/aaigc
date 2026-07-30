import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { products } from 'data/products'
import { tools, toolCategories } from 'data/tools'
import ProductCard from '../../components/ProductCard'

type Props = { params: Promise<{ locale: string }> }

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'home' })
  const tc = await getTranslations({ locale, namespace: 'common' })
  const tp = await getTranslations({ locale, namespace: 'products' })
  const tt = await getTranslations({ locale, namespace: 'tools' })

  const featuredProducts = products.slice(0, 4)
  const popularTools = ['json-formatter', 'base64', 'qrcode', 'timestamp', 'password-generator', 'calculator', 'word-counter', 'url-encode', 'markdown-preview', 'color-picker', 'regex-tester', 'ip-lookup', 'html-preview', 'emoji-picker', 'http-status-codes']

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-14 px-6 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/3 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="text-6xl mb-6">🚀</div>
          <h1 className="display-hero text-text-primary mb-4">AAIGC</h1>
          <p className="text-xl text-text-secondary max-w-xl mx-auto mb-8 leading-relaxed">
            {t('heroSubtitle')}
          </p>
          <p className="text-lg text-accent font-medium">
            {tc('tagline')}
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="bg-surface py-14">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="section-title text-text-primary text-center mb-2">{t('productsTitle')}</h2>
          <p className="text-text-secondary text-center mb-12 max-w-lg mx-auto">{tp('subtitle')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              {tc('viewAll')} →
            </Link>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-14">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="section-title text-text-primary text-center mb-2">{t('toolsTitle')}</h2>
          <p className="text-text-secondary text-center mb-12 max-w-lg mx-auto">{t('toolsDesc')}</p>

          {/* Category grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {toolCategories.map((cat) => {
              const count = tools.filter((t) => t.category === cat.id).length
              return (
              <Link
                key={cat.id}
                href={`/tools#category-${cat.id}`}
                className="bg-bg rounded-sm p-5 shadow-warm-sm hover:shadow-warm transition-all text-center group hover:-translate-y-0.5"
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {tt(`${cat.id}Tools`)}
                </h3>
                <p className="text-xs text-text-secondary mt-1">{t('toolCount', { count })}</p>
              </Link>
            )})}
          </div>

          {/* Popular tools quick links */}
          <div className="mt-12 text-center">
            <p className="text-xs text-text-secondary mb-4">{t('popularTools')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-w-2xl mx-auto">
              {popularTools.map((toolId) => (
                <Link
                  key={toolId}
                  href={`/tools/${toolId}`}
                  className="text-xs px-2 py-1.5 bg-bg text-text-secondary hover:text-accent hover:bg-accent/5 rounded-sm transition-colors border border-[rgba(127,99,21,0.1)] truncate"
                >
                  {tt(`${toolId}.name`)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-surface py-14 px-6 text-center">
        <Link
          href="/about"
          className="inline-flex items-center gap-2 px-8 py-3 bg-dark text-white text-sm font-medium rounded-sm hover:opacity-90 transition-opacity shadow-warm-sm"
        >
          {tc('aboutLink')}
        </Link>
      </section>
    </div>
  )
}