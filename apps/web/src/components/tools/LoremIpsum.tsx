'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'

const WORDS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'dolor', 'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat', 'nulla', 'pariatur']

export default function LoremIpsum() {
  const t = useTranslations('tools')
  const [output, setOutput] = useState('')
  const [count, setCount] = useState(5)
  const [type, setType] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs')
  const [copied, setCopied] = useState(false)

  const generate = useCallback(() => {
    const n = Math.min(100, Math.max(1, count))
    if (type === 'words') {
      const result = Array.from({ length: n }, () => WORDS[Math.floor(Math.random() * WORDS.length)]).join(' ')
      setOutput(result.charAt(0).toUpperCase() + result.slice(1) + '.')
    } else if (type === 'sentences') {
      const result = Array.from({ length: n }, () => {
        const len = 5 + Math.floor(Math.random() * 15)
        const s = Array.from({ length: len }, () => WORDS[Math.floor(Math.random() * WORDS.length)]).join(' ')
        return s.charAt(0).toUpperCase() + s.slice(1) + '.'
      }).join(' ')
      setOutput(result)
    } else {
      const result = Array.from({ length: n }, () => {
        const sentences = 3 + Math.floor(Math.random() * 5)
        const p = Array.from({ length: sentences }, () => {
          const len = 8 + Math.floor(Math.random() * 20)
          const s = Array.from({ length: len }, () => WORDS[Math.floor(Math.random() * WORDS.length)]).join(' ')
          return s.charAt(0).toUpperCase() + s.slice(1) + '.'
        }).join(' ')
        return p
      }).join('\n\n')
      setOutput(result)
    }
  }, [count, type])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }, [output])

  return (
    <div className="mt-6 space-y-4">
      <div className="p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-xs text-text-secondary leading-relaxed">
        {t('loremDesc')}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {(['paragraphs', 'sentences', 'words'] as const).map((mode) => (
            <button key={mode} onClick={() => setType(mode)} className={`px-3 py-1.5 text-sm rounded-sm transition-colors ${
              type === mode ? 'bg-accent text-white' : 'bg-surface text-text-primary hover:bg-accent/10'
            }`}>
              {t(`lorem${mode.charAt(0).toUpperCase() + mode.slice(1)}`)}
            </button>
          ))}
        </div>
        <input type="number" min={1} max={100} value={count} onChange={e => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
          className="w-20 p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary text-center focus:outline-none focus:border-accent/30" />
        <span className="text-xs text-text-secondary">{t('count')}</span>
        <button onClick={generate} className="px-6 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90">{t('generate')}</button>
      </div>
      {output && (
        <div className="relative">
          <textarea readOnly value={output} className="w-full h-48 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary resize-none" />
          <button onClick={handleCopy}
            className={`text-xs px-2 py-1 rounded-sm transition-all duration-200 min-w-[4.5rem] text-center absolute top-2 right-6 ${
              copied
                ? 'bg-green-500 text-white scale-105'
                : 'bg-accent text-white hover:opacity-90'
            }`}>
            {copied ? t('copied') : t('copy')}
          </button>
        </div>
      )}
    </div>
  )
}