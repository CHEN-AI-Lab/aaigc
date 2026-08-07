import { Suspense } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import StatsClient from './StatsClient'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function StatsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-6 py-12">
        <p className="text-text-secondary text-sm">...</p>
      </div>
    }>
      <StatsClient />
    </Suspense>
  )
}