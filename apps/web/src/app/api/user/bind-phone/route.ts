import { NextRequest, NextResponse } from "next/server"
import { prisma } from "shared/utils/prisma"
import { auth } from "@/auth"
import { checkRateLimit } from "shared/utils/rate-limit"
import { isSameOrigin } from "shared/utils/csrf"

// POST /api/user/bind-phone
// 设置页绑定手机号。参照 CookMate：
// - 手机号一旦绑定，不可修改、不可解绑（数据库已绑定则拒绝）
// - 无短信验证码服务，绑定身份验证使用当前密码
// - 未设置密码的用户必须先设置密码（setPasswordFirst）
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "loginRequired" }, { status: 401 })
    }

    // CSRF 防护：校验同源
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    const userId = session.user.id

    // 限流：每用户 5 次 / 10 分钟
    const rl = checkRateLimit(`bind-phone:${userId}`, 5, 600_000)
    if (!rl.allowed) {
      const seconds = Math.ceil((rl.resetAt - Date.now()) / 1000)
      return NextResponse.json(
        { error: "tooManyRequests", retryAfter: seconds },
        { status: 429, headers: { "Retry-After": String(seconds) } }
      )
    }

    const { phone, password } = await req.json()

    // 手机号格式校验（中国大陆手机号）
    if (typeof phone !== "string" || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: "invalidPhone" }, { status: 400 })
    }

    // 排除明显假号：全相同数字、全 0/1、测试号
    if (
      phone === "11111111111" ||
      phone === "00000000000" ||
      phone === "12345678901" ||
      /^1(\d)\1{9}$/.test(phone)
    ) {
      return NextResponse.json({ error: "invalidPhone" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, passwordHash: true },
    })
    if (!user) {
      return NextResponse.json({ error: "userNotFound" }, { status: 404 })
    }

    // 不可解绑：已绑定手机号则拒绝修改
    if (user.phone) {
      return NextResponse.json({ error: "phoneAlreadyBound" }, { status: 409 })
    }

    // 密码验证（无短信验证码，用当前密码确认身份）
    if (!user.passwordHash) {
      return NextResponse.json({ error: "setPasswordFirst" }, { status: 400 })
    }
    if (typeof password !== "string" || password.length === 0) {
      return NextResponse.json({ error: "invalidParams" }, { status: 400 })
    }
    const bcrypt = await import("bcryptjs")
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "currentPasswordWrong" }, { status: 401 })
    }

    // 唯一性：该手机号不能被其他账号占用
    const existing = await prisma.user.findUnique({ where: { phone } })
    if (existing && existing.id !== userId) {
      return NextResponse.json({ error: "phoneBound" }, { status: 409 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { phone },
    })

    return NextResponse.json({ success: true, phone })
  } catch (error) {
    console.error("Bind phone error:", error)
    return NextResponse.json({ error: "bindFailed" }, { status: 500 })
  }
}
