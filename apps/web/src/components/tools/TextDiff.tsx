'use client'

import { useState, useMemo } from 'react'
import { useLocale } from 'next-intl'

export default function TextDiff() {
  const locale = useLocale()
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')

  const diffResult = useMemo(() => {
    if (!left && !right) return null
    const leftLines = left.split('\n')
    const rightLines = right.split('\n')
    const maxLen = Math.max(leftLines.length, rightLines.length)
    const result: { type: 'same' | 'added' | 'removed'; text: string; line: number }[] = []

    for (let i = 0; i < maxLen; i++) {
      const l = leftLines[i] ?? ''
      const r = rightLines[i] ?? ''
      if (l === r) {
        if (l !== '') result.push({ type: 'same', text: l, line: i + 1 })
      } else {
        if (l !== '') result.push({ type: 'removed', text: l, line: i + 1 })
        if (r !== '') result.push({ type: 'added', text: r, line: i + 1 })
      }
    }
    return result
  }, [left, right])

  return (
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <textarea value={left} onChange={e => setLeft(e.target.value)} placeholder={locale === 'en' ? 'Original text' : '原始文本'} className="w-full h-48 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
        <textarea value={right} onChange={e => setRight(e.target.value)} placeholder={locale === 'en' ? 'Modified text' : '修改后文本'} className="w-full h-48 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      </div>
      {diffResult && (
        <div className="border border-[rgba(127,99,21,0.15)] rounded-sm overflow-hidden">
          <div className="text-xs font-mono">
            {diffResult.map((item, i) => (
              <div key={i} className={`flex px-3 py-1 ${
                item.type === 'removed' ? 'bg-red-50 text-red-700' :
                item.type === 'added' ? 'bg-green-50 text-green-700' :
                'text-text-secondary'
              }`}>
                <span className="w-8 shrink-0 text-right mr-3 opacity-50">{item.line}</span>
                <span className={`${item.type === 'removed' ? 'line-through' : ''}`}>{item.text || ' '}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-4 text-xs text-text-secondary">
        <span>{locale === 'en' ? 'Lines' : '行数'}: {Math.max(left.split('\n').length, right.split('\n').length)}</span>
        <button onClick={() => { setLeft(''); setRight('') }} className="hover:text-accent transition-colors">
          {locale === 'en' ? 'Clear' : '清空'}
        </button>
      </div>
    </div>
  )
}