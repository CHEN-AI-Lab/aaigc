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
    <Suspense fallback={<div className="min-h-[calc(100vh-200px)] flex items-center justify-center"><svg className="animate-spin w-6 h-6 text-text-secondary" viewBox="0 0 24 24" fill="none" aria-label="loading"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>}>
      <LoginClient />
    </Suspense>
  )
}