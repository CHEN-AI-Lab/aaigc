// dns-lookup —— T3（需要 network）
// 端点从 process.env.DNS_DOH_ENDPOINTS 读取（无硬编码域名，无 fallback）。

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolFail, toolOk, readString } from './common'
import { dnsDohEndpoints } from '../constants/endpoints'

export const VALID_DNS_TYPES = [
  'A',
  'AAAA',
  'CNAME',
  'MX',
  'NS',
  'TXT',
  'SOA',
  'SRV',
  'CAA',
  'PTR',
] as const

export type DnsRecordType = (typeof VALID_DNS_TYPES)[number]

export interface DnsLookupInput {
  name: string
  type: DnsRecordType
}

export interface DnsAnswer {
  name: string
  type: number
  TTL: number
  data: string
}

export interface DnsLookupOutput {
  name: string
  type: DnsRecordType
  answers: DnsAnswer[]
  /** 无 Answer 时回退展示的 Authority（SOA/NS） */
  authority: DnsAnswer[]
  note: string | null
}

export interface DohResponse {
  Answer?: DnsAnswer[]
  Authority?: DnsAnswer[]
}

const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/

/** 归一化域名：去掉协议 / 路径 / 查询串 / 端口 */
export function normalizeDomain(input: string): string {
  return input
    .trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
    .split('/')[0]
    .split('?')[0]
    .split('#')[0]
    .replace(/:\d+$/, '')
    .toLowerCase()
}

export function parseDnsLookup(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<DnsLookupInput> {
  const rawName = (readString(raw, 'name') ?? '').trim()
  if (rawName.length === 0) return toolFail('emptyInput', 'tools.missingDomain')
  if (rawName.length > 253) return toolFail('outOfRange', 'tools.domainTooLong')

  const typeInput = (readString(raw, 'type') ?? 'A').toUpperCase()
  if (!(VALID_DNS_TYPES as readonly string[]).includes(typeInput)) {
    return toolFail('invalidInput', 'tools.invalidDnsType')
  }
  const name = normalizeDomain(rawName)
  if (!DOMAIN_RE.test(name)) return toolFail('invalidInput', 'tools.invalidDomain')
  return toolOk({ name, type: typeInput as DnsRecordType })
}

export async function runDnsLookup(
  input: DnsLookupInput,
  ctx: ToolContext,
): Promise<ToolOutcome<DnsLookupOutput>> {
  const endpoints = dnsDohEndpoints()
  if (!ctx.fetchJson) return toolFail('unsupportedPlatform', 'tools.unsupportedPlatform')
  if (endpoints.length === 0) return toolFail('networkFailed', 'tools.networkFailed')

  const query = `?name=${encodeURIComponent(input.name)}&type=${encodeURIComponent(input.type)}`
  let lastAuthority: DnsAnswer[] = []
  for (const endpoint of endpoints) {
    try {
      const data = await ctx.fetchJson<DohResponse>(`${endpoint}${query}`, {
        headers: { accept: 'application/dns-json' },
      })
      if (data.Answer && data.Answer.length > 0) {
        return toolOk({
          name: input.name,
          type: input.type,
          answers: data.Answer,
          authority: [],
          note: null,
        })
      }
      if (data.Authority && data.Authority.length > 0) lastAuthority = data.Authority
    } catch {
      // 该端点不可达 → 继续尝试下一个
    }
  }

  if (lastAuthority.length > 0) {
    return toolOk({
      name: input.name,
      type: input.type,
      answers: lastAuthority,
      authority: lastAuthority,
      note: `No ${input.type} records — showing SOA/NS instead`,
    })
  }
  return toolFail('networkFailed', 'tools.dnsNoRecords')
}

export function renderDnsLookup(out: DnsLookupOutput, _ctx: ToolContext): string {
  const lines = out.answers.map((answer) => `${answer.name}\t${answer.type}\t${answer.data}`)
  if (out.note) lines.unshift(`# ${out.note}`)
  return lines.join('\n')
}

export const dnsLookupTool: ToolDefinition<DnsLookupInput, DnsLookupOutput> = {
  id: 'dns-lookup',
  tier: 'T3',
  capabilities: ['network'],
  inputs: [
    { name: 'name', kind: 'text', required: true, labelKey: 'tools.domain' },
    {
      name: 'type',
      kind: 'select',
      required: false,
      labelKey: 'tools.dnsType',
      default: 'A',
      options: VALID_DNS_TYPES.map((type) => ({ value: type, labelKey: `tools.dnsType${type}` })),
    },
  ],
  parse: parseDnsLookup,
  run: runDnsLookup,
  render: renderDnsLookup,
}
