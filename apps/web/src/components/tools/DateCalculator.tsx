'use client'

import { useState, useCallback, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'

function pad(n: number, len: number) {
  return String(n).padStart(len, '0')
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate()
}

// ─── ClampInput — module-level ───
function ClampInput({ value, onChange, min, max, label: _label, field, hint }: {
  value: string; onChange: (v: string) => void; min: number; max: number; label: string; field: string; hint: { field: string; msg: string } | null
}) {
  const hintFor = (f: string) => hint?.field === f ? hint.msg : null
  return (
    <div className="relative">
      <input type="number" min={min} max={max} value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={() => {
          const v = value
          if (v === '') { onChange('0'); return }
          const n = parseInt(v, 10)
          if (isNaN(n)) { onChange('0'); return }
          onChange(String(Math.max(min, Math.min(max, n))))
        }}
        className="w-full px-2 py-2 bg-bg border border-border rounded-sm text-sm text-text-primary text-center focus:outline-none focus:border-accent/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      {hintFor(field) && (
        <div className="absolute -bottom-4 left-0 right-0 text-[10px] text-red-500 text-center whitespace-nowrap">{hintFor(field)}</div>
      )}
    </div>
  )
}

// ─── DateSelect — module-level ───
function DateSelect({ year, month, day, onYear, onMonth, onDay, years, months, days }: {
  year: string; month: string; day: string; onYear: (v: string) => void; onMonth: (v: string) => void; onDay: (v: string) => void
  years: number[]; months: number[]; days: number[]
}) {
  return (
    <div className="flex gap-1.5">
      <div className="w-20">
        <select value={year} onChange={e => onYear(e.target.value)} className="w-full px-2 py-2 bg-bg border border-border rounded-sm text-xs text-text-primary focus:outline-none focus:border-accent/30 cursor-pointer">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="w-16">
        <select value={month} onChange={e => onMonth(e.target.value)} className="w-full px-2 py-2 bg-bg border border-border rounded-sm text-xs text-text-primary focus:outline-none focus:border-accent/30 cursor-pointer">
          {months.map(m => <option key={m} value={m}>{pad(m, 2)}</option>)}
        </select>
      </div>
      <div className="w-16">
        <select value={day} onChange={e => onDay(e.target.value)} className="w-full px-2 py-2 bg-bg border border-border rounded-sm text-xs text-text-primary focus:outline-none focus:border-accent/30 cursor-pointer">
          {days.map(d => <option key={d} value={d}>{pad(d, 2)}</option>)}
        </select>
      </div>
    </div>
  )
}

