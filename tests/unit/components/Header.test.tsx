// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import React from 'react'

const mockTranslations = vi.hoisted(() => {
  const map: Record<string, string> = {
    'common.appName': 'AAIGC',
    'common.products': 'Products',
    'common.tools': 'Tools',
    'common.about': 'About',
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

vi.mock('@/i18n/navigation', () => ({
  Link: 'a',
  usePathname: () => '/en',
  useRouter: () => ({ push: () => {}, replace: () => {}, prefetch: () => {} }),
  redirect: () => {},
  getPathname: () => '/en',
}))

describe('Header', () => {
  beforeEach(() => cleanup())

  it('renders the header element', async () => {
    const Header = (await import('../../../apps/web/src/components/Header')).default
    const { container } = render(React.createElement(Header))
    expect(container.querySelector('header')).toBeInTheDocument()
  })
})