'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'

export default function IpLookup() {
  const t = useTranslations('tools')
  const err = useTranslations('errors')
  const locale = useLocale()
  const [data, setData] = useState<{ ip: string; country: string; region: string; city: string; isp: string; usage: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/tools/ip-lookup?lang=${locale}`)
      .then(r => r.json())
      .then(d => {
        if (d.ip) setData(d)
        else setError(d.error ? err(d.error) : t('conversionFailed'))
        setLoading(false)
      })
      .catch(() => { setError(t('conversionFailed')); setLoading(false) })
  }, [t, locale, err])

  // Show full location from API (country + province + city/district)
  const locStr = [data?.country, data?.region, data?.city].filter(Boolean).join(' ')

  return (
    <div className="mt-6 space-y-4">
      <div className="p-6 bg-surface border border-border rounded-sm">
        {loading && <p className="text-text-secondary text-center">{t('loading')}</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}
        {!loading && !error && data && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-xs text-text-secondary mb-1">{t('ipMyIp')}</p>
              <p className="text-2xl font-mono font-semibold text-text-primary">{data.ip}</p>
            </div>
            {data.country || data.isp ? (
              <div className="border-t border-[rgba(127,99,21,0.1)] pt-4 space-y-3 text-sm">
                {locStr && (
                  <div className="flex">
                    <span className="w-20 text-text-secondary shrink-0">{t('ipLocation')}</span>
                    <span className="text-text-primary">{locStr}</span>
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
                    <span className="text-text-primary">{t('usage' + data.usage.charAt(0).toUpperCase() + data.usage.slice(1))}</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}