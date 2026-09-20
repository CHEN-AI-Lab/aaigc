'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { HTTP_STATUS_CODES } from 'shared/tools/http-status-codes'
import type { HttpStatusCodeEntry } from 'shared/tools/http-status-codes'

/** shared 返回的是完整 i18n key（tools.xxx），本组件 t 已限定在 tools 命名空间 */
function localKey(fullKey: string): string {
  return fullKey.replace(/^tools\./, '')
}

export default function HttpStatusCodes() {
  const t = useTranslations('tools')
  const [q, setQ] = useState('')

  /**
   * 名称列：本地化名与英文名相同时只显示一次，否则显示「英文名（本地名）」。
   * 旧实现用 `locale === 'en'` 分支判断；改成值比较后各端行为完全一致，
   * 且不再需要感知 locale —— 小程序端可复用同一套逻辑。
   */
  const statusName = (c: HttpStatusCodeEntry): string => {
    const localized = t(localKey(c.messageKey))
    return localized === c.name ? c.name : `${c.name} (${localized})`
  }

  const filtered = HTTP_STATUS_CODES.filter(c => !q || `${c.code}`.includes(q) || c.name.toLowerCase().includes(q.toLowerCase()) || t(localKey(c.messageKey)).toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="mt-6 space-y-4">
      <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('search')}
        className="w-full max-w-xs p-3 bg-surface border border-border rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/30" />
      <div className="bg-surface border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border">
            <th className="text-left p-3 pl-4 text-text-secondary font-medium">{t('httpCode')}</th>
            <th className="text-left p-3 text-text-secondary font-medium">{t('httpName')}</th>
            <th className="text-left p-3 text-text-secondary font-medium">{t('httpCategory')}</th>
          </tr></thead>
          <tbody>{filtered.map((c, i) => (
            <tr key={i} className="border-b border-border hover:bg-accent/5">
              <td className="p-3 pl-4 text-text-primary font-mono font-semibold">{c.code}</td>
              <td className="p-3 text-text-primary">{statusName(c)}</td>
              <td className="p-3 text-text-secondary text-xs">{t(localKey(c.categoryKey))}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}