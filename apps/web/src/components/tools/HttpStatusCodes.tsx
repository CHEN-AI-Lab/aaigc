'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'

const CODES = [
  { code: 100, en: 'Continue', key: 'httpStatus100', cat: 'httpInfo' },
  { code: 101, en: 'Switching Protocols', key: 'httpStatus101', cat: 'httpInfo' },
  { code: 102, en: 'Processing', key: 'httpStatus102', cat: 'httpInfo' },
  { code: 200, en: 'OK', key: 'httpStatus200', cat: 'httpSuccess' },
  { code: 201, en: 'Created', key: 'httpStatus201', cat: 'httpSuccess' },
  { code: 202, en: 'Accepted', key: 'httpStatus202', cat: 'httpSuccess' },
  { code: 204, en: 'No Content', key: 'httpStatus204', cat: 'httpSuccess' },
  { code: 301, en: 'Moved Permanently', key: 'httpStatus301', cat: 'httpRedirect' },
  { code: 302, en: 'Found', key: 'httpStatus302', cat: 'httpRedirect' },
  { code: 304, en: 'Not Modified', key: 'httpStatus304', cat: 'httpRedirect' },
  { code: 307, en: 'Temporary Redirect', key: 'httpStatus307', cat: 'httpRedirect' },
  { code: 308, en: 'Permanent Redirect', key: 'httpStatus308', cat: 'httpRedirect' },
  { code: 400, en: 'Bad Request', key: 'httpStatus400', cat: 'httpClientError' },
  { code: 401, en: 'Unauthorized', key: 'httpStatus401', cat: 'httpClientError' },
  { code: 403, en: 'Forbidden', key: 'httpStatus403', cat: 'httpClientError' },
  { code: 404, en: 'Not Found', key: 'httpStatus404', cat: 'httpClientError' },
  { code: 405, en: 'Method Not Allowed', key: 'httpStatus405', cat: 'httpClientError' },
  { code: 408, en: 'Request Timeout', key: 'httpStatus408', cat: 'httpClientError' },
  { code: 409, en: 'Conflict', key: 'httpStatus409', cat: 'httpClientError' },
  { code: 410, en: 'Gone', key: 'httpStatus410', cat: 'httpClientError' },
  { code: 422, en: 'Unprocessable Entity', key: 'httpStatus422', cat: 'httpClientError' },
  { code: 429, en: 'Too Many Requests', key: 'httpStatus429', cat: 'httpClientError' },
  { code: 500, en: 'Internal Server Error', key: 'httpStatus500', cat: 'httpServerError' },
  { code: 502, en: 'Bad Gateway', key: 'httpStatus502', cat: 'httpServerError' },
  { code: 503, en: 'Service Unavailable', key: 'httpStatus503', cat: 'httpServerError' },
  { code: 504, en: 'Gateway Timeout', key: 'httpStatus504', cat: 'httpServerError' },
]

export default function HttpStatusCodes() {
  const t = useTranslations('tools')
  const locale = useLocale()
  const [q, setQ] = useState('')

  const isEn = locale === 'en'

  const filtered = CODES.filter(c => !q || `${c.code}`.includes(q) || c.en.toLowerCase().includes(q.toLowerCase()) || t(c.key).toLowerCase().includes(q.toLowerCase()))

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
              <td className="p-3 text-text-primary">
                {isEn ? c.en : <>{c.en} <span className="text-text-secondary/60">({t(c.key)})</span></>}
              </td>
              <td className="p-3 text-text-secondary text-xs">{t(c.cat)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}