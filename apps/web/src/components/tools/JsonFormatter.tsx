'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'

export default function JsonFormatter() {
  const t = useTranslations('tools')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState('')
  const outputRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = useCallback(() => {
    const el = outputRef.current
    if (!el) return
    el.style.height = '0'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  useEffect(() => { autoResize() }, [output, autoResize])

  // Revoke previous blob URL before creating a new one, and on unmount
  const revokeUrl = useCallback((url: string) => {
    if (url) URL.revokeObjectURL(url)
  }, [])

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    }
  }, [downloadUrl])

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
        className="w-full h-36 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30"
      />
      <div className="flex gap-2 flex-wrap items-center">
        <button onClick={format} className="px-4 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90">{t('format')}</button>
        <button onClick={validate} className="px-4 py-2 bg-surface text-text-primary text-sm rounded-sm hover:bg-accent/10 border border-[rgba(127,99,21,0.15)]">{t('validate')}</button>
        <button onClick={minify} className="px-4 py-2 bg-surface text-text-primary text-sm rounded-sm hover:bg-accent/10 border border-[rgba(127,99,21,0.15)]">{t('minify')}</button>
        {downloadUrl && (
          <a
            href={downloadUrl}
            download="formatted.json"
            className="px-4 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90 transition-opacity"
          >
            {t('downloadJson')}
          </a>
        )}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {output && (
        <div className="relative">
          <textarea
            ref={outputRef}
            readOnly
            value={output}
            className="w-full min-h-[200px] max-h-[60vh] p-3 pr-16 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary resize-none overflow-y-auto"
          />
          <button
            onClick={handleCopy}
            className={`absolute top-2 right-6 text-xs px-2.5 py-1.5 rounded-sm transition-all duration-200 ${
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