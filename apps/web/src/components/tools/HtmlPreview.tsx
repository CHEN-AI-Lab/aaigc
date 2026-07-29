'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Demo</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; background: #f5f5f5; }
    h1 { color: #333; }
    p { color: #666; line-height: 1.6; }
  </style>
</head>
<body>
  <h1>Hello</h1>
  <p>Edit the HTML code on the left to see live preview here.</p>
</body>
</html>`

export default function HtmlPreview() {
  const t = useTranslations('tools')
  const [html, setHtml] = useState(DEFAULT_HTML)

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[400px]">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{t('editor')}</span>
        <textarea value={html} onChange={e => setHtml(e.target.value)} className="w-full flex-1 min-h-[400px] p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary resize-none focus:outline-none focus:border-accent/30" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{t('preview')}</span>
        <div className="flex-1 min-h-[400px] p-3 bg-card border border-[rgba(127,99,21,0.15)] rounded-sm text-sm" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  )
}