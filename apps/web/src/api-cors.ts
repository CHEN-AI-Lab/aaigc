// ─────────────────────────────────────────────────────────────────────────────
// CORS 包装器（架构 §4.2.4 / K3）
//
// 为什么必须写在 route 层而不是 middleware：
//   apps/web/src/proxy.ts 的 matcher 是 `/((?!api|_next|_vercel|.*\..*).*)`，
//   **明确排除 /api**，任何写在 proxy.ts 里的 CORS 逻辑对 API 请求永远不会执行。
//
// 白名单来自**本站域名唯一真源** `shared/constants/domains`：
//   apiCorsOrigins() = API_CORS_ORIGINS（逗号分隔，空值 = 空数组）∪ 本站 origin
// 未命中白名单的请求**不下发 Access-Control-Allow-Origin**（禁止非空 fallback，SK-8）。
// 不设置 Access-Control-Allow-Credentials —— Bearer 通道不需要 cookie。
//
// 这里不直接读 process.env：域名与白名单的合并规则只准有一份实现。
//
// 覆盖范围说明：小程序 `wx.request` 与 CLI `fetch` 不发 Origin，不受 CORS 约束；
// 本包装器实际服务桌面端 WebView（Origin = tauri://localhost）与 App WebView。
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { apiCorsOrigins } from 'shared/constants/domains'

const ALLOWED_METHODS = 'GET,POST,PATCH,DELETE,OPTIONS'

const ALLOWED_HEADERS = [
  'authorization',
  'content-type',
  'accept',
  'accept-language',
  'x-aaigc-platform',
  'x-aaigc-project',
].join(',')

const MAX_AGE_SECONDS = '600'

/** 命中的白名单 Origin；未命中或请求不带 Origin 时返回 null（不下发 ACAO） */
function resolveAllowedOrigin(req: Request): string | null {
  const origin = req.headers.get('origin')
  if (!origin) return null
  return apiCorsOrigins().includes(origin) ? origin : null
}

function applyCorsHeaders(headers: Headers, allowedOrigin: string | null): void {
  // Vary 必须无条件声明：同一 URL 对不同 Origin 会返回不同的 ACAO，缓存需按 Origin 分片
  headers.append('Vary', 'Origin')
  if (allowedOrigin) headers.set('Access-Control-Allow-Origin', allowedOrigin)
}

/** 包装后的 handler 签名与原始 handler 一致（保留 Request / NextRequest 的具体类型） */
export function withCors<R extends Request>(
  handler: (req: R) => Response | Promise<Response>,
): (req: R) => Promise<Response> {
  return async (req: R): Promise<Response> => {
    const allowedOrigin = resolveAllowedOrigin(req)

    // 预检：不进入业务 handler
    if (req.method === 'OPTIONS') {
      const headers = new Headers()
      applyCorsHeaders(headers, allowedOrigin)
      headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS)
      headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS)
      headers.set('Access-Control-Max-Age', MAX_AGE_SECONDS)
      return new NextResponse(null, { status: 204, headers })
    }

    const response = await handler(req)
    applyCorsHeaders(response.headers, allowedOrigin)
    return response
  }
}
