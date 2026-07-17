import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { products } from 'data/products'
import { toolCategories } from 'data/tools'

type Props = { params: Promise<{ locale: string }> }

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'home' })
  const tc = await getTranslations({ locale, namespace: 'common' })

  return (
    <div>
      {/* Hero */}
      <section className="py-24 px-6 text-center">
        <h1 className="display-hero text-text-primary mb-4">🚀 AAIGC</h1>
        <p className="text-xl text-text-secondary max-w-xl mx-auto mb-8">
          {t('heroSubtitle')}
        </p>
        <p className="text-lg text-accent font-medium">
          {tc('tagline')}
        </p>
      </section>

      {/* Products Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="section-title text-text-primary text-center mb-10">{t('productsTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <Link
              key={p.id}
              href={p.url as any}
              className="block bg-surface rounded-sm p-6 shadow-warm-sm hover:shadow-warm transition-shadow group"
            >
              <div className="text-4xl mb-4">{p.icon}</div>
              <h3 className="card-title text-text-primary mb-2">{locale === 'en' ? p.nameEn : p.name}</h3>
              <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                {locale === 'en' ? p.descriptionEn : p.description}
              </p>
              <span className={`inline-block text-xs px-2 py-1 rounded-sm font-medium ${
                p.status === 'live'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {p.status === 'live' ? tc('live') : tc('inDevelopment')}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Tools Section */}
      <section className="bg-surface py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="section-title text-text-primary text-center mb-2">{t('toolsTitle')}</h2>
          <p className="text-text-secondary text-center mb-10">{t('toolsDesc')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {toolCategories.map((cat) => (
              <Link
                key={cat.id}
                href="/tools"
                className="bg-bg rounded-sm p-5 shadow-warm-sm hover:shadow-warm transition-shadow text-center group"
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {locale === 'en' ? cat.nameEn : cat.name}
                </h3>
              </Link>
            ))}
          </div>

          {/* Quick tool links */}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {['JSON Formatter', 'Timestamp', 'QR Code', 'Base64', 'Regex Tester', 'Markdown', 'Color Picker', 'Text Diff'].map((tool) => (
              <Link
                key={tool}
                href="/tools"
                className="text-sm px-4 py-2 bg-bg text-text-secondary hover:text-accent rounded-sm transition-colors border border-[rgba(127,99,21,0.1)]"
              >
                {tool}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center">
        <Link
          href="/about"
          className="inline-flex items-center gap-2 px-8 py-3 bg-dark text-white text-sm font-medium rounded-sm hover:opacity-90 transition-opacity"
        >
          {locale === 'en' ? 'About AAIGC →' : '关于 AAIGC →'}
        </Link>
      </section>
    </div>
  )
}