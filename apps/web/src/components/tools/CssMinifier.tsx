'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'

export default function CssMinifier() {
  const t = useTranslations('tools')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'minify' | 'format'>('minify')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(0)
  const [copied, setCopied] = useState(false)

  const convert = useCallback(() => {
    setError('')
    if (!input.trim()) { setOutput(''); return }
    try {
      if (mode === 'minify') {
        const minified = input
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\s*([{}:;,])\s*/g, '$1')
          .replace(/\s+/g, ' ')
          .replace(/;}/g, '}')
          .trim()
        setOutput(minified)
        setSaved(input.length - minified.length)
      } else {
        const formatted = input
          .replace(/\{/g, ' {\n  ')
          .replace(/;/g, ';\n  ')
          .replace(/}/g, '\n}\n')
          .replace(/:\s+/g, ': ')
          .replace(/\n\s*\n/g, '\n')
          .trim()
        setOutput(formatted)
        setSaved(0)
      }
    } catch {
      setError(t('invalidInput'))
    }
  }, [input, mode, t])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }, [output])

  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setMode('minify')} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${mode === 'minify' ? 'bg-accent text-white' : 'bg-surface text-text-primary'}`}>{t('minify')}</button>
        <button onClick={() => setMode('format')} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${mode === 'format' ? 'bg-accent text-white' : 'bg-surface text-text-primary'}`}>{t('format')}</button>
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="body { margin: 0; color: #333; }" className="w-full h-32 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-md text-sm font-mono text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      <button onClick={convert} className="px-6 py-2 bg-accent text-white text-sm rounded-md hover:opacity-90">{mode === 'minify' ? t('minify') : t('format')}</button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {output && (
        <div className="relative">
          <textarea readOnly value={output} className="w-full h-32 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-md text-sm font-mono text-text-primary resize-none" />
          {saved > 0 && <p className="text-xs text-green-600 mt-1">{t('saved', { bytes: saved })}</p>}
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