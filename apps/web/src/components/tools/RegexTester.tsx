'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'

export default function RegexTester() {
  const t = useTranslations('tools')
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('gm')
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const matches = useMemo(() => {
    if (!pattern || !text) return []
    setError('')
    try {
      const regex = new RegExp(pattern, flags)
      const results: { index: number; match: string }[] = []
      let m: RegExpExecArray | null
      while ((m = regex.exec(text)) !== null) {
        results.push({ index: m.index, match: m[0] })
        if (m.index === regex.lastIndex) regex.lastIndex++
      }
      return results
    } catch (e) {
      setError((e as Error).message)
      return []
    }
  }, [pattern, flags, text])

  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-2">
        <input value={pattern} onChange={e => setPattern(e.target.value)} placeholder={t('regularExpression')} className="flex-1 p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-lg text-sm font-mono text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/30" />
        <input value={flags} onChange={e => setFlags(e.target.value)} placeholder="gm" className="w-16 p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-lg text-sm font-mono text-text-primary text-center focus:outline-none focus:border-accent/30" />
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder={t('testText')} className="w-full h-36 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="text-xs text-text-secondary">
        {t('matches')}: {matches.length}
      </div>
      {matches.length > 0 && (
        <div className="max-h-48 overflow-y-auto space-y-1">
          {matches.map((m, i) => (
            <div key={i} className="flex gap-2 text-xs font-mono p-1.5 bg-surface rounded-lg">
              <span className="text-text-secondary w-12 shrink-0">#{i + 1}</span>
              <span className="text-text-primary break-all">{m.match}</span>
              <span className="text-text-secondary ml-auto shrink-0">@{m.index}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}