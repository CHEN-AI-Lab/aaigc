// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import React from 'react'

vi.mock('next-intl', () => {
  const t = (key: string) => {
    const map: Record<string, string> = {
      'imageConverter': 'Image Converter', 'selectImages': 'Select Images',
      'convert': 'Convert', 'outputFormat': 'Output Format',
      'quality': 'Quality', 'failedToRead': 'Failed to read',
      'duplicateFile': 'Duplicate file',
    }
    return map[key] || key
  }
  return { useTranslations: () => t, useLocale: () => 'en' }
})

describe('ImageConverter', () => {
  beforeEach(() => cleanup())

  it('renders the image converter component', async () => {
    const Converter = (await import('../../../apps/web/src/components/tools/ImageConverter')).default
    const { container } = render(React.createElement(Converter))
    expect(container.querySelector('input, button, div')).toBeInTheDocument()
  })
})