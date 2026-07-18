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
      { base: 2, label: 'BIN (二进制)', value: decimal.toString(2) },
      { base: 8, label: 'OCT (八进制)', value: decimal.toString(8) },
      { base: 10, label: 'DEC (十进制)', value: decimal.toString(10) },
      { base: 16, label: 'HEX (十六进制)', value: decimal.toString(16).toUpperCase() },
    ])
  }, [input, fromBase, t])

  return (
    <div className="mt-6 space-y-4">
      <div className="p-3 bg-surface rounded-sm text-xs text-text-secondary leading-relaxed">
        {t('baseDesc')}
      </div>
      <div className="flex items-center gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder={t('enterNumber')}
          className="flex-1 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/30" />
        <select value={fromBase} onChange={e => setFromBase(parseInt(e.target.value))}
          className="p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary focus:outline-none">
          <option value={2}>二进制 (BIN)</option>
          <option value={8}>八进制 (OCT)</option>
          <option value={10}>十进制 (DEC)</option>
          <option value={16}>十六进制 (HEX)</option>
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