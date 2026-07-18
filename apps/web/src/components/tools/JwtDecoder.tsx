'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useLocale } from 'next-intl'

export default function JwtDecoder() {
  const locale = useLocale()
  const [input, setInput] = useState('')
  const [header, setHeader] = useState('')
  const [payload, setPayload] = useState('')
  const [error, setError] = useState('')
  const [animatingHeader, setAnimatingHeader] = useState(false)
  const [animatingPayload, setAnimatingPayload] = useState(false)
  const headerTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const payloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
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
      setError(locale === 'en' ? 'Invalid JWT: expected 3 parts' : '无效的 JWT：需要 3 段')
      return
    }
    try {
      const h = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')))
      const p = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
      setHeader(JSON.stringify(h, null, 2))
      setPayload(JSON.stringify(p, null, 2))
    } catch {
      setError(locale === 'en' ? 'Invalid JWT: failed to decode' : '无效的 JWT：解码失败')
    }
  }, [input, locale])

  const handleCopyHeader = useCallback(() => {
    navigator.clipboard.writeText(header)
    setAnimatingHeader(true)
    if (headerTimer.current) clearTimeout(headerTimer.current)
    headerTimer.current = setTimeout(() => setAnimatingHeader(false), 400)
  }, [header])

  const handleCopyPayload = useCallback(() => {
    navigator.clipboard.writeText(payload)
    setAnimatingPayload(true)
    if (payloadTimer.current) clearTimeout(payloadTimer.current)
    payloadTimer.current = setTimeout(() => setAnimatingPayload(false), 400)
  }, [payload])

  return (
    <div className="mt-6 space-y-4">
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="eyJhbG...NiIs..." className="w-full h-24 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      <button onClick={decode} className="px-6 py-2 bg-dark text-white text-sm rounded-sm hover:opacity-90">{locale === 'en' ? 'Decode' : '解码'}</button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {header && (
        <div className="space-y-3">
          <div>
            <h3 className="text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wider">HEADER</h3>
            <div className="relative">
              <textarea
                ref={headerRef}
                readOnly
                value={header}
                className="w-full min-h-[120px] max-h-[40vh] p-3 pr-16 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary resize-none overflow-y-auto"
              />
              <button
                onClick={handleCopyHeader}
                className={`absolute top-2 right-6 text-xs px-2.5 py-1.5 bg-dark text-white rounded-sm hover:opacity-90 transition-all ${animatingHeader ? 'scale-110 opacity-70' : 'opacity-100'}`}
              >
                {locale === 'en' ? 'Copy' : '复制'}
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
                className="w-full min-h-[180px] max-h-[60vh] p-3 pr-16 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary resize-none overflow-y-auto"
              />
              <button
                onClick={handleCopyPayload}
                className={`absolute top-2 right-6 text-xs px-2.5 py-1.5 bg-dark text-white rounded-sm hover:opacity-90 transition-all ${animatingPayload ? 'scale-110 opacity-70' : 'opacity-100'}`}
              >
                {locale === 'en' ? 'Copy' : '复制'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}