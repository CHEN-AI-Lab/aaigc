// cron-builder —— T1 纯计算：cron 表达式组合、校验与最近执行时间推算

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolFail, toolOk, readInt, readString, clampInt } from './common'

export interface CronBuilderInput {
  minute: string
  hour: string
  dayOfMonth: string
  month: string
  dayOfWeek: string
  /** 需要推算的条数 */
  count: number
}

export interface FieldSpec {
  name: 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek'
  min: number
  max: number
}

export interface CronBuilderOutput {
  expression: string
  /** 具体 day/dow/month 与通配的 minute/hour 同时出现 → 高频风险 */
  dangerous: boolean
  /** 最近 count 次执行时间（UTC epoch ms，基于 ctx.now()） */
  nextRuns: number[]
  fields: {
    minute: string
    hour: string
    dayOfMonth: string
    month: string
    dayOfWeek: string
  }
}

export const CRON_FIELDS: readonly FieldSpec[] = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'dayOfMonth', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12 },
  { name: 'dayOfWeek', min: 0, max: 7 },
]

/** 解析单个字段为允许值集合（支持 * / , - 步长） */
export function parseField(value: string, min: number, max: number): number[] | null {
  const raw = value.trim()
  if (raw.length === 0) return null
  const values = new Set<number>()
  for (const part of raw.split(',')) {
    if (part.length === 0) return null
    const [rangePart, stepPart] = part.split('/')
    const step = stepPart === undefined ? 1 : Number.parseInt(stepPart, 10)
    if (!Number.isFinite(step) || step < 1) return null

    let from = min
    let to = max
    if (rangePart !== '*') {
      const [fromPart, toPart] = rangePart.split('-')
      from = Number.parseInt(fromPart, 10)
      if (!Number.isFinite(from)) return null
      to = toPart === undefined ? from : Number.parseInt(toPart, 10)
      if (!Number.isFinite(to)) return null
    }
    if (from < min || to > max || from > to) return null
    for (let v = from; v <= to; v += step) values.add(v)
  }
  // cron 的 dow 允许 7 == 0
  if (max === 7 && values.has(7)) values.add(0)
  return [...values].sort((a, b) => a - b)
}

export function isDangerousCron(fields: {
  minute: string
  hour: string
  dayOfMonth: string
  month: string
  dayOfWeek: string
}): boolean {
  const restricted =
    fields.dayOfMonth !== '*' || fields.dayOfWeek !== '*' || fields.month !== '*'
  return restricted && (fields.minute === '*' || fields.hour === '*')
}

/** 从 fromMs（含）起推算最近 count 次触发（UTC） */
export function nextCronRuns(
  fields: { minute: string; hour: string; dayOfMonth: string; month: string; dayOfWeek: string },
  fromMs: number,
  count: number,
): number[] {
  const minutes = parseField(fields.minute, 0, 59)
  const hours = parseField(fields.hour, 0, 23)
  const days = parseField(fields.dayOfMonth, 1, 31)
  const months = parseField(fields.month, 1, 12)
  const dows = parseField(fields.dayOfWeek, 0, 7)
  if (!minutes || !hours || !days || !months || !dows) return []

  const runs: number[] = []
  let cursor = Math.floor(fromMs / 60000) * 60000
  // 最多向后扫 5 年，防止死循环
  const limit = cursor + 5 * 366 * 24 * 60 * 60000
  while (runs.length < count && cursor <= limit) {
    const date = new Date(cursor)
    const monthOk = months.includes(date.getUTCMonth() + 1)
    const dayOk = days.includes(date.getUTCDate())
    const dowOk = dows.includes(date.getUTCDay())
    if (monthOk && dayOk && dowOk && hours.includes(date.getUTCHours()) && minutes.includes(date.getUTCMinutes())) {
      runs.push(cursor)
    }
    cursor += 60000
  }
  return runs
}

export function parseCronBuilder(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<CronBuilderInput> {
  const fields = {
    minute: readString(raw, 'minute') ?? '*',
    hour: readString(raw, 'hour') ?? '*',
    dayOfMonth: readString(raw, 'dayOfMonth') ?? '*',
    month: readString(raw, 'month') ?? '*',
    dayOfWeek: readString(raw, 'dayOfWeek') ?? '*',
  }
  for (const spec of CRON_FIELDS) {
    if (parseField(fields[spec.name], spec.min, spec.max) === null) {
      return toolFail('invalidExpression', 'tools.invalidExpression')
    }
  }
  return toolOk({ ...fields, count: clampInt(readInt(raw, 'count', 5), 1, 20) })
}

export function runCronBuilder(input: CronBuilderInput, ctx: ToolContext): ToolOutcome<CronBuilderOutput> {
  const fields = {
    minute: input.minute,
    hour: input.hour,
    dayOfMonth: input.dayOfMonth,
    month: input.month,
    dayOfWeek: input.dayOfWeek,
  }
  return toolOk({
    expression: `${fields.minute} ${fields.hour} ${fields.dayOfMonth} ${fields.month} ${fields.dayOfWeek}`,
    dangerous: isDangerousCron(fields),
    nextRuns: nextCronRuns(fields, ctx.now(), input.count),
    fields,
  })
}

export function renderCronBuilder(out: CronBuilderOutput, _ctx: ToolContext): string {
  const lines = [out.expression, `dangerous\t${out.dangerous}`]
  for (const run of out.nextRuns) lines.push(`next\t${new Date(run).toISOString()}`)
  return lines.join('\n')
}

export const cronBuilderTool: ToolDefinition<CronBuilderInput, CronBuilderOutput> = {
  id: 'cron-builder',
  tier: 'T1',
  capabilities: [],
  inputs: [
    { name: 'minute', kind: 'text', required: false, labelKey: 'tools.cronMinute', default: '*' },
    { name: 'hour', kind: 'text', required: false, labelKey: 'tools.cronHour', default: '*' },
    { name: 'dayOfMonth', kind: 'text', required: false, labelKey: 'tools.cronDay', default: '*' },
    { name: 'month', kind: 'text', required: false, labelKey: 'tools.cronMonth', default: '*' },
    { name: 'dayOfWeek', kind: 'text', required: false, labelKey: 'tools.cronDow', default: '*' },
  ],
  parse: parseCronBuilder,
  run: runCronBuilder,
  render: renderCronBuilder,
}
