'use client'

import { useState, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { tools, toolCategories } from 'data/tools'

export default function ToolsClient() {
  const locale = useLocale()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return null
    const q = query.toLowerCase()
    return tools.filter((t) => {
      const name = locale === 'en' ? t.nameEn : t.name
      const desc = locale === 'en' ? t.descriptionEn : t.description
      return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q)
    })
  }, [query, locale])

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="section-title text-text-primary mb-2">
        {locale === 'en' ? 'Online Tools' : '在线工具'}
      </h1>
      <p className="text-text-secondary mb-6">
        {locale === 'en' ? 'Free utilities for developers and everyday use' : '面向开发者和日常使用的免费工具'}
      </p>

      {/* Search */}
      <div className="mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={locale === 'en' ? 'Search tools...' : '搜索工具...'}
          className="w-full max-w-md p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/30"
        />
      </div>

      {/* Search results */}
      {filtered !== null && (
        <div className="mb-8">
          <p className="text-sm text-text-secondary mb-4">
            {locale === 'en' ? `Found ${filtered.length} tools` : `找到 ${filtered.length} 个工具`}
          </p>
          {filtered.length === 0 ? (
            <p className="text-sm text-text-secondary">{locale === 'en' ? 'No tools found' : '未找到相关工具'}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((tool) => (
                <Link key={tool.id} href={`/tools/${tool.id}`}
                  className="block bg-surface rounded-sm p-4 shadow-warm-sm hover:shadow-warm transition-shadow border border-[rgba(127,99,21,0.05)]">
                  <div className="text-xs font-mono text-accent mb-2">{tool.icon}</div>
                  <h3 className="text-sm font-medium text-text-primary">{locale === 'en' ? tool.nameEn : tool.name}</h3>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category groups (hidden when searching) */}
      {filtered === null && toolCategories.map((cat) => {
        const catTools = tools.filter((tool) => tool.category === cat.id)
        if (catTools.length === 0) return null
        return (
          <div key={cat.id} className="mb-12">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary mb-4">
              <span>{cat.icon}</span>
              <span>{locale === 'en' ? cat.nameEn : cat.name}</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {catTools.map((tool) => (
                <Link key={tool.id} href={`/tools/${tool.id}`}
                  className="block bg-surface rounded-sm p-4 shadow-warm-sm hover:shadow-warm transition-shadow border border-[rgba(127,99,21,0.05)]">
                  <div className="text-xs font-mono text-accent mb-2">{tool.icon}</div>
                  <h3 className="text-sm font-medium text-text-primary">{locale === 'en' ? tool.nameEn : tool.name}</h3>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                    {locale === 'en' ? tool.descriptionEn : tool.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}