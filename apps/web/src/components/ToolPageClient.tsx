'use client'

import { lazy, Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

type Props = {
  slug: string
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
  'uuid-generator': lazy(() => import('./tools/UuidGenerator')),
  'html-preview': lazy(() => import('./tools/HtmlPreview')),
  'case-converter': lazy(() => import('./tools/CaseConverter')),
  'lorem-ipsum': lazy(() => import('./tools/LoremIpsum')),
  'password-generator': lazy(() => import('./tools/PasswordGenerator')),
  'image-to-base64': lazy(() => import('./tools/ImageToBase64')),
  'number-base': lazy(() => import('./tools/NumberBaseConverter')),
  'css-minifier': lazy(() => import('./tools/CssMinifier')),
  'json-to-csv': lazy(() => import('./tools/JsonToCsv')),
  'text-to-slug': lazy(() => import('./tools/TextToSlug')),
  'list-sorter': lazy(() => import('./tools/ListSorter')),
  'calculator': lazy(() => import('./tools/Calculator')),
  'ip-lookup': lazy(() => import('./tools/IpLookup')),
  'dns-lookup': lazy(() => import('./tools/DnsLookup')),
  'http-status-codes': lazy(() => import('./tools/HttpStatusCodes')),
  'user-agent-parser': lazy(() => import('./tools/UserAgentParser')),
  'random-generator': lazy(() => import('./tools/RandomGenerator')),
  'cron-builder': lazy(() => import('./tools/CronBuilder')),
  'emoji-picker': lazy(() => import('./tools/EmojiPicker')),
}

export default function ToolPageClient({ slug }: Props) {
  const t = useTranslations('tools')
  const tu = useTranslations('ui')
  const Component = toolModules[slug]

  return (
    <div>
      <div className="max-w-7xl mx-auto px-6 pt-6 text-xs text-text-secondary">
        <Link href="/tools" className="hover:text-accent transition-colors">
          {tu('tools')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-primary">{t(`${slug}.name`)}</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-text-primary mb-1">
          {t(`${slug}.name`)}
        </h1>
        <div className="min-h-[400px]">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64 text-text-secondary">
              {tu('loading')}
            </div>
          }>
            {Component && <Component />}
          </Suspense>
        </div>
      </div>
    </div>
  )
}