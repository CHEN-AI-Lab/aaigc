'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useLocale } from 'next-intl'

export default function Base64Codec() {
  const locale = useLocale()
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
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
    setError('')
    try {
      if (mode === 'encode') {
        setOutput(btoa(input))
      } else {
        setOutput(atob(input))
      }
    } catch {
      setError(locale === 'en' ? 'Invalid Base64 input' : 'Base64 输入无效')
    }
  }, [input, mode, locale])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(output)
    setAnimating(true)
    if (animTimer.current) clearTimeout(animTimer.current)
    animTimer.current = setTimeout(() => setAnimating(false), 400)
  }, [output])

  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setMode('encode')} className={`px-4 py-1.5 text-sm rounded-sm transition-colors ${mode === 'encode' ? 'bg-accent text-white' : 'bg-surface text-text-primary'}`}>{locale === 'en' ? 'Encode' : '编码'}</button>
        <button onClick={() => setMode('decode')} className={`px-4 py-1.5 text-sm rounded-sm transition-colors ${mode === 'decode' ? 'bg-accent text-white' : 'bg-surface text-text-primary'}`}>{locale === 'en' ? 'Decode' : '解码'}</button>
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={locale === 'en' ? 'Enter text...' : '输入文本...'} className="w-full h-28 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button onClick={convert} className="px-6 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90 transition-opacity">{locale === 'en' ? 'Convert' : '转换'}</button>
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
            className={`absolute top-2 right-6 text-xs px-2.5 py-1.5 bg-accent text-white rounded-sm hover:opacity-90 transition-all ${animating ? 'scale-110 opacity-70' : 'opacity-100'}`}
          >
            {locale === 'en' ? 'Copy' : '复制'}
          </button>
        </div>
      )}
    </div>
  )
}