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
  const tx = [
      prisma.favorite.deleteMany({ where: { userId } }),
      prisma.session.deleteMany({ where: { userId } }),
      prisma.account.deleteMany({ where: { userId } }),
      ...(session.user.email ? [prisma.verificationCode.deleteMany({ where: { email: session.user.email } })] : []),
      prisma.user.delete({ where: { id: userId } }),
    ]
    await prisma.$transaction(tx)

  return NextResponse.json({ ok: true })
}