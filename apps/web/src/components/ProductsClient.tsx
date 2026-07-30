'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type { Product } from 'shared/types'
import ProductCard from './ProductCard'

export default function ProductsClient({ products }: { products: Product[] }) {
  const t = useTranslations('common')
  const [filter, setFilter] = useState<'all' | 'live' | 'wip'>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return products
    return products.filter((p) => p.status === filter)
  }, [filter, products])

  return (
    <div>
      <div className="flex gap-2 mb-8">
        {(['all', 'live', 'wip'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
              filter === f ? 'bg-accent text-white' : 'bg-surface text-text-primary hover:bg-accent/10'
            }`}
          >
            {f === 'all' ? t('all') :
             f === 'live' ? t('live') :
             t('comingSoon')}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}