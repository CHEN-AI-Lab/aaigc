'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type { Product } from 'shared/types'
import ProductCard from './ProductCard'
import { useFavorites } from './FavoritesProvider'
import { useSession } from '@/auth-client'
import { Link } from '@/i18n/navigation'

export default function ProductsClient({ products: allProducts }: { products: Product[] }) {
  const t = useTranslations('common')
  const tp = useTranslations('products')
  const tt = useTranslations('tools')
  const [filter, setFilter] = useState<'all' | 'live' | 'wip'>('all')
  const { data: session } = useSession()
  const { favorites, toggleFavorite } = useFavorites()

  const productFavs = useMemo(
    () => favorites.filter((f) => f.type === 'product'),
    [favorites]
  )

  const filtered = useMemo(() => {
    if (filter === 'all') return allProducts
    return allProducts.filter((p) => p.status === filter)
  }, [filter, allProducts])

  return (
    <div>
      {/* ── My Favorite Products (above filter, always visible) ── */}
      {session && productFavs.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-text-secondary mb-3 flex items-center gap-1">
            ★ {tt('favoriteProducts')} ({productFavs.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {productFavs.map((fav) => {
              const product = allProducts.find((p) => p.id === fav.toolId)
              if (!product) return null
              return (
                <div
                  key={fav.id}
                  className="flex items-center gap-1.5 bg-card rounded-sm border border-border px-2.5 py-1.5 text-xs"
                >
                  <span className="text-sm">{product.icon}</span>
                  <Link
                    href={`/products/${fav.toolId}`}
                    className="text-text-primary hover:text-accent transition-colors truncate max-w-[120px]"
                  >
                    {tp(`${fav.toolId}.name`)}
                  </Link>
                  <button
                    onClick={() => toggleFavorite(fav.toolId, 'product')}
                    className="p-0.5 rounded-sm text-accent hover:text-accent/70 transition-colors"
                    title={tt('unfavorite')}
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-8">
        {(['all', 'live', 'wip'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm rounded-sm transition-colors ${
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