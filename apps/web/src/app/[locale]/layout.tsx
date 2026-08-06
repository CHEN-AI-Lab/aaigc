import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { routing } from '../../i18n/routing'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import VisitTracker from '../../components/VisitTracker'
import AuthProvider from '../../components/AuthProvider'

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

  return (
    <NextIntlClientProvider key={locale} locale={locale} messages={messages}>
      <AuthProvider>
        <VisitTracker />
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </AuthProvider>
    </NextIntlClientProvider>
  )
}