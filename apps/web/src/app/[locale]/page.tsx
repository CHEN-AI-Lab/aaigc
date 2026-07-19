import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { products } from 'data/products'
import { tools, toolCategories } from 'data/tools'
import ProductCard from '../../components/ProductCard'
import { dt } from 'shared/utils/locale'

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
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Tools Section */}
      <section className="bg-surface py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="section-title text-text-primary text-center mb-2">{t('toolsTitle')}</h2>
          <p className="text-text-secondary text-center mb-10">{t('toolsDesc')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {toolCategories.map((cat) => {
              const count = tools.filter((t) => t.category === cat.id).length
              return (
              <Link
                key={cat.id}
                href="/tools"
                className="bg-bg rounded-sm p-5 shadow-warm-sm hover:shadow-warm transition-shadow text-center group"
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {dt(locale, cat.nameEn, cat.name)}
                </h3>
                <p className="text-xs text-text-secondary mt-1">{t('toolCount', { count })}</p>
              </Link>
            )})}
          </div>

          {/* Quick tool links */}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {[
              { id: 'json-formatter', label: 'JSON Formatter', labelZh: 'JSON 格式化' },
              { id: 'timestamp', label: 'Timestamp', labelZh: '时间戳' },
              { id: 'qrcode', label: 'QR Code', labelZh: '二维码' },
              { id: 'base64', label: 'Base64', labelZh: 'Base64' },
              { id: 'regex-tester', label: 'Regex Tester', labelZh: '正则测试' },
              { id: 'markdown-preview', label: 'Markdown', labelZh: 'Markdown' },
              { id: 'color-picker', label: 'Color Picker', labelZh: '颜色选择' },
              { id: 'text-diff', label: 'Text Diff', labelZh: '文本对比' },
            ].map((tool) => (
              <Link
                key={tool.id}
                href={`/tools/${tool.id}`}
                className="text-sm px-4 py-2 bg-bg text-text-secondary hover:text-accent rounded-sm transition-colors border border-[rgba(127,99,21,0.1)]"
              >
                {locale === 'zh-CN' ? tool.labelZh : tool.label}
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
          {tc('aboutLink')}
        </Link>
      </section>
    </div>
  )
}