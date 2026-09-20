// ─────────────────────────────────────────────────────────────────────────────
// GET /api/user/export —— 账号数据导出（GDPR 风格）
//
// 鉴权：resolveAuth（Bearer 优先，回退 cookie）
// 只读接口，不做 CSRF 同源校验。
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from 'shared/utils/prisma'
import { resolveAuthResult } from '@/auth-guard'
import { withCors } from '@/api-cors'
import { errorResponse } from '@/api-response'

export const GET = withCors(async (req: NextRequest) => {
  const authResult = await resolveAuthResult(req)
  if (!authResult.ok) return errorResponse(authResult.code)
  const resolved = { session: authResult.session, mode: authResult.mode }

  const userId = resolved.session.user.id

  const [user, accounts, favorites] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, image: true, createdAt: true },
    }),
    prisma.account.findMany({
      where: { userId },
      select: { provider: true, type: true },
    }),
    prisma.favorite.findMany({
      where: { userId },
      select: { toolId: true, type: true, createdAt: true },
    }),
  ])

  if (!user) {
    return errorResponse('userNotFound')
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
      createdAt: user.createdAt,
    },
    accounts: accounts.map((a) => ({ provider: a.provider, type: a.type })),
    favorites: favorites.map((f) => ({
      type: f.type,
      id: f.toolId,
      savedAt: f.createdAt,
    })),
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="aaigc-export-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
})

export const OPTIONS = withCors(async () => new NextResponse(null, { status: 204 }))
