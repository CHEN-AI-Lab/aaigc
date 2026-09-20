// GET /api/tools/dns-lookup —— DNS-over-HTTPS 解析
//
// 改造：
//   1. DoH 端点从硬编码（alidns / dns.google）改为 `DNS_DOH_ENDPOINTS`
//      （SK-8：禁止硬编码域名。未配置 → networkFailed，不做非空 fallback）
//   2. 注入 CORS 头（桌面端 / App WebView 跨域调用）
//   3. 错误码统一走 API_ERROR_STATUS
//
// 响应体形状与改造前一致：{ Answer } / { Answer, note } / 404 dnsNoRecords。

import { NextRequest, NextResponse } from 'next/server'
import { getTrustedClientIp } from 'shared/utils/ip'
import { checkRateLimit } from 'shared/utils/rate-limit'
import { dnsDohEndpoints } from 'shared/constants/endpoints'
import { withCors } from '@/api-cors'
import { errorResponse, tooManyRequestsResponse } from '@/api-response'

// DNS 查询类型白名单（防止注入或查询非法类型）
const VALID_DNS_TYPES = new Set(['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'SRV', 'CAA', 'PTR'])

/** 请求超时（毫秒） */
const FETCH_TIMEOUT_MS = 5000

interface DohResponse {
  Answer?: unknown[]
  Authority?: unknown[]
}

function buildDohUrl(base: string, name: string, type: string): string {
  const query = `name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`
  return base.includes('?') ? `${base}&${query}` : `${base}?${query}`
}

/** 查询单个 DoH 端点；不可达 / 非 JSON 一律返回 null（换下一个端点） */
async function queryDoh(base: string, name: string, type: string): Promise<DohResponse | null> {
  try {
    const res = await fetch(buildDohUrl(base, name, type), {
      headers: { accept: 'application/dns-json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!res.ok) return null
    const data: unknown = await res.json()
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null
    return data as DohResponse
  } catch {
    return null
  }
}

export const GET = withCors(async (request: NextRequest) => {
  // 限流：每 IP 每分钟 20 次查询（与改造前一致）
  const ip = getTrustedClientIp(request)
  const rl = await checkRateLimit(`dns-lookup:${ip}`, 20, 60_000)
  if (!rl.allowed) {
    return tooManyRequestsResponse(rl.resetAt)
  }

  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  const type = (searchParams.get('type') || 'A').toUpperCase()
  if (!name) return errorResponse('missingDomain')

  // DNS 类型白名单校验
  if (!VALID_DNS_TYPES.has(type)) {
    return errorResponse('invalidDnsType')
  }

  // 长度限制 + 基本格式校验
  if (name.length > 253) {
    return errorResponse('domainTooLong')
  }

  // Strip protocol if user pastes a full URL
  const clean = name.replace(/^https?:\/\//, '').split('/')[0].split('?')[0]
  if (!clean.includes('.')) return errorResponse('invalidDomain')

  const endpoints = dnsDohEndpoints()
  // 未配置端点：不做非空 fallback（SK-8），明确告知服务未配置
  if (endpoints.length === 0) {
    return errorResponse('networkFailed')
  }

  let fallbackAuthority: unknown[] | null = null
  for (const endpoint of endpoints) {
    const data = await queryDoh(endpoint, clean, type)
    if (!data) continue
    if (Array.isArray(data.Answer) && data.Answer.length > 0) {
      return NextResponse.json({ Answer: data.Answer })
    }
    // 记住第一个 Authority，供「无 Answer」时降级展示（SOA/NS）
    if (!fallbackAuthority && Array.isArray(data.Authority) && data.Authority.length > 0) {
      fallbackAuthority = data.Authority
    }
  }

  // No Answer records found — return Authority (SOA/NS) if available
  if (fallbackAuthority) {
    return NextResponse.json({
      Answer: fallbackAuthority,
      note: `No ${type} records — showing SOA/NS instead`,
    })
  }

  return errorResponse('dnsNoRecords')
})

export const OPTIONS = withCors(async () => new NextResponse(null, { status: 204 }))
