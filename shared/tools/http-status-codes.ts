// http-status-codes —— T1 纯计算：状态码表检索（文案以 i18n key 返回，函数内不含语言）

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolOk, readString } from './common'

export type HttpStatusCategory = 'info' | 'success' | 'redirect' | 'clientError' | 'serverError'

export interface HttpStatusCodeEntry {
  code: number
  /** 英文标准名（端侧可作为兜底展示） */
  name: string
  category: HttpStatusCategory
  /** i18n key：tools.httpStatus<code> */
  messageKey: string
  /** i18n key：tools.http<Category> */
  categoryKey: string
}

export interface HttpStatusCodesInput {
  query: string
}

export interface HttpStatusCodesOutput {
  entries: HttpStatusCodeEntry[]
  total: number
}

interface RawEntry {
  code: number
  name: string
}

const RAW: readonly RawEntry[] = [
  { code: 100, name: 'Continue' },
  { code: 101, name: 'Switching Protocols' },
  { code: 102, name: 'Processing' },
  { code: 200, name: 'OK' },
  { code: 201, name: 'Created' },
  { code: 202, name: 'Accepted' },
  { code: 204, name: 'No Content' },
  { code: 301, name: 'Moved Permanently' },
  { code: 302, name: 'Found' },
  { code: 304, name: 'Not Modified' },
  { code: 307, name: 'Temporary Redirect' },
  { code: 308, name: 'Permanent Redirect' },
  { code: 400, name: 'Bad Request' },
  { code: 401, name: 'Unauthorized' },
  { code: 403, name: 'Forbidden' },
  { code: 404, name: 'Not Found' },
  { code: 405, name: 'Method Not Allowed' },
  { code: 408, name: 'Request Timeout' },
  { code: 409, name: 'Conflict' },
  { code: 410, name: 'Gone' },
  { code: 422, name: 'Unprocessable Entity' },
  { code: 429, name: 'Too Many Requests' },
  { code: 500, name: 'Internal Server Error' },
  { code: 502, name: 'Bad Gateway' },
  { code: 503, name: 'Service Unavailable' },
  { code: 504, name: 'Gateway Timeout' },
]

function categoryOf(code: number): HttpStatusCategory {
  if (code < 200) return 'info'
  if (code < 300) return 'success'
  if (code < 400) return 'redirect'
  if (code < 500) return 'clientError'
  return 'serverError'
}

const CATEGORY_KEYS: Record<HttpStatusCategory, string> = {
  info: 'tools.httpInfo',
  success: 'tools.httpSuccess',
  redirect: 'tools.httpRedirect',
  clientError: 'tools.httpClientError',
  serverError: 'tools.httpServerError',
}

export const HTTP_STATUS_CODES: readonly HttpStatusCodeEntry[] = RAW.map((entry) => ({
  code: entry.code,
  name: entry.name,
  category: categoryOf(entry.code),
  messageKey: `tools.httpStatus${entry.code}`,
  categoryKey: CATEGORY_KEYS[categoryOf(entry.code)],
}))

export function parseHttpStatusCodes(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<HttpStatusCodesInput> {
  return toolOk({ query: (readString(raw, 'query') ?? '').trim() })
}

export function runHttpStatusCodes(
  input: HttpStatusCodesInput,
  _ctx: ToolContext,
): ToolOutcome<HttpStatusCodesOutput> {
  const query = input.query.toLowerCase()
  const entries = query
    ? HTTP_STATUS_CODES.filter(
        (entry) =>
          String(entry.code).includes(query) ||
          entry.name.toLowerCase().includes(query) ||
          entry.messageKey.toLowerCase().includes(query),
      )
    : [...HTTP_STATUS_CODES]
  return toolOk({ entries, total: entries.length })
}

export function renderHttpStatusCodes(out: HttpStatusCodesOutput, _ctx: ToolContext): string {
  return out.entries.map((entry) => `${entry.code}\t${entry.name}`).join('\n')
}

export const httpStatusCodesTool: ToolDefinition<HttpStatusCodesInput, HttpStatusCodesOutput> = {
  id: 'http-status-codes',
  tier: 'T1',
  capabilities: [],
  inputs: [{ name: 'query', kind: 'text', required: false, labelKey: 'tools.search' }],
  parse: parseHttpStatusCodes,
  run: runHttpStatusCodes,
  render: renderHttpStatusCodes,
}
