'use client'

import { useState, useCallback } from 'react'
import { useLocale } from 'next-intl'

export default function DateCalculator() {
  const locale = useLocale()
  const [date1, setDate1] = useState('')
  const [date2, setDate2] = useState('')
  const [diff, setDiff] = useState('')
  const [startDate, setStartDate] = useState('')
  const [days, setDays] = useState('')
  const [addResult, setAddResult] = useState('')
  const [error, setError] = useState('')

  const calcDiff = useCallback(() => {
    setError('')
    const d1 = new Date(date1), d2 = new Date(date2)
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      setError(locale === 'en' ? 'Invalid date' : '无效的日期')
      return
    }
    const ms = Math.abs(d2.getTime() - d1.getTime())
    const days = Math.floor(ms / 86400000)
    const hours = Math.floor((ms % 86400000) / 3600000)
    const mins = Math.floor((ms % 3600000) / 60000)
    setDiff(`${days} ${locale === 'en' ? 'days' : '天'}, ${hours} ${locale === 'en' ? 'hours' : '小时'}, ${mins} ${locale === 'en' ? 'minutes' : '分钟'}`)
  }, [date1, date2, locale])

  const calcAdd = useCallback(() => {
    setError('')
    const d = new Date(startDate)
    if (isNaN(d.getTime())) { setError(locale === 'en' ? 'Invalid date' : '无效的日期'); return }
    const n = parseInt(days, 10)
    if (isNaN(n)) { setError(locale === 'en' ? 'Invalid days' : '无效的天数'); return }
    d.setDate(d.getDate() + n)
    setAddResult(d.toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN'))
  }, [startDate, days, locale])

  return (
    <div className="mt-6 space-y-6">
      <div className="p-4 bg-surface rounded-sm">
        <h3 className="text-sm font-medium text-text-primary mb-3">{locale === 'en' ? 'Date Difference' : '日期间隔'}</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <input type="date" value={date1} onChange={e => setDate1(e.target.value)} className="p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30" />
          <input type="date" value={date2} onChange={e => setDate2(e.target.value)} className="p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30" />
        </div>
        <button onClick={calcDiff} className="px-4 py-2 bg-dark text-white text-sm rounded-sm hover:opacity-90">{locale === 'en' ? 'Calculate' : '计算'}</button>
        {diff && <p className="mt-2 text-sm text-text-primary">{diff}</p>}
      </div>

      <div className="p-4 bg-surface rounded-sm">
        <h3 className="text-sm font-medium text-text-primary mb-3">{locale === 'en' ? 'Add / Subtract Days' : '日期加减'}</h3>
        <div className="flex gap-2 mb-3">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30" />
          <input type="number" value={days} onChange={e => setDays(e.target.value)} placeholder={locale === 'en' ? 'Days' : '天数'} className="w-24 p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary text-center focus:outline-none focus:border-accent/30" />
        </div>
        <button onClick={calcAdd} className="px-4 py-2 bg-dark text-white text-sm rounded-sm hover:opacity-90">{locale === 'en' ? 'Calculate' : '计算'}</button>
        {addResult && <p className="mt-2 text-sm text-text-primary">{addResult}</p>}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}