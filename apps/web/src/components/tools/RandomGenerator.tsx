'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createToolContext } from 'shared/tools'
import { parseRandomGenerator, runRandomGenerator } from 'shared/tools/random-generator'

export default function RandomGenerator() {
  const t = useTranslations('tools')
  const [mode, setMode] = useState<'number' | 'string' | 'color'>('number')
  const [min, setMin] = useState('1')
  const [max, setMax] = useState('100')
  const [len, setLen] = useState('8')
  const [result, setResult] = useState('')

  const generate = () => {
    // 随机源经 ToolContext 注入（shared 内部使用 CSPRNG），端侧不直接调 Math.random()
    // 旧行为：min>max 时仍按 Math.random() 产出区间外数字（如 min=10,max=1 → 0~10） → 新行为：parseRandomGenerator 直接返回 outOfRange 不产出，已确认接受
    const ctx = createToolContext()
    const parsed = parseRandomGenerator({ mode, min, max, length: len }, ctx)
    if (!parsed.ok) return
    const outcome = runRandomGenerator(parsed.data, ctx)
    if (!outcome.ok) return
    setResult(outcome.data.value)
  }

  return (
    <div className="mt-6 space-y-4">
      <p className="text-xs text-text-secondary mb-3">{t('randomDesc')}</p>

      <div className="flex gap-2">
        <button onClick={() => setMode('number')}
          className={`px-4 py-2 text-sm rounded-sm transition-colors ${mode === 'number' ? 'bg-accent text-white' : 'bg-surface text-text-primary border border-border'}`}>{t('randomNumber')}</button>
        <button onClick={() => setMode('string')}
          className={`px-4 py-2 text-sm rounded-sm transition-colors ${mode === 'string' ? 'bg-accent text-white' : 'bg-surface text-text-primary border border-border'}`}>{t('randomString')}</button>
        <button onClick={() => setMode('color')}
          className={`px-4 py-2 text-sm rounded-sm transition-colors ${mode === 'color' ? 'bg-accent text-white' : 'bg-surface text-text-primary border border-border'}`}>{t('randomColor')}</button>
      </div>

      <div className="flex gap-3 items-end">
        {mode === 'number' && (<>
          <div><label className="text-xs text-text-secondary block mb-1">{t('min')}</label>
            <input value={min} onChange={e => setMin(e.target.value)} className="w-24 p-2 bg-surface border border-border rounded-sm text-sm text-text-primary" /></div>
          <div><label className="text-xs text-text-secondary block mb-1">{t('max')}</label>
            <input value={max} onChange={e => setMax(e.target.value)} className="w-24 p-2 bg-surface border border-border rounded-sm text-sm text-text-primary" /></div>
        </>)}
        {mode === 'string' && (<>
          <div><label className="text-xs text-text-secondary block mb-1">{t('length')}</label>
            <input value={len} onChange={e => setLen(e.target.value)} className="w-24 p-2 bg-surface border border-border rounded-sm text-sm text-text-primary" /></div>
        </>)}
        <button onClick={generate} className="px-5 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90">{t('generate')}</button>
      </div>

      {result && (
        <div className="p-4 bg-surface border border-border rounded-sm">
          <p className="text-xs text-text-secondary mb-1">{t('result')}</p>
          {mode === 'color' ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm border border-border shrink-0" style={{ backgroundColor: result }} />
              <p className="text-lg font-mono font-semibold text-text-primary">{result}</p>
            </div>
          ) : (
            <p className="text-lg font-mono font-semibold text-text-primary break-all">{result}</p>
          )}
        </div>
      )}
    </div>
  )
}