'use client'

import { useState, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'

function pad(n: number, len: number) {
  return String(n).padStart(len, '0')
}

function formatDateTime(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)} ${pad(d.getHours(), 2)}:${pad(d.getMinutes(), 2)}:${pad(d.getSeconds(), 2)}.${pad(d.getMilliseconds(), 3)}`
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate()
}

// ─── ClampInput — module-level, stable component ───
function ClampInput({ value, onChange, min, max, label, field, hint }: {
  value: string; onChange: (v: string) => void; min: number; max: number; label: string; field: string; hint: { field: string; msg: string } | null
}) {
  const hintFor = (f: string) => hint?.field === f ? hint.msg : null
  return (
    <div className="relative">
      <input type="number" min={min} max={max} value={value}
        onChange={e => {
          const v = e.target.value
          onChange(v)
        }}
        onBlur={() => {
          if (value === '') { onChange('0'); return }
          const trimmed = value.replace(/^0+/, '') || '0'
          const n = parseInt(trimmed, 10)
          if (n > max) { onChange(String(max)) }
          else if (n < min) { onChange(String(min)) }
          else { onChange(trimmed) }
        }}
        className="w-full px-2 py-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary text-center focus:outline-none focus:border-accent/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      {hintFor(field) && (
        <div className="absolute -bottom-4 left-0 right-0 text-[10px] text-red-500 text-center whitespace-nowrap">{hintFor(field)}</div>
      )}
    </div>
  )
}

export default function TimestampConverter() {
  const t = useTranslations('tools')
  const [ts, setTs] = useState('')
  const [dateResult, setDateResult] = useState('')
  const [tsResultSec, setTsResultSec] = useState('')
  const [tsResultMs, setTsResultMs] = useState('')
  const [error, setError] = useState('')
  const [hint, setHint] = useState<{ field: string; msg: string } | null>(null)
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const now = new Date()
  const [year, setYear] = useState(String(now.getFullYear()))
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [day, setDay] = useState(String(now.getDate()))
  const [hh, setHh] = useState('12')
  const [mm, setMm] = useState('0')
  const [ss, setSs] = useState('0')
  const [ms, setMs] = useState('0')

  const showHint = useCallback((field: string, msg: string) => {
    setHint({ field, msg })
    if (hintTimer.current) clearTimeout(hintTimer.current)
    hintTimer.current = setTimeout(() => setHint(null), 2000)
  }, [])

  const clampNow = useCallback((v: string, min: number, max: number, field: string, label: string, setter: (v: string) => void) => {
    // Allow empty string while editing
    if (v === '') { setter(''); return }
    const trimmed = v.replace(/^0+/, '') || '0'
    const n = parseInt(trimmed, 10)
    if (isNaN(n)) { setter(''); return }
    if (n > max) {
      showHint(field, `${label} ${t('max')} ${max}`)
      setter(String(max))
    } else {
      setter(trimmed)
    }
  }, [t, showHint])

  const toDate = useCallback(() => {
    setError('')
    const raw = parseInt(ts, 10)
    if (isNaN(raw) || ts.trim() === '') { setError(t('invalidTimestamp')); return }
    const msv = raw < 1e12 ? raw * 1000 : raw
    setDateResult(formatDateTime(new Date(msv)))
  }, [ts, t])

  const toTs = useCallback(() => {
    setError('')
    const y = parseInt(year, 10) || 1970
    const mo = parseInt(month, 10) || 1
    const d = parseInt(day, 10) || 1
    const h = parseInt(hh, 10) || 0
    const mi = parseInt(mm, 10) || 0
    const s = parseInt(ss, 10) || 0
    const msv = parseInt(ms, 10) || 0
    const dt = new Date(y, mo - 1, d, h, mi, s, msv)
    if (isNaN(dt.getTime())) { setError(t('invalidDate')); return }
    setTsResultSec(String(Math.floor(dt.getTime() / 1000)))
    setTsResultMs(String(dt.getTime()))
  }, [year, month, day, hh, mm, ss, ms, t])

  const years = Array.from({ length: 201 }, (_, i) => 1900 + i) // 1900-2100
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const maxDays = daysInMonth(parseInt(year) || 1970, parseInt(month) || 1)
  const days = Array.from({ length: maxDays }, (_, i) => i + 1)

  return (
    <div className="mt-6 space-y-6">
      {/* Timestamp → Date */}
      <div className="p-4 bg-surface rounded-sm border border-[rgba(127,99,21,0.15)]">
        <h3 className="text-sm font-medium text-text-primary mb-2">{t('timestampToDate')}</h3>
        <p className="text-xs text-text-secondary mb-2">{t('supportsTimestamp')}</p>
        <div className="flex gap-2">
          <input value={ts} onChange={e => setTs(e.target.value)} placeholder="1700000000" className="flex-1 p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/30 font-mono" />
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={toDate} className="px-4 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90">{t('convert')}</button>
          <button onClick={() => { const d = new Date(); setTs(String(d.getTime())); setDateResult('') }} className="px-3 py-2 bg-accent text-white text-xs rounded-sm hover:opacity-90">
            🔄 {t('now')}
          </button>
        </div>
        {dateResult && (
          <div className="mt-2 p-2 bg-bg rounded-sm border border-[rgba(127,99,21,0.1)]">
            <p className="text-sm text-text-primary font-mono">{dateResult}</p>
          </div>
        )}
      </div>

      {/* Date → Timestamp */}
      <div className="p-4 bg-surface rounded-sm border border-[rgba(127,99,21,0.15)]">
        <h3 className="text-sm font-medium text-text-primary mb-2">{t('dateToTimestamp')}</h3>
        <p className="text-xs text-text-secondary mb-3">{t('selectDateTime')}</p>

        {/* All fields in one row */}
        <div className="flex flex-wrap items-end gap-2 mb-3">
          {/* Year */}
          <div className="w-20">
            <label className="block text-[10px] text-text-secondary mb-0.5">{t('year')}</label>
            <select value={year} onChange={e => setYear(e.target.value)} className="w-full px-2 py-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-xs text-text-primary focus:outline-none focus:border-accent/30 cursor-pointer">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {/* Month */}
          <div className="w-16">
            <label className="block text-[10px] text-text-secondary mb-0.5">{t('month')}</label>
            <select value={month} onChange={e => setMonth(e.target.value)} className="w-full px-2 py-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-xs text-text-primary focus:outline-none focus:border-accent/30 cursor-pointer">
              {months.map(m => <option key={m} value={m}>{pad(m, 2)}</option>)}
            </select>
          </div>
          {/* Day */}
          <div className="w-16">
            <label className="block text-[10px] text-text-secondary mb-0.5">{t('day')}</label>
            <select value={day} onChange={e => setDay(e.target.value)} className="w-full px-2 py-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-xs text-text-primary focus:outline-none focus:border-accent/30 cursor-pointer">
              {days.map(d => <option key={d} value={d}>{pad(d, 2)}</option>)}
            </select>
          </div>

          {/* Spacer */}
          <div className="w-px h-8 bg-[rgba(127,99,21,0.15)] self-center" />

          {/* HH */}
          <div className="w-14">
            <label className="block text-[10px] text-text-secondary mb-0.5">HH</label>
            <ClampInput value={hh} onChange={v => clampNow(v, 0, 23, 'hh', 'HH', setHh)} min={0} max={23} label="HH" field="hh" hint={hint} />
          </div>
          {/* MM */}
          <div className="w-14">
            <label className="block text-[10px] text-text-secondary mb-0.5">MM</label>
            <ClampInput value={mm} onChange={v => clampNow(v, 0, 59, 'mm', 'MM', setMm)} min={0} max={59} label="MM" field="mm" hint={hint} />
          </div>
          {/* SS */}
          <div className="w-14">
            <label className="block text-[10px] text-text-secondary mb-0.5">{t('ss')}</label>
            <ClampInput value={ss} onChange={v => clampNow(v, 0, 59, 'ss', t('seconds'), setSs)} min={0} max={59} label={t('seconds')} field="ss" hint={hint} />
          </div>
          {/* MS */}
          <div className="w-16">
            <label className="block text-[10px] text-text-secondary mb-0.5">{t('ms')}</label>
            <ClampInput value={ms} onChange={v => clampNow(v, 0, 999, 'ms', t('ms'), setMs)} min={0} max={999} label={t('ms')} field="ms" hint={hint} />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={toTs} className="px-4 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90">{t('convert')}</button>
          <button onClick={() => { const d = new Date(); setYear(String(d.getFullYear())); setMonth(String(d.getMonth() + 1)); setDay(String(d.getDate())); setHh(String(d.getHours())); setMm(String(d.getMinutes())); setSs(String(d.getSeconds())); setMs(String(d.getMilliseconds())); setTsResultSec(''); setTsResultMs('') }} className="px-3 py-2 bg-accent text-white text-xs rounded-sm hover:opacity-90">
            🔄 {t('now')}
          </button>
        </div>

        {tsResultSec && (
          <div className="mt-2 space-y-1">
            <div className="p-2 bg-bg rounded-sm border border-[rgba(127,99,21,0.1)] flex items-center justify-between">
              <span className="text-xs text-text-secondary">{t('secondsLabel')}</span>
              <span className="text-sm text-text-primary font-mono">{tsResultSec}</span>
            </div>
            <div className="p-2 bg-bg rounded-sm border border-[rgba(127,99,21,0.1)] flex items-center justify-between">
              <span className="text-xs text-text-secondary">{t('millisecondsLabel')}</span>
              <span className="text-sm text-text-primary font-mono">{tsResultMs}</span>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}