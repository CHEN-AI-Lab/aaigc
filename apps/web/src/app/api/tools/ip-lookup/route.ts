import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const clientIp = forwarded?.split(',')[0]?.trim() || realIp || ''

  if (clientIp) {
    // Skip lookup for private/local IPs
    if (clientIp.startsWith('127.') || clientIp.startsWith('10.') || clientIp.startsWith('192.168.') || clientIp.startsWith('172.16.')) {
      return NextResponse.json({ ip: clientIp })
    }
    // Try to get location info
    try {
      const res = await fetch(`http://ip-api.com/json/${clientIp}?fields=query,city,regionName,country,isp,org`, {
        signal: AbortSignal.timeout(5000),
      })
      const data = await res.json()
      if (data.query) {
        const parts = [data.country, data.regionName, data.city].filter(Boolean)
        const isp = data.isp || data.org || ''
        return NextResponse.json({
          ip: data.query,
          location: parts.join(' ') || '',
          isp: isp,
        })
      }
    } catch {}
    return NextResponse.json({ ip: clientIp })
  }

  // Fallback to external API
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    return NextResponse.json({ ip: data.ip })
  } catch {
    return NextResponse.json({ error: 'Failed to look up IP' }, { status: 500 })
  }
}