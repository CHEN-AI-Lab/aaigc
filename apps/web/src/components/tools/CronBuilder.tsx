'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export default function CronBuilder() {
  const t = useTranslations('tools')
  const [minute, setMinute] = useState('*')
  const [hour, setHour] = useState('*')
  const [day, setDay] = useState('*')
  const [month, setMonth] = useState('*')
  const [dow, setDow] = useState('*')
  const [copied, setCopied] = useState(false)

  const preset = (s: string) => {
    const [m, h, d, mo, dw] = s.split(' ')
    setMinute(m); setHour(h); setDay(d); setMonth(mo); setDow(dw)
  }

  const expression = `${minute} ${hour} ${day} ${month} ${dow}`

  return (
    <div className="mt-6 space-y-4">
      <p className="text-xs text-text-secondary mb-3">Cron 表达式用于定时任务调度（如每天 9 点自动备份）。选择时间后复制下方表达式即可使用。</p>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => preset('0 9 * * *')} className="px-3 py-1.5 text-xs bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-text-primary hover:bg-accent/10">每天 9:00</button>
        <button onClick={() => preset('0 9 * * 1-5')} className="px-3 py-1.5 text-xs bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-text-primary hover:bg-accent/10">工作日 9:00</button>
        <button onClick={() => preset('*/5 * * * *')} className="px-3 py-1.5 text-xs bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-text-primary hover:bg-accent/10">每 5 分钟</button>
        <button onClick={() => preset('0 0 1 * *')} className="px-3 py-1.5 text-xs bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-text-primary hover:bg-accent/10">每月 1 号</button>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div><label className="text-xs text-text-secondary block mb-1">分钟 (0-59)</label>
          <select value={minute} onChange={e => setMinute(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-xs text-text-primary">
            <option value="*">每</option>
            {Array.from({length:60},(_,i)=>i).map(i => <option key={i} value={i}>{i}</option>)}
          </select></div>
        <div><label className="text-xs text-text-secondary block mb-1">小时 (0-23)</label>
          <select value={hour} onChange={e => setHour(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-xs text-text-primary">
            <option value="*">每</option>
            {Array.from({length:24},(_,i)=>i).map(i => <option key={i} value={i}>{i}</option>)}
          </select></div>
        <div><label className="text-xs text-text-secondary block mb-1">日 (1-31)</label>
          <select value={day} onChange={e => setDay(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-xs text-text-primary">
            <option value="*">每</option>
            {Array.from({length:31},(_,i)=>i+1).map(i => <option key={i} value={i}>{i}</option>)}
          </select></div>
        <div><label className="text-xs text-text-secondary block mb-1">月 (1-12)</label>
          <select value={month} onChange={e => setMonth(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-xs text-text-primary">
            <option value="*">每</option>
            {Array.from({length:12},(_,i)=>i+1).map(i => <option key={i} value={i}>{i}</option>)}
          </select></div>
        <div><label className="text-xs text-text-secondary block mb-1">星期 (0=周日)</label>
          <select value={dow} onChange={e => setDow(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-xs text-text-primary">
            <option value="*">每</option>
            {['日','一','二','三','四','五','六'].map((d,i) => <option key={i} value={i}>周{d}</option>)}
          </select></div>
      </div>

      <div className="p-4 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-center">
        <p className="text-xs text-text-secondary mb-1">生成的 Cron 表达式</p>
        <p className="text-lg font-mono font-semibold text-accent">{expression}</p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <button onClick={() => { navigator.clipboard.writeText(expression); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="px-4 py-1.5 bg-accent text-white text-xs rounded-sm hover:opacity-90">{copied ? '✓ 已复制' : '📋 复制'}</button>
        </div>
      </div>
    </div>
  )
}