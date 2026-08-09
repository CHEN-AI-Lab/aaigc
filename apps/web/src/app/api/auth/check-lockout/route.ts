import { NextResponse } from "next/server"
import { checkLoginRateLimit } from "@/lib/login-rate-limit"

// GET /api/auth/check-lockout?email=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  if (!email) {
    return NextResponse.json({ error: 'missingEmail' }, { status: 400 })
  }

  const rateKey = `login:${email.toLowerCase()}`
  const check = checkLoginRateLimit(rateKey)

  if (!check.allowed) {
    const minutesRemaining = Math.ceil((check.lockedUntil! - Date.now()) / 60000)
    return NextResponse.json({
      locked: true,
      minutesRemaining,
      remaining: 0,
    })
  }

  return NextResponse.json({
    locked: false,
    remaining: check.remaining,
  })
}