// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import React from 'react'

vi.mock('next-intl', () => {
  const t = (key: string) => {
    const map: Record<string, string> = {
      'jsonToCsv': 'JSON to CSV', 'input': 'Input',
      'output': 'Output', 'convert': 'Convert',
      'invalidJson': 'Invalid JSON', 'invalidInput': 'Invalid input',
      'copy': 'Copy', 'download': 'Download',
    }
    return map[key] || key
  }
  return { useTranslations: () => t, useLocale: () => 'en' }
})

describe('JsonToCsv', () => {
  beforeEach(() => cleanup())

  it('renders the JSON to CSV component', async () => {
    const JsonToCsv = (await import('../../../apps/web/src/components/tools/JsonToCsv')).default
    const { container } = render(React.createElement(JsonToCsv))
    expect(container.querySelector('textarea, input, button, div')).toBeInTheDocument()
  })
})