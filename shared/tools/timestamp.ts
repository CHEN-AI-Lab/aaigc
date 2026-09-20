// timestamp —— T1 纯计算：Unix 时间戳 ⇄ 日期时间
// 时间源与时区均经 ToolContext 注入，保证可测试且五端结果一致。

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolFail, toolOk, readEnum, readInt, readString, padNumber } from './common'

export type TimestampMode = 'toDate' | 'toTimestamp'

export interface TimestampInput {
  mode: TimestampMode
  /** toDate：秒或毫秒时间戳字符串 */
  timestamp: string
  /** toTimestamp：墙钟时间（按 ctx.timezone 解释） */
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  millisecond: number
}

export interface TimestampOutput {
  /** 本地（ctx.timezone）格式化：YYYY-MM-DD HH:mm:ss.SSS */
  localText: string
  /** UTC ISO 8601 */
  utcIso: string
  epochMs: number
  epochSeconds: number
  /** toTimestamp 专用，toDate 时为 0 */
  millisecond: number
}

const MODES: readonly TimestampMode[] = ['toDate', 'toTimestamp']

const PARTS_FORMAT = new Map<string, Intl.DateTimeFormat>()

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = PARTS_FORMAT.get(timeZone)
  if (cached) return cached
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  PARTS_FORMAT.set(timeZone, formatter)
  return formatter
}

interface ZonedParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

export function zonedParts(epochMs: number, timeZone: string): ZonedParts {
  const parts = partsFormatter(timeZone).formatToParts(new Date(epochMs))
  const values: Record<string, string> = {}
  for (const part of parts) values[part.type] = part.value
  return {
    year: Number.parseInt(values.year ?? '1970', 10),
    month: Number.parseInt(values.month ?? '01', 10),
    day: Number.parseInt(values.day ?? '01', 10),
    hour: Number.parseInt(values.hour ?? '00', 10),
    minute: Number.parseInt(values.minute ?? '00', 10),
    second: Number.parseInt(values.second ?? '00', 10),
  }
}

/** 指定时区在某一时刻的 UTC 偏移（毫秒） */
export function zoneOffsetMs(epochMs: number, timeZone: string): number {
  const parts = zonedParts(epochMs, timeZone)
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second, 0)
  return asUtc - Math.floor(epochMs / 1000) * 1000
}

/** 墙钟时间（指定时区）→ UTC epoch ms */
export function zonedWallClockToEpoch(
  parts: { year: number; month: number; day: number; hour: number; minute: number; second: number; millisecond: number },
  timeZone: string,
): number {
  const naive = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  )
  const firstOffset = zoneOffsetMs(naive, timeZone)
  let epoch = naive - firstOffset
  const secondOffset = zoneOffsetMs(epoch, timeZone)
  if (secondOffset !== firstOffset) epoch = naive - secondOffset
  return epoch
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function formatZoned(epochMs: number, timeZone: string, withMillis: boolean): string {
  const parts = zonedParts(epochMs, timeZone)
  const base = `${parts.year}-${padNumber(parts.month, 2)}-${padNumber(parts.day, 2)} ${padNumber(
    parts.hour,
    2,
  )}:${padNumber(parts.minute, 2)}:${padNumber(parts.second, 2)}`
  if (!withMillis) return base
  const millis = ((epochMs % 1000) + 1000) % 1000
  return `${base}.${padNumber(millis, 3)}`
}

