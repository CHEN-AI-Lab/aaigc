'use client'

import { useCallback, useState } from 'react'
import { useSession } from '@/lib/auth-client'
import { useRouter } from '@/i18n/navigation'

type Props = {
  itemId: string
  type?: 'tool' | 'product'
}

export default function FavoriteStar({ itemId, type = 'tool' }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    // 阻止冒泡，避免触发卡片 Link 跳转
    e.preventDefault()
    e.stopPropagation()

    if (!session) {
      router.push('/login')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: itemId, type }),
      })
      if (res.ok) {
        const data = await res.json()
        setIsFavorited(data.isFavorited)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [session, itemId, type, router])

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label="favorite"
      className={`p-1.5 rounded-sm transition-colors ${
        isFavorited
          ? 'text-accent'
          : 'text-text-secondary/40 hover:text-accent'
      }`}
    >
      {/* Star SVG */}
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill={isFavorited ? 'currentColor' : 'none'}
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