'use client'

import { useState, useCallback } from 'react'
import { useLocale } from 'next-intl'

function formatDateTime(d: Date, locale: string) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  const secs = String(d.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${mins}:${secs}`
}

export default function TimestampConverter() {
  const locale = useLocale()
  const [ts, setTs] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [dateResult, setDateResult] = useState('')
  const [tsResultSec, setTsResultSec] = useState('')
  const [tsResultMs, setTsResultMs] = useState('')
  const [error, setError] = useState('')

  const toDate = useCallback(() => {
    setError('')
    const raw = parseInt(ts, 10)
    if (isNaN(raw)) { setError(locale === 'en' ? 'Invalid timestamp' : '无效的时间戳'); return }
    // Auto-detect: if < 1e12 (before 2001-09-09 in seconds), treat as seconds, else milliseconds
    const ms = raw < 1e12 ? raw * 1000 : raw
    const d = new Date(ms)
    setDateResult(formatDateTime(d, locale))
  }, [ts, locale])

  const toTs = useCallback(() => {
    setError('')
    if (!dateStr) { setError(locale === 'en' ? 'Please select a date and time' : '请选择日期和时间'); return }
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) { setError(locale === 'en' ? 'Invalid date' : '无效的日期'); return }
    setTsResultSec(String(Math.floor(d.getTime() / 1000)))
    setTsResultMs(String(d.getTime()))
  }, [dateStr, locale])

  return (
    <div className="mt-6 space-y-6">
      {/* Timestamp → Date */}
      <div className="p-4 bg-surface rounded-sm">
        <h3 className="text-sm font-medium text-text-primary mb-2">{locale === 'en' ? 'Timestamp → Date' : '时间戳 → 日期'}</h3>
        <p className="text-xs text-text-secondary mb-2">{locale === 'en' ? 'Supports seconds (10 digits) or milliseconds (13 digits)' : '支持秒级（10位）或毫秒级（13位）时间戳'}</p>
        <div className="flex gap-2">
          <input value={ts} onChange={e => setTs(e.target.value)} placeholder="1700000000" className="flex-1 p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/30" />
          <button onClick={toDate} className="px-4 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90 shrink-0">{locale === 'en' ? 'Convert' : '转换'}</button>
        </div>
        {dateResult && (
          <div className="mt-2 p-2 bg-bg rounded-sm border border-[rgba(127,99,21,0.1)]">
            <p className="text-sm text-text-primary font-mono">{dateResult}</p>
          </div>
        )}
      </div>

      {/* Date → Timestamp */}
      <div className="p-4 bg-surface rounded-sm">
        <h3 className="text-sm font-medium text-text-primary mb-2">{locale === 'en' ? 'Date → Timestamp' : '日期 → 时间戳'}</h3>
        <p className="text-xs text-text-secondary mb-2">{locale === 'en' ? 'Select date and time (local timezone)' : '选择日期和时间（本地时区）'}</p>
        <div className="flex gap-2">
          <input type="datetime-local" value={dateStr} onChange={e => setDateStr(e.target.value)} className="flex-1 p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30" />
          <button onClick={toTs} className="px-4 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90 shrink-0">{locale === 'en' ? 'Convert' : '转换'}</button>
        </div>
        {tsResultSec && (
          <div className="mt-2 space-y-1">
            <div className="p-2 bg-bg rounded-sm border border-[rgba(127,99,21,0.1)] flex items-center justify-between">
              <span className="text-xs text-text-secondary">{locale === 'en' ? 'Seconds' : '秒级'}</span>
              <span className="text-sm text-text-primary font-mono">{tsResultSec}</span>
            </div>
            <div className="p-2 bg-bg rounded-sm border border-[rgba(127,99,21,0.1)] flex items-center justify-between">
              <span className="text-xs text-text-secondary">{locale === 'en' ? 'Milliseconds' : '毫秒级'}</span>
              <span className="text-sm text-text-primary font-mono">{tsResultMs}</span>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-4 text-xs text-text-secondary">
        <button onClick={() => { setTs(String(Math.floor(Date.now() / 1000))); setDateResult('') }} className="hover:text-accent">{locale === 'en' ? 'Now' : '当前时间戳'}</button>
        <button onClick={() => { setDateStr(new Date().toISOString().slice(0, 16)); setTsResultSec(''); setTsResultMs('') }} className="hover:text-accent">{locale === 'en' ? 'Now' : '当前时间'}</button>
      </div>
    </div>
  )
}