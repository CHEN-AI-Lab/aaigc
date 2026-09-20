// ip-lookup —— T3（需要 network）
// 查询端点从 process.env.IP_GEO_ENDPOINTS / IP_ECHO_ENDPOINT 读取（无硬编码域名）。

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolFail, toolOk, readString } from './common'
import { ipEchoEndpoint, ipGeoEndpoints } from '../constants/endpoints'

export interface IpLookupInput {
  ip: string
}

export interface IpLookupOutput {
  ip: string
  country: string
  region: string
  city: string
  isp: string
  /** isp | datacenter | cdn | education | government | mobile | proxy | unknown */
  usage: string
  /** 私有/保留地址（不查询外部服务） */
  isPrivate: boolean
}

interface GeoResponse {
  ip?: string
  query?: string
  country?: string
  country_name?: string
  region?: string
  regionName?: string
  region_name?: string
  city?: string
  isp?: string
  org?: string
  organization?: string
  hosting?: boolean
  proxy?: boolean
  mobile?: boolean
}

const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/

export function isIpv4(value: string): boolean {
  const match = IPV4_RE.exec(value.trim())
  if (!match) return false
  return match.slice(1).every((part) => {
    const n = Number.parseInt(part, 10)
    return n >= 0 && n <= 255
  })
}

/** IPv6 宽松校验（压缩写法允许） */
export function isIpv6(value: string): boolean {
  const text = value.trim()
  if (text.length === 0 || text.length > 45) return false
  if (text.split('::').length > 2) return false
  return /^[0-9a-fA-F:.]+$/.test(text) && /:/.test(text)
}

export function isValidIp(value: string): boolean {
  return isIpv4(value) || isIpv6(value)
}

/** 私有 / 保留网段判定（与 shared/utils/ip.ts 的既有约定一致） */
export function isPrivateOrReserved(ip: string): boolean {
  const text = ip.trim()
  if (isIpv6(text)) {
    const lower = text.toLowerCase()
    if (lower === '::1' || lower === '::') return true
    if (/^f[cd]/.test(lower)) return true
    if (lower.startsWith('fe80')) return true
    return false
  }
  const match = IPV4_RE.exec(text)
  if (!match) return false
  const [, a, b] = match
  const first = Number.parseInt(a, 10)
  const second = Number.parseInt(b, 10)
  if (first === 10) return true
  if (first === 127) return true
  if (first === 0) return true
  if (first === 169 && second === 254) return true
  if (first === 172 && second >= 16 && second <= 31) return true
  if (first === 192 && second === 168) return true
  if (first === 100 && second >= 64 && second <= 127) return true
  if (first >= 224) return true
  return false
}

const DATACENTER_KEYWORDS = [
  'cloud', 'datacenter', 'hosting', 'amazon', 'google cloud', 'azure', 'alibaba',
  'tencent', 'huawei cloud', 'backbone', 'idc', 'ovh', 'digitalocean', 'linode',
  'vultr', 'hetzner',
]
const EDU_KEYWORDS = ['edu', 'university', 'college', 'school', 'cernet', 'ac.cn', 'sch.cn']
const GOV_KEYWORDS = ['gov', 'government', 'state', 'federal', 'municipal']
const CDN_KEYWORDS = ['cdn', 'cloudflare', 'fastly', 'akamai', 'cloudfront']

/** 依据 org/isp 文本猜测用途（纯函数，可单测） */
export function guessUsage(org: string): string {
  const lower = org.toLowerCase()
  if (CDN_KEYWORDS.some((k) => lower.includes(k))) return 'cdn'
  if (DATACENTER_KEYWORDS.some((k) => lower.includes(k))) return 'datacenter'
  if (EDU_KEYWORDS.some((k) => lower.includes(k))) return 'education'
  if (GOV_KEYWORDS.some((k) => lower.includes(k))) return 'government'
  if (lower.length === 0) return 'unknown'
  return 'isp'
}

