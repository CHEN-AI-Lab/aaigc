'use client'

import { useState, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import ReactMarkdown from 'react-markdown'

export default function MarkdownPreview() {
  const t = useTranslations('tools')
  const [input, setInput] = useState('# Hello\n\nStart typing **Markdown** here...')

  const downloadRef = useRef<HTMLAnchorElement>(null)

  const handleDownload = useCallback(() => {
    const blob = new Blob([input], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.md'
    a.click()
    URL.revokeObjectURL(url)
  }, [input])

  return (
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[400px]">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">{t('editor')}</span>
            <button
              onClick={handleDownload}
              className="text-xs px-2.5 py-1 bg-accent text-white rounded-sm hover:opacity-90 transition-opacity"
            >
              {t('downloadMarkdown')}
            </button>
          </div>
          <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={t('enterMarkdown')} className="w-full flex-1 min-h-[400px] p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-text-secondary font-medium">{t('preview')}</span>
          <div className="flex-1 min-h-[400px] overflow-y-auto p-3 bg-card border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary prose prose-sm max-w-none">
            <ReactMarkdown>{input}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}