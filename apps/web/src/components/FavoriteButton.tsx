'use client'

import { useCallback, useState } from 'react'
import { useSession } from '@/lib/auth-client'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'

type Props = {
  toolId: string
  initialFavorited?: boolean
}

export default function FavoriteButton({ toolId, initialFavorited = false }: Props) {
  const t = useTranslations('tools')
  const { data: session } = useSession()
  const router = useRouter()
  const [isFavorited, setIsFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)

  const handleClick = useCallback(async () => {
    if (!session) {
      router.push('/login')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId }),
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
  }, [session, toolId, router])

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-all duration-200 ${
        isFavorited
          ? 'bg-accent/10 text-accent'
          : 'bg-surface text-text-secondary hover:text-accent hover:bg-accent/5'
      }`}
      title={t(isFavorited ? 'favorited' : 'favorite')}
    >
      <span className={`text-sm ${isFavorited ? 'scale-110' : ''}`}>
        {isFavorited ? '❤️' : '🤍'}
      </span>
      <span>{t(isFavorited ? 'favorited' : 'favorite')}</span>
    </button>
  )
}