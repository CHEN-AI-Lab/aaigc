'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

const PRESETS = [
  { label: '每天 9:00', expr: '0 9 * * *', desc: '每天早上 9 点执行' },
  { label: '工作日 9:00', expr: '0 9 * * 1-5', desc: '周一至周五早上 9 点执行' },
  { label: '每 5 分钟', expr: '*/5 * * * *', desc: '每 5 分钟执行一次' },
  { label: '每月 1 号', expr: '0 0 1 * *', desc: '每月 1 日凌晨执行' },
]

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

  const currentPreset = PRESETS.find(p => p.expr === expression)

  return (
    <div className="mt-6 space-y-4">
      <div className="p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-xs text-text-secondary leading-relaxed">
        <p className="font-semibold text-text-primary mb-1">Cron 表达式是什么？</p>
        <p>Cron 是 Linux 服务器上的定时任务调度工具。它按照设定的时间自动执行命令或脚本，常用于：</p>
        <ul className="list-disc pl-4 mt-1 space-y-0.5">
          <li>定时备份数据库（每天凌晨 3 点）</li>
          <li>定时发送邮件或报表（每周一早上 9 点）</li>
          <li>定时清理临时文件（每 30 分钟）</li>
        </ul>
        <p className="mt-1">表达式 <code className="text-accent font-mono">分 时 日 月 周</code> 五个字段分别代表执行时间。</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {PRESETS.map(p => (
          <button key={p.expr} onClick={() => preset(p.expr)}
            className={`px-3 py-1.5 text-xs rounded-sm transition-colors ${expression === p.expr ? 'bg-accent text-white' : 'bg-surface text-text-primary border border-[rgba(127,99,21,0.15)]'}`}
            title={p.desc}>{p.label}</button>
        ))}
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
        {currentPreset && <p className="text-xs text-text-secondary mt-1">{currentPreset.desc}</p>}
        <div className="mt-2 flex items-center justify-center gap-2">
          <button onClick={() => { navigator.clipboard.writeText(expression); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="px-4 py-1.5 bg-accent text-white text-xs rounded-sm hover:opacity-90">{copied ? '✓ 已复制' : '📋 复制'}</button>
        </div>
        <p className="text-xs text-text-secondary/60 mt-2">使用方式：在 Linux 服务器上运行 <code className="text-accent font-mono text-xs">crontab -e</code>，粘贴此行保存即可</p>
      </div>
    </div>
  )
}