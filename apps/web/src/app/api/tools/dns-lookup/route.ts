import { NextRequest, NextResponse } from 'next/server'

async function queryDns(name: string, type: string) {
  // Try Alibaba DNS (works in China)
  try {
    const res = await fetch(`https://dns.alidns.com/resolve?name=${name}&type=${type}`, {
      headers: { accept: 'application/dns-json' },
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json()
    if (data.Answer?.length) return data.Answer
  } catch {}

  // Fallback to Google DNS
  try {
    const res = await fetch(`https://dns.google/resolve?name=${name}&type=${type}`, {
      headers: { accept: 'application/dns-json' },
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json()
    if (data.Answer?.length) return data.Answer
  } catch {}

  return null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  const type = searchParams.get('type') || 'A'
  if (!name) return NextResponse.json({ error: 'Missing domain name' }, { status: 400 })

  // Strip protocol if user pastes a full URL
  const clean = name.replace(/^https?:\/\//, '').split('/')[0].split('?')[0]
  if (!clean.includes('.')) return NextResponse.json({ error: 'Invalid domain' }, { status: 400 })

  const answer = await queryDns(clean, type)
  if (answer) return NextResponse.json({ Answer: answer })
  return NextResponse.json({ error: `No ${type} records found for ${clean}` }, { status: 404 })
}