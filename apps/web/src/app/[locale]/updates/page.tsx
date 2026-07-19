import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

type Props = { params: Promise<{ locale: string }> }

export default async function UpdatesPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'updates' })

  const updates = [
    { date: '2026-07-17', en: 'Site launch with 14 online tools', zh: '网站上线，首批 14 个在线工具' },
    { date: '2026-07-17', en: 'CookMate, AIHub product pages', zh: 'CookMate、AIHub 产品页面' },
    { date: '2026-07-17', en: 'Mistral warm design system', zh: 'Mistral 暖色设计系统' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="section-title text-text-primary mb-2">{t('title')}</h1>
      <p className="text-text-secondary mb-10">{t('subtitle')}</p>

      <div className="space-y-6">
        {updates.map((u, i) => (
          <div key={i} className="flex gap-4">
            <div className="text-xs text-text-secondary font-mono w-24 shrink-0 pt-0.5">{u.date}</div>
            <div className="flex-1 pb-6 border-b border-[rgba(127,99,21,0.1)]">
              <p className="text-sm text-text-primary">{locale === 'zh-CN' ? u.zh : u.en}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-sm text-text-secondary">
        <Link href="/" className="hover:text-accent transition-colors">← {t('back')}</Link>
      </div>
    </div>
  )
}