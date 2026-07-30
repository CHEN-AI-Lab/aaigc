'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'

type Mode = 'countdown' | 'stopwatch'

export default function Timer() {
  const t = useTranslations('tools')
  const [mode, setMode] = useState<Mode>('countdown')
  const [minutes, setMinutes] = useState('5')
  const [seconds, setSeconds] = useState('00')
  const [remaining, setRemaining] = useState(0) // total seconds
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0) // ms for stopwatch
  const [laps, setLaps] = useState<number[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)
  const progressRef = useRef(0)

  const beep = useCallback(() => {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
      osc.start()
      osc.stop(ctx.currentTime + 0.5)
    } catch { /* audio not supported */ }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setRunning(false)
  }, [])

  // Countdown tick
  useEffect(() => {
    if (!running || mode !== 'countdown') return
    const start = Date.now()
    const initialRemaining = remaining
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000)
      const newRemaining = Math.max(0, initialRemaining - elapsed)
      setRemaining(newRemaining)
      progressRef.current = newRemaining
      if (newRemaining <= 0) {
        stopTimer()
        beep()
        // Beep 3 times
        setTimeout(() => beep(), 500)
        setTimeout(() => beep(), 1000)
      }
    }, 100)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, mode, remaining, stopTimer, beep])

  // Stopwatch tick
  useEffect(() => {
    if (!running || mode !== 'stopwatch') return
    startTimeRef.current = Date.now() - elapsed
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current)
    }, 10)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, mode, elapsed])

  const startCountdown = useCallback(() => {
    const total = parseInt(minutes) * 60 + parseInt(seconds)
    if (total <= 0) return
    setRemaining(total)
    progressRef.current = total
    setRunning(true)
  }, [minutes, seconds])

  const startStopwatch = useCallback(() => {
    if (elapsed === 0) {
      setElapsed(0)
    }
    startTimeRef.current = Date.now() - elapsed
    setRunning(true)
  }, [elapsed])

  const handleStart = useCallback(() => {
    if (mode === 'countdown') startCountdown()
    else startStopwatch()
  }, [mode, startCountdown, startStopwatch])

  const handleReset = useCallback(() => {
    stopTimer()
    if (mode === 'countdown') {
      setRemaining(0)
    } else {
      setElapsed(0)
      setLaps([])
    }
  }, [mode, stopTimer])

  const handleLap = useCallback(() => {
    setLaps(prev => [...prev, elapsed])
  }, [elapsed])

  // Format time
  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60)
    const s = totalSecs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const formatMs = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000)
    const centiseconds = Math.floor((ms % 1000) / 10)
    const m = Math.floor(totalSecs / 60)
    const s = totalSecs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
  }

  const displayTime = mode === 'countdown'
    ? formatTime(remaining)
    : formatMs(elapsed)

  const isCountdown = mode === 'countdown'
  const isRunning = running

  // Circular progress
  const totalInitial = isCountdown ? (parseInt(minutes) * 60 + parseInt(seconds)) : 100
  const progress = isCountdown
    ? (totalInitial > 0 ? remaining / totalInitial : 0)
    : 0
  const circumference = 2 * Math.PI * 80
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div className="mt-6 max-w-md mx-auto space-y-6">
      {/* Mode toggle */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => { stopTimer(); setMode('countdown'); setRemaining(0) }}
          className={`px-5 py-2 text-sm rounded-lg transition-colors ${
            isCountdown ? 'bg-accent text-white' : 'bg-surface text-text-secondary border border-[rgba(127,99,21,0.15)]'
          }`}
        >{t('timerCountdown')}</button>
        <button
          onClick={() => { stopTimer(); setMode('stopwatch'); setElapsed(0); setLaps([]) }}
          className={`px-5 py-2 text-sm rounded-lg transition-colors ${
            !isCountdown ? 'bg-accent text-white' : 'bg-surface text-text-secondary border border-[rgba(127,99,21,0.15)]'
          }`}
        >{t('timerStopwatch')}</button>
      </div>

      {/* Timer display */}
      <div className="relative flex items-center justify-center py-8">
        {/* Circular progress (countdown only) */}
        {isCountdown && (
          <svg className="absolute w-56 h-56 -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(127,99,21,0.1)" strokeWidth="6" />
            <circle
              cx="100" cy="100" r="80" fill="none" stroke="var(--color-accent, #c89b3c)" strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
        )}
        <div className="text-6xl font-light tracking-widest text-text-primary tabular-nums">
          {displayTime}
        </div>
      </div>

      {/* Countdown input */}
      {isCountdown && !isRunning && remaining === 0 && (
        <div className="flex items-center justify-center gap-3">
          <input
            type="number" min="0" max="999" value={minutes}
            onChange={e => setMinutes(e.target.value)}
            className="w-20 p-2 text-center bg-surface border border-[rgba(127,99,21,0.15)] rounded-lg text-sm text-text-primary"
            placeholder="0"
          />
          <span className="text-sm text-text-secondary">:</span>
          <input
            type="number" min="0" max="59" value={seconds}
            onChange={e => setSeconds(e.target.value)}
            className="w-20 p-2 text-center bg-surface border border-[rgba(127,99,21,0.15)] rounded-lg text-sm text-text-primary"
            placeholder="00"
          />
        </div>
      )}

      {/* Preset buttons (countdown) */}
      {isCountdown && !isRunning && remaining === 0 && (
        <div className="flex justify-center gap-2">
          {[1, 3, 5, 10].map(m => (
            <button
              key={m}
              onClick={() => { setMinutes(String(m)); setSeconds('00') }}
              className={`px-4 py-1.5 text-xs rounded-lg transition-colors ${
                parseInt(minutes) === m && seconds === '00'
                  ? 'bg-accent text-white'
                  : 'bg-surface text-text-secondary border border-[rgba(127,99,21,0.15)]'
              }`}
            >{m}{t('timerMin')}</button>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-center gap-3">
        {!isRunning ? (
          <button
            onClick={handleStart}
            disabled={isCountdown && remaining === 0 && (parseInt(minutes) * 60 + parseInt(seconds)) <= 0}
            className="px-8 py-3 bg-accent text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30"
          >{t('timerStart')}</button>
        ) : (
          <button
            onClick={stopTimer}
            className="px-8 py-3 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >{t('timerPause')}</button>
        )}
        {isRunning && (
          <button
            onClick={handleStart}
            className="px-8 py-3 bg-green-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >{t('timerResume')}</button>
        )}
        {!isCountdown && isRunning && (
          <button
            onClick={handleLap}
            className="px-6 py-3 bg-surface text-text-primary text-sm font-medium rounded-lg border border-[rgba(127,99,21,0.15)] hover:bg-accent/5 transition-colors"
          >{t('timerLap')}</button>
        )}
        <button
          onClick={handleReset}
          disabled={!isRunning && ((isCountdown && remaining === 0) || (!isCountdown && elapsed === 0))}
          className="px-6 py-3 bg-surface text-text-primary text-sm font-medium rounded-lg border border-[rgba(127,99,21,0.15)] hover:bg-accent/5 transition-colors disabled:opacity-30"
        >{t('timerReset')}</button>
      </div>

      {/* Lap times */}
      {!isCountdown && laps.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-text-secondary font-medium">{t('timerLaps')}</p>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {laps.map((lap, i) => (
              <div key={i} className="flex justify-between px-3 py-1.5 bg-surface rounded-lg text-sm">
                <span className="text-text-secondary">#{i + 1}</span>
                <span className="text-text-primary tabular-nums">{formatMs(lap)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}