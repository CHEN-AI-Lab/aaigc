'use client'

import { useTranslations } from 'next-intl'

type BreakdownItem = {
  key: string
  value: number
  label: string
}

type Props = {
  title: string
  icon: string
  items: BreakdownItem[]
  loading: boolean
  max?: number
}

export default function StatsBreakdown({ title, icon, items, loading, max }: Props) {
  const ts = useTranslations('stats')

  if (loading) {
    return (
      <div className="bg-bg p-5 rounded-sm border border-[rgba(127,99,21,0.1)]">
        <h3 className="text-sm font-semibold text-text-secondary mb-3">{icon} {title}</h3>
        <p className="text-xs text-text-secondary">{ts('noData')}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-bg p-5 rounded-sm border border-[rgba(127,99,21,0.1)]">
        <h3 className="text-sm font-semibold text-text-secondary mb-3">{icon} {title}</h3>
        <p className="text-xs text-text-secondary">{ts('noData')}</p>
      </div>
    )
  }

  const maxValue = max ?? (items.length > 0 ? Math.max(...items.map((i) => i.value)) : 1)

  return (
    <div className="bg-bg p-5 rounded-sm border border-[rgba(127,99,21,0.1)]">
      <h3 className="text-sm font-semibold text-text-secondary mb-3">{icon} {title}</h3>
      <div className="space-y-1.5">
        {items.map((item) => {
          const pct = Math.round((item.value / maxValue) * 100)
          return (
            <div key={item.key} className="flex items-center gap-2 text-xs">
              <span className="w-7 text-right text-text-secondary shrink-0">{pct}%</span>
              <div className="flex-1 h-4 bg-[rgba(127,99,21,0.06)] rounded-sm overflow-hidden">
                <div
                  className="h-full bg-accent/15 rounded-sm transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-24 text-text-primary truncate text-right shrink-0">{item.label}</span>
              <span className="w-10 text-right text-text-secondary shrink-0">{item.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}