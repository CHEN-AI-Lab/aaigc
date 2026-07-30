'use client'

import { useState, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'

const CASES = [
  { id: 'upper' as const, label: 'UPPERCASE', desc: 'HELLO WORLD' },
  { id: 'lower' as const, label: 'lowercase', desc: 'hello world' },
  { id: 'title' as const, label: 'Title Case', desc: 'Hello World' },
  { id: 'camel' as const, label: 'camelCase', desc: 'helloWorld' },
  { id: 'snake' as const, label: 'snake_case', desc: 'hello_world' },
]

export default function CaseConverter() {
  const t = useTranslations('tools')
  const locale = useLocale()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [active, setActive] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const convert = useCallback((type: 'upper' | 'lower' | 'title' | 'camel' | 'snake') => {
    setActive(type)
    if (!input) { setOutput(''); return }
    switch (type) {
      case 'upper': setOutput(input.toUpperCase()); break
      case 'lower': setOutput(input.toLowerCase()); break
      case 'title': setOutput(input.replace(/\b\w/g, c => c.toUpperCase())); break
      case 'camel': setOutput(input.replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())); break
      case 'snake': setOutput(input.replace(/\s+/g, '_').toLowerCase()); break
    }
  }, [input])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }, [output])

  return (
    <div className="mt-6 space-y-4">
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={t('enterText')} className="w-full h-28 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-md text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {CASES.map((c) => (
          <button
            key={c.id}
            onClick={() => convert(c.id)}
            className={`p-3 rounded-md text-center transition-all border ${
              active === c.id
                ? 'bg-accent text-white border-accent'
                : 'bg-surface text-text-primary border-[rgba(127,99,21,0.15)] hover:border-accent/30'
            }`}
          >
            <div className="text-xs font-semibold">{c.label}</div>
            {locale !== 'en' && (
              <div className="text-[10px] opacity-70 mt-0.5">({t(`case${c.id}`)})</div>
            )}
            <div className="text-[10px] font-mono mt-1 opacity-50">{c.desc}</div>
          </button>
        ))}
      </div>
      {output && (
        <div className="relative">
          <textarea readOnly value={output} className="w-full h-28 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-md text-sm text-text-primary resize-none" />
          <button onClick={handleCopy}
            className={`text-xs px-2 py-1 rounded-md transition-all duration-200 min-w-[4.5rem] text-center absolute top-2 right-6 ${
              copied
                ? 'bg-green-500 text-white scale-105'
                : 'bg-accent text-white hover:opacity-90'
            }`}>
            {copied ? t('copied') : t('copy')}
          </button>
        </div>
      )}
    </div>
  )
}