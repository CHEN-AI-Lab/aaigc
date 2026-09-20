'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createToolContext } from 'shared/tools'
import { runUuidGenerator } from 'shared/tools/uuid-generator'

export default function UuidGenerator() {
  const t = useTranslations('tools')
  const locale = useLocale()
  const [uuid, setUuid] = useState('')
  const [count, setCount] = useState(1)

  const generate = () => {
    // 随机源经 ToolContext 注入（shared 内部使用 CSPRNG），端侧不直接调 Math.random()
    const outcome = runUuidGenerator({ count }, createToolContext({ locale }))
    if (!outcome.ok) return
    setUuid(outcome.data.text)
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm text-text-secondary">{t('count')}</label>
        <input type="number" min={1} max={100} value={count} onChange={e => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
          className="w-20 p-2 bg-surface border border-border rounded-sm text-sm text-text-primary text-center focus:outline-none focus:border-accent/30" />
        <button onClick={generate} className="px-6 py-2 bg-accent text-white text-sm rounded-lg hover:opacity-90">{t('generate')}</button>
      </div>
      {uuid && (
        <div className="relative">
          <textarea readOnly value={uuid} className="w-full h-36 p-3 bg-surface border border-border rounded-sm text-sm font-mono text-text-primary resize-none" />
          <button onClick={() => navigator.clipboard.writeText(uuid)} className="absolute top-2 right-6 text-xs px-2 py-1 bg-accent text-white rounded-sm hover:opacity-90 min-w-[4.5rem] text-center">{t('copy')}</button>
        </div>
      )}
    </div>
  )
}