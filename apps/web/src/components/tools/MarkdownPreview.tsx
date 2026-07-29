'use client'

import { useState, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

type PreviewTab = 'rendered' | 'html' | 'plain' | 'stats'

const DEFAULT_MARKDOWN = `# Welcome to Markdown Preview

Start typing **Markdown** here... or use the sample below.

## Text Formatting

**Bold text**, *italic text*, ~~strikethrough~~, and \`inline code\`.

## Lists

- Item one
- Item two
- Item three

1. First step
2. Second step
3. Third step

## Code Block

\`\`\`javascript
function hello() {
  console.log('Hello, world!')
}
\`\`\`

## Blockquote

> This is a blockquote.
> It can span multiple lines.

## Table

| Name  | Type   | Price |
|-------|--------|-------|
| Apple | Fruit  | $1    |
| Milk  | Dairy  | $3    |

## Links & Images

[Visit GitHub](https://github.com)

---

*Built with react-markdown*`

export default function MarkdownPreview() {
  const t = useTranslations('tools')
  const [input, setInput] = useState(DEFAULT_MARKDOWN)
  const [activeTab, setActiveTab] = useState<PreviewTab>('rendered')

  // Convert Markdown to HTML string
  const htmlString = useMemo(() => {
    try {
      const file = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkBreaks)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(input)
      return String(file)
    } catch {
      return '<p>Failed to parse Markdown</p>'
    }
  }, [input])

  // Strip Markdown to plain text
  const plainText = useMemo(() => {
    return input
      .replace(/^#{1,6}\s+/gm, '')          // headings
      .replace(/\*\*(.+?)\*\*/g, '$1')       // bold
      .replace(/\*(.+?)\*/g, '$1')           // italic
      .replace(/~~(.+?)~~/g, '$1')           // strikethrough
      .replace(/`{1,3}[^`]*`{1,3}/g, '')     // code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // images
      .replace(/>\s+/gm, '')                 // blockquotes
      .replace(/[-*+]\s+/gm, '')             // unordered list
      .replace(/\d+\.\s+/gm, '')             // ordered list
      .replace(/\|/g, '')                    // table pipes
      .replace(/[-]{3,}/g, '')               // horizontal rules
      .replace(/```[\s\S]*?```/g, '')        // code blocks
      .replace(/\n{3,}/g, '\n\n')            // collapse blank lines
      .trim()
  }, [input])

  // Compute stats
  const stats = useMemo(() => {
    const lines = input.split('\n').length
    const chars = input.length
    const charsNoSpace = input.replace(/\s/g, '').length
    const words = input
      .split(/[\s]+/)
      .filter(Boolean)
      .filter(w => /[a-zA-Z]/.test(w)).length
    const cjkChars = (input.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length
    const readingTimeMin = Math.max(1, Math.round(words / 200 + cjkChars / 300))

    // Count structural elements
    const headings = (input.match(/^#{1,6}\s/gm) || []).length
    const codeBlocks = (input.match(/```/g) || []).length / 2
    const links = (input.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length
    const images = (input.match(/!\[([^\]]*)\]\([^)]+\)/g) || []).length
    const lists = (input.match(/^[-*+]\s/gm) || []).length + (input.match(/^\d+\.\s/gm) || []).length
    const tables = (input.match(/^\|.+\|$/gm) || []).length > 0 ? 1 : 0

    return { lines, chars, charsNoSpace, words, cjkChars, readingTimeMin, headings, codeBlocks, links, images, lists, tables }
  }, [input])

  const handleDownload = useCallback(() => {
    const blob = new Blob([input], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.md'
    a.click()
    URL.revokeObjectURL(url)
  }, [input])

  const tabs: { key: PreviewTab; label: string }[] = [
    { key: 'rendered', label: t('rendered') },
    { key: 'html', label: t('htmlSource') },
    { key: 'plain', label: t('plainText') },
    { key: 'stats', label: t('stats') },
  ]

  return (
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[500px]">
        {/* Editor */}
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
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t('enterMarkdown')}
            className="w-full flex-1 min-h-[500px] p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30"
          />
        </div>

        {/* Preview */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1 border-b border-[rgba(127,99,21,0.15)]">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? 'text-accent border-accent'
                    : 'text-text-secondary border-transparent hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-[500px] overflow-y-auto p-3 bg-card border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary">
            {activeTab === 'rendered' && (
              <div className="prose prose-sm max-w-none [&_blockquote]:!border-l-2 [&_blockquote]:!border-accent/30 [&_blockquote]:!pl-4 [&_blockquote]:!italic [&_blockquote]:!text-text-secondary [&_blockquote_p::before]:!content-none [&_blockquote_p::after]:!content-none [&_pre]:!text-sm [&_code]:!text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{input}</ReactMarkdown>
              </div>
            )}

            {activeTab === 'html' && (
              <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-all text-text-primary">
                {htmlString}
              </pre>
            )}

            {activeTab === 'plain' && (
              <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-text-primary">
                {plainText || <span className="text-text-secondary italic">{t('pleaseEnterContent')}</span>}
              </pre>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label={t('characters')} value={stats.chars.toLocaleString()} />
                  <StatCard label={t('noSpace')} value={stats.charsNoSpace.toLocaleString()} />
                  <StatCard label={t('words')} value={stats.words.toLocaleString()} />
                  <StatCard label={t('cjk')} value={stats.cjkChars.toLocaleString()} />
                  <StatCard label={t('lines')} value={stats.lines.toLocaleString()} />
                  <StatCard
                    label={t('readingTime')}
                    value={`${stats.readingTimeMin} ${t('minutes')}`}
                  />
                </div>

                <div className="border-t border-[rgba(127,99,21,0.15)] pt-3">
                  <span className="text-xs font-medium text-text-secondary block mb-2">{t('structure')}</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatCard label={t('headings')} value={stats.headings.toLocaleString()} />
                    <StatCard label={t('codeBlocks')} value={stats.codeBlocks.toLocaleString()} />
                    <StatCard label={t('links')} value={stats.links.toLocaleString()} />
                    <StatCard label={t('images')} value={stats.images.toLocaleString()} />
                    <StatCard label={t('lists')} value={stats.lists.toLocaleString()} />
                    <StatCard label={t('tables')} value={stats.tables.toLocaleString()} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface rounded-sm p-3 text-center">
      <div className="text-lg font-semibold text-text-primary">{value}</div>
      <div className="text-xs text-text-secondary mt-0.5">{label}</div>
    </div>
  )
}