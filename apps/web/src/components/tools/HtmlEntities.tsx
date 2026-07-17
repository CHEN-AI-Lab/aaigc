'use client'

import { useState, useCallback } from 'react'
import { useLocale } from 'next-intl'

export default function HtmlEntities() {
  const locale = useLocale()
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'escape' | 'unescape'>('escape')
  const [output, setOutput] = useState('')

  const convert = useCallback(() => {
    if (mode === 'escape') {
      setOutput(input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'))
    } else {
      const txt = new DOMParser().parseFromString(input, 'text/html')
      setOutput(txt.body.textContent || '')
    }
  }, [input, mode])

  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setMode('escape')} className={`px-4 py-1.5 text-sm rounded-sm transition-colors ${mode === 'escape' ? 'bg-accent text-white' : 'bg-surface text-text-primary'}`}>{locale === 'en' ? 'Escape' : '转义'}</button>
        <button onClick={() => setMode('unescape')} className={`px-4 py-1.5 text-sm rounded-sm transition-colors ${mode === 'unescape' ? 'bg-accent text-white' : 'bg-surface text-text-primary'}`}>{locale === 'en' ? 'Unescape' : '反转义'}</button>
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={locale === 'en' ? 'Enter HTML...' : '输入 HTML...'} className="w-full h-28 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
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