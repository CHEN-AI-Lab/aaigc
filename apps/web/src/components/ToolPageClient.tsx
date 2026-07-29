'use client'

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

type Props = {
  slug: string
}

function LoadingFallback() {
  const tu = useTranslations('ui')
  return (
    <div className="flex items-center justify-center h-64 text-text-secondary">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        <span className="text-sm">{tu('loading')}</span>
      </div>
    </div>
  )
}

const toolModules: Record<string, ReturnType<typeof dynamic>> = {
  'url-encode': dynamic(() => import('./tools/UrlEncoder'), { ssr: false, loading: LoadingFallback }),
  'base64': dynamic(() => import('./tools/Base64Codec'), { ssr: false, loading: LoadingFallback }),
  'word-counter': dynamic(() => import('./tools/WordCounter'), { ssr: false, loading: LoadingFallback }),
  'html-entities': dynamic(() => import('./tools/HtmlEntities'), { ssr: false, loading: LoadingFallback }),
  'timestamp': dynamic(() => import('./tools/TimestampConverter'), { ssr: false, loading: LoadingFallback }),
  'color-picker': dynamic(() => import('./tools/ColorPicker'), { ssr: false, loading: LoadingFallback }),
  'json-formatter': dynamic(() => import('./tools/JsonFormatter'), { ssr: false, loading: LoadingFallback }),
  'regex-tester': dynamic(() => import('./tools/RegexTester'), { ssr: false, loading: LoadingFallback }),
  'jwt-decoder': dynamic(() => import('./tools/JwtDecoder'), { ssr: false, loading: LoadingFallback }),
  'date-calculator': dynamic(() => import('./tools/DateCalculator'), { ssr: false, loading: LoadingFallback }),
  'qrcode': dynamic(() => import('./tools/QrCodeGenerator'), { ssr: false, loading: LoadingFallback }),
  'markdown-preview': dynamic(() => import('./tools/MarkdownPreview'), { ssr: false, loading: LoadingFallback }),
  'yaml-json': dynamic(() => import('./tools/YamlJsonConverter'), { ssr: false, loading: LoadingFallback }),
  'text-diff': dynamic(() => import('./tools/TextDiff'), { ssr: false, loading: LoadingFallback }),
  'uuid-generator': dynamic(() => import('./tools/UuidGenerator'), { ssr: false, loading: LoadingFallback }),
  'html-preview': dynamic(() => import('./tools/HtmlPreview'), { ssr: false, loading: LoadingFallback }),
  'case-converter': dynamic(() => import('./tools/CaseConverter'), { ssr: false, loading: LoadingFallback }),
  'lorem-ipsum': dynamic(() => import('./tools/LoremIpsum'), { ssr: false, loading: LoadingFallback }),
  'password-generator': dynamic(() => import('./tools/PasswordGenerator'), { ssr: false, loading: LoadingFallback }),
  'image-to-base64': dynamic(() => import('./tools/ImageToBase64'), { ssr: false, loading: LoadingFallback }),
  'number-base': dynamic(() => import('./tools/NumberBaseConverter'), { ssr: false, loading: LoadingFallback }),
  'css-minifier': dynamic(() => import('./tools/CssMinifier'), { ssr: false, loading: LoadingFallback }),
  'json-to-csv': dynamic(() => import('./tools/JsonToCsv'), { ssr: false, loading: LoadingFallback }),
  'text-to-slug': dynamic(() => import('./tools/TextToSlug'), { ssr: false, loading: LoadingFallback }),
  'list-sorter': dynamic(() => import('./tools/ListSorter'), { ssr: false, loading: LoadingFallback }),
  'calculator': dynamic(() => import('./tools/Calculator'), { ssr: false, loading: LoadingFallback }),
  'ip-lookup': dynamic(() => import('./tools/IpLookup'), { ssr: false, loading: LoadingFallback }),
  'dns-lookup': dynamic(() => import('./tools/DnsLookup'), { ssr: false, loading: LoadingFallback }),
  'http-status-codes': dynamic(() => import('./tools/HttpStatusCodes'), { ssr: false, loading: LoadingFallback }),
  'user-agent-parser': dynamic(() => import('./tools/UserAgentParser'), { ssr: false, loading: LoadingFallback }),
  'random-generator': dynamic(() => import('./tools/RandomGenerator'), { ssr: false, loading: LoadingFallback }),
  'cron-builder': dynamic(() => import('./tools/CronBuilder'), { ssr: false, loading: LoadingFallback }),
  'emoji-picker': dynamic(() => import('./tools/EmojiPicker'), { ssr: false, loading: LoadingFallback }),
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
          {Component && <Component />}
        </div>
      </div>
    </div>
  )
}