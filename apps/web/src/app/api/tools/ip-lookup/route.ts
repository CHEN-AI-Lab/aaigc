import { NextRequest, NextResponse } from 'next/server'

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
  const res = await fetch(`https://ipinfo.io/${ip}/json`, { signal: AbortSignal.timeout(5000) })
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
  const res = await fetch(`https://api.ip.sb/geoip/${ip}`, { signal: AbortSignal.timeout(5000) })
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
  const res = await fetch(`http://ip-api.com/json/${ip}?fields=query,city,regionName,country,isp,org,as,hosting,mobile,proxy&lang=${langParam}`, {
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
  const { searchParams } = new URL(request.url)
  const lang = searchParams.get('lang') || 'en'

  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const clientIp = forwarded?.split(',')[0]?.trim() || realIp || ''

  if (clientIp) {
    if (clientIp === '::1' || clientIp.startsWith('127.') || clientIp.startsWith('10.') || clientIp.startsWith('192.168.') || clientIp.startsWith('172.16.')) {
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
    return NextResponse.json({ error: 'Failed to look up IP' }, { status: 500 })
  }
}