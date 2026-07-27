import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  const type = searchParams.get('type') || 'A'
  if (!name) return NextResponse.json({ error: 'Missing name parameter' }, { status: 400 })

  try {
    const res = await fetch(`https://dns.alidns.com/resolve?name=${name}&type=${type}`, {
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json()
    if (data.Answer) return NextResponse.json({ Answer: data.Answer })
    return NextResponse.json({ error: data.Comment || 'No results' }, { status: 404 })
  } catch {
    try {
      const res = await fetch(`https://dns.google/resolve?name=${name}&type=${type}`, {
        signal: AbortSignal.timeout(5000),
      })
      const data = await res.json()
      if (data.Answer) return NextResponse.json({ Answer: data.Answer })
      return NextResponse.json({ error: data.Comment || 'No results' }, { status: 404 })
    } catch {
      return NextResponse.json({ error: 'DNS lookup failed' }, { status: 500 })
    }
  }
}