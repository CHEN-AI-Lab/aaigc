'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'

export default function WordCounter() {
  const t = useTranslations('tools')
  const [text, setText] = useState('')

  const stats = useMemo(() => {
    const chars = text.length
    const charsNoSpace = text.replace(/\s/g, '').length
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const lines = text ? text.split('\n').length : 0
    const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length
    return { chars, charsNoSpace, words, lines, cjk }
  }, [text])

  return (
    <div className="mt-6 space-y-4">
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder={t('typeOrPasteText')} className="w-full h-48 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-surface p-3 rounded-lg text-center">
          <div className="text-lg font-semibold text-accent">{stats.chars}</div>
          <div className="text-xs text-text-secondary">{t('characters')}</div>
        </div>
        <div className="bg-surface p-3 rounded-lg text-center">
          <div className="text-lg font-semibold text-accent">{stats.charsNoSpace}</div>
          <div className="text-xs text-text-secondary">{t('noSpace')}</div>
        </div>
        <div className="bg-surface p-3 rounded-lg text-center">
          <div className="text-lg font-semibold text-accent">{stats.words}</div>
          <div className="text-xs text-text-secondary">{t('words')}</div>
        </div>
        <div className="bg-surface p-3 rounded-lg text-center">
          <div className="text-lg font-semibold text-accent">{stats.lines}</div>
          <div className="text-xs text-text-secondary">{t('lines')}</div>
        </div>
        <div className="bg-surface p-3 rounded-lg text-center">
          <div className="text-lg font-semibold text-accent">{stats.cjk}</div>
          <div className="text-xs text-text-secondary">{t('cjk')}</div>
        </div>
      </div>
    </div>
  )
}