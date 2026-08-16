import { NextResponse } from "next/server"
import { prisma } from "shared/utils/prisma"
import { checkRateLimit } from "shared/utils/rate-limit"

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json({ error: "invalidParams" }, { status: 400 })
    }

    // Rate limit verification attempts
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const rateCheck = checkRateLimit(`verify-attempt:${ip}`, 5, 60_000)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "tooManyAttempts" }, { status: 429 })
    }

    // Find the code
    const record = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    })

    if (!record) {
      return NextResponse.json({ error: "verifyFailed" }, { status: 401 })
    }

    // Mark as used
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    })

    return NextResponse.json({ success: true, verified: true })
  } catch (error) {
    console.error("Verify email error:", error)
    return NextResponse.json({ error: "verifyError" }, { status: 500 })
  }
}