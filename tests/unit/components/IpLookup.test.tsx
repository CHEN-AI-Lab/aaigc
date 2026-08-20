// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import React from 'react'

vi.mock('next-intl', () => {
  const t = (key: string) => {
    const map: Record<string, string> = {
      'ipLookup': 'IP Lookup', 'myIp': 'My IP',
      'location': 'Location', 'isp': 'ISP',
      'conversionFailed': 'Lookup failed',
    }
    return map[key] || key
  }
  return { useTranslations: () => t, useLocale: () => 'en' }
})

describe('IpLookup', () => {
  beforeEach(() => cleanup())

  it('renders the IP lookup component', async () => {
    const IpLookup = (await import('../../../apps/web/src/components/tools/IpLookup')).default
    const { container } = render(React.createElement(IpLookup))
    expect(container.querySelector('input, button, div')).toBeInTheDocument()
  })
})