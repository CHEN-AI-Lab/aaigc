'use client'

import { useState, useCallback } from 'react'
import { useLocale } from 'next-intl'

function pad(n: number, len: number) {
  return String(n).padStart(len, '0')
}

function clamp(v: string, min: number, max: number) {
  const n = parseInt(v, 10)
  return isNaN(n) ? min : Math.max(min, Math.min(max, n))
}

function parseDateTime(date: string, hour: string, min: string, sec: string) {
  if (!date) return null
  const h = clamp(hour, 0, 23)
  const m = clamp(min, 0, 59)
  const s = clamp(sec, 0, 59)
  return new Date(`${date}T${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)}`)
}

export default function DateCalculator() {
  const locale = useLocale()
  const [d1, setD1] = useState({ date: '', h: '0', m: '0', s: '0' })
  const [d2, setD2] = useState({ date: '', h: '0', m: '0', s: '0' })
  const [startDate, setStartDate] = useState('')
  const [days, setDays] = useState('')
  const [diff, setDiff] = useState('')
  const [addResult, setAddResult] = useState('')
  const [error, setError] = useState('')

  const calcDiff = useCallback(() => {
    setError('')
    const dt1 = parseDateTime(d1.date, d1.h, d1.m, d1.s)
    const dt2 = parseDateTime(d2.date, d2.h, d2.m, d2.s)
    if (!dt1 || !dt2 || isNaN(dt1.getTime()) || isNaN(dt2.getTime())) {
      setError(locale === 'en' ? 'Please select both dates' : '请选择两个日期')
      return
    }
    const ms = dt2.getTime() - dt1.getTime()
    const abs = Math.abs(ms)
    const prefix = ms < 0 ? '- ' : ''
    const days = Math.floor(abs / 86400000)
    const hours = Math.floor((abs % 86400000) / 3600000)
    const mins = Math.floor((abs % 3600000) / 60000)
    setDiff(`${prefix}${days} ${locale === 'en' ? 'days' : '天'}, ${hours} ${locale === 'en' ? 'hours' : '小时'}, ${mins} ${locale === 'en' ? 'minutes' : '分钟'}`)
  }, [d1, d2, locale])

  const calcAdd = useCallback(() => {
    setError('')
    if (!startDate) { setError(locale === 'en' ? 'Please select a date' : '请选择日期'); return }
    const d = new Date(startDate)
    if (isNaN(d.getTime())) { setError(locale === 'en' ? 'Invalid date' : '无效的日期'); return }
    const n = parseInt(days, 10)
    if (isNaN(n)) { setError(locale === 'en' ? 'Enter a number of days' : '请输入天数'); return }
    d.setDate(d.getDate() + n)
    setAddResult(d.toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN'))
  }, [startDate, days, locale])

  const updateD1 = (field: string, value: string) => {
    setD1(prev => {
      const next = { ...prev, [field]: field === 'date' ? value : String(clamp(value, 0, 59)) }
      // Clamp hours to 23
      if (field === 'h') next.h = String(clamp(value, 0, 23))
      return next
    })
  }

  const updateD2 = (field: string, value: string) => {
    setD2(prev => {
      const next = { ...prev, [field]: field === 'date' ? value : String(clamp(value, 0, 59)) }
      if (field === 'h') next.h = String(clamp(value, 0, 23))
      return next
    })
  }

  const TimeInputs = ({ prefix, values, onChange }: { prefix: string; values: { h: string; m: string; s: string }; onChange: (field: string, val: string) => void }) => (
    <div className="grid grid-cols-3 gap-1.5">
      <div>
        <label className="block text-[10px] text-text-secondary mb-0.5">HH</label>
        <input type="number" min={0} max={23} value={values.h} onChange={e => onChange('h', e.target.value)} onBlur={() => onChange('h', values.h)}
          className="w-full p-1.5 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-xs text-text-primary text-center focus:outline-none focus:border-accent/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      </div>
      <div>
        <label className="block text-[10px] text-text-secondary mb-0.5">MM</label>
        <input type="number" min={0} max={59} value={values.m} onChange={e => onChange('m', e.target.value)} onBlur={() => onChange('m', values.m)}
          className="w-full p-1.5 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-xs text-text-primary text-center focus:outline-none focus:border-accent/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      </div>
      <div>
        <label className="block text-[10px] text-text-secondary mb-0.5">{locale === 'en' ? 'SS' : '秒'}</label>
        <input type="number" min={0} max={59} value={values.s} onChange={e => onChange('s', e.target.value)} onBlur={() => onChange('s', values.s)}
          className="w-full p-1.5 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-xs text-text-primary text-center focus:outline-none focus:border-accent/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      </div>
    </div>
  )

  return (
    <div className="mt-6 space-y-6">
      <div className="p-4 bg-surface rounded-sm border border-[rgba(127,99,21,0.15)]">
        <h3 className="text-sm font-medium text-text-primary mb-1">{locale === 'en' ? 'Date Difference' : '日期间隔'}</h3>
        <p className="text-xs text-text-secondary mb-3">{locale === 'en' ? 'Calculate the time difference between two dates' : '计算两个日期之间的时间差'}</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1">{locale === 'en' ? 'Start date' : '开始日期'}</label>
            <input type="date" value={d1.date} onChange={e => updateD1('date', e.target.value)} className="w-full p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30" />
            <div className="mt-1.5">
              <TimeInputs prefix="d1" values={{ h: d1.h, m: d1.m, s: d1.s }} onChange={updateD1} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">{locale === 'en' ? 'End date' : '结束日期'}</label>
            <input type="date" value={d2.date} onChange={e => updateD2('date', e.target.value)} className="w-full p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30" />
            <div className="mt-1.5">
              <TimeInputs prefix="d2" values={{ h: d2.h, m: d2.m, s: d2.s }} onChange={updateD2} />
            </div>
          </div>
        </div>
        <button onClick={calcDiff} className="px-4 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90">{locale === 'en' ? 'Calculate' : '计算'}</button>
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
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30" />
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