'use client'

import { useState, useCallback } from 'react'
import { useLocale } from 'next-intl'

export default function JwtDecoder() {
  const locale = useLocale()
  const [input, setInput] = useState('')
  const [header, setHeader] = useState('')
  const [payload, setPayload] = useState('')
  const [error, setError] = useState('')

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

  return (
    <div className="mt-6 space-y-4">
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIs..." className="w-full h-24 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      <button onClick={decode} className="px-6 py-2 bg-dark text-white text-sm rounded-sm hover:opacity-90">{locale === 'en' ? 'Decode' : '解码'}</button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {header && (
        <div className="space-y-3">
          <div>
            <h3 className="text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wider">HEADER</h3>
            <div className="relative">
              <textarea readOnly value={header} className="w-full h-28 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary resize-none" />
              <button onClick={() => navigator.clipboard.writeText(header)} className="absolute top-2 right-2 text-xs px-2 py-1 bg-dark text-white rounded-sm hover:opacity-90">{locale === 'en' ? 'Copy' : '复制'}</button>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wider">PAYLOAD</h3>
            <div className="relative">
              <textarea readOnly value={payload} className="w-full h-36 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary resize-none" />
              <button onClick={() => navigator.clipboard.writeText(payload)} className="absolute top-2 right-2 text-xs px-2 py-1 bg-dark text-white rounded-sm hover:opacity-90">{locale === 'en' ? 'Copy' : '复制'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}