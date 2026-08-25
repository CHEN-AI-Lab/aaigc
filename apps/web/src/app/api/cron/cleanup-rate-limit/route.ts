import { type NextRequest, NextResponse } from 'next/server'
import { deleteExpiredRateLimitEntries } from 'shared/utils/rate-limit'

// Vercel Cron 每天 03:00 UTC 调用一次（vercel.json）。
// 鉴权：Vercel 会在 env 配置了 CRON_SECRET 的情况下自动附带
// `Authorization: Bearer <CRON_SECRET>` 头；未配置则全部拒绝（含 Vercel 自己），
// 即"安全默认"，必须在 Vercel Dashboard 设 CRON_SECRET 后才生效。
//
// 清理策略：删除 24 小时前开始窗口的行。所有业务路由的窗口都 <= 10 分钟，
// 24 小时已经是绝对安全的过期阈值，不会误删活跃条目。

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 }
    )
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const deleted = await deleteExpiredRateLimitEntries(ONE_DAY_MS)
  return NextResponse.json({
    ok: true,
    deleted,
    thresholdMs: ONE_DAY_MS,
    ranAt: new Date().toISOString(),
  })
}
