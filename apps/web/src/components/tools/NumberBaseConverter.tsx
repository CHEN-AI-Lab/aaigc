'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'

export default function NumberBaseConverter() {
  const t = useTranslations('tools')
  const [input, setInput] = useState('')
  const [fromBase, setFromBase] = useState(10)
  const [results, setResults] = useState<{ base: number; label: string; value: string }[]>([])
  const [error, setError] = useState('')

  const convert = useCallback(() => {
    setError('')
    if (!input.trim()) { setResults([]); return }
    const decimal = parseInt(input, fromBase)
    if (isNaN(decimal)) { setError(t('invalidInput')); return }

    setResults([
      { base: 2, label: 'BIN', value: decimal.toString(2) },
      { base: 8, label: 'OCT', value: decimal.toString(8) },
      { base: 10, label: 'DEC', value: decimal.toString(10) },
      { base: 16, label: 'HEX', value: decimal.toString(16).toUpperCase() },
    ])
  }, [input, fromBase, t])

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder={t('enterNumber')} className="flex-1 p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/30" />
        <select value={fromBase} onChange={e => setFromBase(parseInt(e.target.value))} className="p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary focus:outline-none">
          <option value={2}>BIN</option>
          <option value={8}>OCT</option>
          <option value={10}>DEC</option>
          <option value={16}>HEX</option>
        </select>
        <button onClick={convert} className="px-6 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90">{t('convert')}</button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r) => (
            <div key={r.base} className="flex items-center gap-3 p-3 bg-surface rounded-sm">
              <span className="text-xs font-mono text-accent font-bold w-10">{r.label}</span>
              <code className="text-sm text-text-primary font-mono flex-1 break-all">{r.value}</code>
              <button onClick={() => navigator.clipboard.writeText(r.value)} className="text-xs px-2 py-1 bg-accent text-white rounded-sm hover:opacity-90 shrink-0">{t('copy')}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}