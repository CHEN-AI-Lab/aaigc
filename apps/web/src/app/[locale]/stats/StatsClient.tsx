'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useSearchParams, useRouter } from 'next/navigation'
import { products } from 'data/products'
import StatsChart from '../../../components/StatsChart'
import StatsBreakdown from '../../../components/StatsBreakdown'
import DateRangePicker from '../../../components/DateRangePicker'
import {
  fetchStats, fetchDaily, fetchRanking,
  fetchOnline, fetchPages, fetchCountries, fetchReferrer,
} from 'shared/hooks/fetchStats'

const ALL_PROJECTS = [
  { id: 'aaigc', icon: '◈', name: 'AAIGC' },
  ...products.map((p) => ({ id: p.id, icon: p.icon, name: p.id })),
]

type DateMode = 'today' | '7d' | '30d' | 'all' | 'custom'

function toDateStr(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function diffDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export default function StatsPage() {
  const ts = useTranslations('stats')
  const tt = useTranslations('tools')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const router = useRouter()
  const datePickerRef = useRef<HTMLDivElement>(null)
  const projectRef = useRef<HTMLDivElement>(null)

  const initialProject = searchParams.get('project') || 'aaigc'
  const initialDateMode = (searchParams.get('range') as DateMode) || '30d'
  const initialCustomStart = searchParams.get('start') || ''
  const initialCustomEnd = searchParams.get('end') || ''

  const [project, setProject] = useState(initialProject)
  const [dateMode, setDateMode] = useState<DateMode>(initialDateMode)
  const [customStart, setCustomStart] = useState(initialCustomStart)
  const [customEnd, setCustomEnd] = useState(initialCustomEnd)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [projectSelectorOpen, setProjectSelectorOpen] = useState(false)
  const [showCustomCalendar, setShowCustomCalendar] = useState(false)
  const [customOpenCount, setCustomOpenCount] = useState(0)
  const [allStats, setAllStats] = useState<Record<string, {
    totalVisits: number; todayVisits: number; todayUV: number; online: number
  }>>({})
  const [daily, setDaily] = useState<{ date: string; visits: number }[]>([])
  const [ranking, setRanking] = useState<{ id: string; count: number }[]>([])
  const [pages, setPages] = useState<{ page: string; visits: number }[]>([])
  const [countries, setCountries] = useState<{ country: string; visits: number }[]>([])
  const [referrer, setReferrer] = useState<{ source: string; visits: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(true)

  // Close dropdowns on outside click
  useEffect(() => {
    if (!datePickerOpen && !projectSelectorOpen) return
    const handler = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setDatePickerOpen(false)
        setShowCustomCalendar(false)
      }
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) {
        setProjectSelectorOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [datePickerOpen, projectSelectorOpen])

  const syncUrl = useCallback((p: string, range: DateMode, cs?: string, ce?: string) => {
    const params = new URLSearchParams()
    if (p !== 'aaigc') params.set('project', p)
    if (range !== '30d') params.set('range', range)
    if (range === 'custom' && cs && ce) {
      params.set('start', cs)
      params.set('end', ce)
    }
    const qs = params.toString()
    router.replace(qs ? `/stats?${qs}` : '/stats', { scroll: false })
  }, [router])

  const handleProjectChange = (val: string) => {
    setProject(val)
    syncUrl(val, dateMode)
  }

  const handleDateModeChange = (mode: DateMode) => {
    setDateMode(mode)
    setCustomStart('')
    setCustomEnd('')
    setDatePickerOpen(false)
    syncUrl(project, mode)
  }

  const { dailyDays, startDate, endDate } = useMemo(() => {
    const now = new Date()
    switch (dateMode) {
      case 'today': return { dailyDays: 1, startDate: toDateStr(now), endDate: toDateStr(now) }
      case '7d': {
        const s = new Date(now); s.setDate(s.getDate() - 6)
        return { dailyDays: 7, startDate: toDateStr(s), endDate: toDateStr(now) }
      }
      case '30d': {
        const s = new Date(now); s.setDate(s.getDate() - 29)
        return { dailyDays: 30, startDate: toDateStr(s), endDate: toDateStr(now) }
      }
      case 'all': {
        const s = new Date(now); s.setFullYear(s.getFullYear() - 10)
        return { dailyDays: 3650, startDate: toDateStr(s), endDate: toDateStr(now) }
      }
      case 'custom': {
        const s = customStart || toDateStr(new Date(now.getTime() - 29 * 86400000))
        const e = customEnd || toDateStr(now)
        return { dailyDays: diffDays(new Date(s), new Date(e)) + 1, startDate: s, endDate: e }
      }
    }
  }, [dateMode, customStart, customEnd])

  const dateLabel = useMemo(() => {
    switch (dateMode) {
      case 'today': return ts('today')
      case '7d': return ts('last7d')
      case '30d': return ts('last30d')
      case 'all': return ts('all')
      case 'custom': return `${customStart || '?'} — ${customEnd || '?'}`
    }
  }, [dateMode, customStart, customEnd, ts])

  const presets: { key: DateMode; label: string }[] = [
    { key: 'today', label: ts('today') },
    { key: '7d', label: ts('last7d') },
    { key: '30d', label: ts('last30d') },
    { key: 'all', label: ts('all') },
  ]

  // Fetch per-project stats
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all(
      ALL_PROJECTS.map(async (p) => {
        try {
          const [stats, online] = await Promise.all([
            fetchStats(p.id), fetchOnline(p.id),
          ])
          return [p.id, { ...stats, online: online.online }] as const
        } catch {
          return [p.id, { totalVisits: 0, todayVisits: 0, todayUV: 0, online: 0 }] as const
        }
      })
    ).then((results) => {
      if (!cancelled) {
        setAllStats(Object.fromEntries(results))
        setLoading(false)
      }
    }).catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Fetch chart + breakdown data
  useEffect(() => {
    let cancelled = false
    setChartLoading(true)
    Promise.all([
      dateMode === 'custom'
        ? fetchDaily(project, 0, startDate, endDate).catch(() => [])
        : fetchDaily(project, dailyDays).catch(() => []),
      dateMode === 'all'
        ? fetchRanking(project, 20).catch(() => [])
        : fetchRanking(project, 20, startDate, endDate).catch(() => []),
      fetchPages(project, 10, startDate, endDate).catch(() => []),
      fetchCountries(project, Math.min(dailyDays, 30), startDate, endDate).catch(() => []),
      fetchReferrer(project, 10, startDate, endDate).catch(() => []),
    ]).then(([d, r, p, c, ref]) => {
      if (!cancelled) {
        setDaily(Array.isArray(d) ? d : [])
        setRanking(Array.isArray(r) ? r : [])
        setPages(Array.isArray(p) ? p : [])
        setCountries(Array.isArray(c) ? c : [])
        setReferrer(Array.isArray(ref) ? ref : [])
        setChartLoading(false)
      }
    }).catch(() => { if (!cancelled) setChartLoading(false) })
    return () => { cancelled = true }
  }, [project, dailyDays, startDate, endDate, dateMode])

  const displayStats = allStats[project]
  const isAll = project === 'all'

  const aggregated = useMemo(() =>
    Object.values(allStats).reduce(
      (acc, s) => ({
        totalVisits: acc.totalVisits + s.totalVisits,
        todayVisits: acc.todayVisits + s.todayVisits,
        todayUV: acc.todayUV + s.todayUV,
        online: acc.online + s.online,
      }),
      { totalVisits: 0, todayVisits: 0, todayUV: 0, online: 0 }
    ), [allStats])

  const currentStats = isAll ? aggregated : displayStats
  const showToolRanking = !isAll && project === 'aaigc' && ranking.length > 0
  const showProjectSummary = isAll

  const countryNames: Record<string, string> = {
    CN: '🇨🇳 China', US: '🇺🇸 United States', JP: '🇯🇵 Japan',
    GB: '🇬🇧 United Kingdom', DE: '🇩🇪 Germany', FR: '🇫🇷 France',
    KR: '🇰🇷 South Korea', CA: '🇨🇦 Canada', AU: '🇦🇺 Australia',
    SG: '🇸🇬 Singapore', TW: '🇹🇼 Taiwan', HK: '🇭🇰 Hong Kong',
    unknown: '🌍 Unknown',
  }

  const pagesItems = Array.isArray(pages) ? pages.map((p) => ({
    key: p.page, value: p.visits, label: p.page,
  })) : []
  const countriesItems = Array.isArray(countries) ? countries.map((c) => ({
    key: c.country, value: c.visits,
    label: countryNames[c.country] || `🌍 ${c.country}`,
  })) : []
  const referrerItems = Array.isArray(referrer) ? referrer.map((r) => ({
    key: r.source, value: r.visits,
    label: r.source === 'direct' ? 'Direct' : r.source.length > 30 ? r.source.slice(0, 30) + '…' : r.source,
  })) : []

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header row: title + date range + project */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-semibold text-text-primary">📊 {ts('title')}</h1>

        <div className="flex items-center gap-3">
          {/* Project selector button */}
          <div className="relative" ref={projectRef}>
            <button
              onClick={() => setProjectSelectorOpen(!projectSelectorOpen)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-[rgba(127,99,21,0.15)] rounded-sm bg-bg text-text-primary hover:border-accent/30 transition-colors whitespace-nowrap"
            >
              {project === 'all' ? (
                <>📊 {ts('allProjects')}</>
              ) : (() => {
                const p = ALL_PROJECTS.find(p => p.id === project)
                if (!p) return project
                return (
                  <>
                    {p.id === 'aaigc' ? (
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm text-[10px] font-bold text-white shrink-0" style={{background: 'linear-gradient(135deg, #667eea, #764ba2)'}}>A</span>
                    ) : (
                      <span>{p.icon}</span>
                    )}
                    <span>{p.name}</span>
                  </>
                )
              })()}
              <svg className="w-3 h-3 text-text-secondary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {projectSelectorOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm shadow-lg min-w-[160px]">
                <div className="p-1">
                  <button
                    onClick={() => { handleProjectChange('all'); setProjectSelectorOpen(false) }}
                    className={`block w-full text-left px-3 py-1.5 text-xs rounded-sm transition-colors whitespace-nowrap ${project === 'all' ? 'bg-accent text-white' : 'text-text-primary hover:bg-accent/5'}`}
                  >
                    📊 {ts('allProjects')}
                  </button>
                  {ALL_PROJECTS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { handleProjectChange(p.id); setProjectSelectorOpen(false) }}
                      className={`block w-full text-left px-3 py-1.5 text-xs rounded-sm transition-colors whitespace-nowrap ${project === p.id ? 'bg-accent text-white' : 'text-text-primary hover:bg-accent/5'}`}
                    >
                      {p.id === 'aaigc' ? (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm text-[10px] font-bold text-white shrink-0 mr-1" style={{background: 'linear-gradient(135deg, #667eea, #764ba2)'}}>A</span>
                      ) : (
                        <span className="mr-1">{p.icon}</span>
                      )}
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date picker dropdown */}
          <div className="relative" ref={datePickerRef}>
            <button
              onClick={() => setDatePickerOpen(!datePickerOpen)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-[rgba(127,99,21,0.15)] rounded-sm bg-bg text-text-primary hover:border-accent/30 transition-colors"
            >
              {dateMode === 'custom' ? `${customStart || '…'} — ${customEnd || '…'}` : dateLabel}
              <svg className="w-3 h-3 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {datePickerOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm shadow-lg">
                {showCustomCalendar ? (
                  <div className="p-2">
                    <button
                      onClick={() => setShowCustomCalendar(false)}
                      className="flex items-center gap-1 text-xs text-text-secondary hover:text-accent mb-2"
                    >
                      ‹ {ts('custom')}
                    </button>
                    <DateRangePicker
                      key={customOpenCount}
                      locale={locale}
                      initialStart={customStart}
                      initialEnd={customEnd}
                      onApply={(s, e) => {
                        setCustomStart(s)
                        setCustomEnd(e)
                        setDateMode('custom')
                        setShowCustomCalendar(false)
                        setDatePickerOpen(false)
                        syncUrl(project, 'custom', s, e)
                      }}
                    />
                  </div>
                ) : (
                  <div className="p-2 min-w-[180px]">
                    {presets.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => {
                          if (p.key === 'custom') {
                            setShowCustomCalendar(true)
                          } else {
                            handleDateModeChange(p.key)
                          }
                        }}
                        className={`block w-full text-left px-3 py-1.5 text-xs rounded-sm transition-colors ${
                          dateMode === p.key && p.key !== 'custom'
                            ? 'bg-accent text-white'
                            : 'text-text-primary hover:bg-accent/5'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                    <div className="border-t border-[rgba(127,99,21,0.1)] my-1" />
                    <button
                      onClick={() => {
                            setShowCustomCalendar(true)
                            setCustomOpenCount((c) => c + 1)
                          }}
                      className="block w-full text-left px-3 py-1.5 text-xs rounded-sm transition-colors text-text-primary hover:bg-accent/5"
                    >
                      {ts('custom')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-text-secondary text-sm">{ts('noData')}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-bg p-5 rounded-sm border border-[rgba(127,99,21,0.1)] text-center">
              <p className="text-2xl font-bold text-accent">{currentStats?.totalVisits?.toLocaleString() ?? '-'}</p>
              <p className="text-xs text-text-secondary mt-1">{ts('pageviews')}</p>
            </div>
            <div className="bg-bg p-5 rounded-sm border border-[rgba(127,99,21,0.1)] text-center">
              <p className="text-2xl font-bold text-accent">{currentStats?.todayUV?.toLocaleString() ?? '-'}</p>
              <p className="text-xs text-text-secondary mt-1">{ts('uniqueVisitors')}</p>
            </div>
            <div className="bg-bg p-5 rounded-sm border border-[rgba(127,99,21,0.1)] text-center">
              <p className="text-2xl font-bold text-accent">{currentStats?.todayVisits?.toLocaleString() ?? '-'}</p>
              <p className="text-xs text-text-secondary mt-1">{ts('todayVisits')}</p>
            </div>
            <div className="bg-bg p-5 rounded-sm border border-[rgba(127,99,21,0.1)] text-center">
              <p className="text-2xl font-bold text-accent">{currentStats?.online ?? '-'}</p>
              <p className="text-xs text-text-secondary mt-1">{ts('online')}</p>
            </div>
          </div>

          <StatsChart data={daily} loading={chartLoading} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatsBreakdown title={ts('topPages')} icon="📄" items={pagesItems} loading={chartLoading} />
            <StatsBreakdown title={ts('countries')} icon="🌍" items={countriesItems} loading={chartLoading} />
            <StatsBreakdown title={ts('referrer')} icon="🔗" items={referrerItems} loading={chartLoading} />
          </div>

          {showToolRanking && (
            <div className="bg-bg p-6 rounded-sm border border-[rgba(127,99,21,0.1)] mb-8">
              <h2 className="text-sm font-semibold text-text-secondary mb-4">🔥 {ts('popularTools')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ranking.map((item, i) => (
                  <div key={item.id} className="flex items-center gap-3 text-xs">
                    <span className="w-5 text-accent font-bold text-center shrink-0">{i + 1}</span>
                    <div className="flex-1 h-4 bg-[rgba(127,99,21,0.06)] rounded-sm overflow-hidden">
                      <div className="h-full bg-accent/15 rounded-sm" style={{ width: `${Math.min(100, (item.count / Math.max(ranking[0]?.count, 1)) * 100)}%` }} />
                    </div>
                    <span className="w-28 text-text-primary truncate text-right shrink-0">{tt(`${item.id}.name`)}</span>
                    <span className="w-12 text-right text-text-secondary shrink-0">{item.count} {ts('times')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showProjectSummary && (
            <div className="bg-bg p-6 rounded-sm border border-[rgba(127,99,21,0.1)]">
              <h2 className="text-sm font-semibold text-text-secondary mb-4">{ts('projectStats')}</h2>
              <div className="space-y-2">
                {ALL_PROJECTS.map((p) => {
                  const s = allStats[p.id]
                  if (!s || (s.totalVisits === 0 && s.todayVisits === 0)) return null
                  return (
                    <div key={p.id} className="flex items-center gap-3 text-xs">
                      <span className="w-5 text-center shrink-0">{p.icon}</span>
                      <span className="text-text-primary w-24 shrink-0">{p.name}</span>
                      <div className="flex-1 h-4 bg-[rgba(127,99,21,0.06)] rounded-sm overflow-hidden">
                        <div className="h-full bg-accent/15 rounded-sm" style={{ width: `${Math.min(100, (s.totalVisits / Math.max(aggregated.totalVisits, 1)) * 100)}%` }} />
                      </div>
                      <span className="text-text-secondary text-right shrink-0">
                        {ts('projectStatsFormat', { visits: s.totalVisits, online: s.online })}
                      </span>
                    </div>
                  )
                })}
                {Object.values(allStats).every((s) => s.totalVisits === 0 && s.todayVisits === 0) && (
                  <p className="text-text-secondary text-xs">{ts('noData')}</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}