export function parseTimestamp(
  raw: Record<string, unknown>,
  ctx: ToolContext,
): ToolOutcome<TimestampInput> {
  const mode = readEnum(raw, 'mode', MODES, 'toDate')
  if (mode === 'toDate') {
    const timestamp = (readString(raw, 'timestamp') ?? '').trim()
    if (timestamp.length === 0) return toolFail('emptyInput', 'tools.emptyInput')
    const parsed = Number.parseInt(timestamp, 10)
    if (!Number.isFinite(parsed)) return toolFail('invalidTimestamp', 'tools.invalidTimestamp')
    return toolOk({
      mode,
      timestamp,
      year: 1970,
      month: 1,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    })
  }

  const nowParts = zonedParts(ctx.now(), ctx.timezone)
  const year = readInt(raw, 'year', nowParts.year)
  const month = readInt(raw, 'month', nowParts.month)
  if (month < 1 || month > 12) return toolFail('invalidDate', 'tools.invalidDate')
  const day = readInt(raw, 'day', nowParts.day)
  if (day < 1 || day > daysInMonth(year, month)) return toolFail('invalidDate', 'tools.invalidDate')
  return toolOk({
    mode,
    timestamp: '',
    year,
    month,
    day,
    hour: readInt(raw, 'hour', 0),
    minute: readInt(raw, 'minute', 0),
    second: readInt(raw, 'second', 0),
    millisecond: readInt(raw, 'millisecond', 0),
  })
}

export function runTimestamp(input: TimestampInput, ctx: ToolContext): ToolOutcome<TimestampOutput> {
  if (input.mode === 'toDate') {
    const raw = Number.parseInt(input.timestamp, 10)
    if (!Number.isFinite(raw)) return toolFail('invalidTimestamp', 'tools.invalidTimestamp')
    // 小于 1e12 视为秒（与既有 Web 行为一致）
    const epochMs = raw < 1e12 ? raw * 1000 : raw
    if (!Number.isFinite(new Date(epochMs).getTime())) {
      return toolFail('invalidTimestamp', 'tools.invalidTimestamp')
    }
    return toolOk({
      localText: formatZoned(epochMs, ctx.timezone, true),
      utcIso: new Date(epochMs).toISOString(),
      epochMs,
      epochSeconds: Math.floor(epochMs / 1000),
      millisecond: 0,
    })
  }

  const epochMs = zonedWallClockToEpoch(
    {
      year: input.year,
      month: input.month,
      day: input.day,
      hour: input.hour,
      minute: input.minute,
      second: input.second,
      millisecond: input.millisecond,
    },
    ctx.timezone,
  )
  if (!Number.isFinite(epochMs)) return toolFail('invalidDate', 'tools.invalidDate')
  return toolOk({
    localText: formatZoned(epochMs, ctx.timezone, true),
    utcIso: new Date(epochMs).toISOString(),
    epochMs,
    epochSeconds: Math.floor(epochMs / 1000),
    millisecond: input.millisecond,
  })
}

export function renderTimestamp(out: TimestampOutput, _ctx: ToolContext): string {
  return [`local\t${out.localText}`, `utc\t${out.utcIso}`, `seconds\t${out.epochSeconds}`, `ms\t${out.epochMs}`].join('\n')
}

export const timestampTool: ToolDefinition<TimestampInput, TimestampOutput> = {
  id: 'timestamp',
  tier: 'T1',
  capabilities: [],
  inputs: [
    {
      name: 'mode',
      kind: 'select',
      required: false,
      labelKey: 'tools.mode',
      default: 'toDate',
      options: [
        { value: 'toDate', labelKey: 'tools.timestampToDate' },
        { value: 'toTimestamp', labelKey: 'tools.dateToTimestamp' },
      ],
    },
    { name: 'timestamp', kind: 'text', required: false, labelKey: 'tools.timestamp' },
    { name: 'year', kind: 'number', required: false, labelKey: 'tools.year' },
    { name: 'month', kind: 'number', required: false, labelKey: 'tools.month' },
    { name: 'day', kind: 'number', required: false, labelKey: 'tools.day' },
    { name: 'hour', kind: 'number', required: false, labelKey: 'tools.hour' },
    { name: 'minute', kind: 'number', required: false, labelKey: 'tools.minute' },
    { name: 'second', kind: 'number', required: false, labelKey: 'tools.ss' },
    { name: 'millisecond', kind: 'number', required: false, labelKey: 'tools.ms' },
  ],
  parse: parseTimestamp,
  run: runTimestamp,
  render: renderTimestamp,
}
