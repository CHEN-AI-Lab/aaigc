// GET /api/tools/ip-lookup —— 查询请求来源 IP 的归属
//
// 归一化逻辑**不再自己实现**：字段解析与用途判定统一调
// `shared/tools/ip-lookup.ts` 的 `normalizeGeoResponse()`（内部再用 `guessUsage()`），
// 与工具层 / 各端共用同一套语义，API 层只保留两件「HTTP 侧特有」的事：
//   1. 端点模板渲染（`{ip}` / `{lang}` 占位符）—— 端点列表读 IP_GEO_ENDPOINTS / IP_ECHO_ENDPOINT
//   2. 展示层本地化（国家码 → 国家名、ISP 名中英对照）—— 属于 i18n，不是归一化
//
// 响应体字段与改造前完全一致：{ ip, country, region, city, isp, usage }
// 或降级为 { ip } 。

import { NextRequest, NextResponse } from 'next/server'
import { getTrustedClientIp, isPrivateOrReservedIp } from 'shared/utils/ip'
import { checkRateLimit } from 'shared/utils/rate-limit'
import { ipEchoEndpoint, ipGeoEndpoints } from 'shared/constants/endpoints'
import { normalizeGeoResponse } from 'shared/tools/ip-lookup'
import { withCors } from '@/api-cors'
import { errorResponse, tooManyRequestsResponse } from '@/api-response'

/** `shared/tools/ip-lookup` 未导出 GeoResponse，用入参类型推导，避免两边类型漂移 */
type GeoPayload = Parameters<typeof normalizeGeoResponse>[0]

/** 请求超时（毫秒）。端点不可达就换下一个，避免整个工具卡死 */
const FETCH_TIMEOUT_MS = 5000

// ── 以下两张表只服务于「展示层本地化」（i18n），不涉及字段归一化 ──
const COUNTRY_NAMES: Record<string, string> = {
  'CN': 'China', 'US': 'United States', 'JP': 'Japan', 'KR': 'South Korea',
  'GB': 'United Kingdom', 'DE': 'Germany', 'FR': 'France', 'CA': 'Canada',
  'AU': 'Australia', 'SG': 'Singapore', 'TW': 'Taiwan', 'HK': 'Hong Kong',
  'IN': 'India', 'RU': 'Russia', 'BR': 'Brazil', 'NL': 'Netherlands',
}

const ISP_NAMES: Record<string, string> = {
  'chinanet': '中国电信',
  'china telecom': '中国电信',
  'china mobile': '中国移动',
  'china unicom': '中国联通',
  'cernet': '中国教育网',
  'china education and research network': '中国教育网',
  'drpeng': '鹏博士',
  'greatwall': '长城宽带',
  'wasu': '华数宽带',
}

const ISP_NAMES_EN: Record<string, string> = {
  'chinanet': 'China Telecom',
  'china telecom': 'China Telecom',
  'china mobile': 'China Mobile',
  'china unicom': 'China Unicom',
  'cernet': 'CERNET',
  'china education and research network': 'CERNET',
  'drpeng': 'Dr.Peng',
  'greatwall': 'Greatwall Broadband',
  'wasu': 'Wasu Broadband',
}

function countryName(code: string): string {
  return COUNTRY_NAMES[code] || code
}

function translateIsp(name: string, lang: string): string {
  const lower = name.toLowerCase().trim()
  const map = lang.startsWith('zh') ? ISP_NAMES : ISP_NAMES_EN
  for (const [key, val] of Object.entries(map)) {
    if (lower.includes(key)) return val
  }
  return name
}

/** 只接受 BCP-47 形态的短标签，避免把任意字符串拼进 URL */
function normalizeLang(raw: string | null): string {
  if (!raw) return 'en'
  return /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(raw) ? raw : 'en'
}

/** 把端点模板里的 {ip} / {lang} 占位符渲染成实际值（值一律 encode，防注入） */
function renderEndpoint(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match: string, key: string) => {
    const value = values[key]
    return typeof value === 'string' ? encodeURIComponent(value) : match
  })
}

interface GeoResult {
  ip: string
  country: string
  region: string
  city: string
  isp: string
  usage: string
}

/**
 * 归一化（调 shared）+ 本地化（本文件）：
 *   · 字段归一化 / usage 判定 → shared 的 normalizeGeoResponse
 *   · 2 字母国家码 → 国家名、ISP 中英对照 → 本文件（i18n，与改造前保持一致）
 * 取不到 IP 视为该端点不可用 → 交由下一个端点。
 */
function toGeoResult(data: Record<string, unknown>, lang: string): GeoResult | null {
  const geo = normalizeGeoResponse(data as GeoPayload)
  if (!geo.ip) return null
  return {
    ip: geo.ip,
    country: geo.country.length === 2 ? countryName(geo.country.toUpperCase()) : geo.country,
    region: geo.region,
    city: geo.city,
    isp: translateIsp(geo.isp, lang),
    usage: geo.usage,
  }
}

/** 查询单个 GeoIP 端点；不可达 / 非 JSON / 无 IP 一律返回 null */
async function tryEndpoint(endpoint: string, ip: string, lang: string): Promise<GeoResult | null> {
  try {
    const res = await fetch(renderEndpoint(endpoint, { ip, lang }), {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!res.ok) return null
    const data: unknown = await res.json()
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null
    return toGeoResult(data as Record<string, unknown>, lang)
  } catch {
    return null
  }
}

export const GET = withCors(async (request: NextRequest) => {
  // 限流：每 IP 每分钟 15 次查询（与改造前一致）
  const ip = getTrustedClientIp(request)
  const rl = await checkRateLimit(`ip-lookup:${ip}`, 15, 60_000)
  if (!rl.allowed) {
    return tooManyRequestsResponse(rl.resetAt)
  }

  const { searchParams } = new URL(request.url)
  const lang = normalizeLang(searchParams.get('lang'))

  // 使用可信 IP 提取（替换原先直接读取 x-forwarded-for）
  const clientIp = ip

  if (clientIp && clientIp !== 'unknown') {
    // SSRF 防护：私有/保留地址不发送给外部查询服务
    if (isPrivateOrReservedIp(clientIp)) {
      return NextResponse.json({ ip: clientIp })
    }

    const endpoints = ipGeoEndpoints()
    // 未配置端点：不做非空 fallback（SK-8），明确告知服务未配置
    if (endpoints.length === 0) {
      return errorResponse('networkFailed')
    }

    for (const endpoint of endpoints) {
      const geo = await tryEndpoint(endpoint, clientIp, lang)
      if (geo) return NextResponse.json(geo)
    }

    // 所有端点都没给出可用结果：至少把 IP 回显回去（与改造前一致）
    return NextResponse.json({ ip: clientIp })
  }

  // 无法从请求头取得可信 IP → 用回显端点取本机公网 IP
  const echo = ipEchoEndpoint()
  if (!echo) {
    return errorResponse('networkFailed')
  }
  try {
    const res = await fetch(echo, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    const data: unknown = await res.json()
    const echoed = data && typeof data === 'object' ? (data as Record<string, unknown>).ip : null
    return NextResponse.json({ ip: typeof echoed === 'string' ? echoed : 'unknown' })
  } catch {
    return errorResponse('ipLookupFailed')
  }
})

export const OPTIONS = withCors(async () => new NextResponse(null, { status: 204 }))
