import { handlers, runWithRequestCookie } from "@/auth"
import type { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  console.log("[link-account] route GET " + new URL(req.url).pathname)
  return runWithRequestCookie(req.headers.get("cookie") ?? "", () => handlers.GET(req))
}

export async function POST(req: NextRequest) {
  console.log("[link-account] route POST " + new URL(req.url).pathname)
  return runWithRequestCookie(req.headers.get("cookie") ?? "", () => handlers.POST(req))
}