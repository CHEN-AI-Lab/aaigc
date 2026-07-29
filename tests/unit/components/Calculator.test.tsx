// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import React from 'react'

vi.mock('next-intl', () => {
  const t = (key: string) => ({
    'calculator.name': 'Calculator',
    'calculator.description': 'A calculator tool',
  }[key] || key)
  return { useTranslations: () => t, useLocale: () => 'en' }
})

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
  useRouter: () => ({ push: () => {}, replace: () => {}, prefetch: () => {} }),
}))

describe('Calculator', () => {
  beforeEach(() => cleanup())

  it('renders the calculator component', async () => {
    const Calculator = (await import('../../../apps/web/src/components/tools/Calculator')).default
    const { container } = render(React.createElement(Calculator))
    expect(container.querySelector('button, input, div')).toBeInTheDocument()
  })
})