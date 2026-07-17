'use client'

import { useState, useCallback } from 'react'
import { useLocale } from 'next-intl'

export default function UrlEncoder() {
  const locale = useLocale()
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const convert = useCallback(() => {
    setError('')
    try {
      setOutput(mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input))
    } catch {
      setError(locale === 'en' ? 'Invalid input' : '输入无效')
    }
  }, [input, mode, locale])

  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setMode('encode')} className={`px-4 py-1.5 text-sm rounded-sm transition-colors ${mode === 'encode' ? 'bg-accent text-white' : 'bg-surface text-text-primary'}`}>
          {locale === 'en' ? 'Encode' : '编码'}
        </button>
        <button onClick={() => setMode('decode')} className={`px-4 py-1.5 text-sm rounded-sm transition-colors ${mode === 'decode' ? 'bg-accent text-white' : 'bg-surface text-text-primary'}`}>
          {locale === 'en' ? 'Decode' : '解码'}
        </button>
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={locale === 'en' ? 'Enter URL...' : '输入 URL...'} className="w-full h-28 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button onClick={convert} className="px-6 py-2 bg-dark text-white text-sm rounded-sm hover:opacity-90 transition-opacity">{locale === 'en' ? 'Convert' : '转换'}</button>
      {output && (
        <div className="relative">
          <textarea readOnly value={output} className="w-full h-28 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary resize-none" />
          <button onClick={() => navigator.clipboard.writeText(output)} className="absolute top-2 right-2 text-xs px-2 py-1 bg-dark text-white rounded-sm hover:opacity-90">{locale === 'en' ? 'Copy' : '复制'}</button>
        </div>
      )}
    </div>
  )
}