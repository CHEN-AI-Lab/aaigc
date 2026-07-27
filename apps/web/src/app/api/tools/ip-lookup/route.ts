import { NextRequest, NextResponse } from 'next/server'

const DATACENTER_KEYWORDS = ['cloud', 'datacenter', 'hosting', 'amazon', 'google cloud', 'azure', 'alibaba', 'tencent', 'huawei cloud', 'server', 'transit']

function guessUsage(org: string): string {
  const lower = org.toLowerCase()
  if (DATACENTER_KEYWORDS.some(k => lower.includes(k))) return '数据中心'
  return '家庭宽带'
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
      const res = await fetch(`http://ip-api.com/json/${clientIp}?fields=query,city,regionName,country,isp,org,as`, {
        signal: AbortSignal.timeout(5000),
      })
      const data = await res.json()
      if (data.query) {
        return NextResponse.json({
          ip: data.query,
          country: data.country || '',
          region: data.regionName || '',
          city: data.city || '',
          isp: data.isp || data.org || '',
          usage: guessUsage(data.org || data.isp || ''),
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