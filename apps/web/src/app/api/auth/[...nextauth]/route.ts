import { handlers, runWithRequestCookie } from "@/auth"
import type { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  return runWithRequestCookie(req.headers.get("cookie") ?? "", () => handlers.GET(req))
}

export async function POST(req: NextRequest) {
  return runWithRequestCookie(req.headers.get("cookie") ?? "", () => handlers.POST(req))
}