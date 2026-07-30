'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'

export default function UrlEncoder() {
  const t = useTranslations('tools')
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
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
      setOutput(mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input))
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
        <button onClick={() => setMode('encode')} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${mode === 'encode' ? 'bg-accent text-white' : 'bg-surface text-text-primary'}`}>
          {t('encode')}
        </button>
        <button onClick={() => setMode('decode')} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${mode === 'decode' ? 'bg-accent text-white' : 'bg-surface text-text-primary'}`}>
          {t('decode')}
        </button>
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={t('enterUrl')} className="w-full h-28 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-md text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button onClick={convert} className="px-6 py-2 bg-accent text-white text-sm rounded-md hover:opacity-90 transition-opacity">{t('convert')}</button>
      {output && (
        <div className="relative">
          <textarea
            ref={outputRef}
            readOnly
            value={output}
            className="w-full min-h-[180px] max-h-[60vh] p-3 pr-16 bg-surface border border-[rgba(127,99,21,0.15)] rounded-md text-sm text-text-primary resize-none overflow-y-auto"
          />
          <button
            onClick={handleCopy}
            className={`absolute top-2 right-6 text-xs px-2.5 py-1.5 rounded-md transition-all duration-200 min-w-[4.5rem] text-center ${
              copied
                ? 'bg-green-500 text-white scale-105'
                : 'bg-accent text-white hover:opacity-90'
            }`}
          >
            {copied ? t('copied') : t('copy')}
          </button>
        </div>
      )}
    </div>
  )
}