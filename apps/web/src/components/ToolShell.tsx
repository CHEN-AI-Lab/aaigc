'use client'

import { useTranslations } from 'next-intl'

type Props = {
  slug: string
  children: React.ReactNode
}

export default function ToolShell({ slug, children }: Props) {
  const t = useTranslations('tools')

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold text-text-primary mb-1">
        {t(`${slug}.name`)}
      </h1>
      <div className="min-h-[400px]">
        {children}
      </div>
    </div>
  )
}