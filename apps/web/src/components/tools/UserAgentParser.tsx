'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { createToolContext } from 'shared/tools'
import { runUserAgentParser } from 'shared/tools/user-agent-parser'

/** shared 返回完整 i18n key（tools.xxx），本组件 t 已限定在 tools 命名空间 */
function localKey(fullKey: string): string {
  return fullKey.replace(/^tools\./, '')
}

export default function UserAgentParser() {
  const t = useTranslations('tools')
  const [ua, setUa] = useState('')

  useEffect(() => { setUa(navigator.userAgent) }, [])

  const parse = (s: string) => {
    // 旧行为：组件内自行正则匹配（含 bot / Opera 分支） → 新行为：shared detectBrowser/detectOs/detectDevice（bot 与 Opera 归并进通用结果），已确认接受
    const outcome = runUserAgentParser({ userAgent: s }, createToolContext())
    if (!outcome.ok) return []
    const { browserKey, osKey, deviceKey } = outcome.data
    return [
      { label: t('uaBrowser'), value: t(localKey(browserKey)) },
      { label: t('uaOs'), value: t(localKey(osKey)) },
      { label: t('uaDevice'), value: t(localKey(deviceKey)) },
    ]
  }

  const info = ua ? parse(ua) : []

  return (
    <div className="mt-6 space-y-4">
      <p className="text-xs text-text-secondary mb-3">{t('uaDesc')}</p>

      <textarea value={ua} onChange={e => setUa(e.target.value)} rows={3}
        className="w-full p-3 bg-surface border border-border rounded-sm text-xs text-text-primary font-mono resize-none focus:outline-none focus:border-accent/30" />

      {info.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {info.map((item, i) => (
            <div key={i} className="p-4 bg-surface border border-border rounded-sm text-center">
              <p className="text-xs text-text-secondary mb-1">{item.label}</p>
              <p className="text-sm font-semibold text-text-primary">{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}