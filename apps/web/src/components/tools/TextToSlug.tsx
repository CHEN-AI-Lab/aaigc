'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'

export default function TextToSlug() {
  const t = useTranslations('tools')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)

  const convert = useCallback(() => {
    if (!input.trim()) { setOutput(''); return }
    setOutput(input
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    )
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
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={t('enterText')} className="w-full h-28 p-3 bg-surface border border-border rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      <button onClick={convert} className="px-6 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90">{t('convert')}</button>
      {output && (
        <div className="relative">
          <textarea readOnly value={output} className="w-full h-16 p-3 bg-surface border border-border rounded-sm text-sm font-mono text-text-primary resize-none" />
          <button onClick={handleCopy}
            className={`text-xs px-2 py-1 rounded-sm transition-all duration-200 min-w-[4.5rem] text-center absolute top-2 right-6 ${
              copied
                ? 'bg-success text-white scale-105'
                : 'bg-accent text-white hover:opacity-90'
            }`}>
            {copied ? t('copied') : t('copy')}
          </button>
        </div>
      )}
    </div>
  )
}