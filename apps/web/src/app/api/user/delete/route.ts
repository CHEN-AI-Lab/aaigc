import { NextResponse } from "next/server"
import { prisma } from "shared/utils/prisma"
import { auth } from "@/auth"

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "loginRequired" }, { status: 401 })
  }

  const userId = session.user.id

  // Delete all related records first, then the user
  await prisma.$transaction([
    prisma.favorite.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    prisma.verificationCode.deleteMany({ where: { email: session.user.email } }),
    prisma.user.delete({ where: { id: userId } }),
  ])

  return NextResponse.json({ ok: true })
}