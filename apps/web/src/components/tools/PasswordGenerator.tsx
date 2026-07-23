'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'

export default function PasswordGenerator() {
  const t = useTranslations('tools')
  const [length, setLength] = useState(16)
  const [upper, setUpper] = useState(true)
  const [lower, setLower] = useState(true)
  const [digits, setDigits] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [password, setPassword] = useState('')
  const [strength, setStrength] = useState(0)

  const generate = useCallback(() => {
    let chars = ''
    if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (lower) chars += 'abcdefghijklmnopqrstuvwxyz'
    if (digits) chars += '0123456789'
    if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    if (!chars) return

    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }
    setPassword(result)

    // Calculate strength
    let score = 0
    if (length >= 8) score += 25
    if (length >= 12) score += 25
    if (upper && lower) score += 15
    if (digits) score += 15
    if (symbols) score += 20
    setStrength(Math.min(100, score))
  }, [length, upper, lower, digits, symbols])

  const strengthColor = strength < 40 ? 'bg-red-400' : strength < 70 ? 'bg-amber-400' : 'bg-green-400'
  const strengthLabel = strength < 40 ? t('weak') : strength < 70 ? t('medium') : t('strong')

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm text-text-secondary">{t('length')}</label>
        <input type="number" min={4} max={128} value={length} onChange={e => setLength(Math.min(128, Math.max(4, parseInt(e.target.value) || 4)))}
          className="w-20 p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary text-center focus:outline-none focus:border-accent/30" />
      </div>
      <div className="flex gap-4 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input type="checkbox" checked={upper} onChange={e => setUpper(e.target.checked)} className="accent-accent" /> A-Z
        </label>
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input type="checkbox" checked={lower} onChange={e => setLower(e.target.checked)} className="accent-accent" /> a-z
        </label>
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input type="checkbox" checked={digits} onChange={e => setDigits(e.target.checked)} className="accent-accent" /> 0-9
        </label>
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input type="checkbox" checked={symbols} onChange={e => setSymbols(e.target.checked)} className="accent-accent" /> !@#$
        </label>
      </div>
      <button onClick={generate} className="px-6 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90">{t('generate')}</button>
      {password && (
        <div className="space-y-2">
          <div className="relative">
            <textarea readOnly value={password} className="w-full h-16 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary resize-none" />
            <button onClick={() => navigator.clipboard.writeText(password)} className="absolute top-2 right-2 text-xs px-2 py-1 bg-accent text-white rounded-sm hover:opacity-90 min-w-[4.5rem] text-center">{t('copy')}</button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
              <div className={`h-full ${strengthColor} transition-all duration-300`} style={{ width: `${strength}%` }} />
            </div>
            <span className="text-xs text-text-secondary font-medium">{strengthLabel} ({strength}%)</span>
          </div>
        </div>
      )}
    </div>
  )
}