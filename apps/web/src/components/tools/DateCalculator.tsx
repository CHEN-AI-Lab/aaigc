'use client'

import { useState, useCallback, useRef } from 'react'
import { useLocale } from 'next-intl'

function pad(n: number, len: number) {
  return String(n).padStart(len, '0')
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
        onChange={e => onChange(e.target.value)}
        onBlur={() => {
          const v = value
          if (v === '') { onChange('0'); return }
          const n = parseInt(v, 10)
          if (isNaN(n)) { onChange('0'); return }
          onChange(String(Math.max(min, Math.min(max, n))))
        }}
        className="w-full px-2 py-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary text-center focus:outline-none focus:border-accent/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      {hintFor(field) && (
        <div className="absolute -bottom-4 left-0 right-0 text-[10px] text-red-500 text-center whitespace-nowrap">{hintFor(field)}</div>
      )}
    </div>
  )
}

// ─── DateSelect — module-level, stable component ───
function DateSelect({ year, month, day, onYear, onMonth, onDay, years, months, days }: {
  year: string; month: string; day: string; onYear: (v: string) => void; onMonth: (v: string) => void; onDay: (v: string) => void
  years: number[]; months: number[]; days: number[]
}) {
  return (
    <div className="flex gap-1.5">
      <div className="w-20">
        <select value={year} onChange={e => onYear(e.target.value)} className="w-full px-2 py-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-xs text-text-primary focus:outline-none focus:border-accent/30 cursor-pointer">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="w-16">
        <select value={month} onChange={e => onMonth(e.target.value)} className="w-full px-2 py-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-xs text-text-primary focus:outline-none focus:border-accent/30 cursor-pointer">
          {months.map(m => <option key={m} value={m}>{pad(m, 2)}</option>)}
        </select>
      </div>
      <div className="w-16">
        <select value={day} onChange={e => onDay(e.target.value)} className="w-full px-2 py-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-xs text-text-primary focus:outline-none focus:border-accent/30 cursor-pointer">
          {days.map(d => <option key={d} value={d}>{pad(d, 2)}</option>)}
        </select>
      </div>
    </div>
  )
}

