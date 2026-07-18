'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'

export default function CaseConverter() {
  const t = useTranslations('tools')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  const convert = useCallback((type: 'upper' | 'lower' | 'title' | 'camel' | 'snake') => {
    if (!input) { setOutput(''); return }
    switch (type) {
      case 'upper': setOutput(input.toUpperCase()); break
      case 'lower': setOutput(input.toLowerCase()); break
      case 'title': setOutput(input.replace(/\b\w/g, c => c.toUpperCase())); break
      case 'camel': setOutput(input.replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())); break
      case 'snake': setOutput(input.replace(/\s+/g, '_').toLowerCase()); break
    }
  }, [input])

  return (
    <div className="mt-6 space-y-4">
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={t('enterText')} className="w-full h-28 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      <div className="flex gap-2 flex-wrap">
        {(['upper', 'lower', 'title', 'camel', 'snake'] as const).map((type) => (
          <button key={type} onClick={() => convert(type)} className="px-4 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90">
            {type === 'upper' ? 'UPPERCASE' : type === 'lower' ? 'lowercase' : type === 'title' ? 'Title Case' : type === 'camel' ? 'camelCase' : 'snake_case'}
          </button>
        ))}
      </div>
      {output && (
        <div className="relative">
          <textarea readOnly value={output} className="w-full h-28 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary resize-none" />
          <button onClick={() => navigator.clipboard.writeText(output)} className="absolute top-2 right-2 text-xs px-2 py-1 bg-accent text-white rounded-sm hover:opacity-90">{t('copy')}</button>
        </div>
      )}
    </div>
  )
}