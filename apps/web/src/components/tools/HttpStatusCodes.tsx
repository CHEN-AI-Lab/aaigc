'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'

const CODES = [
  ...'100 Continue|101 Switching Protocols|102 Processing'.split('|').map(s => { const [c, ...r] = s.split(' '); return { code: parseInt(c), name: r.join(' '), key: 'httpStatus' + parseInt(c), cat: 'httpInfo' } }),
  ...'200 OK|201 Created|202 Accepted|204 No Content|301 Moved Permanently|302 Found|304 Not Modified|307 Temporary Redirect|308 Permanent Redirect'.split('|').map(s => { const [c, ...r] = s.split(' '); return { code: parseInt(c), name: r.join(' '), key: 'httpStatus' + parseInt(c), cat: c.startsWith('30') ? 'httpRedirect' : 'httpSuccess' } }),
  ...'400 Bad Request|401 Unauthorized|403 Forbidden|404 Not Found|405 Method Not Allowed|408 Request Timeout|409 Conflict|410 Gone|422 Unprocessable Entity|429 Too Many Requests'.split('|').map(s => { const [c, ...r] = s.split(' '); return { code: parseInt(c), name: r.join(' '), key: 'httpStatus' + parseInt(c), cat: 'httpClientError' } }),
  ...'500 Internal Server Error|502 Bad Gateway|503 Service Unavailable|504 Gateway Timeout'.split('|').map(s => { const [c, ...r] = s.split(' '); return { code: parseInt(c), name: r.join(' '), key: 'httpStatus' + parseInt(c), cat: 'httpServerError' } }),
]

export default function HttpStatusCodes() {
  const t = useTranslations('tools')
  const locale = useLocale()
  const [q, setQ] = useState('')

  const isEn = locale === 'en'

  const filtered = CODES.filter(c => !q || `${c.code}`.includes(q) || c.name.toLowerCase().includes(q.toLowerCase()) || t(c.key).toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="mt-6 space-y-4">
      <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('search')}
        className="w-full max-w-xs p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/30" />
      <div className="bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-[rgba(127,99,21,0.15)]">
            <th className="text-left p-3 text-text-secondary font-medium">{t('httpCode')}</th>
            <th className="text-left p-3 text-text-secondary font-medium">{t('httpName')}</th>
            <th className="text-left p-3 text-text-secondary font-medium">{t('httpCategory')}</th>
          </tr></thead>
          <tbody>{filtered.map((c, i) => (
            <tr key={i} className="border-b border-[rgba(127,99,21,0.08)] hover:bg-accent/5">
              <td className="p-3 text-text-primary font-mono font-semibold">{c.code}</td>
              <td className="p-3 text-text-primary">{isEn ? c.name : `${c.name} (${t(c.key)})`}</td>
              <td className="p-3 text-text-secondary text-xs">{t(c.cat)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}