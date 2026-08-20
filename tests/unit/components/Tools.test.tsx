// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const table: Record<string, string> = {
      format: 'Format',
      validate: 'Validate',
      validJson: 'Valid JSON',
      encode: 'Encode',
      decode: 'Decode',
      output: 'Output',
      enterText: 'Enter text...',
      typeOrPasteText: 'Type or paste text...',
      words: 'Words',
      characters: 'Characters',
      lines: 'Lines',
    }
    return table[key] || key
  },
}))

describe('JsonFormatter', () => {
  async function renderComponent() {
    const Comp = (await import('../../../apps/web/src/components/tools/JsonFormatter')).default
    return render(React.createElement(Comp))
  }

  it('renders Format and Validate buttons', async () => {
    await renderComponent()
    expect(screen.getByText('Format')).toBeInTheDocument()
    expect(screen.getByText('Validate')).toBeInTheDocument()
  })
})

describe('Base64Codec', () => {
  async function renderComponent() {
    const Comp = (await import('../../../apps/web/src/components/tools/Base64Codec')).default
    return render(React.createElement(Comp))
  }

  it('renders Encode and Decode buttons', async () => {
    await renderComponent()
    expect(screen.getByText('Encode')).toBeInTheDocument()
    expect(screen.getByText('Decode')).toBeInTheDocument()
  })
})

describe('WordCounter', () => {
  async function renderComponent() {
    const Comp = (await import('../../../apps/web/src/components/tools/WordCounter')).default
    return render(React.createElement(Comp))
  }

  it('renders without crashing', async () => {
    await renderComponent()
    expect(screen.getByText('Words')).toBeInTheDocument()
  })
})