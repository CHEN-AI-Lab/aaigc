import type { Product } from 'shared/types'
import { useTranslations } from 'next-intl'

export default function ProductCard({ product }: { product: Product }) {
  const t = useTranslations('products')
  const tc = useTranslations('common')

  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-surface rounded-sm p-6 shadow-warm-sm hover:shadow-warm transition-shadow group text-center"
    >
      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{product.icon}</div>
      <h3 className="card-title text-text-primary mb-2 text-center">
        {t(`${product.id}.name`)}
      </h3>
      <p className="text-sm text-text-secondary mb-4 line-clamp-2 text-center">
        {t(`${product.id}.description`)}
      </p>
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {product.tags.map((tag) => (
          <span key={tag} className="text-xs px-2 py-0.5 bg-bg text-text-secondary rounded-sm border border-[rgba(127,99,21,0.1)]">
            {tag}
          </span>
        ))}
      </div>
      <span className={`inline-block text-xs px-3 py-1 rounded-sm font-medium ${
        product.status === 'live' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
      }`}>
        {product.status === 'live' ? tc('live') : tc('inDevelopment')}
      </span>
    </a>
  )
}