'use client'

import { useState, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { diffLines } from 'diff'

export default function TextDiff() {
  const locale = useLocale()
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')

  const diffResult = useMemo(() => {
    if (!left && !right) return null
    return diffLines(left, right)
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
            {diffResult.map((part, i) => {
              const lines = part.value.split('\n')
              // Remove trailing empty line from split
              if (lines[lines.length - 1] === '') lines.pop()
              if (lines.length === 0) return null
              return lines.map((line, j) => {
                if (part.added) {
                  return <div key={`${i}-${j}`} className="flex px-3 py-0.5 bg-green-50 text-green-700"><span className="w-6 shrink-0 text-green-500">+</span><span className="break-all">{line}</span></div>
                }
                if (part.removed) {
                  return <div key={`${i}-${j}`} className="flex px-3 py-0.5 bg-red-50 text-red-700"><span className="w-6 shrink-0 text-red-500">-</span><span className="break-all">{line}</span></div>
                }
                return <div key={`${i}-${j}`} className="flex px-3 py-0.5 text-text-secondary"><span className="w-6 shrink-0 opacity-50">{' '}</span><span className="break-all">{line}</span></div>
              })
            })}
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