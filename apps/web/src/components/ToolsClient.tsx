'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { tools, toolCategories } from 'data/tools'
import FavoriteStar from './FavoriteStar'
import { useFavorites } from './FavoritesProvider'
import { useSession } from '@/auth-client'

export default function ToolsClient() {
  const t = useTranslations('tools')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const { data: session, status } = useSession()
  const { favorites, loading, toggleFavorite } = useFavorites()

  const toolFavs = useMemo(
    () => favorites.filter((f) => f.type === 'tool'),
    [favorites]
  )

  // Scroll to category section on initial load if hash is present
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const id = hash.replace('#', '')
      const el = document.getElementById(id)
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      }
    }
  }, [])

  // 工具组件由 ToolPageClient.tsx 通过 React.lazy 按需加载，
  // 列表页无需预加载全部 38 个组件 chunk（原先的预加载会在首屏产生 32+ 个无用网络请求）。

  const filtered = useMemo(() => {
    if (!query.trim()) return null
    const q = query.toLowerCase()
    return tools.filter((tool) => {
      const name = t(`${tool.id}.name`)
      const desc = t(`${tool.id}.description`)
      return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q)
    })
  }, [query, t])

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="section-title text-text-primary mb-2">{t('title')}</h1>
      <p className="text-text-secondary mb-6">{t('subtitle')}</p>

      <div className="mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search')}
          className="w-full max-w-md p-3 bg-card border border-border rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/30"
        />
      </div>

      {/* ── My Favorite Tools ── */}
      {(status === 'loading' || (session && loading)) && (
        <div className="mb-8">
          <div className="h-3 w-24 bg-surface rounded mb-3" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-7 w-28 bg-surface rounded-sm animate-pulse" />
            ))}
          </div>
        </div>
      )}
      {session && !loading && toolFavs.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-text-secondary mb-3 flex items-center gap-1">
            ★ {t('favoriteTools')} ({toolFavs.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {toolFavs.map((fav) => {
              const tool = tools.find((t) => t.id === fav.toolId)
              if (!tool) return null
              return (
                <div
                  key={fav.id}
                  className="flex items-center gap-1.5 bg-card rounded-sm border border-border px-2.5 py-1.5 text-xs"
                >
                  <Link
                    href={`/tools/${fav.toolId}`}
                    className="text-text-primary hover:text-accent transition-colors truncate max-w-[120px]"
                  >
                    {tool.icon} {t(`${fav.toolId}.name`)}
                  </Link>
                  <button
                    onClick={() => toggleFavorite(fav.toolId, 'tool')}
                    className="p-0.5 rounded-sm text-accent hover:text-accent/70 transition-colors"
                    title={t('unfavorite')}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {filtered !== null && (
        <div className="mb-8">
          <p className="text-sm text-text-secondary mb-4">
            {t('foundTools', { count: filtered.length })}
          </p>
          {filtered.length === 0 ? (
            <p className="text-sm text-text-secondary">{t('noResults')}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((tool) => (
                <Link key={tool.id} href={`/tools/${tool.id}`}
                  className="block bg-card rounded-sm p-4 shadow-warm-sm hover:shadow-warm transition-shadow border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-xs font-mono text-accent">{tool.icon}</div>
                    <FavoriteStar itemId={tool.id} type="tool" />
                  </div>
                  <h3 className="text-sm font-medium text-text-primary">{t(`${tool.id}.name`)}</h3>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {filtered === null && toolCategories.map((cat) => {
        const catTools = tools.filter((tool) => tool.category === cat.id)
        if (catTools.length === 0) return null
        const isOpen = expanded[cat.id] !== false // default true
        return (
          <div key={cat.id} className="mb-8">
            <button
              onClick={() => setExpanded(prev => ({ ...prev, [cat.id]: !isOpen }))}
              className="flex items-center gap-2 w-full text-left text-lg font-semibold text-text-primary mb-1 scroll-mt-20 group"
              id={`category-${cat.id}`}
            >
              <span className="text-lg">{cat.icon}</span>
              <span>{t(`${cat.id}Tools`)}</span>
              <span className="text-xs text-text-secondary/50 font-normal">{catTools.length}</span>
              <span className="ml-auto text-text-secondary/40 transition-transform duration-200"
                style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </span>
            </button>
            <div
              className="overflow-hidden transition-all duration-200"
              style={{ maxHeight: isOpen ? '2000px' : '0px', opacity: isOpen ? 1 : 0 }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-3">
                {catTools.map((tool) => (
                  <Link key={tool.id} href={`/tools/${tool.id}`}
                    className="block bg-card rounded-sm p-4 shadow-warm-sm hover:shadow-warm transition-shadow border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-xs font-mono text-accent">{tool.icon}</div>
                      <FavoriteStar itemId={tool.id} type="tool" />
                    </div>
                    <h3 className="text-sm font-medium text-text-primary">{t(`${tool.id}.name`)}</h3>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {t(`${tool.id}.description`)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}