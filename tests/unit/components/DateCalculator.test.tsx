// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import React from 'react'

vi.mock('next-intl', () => {
  const t = (key: string) => {
    const map: Record<string, string> = {
      'days': 'days', 'hours': 'hours', 'minutes': 'minutes',
      'max': 'max', 'pleaseSelectBothDates': 'Please select both dates',
      'invalidDate': 'Invalid date', 'enterNumberOfDays': 'Enter number of days',
      'dateCalculator': 'Date Calculator', 'calcDiff': 'Calculate',
      'calcAdd': 'Add Days', 'today': 'Today',
    }
    return map[key] || key
  }
  return { useTranslations: () => t, useLocale: () => 'en' }
})

describe('DateCalculator', () => {
  beforeEach(() => cleanup())

  it('renders the date calculator component', async () => {
    const DateCalc = (await import('../../../apps/web/src/components/tools/DateCalculator')).default
    const { container } = render(React.createElement(DateCalc))
    expect(container.querySelector('input, button, div')).toBeInTheDocument()
  })
})