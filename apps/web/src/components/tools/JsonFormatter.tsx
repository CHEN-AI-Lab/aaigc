'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { createToolContext } from 'shared/tools'
import { runJsonFormatter } from 'shared/tools/json-formatter'

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

  /** 主文案仍走 i18n；shared 透出的引擎原始报错作为次要文案附后 */
  const invalidJsonError = useCallback(
    (detail?: string) => (detail ? `${t('invalidJson')}: ${detail}` : t('invalidJson')),
    [t],
  )

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
    const outcome = runJsonFormatter({ text: input, mode: 'format', indent: 2 }, createToolContext())
    if (!outcome.ok) {
      setError(invalidJsonError(outcome.error.detail))
      setOutput('')
      if (downloadUrl) {
        revokeUrl(downloadUrl)
        setDownloadUrl('')
      }
      return
    }
    setOutput(outcome.data.text)
    generateDownloadUrl(outcome.data.text)
    // t 不在此处直接使用（错误文案走 invalidJsonError，它自己已依赖 t），故不列入依赖
  }, [input, generateDownloadUrl, downloadUrl, revokeUrl, invalidJsonError])

  const validate = useCallback(() => {
    setError('')
    const outcome = runJsonFormatter({ text: input, mode: 'validate', indent: 2 }, createToolContext())
    if (!outcome.ok) {
      setError(invalidJsonError(outcome.error.detail))
      setOutput('')
    } else {
      setOutput(t('validJson'))
    }
    if (downloadUrl) {
      revokeUrl(downloadUrl)
      setDownloadUrl('')
    }
  }, [input, t, downloadUrl, revokeUrl, invalidJsonError])

  const minify = useCallback(() => {
    setError('')
    const outcome = runJsonFormatter({ text: input, mode: 'minify', indent: 2 }, createToolContext())
    if (!outcome.ok) {
      setError(invalidJsonError(outcome.error.detail))
      clearState()
      return
    }
    setOutput(outcome.data.text)
    generateDownloadUrl(outcome.data.text)
    // 同上：t 未被直接使用
  }, [input, generateDownloadUrl, clearState, invalidJsonError])

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
        className="w-full h-36 p-3 bg-surface border border-border rounded-sm text-sm font-mono text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30"
      />
      <div className="flex gap-2 flex-wrap items-center">
        <button onClick={format} className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90">{t('format')}</button>
        <button onClick={validate} className="px-4 py-2 bg-surface text-text-primary text-sm rounded-sm hover:opacity-90 border border-border">{t('validate')}</button>
        <button onClick={minify} className="px-4 py-2 bg-surface text-text-primary text-sm rounded-sm hover:opacity-90 border border-border">{t('minify')}</button>
        {downloadUrl && (
          <a
            href={downloadUrl}
            download="formatted.json"
            className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
          >
            {t('downloadJson')}
          </a>
        )}
      </div>
      {error && <p className="text-error text-sm">{error}</p>}
      {output && (
        <div className="relative">
          {/* Single scrollable container: both line numbers + code scroll together */}
          <div
            ref={scrollRef}
            className="max-h-[60vh] overflow-auto bg-surface border border-border rounded-sm pr-10"
          >
            {/* Each line is a grid row: line-number column + code column */}
            {lines.map((line, i) => (
              <div
                key={i}
                className="grid grid-cols-[3.5em_1fr] min-h-[1.35em] hover:bg-hover"
              >
                {/* Line number — cannot be selected/copied */}
                <div
                  className="text-right pr-3 pl-2 text-text-secondary/50 text-xs leading-[1.5] select-none border-r border-border py-px"
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
            className={`absolute top-2 right-8 text-xs px-2.5 py-1.5 rounded-sm transition-all duration-200 min-w-[4.5rem] text-center ${
              copied
                ? 'bg-success text-white scale-105'
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