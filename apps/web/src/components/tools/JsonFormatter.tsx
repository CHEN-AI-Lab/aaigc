'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'

export default function JsonFormatter() {
  const t = useTranslations('tools')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Split output into lines for line-number rendering
  const lines = useMemo(() => {
    if (!output) return []
    return output.split('\n')
  }, [output])

  // Revoke previous blob URL before creating a new one, and on unmount
  const revokeUrl = useCallback((url: string) => {
    if (url) URL.revokeObjectURL(url)
  }, [])

  const generateDownloadUrl = useCallback((content: string) => {
    if (downloadUrl) revokeUrl(downloadUrl)
    const blob = new Blob([content], { type: 'application/json' })
    setDownloadUrl(URL.createObjectURL(blob))
  }, [downloadUrl, revokeUrl])

  const clearState = useCallback(() => {
    setOutput('')
    setError('')
    if (downloadUrl) {
      revokeUrl(downloadUrl)
      setDownloadUrl('')
    }
  }, [downloadUrl, revokeUrl])

  const format = useCallback(() => {
    setError('')
    try {
      const parsed = JSON.parse(input)
      const formatted = JSON.stringify(parsed, null, 2)
      setOutput(formatted)
      generateDownloadUrl(formatted)
    } catch (e) {
      setError(`${t('invalidJson')}: ${(e as Error).message}`)
      setOutput('')
      if (downloadUrl) {
        revokeUrl(downloadUrl)
        setDownloadUrl('')
      }
    }
  }, [input, t, generateDownloadUrl, downloadUrl, revokeUrl])

  const validate = useCallback(() => {
    setError('')
    try {
      JSON.parse(input)
      setOutput(t('validJson'))
    } catch (e) {
      setError(`${t('invalidJson')}: ${(e as Error).message}`)
      setOutput('')
    }
    if (downloadUrl) {
      revokeUrl(downloadUrl)
      setDownloadUrl('')
    }
  }, [input, t, downloadUrl, revokeUrl])

  const minify = useCallback(() => {
    setError('')
    try {
      const parsed = JSON.parse(input)
      const minified = JSON.stringify(parsed)
      setOutput(minified)
      generateDownloadUrl(minified)
    } catch (e) {
      setError(`${t('invalidJson')}: ${(e as Error).message}`)
      clearState()
    }
  }, [input, t, generateDownloadUrl, clearState])

  const handleCopy = useCallback(async () => {
    try {
      // Copy only the code text, not line numbers
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }, [output])

  return (
    <div className="mt-6 space-y-4">
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder='{"key": "value"}'
        className="w-full h-36 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-md text-sm font-mono text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30"
      />
      <div className="flex gap-2 flex-wrap items-center">
        <button onClick={format} className="px-4 py-2 bg-accent text-white text-sm rounded-md hover:opacity-90">{t('format')}</button>
        <button onClick={validate} className="px-4 py-2 bg-surface text-text-primary text-sm rounded-md hover:opacity-90 border border-[rgba(127,99,21,0.15)]">{t('validate')}</button>
        <button onClick={minify} className="px-4 py-2 bg-surface text-text-primary text-sm rounded-md hover:opacity-90 border border-[rgba(127,99,21,0.15)]">{t('minify')}</button>
        {downloadUrl && (
          <a
            href={downloadUrl}
            download="formatted.json"
            className="px-4 py-2 bg-accent text-white text-sm rounded-md hover:opacity-90 transition-opacity"
          >
            {t('downloadJson')}
          </a>
        )}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {output && (
        <div className="relative">
          {/* Single scrollable container: both line numbers + code scroll together */}
          <div
            ref={scrollRef}
            className="max-h-[60vh] overflow-auto bg-surface border border-[rgba(127,99,21,0.15)] rounded-md pr-10"
          >
            {/* Each line is a grid row: line-number column + code column */}
            {lines.map((line, i) => (
              <div
                key={i}
                className="grid grid-cols-[3.5em_1fr] min-h-[1.35em] hover:bg-[rgba(0,0,0,0.03)]"
              >
                {/* Line number — cannot be selected/copied */}
                <div
                  className="text-right pr-3 pl-2 text-text-secondary/50 text-xs leading-[1.5] select-none border-r border-[rgba(127,99,21,0.1)] py-px"
                  aria-hidden="true"
                >
                  {i + 1}
                </div>
                {/* Code text — preserves whitespace/indentation */}
                <pre className="m-0 pl-3 whitespace-pre text-sm font-mono text-text-primary leading-[1.5] min-w-0 py-px">
                  {line || '\u00A0'}
                </pre>
              </div>
            ))}
          </div>
          <button
            onClick={handleCopy}
            className={`absolute top-2 right-8 text-xs px-2.5 py-1.5 rounded-md transition-all duration-200 min-w-[4.5rem] text-center ${
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