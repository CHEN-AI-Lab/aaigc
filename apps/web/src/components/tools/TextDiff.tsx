'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { createToolContext } from 'shared/tools'
import { runTextDiff } from 'shared/tools/text-diff'
import type { TextDiffOutput } from 'shared/tools/text-diff'

export default function TextDiff() {
  const t = useTranslations('tools')
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')

  // 旧行为：diff 包的 diffLines（jsdiff）逐行 diff → 新行为：shared 的 LCS 行 diff，已确认接受
  const diffResult = useMemo((): TextDiffOutput | null => {
    if (!left && !right) return null
    const outcome = runTextDiff({ left, right }, createToolContext())
    return outcome.ok ? outcome.data : null
  }, [left, right])

  return (
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <textarea value={left} onChange={e => setLeft(e.target.value)} placeholder={t('originalText')} className="w-full h-48 p-3 bg-surface border border-border rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
        <textarea value={right} onChange={e => setRight(e.target.value)} placeholder={t('modifiedText')} className="w-full h-48 p-3 bg-surface border border-border rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      </div>
      {diffResult && (
        <div className="border border-border rounded-sm overflow-hidden">
          <div className="text-xs font-mono">
            {diffResult.parts.map((part, i) => {
              const lines = part.value.split('\n')
              // Remove trailing empty line from split
              if (lines[lines.length - 1] === '') lines.pop()
              if (lines.length === 0) return null
              return lines.map((line, j) => {
                if (part.type === 'added') {
                  return <div key={`${i}-${j}`} className="flex px-3 py-0.5 bg-success/10 text-success"><span className="w-6 shrink-0 text-success">+</span><span className="break-all">{line}</span></div>
                }
                if (part.type === 'removed') {
                  return <div key={`${i}-${j}`} className="flex px-3 py-0.5 bg-error/10 text-error"><span className="w-6 shrink-0 text-error">-</span><span className="break-all">{line}</span></div>
                }
                return <div key={`${i}-${j}`} className="flex px-3 py-0.5 text-text-secondary"><span className="w-6 shrink-0 opacity-50">{' '}</span><span className="break-all">{line}</span></div>
              })
            })}
          </div>
        </div>
      )}
      <div className="flex gap-4 text-xs text-text-secondary">
        {/* 旧行为：max(左行数, 右行数)（空输入显示 1）→ 新行为：diffResult.totalLines（空输入显示 0），已确认接受 */}
        <span>{t('lines')}: {diffResult ? diffResult.totalLines : 0}</span>
        <button onClick={() => { setLeft(''); setRight('') }} className="hover:text-accent transition-colors">
          {t('clear')}
        </button>
      </div>
    </div>
  )
}