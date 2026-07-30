'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
  <style>
    body { margin: 0; font-family: sans-serif; }
    header { background: #333; color: #fff; padding: 1rem 2rem; }
    header h1 { margin: 0; font-size: 1.2rem; }
    main { padding: 2rem; max-width: 640px; margin: 0 auto; }
    main h2 { color: #333; }
    main p { color: #666; line-height: 1.6; }
    footer { background: #f0f0f0; text-align: center; padding: 1rem; font-size: 0.8rem; color: #999; }
  </style>
</head>
<body>
  <header><h1>My Website</h1></header>
  <main>
    <h2>Welcome</h2>
    <p>This is a simple webpage preview. Edit the HTML code on the left to see changes here.</p>
  </main>
  <footer>&copy; 2025</footer>
</body>
</html>`

export default function HtmlPreview() {
  const t = useTranslations('tools')
  const [html, setHtml] = useState(DEFAULT_HTML)

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[400px]">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{t('editor')}</span>
        <textarea value={html} onChange={e => setHtml(e.target.value)} className="w-full flex-1 min-h-[400px] p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-md text-sm font-mono text-text-primary resize-none focus:outline-none focus:border-accent/30" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{t('preview')}</span>
        <iframe sandbox="allow-scripts" srcDoc={html} className="w-full flex-1 min-h-[400px] bg-white border border-[rgba(127,99,21,0.15)] rounded-md" />
      </div>
    </div>
  )
}