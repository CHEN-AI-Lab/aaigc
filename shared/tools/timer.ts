// timer —— T2（计时需要 timer 能力）
// 下沉的是「时长解析 / 格式化 / 进度计算」这段纯逻辑，端侧负责 tick。

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolFail, toolOk, readInt, clampInt, padNumber } from './common'

export interface TimerInput {
  hours: number
  minutes: number
  seconds: number
  /** 已过去的毫秒（秒表） */
  elapsedMs: number
  /** 倒计时剩余秒 */
  remainingSeconds: number
}

export interface TimerOutput {
  totalSeconds: number
  remainingText: string
  elapsedText: string
  /** 0–1 的进度（倒计时已完成比例） */
  progress: number
}

export function clampHours(value: number): number {
  return clampInt(value, 0, 99)
}

export function clampMinutes(value: number): number {
  return clampInt(value, 0, 59)
}

export function clampSeconds(value: number): number {
  return clampInt(value, 0, 59)
}

/** HH:mm:ss（有小时才显示小时段） */
export function formatClock(totalSeconds: number): string {
  const total = Math.max(0, Math.trunc(totalSeconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${padNumber(m, 2)}:${padNumber(s, 2)}`
  return `${padNumber(m, 2)}:${padNumber(s, 2)}`
}

/** mm:ss.cc（秒表，百分秒） */
export function formatStopwatch(elapsedMs: number): string {
  const total = Math.max(0, Math.trunc(elapsedMs))
  const centiseconds = Math.floor((total % 1000) / 10)
  const totalSeconds = Math.floor(total / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${padNumber(m, 2)}:${padNumber(s, 2)}.${padNumber(centiseconds, 2)}`
}

export function parseTimer(raw: Record<string, unknown>, _ctx: ToolContext): ToolOutcome<TimerInput> {
  const hours = clampHours(readInt(raw, 'hours', 0))
  const minutes = clampMinutes(readInt(raw, 'minutes', 5))
  const seconds = clampSeconds(readInt(raw, 'seconds', 0))
  const elapsedMs = Math.max(0, readInt(raw, 'elapsedMs', 0))
  const remainingSeconds = Math.max(0, readInt(raw, 'remainingSeconds', 0))
  const totalSeconds = hours * 3600 + minutes * 60 + seconds
  if (totalSeconds <= 0 && remainingSeconds <= 0) {
    return toolFail('outOfRange', 'tools.outOfRange')
  }
  return toolOk({ hours, minutes, seconds, elapsedMs, remainingSeconds })
}

export function runTimer(input: TimerInput, _ctx: ToolContext): ToolOutcome<TimerOutput> {
  const totalSeconds = input.hours * 3600 + input.minutes * 60 + input.seconds
  const remaining = input.remainingSeconds > 0 ? input.remainingSeconds : totalSeconds
  const progress = totalSeconds > 0 ? Math.min(1, Math.max(0, 1 - remaining / totalSeconds)) : 0
  return toolOk({
    totalSeconds,
    remainingText: formatClock(remaining),
    elapsedText: formatStopwatch(input.elapsedMs),
    progress,
  })
}

export function renderTimer(out: TimerOutput, _ctx: ToolContext): string {
  return [`remaining\t${out.remainingText}`, `elapsed\t${out.elapsedText}`].join('\n')
}

export const timerTool: ToolDefinition<TimerInput, TimerOutput> = {
  id: 'timer',
  tier: 'T2',
  capabilities: ['timer'],
  inputs: [
    { name: 'hours', kind: 'number', required: false, labelKey: 'tools.hour', default: 0 },
    { name: 'minutes', kind: 'number', required: false, labelKey: 'tools.minute', default: 5 },
    { name: 'seconds', kind: 'number', required: false, labelKey: 'tools.ss', default: 0 },
    { name: 'elapsedMs', kind: 'number', required: false, labelKey: 'tools.elapsed', default: 0 },
    { name: 'remainingSeconds', kind: 'number', required: false, labelKey: 'tools.remaining', default: 0 },
  ],
  parse: parseTimer,
  run: runTimer,
  render: renderTimer,
}
