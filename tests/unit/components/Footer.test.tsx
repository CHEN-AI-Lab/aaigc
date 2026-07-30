// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import React from 'react'

const mockTranslations = vi.hoisted(() => {
  const map: Record<string, string> = {
    'footer.tagline': 'AI-powered tools and applications',
    'footer.products': 'Products',
    'footer.tools': 'Tools',
    'footer.connect': 'Connect',
    'footer.more': 'More...',
    'footer.updates': 'Updates',
    'footer.privacy': 'Privacy',
    'footer.email': 'chen@aaigc.online',
    'footer.copyright': 'AAIGC. All rights reserved.',
  }
  return (ns: string) => (key: string) => map[`${ns}.${key}`] || key
})

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => mockTranslations(ns),
  useLocale: () => 'en',
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
  useRouter: () => ({ push: () => {}, replace: () => {}, prefetch: () => {} }),
}))

vi.mock('@/i18n/navigation', () => ({ Link: 'a', useRouter: () => ({ push: () => {}, replace: () => {}, prefetch: () => {} }) }))

vi.mock('data/products', () => ({
  products: [
    { id: 'cookmate', icon: '🍳', status: 'live', url: 'https://cookmate.aaigc.online' },
    { id: 'aihub', icon: '🤖', status: 'wip' },
  ],
}))

vi.mock('data/tools', () => ({
  tools: [
    { id: 'json-formatter', category: 'dev', icon: '📋', component: 'JsonFormatter' },
    { id: 'timestamp', category: 'time', icon: '⏰', component: 'TimestampConverter' },
  ],
  toolCategories: [
    { id: 'dev', nameEn: 'Developer Tools', icon: '🛠️', order: 1 },
    { id: 'time', nameEn: 'Time Tools', icon: '⏰', order: 4 },
  ],
}))

describe('Footer', () => {
  beforeEach(() => cleanup())

  async function renderFooter() {
    const Footer = (await import('../../../apps/web/src/components/Footer')).default
    return render(React.createElement(Footer))
  }

  it('renders the footer element', async () => {
    const { container } = await renderFooter()
    expect(container.querySelector('footer')).toBeInTheDocument()
  })

  it('displays the company name in the hero section', async () => {
    await renderFooter()
    expect(screen.getByAltText('AAIGC')).toBeInTheDocument()
  })

  it('has a mailto link with the email address', async () => {
    await renderFooter()
    const emailLink = screen.getByText(/chen@aaigc\.online/)
    expect(emailLink).toBeInTheDocument()
    expect(emailLink.closest('a')).toHaveAttribute('href', 'mailto:chen@aaigc.online')
  })

  it('renders copyright with current year', async () => {
    await renderFooter()
    expect(screen.getByText(/2026/)).toBeInTheDocument()
    expect(screen.getByText(/AAIGC\. All rights reserved/)).toBeInTheDocument()
  })

  it('renders connect section links', async () => {
    await renderFooter()
    expect(screen.getByText(/Updates/)).toBeInTheDocument()
    expect(screen.getByText(/Privacy/)).toBeInTheDocument()
  })
})