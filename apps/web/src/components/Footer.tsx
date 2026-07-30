'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { products } from 'data/products'
import { tools } from 'data/tools'

export default function Footer() {
  const pathname = usePathname()
  const t = useTranslations('footer')
  const tp = useTranslations('products')
  const tt = useTranslations('tools')
  const tc = useTranslations('common')

  if (pathname?.includes('/tools/')) return null

  const liveProducts = products.filter(p => p.status === 'live')
  const featureTools = tools.slice(0, 3)

  return (
    <footer className="border-t border-[rgba(127,99,21,0.1)] bg-bg mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-1.5">
            <div className="relative w-5 h-5 shrink-0">
              <div className="absolute w-2 h-2 rounded-full border border-accent/30 bg-accent/10 top-0 left-0" />
              <div className="absolute w-[7px] h-[7px] border border-accent/20 bg-accent/10 top-[5px] left-[7px] rounded-sm rotate-12" />
              <div className="absolute w-0 h-0 border-l-[4px] border-r-[4px] border-b-[7px] border-l-transparent border-r-transparent border-b-accent/15 top-[1px] left-[13px]" />
            </div>
            AAIGC</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {t('tagline')}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">{t('products')}</h3>
            <ul className="space-y-2 text-xs text-text-secondary">
              {liveProducts.map(p => (
                <li key={p.id}>
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                      {tp(`${p.id}.name`)}
                    </a>
                  ) : (
                    <span>{tp(`${p.id}.name`)}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">{t('tools')}</h3>
            <ul className="space-y-2 text-xs text-text-secondary">
              {featureTools.map(tool => (
                <li key={tool.id}>
                  <Link href={`/tools/${tool.id}`} className="hover:text-accent transition-colors">
                    {tt(`${tool.id}.name`)}
                  </Link>
                </li>
              ))}
              <li><Link href="/tools" className="hover:text-accent transition-colors">{t('more')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">{t('company')}</h3>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li><Link href="/updates" className="hover:text-accent transition-colors">{t('updates')}</Link></li>
              <li><Link href="/about" className="hover:text-accent transition-colors">{tc('about')}</Link></li>
              <li><a href="mailto:chen@aaigc.online" className="hover:text-accent transition-colors">{t('email')}</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[rgba(127,99,21,0.1)] mt-8 pt-8 flex items-center justify-center gap-6 text-xs text-text-secondary">
          <span>&copy; {new Date().getFullYear()} {t('copyright')}</span>
          <Link href="/privacy" className="hover:text-accent transition-colors">{t('privacy')}</Link>
        </div>
      </div>
    </footer>
  )
}