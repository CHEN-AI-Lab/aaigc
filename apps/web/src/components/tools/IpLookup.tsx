'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

export default function IpLookup() {
  const t = useTranslations('tools')
  const [ip, setIp] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => { setIp(d.ip); setLoading(false) })
      .catch(() => { setError(t('conversionFailed')); setLoading(false) })
  }, [t])

  return (
    <div className="mt-6 space-y-4">
      <div className="p-6 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-center">
        {loading && <p className="text-text-secondary">Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <>
            <p className="text-xs text-text-secondary mb-2">{t('ip-lookup.name')}</p>
            <p className="text-3xl font-mono font-semibold text-text-primary">{ip}</p>
          </>
        )}
      </div>
    </div>
  )
}