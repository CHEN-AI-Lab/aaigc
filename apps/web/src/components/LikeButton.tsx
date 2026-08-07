'use client'

import { useCallback, useState } from 'react'
import { useSession } from '@/lib/auth-client'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'

type Props = {
  toolId: string
  initialLiked?: boolean
  initialCount?: number
}

export default function LikeButton({ toolId, initialLiked = false, initialCount = 0 }: Props) {
  const t = useTranslations('tools')
  const { data: session } = useSession()
  const router = useRouter()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  const handleClick = useCallback(async () => {
    if (!session) {
      router.push('/login')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId }),
      })
      if (res.ok) {
        const data = await res.json()
        setLiked(data.liked)
        setCount(data.count)
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
        liked
          ? 'bg-accent/10 text-accent'
          : 'bg-surface text-text-secondary hover:text-accent hover:bg-accent/5'
      }`}
      title={t(liked ? 'liked' : 'like')}
    >
      <span className={`text-sm ${liked ? 'scale-110' : ''}`}>
        {liked ? '👍' : '👍'}
      </span>
      <span>{t(liked ? 'liked' : 'like')}</span>
      {count > 0 && (
        <span className="text-text-secondary/50 tabular-nums">{count}</span>
      )}
    </button>
  )
}