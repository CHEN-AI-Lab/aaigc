import { NextRequest, NextResponse } from 'next/server'
import { getTrustedClientIp, isPrivateOrReservedIp } from 'shared/utils/ip'
import { checkRateLimit } from 'shared/utils/rate-limit'

const DATACENTER_KEYWORDS = ['cloud', 'datacenter', 'hosting', 'amazon', 'google cloud', 'azure', 'alibaba', 'tencent', 'huawei cloud', 'backbone', 'idc', 'ovh', 'digitalocean', 'linode', 'vultr', 'hetzner']
const EDU_KEYWORDS = ['edu', 'university', 'college', 'school', 'cernet', 'ac.cn', 'sch.cn']
const GOV_KEYWORDS = ['gov', 'government', 'state', 'federal', 'municipal']
const CDN_KEYWORDS = ['cdn', 'cloudflare', 'fastly', 'akamai', 'cloudfront']

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

function guessUsage(org: string): string {
  const lower = org.toLowerCase()
  if (CDN_KEYWORDS.some(k => lower.includes(k))) return 'cdn'
  if (DATACENTER_KEYWORDS.some(k => lower.includes(k))) return 'datacenter'
  if (EDU_KEYWORDS.some(k => lower.includes(k))) return 'education'
  if (GOV_KEYWORDS.some(k => lower.includes(k))) return 'government'
  return 'isp'
}

function translateIsp(name: string, lang: string): string {
  const lower = name.toLowerCase().trim()
  const map = lang.startsWith('zh') ? ISP_NAMES : ISP_NAMES_EN
  for (const [key, val] of Object.entries(map)) {
    if (lower.includes(key)) return val
  }
  return name
}

async function tryIpinfo(ip: string, lang: string) {
  const res = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}/json`, { signal: AbortSignal.timeout(5000) })
  const data = await res.json()
  if (data.city) {
    return {
      ip: data.ip,
      country: countryName(data.country || ''),
      region: data.region || '',
      city: data.city || '',
      isp: translateIsp(data.org || '', lang),
      usage: guessUsage(data.org || ''),
    }
  }
  return null
}

async function tryIpsb(ip: string, lang: string) {
  const res = await fetch(`https://api.ip.sb/geoip/${encodeURIComponent(ip)}`, { signal: AbortSignal.timeout(5000) })
  const data = await res.json()
  if (data.city) {
    return {
      ip: data.ip,
      country: data.country || '',
      region: data.region || '',
      city: data.city || '',
      isp: translateIsp(data.isp || data.organization || '', lang),
      usage: guessUsage(data.isp || data.organization || ''),
    }
  }
  return null
}

async function tryIpapi(ip: string, lang: string) {
  const langParam = lang.startsWith('zh') ? 'zh-CN' : 'en'
  // 使用 HTTPS（原先用 HTTP 会在网络路径上泄露查询的 IP）
  const res = await fetch(`https://ip-api.com/json/${encodeURIComponent(ip)}?fields=query,city,regionName,country,isp,org,as,hosting,mobile,proxy&lang=${langParam}`, {
    signal: AbortSignal.timeout(5000),
  })
  const data = await res.json()
  if (data.query) {
    let usage = guessUsage(data.org || data.isp || '')
    if (data.hosting === true) usage = 'datacenter'
    else if (data.proxy === true) usage = 'proxy'
    else if (data.mobile === true) usage = 'mobile'
    return {
      ip: data.query,
      country: data.country || '',
      region: data.regionName || '',
      city: data.city || '',
      isp: translateIsp(data.isp || data.org || '', lang),
      usage,
    }
  }
  return null
}

export async function GET(request: NextRequest) {
  // 限流：每 IP 每分钟 15 次查询
  const ip = getTrustedClientIp(request)
  const rl = checkRateLimit(`ip-lookup:${ip}`, 15, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "tooManyRequests" }, { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } })
  }

  const { searchParams } = new URL(request.url)
  const lang = searchParams.get('lang') || 'en'

  // 使用可信 IP 提取（替换原先直接读取 x-forwarded-for）
  const clientIp = ip

  if (clientIp && clientIp !== 'unknown') {
    // SSRF 防护：私有/保留地址不发送给外部查询服务
    if (isPrivateOrReservedIp(clientIp)) {
      return NextResponse.json({ ip: clientIp })
    }

    const api = await tryIpapi(clientIp, lang).catch(() => null)
    if (api) return NextResponse.json(api)

    const info = await tryIpinfo(clientIp, lang).catch(() => null)
    if (info) return NextResponse.json(info)

    const sb = await tryIpsb(clientIp, lang).catch(() => null)
    if (sb) return NextResponse.json(sb)

    return NextResponse.json({ ip: clientIp })
  }

  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    return NextResponse.json({ ip: data.ip })
  } catch {
    return NextResponse.json({ error: "ipLookupFailed" }, { status: 500 })
  }
}
