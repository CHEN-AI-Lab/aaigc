'use client'

import { useState, useCallback } from 'react'
import { useLocale } from 'next-intl'

export default function JsonFormatter() {
  const locale = useLocale()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const format = useCallback(() => {
    setError('')
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, 2))
    } catch (e) {
      setError(`${locale === 'en' ? 'Invalid JSON' : '无效的 JSON'}: ${(e as Error).message}`)
    }
  }, [input, locale])

  const validate = useCallback(() => {
    setError('')
    try {
      JSON.parse(input)
      setOutput(locale === 'en' ? '✅ Valid JSON' : '✅ JSON 格式正确')
    } catch (e) {
      setError(`${locale === 'en' ? 'Invalid JSON' : '无效的 JSON'}: ${(e as Error).message}`)
      setOutput('')
    }
  }, [input, locale])

  const minify = useCallback(() => {
    setError('')
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
    } catch (e) {
      setError(`${locale === 'en' ? 'Invalid JSON' : '无效的 JSON'}: ${(e as Error).message}`)
    }
  }, [input, locale])

  return (
    <div className="mt-6 space-y-4">
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder='{"key": "value"}' className="w-full h-36 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      <div className="flex gap-2 flex-wrap">
        <button onClick={format} className="px-4 py-2 bg-dark text-white text-sm rounded-sm hover:opacity-90">{locale === 'en' ? 'Format' : '格式化'}</button>
        <button onClick={validate} className="px-4 py-2 bg-surface text-text-primary text-sm rounded-sm hover:bg-accent/10 border border-[rgba(127,99,21,0.15)]">{locale === 'en' ? 'Validate' : '校验'}</button>
        <button onClick={minify} className="px-4 py-2 bg-surface text-text-primary text-sm rounded-sm hover:bg-accent/10 border border-[rgba(127,99,21,0.15)]">{locale === 'en' ? 'Minify' : '压缩'}</button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {output && (
        <div className="relative">
          <textarea readOnly value={output} className="w-full h-36 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary resize-none" />
          <button onClick={() => navigator.clipboard.writeText(output)} className="absolute top-2 right-2 text-xs px-2 py-1 bg-dark text-white rounded-sm hover:opacity-90">{locale === 'en' ? 'Copy' : '复制'}</button>
        </div>
      )}
    </div>
  )
}