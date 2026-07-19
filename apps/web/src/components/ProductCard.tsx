import type { Product } from 'shared/types'
import { useTranslations } from 'next-intl'

export default function ProductCard({ product }: { product: Product }) {
  const t = useTranslations('common')

  const content = (
    <div className="block bg-surface rounded-sm p-6 shadow-warm-sm hover:shadow-warm transition-shadow group text-center">
      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{product.icon}</div>
      <h3 className="card-title text-text-primary mb-2 text-center">
        {product.id === 'cookmate' ? 'CookMate' :
         product.id === 'aihub' ? 'AIHub' :
         product.id === 'short-drama' ? 'Short Drama' :
         product.id === 'resume-optimizer' ? 'Resume Optimizer' :
         product.id === 'copycraft' ? 'CopyCraft' :
         product.id === 'contentforge' ? 'ContentForge' :
         product.id === 'postforge' ? 'PostForge' :
         product.id === 'maestro' ? 'Maestro' :
         product.id === 'ai-portfolio-studio' ? 'AI Portfolio Studio' :
         product.id === 'ai-toolbox' ? 'AI Toolbox' :
         product.id === 'content-ai-site' ? 'Content AI Site' :
         product.id}
      </h3>
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
        {product.status === 'live' ? t('live') : t('inDevelopment')}
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

  return content
}