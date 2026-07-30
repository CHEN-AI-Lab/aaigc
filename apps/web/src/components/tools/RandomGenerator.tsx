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
      if (isNaN(a) || isNaN(b)) return
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
      <p className="text-xs text-text-secondary mb-3">生成随机数字、随机字符串或随机颜色，用于测试、密码、设计等场景</p>

      <div className="flex gap-2">
        <button onClick={() => setMode('number')}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${mode === 'number' ? 'bg-accent text-white' : 'bg-surface text-text-primary border border-[rgba(127,99,21,0.15)]'}`}>随机数字</button>
        <button onClick={() => setMode('string')}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${mode === 'string' ? 'bg-accent text-white' : 'bg-surface text-text-primary border border-[rgba(127,99,21,0.15)]'}`}>随机字符串</button>
        <button onClick={() => setMode('color')}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${mode === 'color' ? 'bg-accent text-white' : 'bg-surface text-text-primary border border-[rgba(127,99,21,0.15)]'}`}>随机颜色</button>
      </div>

      <div className="flex gap-3 items-end">
        {mode === 'number' && (<>
          <div><label className="text-xs text-text-secondary block mb-1">最小值</label>
            <input value={min} onChange={e => setMin(e.target.value)} className="w-24 p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-lg text-sm text-text-primary" /></div>
          <div><label className="text-xs text-text-secondary block mb-1">最大值</label>
            <input value={max} onChange={e => setMax(e.target.value)} className="w-24 p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-lg text-sm text-text-primary" /></div>
        </>)}
        {mode === 'string' && (<>
          <div><label className="text-xs text-text-secondary block mb-1">字符数</label>
            <input value={len} onChange={e => setLen(e.target.value)} className="w-24 p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-lg text-sm text-text-primary" /></div>
        </>)}
        <button onClick={generate} className="px-5 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90">{t('generate')}</button>
      </div>

      {result && (
        <div className="p-4 bg-surface border border-[rgba(127,99,21,0.15)] rounded-lg">
          <p className="text-xs text-text-secondary mb-1">生成结果</p>
          {mode === 'color' ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-[rgba(127,99,21,0.15)] shrink-0" style={{ backgroundColor: result }} />
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