'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo Page</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      font-size: 1.75rem;
      color: #333;
      margin-bottom: 0.5rem;
    }
    p {
      color: #666;
      line-height: 1.6;
      margin-bottom: 1rem;
      font-size: 0.95rem;
    }
    .badge {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    button {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.6rem 1.5rem;
      border-radius: 8px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #5a6fd6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">HTML Preview</div>
    <h1>Welcome!</h1>
    <p>This is a live preview of your HTML code. Edit the code on the left and see the result update in real time on the right.</p>
    <p>You can write any HTML, CSS, and JavaScript — it will be rendered right here.</p>
    <button onclick="this.textContent='Clicked! 👋'">Click Me</button>
  </div>
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