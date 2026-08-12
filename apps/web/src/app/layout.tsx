import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: {
    default: 'AAIGC — AI-Powered Tools',
    template: '%s | AAIGC',
  },
  description: 'AAIGC — AI-powered tools and applications. CookMate, AIHub, Short Drama, and more.',
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'AAIGC — AI-Powered Tools',
    description: 'AI-powered tools and applications for everyone.',
    type: 'website',
    locale: 'en_US',
    siteName: 'AAIGC',
    url: process.env.NEXT_PUBLIC_APP_URL || '',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AAIGC — AI-Powered Tools',
    description: 'AI-powered tools and applications for everyone.',
  },
  keywords: ['AI tools', 'online tools', 'JSON formatter', 'QR code generator', 'developer tools'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('aaigc-theme');if(t)document.documentElement.className='theme-'+t}catch(e){}})()`
        }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}