export default function DateCalculator() {
  const locale = useLocale()
  const t = useTranslations('tools')

  const now = new Date()
  // Date difference - start
  const [d1y, setD1y] = useState(String(now.getFullYear()))
  const [d1m, setD1m] = useState(String(now.getMonth() + 1))
  const [d1d, setD1d] = useState(String(now.getDate()))
  const [d1h, setD1h] = useState('0')
  const [d1min, setD1min] = useState('0')
  const [d1s, setD1s] = useState('0')

  // Date difference - end
  const [d2y, setD2y] = useState(String(now.getFullYear()))
  const [d2m, setD2m] = useState(String(now.getMonth() + 1))
  const [d2d, setD2d] = useState(String(now.getDate()))
  const [d2h, setD2h] = useState('0')
  const [d2min, setD2min] = useState('0')
  const [d2s, setD2s] = useState('0')

  // Add/Subtract
  const [addY, setAddY] = useState(String(now.getFullYear()))
  const [addM, setAddM] = useState(String(now.getMonth() + 1))
  const [addD, setAddD] = useState(String(now.getDate()))
  const [addDays, setAddDays] = useState('')

  const [diff, setDiff] = useState('')
  const [addResult, setAddResult] = useState('')
  const [error, setError] = useState('')
  const [hint, setHint] = useState<{ field: string; msg: string } | null>(null)
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const years = Array.from({ length: 201 }, (_, i) => 1900 + i) // 1900-2100
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const d1days = daysInMonth(parseInt(d1y) || 1970, parseInt(d1m) || 1)
  const d2days = daysInMonth(parseInt(d2y) || 1970, parseInt(d2m) || 1)
  const addDaysMax = daysInMonth(parseInt(addY) || 1970, parseInt(addM) || 1)

  const showHint = useCallback((field: string, msg: string) => {
    setHint({ field, msg })
    if (hintTimer.current) clearTimeout(hintTimer.current)
    hintTimer.current = setTimeout(() => setHint(null), 2000)
  }, [])

  const clampNow = useCallback((v: string, min: number, max: number, field: string, label: string, setter: (v: string) => void) => {
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
  }, [showHint, t])

  const calcDiff = useCallback(() => {
    setError('')
    const dt1 = new Date(parseInt(d1y), parseInt(d1m) - 1, parseInt(d1d), parseInt(d1h) || 0, parseInt(d1min) || 0, parseInt(d1s) || 0)
    const dt2 = new Date(parseInt(d2y), parseInt(d2m) - 1, parseInt(d2d), parseInt(d2h) || 0, parseInt(d2min) || 0, parseInt(d2s) || 0)
    if (isNaN(dt1.getTime()) || isNaN(dt2.getTime())) {
      setError(t('pleaseSelectBothDates'))
      return
    }
    const ms = dt2.getTime() - dt1.getTime()
    const abs = Math.abs(ms)
    const prefix = ms < 0 ? '- ' : ''
    const d = Math.floor(abs / 86400000)
    const h = Math.floor((abs % 86400000) / 3600000)
    const m = Math.floor((abs % 3600000) / 60000)
    setDiff(`${prefix}${d} ${t('days')}, ${h} ${t('hours')}, ${m} ${t('minutes')}`)
  }, [d1y, d1m, d1d, d1h, d1min, d1s, d2y, d2m, d2d, d2h, d2min, d2s, t])

  const calcAdd = useCallback(() => {
    setError('')
    const d = new Date(parseInt(addY), parseInt(addM) - 1, parseInt(addD))
    if (isNaN(d.getTime())) { setError(t('invalidDate')); return }
    const n = parseInt(addDays, 10)
        if (isNaN(n)) { setError(t('enterNumberOfDays')); return }
    d.setDate(d.getDate() + n)
    setAddResult(d.toLocaleDateString(locale === 'ja' ? 'ja-JP' : locale === 'en' ? 'en-US' : 'zh-CN'))
  }, [addY, addM, addD, addDays, locale, t])

  const todayBtn = (setters: { y: (v: string) => void; m: (v: string) => void; d: (v: string) => void; h?: (v: string) => void; min?: (v: string) => void; s?: (v: string) => void }) => {
    const d = new Date()
    setters.y(String(d.getFullYear()))
    setters.m(String(d.getMonth() + 1))
    setters.d(String(d.getDate()))
    if (setters.h) setters.h('0')
    if (setters.min) setters.min('0')
    if (setters.s) setters.s('0')
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="p-4 bg-surface rounded-sm border border-border">
        <h3 className="text-sm font-medium text-text-primary mb-1">{t('dateDifference')}</h3>
        <p className="text-xs text-text-secondary mb-3">{t('calculateDiffDesc')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
          {/* Start date — all on one row */}
          <div>
            <label className="block text-xs text-text-secondary mb-1">
              {t('startDate')}
              <button onClick={() => { todayBtn({ y: setD1y, m: setD1m, d: setD1d, h: setD1h, min: setD1min, s: setD1s }); setDiff('') }} className="ml-1.5 text-[10px] text-accent hover:underline">{t('today')}</button>
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              <DateSelect year={d1y} month={d1m} day={d1d} onYear={setD1y} onMonth={setD1m} onDay={setD1d} years={years} months={months} days={Array.from({ length: d1days }, (_, i) => i + 1)} />
              <div className="w-px h-6 bg-[rgba(127,99,21,0.15)]" />
              <div className="flex gap-1">
                <div className="w-12">
                  <ClampInput value={d1h} onChange={v => clampNow(v, 0, 23, 'd1h', 'HH', setD1h)} min={0} max={23} label="HH" field="d1h" hint={hint} />
                </div>
                <div className="w-12">
                  <ClampInput value={d1min} onChange={v => clampNow(v, 0, 59, 'd1m', 'MM', setD1min)} min={0} max={59} label="MM" field="d1m" hint={hint} />
                </div>
                <div className="w-12">
                  <ClampInput value={d1s} onChange={v => clampNow(v, 0, 59, 'd1s', t('seconds'), setD1s)} min={0} max={59} label={t('seconds')} field="d1s" hint={hint} />
                </div>
              </div>
            </div>
          </div>

          {/* End date — all on one row */}
          <div>
            <label className="block text-xs text-text-secondary mb-1">
              {t('endDate')}
              <button onClick={() => { todayBtn({ y: setD2y, m: setD2m, d: setD2d, h: setD2h, min: setD2min, s: setD2s }); setDiff('') }} className="ml-1.5 text-[10px] text-accent hover:underline">{t('today')}</button>
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              <DateSelect year={d2y} month={d2m} day={d2d} onYear={setD2y} onMonth={setD2m} onDay={setD2d} years={years} months={months} days={Array.from({ length: d2days }, (_, i) => i + 1)} />
              <div className="w-px h-6 bg-[rgba(127,99,21,0.15)]" />
              <div className="flex gap-1">
                <div className="w-12">
                  <ClampInput value={d2h} onChange={v => clampNow(v, 0, 23, 'd2h', 'HH', setD2h)} min={0} max={23} label="HH" field="d2h" hint={hint} />
                </div>
                <div className="w-12">
                  <ClampInput value={d2min} onChange={v => clampNow(v, 0, 59, 'd2m', 'MM', setD2min)} min={0} max={59} label="MM" field="d2m" hint={hint} />
                </div>
                <div className="w-12">
                  <ClampInput value={d2s} onChange={v => clampNow(v, 0, 59, 'd2s', t('seconds'), setD2s)} min={0} max={59} label={t('seconds')} field="d2s" hint={hint} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <button onClick={calcDiff} className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90">{t('calculate')}</button>

        {diff && (
          <div className="mt-2 p-2 bg-bg rounded-sm border border-[rgba(127,99,21,0.1)]">
            <p className="text-sm text-text-primary">{diff}</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-surface rounded-sm border border-border">
        <h3 className="text-sm font-medium text-text-primary mb-1">{t('addSubtractDays')}</h3>
        <p className="text-xs text-text-secondary mb-3">{t('addDaysDesc')}</p>
        <div className="flex flex-wrap gap-2 mb-3 items-end">
          <div>
            <label className="block text-[10px] text-text-secondary mb-0.5">
              {t('date')}
              <button onClick={() => { const d = new Date(); setAddY(String(d.getFullYear())); setAddM(String(d.getMonth() + 1)); setAddD(String(d.getDate())); setAddResult('') }} className="ml-1.5 text-[10px] text-accent hover:underline">{t('today')}</button>
            </label>
            <div className="flex items-center gap-1.5">
              <DateSelect year={addY} month={addM} day={addD} onYear={setAddY} onMonth={setAddM} onDay={setAddD} years={years} months={months} days={Array.from({ length: addDaysMax }, (_, i) => i + 1)} />
            </div>
          </div>
          <div className="w-24">
            <label className="block text-[10px] text-text-secondary mb-0.5">{t('days')}</label>
            <input type="number" value={addDays} onChange={e => setAddDays(e.target.value)} placeholder={t('days')} className="w-full p-2 bg-bg border border-border rounded-sm text-sm text-text-primary text-center focus:outline-none focus:border-accent/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          </div>
        </div>
        <button onClick={calcAdd} className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90">{t('calculate')}</button>
        {addResult && (
          <div className="mt-2 p-2 bg-bg rounded-sm border border-[rgba(127,99,21,0.1)]">
            <p className="text-sm text-text-primary">{t('result')}: {addResult}</p>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}