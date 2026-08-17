'use client'

import { useFavorites } from './FavoritesProvider'

type Props = {
  itemId: string
  type?: 'tool' | 'product'
}

export default function FavoriteStar({ itemId, type = 'tool' }: Props) {
  const { isFavorited, toggleFavorite } = useFavorites()
  const favorited = isFavorited(itemId, type)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await toggleFavorite(itemId, type)
  }

  return (
    <button
      onClick={handleClick}
      aria-label="favorite"
      className={`p-1.5 rounded-sm transition-colors ${
        favorited ? 'text-accent' : 'text-text-secondary/40 hover:text-accent'
      }`}
    >
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill={favorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  )
}