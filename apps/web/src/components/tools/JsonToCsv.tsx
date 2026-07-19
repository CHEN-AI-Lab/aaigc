'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'

export default function JsonToCsv() {
  const t = useTranslations('tools')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const convert = useCallback(() => {
    setError('')
    if (!input.trim()) { setOutput(''); return }
    try {
      const data = JSON.parse(input)
      const arr = Array.isArray(data) ? data : [data]
      if (arr.length === 0) { setError(t('invalidInput')); return }

      const headers = Object.keys(arr[0])
      const csv = [
        headers.join(','),
        ...arr.map(row => headers.map(h => {
          const val = row[h]
          if (val === null || val === undefined) return ''
          const str = String(val)
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str
        }).join(','))
      ].join('\n')
      setOutput(csv)
    } catch {
      setError(t('invalidJson'))
    }
  }, [input, t])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }, [output])

  return (
    <div className="mt-6 space-y-4">
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder='[{"name":"Alice","age":30}]' className="w-full h-32 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      <button onClick={convert} className="px-6 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90">{t('convert')}</button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {output && (
        <div className="relative">
          <textarea readOnly value={output} className="w-full h-32 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary resize-none" />
          <button onClick={handleCopy}
            className={`text-xs px-2 py-1 rounded-sm transition-all duration-200 min-w-[4.5rem] text-center absolute top-2 right-2 ${
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