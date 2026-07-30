'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { Product } from 'shared/types'

export default function ProductCard({ product }: { product: Product }) {
  const tc = useTranslations('common')
  const tp = useTranslations('products')

  const name = tp(`${product.id}.name`)
  const desc = tp(`${product.id}.description`)
  const isLive = product.status === 'live'

  return (
    <Link
      href={`/products/${product.id}`}
      className="block bg-card rounded-md p-6 shadow-warm-sm hover:shadow-warm transition-shadow group text-center cursor-pointer border border-card"
    >
      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{product.icon}</div>
      <h3 className="card-title text-text-primary mb-2 text-center">{name}</h3>
      {desc && <p className="text-sm text-text-secondary mb-4 line-clamp-2 text-center leading-relaxed">{desc}</p>}
      <span className={`inline-block text-xs px-3 py-1 rounded-md font-medium ${
        isLive ? 'bg-green-500 text-white' : 'bg-surface text-text-secondary'
      }`}>
        {isLive ? tc('live') : tc('comingSoon')}
      </span>
    </Link>
  )
}