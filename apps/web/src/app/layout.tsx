import type { Metadata } from 'next'
import './globals.css'

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
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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