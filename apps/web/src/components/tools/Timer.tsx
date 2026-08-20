'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'

type Mode = 'countdown' | 'stopwatch'

const clampHours = (v: string) => {
  const n = parseInt(v)
  if (isNaN(n) || n < 0) return '0'
  if (n > 99) return '99'
  return String(n)
}

const clampMinutes = (v: string) => {
  const n = parseInt(v)
  if (isNaN(n) || n < 0) return '0'
  if (n > 59) return '59'
  return String(n)
}

const clampSeconds = (v: string) => {
  const n = parseInt(v)
  if (isNaN(n) || n < 0) return '0'
  if (n > 59) return '59'
  return String(n)
}

export default function Timer() {
  const t = useTranslations('tools')
  const [mode, setMode] = useState<Mode>('countdown')
  const [hours, setHours] = useState('0')
  const [minutes, setMinutes] = useState('5')
  const [seconds, setSeconds] = useState('00')
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [laps, setLaps] = useState<{ lap: number; total: number }[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)
  const remainingRef = useRef(0)
  const initialTotalRef = useRef(0)
  const elapsedRef = useRef(0)
  const lastLapTimeRef = useRef(0)

  const getTotal = useCallback(() => {
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds)
  }, [hours, minutes, seconds])

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setRunning(false)
  }, [])

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

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
    } catch { /* silent */ }
  }, [])

  // Countdown tick
  useEffect(() => {
    if (!running || mode !== 'countdown') return
    const startTime = Date.now()
    const initialRemaining = remainingRef.current
    intervalRef.current = setInterval(() => {
      const elapsedSecs = Math.floor((Date.now() - startTime) / 1000)
      const newRemaining = Math.max(0, initialRemaining - elapsedSecs)
      setRemaining(newRemaining)
      if (newRemaining <= 0) {
        stopTimer()
        beep()
        setTimeout(() => beep(), 500)
        setTimeout(() => beep(), 1000)
      }
    }, 100)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode])

  // Stopwatch tick
  useEffect(() => {
    if (!running || mode !== 'stopwatch') return
    const startOffset = elapsedRef.current
    startTimeRef.current = Date.now() - startOffset
    intervalRef.current = setInterval(() => {
      const now = Date.now()
      setElapsed(now - startTimeRef.current)
    }, 10)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, mode])

  const startCountdown = useCallback(() => {
    const total = getTotal()
    if (total <= 0) return
    remainingRef.current = total
    initialTotalRef.current = total
    setRemaining(total)
    setRunning(true)
  }, [getTotal])

  const resumeCountdown = useCallback(() => {
    remainingRef.current = remaining
    setRunning(true)
  }, [remaining])

  const startStopwatch = useCallback(() => {
    elapsedRef.current = 0
    setElapsed(0)
    setRunning(true)
  }, [])

  const resumeStopwatch = useCallback(() => {
    elapsedRef.current = elapsed
    setRunning(true)
  }, [elapsed])

  const handleStart = useCallback(() => {
    if (mode === 'countdown') startCountdown()
    else startStopwatch()
  }, [mode, startCountdown, startStopwatch])

  const handleResume = useCallback(() => {
    if (mode === 'countdown') resumeCountdown()
    else resumeStopwatch()
  }, [mode, resumeCountdown, resumeStopwatch])

  const handleReset = useCallback(() => {
    stopTimer()
    if (mode === 'countdown') {
      remainingRef.current = 0
      initialTotalRef.current = 0
      setRemaining(0)
    } else {
      setElapsed(0)
      elapsedRef.current = 0
      lastLapTimeRef.current = 0
      setLaps([])
    }
  }, [mode, stopTimer])

  const handleLap = useCallback(() => {
    const lapDuration = elapsed - lastLapTimeRef.current
    lastLapTimeRef.current = elapsed
    setLaps(prev => [{ lap: lapDuration, total: elapsed }, ...prev])
  }, [elapsed])

  const formatTime = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600)
    const m = Math.floor((totalSecs % 3600) / 60)
    const s = totalSecs % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const formatMs = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000)
    const cs = Math.floor((ms % 1000) / 10)
    const m = Math.floor(totalSecs / 60)
    const s = totalSecs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
  }

  const displayTime = mode === 'countdown' ? formatTime(remaining) : formatMs(elapsed)
  const isCountdown = mode === 'countdown'
  const hasHours = isCountdown && remaining >= 3600
  const totalSet = isCountdown ? initialTotalRef.current : 0
  const progress = isCountdown && initialTotalRef.current > 0 ? 1 - remaining / initialTotalRef.current : 0
  const circumference = 2 * Math.PI * 90
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div className="mt-6 max-w-md mx-auto space-y-6">
      {/* Mode toggle */}
      <div className="flex justify-center gap-2 relative z-10">
        <button
          onClick={() => { stopTimer(); setMode('countdown'); setRemaining(0); remainingRef.current = 0; initialTotalRef.current = 0 }}
          className={`px-5 py-2 text-sm rounded-lg transition-colors ${
            isCountdown ? 'bg-accent text-white' : 'bg-surface text-text-secondary border border-border'
          }`}
        >{t('timerCountdown')}</button>
        <button
          onClick={() => { stopTimer(); setMode('stopwatch'); setElapsed(0); elapsedRef.current = 0; setLaps([]) }}
          className={`px-5 py-2 text-sm rounded-lg transition-colors ${
            !isCountdown ? 'bg-accent text-white' : 'bg-surface text-text-secondary border border-border'
          }`}
        >{t('timerStopwatch')}</button>
      </div>

      {/* Timer display + circle */}
      <div className="relative flex items-center justify-center min-h-[16rem]">
        {isCountdown && (
          <svg className="absolute w-64 h-64" viewBox="0 0 220 220" style={{ zIndex: 0 }}>
            <circle cx="110" cy="110" r="90" fill="none" stroke="var(--color-border)" strokeWidth="6" />
            <circle
              cx="110" cy="110" r="90" fill="none" stroke="var(--color-accent, #c89b3c)" strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '110px 110px' }}
            />
          </svg>
        )}
        <div className="text-center relative z-10">
          <div className={`font-light tracking-widest text-text-primary tabular-nums ${hasHours ? 'text-4xl' : isCountdown ? 'text-5xl' : 'text-4xl'}`}>
            {displayTime}
          </div>
          {isCountdown && (running || remaining > 0) && totalSet > 0 && (
            <div className="text-xs text-text-secondary/50 mt-2 tabular-nums tracking-normal">
              {formatTime(totalSet)}
            </div>
          )}
        </div>
      </div>

      {/* Countdown input */}
      {isCountdown && !running && remaining === 0 && (
        <div className="flex items-center justify-center gap-2 relative z-10">
          <input
            type="number" min="0" max="99" value={hours}
            onChange={e => setHours(clampHours(e.target.value))}
            className="w-16 p-2 text-center bg-surface border border-border rounded-lg text-sm text-text-primary"
            placeholder="0"
          />
          <span className="text-sm text-text-secondary">:</span>
          <input
            type="number" min="0" max="59" value={minutes}
            onChange={e => setMinutes(clampMinutes(e.target.value))}
            className="w-16 p-2 text-center bg-surface border border-border rounded-lg text-sm text-text-primary"
            placeholder="0"
          />
          <span className="text-sm text-text-secondary">:</span>
          <input
            type="number" min="0" max="59" value={seconds}
            onChange={e => setSeconds(clampSeconds(e.target.value))}
            className="w-16 p-2 text-center bg-surface border border-border rounded-lg text-sm text-text-primary"
            placeholder="00"
          />
        </div>
      )}

      {/* Preset buttons */}
      {isCountdown && !running && remaining === 0 && (
        <div className="flex flex-wrap justify-center gap-2 relative z-10">
          {[
            { label: '1min', h: 0, m: 1 },
            { label: '3min', h: 0, m: 3 },
            { label: '5min', h: 0, m: 5 },
            { label: '10min', h: 0, m: 10 },
            { label: '30min', h: 0, m: 30 },
          ].map(p => (
            <button
              key={p.label}
              onClick={() => { setHours(String(p.h)); setMinutes(String(p.m)); setSeconds('00') }}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                parseInt(hours) === p.h && parseInt(minutes) === p.m && seconds === '00'
                  ? 'bg-accent text-white'
                  : 'bg-surface text-text-secondary border border-border'
              }`}
            >{p.label}</button>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap justify-center gap-3 relative z-10">
        {!running && (isCountdown ? remaining === 0 : elapsed === 0) ? (
          <button
            onClick={handleStart}
            disabled={isCountdown && getTotal() <= 0}
            className="px-8 py-3 bg-accent text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30"
          >{t('timerStart')}</button>
        ) : !running ? (
          <button
            onClick={handleResume}
            className="px-8 py-3 bg-success text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >{t('timerResume')}</button>
        ) : (
          <button
            onClick={stopTimer}
            className="px-8 py-3 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >{t('timerPause')}</button>
        )}
        {!isCountdown && running && (
          <button
            onClick={handleLap}
            className="px-6 py-3 bg-surface text-text-primary text-sm font-medium rounded-lg border border-border hover:bg-accent/5 transition-colors"
          >{t('timerLap')}</button>
        )}
        {running && isCountdown ? (
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-surface text-text-primary text-sm font-medium rounded-lg border border-border hover:bg-accent/5 transition-colors"
          >{t('timerReset')}</button>
        ) : !running && (isCountdown ? remaining > 0 : elapsed > 0) ? (
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-surface text-text-primary text-sm font-medium rounded-lg border border-border hover:bg-accent/5 transition-colors"
          >{t('timerReset')}</button>
        ) : null}
      </div>

      {/* Lap times */}
      {!isCountdown && laps.length > 0 && (
        <div className="space-y-1 relative z-10">
          <div className="max-h-80 overflow-y-auto space-y-1">
            {laps.map((item, i) => (
              <div key={i} className="grid grid-cols-3 items-center px-3 py-1.5 bg-surface rounded-lg text-sm">
                <span className="text-text-secondary">{String(laps.length - i).padStart(2, '0')}</span>
                <span className="text-text-primary tabular-nums text-center">{formatMs(item.lap)}</span>
                <span className="text-text-secondary/50 tabular-nums text-right">{formatMs(item.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}