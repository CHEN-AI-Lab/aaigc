'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'

export default function JsonToCsv() {
  const t = useTranslations('tools')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleDownload = useCallback(() => {
    if (!output) return
    const blob = new Blob([output], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [output])

  const flatten = (obj: unknown, prefix = ''): Record<string, string> => {
    const result: Record<string, string> = {}
    if (obj === null || obj === undefined) return result
    if (typeof obj !== 'object' || Array.isArray(obj)) {
      result[prefix] = String(obj)
      return result
    }
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        Object.assign(result, flatten(v, key))
      } else {
        result[key] = v === null || v === undefined ? '' : String(v)
      }
    }
    return result
  }

  const convert = useCallback(() => {
    setError('')
    if (!input.trim()) { setOutput(''); return }
    try {
      const data = JSON.parse(input)

      if (Array.isArray(data)) {
        if (data.length === 0) { setError(t('invalidInput')); return }

        const hasObjects = data.some(item => item !== null && typeof item === 'object' && !Array.isArray(item))

        if (hasObjects) {
          // Array of objects → horizontal (standard CSV)
          const flatRows = data.map(row => flatten(row))
          const headers = [...new Set(flatRows.flatMap(r => Object.keys(r)))]
          const csv = [
            headers.join(','),
            ...flatRows.map(row => headers.map(h => {
              const val = row[h] ?? ''
              const str = String(val)
              return str.includes(',') || str.includes('"') || str.includes('\n')
                ? `"${str.replace(/"/g, '""')}"`
                : str
            }).join(','))
          ].join('\n')
          setOutput(csv)
        } else {
          // Array of primitives → one column
          const csv = [
            'Value',
            ...data.map(v => {
              const str = String(v)
              return str.includes(',') || str.includes('"') || str.includes('\n')
                ? `"${str.replace(/"/g, '""')}"`
                : str
            })
          ].join('\n')
          setOutput(csv)
        }
      } else if (data !== null && typeof data === 'object') {
        // Single object → vertical (key-value pairs)
        const flat = flatten(data)
        const csv = [
          'Key,Value',
          ...Object.entries(flat).map(([k, v]) => {
            const str = String(v)
            return str.includes(',') || str.includes('"') || str.includes('\n')
              ? `${k},"${str.replace(/"/g, '""')}"`
              : `${k},${str}`
          })
        ].join('\n')
        setOutput(csv)
      } else {
        // Single primitive value
        setOutput(`Value\n${String(data)}`)
      }
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
      <div className="flex gap-2">
        <button onClick={convert} className="px-6 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90">{t('convert')}</button>
        {output && <button onClick={handleDownload} className="px-6 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90">{t('downloadCsv')}</button>}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {output && (
        <div className="relative">
          <textarea readOnly value={output} className="w-full h-96 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary resize-none" />
          <button onClick={handleCopy}
            className={`text-xs px-2 py-1 rounded-sm transition-all duration-200 min-w-[4.5rem] text-center absolute top-2 right-6 ${
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