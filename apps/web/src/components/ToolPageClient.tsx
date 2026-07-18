'use client'

import { lazy, Suspense } from 'react'
import { useLocale } from 'next-intl'

type Props = {
  slug: string
  name: string
  nameEn: string
}

const toolModules: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'url-encode': lazy(() => import('./tools/UrlEncoder')),
  'base64': lazy(() => import('./tools/Base64Codec')),
  'word-counter': lazy(() => import('./tools/WordCounter')),
  'html-entities': lazy(() => import('./tools/HtmlEntities')),
  'timestamp': lazy(() => import('./tools/TimestampConverter')),
  'color-picker': lazy(() => import('./tools/ColorPicker')),
  'json-formatter': lazy(() => import('./tools/JsonFormatter')),
  'regex-tester': lazy(() => import('./tools/RegexTester')),
  'jwt-decoder': lazy(() => import('./tools/JwtDecoder')),
  'date-calculator': lazy(() => import('./tools/DateCalculator')),
  'qrcode': lazy(() => import('./tools/QrCodeGenerator')),
  'markdown-preview': lazy(() => import('./tools/MarkdownPreview')),
  'yaml-json': lazy(() => import('./tools/YamlJsonConverter')),
  'text-diff': lazy(() => import('./tools/TextDiff')),
}

export default function ToolPageClient({ slug, name, nameEn }: Props) {
  const locale = useLocale()
  const Component = toolModules[slug]

  return (
    <div>
      <div className="max-w-6xl mx-auto px-6 pt-6 text-xs text-text-secondary">
        <a href={`/${locale}/tools`} className="hover:text-accent transition-colors">
          {locale === 'en' ? 'Tools' : '工具'}
        </a>
        <span className="mx-2">/</span>
        <span className="text-text-primary">{locale === 'en' ? nameEn : name}</span>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-text-primary mb-1">
          {locale === 'en' ? nameEn : name}
        </h1>
        <div className="min-h-[400px]">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64 text-text-secondary">
              {locale === 'en' ? 'Loading...' : '加载中...'}
            </div>
          }>
            {Component && <Component />}
          </Suspense>
        </div>
      </div>
    </div>
  )
}