export default function DateCalculator() {
  const locale = useLocale()

  const now = new Date()
  const [d1y, setD1y] = useState(String(now.getFullYear()))
  const [d1m, setD1m] = useState(String(now.getMonth() + 1))
  const [d1d, setD1d] = useState(String(now.getDate()))
  const [d1h, setD1h] = useState('0')
  const [d1min, setD1min] = useState('0')
  const [d1s, setD1s] = useState('0')

  const [d2y, setD2y] = useState(String(now.getFullYear()))
  const [d2m, setD2m] = useState(String(now.getMonth() + 1))
  const [d2d, setD2d] = useState(String(now.getDate()))
  const [d2h, setD2h] = useState('0')
  const [d2min, setD2min] = useState('0')
  const [d2s, setD2s] = useState('0')

  const [addDate, setAddDate] = useState('')
  const [days, setDays] = useState('')

  const [diff, setDiff] = useState('')
  const [addResult, setAddResult] = useState('')
  const [error, setError] = useState('')
  const [hint, setHint] = useState<{ field: string; msg: string } | null>(null)
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const years = Array.from({ length: 69 }, (_, i) => 1970 + i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const d1days = daysInMonth(parseInt(d1y) || 1970, parseInt(d1m) || 1)
  const d2days = daysInMonth(parseInt(d2y) || 1970, parseInt(d2m) || 1)

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
      showHint(field, `${label} ${locale === 'en' ? 'max' : '最大'} ${max}`)
      setter(String(max))
    } else {
      setter(trimmed)
    }
  }, [locale, showHint])

  const calcDiff = useCallback(() => {
    setError('')
    const y1 = parseInt(d1y, 10), m1 = parseInt(d1m, 10), d1 = parseInt(d1d, 10)
    const y2 = parseInt(d2y, 10), m2 = parseInt(d2m, 10), d2 = parseInt(d2d, 10)
    const dt1 = new Date(y1, m1 - 1, d1, parseInt(d1h) || 0, parseInt(d1min) || 0, parseInt(d1s) || 0)
    const dt2 = new Date(y2, m2 - 1, d2, parseInt(d2h) || 0, parseInt(d2min) || 0, parseInt(d2s) || 0)
    if (isNaN(dt1.getTime()) || isNaN(dt2.getTime())) {
      setError(locale === 'en' ? 'Please select both dates' : '请选择两个日期')
      return
    }
    const ms = dt2.getTime() - dt1.getTime()
    const abs = Math.abs(ms)
    const prefix = ms < 0 ? '- ' : ''
    const d = Math.floor(abs / 86400000)
    const h = Math.floor((abs % 86400000) / 3600000)
    const m = Math.floor((abs % 3600000) / 60000)
    setDiff(`${prefix}${d} ${locale === 'en' ? 'days' : '天'}, ${h} ${locale === 'en' ? 'hours' : '小时'}, ${m} ${locale === 'en' ? 'minutes' : '分钟'}`)
  }, [d1y, d1m, d1d, d1h, d1min, d1s, d2y, d2m, d2d, d2h, d2min, d2s, locale])

  const calcAdd = useCallback(() => {
    setError('')
    if (!addDate) { setError(locale === 'en' ? 'Please select a date' : '请选择日期'); return }
    const d = new Date(addDate)
    if (isNaN(d.getTime())) { setError(locale === 'en' ? 'Invalid date' : '无效的日期'); return }
    const n = parseInt(days, 10)
    if (isNaN(n)) { setError(locale === 'en' ? 'Enter a number of days' : '请输入天数'); return }
    d.setDate(d.getDate() + n)
    setAddResult(d.toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN'))
  }, [addDate, days, locale])

  return (
    <div className="mt-6 space-y-6">
      <div className="p-4 bg-surface rounded-sm border border-[rgba(127,99,21,0.15)]">
        <h3 className="text-sm font-medium text-text-primary mb-1">{locale === 'en' ? 'Date Difference' : '日期间隔'}</h3>
        <p className="text-xs text-text-secondary mb-3">{locale === 'en' ? 'Calculate the time difference between two dates' : '计算两个日期之间的时间差'}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1">{locale === 'en' ? 'Start date' : '开始日期'}</label>
            <DateSelect year={d1y} month={d1m} day={d1d} onYear={setD1y} onMonth={setD1m} onDay={setD1d} years={years} months={months} days={Array.from({ length: d1days }, (_, i) => i + 1)} />
            <div className="flex gap-1.5 mt-1">
              <div className="w-14">
                <label className="block text-[10px] text-text-secondary mb-0.5">HH</label>
                <ClampInput value={d1h} onChange={v => clampNow(v, 0, 23, 'd1h', 'HH', setD1h)} min={0} max={23} label="HH" field="d1h" hint={hint} />
              </div>
              <div className="w-14">
                <label className="block text-[10px] text-text-secondary mb-0.5">MM</label>
                <ClampInput value={d1min} onChange={v => clampNow(v, 0, 59, 'd1m', 'MM', setD1min)} min={0} max={59} label="MM" field="d1m" hint={hint} />
              </div>
              <div className="w-14">
                <label className="block text-[10px] text-text-secondary mb-0.5">{locale === 'en' ? 'SS' : '秒'}</label>
                <ClampInput value={d1s} onChange={v => clampNow(v, 0, 59, 'd1s', locale === 'en' ? 'Sec' : '秒', setD1s)} min={0} max={59} label={locale === 'en' ? 'Sec' : '秒'} field="d1s" hint={hint} />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">{locale === 'en' ? 'End date' : '结束日期'}</label>
            <DateSelect year={d2y} month={d2m} day={d2d} onYear={setD2y} onMonth={setD2m} onDay={setD2d} years={years} months={months} days={Array.from({ length: d2days }, (_, i) => i + 1)} />
            <div className="flex gap-1.5 mt-1">
              <div className="w-14">
                <label className="block text-[10px] text-text-secondary mb-0.5">HH</label>
                <ClampInput value={d2h} onChange={v => clampNow(v, 0, 23, 'd2h', 'HH', setD2h)} min={0} max={23} label="HH" field="d2h" hint={hint} />
              </div>
              <div className="w-14">
                <label className="block text-[10px] text-text-secondary mb-0.5">MM</label>
                <ClampInput value={d2min} onChange={v => clampNow(v, 0, 59, 'd2m', 'MM', setD2min)} min={0} max={59} label="MM" field="d2m" hint={hint} />
              </div>
              <div className="w-14">
                <label className="block text-[10px] text-text-secondary mb-0.5">{locale === 'en' ? 'SS' : '秒'}</label>
                <ClampInput value={d2s} onChange={v => clampNow(v, 0, 59, 'd2s', locale === 'en' ? 'Sec' : '秒', setD2s)} min={0} max={59} label={locale === 'en' ? 'Sec' : '秒'} field="d2s" hint={hint} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={calcDiff} className="px-4 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90">{locale === 'en' ? 'Calculate' : '计算'}</button>
          <button onClick={() => { const d = new Date(); setD1y(String(d.getFullYear())); setD1m(String(d.getMonth() + 1)); setD1d(String(d.getDate())); setD1h('0'); setD1min('0'); setD1s('0'); setD2y(String(d.getFullYear())); setD2m(String(d.getMonth() + 1)); setD2d(String(d.getDate())); setD2h('0'); setD2min('0'); setD2s('0'); setDiff('') }} className="px-3 py-2 bg-accent text-white text-xs rounded-sm hover:opacity-90">
            🔄 {locale === 'en' ? 'Today' : '今天'}
          </button>
        </div>

        {diff && (
          <div className="mt-2 p-2 bg-bg rounded-sm border border-[rgba(127,99,21,0.1)]">
            <p className="text-sm text-text-primary">{diff}</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-surface rounded-sm border border-[rgba(127,99,21,0.15)]">
        <h3 className="text-sm font-medium text-text-primary mb-1">{locale === 'en' ? 'Add / Subtract Days' : '日期加减'}</h3>
        <p className="text-xs text-text-secondary mb-3">{locale === 'en' ? 'Add or subtract days from a date' : '在指定日期上加减天数'}</p>
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <label className="block text-xs text-text-secondary mb-1">{locale === 'en' ? 'Date' : '日期'}</label>
            <input type="date" value={addDate} onChange={e => setAddDate(e.target.value)} className="w-full p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30" />
          </div>
          <div className="w-28">
            <label className="block text-xs text-text-secondary mb-1">{locale === 'en' ? 'Days' : '天数'}</label>
            <input type="number" value={days} onChange={e => setDays(e.target.value)} placeholder={locale === 'en' ? 'Days' : '天数'} className="w-full p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary text-center focus:outline-none focus:border-accent/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          </div>
        </div>
        <button onClick={calcAdd} className="px-4 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90">{locale === 'en' ? 'Calculate' : '计算'}</button>
        {addResult && (
          <div className="mt-2 p-2 bg-bg rounded-sm border border-[rgba(127,99,21,0.1)]">
            <p className="text-sm text-text-primary">{locale === 'en' ? 'Result' : '结果'}: {addResult}</p>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}