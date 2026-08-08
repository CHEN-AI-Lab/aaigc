'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

const PRESETS = [
  { label: 'cronPreset1', desc: 'cronDesc1', expr: '0 9 * * *' },
  { label: 'cronPreset2', desc: 'cronDesc2', expr: '0 9 * * 1-5' },
  { label: 'cronPreset3', desc: 'cronDesc3', expr: '*/5 * * * *' },
  { label: 'cronPreset4', desc: 'cronDesc4', expr: '0 0 1 * *' },
  { label: 'cronPreset5', desc: 'cronDesc5', expr: '* * * * *' },
  { label: 'cronPreset6', desc: 'cronDesc6', expr: '*/10 * * * *' },
  { label: 'cronPreset7', desc: 'cronDesc7', expr: '0 */2 * * *' },
  { label: 'cronPreset8', desc: 'cronDesc8', expr: '0 0 * * *' },
  { label: 'cronPreset9', desc: 'cronDesc9', expr: '0 0 * * 1' },
  { label: 'cronPreset10', desc: 'cronDesc10', expr: '0 0 15 * *' },
]

const DOW = ['cronSun', 'cronMon', 'cronTue', 'cronWed', 'cronThu', 'cronFri', 'cronSat']

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

  // Warn when specific day/week/month is set but minute/hour are wildcard
  const dangerous = (day !== '*' || dow !== '*' || month !== '*') && (minute === '*' || hour === '*')

  return (
    <div className="mt-6 space-y-4">
      <div className="p-3 bg-surface border border-border rounded-sm text-xs text-text-secondary leading-relaxed">
        <p className="font-semibold text-text-primary mb-1">Cron</p>
        <p>{t('cronExplain')}</p>
        <ul className="list-disc pl-4 mt-1 space-y-0.5">
          <li>{t('cronUse1')}</li>
          <li>{t('cronUse2')}</li>
          <li>{t('cronUse3')}</li>
        </ul>
        <p className="mt-1">{t('cronFormat')} <code className="text-accent font-mono">min hour day month weekday</code></p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {PRESETS.map(p => (
          <button key={p.expr} onClick={() => preset(p.expr)}
            className={`px-3 py-1.5 text-xs rounded-sm transition-colors ${expression === p.expr ? 'bg-accent text-white' : 'bg-surface text-text-primary border border-border'}`}
            title={t(p.desc)}>{t(p.label)}</button>
        ))}
      </div>

      {dangerous && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-xs text-red-700 leading-relaxed">
          <p className="font-semibold mb-1">⚠️ {t('cronWarning')}</p>
          <button onClick={() => { setMinute('0'); setHour('0') }}
            className="mt-1 px-3 py-1 bg-red-500 text-white rounded-sm hover:opacity-90">{t('cronFix')}</button>
        </div>
      )}

      <div className="grid grid-cols-5 gap-3">
        <div><label className="text-xs text-text-secondary block mb-1">{t('cronMinute')}</label>
          <select value={minute} onChange={e => setMinute(e.target.value)} className="w-full p-2 bg-surface border border-border rounded-sm text-xs text-text-primary">
            <option value="*">{t('cronEvery')}</option>
            {Array.from({length:60},(_,i)=>i).map(i => <option key={i} value={i}>{i}</option>)}
          </select></div>
        <div><label className="text-xs text-text-secondary block mb-1">{t('cronHour')}</label>
          <select value={hour} onChange={e => setHour(e.target.value)} className="w-full p-2 bg-surface border border-border rounded-sm text-xs text-text-primary">
            <option value="*">{t('cronEvery')}</option>
            {Array.from({length:24},(_,i)=>i).map(i => <option key={i} value={i}>{i}</option>)}
          </select></div>
        <div><label className="text-xs text-text-secondary block mb-1">{t('cronDay')}</label>
          <select value={day} onChange={e => setDay(e.target.value)} className="w-full p-2 bg-surface border border-border rounded-sm text-xs text-text-primary">
            <option value="*">{t('cronEvery')}</option>
            {Array.from({length:31},(_,i)=>i+1).map(i => <option key={i} value={i}>{i}</option>)}
          </select></div>
        <div><label className="text-xs text-text-secondary block mb-1">{t('cronMonth')}</label>
          <select value={month} onChange={e => setMonth(e.target.value)} className="w-full p-2 bg-surface border border-border rounded-sm text-xs text-text-primary">
            <option value="*">{t('cronEvery')}</option>
            {Array.from({length:12},(_,i)=>i+1).map(i => <option key={i} value={i}>{i}</option>)}
          </select></div>
        <div><label className="text-xs text-text-secondary block mb-1">{t('cronDow')}</label>
          <select value={dow} onChange={e => setDow(e.target.value)} className="w-full p-2 bg-surface border border-border rounded-sm text-xs text-text-primary">
            <option value="*">{t('cronEvery')}</option>
            {DOW.map((d, i) => <option key={i} value={i}>{t('cronWeekPrefix')}{t(d)}</option>)}
          </select></div>
      </div>

      <div className="p-4 bg-surface border border-border rounded-sm text-center">
        <p className="text-xs text-text-secondary mb-1">{t('cronResult')}</p>
        <p className="text-lg font-mono font-semibold text-accent">{expression}</p>
        {currentPreset && <p className="text-xs text-text-secondary mt-1">{t(currentPreset.desc)}</p>}
        <div className="mt-2 flex items-center justify-center gap-2">
          <button onClick={() => { navigator.clipboard.writeText(expression); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="px-4 py-1.5 bg-accent text-white text-xs rounded-lg hover:opacity-90">{copied ? t('cronCopied') : t('cronCopy')}</button>
        </div>
        <p className="text-xs text-text-secondary/60 mt-2">{t('cronUsage')} <code className="text-accent font-mono text-xs">{t('cronUsageCmd')}</code></p>
      </div>
    </div>
  )
}