import createMiddleware from 'next-intl/middleware'
import { NextRequest } from 'next/server'
import { routing } from './i18n/routing'

// ─────────────────────────────────────────────────────────────────────────────
// 防护开关（运行时环境变量 CSP_STRICT）
//   - 未设置 / 'false'（默认）：快模式
//       脚本策略 = script-src 'self' 'unsafe-inline'
//       不读取 headers()、不生成 nonce → 页面保持「静态预渲染」，可走 CDN 缓存，首字节更快。
//       仍禁止从其他域名加载脚本，仅放行本站内联脚本（对零用户站点 XSS 风险≈0）。
//   - 'true'：强防护模式
//       每个请求生成一次性 nonce，脚本策略 = script-src 'self' 'nonce-xxx' 'strict-dynamic'
//       布局需读取 headers() 获取 nonce → 整棵路由树转为动态渲染（nonce 必需，代价是失去静态缓存）。
// 上线防护：部署平台把 CSP_STRICT 设为 'true' 并重新部署即可，无需改代码。
// ─────────────────────────────────────────────────────────────────────────────
const STRICT_CSP = process.env.CSP_STRICT === 'true'

function buildCsp(nonce: string | null): string {
  const scriptSrc = STRICT_CSP && nonce
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
    : "script-src 'self' 'unsafe-inline'"
  return [
    "default-src 'self'",
    scriptSrc,
    // 样式仍需 'unsafe-inline'（Next.js 运行时注入样式），这是 App Router 的已知限制
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

export function proxy(request: NextRequest) {
  // 仅在强防护模式下生成 nonce（每个请求一次性随机值）；快模式下不做任何按请求的工作
  const nonce = STRICT_CSP ? crypto.randomUUID().replace(/-/g, '') : null
  const csp = buildCsp(nonce)

  // 把 CSP（及可选的 x-nonce）注入请求头，供 Next.js 渲染时自动应用到框架脚本，
  // 也供布局读取后应用到自定义内联脚本（主题检测）。
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('Content-Security-Policy', csp)
  if (nonce) requestHeaders.set('x-nonce', nonce)

  // 用注入了 CSP 的请求头构造新请求交给 next-intl 中间件，
  // 保证后续路由渲染与布局都能读到该请求头。
  const intlRequest = new NextRequest(request, { headers: requestHeaders })
  const response = createMiddleware(routing)(intlRequest)

  // 响应也带上本请求的 CSP，供浏览器执行
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
