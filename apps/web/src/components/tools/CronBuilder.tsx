'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export default function CronBuilder() {
  const t = useTranslations('tools')
  const [minute, setMinute] = useState('*')
  const [hour, setHour] = useState('*')
  const [day, setDay] = useState('*')
  const [month, setMonth] = useState('*')
  const [dow, setDow] = useState('*')

  const preset = (s: string) => {
    const [m, h, d, mo, dw] = s.split(' ')
    setMinute(m); setHour(h); setDay(d); setMonth(mo); setDow(dw)
  }

  const expression = `${minute} ${hour} ${day} ${month} ${dow}`

  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => preset('0 9 * * *')} className="px-3 py-1.5 text-xs bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-text-primary hover:bg-accent/10">Daily 9am</button>
        <button onClick={() => preset('0 9 * * 1-5')} className="px-3 py-1.5 text-xs bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-text-primary hover:bg-accent/10">Weekdays 9am</button>
        <button onClick={() => preset('*/5 * * * *')} className="px-3 py-1.5 text-xs bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-text-primary hover:bg-accent/10">Every 5 min</button>
        <button onClick={() => preset('0 0 1 * *')} className="px-3 py-1.5 text-xs bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-text-primary hover:bg-accent/10">Monthly</button>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {[{ label: 'Minute', val: minute, set: setMinute, opts: Array.from({ length: 60 }, (_, i) => i) },
          { label: 'Hour', val: hour, set: setHour, opts: Array.from({ length: 24 }, (_, i) => i) },
          { label: 'Day', val: day, set: setDay, opts: DAYS },
          { label: 'Month', val: month, set: setMonth, opts: MONTHS },
          { label: 'Day of Week', val: dow, set: setDow, opts: DOW },
        ].map(f => (
          <div key={f.label}>
            <label className="text-xs text-text-secondary block mb-1">{f.label}</label>
            <select value={f.val} onChange={e => f.set(e.target.value)}
              className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-xs text-text-primary">
              <option value="*">Every</option>
              {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="p-4 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-center">
        <p className="text-xs text-text-secondary mb-1">{t('calcResult')}</p>
        <p className="text-lg font-mono font-semibold text-accent">{expression}</p>
      </div>
    </div>
  )
}