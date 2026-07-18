'use client'

import { useState, useCallback, useRef } from 'react'
import { useLocale } from 'next-intl'

export default function JsonFormatter() {
  const locale = useLocale()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [animating, setAnimating] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState('')
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const format = useCallback(() => {
    setError('')
    try {
      const parsed = JSON.parse(input)
      const formatted = JSON.stringify(parsed, null, 2)
      setOutput(formatted)
      const blob = new Blob([formatted], { type: 'application/json' })
      setDownloadUrl(URL.createObjectURL(blob))
    } catch (e) {
      setError(`${locale === 'en' ? 'Invalid JSON' : '无效的 JSON'}: ${(e as Error).message}`)
      setOutput('')
      setDownloadUrl('')
    }
  }, [input, locale])

  const validate = useCallback(() => {
    setError('')
    try {
      JSON.parse(input)
      setOutput(locale === 'en' ? '✅ Valid JSON' : '✅ JSON 格式正确')
      setDownloadUrl('')
    } catch (e) {
      setError(`${locale === 'en' ? 'Invalid JSON' : '无效的 JSON'}: ${(e as Error).message}`)
      setOutput('')
      setDownloadUrl('')
    }
  }, [input, locale])

  const minify = useCallback(() => {
    setError('')
    try {
      const parsed = JSON.parse(input)
      const minified = JSON.stringify(parsed)
      setOutput(minified)
      const blob = new Blob([minified], { type: 'application/json' })
      setDownloadUrl(URL.createObjectURL(blob))
    } catch (e) {
      setError(`${locale === 'en' ? 'Invalid JSON' : '无效的 JSON'}: ${(e as Error).message}`)
      setOutput('')
      setDownloadUrl('')
    }
  }, [input, locale])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(output)
    setAnimating(true)
    if (animTimer.current) clearTimeout(animTimer.current)
    animTimer.current = setTimeout(() => setAnimating(false), 400)
  }, [output])

  return (
    <div className="mt-6 space-y-4">
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder='{"key": "value"}'
        className="w-full h-36 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30"
      />
      <div className="flex gap-2 flex-wrap items-center">
        <button onClick={format} className="px-4 py-2 bg-dark text-white text-sm rounded-sm hover:opacity-90">{locale === 'en' ? 'Format' : '格式化'}</button>
        <button onClick={validate} className="px-4 py-2 bg-surface text-text-primary text-sm rounded-sm hover:bg-accent/10 border border-[rgba(127,99,21,0.15)]">{locale === 'en' ? 'Validate' : '校验'}</button>
        <button onClick={minify} className="px-4 py-2 bg-surface text-text-primary text-sm rounded-sm hover:bg-accent/10 border border-[rgba(127,99,21,0.15)]">{locale === 'en' ? 'Minify' : '压缩'}</button>
        {downloadUrl && (
          <a
            href={downloadUrl}
            download="formatted.json"
            className="px-4 py-2 bg-dark text-white text-sm rounded-sm hover:opacity-90 transition-opacity"
          >
            {locale === 'en' ? 'Download JSON' : '下载 JSON'}
          </a>
        )}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {output && (
        <div className="relative">
          <textarea
            readOnly
            value={output}
            className="w-full h-64 p-3 pr-16 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary resize-none"
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