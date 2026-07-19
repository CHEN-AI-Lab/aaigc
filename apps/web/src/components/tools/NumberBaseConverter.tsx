'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'

const BASES = [
  { base: 2, label: 'BIN' },
  { base: 8, label: 'OCT' },
  { base: 10, label: 'DEC' },
  { base: 16, label: 'HEX' },
]

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

    setResults(BASES.map(({ base, label }) => ({
      base,
      label: `${label} (${t(`base${base}`)})`,
      value: decimal.toString(base).toUpperCase(),
    })))
  }, [input, fromBase, t])

  return (
    <div className="mt-6 space-y-4">
      <div className="p-3 bg-surface rounded-sm text-xs text-text-secondary leading-relaxed">
        {t('baseDesc')}
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder={t('enterNumber')}
          className="flex-1 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/30" />
        <select value={fromBase} onChange={e => setFromBase(parseInt(e.target.value))}
          className="p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary focus:outline-none">
          {BASES.map(({ base, label }) => (
            <option key={base} value={base}>{label} ({t(`base${base}`)})</option>
          ))}
        </select>
        <button onClick={convert} className="px-6 py-3 bg-accent text-white text-sm rounded-sm hover:opacity-90 shrink-0">{t('convert')}</button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r) => (
            <div key={r.base} className="flex items-center gap-3 p-3 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)]">
              <div className="w-36 shrink-0">
                <span className="text-xs font-mono text-accent font-bold">{r.label}</span>
              </div>
              <code className="text-sm text-text-primary font-mono flex-1 break-all bg-bg px-2 py-1 rounded-sm">{r.value}</code>
              <button onClick={() => navigator.clipboard.writeText(r.value)}
                className="text-xs px-2 py-1 bg-accent text-white rounded-sm hover:opacity-90 shrink-0">{t('copy')}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}