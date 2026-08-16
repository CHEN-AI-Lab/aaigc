'use client'

import { useCallback, useState } from 'react'
import { useSession } from '@/auth-client'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'

type Props = {
  itemId: string
  type?: 'tool' | 'product'
  initialFavorited?: boolean
}

export default function FavoriteButton({ itemId, type = 'tool', initialFavorited = false }: Props) {
  const t = useTranslations('tools')
  const { data: session } = useSession()
  const router = useRouter()
  const [isFavorited, setIsFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null)

  const showToast = useCallback((message: string) => {
    setToast({ message, key: Date.now() })
    setTimeout(() => setToast(null), 2000)
  }, [])

  const handleClick = useCallback(async () => {
    if (!session) {
      showToast(t('loginRequired'))
      setTimeout(() => router.push('/login'), 1500)
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
  }, [session, itemId, type, router, showToast, t])

  return (
    <>
      {toast && (
        <div
          key={toast.key}
          className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] text-xs text-white bg-accent/95 rounded-md px-4 py-2.5 shadow-lg whitespace-nowrap"
        >
          {toast.message}
        </div>
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-all duration-200 ${
          isFavorited
            ? 'bg-accent/10 text-accent border-accent/20'
            : 'bg-surface text-text-secondary/50 border-border hover:text-accent hover:border-accent/30 hover:bg-accent/5'
        }`}
        title={t(isFavorited ? 'favorited' : 'favorite')}
      >
        {/* Star SVG */}
        <svg
          className={`w-4 h-4 ${isFavorited ? 'text-accent' : 'text-text-secondary/50'}`}
          viewBox="0 0 24 24"
          fill={isFavorited ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span>{t(isFavorited ? 'favorited' : 'favorite')}</span>
      </button>
    </>
  )
}