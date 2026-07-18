'use client'

import { useState, useCallback, useRef } from 'react'
import { useLocale } from 'next-intl'

function pad(n: number, len: number) {
  return String(n).padStart(len, '0')
}

function formatDateTime(d: Date) {
  const year = d.getFullYear()
  const month = pad(d.getMonth() + 1, 2)
  const day = pad(d.getDate(), 2)
  const hours = pad(d.getHours(), 2)
  const mins = pad(d.getMinutes(), 2)
  const secs = pad(d.getSeconds(), 2)
  const ms = pad(d.getMilliseconds(), 3)
  return `${year}-${month}-${day} ${hours}:${mins}:${secs}.${ms}`
}

export default function TimestampConverter() {
  const locale = useLocale()
  const [ts, setTs] = useState('')
  const [tsDate, setTsDate] = useState('')
  const [tsHour, setTsHour] = useState('12')
  const [tsMin, setTsMin] = useState('0')
  const [tsSec, setTsSec] = useState('0')
  const [tsMs, setTsMs] = useState('0')
  const [dateResult, setDateResult] = useState('')
  const [tsResultSec, setTsResultSec] = useState('')
  const [tsResultMs, setTsResultMs] = useState('')
  const [error, setError] = useState('')
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [animating, setAnimating] = useState(false)

  const clamp = (v: string, min: number, max: number) => {
    const n = parseInt(v, 10)
    return isNaN(n) ? min : Math.max(min, Math.min(max, n))
  }

  const toDate = useCallback(() => {
    setError('')
    const raw = parseInt(ts, 10)
    if (isNaN(raw) || ts.trim() === '') { setError(locale === 'en' ? 'Invalid timestamp' : '无效的时间戳'); return }
    const ms = raw < 1e12 ? raw * 1000 : raw
    const d = new Date(ms)
    setDateResult(formatDateTime(d))
  }, [ts, locale])

  const toTs = useCallback(() => {
    setError('')
    if (!tsDate) { setError(locale === 'en' ? 'Please select a date' : '请选择日期'); return }
    const h = clamp(tsHour, 0, 23)
    const m = clamp(tsMin, 0, 59)
    const s = clamp(tsSec, 0, 59)
    const ms = clamp(tsMs, 0, 999)
    setTsHour(String(h))
    setTsMin(String(m))
    setTsSec(String(s))
    setTsMs(String(ms))
    const d = new Date(`${tsDate}T${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)}.${pad(ms, 3)}`)
    if (isNaN(d.getTime())) { setError(locale === 'en' ? 'Invalid date' : '无效的日期'); return }
    setTsResultSec(String(Math.floor(d.getTime() / 1000)))
    setTsResultMs(String(d.getTime()))
  }, [tsDate, tsHour, tsMin, tsSec, tsMs, locale])

  return (
    <div className="mt-6 space-y-6">
      {/* Timestamp → Date */}
      <div className="p-4 bg-surface rounded-sm border border-[rgba(127,99,21,0.15)]">
        <h3 className="text-sm font-medium text-text-primary mb-2">{locale === 'en' ? 'Timestamp → Date' : '时间戳 → 日期'}</h3>
        <p className="text-xs text-text-secondary mb-2">{locale === 'en' ? 'Supports seconds (10 digits) or milliseconds (13 digits)' : '支持秒级（10位）或毫秒级（13位）时间戳'}</p>
        <div className="flex gap-2">
          <input value={ts} onChange={e => setTs(e.target.value)} placeholder="1700000000" className="flex-1 p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/30 font-mono" />
          <button onClick={toDate} className="px-4 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90 shrink-0">{locale === 'en' ? 'Convert' : '转换'}</button>
        </div>
        {dateResult && (
          <div className="mt-2 p-2 bg-bg rounded-sm border border-[rgba(127,99,21,0.1)]">
            <p className="text-sm text-text-primary font-mono">{dateResult}</p>
          </div>
        )}
        <div className="flex gap-2 mt-3">
          <button onClick={() => { const d = new Date(); setTs(String(Math.floor(d.getTime() / 1000))); setDateResult('') }} className="px-3 py-1.5 bg-accent text-white text-xs rounded-sm hover:opacity-90">
            🔄 {locale === 'en' ? 'Now' : '当前时间戳'}
          </button>
        </div>
      </div>

      {/* Date → Timestamp */}
      <div className="p-4 bg-surface rounded-sm border border-[rgba(127,99,21,0.15)]">
        <h3 className="text-sm font-medium text-text-primary mb-2">{locale === 'en' ? 'Date → Timestamp' : '日期 → 时间戳'}</h3>
        <p className="text-xs text-text-secondary mb-2">{locale === 'en' ? 'Select date, time and milliseconds (local timezone)' : '选择日期、时间和毫秒（本地时区）'}</p>
        <div className="space-y-2">
          {/* Date */}
          <div>
            <label className="block text-xs text-text-secondary mb-1">{locale === 'en' ? 'Date' : '日期'}</label>
            <input type="date" value={tsDate} onChange={e => setTsDate(e.target.value)} className="w-full p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30" />
          </div>
          {/* Time row */}
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-xs text-text-secondary mb-1">HH</label>
              <input type="number" min={0} max={23} value={tsHour} onChange={e => setTsHour(e.target.value)} onBlur={() => setTsHour(String(clamp(tsHour, 0, 23)))} className="w-full p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary text-center focus:outline-none focus:border-accent/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">MM</label>
              <input type="number" min={0} max={59} value={tsMin} onChange={e => setTsMin(e.target.value)} onBlur={() => setTsMin(String(clamp(tsMin, 0, 59)))} className="w-full p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary text-center focus:outline-none focus:border-accent/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">{locale === 'en' ? 'SS' : '秒'}</label>
              <input type="number" min={0} max={59} value={tsSec} onChange={e => setTsSec(e.target.value)} onBlur={() => setTsSec(String(clamp(tsSec, 0, 59)))} className="w-full p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary text-center focus:outline-none focus:border-accent/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">{locale === 'en' ? 'MS' : '毫秒'}</label>
              <input type="number" min={0} max={999} value={tsMs} onChange={e => setTsMs(e.target.value)} onBlur={() => setTsMs(String(clamp(tsMs, 0, 999)))} className="w-full p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary text-center focus:outline-none focus:border-accent/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>
          </div>
          <button onClick={toTs} className="px-4 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90">{locale === 'en' ? 'Convert' : '转换'}</button>
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
          <button onClick={() => { const d = new Date(); setTsDate(d.toISOString().slice(0, 10)); setTsHour(String(d.getHours())); setTsMin(String(d.getMinutes())); setTsSec(String(d.getSeconds())); setTsMs(String(d.getMilliseconds())); setTsResultSec(''); setTsResultMs('') }} className="px-3 py-1.5 bg-accent text-white text-xs rounded-sm hover:opacity-90">
            🔄 {locale === 'en' ? 'Now' : '当前时间'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}