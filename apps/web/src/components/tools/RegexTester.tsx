'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { createToolContext } from 'shared/tools'
import { runRegexTester } from 'shared/tools/regex-tester'
import type { RegexMatch } from 'shared/tools/regex-tester'

/** shared 返回完整 i18n key（tools.xxx），本组件 t 已限定在 tools 命名空间 */
function localKey(fullKey: string): string {
  return fullKey.replace(/^tools\./, '')
}

export default function RegexTester() {
  const t = useTranslations('tools')
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('gm')
  const [text, setText] = useState('')

  const { matches, regexError } = useMemo((): { matches: RegexMatch[]; regexError: string } => {
    const outcome = runRegexTester({ pattern, flags, text }, createToolContext())
    if (outcome.ok) return { matches: outcome.data.matches, regexError: '' }
    // 主文案走 i18n；shared 透出的引擎原始报错作为次要文案附后
    const base = t(localKey(outcome.error.messageKey))
    return {
      matches: [],
      regexError: outcome.error.detail ? `${base}: ${outcome.error.detail}` : base,
    }
  }, [pattern, flags, text, t])

  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-2">
        <input value={pattern} onChange={e => setPattern(e.target.value)} placeholder={t('regularExpression')} className="flex-1 p-2 bg-surface border border-border rounded-sm text-sm font-mono text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/30" />
        <input value={flags} onChange={e => setFlags(e.target.value)} placeholder="gm" className="w-16 p-2 bg-surface border border-border rounded-sm text-sm font-mono text-text-primary text-center focus:outline-none focus:border-accent/30" />
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder={t('testText')} className="w-full h-36 p-3 bg-surface border border-border rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:border-accent/30" />
      {regexError && <p className="text-error text-sm">{regexError}</p>}
      <div className="text-xs text-text-secondary">
        {t('matches')}: {matches.length}
      </div>
      {matches.length > 0 && (
        <div className="max-h-48 overflow-y-auto space-y-1">
          {matches.map((m, i) => (
            <div key={i} className="flex gap-2 text-xs font-mono p-1.5 bg-surface rounded-sm">
              <span className="text-text-secondary w-12 shrink-0">#{i + 1}</span>
              <span className="text-text-primary break-all">{m.match}</span>
              <span className="text-text-secondary ml-auto shrink-0">@{m.index}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}