'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'

export default function JwtDecoder() {
  const t = useTranslations('tools')
  const [input, setInput] = useState('')
  const [header, setHeader] = useState('')
  const [payload, setPayload] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const headerRef = useRef<HTMLTextAreaElement>(null)
  const payloadRef = useRef<HTMLTextAreaElement>(null)

  const autoResizeHeader = useCallback(() => {
    const el = headerRef.current
    if (!el) return
    el.style.height = '0'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  const autoResizePayload = useCallback(() => {
    const el = payloadRef.current
    if (!el) return
    el.style.height = '0'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  useEffect(() => { autoResizeHeader() }, [header, autoResizeHeader])
  useEffect(() => { autoResizePayload() }, [payload, autoResizePayload])

  const decode = useCallback(() => {
    setError('')
    setHeader('')
    setPayload('')
    const parts = input.trim().split('.')
    if (parts.length !== 3) {
      setError(t('invalidJwtParts'))
      return
    }
    try {
      const h = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')))
      const p = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
      setHeader(JSON.stringify(h, null, 2))
      setPayload(JSON.stringify(p, null, 2))
    } catch {
      setError(t('invalidJwt'))
    }
  }, [input, t])

  const handleCopyHeader = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(header)
      setCopied('header')
      setTimeout(() => setCopied(''), 2000)
    } catch { /* ignore */ }
  }, [header])

  const handleCopyPayload = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(payload)
      setCopied('payload')
      setTimeout(() => setCopied(''), 2000)
    } catch { /* ignore */ }
  }, [payload])

  return (
    <div className="mt-6 space-y-4">
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="eyJhbG...NiIs..." className="w-full h-24 p-3 bg-surface border border-border rounded-sm text-sm font-mono text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      <button onClick={decode} className="px-6 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90">{t('decode')}</button>
      {error && <p className="text-error text-sm">{error}</p>}
      {header && (
        <div className="space-y-3">
          <div>
            <h3 className="text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wider">HEADER</h3>
            <div className="relative">
              <textarea
                ref={headerRef}
                readOnly
                value={header}
                className="w-full min-h-[120px] max-h-[40vh] p-3 pr-16 bg-surface border border-border rounded-sm text-sm font-mono text-text-primary resize-none overflow-y-auto"
              />
              <button
                onClick={handleCopyHeader}
                className={`absolute top-2 right-6 text-xs px-2.5 py-1.5 rounded-sm transition-all duration-200 min-w-[4.5rem] text-center ${
                  copied === 'header'
                    ? 'bg-success text-white scale-105'
                    : 'bg-accent text-white hover:opacity-90'
                }`}
              >
                {copied === 'header' ? t('copied') : t('copy')}
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wider">PAYLOAD</h3>
            <div className="relative">
              <textarea
                ref={payloadRef}
                readOnly
                value={payload}
                className="w-full min-h-[180px] max-h-[60vh] p-3 pr-16 bg-surface border border-border rounded-sm text-sm font-mono text-text-primary resize-none overflow-y-auto"
              />
              <button
                onClick={handleCopyPayload}
                className={`absolute top-2 right-6 text-xs px-2.5 py-1.5 rounded-sm transition-all duration-200 min-w-[4.5rem] text-center ${
                  copied === 'payload'
                    ? 'bg-success text-white scale-105'
                    : 'bg-accent text-white hover:opacity-90'
                }`}
              >
                {copied === 'payload' ? t('copied') : t('copy')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}