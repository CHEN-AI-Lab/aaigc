'use client'

import { useState, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createToolContext } from 'shared/tools'
import { runListSorter } from 'shared/tools/list-sorter'
import type { ListSorterMode } from 'shared/tools/list-sorter'

export default function ListSorter() {
  const t = useTranslations('tools')
  const locale = useLocale()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  const sortLines = useCallback((mode: ListSorterMode) => {
    if (!input.trim()) { setOutput(''); return }
    // 洗牌随机源经 ToolContext 注入，端侧不直接调 Math.random()
    const outcome = runListSorter({ text: input, mode }, createToolContext({ locale }))
    if (!outcome.ok) return
    setOutput(outcome.data.text)
  }, [input, locale])

  return (
    <div className="mt-6 space-y-4">
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={t('enterText')} className="w-full h-32 p-3 bg-surface border border-border rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => sortLines('asc')} className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90">{t('sortAsc')}</button>
        <button onClick={() => sortLines('desc')} className="px-4 py-2 bg-surface text-text-primary text-sm rounded-sm hover:bg-accent/10 border border-border">{t('sortDesc')}</button>
        <button onClick={() => sortLines('unique')} className="px-4 py-2 bg-surface text-text-primary text-sm rounded-sm hover:bg-accent/10 border border-border">{t('dedup')}</button>
        <button onClick={() => sortLines('shuffle')} className="px-4 py-2 bg-surface text-text-primary text-sm rounded-sm hover:bg-accent/10 border border-border">{t('shuffle')}</button>
      </div>
      {output && (
        <div className="relative">
          <textarea readOnly value={output} className="w-full h-32 p-3 bg-surface border border-border rounded-sm text-sm text-text-primary resize-none" />
          <button onClick={() => navigator.clipboard.writeText(output)} className="absolute top-2 right-6 text-xs px-2 py-1 bg-accent text-white rounded-sm hover:opacity-90 min-w-[4.5rem] text-center">{t('copy')}</button>
        </div>
      )}
    </div>
  )
}