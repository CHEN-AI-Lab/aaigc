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
    if (!date1 || !date2 || isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      setError(locale === 'en' ? 'Please select both dates' : '请选择两个日期')
      return
    }
    const ms = d2.getTime() - d1.getTime()
    const abs = Math.abs(ms)
    const prefix = ms < 0 ? '- ' : ''
    const days = Math.floor(abs / 86400000)
    const hours = Math.floor((abs % 86400000) / 3600000)
    const mins = Math.floor((abs % 3600000) / 60000)
    setDiff(`${prefix}${days} ${locale === 'en' ? 'days' : '天'}, ${hours} ${locale === 'en' ? 'hours' : '小时'}, ${mins} ${locale === 'en' ? 'minutes' : '分钟'}`)
  }, [date1, date2, locale])

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

  return (
    <div className="mt-6 space-y-6">
      <div className="p-4 bg-surface rounded-sm">
        <h3 className="text-sm font-medium text-text-primary mb-1">{locale === 'en' ? 'Date Difference' : '日期间隔'}</h3>
        <p className="text-xs text-text-secondary mb-3">{locale === 'en' ? 'Calculate the time difference between two dates' : '计算两个日期之间的时间差'}</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1">{locale === 'en' ? 'Start date' : '开始日期'}</label>
            <input type="datetime-local" value={date1} onChange={e => setDate1(e.target.value)} className="w-full p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30" />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">{locale === 'en' ? 'End date' : '结束日期'}</label>
            <input type="datetime-local" value={date2} onChange={e => setDate2(e.target.value)} className="w-full p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30" />
          </div>
        </div>
        <button onClick={calcDiff} className="px-4 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90">{locale === 'en' ? 'Calculate' : '计算'}</button>
        {diff && (
          <div className="mt-2 p-2 bg-bg rounded-sm border border-[rgba(127,99,21,0.1)]">
            <p className="text-sm text-text-primary">{diff}</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-surface rounded-sm">
        <h3 className="text-sm font-medium text-text-primary mb-1">{locale === 'en' ? 'Add / Subtract Days' : '日期加减'}</h3>
        <p className="text-xs text-text-secondary mb-3">{locale === 'en' ? 'Add or subtract days from a date' : '在指定日期上加减天数'}</p>
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <label className="block text-xs text-text-secondary mb-1">{locale === 'en' ? 'Date' : '日期'}</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30" />
          </div>
          <div className="w-28">
            <label className="block text-xs text-text-secondary mb-1">{locale === 'en' ? 'Days' : '天数'}</label>
            <input type="number" value={days} onChange={e => setDays(e.target.value)} placeholder={locale === 'en' ? 'Days' : '天数'} className="w-full p-2 bg-bg border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary text-center focus:outline-none focus:border-accent/30" />
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