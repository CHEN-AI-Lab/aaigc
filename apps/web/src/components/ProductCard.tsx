import type { Product } from 'shared/types'
import { useLocale } from 'next-intl'

export default function ProductCard({ product, locale: _locale }: { product: Product; locale?: string }) {
  const locale = useLocale()

  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-surface rounded-sm p-6 shadow-warm-sm hover:shadow-warm transition-shadow group"
    >
      <div className="text-4xl mb-4">{product.icon}</div>
      <h3 className="card-title text-text-primary mb-2">
        {locale === 'en' ? product.nameEn : product.name}
      </h3>
      <p className="text-sm text-text-secondary mb-4 line-clamp-2">
        {locale === 'en' ? product.descriptionEn : product.description}
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {product.tags.map((tag) => (
          <span key={tag} className="text-xs px-2 py-0.5 bg-bg text-text-secondary rounded-sm border border-[rgba(127,99,21,0.1)]">
            {tag}
          </span>
        ))}
      </div>
      <span className={`inline-block text-xs px-2 py-1 rounded-sm font-medium ${
        product.status === 'live' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
      }`}>
        {product.status === 'live'
          ? (locale === 'en' ? 'Live' : '已上线')
          : (locale === 'en' ? 'In Development' : '开发中')}
      </span>
    </a>
  )
}