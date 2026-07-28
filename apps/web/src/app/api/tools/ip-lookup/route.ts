import { NextRequest, NextResponse } from 'next/server'

const DATACENTER_KEYWORDS = ['cloud', 'datacenter', 'hosting', 'amazon', 'google cloud', 'azure', 'alibaba', 'tencent', 'huawei cloud', 'server', 'transit']

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

function guessUsage(org: string, hosting?: boolean, mobile?: boolean, proxy?: boolean): string {
  if (hosting === true) return '数据中心/云服务'
  if (proxy === true) return '代理/VPN'
  if (mobile === true) return '移动网络'
  const lower = org.toLowerCase()
  if (DATACENTER_KEYWORDS.some(k => lower.includes(k))) return '数据中心/云服务'
  return '家庭宽带'
}

function translateIsp(name: string): string {
  const lower = name.toLowerCase().trim()
  for (const [key, val] of Object.entries(ISP_NAMES)) {
    if (lower.includes(key)) return val
  }
  return name
}

export async function GET(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const clientIp = forwarded?.split(',')[0]?.trim() || realIp || ''

  if (clientIp) {
    if (clientIp.startsWith('127.') || clientIp.startsWith('10.') || clientIp.startsWith('192.168.') || clientIp.startsWith('172.16.')) {
      return NextResponse.json({ ip: clientIp })
    }
    try {
      const res = await fetch(`http://ip-api.com/json/${clientIp}?fields=query,city,regionName,country,isp,org,as,hosting,mobile,proxy&lang=zh-CN`, {
        signal: AbortSignal.timeout(5000),
      })
      const data = await res.json()
      if (data.query) {
        return NextResponse.json({
          ip: data.query,
          country: data.country || '',
          region: data.regionName || '',
          city: data.city || '',
          isp: translateIsp(data.isp || data.org || ''),
          usage: guessUsage(data.org || data.isp || '', data.hosting, data.mobile, data.proxy),
        })
      }
    } catch {}
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