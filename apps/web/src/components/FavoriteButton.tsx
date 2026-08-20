'use client'

import { useTranslations } from 'next-intl'
import { useFavorites } from './FavoritesProvider'

type Props = {
  itemId: string
  type?: 'tool' | 'product'
}

export default function FavoriteButton({ itemId, type = 'tool' }: Props) {
  const t = useTranslations('tools')
  const { isFavorited, toggleFavorite } = useFavorites()
  const favorited = isFavorited(itemId, type)

  const handleClick = async () => {
    await toggleFavorite(itemId, type)
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-all duration-200 ${
        favorited
          ? 'bg-accent/10 text-accent border-accent/20'
          : 'bg-surface text-text-secondary/50 border-border hover:text-accent hover:border-accent/30 hover:bg-accent/5'
      }`}
      title={t(favorited ? 'favorited' : 'favorite')}
    >
      <svg
        className={`w-4 h-4 ${favorited ? 'text-accent' : 'text-text-secondary/50'}`}
        viewBox="0 0 24 24"
        fill={favorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <span>{t(favorited ? 'favorited' : 'favorite')}</span>
    </button>
  )
}