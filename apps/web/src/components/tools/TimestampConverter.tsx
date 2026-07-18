'use client'

import { useState, useCallback } from 'react'
import { useLocale } from 'next-intl'

export default function TimestampConverter() {
  const locale = useLocale()
  const [ts, setTs] = useState('')
  const [date, setDate] = useState('')
  const [tsResult, setTsResult] = useState('')
  const [dateResult, setDateResult] = useState('')
  const [error, setError] = useState('')

  const toDate = useCallback(() => {
    setError('')
    const ms = parseInt(ts, 10)
    if (isNaN(ms)) { setError(locale === 'en' ? 'Invalid timestamp' : '无效的时间戳'); return }
    const d = new Date(ms < 1e12 ? ms * 1000 : ms)
    setDateResult(d.toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN'))
  }, [ts, locale])

  const toTs = useCallback(() => {
    setError('')
    const d = new Date(date)
    if (isNaN(d.getTime())) { setError(locale === 'en' ? 'Invalid date' : '无效的日期'); return }
    setTsResult(String(Math.floor(d.getTime() / 1000)))
  }, [date, locale])

  return (
    <div className="mt-6 space-y-6">
      <div className="p-4 bg-surface rounded-sm">
        <h3 className="text-sm font-medium text-text-primary mb-2">{locale === 'en' ? 'Timestamp → Date' : '时间戳 → 日期'}</h3>
        <div className="flex gap-2">
          <input value={ts} onChange={e => setTs(e.target.value)} placeholder="1700000000" className="flex-1 p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/30" />
          <button onClick={toDate} className="px-4 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90">{locale === 'en' ? 'Convert' : '转换'}</button>
        </div>
        {dateResult && <p className="mt-2 text-sm text-text-primary">{dateResult}</p>}
      </div>

      <div className="p-4 bg-surface rounded-sm">
        <h3 className="text-sm font-medium text-text-primary mb-2">{locale === 'en' ? 'Date → Timestamp' : '日期 → 时间戳'}</h3>
        <div className="flex gap-2">
          <input value={date} onChange={e => setDate(e.target.value)} placeholder="2024-01-01" className="flex-1 p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/30" />
          <button onClick={toTs} className="px-4 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90">{locale === 'en' ? 'Convert' : '转换'}</button>
        </div>
        {tsResult && <p className="mt-2 text-sm text-text-primary font-mono">{tsResult}</p>}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex gap-4 text-xs text-text-secondary">
        <button onClick={() => { setTs(String(Math.floor(Date.now() / 1000))); setDateResult('') }} className="hover:text-accent">{locale === 'en' ? 'Now' : '当前时间戳'}</button>
        <button onClick={() => { setDate(new Date().toISOString().slice(0, 10)); setTsResult('') }} className="hover:text-accent">{locale === 'en' ? 'Today' : '今天'}</button>
      </div>
    </div>
  )
}