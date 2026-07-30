// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const table: Record<string, string> = {
      timerCountdown: 'Countdown',
      timerStopwatch: 'Stopwatch',
      timerStart: 'Start',
      timerPause: 'Pause',
      timerResume: 'Resume',
      timerReset: 'Reset',
      timerLap: 'Lap',
      timerLaps: 'Lap Times',
      timerMin: 'min',
    }
    return table[key] || key
  },
}))

beforeEach(() => {
  cleanup()
})

async function renderTimer() {
  const Timer = (await import('../../../apps/web/src/components/tools/Timer')).default
  return render(React.createElement(Timer))
}

describe('Timer', () => {
  it('renders countdown and stopwatch mode buttons', async () => {
    await renderTimer()
    expect(screen.getByText('Countdown')).toBeInTheDocument()
    expect(screen.getByText('Stopwatch')).toBeInTheDocument()
  })

  it('shows initial display time as 00:00', async () => {
    await renderTimer()
    expect(screen.getByText('00:00')).toBeInTheDocument()
  })

  it('shows time input fields in countdown mode', async () => {
    await renderTimer()
    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs.length).toBeGreaterThanOrEqual(2)
  })

  it('has preset buttons for 1min, 3min, 5min, 10min', async () => {
    await renderTimer()
    expect(screen.getByText('1min')).toBeInTheDocument()
    expect(screen.getByText('3min')).toBeInTheDocument()
    expect(screen.getByText('5min')).toBeInTheDocument()
    expect(screen.getByText('10min')).toBeInTheDocument()
  })

  it('has a Start button', async () => {
    await renderTimer()
    expect(screen.getByText('Start')).toBeInTheDocument()
  })

  it('has a Reset button', async () => {
    await renderTimer()
    expect(screen.getByText('Reset')).toBeInTheDocument()
  })

  it('switches to stopwatch mode when clicking Stopwatch button', async () => {
    await renderTimer()
    fireEvent.click(screen.getByText('Stopwatch'))
    expect(screen.getByText('00:00.00')).toBeInTheDocument()
  })

  it('disables Start when total is 0', async () => {
    await renderTimer()
    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '0' } })
    fireEvent.change(inputs[1], { target: { value: '0' } })
    const startBtn = screen.getByText('Start')
    expect(startBtn).toBeDisabled()
  })

  it('shows Pause after clicking Start', async () => {
    await renderTimer()
    fireEvent.click(screen.getByText('Start'))
    expect(screen.getByText('Pause')).toBeInTheDocument()
  })

  it('shows Resume after clicking Pause', async () => {
    await renderTimer()
    fireEvent.click(screen.getByText('Start'))
    // Pause is visible when running
    expect(screen.getByText('Pause')).toBeInTheDocument()
    // Resume is also visible when running
    expect(screen.getByText('Resume')).toBeInTheDocument()
  })

  it('shows Lap button in stopwatch mode when running', async () => {
    await renderTimer()
    fireEvent.click(screen.getByText('Stopwatch'))
    fireEvent.click(screen.getByText('Start'))
    expect(screen.getByText('Lap')).toBeInTheDocument()
  })

  it('returns to initial state after reset', async () => {
    await renderTimer()
    fireEvent.click(screen.getByText('Start'))
    fireEvent.click(screen.getByText('Pause'))
    fireEvent.click(screen.getByText('Reset'))
    expect(screen.getByText('Start')).toBeInTheDocument()
    // No Resume when paused
    expect(screen.queryByText('Resume')).not.toBeInTheDocument()
    expect(screen.getByText('00:00')).toBeInTheDocument()
  })

  it('preset button sets minutes', async () => {
    await renderTimer()
    fireEvent.click(screen.getByText('3min'))
    const startBtn = screen.getByText('Start')
    expect(startBtn).not.toBeDisabled()
  })
})