'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'

export default function TextToBinary() {
  const t = useTranslations('tools')
  const [text, setText] = useState('')

  const result = useMemo(() => {
    if (!text) return null
    const bytes = new TextEncoder().encode(text)
    return {
      binary: Array.from(bytes).map(b => b.toString(2).padStart(8, '0')).join(' '),
      octal: Array.from(bytes).map(b => b.toString(8).padStart(3, '0')).join(' '),
      hex: Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' '),
    }
  }, [text])

  return (
    <div className="mt-6 space-y-4">
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder={t('enterText')} rows={3}
        className="w-full p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      {result && (
        <div className="space-y-3">
          {[
            { label: 'Binary (2)', value: result.binary },
            { label: 'Octal (8)', value: result.octal },
            { label: 'Hex (16)', value: result.hex },
          ].map(r => (
            <div key={r.label} className="p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm">
              <p className="text-xs text-text-secondary mb-1">{r.label}</p>
              <p className="text-xs font-mono text-text-primary break-all leading-relaxed">{r.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}