/** 把各 provider 的异构响应归一化（纯函数，可单测） */
export function normalizeGeoResponse(data: GeoResponse): Omit<IpLookupOutput, 'isPrivate'> {
  const org = data.org ?? data.isp ?? data.organization ?? ''
  let usage = guessUsage(org)
  if (data.hosting === true) usage = 'datacenter'
  else if (data.proxy === true) usage = 'proxy'
  else if (data.mobile === true) usage = 'mobile'
  return {
    ip: data.ip ?? data.query ?? '',
    country: data.country_name ?? data.country ?? '',
    region: data.regionName ?? data.region_name ?? data.region ?? '',
    city: data.city ?? '',
    isp: data.isp ?? data.org ?? data.organization ?? '',
    usage,
  }
}

export function parseIpLookup(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<IpLookupInput> {
  const ip = (readString(raw, 'ip') ?? '').trim()
  if (ip.length === 0) return toolFail('emptyInput', 'tools.emptyInput')
  if (!isValidIp(ip)) return toolFail('invalidInput', 'tools.invalidInput')
  return toolOk({ ip })
}

export async function runIpLookup(
  input: IpLookupInput,
  ctx: ToolContext,
): Promise<ToolOutcome<IpLookupOutput>> {
  const isPrivate = isPrivateOrReserved(input.ip)
  if (isPrivate) {
    return toolOk({
      ip: input.ip,
      country: '',
      region: '',
      city: '',
      isp: '',
      usage: 'unknown',
      isPrivate: true,
    })
  }

  if (!ctx.fetchJson) return toolFail('unsupportedPlatform', 'tools.unsupportedPlatform')
  const endpoints = ipGeoEndpoints()
  if (endpoints.length === 0) return toolFail('networkFailed', 'tools.networkFailed')

  for (const endpoint of endpoints) {
    try {
      const url = endpoint.replace('{ip}', encodeURIComponent(input.ip))
      const data = await ctx.fetchJson<GeoResponse>(url)
      const normalized = normalizeGeoResponse(data)
      if (normalized.ip.length > 0 || normalized.city.length > 0) {
        return toolOk({ ...normalized, isPrivate: false })
      }
    } catch {
      // 该端点不可达 → 继续尝试下一个
    }
  }

  // 所有 provider 失败：回显 IP（不报错）
  return toolOk({
    ip: input.ip,
    country: '',
    region: '',
    city: '',
    isp: '',
    usage: 'unknown',
    isPrivate: false,
  })
}

export function renderIpLookup(out: IpLookupOutput, _ctx: ToolContext): string {
  return [
    `ip\t${out.ip}`,
    `country\t${out.country}`,
    `region\t${out.region}`,
    `city\t${out.city}`,
    `isp\t${out.isp}`,
    `usage\t${out.usage}`,
  ].join('\n')
}

export const ipLookupTool: ToolDefinition<IpLookupInput, IpLookupOutput> = {
  id: 'ip-lookup',
  tier: 'T3',
  capabilities: ['network'],
  inputs: [{ name: 'ip', kind: 'text', required: true, labelKey: 'tools.ipAddress' }],
  parse: parseIpLookup,
  run: runIpLookup,
  render: renderIpLookup,
}

/** 无 IP 入参时的公网 IP 回显（供端侧「查询本机」按钮使用） */
export async function fetchPublicIp(ctx: ToolContext): Promise<ToolOutcome<{ ip: string }>> {
  const endpoint = ipEchoEndpoint()
  if (!ctx.fetchJson || endpoint.length === 0) {
    return toolFail('networkFailed', 'tools.networkFailed')
  }
  try {
    const data = await ctx.fetchJson<{ ip?: string }>(endpoint)
    if (typeof data.ip === 'string' && data.ip.length > 0) return toolOk({ ip: data.ip })
    return toolFail('networkFailed', 'tools.networkFailed')
  } catch {
    return toolFail('networkFailed', 'tools.networkFailed')
  }
}
