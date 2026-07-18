'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useLocale } from 'next-intl'

export default function HtmlEntities() {
  const locale = useLocale()
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'escape' | 'unescape'>('escape')
  const [output, setOutput] = useState('')
  const [animating, setAnimating] = useState(false)
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const outputRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = useCallback(() => {
    const el = outputRef.current
    if (!el) return
    el.style.height = '0'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  useEffect(() => { autoResize() }, [output, autoResize])

  const convert = useCallback(() => {
    if (mode === 'escape') {
      setOutput(input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'))
    } else {
      const txt = new DOMParser().parseFromString(input, 'text/html')
      setOutput(txt.body.textContent || '')
    }
  }, [input, mode])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(output)
    setAnimating(true)
    if (animTimer.current) clearTimeout(animTimer.current)
    animTimer.current = setTimeout(() => setAnimating(false), 400)
  }, [output])

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
          <textarea
            ref={outputRef}
            readOnly
            value={output}
            className="w-full min-h-[180px] max-h-[60vh] p-3 pr-16 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary resize-none overflow-y-auto"
          />
          <button
            onClick={handleCopy}
            className={`absolute top-2 right-6 text-xs px-2.5 py-1.5 bg-dark text-white rounded-sm hover:opacity-90 transition-all ${animating ? 'scale-110 opacity-70' : 'opacity-100'}`}
          >
            {locale === 'en' ? 'Copy' : '复制'}
          </button>
        </div>
      )}
    </div>
  )
}