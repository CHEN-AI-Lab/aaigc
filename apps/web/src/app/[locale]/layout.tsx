import { headers } from 'next/headers'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { routing } from '../../i18n/routing'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import VisitTracker from '../../components/VisitTracker'
import AuthProvider from '../../components/AuthProvider'
import { FavoritesProvider } from '../../components/FavoritesProvider'
import { ToastProvider } from '../../components/ui/Toast'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const messages = await getMessages({ locale })

  // 防护开关：与 proxy.ts 的 CSP_STRICT 保持一致。
  // 仅在强防护模式下才读取 headers() 获取 nonce——该调用会使本路由树转为动态渲染；
  // 快模式下不读取 headers()，页面保持静态预渲染（CDN 缓存、首字节更快）。
  const STRICT_CSP = process.env.CSP_STRICT === 'true'
  let nonce = ''
  if (STRICT_CSP) {
    nonce = (await headers()).get('x-nonce') ?? ''
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('aaigc-theme');if(t)document.documentElement.className='theme-'+t}catch(e){}})()`
        }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        <NextIntlClientProvider key={locale} locale={locale} messages={messages}>
          <ToastProvider>
            <AuthProvider>
              <FavoritesProvider>
                <VisitTracker />
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
              </FavoritesProvider>
            </AuthProvider>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}