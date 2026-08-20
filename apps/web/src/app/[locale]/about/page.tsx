import { CONTACT_EMAIL } from 'shared/constants'
import { locales } from 'shared/constants/locales'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { products } from 'data/products'
import { toolCategories, tools } from 'data/tools'
import { Link } from '@/i18n/navigation'

type Props = { params: Promise<{ locale: string }> }

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'about' })
  const tt = await getTranslations({ locale, namespace: 'tools' })
  const tp = await getTranslations({ locale, namespace: 'products' })

  const activeCategories = toolCategories.filter(
    cat => tools.some(tool => tool.category === cat.id)
  )

  return (
    <div className="max-w-5xl mx-auto px-6 py-20">

      {/* ── Hero ── */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-text-primary mb-4">
          {t('title')}
        </h1>
        <p className="text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
          {t('subtitle2')}
        </p>
      </div>

      {/* ── Stats（动态数据） ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
        <div className="bg-card border border-border rounded-sm p-6 text-center">
          <div className="text-3xl font-bold text-accent">{tools.length}</div>
          <div className="text-xs text-text-secondary mt-1">{t('toolsTitle')}</div>
        </div>
        <div className="bg-card border border-border rounded-sm p-6 text-center">
          <div className="text-3xl font-bold text-accent">{products.length}</div>
          <div className="text-xs text-text-secondary mt-1">{t('productsTitle')}</div>
        </div>
        <div className="bg-card border border-border rounded-sm p-6 text-center">
          <div className="text-3xl font-bold text-accent">{activeCategories.length}</div>
          <div className="text-xs text-text-secondary mt-1">分类</div>
        </div>
        <div className="bg-card border border-border rounded-sm p-6 text-center">
          <div className="text-3xl font-bold text-accent">{locales.length}</div>
          <div className="text-xs text-text-secondary mt-1">语言</div>
        </div>
      </div>

      {/* ── 两个板块 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
        {/* 免费工具 */}
        <div className="bg-card border border-border rounded-sm p-6">
          <span className="text-2xl">🛠️</span>
          <h2 className="mt-3 font-semibold text-text-primary text-sm">{t('toolsTitle')}</h2>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">
            {t('toolsDesc')}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {activeCategories.map(cat => (
              <span
                key={cat.id}
                className="text-xs px-2.5 py-1 bg-surface border border-border rounded-sm text-text-secondary"
              >
                {cat.icon} {tt(`${cat.id}Tools`)}
              </span>
            ))}
          </div>
        </div>
        {/* AI 产品 */}
        <div className="bg-card border border-border rounded-sm p-6">
          <span className="text-2xl">🤖</span>
          <h2 className="mt-3 font-semibold text-text-primary text-sm">{t('productsTitle')}</h2>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">
            {t('productsDesc')}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {products.map(p => {
              const productData = tp.raw(p.id) as { tag?: string } | undefined
              if (!productData?.tag) return null
              return (
                <span
                  key={p.id}
                  className="text-xs px-2.5 py-1 bg-surface border border-border rounded-sm text-text-secondary"
                >
                  {p.icon} {productData.tag}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 特点 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
        <div className="p-5 bg-surface border border-border rounded-sm">
          <span className="text-2xl">🆓</span>
          <h3 className="mt-2 font-semibold text-sm text-text-primary">{t('free')}</h3>
          <p className="mt-1 text-xs text-text-secondary">{t('freeDesc')}</p>
        </div>
        <div className="p-5 bg-surface border border-border rounded-sm">
          <span className="text-2xl">🌍</span>
          <h3 className="mt-2 font-semibold text-sm text-text-primary">{t('lang')}</h3>
          <p className="mt-1 text-xs text-text-secondary">{t('langDesc')}</p>
        </div>
        <div className="p-5 bg-surface border border-border rounded-sm">
          <span className="text-2xl">⚡</span>
          <h3 className="mt-2 font-semibold text-sm text-text-primary">{t('local')}</h3>
          <p className="mt-1 text-xs text-text-secondary">{t('localDesc')}</p>
        </div>
        <div className="p-5 bg-surface border border-border rounded-sm">
          <span className="text-2xl">🏢</span>
          <h3 className="mt-2 font-semibold text-sm text-text-primary">{t('matrix')}</h3>
          <p className="mt-1 text-xs text-text-secondary">{t('matrixDesc')}</p>
        </div>
      </div>

      {/* ── 联系 ── */}
      <div className="bg-card border border-border rounded-sm p-6">
        <h2 className="text-xs font-semibold text-text-primary mb-3 uppercase tracking-wider">
          {t('contact')}
        </h2>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-sm text-accent hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
      </div>

      {/* ── CTA ── */}
      <div className="mt-12 text-center flex items-center justify-center gap-4">
        <Link
          href="/products"
          className="inline-block bg-accent text-white px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {t('productsCta')} →
        </Link>
        <Link
          href="/tools"
          className="inline-block border border-accent text-accent px-6 py-2.5 rounded-full text-sm font-medium hover:bg-accent/10 transition-colors"
        >
          {t('toolsCta')} →
        </Link>
      </div>

    </div>
  )
}