'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import ReactMarkdown from 'react-markdown'

export default function MarkdownPreview() {
  const locale = useLocale()
  const [input, setInput] = useState('# Hello\n\nStart typing **Markdown** here...')

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[400px]">
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={locale === 'en' ? 'Enter Markdown...' : '输入 Markdown...'} className="w-full h-[400px] p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      <div className="h-[400px] overflow-y-auto p-3 bg-white border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary prose prose-sm max-w-none">
        <ReactMarkdown>{input}</ReactMarkdown>
      </div>
    </div>
  )
}