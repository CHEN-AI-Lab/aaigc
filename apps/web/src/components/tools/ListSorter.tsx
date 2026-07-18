'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'

export default function ListSorter() {
  const t = useTranslations('tools')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  const sortLines = useCallback((type: 'asc' | 'desc' | 'unique' | 'shuffle') => {
    if (!input.trim()) { setOutput(''); return }
    let lines = input.split('\n')
    switch (type) {
      case 'asc': lines.sort((a, b) => a.localeCompare(b)); break
      case 'desc': lines.sort((a, b) => b.localeCompare(a)); break
      case 'unique': lines = [...new Set(lines)]; break
      case 'shuffle': lines.sort(() => Math.random() - 0.5); break
    }
    setOutput(lines.join('\n'))
  }, [input])

  return (
    <div className="mt-6 space-y-4">
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={t('enterText')} className="w-full h-32 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => sortLines('asc')} className="px-4 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90">{t('sortAsc')}</button>
        <button onClick={() => sortLines('desc')} className="px-4 py-2 bg-surface text-text-primary text-sm rounded-sm hover:bg-accent/10 border border-[rgba(127,99,21,0.15)]">{t('sortDesc')}</button>
        <button onClick={() => sortLines('unique')} className="px-4 py-2 bg-surface text-text-primary text-sm rounded-sm hover:bg-accent/10 border border-[rgba(127,99,21,0.15)]">{t('dedup')}</button>
        <button onClick={() => sortLines('shuffle')} className="px-4 py-2 bg-surface text-text-primary text-sm rounded-sm hover:bg-accent/10 border border-[rgba(127,99,21,0.15)]">{t('shuffle')}</button>
      </div>
      {output && (
        <div className="relative">
          <textarea readOnly value={output} className="w-full h-32 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary resize-none" />
          <button onClick={() => navigator.clipboard.writeText(output)} className="absolute top-2 right-2 text-xs px-2 py-1 bg-accent text-white rounded-sm hover:opacity-90">{t('copy')}</button>
        </div>
      )}
    </div>
  )
}