import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { nativeAppDownloadUrls } from 'shared/constants/endpoints'
import type { Platform } from 'shared/types/platform'

type Props = { params: Promise<{ locale: string }> }

/**
 * 可下载的端（web 端无需下载，不在列表内）。
 * 顺序即展示顺序：桌面端 → 移动端 → CLI → 小程序。
 */
const DOWNLOAD_PLATFORMS = ['desktop', 'app', 'cli', 'weapp'] as const satisfies readonly Platform[]

type DownloadPlatform = (typeof DOWNLOAD_PLATFORMS)[number]

const PLATFORM_ICONS: Record<DownloadPlatform, string> = {
  desktop: '🖥️',
  app: '📱',
  cli: '⌨️',
  weapp: '💬',
}

interface DownloadEntry {
  platform: DownloadPlatform
  url: string
}

/**
 * 链接全部来自环境变量 NATIVE_APP_DOWNLOAD_URLS_JSON（无硬编码域名）。
 * **未配置某端时不渲染该端卡片**，绝不展示死链。
 */
function availableDownloads(): DownloadEntry[] {
  const urls = nativeAppDownloadUrls()
  const entries: DownloadEntry[] = []
  for (const platform of DOWNLOAD_PLATFORMS) {
    const url = urls[platform]
    if (typeof url === 'string' && url.length > 0) entries.push({ platform, url })
  }
  return entries
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'download' })
  return { title: t('title'), description: t('subtitle') }
}

export default async function DownloadPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'download' })

  const entries = availableDownloads()

  return (
    <div className="max-w-5xl mx-auto px-6 py-20">

      {/* ── Hero ── */}
      <div className="text-center mb-14">
        <h1 className="text-4xl font-bold text-text-primary mb-4">
          {t('title')}
        </h1>
        <p className="text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      {entries.length === 0 ? (
        /* ── 一个端都没配置：说明情况，不给死链 ── */
        <div className="bg-card border border-border rounded-sm p-8 text-center">
          <span className="text-2xl">🌐</span>
          <p className="mt-3 text-sm text-text-secondary leading-relaxed">
            {t('empty')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {entries.map(({ platform, url }) => (
            <div
              key={platform}
              className="bg-card border border-border rounded-sm p-6 flex flex-col"
            >
              <span className="text-2xl">{PLATFORM_ICONS[platform]}</span>
              <h2 className="mt-3 font-semibold text-sm text-text-primary">
                {t(`${platform}Title`)}
              </h2>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed flex-1">
                {t(`${platform}Desc`)}
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 self-start inline-block bg-accent text-white px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {t('download')} →
              </a>
            </div>
          ))}
        </div>
      )}

      {/* ── Web 端说明 ── */}
      <p className="mt-12 text-center text-xs text-text-secondary leading-relaxed">
        {t('webNote')}
      </p>

    </div>
  )
}
