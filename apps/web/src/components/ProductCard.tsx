'use client'

import { useState } from 'react'
import type { Product } from 'shared/types'
import { useTranslations } from 'next-intl'

export default function ProductCard({ product }: { product: Product }) {
  const tc = useTranslations('common')
  const tp = useTranslations('products')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const name = tp(`${product.id}.name`)
  const desc = tp(`${product.id}.description`)

  const content = (
    <div className="block bg-card rounded-sm p-6 shadow-warm-sm hover:shadow-warm transition-shadow group text-center cursor-default border border-card">
      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{product.icon}</div>
      <h3 className="card-title text-text-primary mb-2 text-center">{name}</h3>
      {desc && <p className="text-sm text-text-secondary mb-4 line-clamp-2 text-center leading-relaxed">{desc}</p>}
      <span className={`inline-block text-xs px-3 py-1 rounded-sm font-medium ${
        product.status === 'live' ? 'bg-green-200 text-green-800' : 'bg-amber-200 text-amber-800'
      }`}>
        {product.status === 'live' ? tc('live') : tc('inDevelopment')}
      </span>
    </div>
  )

  if (product.url) {
    return (
      <a href={product.url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    )
  }

  return (
    <>
      <div onClick={() => showToast(tc('comingSoon'))}>
        {content}
      </div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-dark text-white text-sm px-5 py-2.5 rounded-sm shadow-warm-sm z-[9999]">
          {toast}
        </div>
      )}
    </>
  )
}