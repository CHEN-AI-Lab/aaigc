// CSRF 防护：校验 Origin/Referer 是否同源
// 用于 POST/PUT/PATCH/DELETE 等 mutating API 路由。
// NextAuth 的 /api/auth/* 路由有内置 CSRF token 机制，无需此校验。

type LikeRequest = { headers: Headers }

/**
 * 校验请求是否来自同源（Origin 或 Referer 与 host 匹配）。
 * 返回 true 表示安全，false 表示可能为 CSRF。
 *
 * 优先检查 Origin（现代浏览器在跨源请求中必发），
 * Origin 缺失时回退到 Referer。
 */
export function isSameOrigin(req: LikeRequest): boolean {
  const origin = req.headers.get('origin')
  const host = req.headers.get('host')

  if (!host) return false

  if (origin) {
    try {
      const url = new URL(origin)
      return url.host === host
    } catch {
      return false
    }
  }

  // Origin 缺失时回退到 Referer
  const referer = req.headers.get('referer')
  if (referer) {
    try {
      const url = new URL(referer)
      return url.host === host
    } catch {
      return false
    }
  }

  // 既无 Origin 也无 Referer：可能是非浏览器请求（curl/Postman）
  // 这类请求不携带 cookie，CSRF 不适用，但为安全起见拒绝
  return false
}
