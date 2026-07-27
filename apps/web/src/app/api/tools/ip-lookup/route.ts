import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://myip.ipip.net', { signal: AbortSignal.timeout(5000) })
    const text = await res.text()
    return NextResponse.json({ ip: text.trim() })
  } catch {
    try {
      const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(5000) })
      const data = await res.json()
      return NextResponse.json({ ip: data.ip })
    } catch {
      return NextResponse.json({ error: 'Failed to look up IP' }, { status: 500 })
    }
  }
}