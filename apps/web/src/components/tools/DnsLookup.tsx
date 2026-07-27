'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

const TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA']

export default function DnsLookup() {
  const t = useTranslations('tools')
  const [domain, setDomain] = useState('')
  const [type, setType] = useState('A')
  const [result, setResult] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const lookup = async () => {
    if (!domain.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const r = await fetch(`https://dns.google/resolve?name=${domain}&type=${type}`)
      const d = await r.json()
      if (d.Answer) setResult(d.Answer)
      else setError(d.Comment || t('noResults'))
    } catch { setError(t('conversionFailed')) }
    setLoading(false)
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-3">
        <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com"
          className="flex-1 p-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/30" />
        <select value={type} onChange={e => setType(e.target.value)}
          className="px-3 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary focus:outline-none">
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={lookup} disabled={loading}
          className="px-5 py-3 bg-accent text-white text-sm rounded-sm hover:opacity-90 disabled:opacity-50">{t('search')}</button>
      </div>
      {loading && <p className="text-text-secondary text-sm">Loading...</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {result && (
        <div className="bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[rgba(127,99,21,0.15)]">
              <th className="text-left p-3 text-text-secondary font-medium">Name</th>
              <th className="text-left p-3 text-text-secondary font-medium">Type</th>
              <th className="text-left p-3 text-text-secondary font-medium">TTL</th>
              <th className="text-left p-3 text-text-secondary font-medium">Data</th>
            </tr></thead>
            <tbody>{result.map((r, i) => (
              <tr key={i} className="border-b border-[rgba(127,99,21,0.08)]">
                <td className="p-3 text-text-primary font-mono text-xs">{r.name}</td>
                <td className="p-3 text-text-primary">{r.type}</td>
                <td className="p-3 text-text-secondary">{r.TTL}</td>
                <td className="p-3 text-text-primary font-mono text-xs break-all">{r.data}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}