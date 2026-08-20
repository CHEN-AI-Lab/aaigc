import { Suspense } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import LoginClient from './LoginClient'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-200px)] flex items-center justify-center"><p className="text-text-secondary text-sm">...</p></div>}>
      <LoginClient />
    </Suspense>
  )
}