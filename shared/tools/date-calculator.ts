// date-calculator —— T1 纯计算：日期差 / 日期加减
// 所有日历运算在 UTC 下进行（避免宿主机时区影响），保证五端一致。

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolFail, toolOk, readEnum, readInt, padNumber } from './common'
import { daysInMonth, zonedParts, zonedWallClockToEpoch } from './timestamp'

export type DateCalculatorMode = 'diff' | 'add'

export interface DateParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

export interface DateCalculatorInput {
  mode: DateCalculatorMode
  start: DateParts
  end: DateParts
  /** add 模式：可正可负 */
  deltaYears: number
  deltaMonths: number
  deltaDays: number
}

export interface DateCalculatorOutput {
  /** diff：毫秒差；add：目标时刻 epoch ms */
  epochMs: number
  /** 绝对值拆分（diff） */
  days: number
  hours: number
  minutes: number
  seconds: number
  totalDays: number
  /** 结果日期文本 YYYY-MM-DD HH:mm:ss */
  resultText: string
  /** 起止（add 模式为 base 与 result） */
  startText: string
  endText: string
}

const MODES: readonly DateCalculatorMode[] = ['diff', 'add']

export function daysInMonthUtc(year: number, month: number): number {
  return daysInMonth(year, month)
}

export function formatDateParts(parts: DateParts): string {
  return `${parts.year}-${padNumber(parts.month, 2)}-${padNumber(parts.day, 2)} ${padNumber(
    parts.hour,
    2,
  )}:${padNumber(parts.minute, 2)}:${padNumber(parts.second, 2)}`
}

export function partsFromEpoch(epochMs: number): DateParts {
  const date = new Date(epochMs)
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
  }
}

/** 按日历语义加减年月日（月末自动收敛） */
export function addCalendar(parts: DateParts, years: number, months: number, days: number): DateParts {
  const totalMonths = parts.month - 1 + months
  const yearCarry = Math.floor(totalMonths / 12)
  let year = parts.year + years + yearCarry
  let month = ((totalMonths % 12) + 12) % 12 + 1
  let day = parts.day
  const maxDay = daysInMonthUtc(year, month)
  if (day > maxDay) day = maxDay
  const base = Date.UTC(year, month - 1, day, parts.hour, parts.minute, parts.second)
  const shifted = new Date(base + days * 86400000)
  year = shifted.getUTCFullYear()
  month = shifted.getUTCMonth() + 1
  day = shifted.getUTCDate()
  return { year, month, day, hour: parts.hour, minute: parts.minute, second: parts.second }
}

function readParts(raw: Record<string, unknown>, prefix: string, fallback: DateParts): DateParts {
  const year = readInt(raw, `${prefix}Year`, fallback.year)
  const month = readInt(raw, `${prefix}Month`, fallback.month)
  const day = readInt(raw, `${prefix}Day`, fallback.day)
  if (month < 1 || month > 12) return fallback
  if (day < 1 || day > daysInMonthUtc(year, month)) return fallback
  return {
    year,
    month,
    day,
    hour: readInt(raw, `${prefix}Hour`, fallback.hour),
    minute: readInt(raw, `${prefix}Minute`, fallback.minute),
    second: readInt(raw, `${prefix}Second`, fallback.second),
  }
}

export function parseDateCalculator(
  raw: Record<string, unknown>,
  ctx: ToolContext,
): ToolOutcome<DateCalculatorInput> {
  const nowParts = zonedParts(ctx.now(), ctx.timezone)
  const fallback: DateParts = {
    year: nowParts.year,
    month: nowParts.month,
    day: nowParts.day,
    hour: 0,
    minute: 0,
    second: 0,
  }
  return toolOk({
    mode: readEnum(raw, 'mode', MODES, 'diff'),
    start: readParts(raw, 'start', fallback),
    end: readParts(raw, 'end', fallback),
    deltaYears: readInt(raw, 'deltaYears', 0),
    deltaMonths: readInt(raw, 'deltaMonths', 0),
    deltaDays: readInt(raw, 'deltaDays', 0),
  })
}

export function runDateCalculator(
  input: DateCalculatorInput,
  _ctx: ToolContext,
): ToolOutcome<DateCalculatorOutput> {
  const startMs = Date.UTC(
    input.start.year,
    input.start.month - 1,
    input.start.day,
    input.start.hour,
    input.start.minute,
    input.start.second,
  )

  if (input.mode === 'diff') {
    const endMs = Date.UTC(
      input.end.year,
      input.end.month - 1,
      input.end.day,
      input.end.hour,
      input.end.minute,
      input.end.second,
    )
    const delta = endMs - startMs
    const abs = Math.abs(delta)
    const totalSeconds = Math.floor(abs / 1000)
    return toolOk({
      epochMs: delta,
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
      totalDays: Math.floor((abs / 86400000) * 100) / 100,
      resultText: `${delta >= 0 ? '+' : '-'}${Math.floor(totalSeconds / 86400)}d ${Math.floor(
        (totalSeconds % 86400) / 3600,
      )}h ${Math.floor((totalSeconds % 3600) / 60)}m ${totalSeconds % 60}s`,
      startText: formatDateParts(input.start),
      endText: formatDateParts(input.end),
    })
  }

  const target = addCalendar(input.start, input.deltaYears, input.deltaMonths, input.deltaDays)
  const targetMs = Date.UTC(
    target.year,
    target.month - 1,
    target.day,
    target.hour,
    target.minute,
    target.second,
  )
  const delta = targetMs - startMs
  const totalSeconds = Math.floor(Math.abs(delta) / 1000)
  return toolOk({
    epochMs: targetMs,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalDays: Math.floor((Math.abs(delta) / 86400000) * 100) / 100,
    resultText: formatDateParts(target),
    startText: formatDateParts(input.start),
    endText: formatDateParts(target),
  })
}

export function renderDateCalculator(out: DateCalculatorOutput, _ctx: ToolContext): string {
  return [`start\t${out.startText}`, `end\t${out.endText}`, `result\t${out.resultText}`].join('\n')
}

export const dateCalculatorTool: ToolDefinition<DateCalculatorInput, DateCalculatorOutput> = {
  id: 'date-calculator',
  tier: 'T1',
  capabilities: [],
  inputs: [
    {
      name: 'mode',
      kind: 'select',
      required: false,
      labelKey: 'tools.mode',
      default: 'diff',
      options: [
        { value: 'diff', labelKey: 'tools.dateDiff' },
        { value: 'add', labelKey: 'tools.dateAdd' },
      ],
    },
    { name: 'startYear', kind: 'number', required: false, labelKey: 'tools.year' },
    { name: 'startMonth', kind: 'number', required: false, labelKey: 'tools.month' },
    { name: 'startDay', kind: 'number', required: false, labelKey: 'tools.day' },
    { name: 'endYear', kind: 'number', required: false, labelKey: 'tools.year' },
    { name: 'endMonth', kind: 'number', required: false, labelKey: 'tools.month' },
    { name: 'endDay', kind: 'number', required: false, labelKey: 'tools.day' },
    { name: 'deltaYears', kind: 'number', required: false, labelKey: 'tools.deltaYears', default: 0 },
    { name: 'deltaMonths', kind: 'number', required: false, labelKey: 'tools.deltaMonths', default: 0 },
    { name: 'deltaDays', kind: 'number', required: false, labelKey: 'tools.deltaDays', default: 0 },
  ],
  parse: parseDateCalculator,
  run: runDateCalculator,
  render: renderDateCalculator,
}
