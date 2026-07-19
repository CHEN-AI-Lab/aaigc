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
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

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

  const copy = useCallback(async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 2000)
    } catch { /* ignore */ }
  }, [])

  return (
    <div className="mt-6 space-y-6">
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-800 leading-relaxed">
        {t('baseDesc')}
      </div>

      <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs text-text-secondary mb-1.5">{t('enterNumber')}</label>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="e.g. 255, FF, 11111111"
              className="w-full p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/30" />
          </div>
          <div className="sm:w-40">
            <label className="block text-xs text-text-secondary mb-1.5">{t('fromBase')}</label>
            <select value={fromBase} onChange={e => setFromBase(parseInt(e.target.value))}
              className="w-full p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary focus:outline-none">
              {BASES.map(({ base, label }) => (
                <option key={base} value={base}>{label} ({t(`base${base}`)})</option>
              ))}
            </select>
          </div>
          <button onClick={convert} className="sm:self-end px-8 py-3 bg-accent text-white text-sm font-medium rounded-sm hover:opacity-90 transition-opacity shrink-0">
            {t('convert')}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {results.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">{t('result')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {results.map((r) => (
              <div key={r.base} className="flex items-center gap-4 p-4 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)]">
                <div className="w-24 shrink-0">
                  <span className="text-xs font-mono text-accent font-bold">{r.label}</span>
                </div>
                <code className="text-sm text-text-primary font-mono flex-1 break-all bg-surface px-2 py-1.5 rounded-sm border border-[rgba(127,99,21,0.08)]">{r.value}</code>
                <button onClick={() => copy(r.value, r.base)}
                  className={`text-xs px-2.5 py-1.5 rounded-sm transition-all duration-200 shrink-0 min-w-[4.5rem] text-center ${
                    copiedIdx === r.base
                      ? 'bg-green-500 text-white'
                      : 'bg-accent text-white hover:opacity-90'
                  }`}>
                  {copiedIdx === r.base ? t('copied') : t('copy')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}