'use client'

import { useState, useCallback, useRef } from 'react'
import { useLocale } from 'next-intl'

function formatDateTime(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  const secs = String(d.getSeconds()).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return { date: `${year}-${month}-${day} ${hours}:${mins}:${secs}`, ms }
}

export default function TimestampConverter() {
  const locale = useLocale()
  const [ts, setTs] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [seconds, setSeconds] = useState('0')
  const [dateResult, setDateResult] = useState('')
  const [dateResultMs, setDateResultMs] = useState('')
  const [tsResultSec, setTsResultSec] = useState('')
  const [tsResultMs, setTsResultMs] = useState('')
  const [error, setError] = useState('')
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [animating, setAnimating] = useState(false)

  const toDate = useCallback(() => {
    setError('')
    const raw = parseInt(ts, 10)
    if (isNaN(raw) || ts.trim() === '') { setError(locale === 'en' ? 'Invalid timestamp' : '无效的时间戳'); return }
    // Auto-detect: if < 1e12 (before 2001-09-09 in seconds), treat as seconds, else milliseconds
    const ms = raw < 1e12 ? raw * 1000 : raw
    const d = new Date(ms)
    const fmt = formatDateTime(d)
    setDateResult(fmt.date)
    setDateResultMs(fmt.ms)
  }, [ts, locale])

  const toTs = useCallback(() => {
    setError('')
    if (!dateStr) { setError(locale === 'en' ? 'Please select a date and time' : '请选择日期和时间'); return }
    const sec = Math.min(59, Math.max(0, parseInt(seconds, 10) || 0))
    const d = new Date(dateStr + ':' + String(sec).padStart(2, '0'))
    if (isNaN(d.getTime())) { setError(locale === 'en' ? 'Invalid date' : '无效的日期'); return }
    setTsResultSec(String(Math.floor(d.getTime() / 1000)))
    setTsResultMs(String(d.getTime()))
  }, [dateStr, seconds, locale])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setAnimating(true)
    if (animTimer.current) clearTimeout(animTimer.current)
    animTimer.current = setTimeout(() => setAnimating(false), 400)
  }, [])

  return (
    <div className="mt-6 space-y-6">
      {/* Timestamp → Date */}
      <div className="p-4 bg-surface rounded-sm border border-[rgba(127,99,21,0.15)]">
        <h3 className="text-sm font-medium text-text-primary mb-2">{locale === 'en' ? 'Timestamp → Date' : '时间戳 → 日期'}</h3>
        <p className="text-xs text-text-secondary mb-2">{locale === 'en' ? 'Supports seconds (10 digits) or milliseconds (13 digits)' : '支持秒级（10位）或毫秒级（13位）时间戳'}</p>
        <div className="flex gap-2">
          <input value={ts} onChange={e => setTs(e.target.value)} placeholder="1700000000" className="flex-1 p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/30" />
          <button onClick={toDate} className="px-4 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90 shrink-0">{locale === 'en' ? 'Convert' : '转换'}</button>
        </div>
        {dateResult && (
          <div className="mt-2 p-2 bg-bg rounded-sm border border-[rgba(127,99,21,0.1)]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-primary font-mono">{dateResult}</span>
              <span className="text-xs text-text-secondary/70 font-mono">.{dateResultMs}</span>
            </div>
          </div>
        )}
        <div className="flex gap-2 mt-3">
          <button onClick={() => { const d = new Date(); setTs(String(Math.floor(d.getTime() / 1000))); setDateResult(''); setDateResultMs('') }} className="px-3 py-1.5 bg-accent text-white text-xs rounded-sm hover:opacity-90">
            {locale === 'en' ? '🔄 Now' : '🔄 当前时间戳'}
          </button>
        </div>
      </div>

      {/* Date → Timestamp */}
      <div className="p-4 bg-surface rounded-sm border border-[rgba(127,99,21,0.15)]">
        <h3 className="text-sm font-medium text-text-primary mb-2">{locale === 'en' ? 'Date → Timestamp' : '日期 → 时间戳'}</h3>
        <p className="text-xs text-text-secondary mb-2">{locale === 'en' ? 'Select date, time and seconds (local timezone)' : '选择日期、时间和秒数（本地时区）'}</p>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs text-text-secondary mb-1">{locale === 'en' ? 'Date & time' : '日期时间'}</label>
            <input type="datetime-local" value={dateStr} onChange={e => setDateStr(e.target.value)} className="w-full p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30" />
          </div>
          <div className="w-20">
            <label className="block text-xs text-text-secondary mb-1">{locale === 'en' ? 'Sec' : '秒'}</label>
            <input type="number" min={0} max={59} value={seconds} onChange={e => setSeconds(e.target.value)} placeholder="0" className="w-full p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary text-center focus:outline-none focus:border-accent/30" />
          </div>
          <button onClick={toTs} className="px-4 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90 shrink-0">{locale === 'en' ? 'Convert' : '转换'}</button>
        </div>
        {tsResultSec && (
          <div className="mt-2 space-y-1">
            <div className="p-2 bg-bg rounded-sm border border-[rgba(127,99,21,0.1)] flex items-center justify-between">
              <span className="text-xs text-text-secondary">{locale === 'en' ? 'Seconds (10 digits)' : '秒级（10位）'}</span>
              <span className="text-sm text-text-primary font-mono">{tsResultSec}</span>
            </div>
            <div className="p-2 bg-bg rounded-sm border border-[rgba(127,99,21,0.1)] flex items-center justify-between">
              <span className="text-xs text-text-secondary">{locale === 'en' ? 'Milliseconds (13 digits)' : '毫秒级（13位）'}</span>
              <span className="text-sm text-text-primary font-mono">{tsResultMs}</span>
            </div>
          </div>
        )}
        <div className="flex gap-2 mt-3">
          <button onClick={() => { const d = new Date(); setDateStr(d.toISOString().slice(0, 16)); setSeconds(String(d.getSeconds())); setTsResultSec(''); setTsResultMs('') }} className="px-3 py-1.5 bg-accent text-white text-xs rounded-sm hover:opacity-90">
            {locale === 'en' ? '🔄 Now' : '🔄 当前时间'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}