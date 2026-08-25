import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import AccountClient from './AccountClient'
import AdminTrafficCard from '@/components/AdminTrafficCard'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      <div className="max-w-xl mx-auto px-4">
        <div className="pt-10 pb-6">
          <AdminTrafficCard />
        </div>
        <AccountClient />
      </div>
    </>
  )
}
