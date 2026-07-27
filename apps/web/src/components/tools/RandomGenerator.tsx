'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export default function RandomGenerator() {
  const t = useTranslations('tools')
  const [mode, setMode] = useState<'number' | 'string' | 'color'>('number')
  const [min, setMin] = useState('1')
  const [max, setMax] = useState('100')
  const [len, setLen] = useState('8')
  const [result, setResult] = useState('')

  const generate = () => {
    if (mode === 'number') {
      const a = parseInt(min), b = parseInt(max)
      setResult(String(Math.floor(Math.random() * (b - a + 1)) + a))
    } else if (mode === 'string') {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      setResult(Array.from({ length: parseInt(len) || 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''))
    } else {
      setResult('#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'))
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-2">
        {['number', 'string', 'color'].map(m => (
          <button key={m} onClick={() => setMode(m as any)}
            className={`px-4 py-2 text-sm rounded-sm transition-colors ${mode === m ? 'bg-accent text-white' : 'bg-surface text-text-primary border border-[rgba(127,99,21,0.15)]'}`}>
            {m === 'number' ? t('calcEnterNumber') : m === 'string' ? t('encode') : t('presetColors')}
        </button>))}
      </div>
      <div className="flex gap-3 items-end">
        {mode === 'number' && (<>
          <div><label className="text-xs text-text-secondary block mb-1">Min</label>
            <input value={min} onChange={e => setMin(e.target.value)} className="w-24 p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" /></div>
          <div><label className="text-xs text-text-secondary block mb-1">Max</label>
            <input value={max} onChange={e => setMax(e.target.value)} className="w-24 p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" /></div>
        </>)}
        {mode === 'string' && (<>
          <div><label className="text-xs text-text-secondary block mb-1">{t('length')}</label>
            <input value={len} onChange={e => setLen(e.target.value)} className="w-24 p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" /></div>
        </>)}
        <button onClick={generate} className="px-5 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90">{t('generate')}</button>
      </div>
      {result && (
        <div className="p-4 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm">
          <p className="text-xs text-text-secondary mb-1">{t('calcResult')}</p>
          <p className="text-lg font-mono font-semibold text-text-primary break-all" style={mode === 'color' ? { color: result } : undefined}>{result}</p>
        </div>
      )}
    </div>
  )
}