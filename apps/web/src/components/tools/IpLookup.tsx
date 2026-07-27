'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

export default function IpLookup() {
  const t = useTranslations('tools')
  const [data, setData] = useState<{ ip: string; country: string; region: string; city: string; isp: string; usage: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/tools/ip-lookup')
      .then(r => r.json())
      .then(d => {
        if (d.ip) setData(d)
        else setError(d.error || t('conversionFailed'))
        setLoading(false)
      })
      .catch(() => { setError(t('conversionFailed')); setLoading(false) })
  }, [t])

  const location = [data?.country, data?.region, data?.city].filter(Boolean).join(' ')

  return (
    <div className="mt-6 space-y-4">
      <div className="p-6 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm">
        {loading && <p className="text-text-secondary text-center">{t('loading')}</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}
        {!loading && !error && data && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-xs text-text-secondary mb-1">{t('ipMyIp')}</p>
              <p className="text-2xl font-mono font-semibold text-text-primary">{data.ip}</p>
            </div>
            <div className="border-t border-[rgba(127,99,21,0.1)] pt-4 space-y-3 text-sm">
              {location && (
                <div className="flex">
                  <span className="w-20 text-text-secondary shrink-0">{t('ipLocation')}</span>
                  <span className="text-text-primary">{location}</span>
                </div>
              )}
              {data.isp && (
                <div className="flex">
                  <span className="w-20 text-text-secondary shrink-0">{t('ipIsp')}</span>
                  <span className="text-text-primary">{data.isp}</span>
                </div>
              )}
              {data.usage && (
                <div className="flex">
                  <span className="w-20 text-text-secondary shrink-0">{t('ipUsage')}</span>
                  <span className="text-text-primary">{data.usage}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}