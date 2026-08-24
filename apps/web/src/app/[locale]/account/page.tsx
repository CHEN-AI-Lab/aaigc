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
      {/* 管理员专用流量与安全状态卡片（仅 admin 角色可见，组件内自检） */}
      <div className="max-w-xl mx-auto px-4 pt-10">
        <AdminTrafficCard />
      </div>
      <AccountClient />
    </>
  )
}
