'use client'

import { useState, useMemo } from 'react'
import { useLocale } from 'next-intl'

export default function WordCounter() {
  const locale = useLocale()
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
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder={locale === 'en' ? 'Type or paste text here...' : '在此输入或粘贴文本...'} className="w-full h-48 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-surface p-3 rounded-sm text-center">
          <div className="text-lg font-semibold text-accent">{stats.chars}</div>
          <div className="text-xs text-text-secondary">{locale === 'en' ? 'Characters' : '字符数'}</div>
        </div>
        <div className="bg-surface p-3 rounded-sm text-center">
          <div className="text-lg font-semibold text-accent">{stats.charsNoSpace}</div>
          <div className="text-xs text-text-secondary">{locale === 'en' ? 'No Space' : '不含空格'}</div>
        </div>
        <div className="bg-surface p-3 rounded-sm text-center">
          <div className="text-lg font-semibold text-accent">{stats.words}</div>
          <div className="text-xs text-text-secondary">{locale === 'en' ? 'Words' : '单词数'}</div>
        </div>
        <div className="bg-surface p-3 rounded-sm text-center">
          <div className="text-lg font-semibold text-accent">{stats.lines}</div>
          <div className="text-xs text-text-secondary">{locale === 'en' ? 'Lines' : '行数'}</div>
        </div>
        <div className="bg-surface p-3 rounded-sm text-center">
          <div className="text-lg font-semibold text-accent">{stats.cjk}</div>
          <div className="text-xs text-text-secondary">{locale === 'en' ? 'CJK' : '中文字符'}</div>
        </div>
      </div>
    </div>
  )
}