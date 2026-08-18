import { NextResponse } from "next/server"
import { prisma } from "shared/utils/prisma"
import { auth } from "@/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "loginRequired" }, { status: 401 })
  }

  const { name } = await req.json()
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "invalidName" }, { status: 400 })
  }

  const trimmed = name.trim()
  if (trimmed.length > 50) {
    return NextResponse.json({ error: "nameTooLong" }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: trimmed },
  })

  return NextResponse.json({ ok: true })
}