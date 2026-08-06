'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { fetchRanking } from 'shared/hooks/useVisitTracking'
import type { ToolMeta } from 'data/tools'

type Props = {
  tools: ToolMeta[]
  locale: string
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function HomeToolRanking({ tools, locale }: Props) {
  const t = useTranslations('home')
  const tt = useTranslations('tools')
  const [popular, setPopular] = useState<{ id: string; score: number }[]>([])

  // New tools: latest 8 by createdAt
  const newTools = [...tools]
    .filter((t) => t.createdAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)

  // Random picks: shuffled on mount only
  const [random, setRandom] = useState<{ id: string }[]>([])

  useEffect(() => {
    setRandom(shuffle(tools).slice(0, 8))
  }, [tools])

  // Popular tools: from API, fallback to first 8
  useEffect(() => {
    setPopular(tools.slice(0, 8).map((t) => ({ id: t.id, score: 0 })))
    fetchRanking('aaigc', 20).then((data) => {
      if (!data || data.length === 0) return
      const countMap = new Map(data.map((d) => [d.id, d.count]))
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const scored = tools.map((t) => {
        const count = countMap.get(t.id) || 0
        const isNew = t.createdAt && new Date(t.createdAt) >= sevenDaysAgo
        return { id: t.id, score: count + (isNew ? 1 : 0) }
      })
      setPopular(scored.sort((a, b) => b.score - a.score).slice(0, 8))
    }).catch(() => {})
  }, [tools])

  return (
    <div className="mt-12">
      {/* New Tools */}
      {newTools.length > 0 && (
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold text-text-secondary mb-3 flex justify-center items-center gap-1"><span className="w-6 inline-flex items-center justify-center">🆕</span><span className="min-w-[4em]">{t('newTools')}</span></p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 max-w-4xl mx-auto">
            {newTools.map((tool) => (
              <Link key={tool.id} href={`/tools/${tool.id}`}
                className="text-xs px-2 py-1.5 bg-bg text-text-secondary hover:text-accent hover:bg-accent/5 rounded-sm transition-colors border border-[rgba(127,99,21,0.1)] truncate text-center">
                {tt(`${tool.id}.name`)}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Popular Tools */}
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold text-text-secondary mb-3 flex justify-center items-center gap-1"><span className="w-6 inline-flex items-center justify-center">🔥</span><span className="min-w-[4em]">{t('popularTools')}</span></p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 max-w-4xl mx-auto">
          {popular.map((item) => (
            <Link key={item.id} href={`/tools/${item.id}`}
              className="text-xs px-2 py-1.5 bg-bg text-text-secondary hover:text-accent hover:bg-accent/5 rounded-sm transition-colors border border-[rgba(127,99,21,0.1)] truncate text-center">
              {tt(`${item.id}.name`)}
            </Link>
          ))}
        </div>
      </div>

      {/* Random Picks */}
      <div className="text-center">
        <p className="text-sm font-semibold text-text-secondary mb-3 flex justify-center items-center gap-1"><span className="w-6 inline-flex items-center justify-center">🎲</span><span className="min-w-[4em]">{t('discoverTools')}</span></p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 max-w-4xl mx-auto">
          {random.map((tool) => (
            <Link key={tool.id} href={`/tools/${tool.id}`}
              className="text-xs px-2 py-1.5 bg-bg text-text-secondary hover:text-accent hover:bg-accent/5 rounded-sm transition-colors border border-[rgba(127,99,21,0.1)] truncate text-center">
              {tt(`${tool.id}.name`)}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}