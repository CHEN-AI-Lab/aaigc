import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Get client IP from request headers (Vercel provides these)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const clientIp = forwarded?.split(',')[0]?.trim() || realIp

  if (clientIp) {
    return NextResponse.json({ ip: clientIp })
  }

  // No client IP in headers — fallback to external API
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    return NextResponse.json({ ip: data.ip })
  } catch {
    return NextResponse.json({ error: 'Failed to look up IP' }, { status: 500 })
  }
}