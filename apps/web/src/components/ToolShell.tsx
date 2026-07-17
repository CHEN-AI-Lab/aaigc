'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'

type Props = {
  title: string
  titleEn: string
  children: React.ReactNode
}

export default function ToolShell({ title, titleEn, children }: Props) {
  const locale = useLocale()

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold text-text-primary mb-1">
        {locale === 'en' ? titleEn : title}
      </h1>
      <div className="min-h-[400px]">
        {children}
      </div>
    </div>
  )
}