import { NextRequest, NextResponse } from 'next/server'
import { getTrustedClientIp } from 'shared/utils/ip'
import { checkRateLimit } from 'shared/utils/rate-limit'

// DNS 查询类型白名单（防止注入或查询非法类型）
const VALID_DNS_TYPES = new Set(['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'SRV', 'CAA', 'PTR'])

async function queryDns(name: string, type: string) {
  const encodedName = encodeURIComponent(name)
  const encodedType = encodeURIComponent(type)

  // Try Alibaba DNS (works in China)
  try {
    const res = await fetch(`https://dns.alidns.com/resolve?name=${encodedName}&type=${encodedType}`, {
      headers: { accept: 'application/dns-json' },
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json()
    if (data.Answer?.length) return data.Answer
  } catch { /* Alibaba DNS timeout — try Google DNS */ }

  // Fallback to Google DNS
  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodedName}&type=${encodedType}`, {
      headers: { accept: 'application/dns-json' },
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json()
    if (data.Answer?.length) return data.Answer
  } catch { /* Google DNS timeout — return null */ }

  return null
}

export async function GET(request: NextRequest) {
  // 限流：每 IP 每分钟 20 次查询
  const ip = getTrustedClientIp(request)
  const rl = checkRateLimit(`dns-lookup:${ip}`, 20, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "tooManyRequests" }, { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } })
  }

  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  const type = (searchParams.get('type') || 'A').toUpperCase()
  if (!name) return NextResponse.json({ error: "missingDomain" }, { status: 400 })

  // DNS 类型白名单校验
  if (!VALID_DNS_TYPES.has(type)) {
    return NextResponse.json({ error: "invalidDnsType" }, { status: 400 })
  }

  // 长度限制 + 基本格式校验
  if (name.length > 253) {
    return NextResponse.json({ error: "domainTooLong" }, { status: 400 })
  }

  // Strip protocol if user pastes a full URL
  const clean = name.replace(/^https?:\/\//, '').split('/')[0].split('?')[0]
  if (!clean.includes('.')) return NextResponse.json({ error: "invalidDomain" }, { status: 400 })

  const answer = await queryDns(clean, type)
  if (answer) return NextResponse.json({ Answer: answer })
  // No Answer records found — return Authority (SOA/NS) if available
  try {
    const encodedClean = encodeURIComponent(clean)
    const res = await fetch(`https://dns.alidns.com/resolve?name=${encodedClean}&type=${encodeURIComponent(type)}`, {
      headers: { accept: 'application/dns-json' },
      signal: AbortSignal.timeout(3000),
    })
    const fb = await res.json()
    if (fb.Authority?.length) return NextResponse.json({ Answer: fb.Authority, note: `No ${type} records — showing SOA/NS instead` })
  } catch { /* Fallback lookup failed — report no records */ }
  return NextResponse.json({ error: "dnsNoRecords" }, { status: 404 })
}
